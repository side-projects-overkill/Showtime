'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/contexts/StorageContext';
import { useMedia } from '@/contexts/MediaContext';
import { FileItem } from '@/lib/storage/storage-adapter';
import { formatFileSize } from '@/lib/utils/media-utils';

/**
 * File browser component for navigating storage locations.
 * Allows users to browse directories and play video files.
 */
export default function MediaBrowser() {
    const { activeConnection, connections } = useStorage();
    const { setCurrentMedia } = useMedia();
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activeConnection) {
            loadFiles(currentPath);
        }
    }, [activeConnection, currentPath, connections]);

    const loadFiles = async (path: string) => {
        if (!activeConnection) return;

        setLoading(true);
        setError(null);

        try {
            // Get the storage config for this connection
            const connection = connections.find(c => c.id === activeConnection);

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            // Send config in header so server can recreate adapter if needed
            if (connection) {
                headers['X-Storage-Config'] = JSON.stringify(connection);
            }

            const response = await fetch(
                `/api/storage/browse?storageId=${activeConnection}&path=${encodeURIComponent(path)}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error('Failed to load files');
            }

            const data = await response.json();
            setFiles(data.files);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file: FileItem) => {
        if (file.type === 'directory') {
            setCurrentPath(file.path);
        } else if (file.isVideo) {
            setCurrentMedia(file);
        }
    };

    const goBack = () => {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        setCurrentPath('/' + parts.join('/'));
    };

    if (!activeConnection) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No storage connection selected</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <button
                    onClick={() => setCurrentPath('/')}
                    className="text-primary-400 hover:text-primary-300"
                >
                    Home
                </button>
                {currentPath.split('/').filter(Boolean).map((part, index, arr) => (
                    <React.Fragment key={index}>
                        <span className="text-gray-600">/</span>
                        <button
                            onClick={() => {
                                const newPath = '/' + arr.slice(0, index + 1).join('/');
                                setCurrentPath(newPath);
                            }}
                            className="text-primary-400 hover:text-primary-300"
                        >
                            {part}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Back button */}
            {currentPath !== '/' && (
                <button onClick={goBack} className="btn btn-ghost">
                    ← Back
                </button>
            )}

            {/* File list */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-gray-400">Loading...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
            ) : (
                <div className="grid gap-2">
                    {files.map((file) => (
                        <button
                            key={file.path}
                            onClick={() => handleFileClick(file)}
                            className="card card-hover flex items-center gap-4 p-4 text-left"
                        >
                            <div className="text-3xl">
                                {file.type === 'directory' ? '📁' : file.isVideo ? '🎬' : '📄'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                {file.size && (
                                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                                )}
                            </div>
                            {file.type === 'directory' && (
                                <div className="text-gray-500">→</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
