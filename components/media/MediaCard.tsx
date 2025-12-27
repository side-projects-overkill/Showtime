'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IndexedMedia } from '@/lib/db/types';

interface MediaCardProps {
    media: IndexedMedia & { episodeCount?: number };
}

/**
 * Card component for displaying media metadata.
 * Shows poster, title, rating, and other details.
 * Supports hover effects for quick actions.
 */
export default function MediaCard({ media }: MediaCardProps) {
    const posterUrl = media.posterPath || '/placeholder-poster.jpg';
    const title = media.title || media.filename;
    const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;

    return (
        <Link href={`/media/${media._id}`} className="group">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-800 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary-500/20">
                {/* Poster Image */}
                {media.posterPath ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-900">
                        <div className="text-6xl">{media.type === 'tv' ? '📺' : '🎬'}</div>
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2">{title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            {year && <span>{year}</span>}
                            {media.rating && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        ⭐ {media.rating.toFixed(1)}
                                    </span>
                                </>
                            )}
                            {media.type && (
                                <>
                                    <span>•</span>
                                    <span className="uppercase text-xs">{media.type}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Play Button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-full bg-primary-600/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary-500 transition-colors">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Rating Badge */}
                {media.rating && media.rating >= 7 && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-primary-600/90 backdrop-blur-sm text-xs font-bold">
                        {media.rating.toFixed(1)}
                    </div>
                )}

                {/* Episode Count Badge for TV Shows */}
                {media.type === 'tv' && media.episodeCount && media.episodeCount > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-dark-900/90 backdrop-blur-sm text-xs font-bold">
                        {media.episodeCount} Episodes
                    </div>
                )}

                {/* Metadata Source Badge */}
                {media.metadataSource && media.metadataSource !== 'parsed' && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-dark-900/80 backdrop-blur-sm text-xs font-medium uppercase">
                        {media.metadataSource}
                    </div>
                )}
            </div>
        </Link>
    );
}
