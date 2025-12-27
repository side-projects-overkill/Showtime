'use client';

import React, { useState, useEffect } from 'react';
import { parseFilename } from '@/lib/utils/media-utils';

interface TMDBSearchProps {
    filename: string;
    onSelect: (id: number, type: 'movie' | 'tv') => void;
}

/**
 * Component for searching and selecting metadata from TMDB.
 * Used for manually correcting or assigning metadata to files.
 */
export default function TMDBSearch({ filename, onSelect }: TMDBSearchProps) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');

    useEffect(() => {
        const { title } = parseFilename(filename);
        if (title) {
            searchTMDB(title);
        }
    }, [filename, searchType]);

    const searchTMDB = async (query: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/tmdb/search?query=${encodeURIComponent(query)}&type=${searchType}`
            );
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('TMDB search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    onClick={() => setSearchType('movie')}
                    className={`btn ${searchType === 'movie' ? 'btn-primary' : 'btn-ghost'}`}
                >
                    Movies
                </button>
                <button
                    onClick={() => setSearchType('tv')}
                    className={`btn ${searchType === 'tv' ? 'btn-primary' : 'btn-ghost'}`}
                >
                    TV Shows
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto scrollbar-hide">
                    {results.slice(0, 5).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id, searchType)}
                            className="card card-hover flex gap-4 p-3 text-left"
                        >
                            {item.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                    alt={item.title || item.name}
                                    className="w-12 h-18 object-cover rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.title || item.name}</p>
                                <p className="text-sm text-gray-400">
                                    {item.release_date || item.first_air_date} • ⭐ {item.vote_average?.toFixed(1)}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
