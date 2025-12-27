'use client';

import React, { useState, useEffect } from 'react';
import { StorageConfig } from '@/lib/storage/storage-adapter';

/**
 * Read-Only Settings Page Component.
 * Displays loaded storage connections from YAML config (no editing allowed).
 */
export default function SettingsPage() {
    const [connections, setConnections] = useState<StorageConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [indexing, setIndexing] = useState<string | null>(null);
    const [indexResults, setIndexResults] = useState<Record<string, string>>({});

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            const response = await fetch('/api/storage/list');
            const data = await response.json();

            if (data.success) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIndexStorage = async (id: string, forceReindex: boolean = false) => {
        setIndexing(id);
        setIndexResults({
            ...indexResults,
            [id]: forceReindex ? 'Re-indexing...' : 'Indexing...'
        });

        try {
            const response = await fetch('/api/library/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storageId: id, forceReindex }),
            });

            const data = await response.json();

            if (data.success) {
                setIndexResults({
                    ...indexResults,
                    [id]: data.message || `✓ Indexed ${data.indexed} files`,
                });
            } else {
                setIndexResults({
                    ...indexResults,
                    [id]: `✗ ${data.error}`,
                });
            }
        } catch (error: any) {
            setIndexResults({
                ...indexResults,
                [id]: `✗ ${error.message}`,
            });
        } finally {
            setIndexing(null);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
                    <p className="text-gray-400 text-sm">
                        🔒 Storage connections are configured via <code className="bg-dark-800 px-2 py-1 rounded text-primary-400">storage.config.yaml</code>
                    </p>
                </div>

                {/* Storage Connections (Read-Only) */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Storage Connections</h2>

                    {loading ? (
                        <div className="card text-center py-8">
                            <p className="text-gray-400">Loading connections...</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="card text-center py-8">
                            <p className="text-gray-400 mb-4">No storage connections configured</p>
                            <p className="text-sm text-gray-500">
                                Edit <code className="bg-dark-800 px-2 py-1 rounded">storage.config.yaml</code> to add connections
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {connections.map((conn) => (
                                <div key={conn.id} className="card">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{conn.name}</h3>
                                            <p className="text-sm text-gray-400">
                                                {conn.type.toUpperCase()} • {conn.host}
                                                {conn.port && `:${conn.port}`}
                                                {conn.basePath && ` • ${conn.basePath}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${conn.enabled !== false
                                                    ? 'bg-green-900/30 text-green-400'
                                                    : 'bg-gray-800 text-gray-500'
                                                }`}>
                                                {conn.enabled !== false ? '✓ Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>

                                    {conn.enabled !== false && (
                                        <div>
                                            <button
                                                onClick={(e) => handleIndexStorage(conn.id, e.shiftKey)}
                                                disabled={indexing === conn.id}
                                                className="btn btn-primary"
                                                title="Click to index new files, Shift+Click to re-index all"
                                            >
                                                {indexing === conn.id ? '⏳ Indexing...' : '🔄 Index Library'}
                                            </button>

                                            {indexResults[conn.id] && (
                                                <div className="mt-3 text-sm text-gray-400">
                                                    {indexResults[conn.id]}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Configuration Instructions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Managing Storage Connections</h2>
                    <div className="card">
                        <div className="space-y-4 text-sm">
                            <div>
                                <h3 className="font-semibold text-primary-400 mb-2">📝 How to configure storage:</h3>
                                <ol className="list-decimal list-inside space-y-2 text-gray-400">
                                    <li>Copy <code className="bg-dark-800 px-2 py-1 rounded">storage.config.example.yaml</code> to <code className="bg-dark-800 px-2 py-1 rounded">storage.config.yaml</code></li>
                                    <li>Edit the YAML file with your storage connection details</li>
                                    <li>Restart the application to load the new configuration</li>
                                </ol>
                            </div>

                            <div>
                                <h3 className="font-semibold text-primary-400 mb-2">🔐 Security Benefits:</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    <li>Credentials stored server-side only (not in database)</li>
                                    <li>Configuration file excluded from version control</li>
                                    <li>No public API endpoints to modify storage settings</li>
                                    <li>Perfect for read-only public deployments</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metadata APIs */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Metadata APIs</h2>
                    <div className="card">
                        <h3 className="font-bold mb-2">TMDB Integration</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Get rich metadata for your media library from The Movie Database.
                        </p>
                        <a
                            href="https://www.themoviedb.org/settings/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                            Get your TMDB API key →
                        </a>

                        <h3 className="font-bold mb-2 mt-6">OMDB Integration (Optional)</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Fallback metadata source for movies.
                        </p>
                        <a
                            href="http://www.omdbapi.com/apikey.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                            Get your OMDB API key →
                        </a>

                        <h3 className="font-bold mb-2 mt-6">TVDB Integration (Optional)</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Best metadata source for TV shows.
                        </p>
                        <a
                            href="https://thetvdb.com/api-information"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                            Get your TVDB API key →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
