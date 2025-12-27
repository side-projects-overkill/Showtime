'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FileItem } from '@/lib/storage/storage-adapter';

/**
 * Extended FileItem with media-specific metadata.
 */
interface MediaItem extends FileItem {
    tmdbId?: number;
    tmdbType?: 'movie' | 'tv';
    metadata?: any;
}

/**
 * Interface definition for the Media Context.
 */
interface MediaContextType {
    currentMedia: MediaItem | null;
    playbackQueue: MediaItem[];
    setCurrentMedia: (media: MediaItem | null) => void;
    addToQueue: (media: MediaItem) => void;
    clearQueue: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

/**
 * Media Provider Component.
 * Manages global state for currently playing media and playback queue.
 */
export function MediaProvider({ children }: { children: ReactNode }) {
    const [currentMedia, setCurrentMediaState] = useState<MediaItem | null>(null);
    const [playbackQueue, setPlaybackQueue] = useState<MediaItem[]>([]);

    const setCurrentMedia = (media: MediaItem | null) => {
        setCurrentMediaState(media);
    };

    const addToQueue = (media: MediaItem) => {
        setPlaybackQueue((prev) => [...prev, media]);
    };

    const clearQueue = () => {
        setPlaybackQueue([]);
    };

    return (
        <MediaContext.Provider
            value={{
                currentMedia,
                playbackQueue,
                setCurrentMedia,
                addToQueue,
                clearQueue,
            }}
        >
            {children}
        </MediaContext.Provider>
    );
}

/**
 * Hook to access the Media Context.
 * @returns The context value (current media, queue, actions)
 * @throws Error if used outside of MediaProvider
 */
export function useMedia() {
    const context = useContext(MediaContext);
    if (!context) {
        throw new Error('useMedia must be used within MediaProvider');
    }
    return context;
}
