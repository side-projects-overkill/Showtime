'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/media/VideoPlayer';
import { IndexedMedia } from '@/lib/db/types';
import { useStorage } from '@/contexts/StorageContext';

/**
 * Media Detail Page Component.
 * Displays rich metadata for a specific media item (Movie or TV Show).
 * Handles episode selection for TV shows and playback initiation.
 */
export default function MediaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { connections } = useStorage();
    const [media, setMedia] = useState<IndexedMedia & { episodes?: IndexedMedia[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<IndexedMedia | null>(null);

    useEffect(() => {
        if (params.id) {
            loadMedia(params.id as string);
        }
    }, [params.id]);

    const loadMedia = async (id: string) => {
        try {
            const response = await fetch(`/api/library/media/${id}`);
            const data = await response.json();

            if (data.success) {
                setMedia(data.media);
                // If it's a TV show with episodes, select first episode by default
                if (data.media.episodes && data.media.episodes.length > 0) {
                    setSelectedEpisode(data.media.episodes[0]);
                } else {
                    setSelectedEpisode(data.media);
                }
            }
        } catch (error) {
            console.error('Failed to load media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = () => {
        setPlaying(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!media) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Media not found</h1>
                    <button onClick={() => router.back()} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isTVShow = media.type === 'tv' && media.episodes && media.episodes.length > 0;

    return (
        <div className="min-h-screen bg-dark-950">
            {/* Backdrop */}
            {media.backdropPath && (
                <div className="relative h-[30vh] sm:h-[40vh] md:h-[60vh] w-full">
                    <img
                        src={media.backdropPath}
                        alt={media.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
                </div>
            )}

            <div className="container mx-auto px-4 -mt-16 sm:-mt-24 md:-mt-40 relative z-10 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Poster */}
                    <div className="md:col-span-1">
                        {media.posterPath ? (
                            <img
                                src={media.posterPath}
                                alt={media.title}
                                className="w-48 sm:w-64 md:w-full mx-auto md:mx-0 rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="aspect-[2/3] bg-dark-800 rounded-lg flex items-center justify-center">
                                <div className="text-8xl">{media.type === 'tv' ? '📺' : '🎬'}</div>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 leading-tight">
                                {media.title}
                            </h1>
                            {media.originalTitle && media.originalTitle !== media.title && (
                                <p className="text-xl text-gray-400">{media.originalTitle}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
                            {media.releaseDate && (
                                <span className="px-3 py-1 bg-dark-800 rounded-full">
                                    {new Date(media.releaseDate).getFullYear()}
                                </span>
                            )}
                            {media.rating && (
                                <span className="px-3 py-1 bg-primary-600/20 rounded-full">
                                    ⭐ {media.rating.toFixed(1)}
                                </span>
                            )}
                            {media.runtime && (
                                <span className="px-3 py-1 bg-dark-800 rounded-full">
                                    {media.runtime} min
                                </span>
                            )}
                            {media.type && (
                                <span className="px-3 py-1 bg-dark-800 rounded-full uppercase">
                                    {media.type}
                                </span>
                            )}
                            {isTVShow && (
                                <span className="px-3 py-1 bg-primary-600/20 rounded-full">
                                    {media.episodes!.length} Episodes
                                </span>
                            )}
                        </div>

                        {media.genres && media.genres.length > 0 && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                {media.genres.map((genre) => (
                                    <span key={genre} className="px-4 py-2 bg-dark-800/50 rounded-lg text-sm">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {media.overview && (
                            <div className="text-center md:text-left">
                                <h2 className="text-xl md:text-2xl font-bold mb-3">Overview</h2>
                                <p className="text-gray-300 leading-relaxed">{media.overview}</p>
                            </div>
                        )}

                        {/* Episodes List for TV Shows */}
                        {isTVShow && (
                            <div>
                                <h2 className="text-2xl font-bold mb-3">Episodes</h2>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {media.episodes!.map((episode, index) => (
                                        <div
                                            key={episode._id}
                                            onClick={() => setSelectedEpisode(episode)}
                                            className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedEpisode?._id === episode._id
                                                ? 'bg-primary-600/20 border border-primary-500'
                                                : 'bg-dark-800/30 hover:bg-dark-800/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-bold">
                                                        {episode.seasonNumber && episode.episodeNumber
                                                            ? `S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`
                                                            : `Episode ${index + 1}`}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 mt-1">{episode.filename}</p>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {(episode.size / 1024 / 1024 / 1024).toFixed(2)} GB
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Play Button */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handlePlay}
                                className="btn btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 flex-1 sm:flex-none justify-center"
                                disabled={!selectedEpisode}
                            >
                                ▶️ Play {isTVShow && selectedEpisode && `Episode`}
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="btn btn-secondary px-6 py-3 sm:px-8 sm:py-4 flex-1 sm:flex-none justify-center"
                            >
                                ← Back
                            </button>
                        </div>

                        {/* File Info */}
                        {selectedEpisode && (
                            <div className="card bg-dark-800/30">
                                <h3 className="font-bold mb-3">File Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Filename:</span>
                                        <span className="font-mono">{selectedEpisode.filename}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Storage:</span>
                                        <span>{selectedEpisode.storageName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Size:</span>
                                        <span>{(selectedEpisode.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                                    </div>
                                    {media.metadataSource && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Metadata:</span>
                                            <span className="uppercase">{media.metadataSource}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Player Modal */}
                {playing && selectedEpisode && (
                    <div className="fixed inset-0 bg-black/98 z-50 flex flex-col md:items-center md:justify-center p-2 sm:p-4 md:p-8">
                        <div className="w-full max-w-6xl flex flex-col h-full md:h-auto">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => setPlaying(false)}
                                    className="p-2 text-white/70 hover:text-white transition-colors"
                                >
                                    <span className="text-3xl md:text-2xl">✕</span>
                                </button>
                            </div>
                            <div className="flex-1 flex items-center">
                                <VideoPlayer
                                    file={{ name: selectedEpisode.filename, path: selectedEpisode.path, type: 'file' }}
                                    storageId={selectedEpisode.storageId}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
