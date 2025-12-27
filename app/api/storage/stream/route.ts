import { NextRequest, NextResponse } from 'next/server';
import { storageManager } from '@/lib/storage/storage-manager';
import { getMimeType } from '@/lib/utils/media-utils';
import { getStorageCollection } from '@/lib/db/mongodb';
import { spawn } from 'child_process';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to stream media files.
 * Supports Range headers for partial content buffering.
 * Automatically reconnects storage adapter if missing from memory.
 * @param request The API request object
 * @returns Response with file stream or JSON error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get('storageId');
        const path = searchParams.get('path');

        if (!storageId || !path) {
            return NextResponse.json(
                { error: 'Storage ID and path are required' },
                { status: 400 }
            );
        }

        let adapter = storageManager.getAdapter(storageId);

        // Reconnect if adapter is missing (e.g., server restart or HMR)
        if (!adapter) {
            console.log(`[Stream] Adapter not found for ${storageId}, attempting to reconnect...`);
            const storageCollection = await getStorageCollection();
            const storage = await storageCollection.findOne({ id: storageId });

            if (!storage) {
                return NextResponse.json(
                    { error: 'Storage not found in database' },
                    { status: 404 }
                );
            }

            try {
                adapter = storageManager.createAdapter(storage as any);
                await adapter.connect();
                console.log(`[Stream] Reconnected adapter for ${storage.name}`);
            } catch (reconnectError: any) {
                console.error(`[Stream] Reconnection failed:`, reconnectError);
                return NextResponse.json(
                    { error: `Failed to reconnect storage: ${reconnectError.message}` },
                    { status: 500 }
                );
            }
        }

        const filename = path.split('/').pop() || 'video.mp4';
        const contentType = getMimeType(filename);
        const fileSize = await adapter.getFileSize(path);

        // Check if we should transcode (non-MP4 files)
        const isMp4 = filename.toLowerCase().endsWith('.mp4') || filename.toLowerCase().endsWith('.m4v');

        if (!isMp4) {
            console.log(`[Stream] Transcoding ${filename} to fragmented MP4...`);
            const fileStream = await adapter.getFileStream(path);

            // Spawn ffmpeg for remuxing/transcoding
            // Using libx264 ultrafast to ensure compatibility (copy can fail with some MKV containers)
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
                '-c:a', 'aac',
                '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
                '-f', 'mp4',
                'pipe:1'
            ]);

            // Pipe source to ffmpeg
            try {
                const nodeStream = Readable.fromWeb(fileStream as any);
                nodeStream.pipe(ffmpeg.stdin);

                // Handle stdin errors (like if ffmpeg exits early)
                nodeStream.on('error', (e) => {
                    ffmpeg.kill('SIGKILL');
                });
                ffmpeg.stdin.on('error', (e) => {
                    // This often happens when ffmpeg closes (e.g. invalid input or finished)
                });
            } catch (e) {
                console.error('[Stream] Error piping stream:', e);
                ffmpeg.kill('SIGKILL');
            }

            ffmpeg.on('error', (err) => {
                console.error('[Stream] FFmpeg spawn error:', err);
            });

            ffmpeg.on('exit', (code, signal) => {
                if (code !== 0) {
                    console.log(`[Stream] FFmpeg exited with code ${code} signal ${signal}`);
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                // Log last few lines of error or specific errors
                // Keeping it brief to avoid flooding logs, but enough to debug
                const msg = data.toString();
                if (msg.includes('Error') || msg.includes('Invalid')) {
                    console.error('[Stream] FFmpeg stderr:', msg);
                }
            });

            // Return the ffmpeg stdout as response
            // We use Readable.toWeb if available to be polite to Next.js types, 
            // though it usually accepts Node streams too.
            const outStream = (Readable as any).toWeb ? (Readable as any).toWeb(ffmpeg.stdout) : ffmpeg.stdout;

            return new NextResponse(outStream as any, {
                headers: {
                    'Content-Type': 'video/mp4',
                    // No Content-Length for chunked stream
                },
            });
        }

        // Standard Range handling for MP4s
        const range = request.headers.get('range');

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const stream = await adapter.getFileStream(path, { start, end });

            return new NextResponse(stream, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': contentType,
                },
            });
        } else {
            const stream = await adapter.getFileStream(path);
            return new NextResponse(stream, {
                headers: {
                    'Content-Length': fileSize.toString(),
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                },
            });
        }
    } catch (error: any) {
        console.error('Streaming error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to stream file' },
            { status: 500 }
        );
    }
}
