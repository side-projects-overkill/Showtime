'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'plyr/dist/plyr.css';
import { FileItem } from '@/lib/storage/storage-adapter';
import { getMimeType } from '@/lib/utils/media-utils';

const Plyr = dynamic(() => import('plyr-react'), { ssr: false });

interface VideoPlayerProps {
    file: FileItem;
    storageId: string;
}

/**
 * Wraps the Plyr video player for streaming content.
 * Handles dynamic import for SSR compatibility and sets up player options.
 */
export default function VideoPlayer({ file, storageId }: VideoPlayerProps) {
    const videoSrc = `/api/storage/stream?storageId=${storageId}&path=${encodeURIComponent(file.path)}`;
    // Since we auto-transcode everything to MP4 on the backend, we tell the player to expect MP4
    // This trick ensures Plyr/Browser doesn't reject the source based on the original file extension (e.g. .mkv)
    const mimeType = 'video/mp4';

    return (
        <div className="w-full rounded-xl overflow-hidden shadow-2xl bg-black aspect-video">
            <Plyr
                source={{
                    type: 'video',
                    title: file.name,
                    sources: [
                        {
                            src: videoSrc,
                            type: mimeType,
                        },
                    ],
                }}
                options={{
                    controls: [
                        'play-large',
                        'play',
                        'progress',
                        'current-time',
                        'mute',
                        'volume',
                        'captions',
                        'settings',
                        'pip',
                        'airplay',
                        'fullscreen',
                    ],
                    settings: ['captions', 'quality', 'speed', 'loop'],
                    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2, 4] },
                    tooltips: { controls: true, seek: true },
                    displayDuration: true,
                    invertTime: false,
                    toggleInvert: true,
                    ratio: '16:9',
                }}
            />
            <style jsx global>{`
                .plyr {
                    --plyr-color-main: #3b82f6; /* Modern Blue */
                    border-radius: 12px;
                }
                .plyr--full-ui {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
}
