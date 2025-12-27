'use client';

import React, { useState, useEffect } from 'react';
import MediaCard from '@/components/media/MediaCard';
import { IndexedMedia } from '@/lib/db/types';
import Link from 'next/link';

/**
 * Library Page Component.
 * Displays indexed media content with filtering and search capabilities.
 * Fetches data from the local database API.
 */
export default function LibraryPage() {
    const [media, setMedia] = useState<IndexedMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ total: 0, movies: 0, tvShows: 0 });

    useEffect(() => {
        loadLibrary();
        loadStats();
    }, [filter, search]);

    const loadLibrary = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: filter,
                limit: '100',
            });

            if (search) {
                params.append('search', search);
            }

            const response = await fetch(`/api/library/media?${params}`);
            const data = await response.json();

            if (data.success) {
                setMedia(data.media);
            }
        } catch (error) {
            console.error('Failed to load library:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch('/api/library/index');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient mb-2">My Library</h1>
                        <p className="text-gray-400">
                            {stats.total} titles • {stats.movies} movies • {stats.tvShows} TV shows
                        </p>
                    </div>
                    <Link href="/settings" className="btn btn-secondary">
                        ⚙️ Settings
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="Search library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input flex-1"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('movie')}
                            className={`btn ${filter === 'movie' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            Movies
                        </button>
                        <button
                            onClick={() => setFilter('tv')}
                            className={`btn ${filter === 'tv' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            TV Shows
                        </button>
                    </div>
                </div>

                {/* Media Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <p className="mt-4 text-gray-400">Loading library...</p>
                    </div>
                ) : media.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-2xl font-bold mb-2">No media found</h2>
                        <p className="text-gray-400 mb-6">
                            {search ? 'Try a different search term' : 'Add storage connections and index your drives'}
                        </p>
                        <Link href="/settings" className="btn btn-primary">
                            Go to Settings
                        </Link>
                    </div>
                ) : (
                    <div className="media-grid">
                        {media.map((item) => (
                            <MediaCard key={item._id} media={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
