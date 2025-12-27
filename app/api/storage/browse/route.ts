import { NextRequest, NextResponse } from 'next/server';
import { storageManager } from '@/lib/storage/storage-manager';
import { StorageConfig } from '@/lib/storage/storage-adapter';

/**
 * Handles GET requests to browse storage directories.
 * Lists files and directories in the specified path.
 * @param request The API request object
 * @returns JSON response containing list of files
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get('storageId');
        const path = searchParams.get('path') || '/';

        if (!storageId) {
            return NextResponse.json(
                { error: 'Storage ID is required' },
                { status: 400 }
            );
        }

        let adapter = storageManager.getAdapter(storageId);

        // If adapter not found, try to recreate it from the request
        // This handles cases where the server restarted or storage manager was cleared
        if (!adapter) {
            const configHeader = request.headers.get('X-Storage-Config');
            if (configHeader) {
                try {
                    const config: StorageConfig = JSON.parse(configHeader);
                    adapter = storageManager.createAdapter(config);
                    await adapter.connect();
                } catch (error) {
                    console.error('Failed to recreate adapter:', error);
                }
            }
        }

        if (!adapter) {
            return NextResponse.json(
                { error: 'Storage not found or not connected' },
                { status: 404 }
            );
        }

        const files = await adapter.listFiles(path);

        return NextResponse.json({
            success: true,
            path,
            files,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to browse storage' },
            { status: 500 }
        );
    }
}
