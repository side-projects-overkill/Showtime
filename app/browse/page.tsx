'use client';

import React from 'react';
import MediaBrowser from '@/components/media/MediaBrowser';
import { useStorage } from '@/contexts/StorageContext';
import Link from 'next/link';

/**
 * Browse Page Component.
 * Allows users to browse files in connected storage drives.
 * Integration point for the MediaBrowser component.
 */
export default function BrowsePage() {
    const { connections, activeConnection, setActiveConnection } = useStorage();

    return (
        <div className="min-h-screen bg-dark-950">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gradient">Browse Media</h1>
                    <Link href="/settings" className="btn btn-secondary">
                        ⚙️ Settings
                    </Link>
                </div>

                {/* Storage Selector */}
                {connections.length > 0 ? (
                    <div className="mb-8">
                        <label className="block text-sm font-medium mb-2">Select Storage</label>
                        <select
                            className="input max-w-md"
                            value={activeConnection || ''}
                            onChange={(e) => setActiveConnection(e.target.value)}
                        >
                            <option value="">-- Select a storage --</option>
                            {connections.map((conn) => (
                                <option key={conn.id} value={conn.id}>
                                    {conn.name} ({conn.type.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <p className="text-gray-400 mb-4">No storage connections configured</p>
                        <Link href="/settings" className="btn btn-primary">
                            Add Storage Connection
                        </Link>
                    </div>
                )}

                {/* Media Browser */}
                {activeConnection && <MediaBrowser />}
            </div>
        </div>
    );
}
