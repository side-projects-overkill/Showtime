'use client';

import React, { useState } from 'react';
import { useMedia } from '@/contexts/MediaContext';
import { useStorage } from '@/contexts/StorageContext';
import VideoPlayer from '@/components/media/VideoPlayer';
import TMDBSearch from '@/components/media/TMDBSearch';
import Link from 'next/link';

/**
 * Watch Page Component.
 * The video player interface with metadata display.
 * Allows searching for correct metadata if auto-detection fails.
 */
export default function WatchPage() {
    const { currentMedia } = useMedia();
    const { activeConnection } = useStorage();
    const [metadata, setMetadata] = useState<any>(null);
    const [showSearch, setShowSearch] = useState(true);

    const handleMetadataSelect = async (id: number, type: 'movie' | 'tv') => {
        try {
            const response = await fetch(`/api/tmdb/metadata?id=${id}&type=${type}`);
            const data = await response.json();
            setMetadata(data.metadata);
            setShowSearch(false);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    };

    if (!currentMedia || !activeConnection) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">No media selected</p>
                    <Link href="/browse" className="btn btn-primary">
                        Browse Media
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <div className="container mx-auto px-4 py-8">
                <Link href="/browse" className="btn btn-ghost mb-4">
                    ← Back to Browse
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Video Player */}
                    <div className="lg:col-span-2 space-y-4">
                        <VideoPlayer file={currentMedia} storageId={activeConnection} />

                        <div className="card">
                            <h2 className="text-2xl font-bold mb-2">{currentMedia.name}</h2>
                            {metadata && (
                                <div className="space-y-2 text-gray-300">
                                    <p className="text-lg">{metadata.title || metadata.name}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span>⭐ {metadata.vote_average?.toFixed(1)}</span>
                                        <span>{metadata.release_date || metadata.first_air_date}</span>
                                        {metadata.runtime && <span>{metadata.runtime} min</span>}
                                    </div>
                                    <p className="text-gray-400 mt-4">{metadata.overview}</p>
                                    {metadata.genres && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {metadata.genres.map((genre: any) => (
                                                <span
                                                    key={genre.id}
                                                    className="px-3 py-1 bg-primary-500/20 rounded-full text-sm border border-primary-500/30"
                                                >
                                                    {genre.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="space-y-4">
                        {metadata?.poster_path && (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${metadata.poster_path}`}
                                alt={metadata.title || metadata.name}
                                className="w-full rounded-lg shadow-2xl"
                            />
                        )}

                        {showSearch && (
                            <div className="card">
                                <h3 className="text-lg font-bold mb-4">Find Metadata</h3>
                                <TMDBSearch
                                    filename={currentMedia.name}
                                    onSelect={handleMetadataSelect}
                                />
                            </div>
                        )}

                        {metadata && (
                            <button
                                onClick={() => setShowSearch(true)}
                                className="btn btn-ghost w-full"
                            >
                                Search Different Title
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
