'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageConfig } from '@/lib/storage/storage-adapter';

/**
 * Interface definition for the Storage Context.
 */
interface StorageContextType {
    /** List of all configured storage connections */
    connections: StorageConfig[];
    /** Adds a new storage connection */
    addConnection: (config: StorageConfig) => Promise<void>;
    /** Removes a storage connection by ID */
    removeConnection: (id: string) => Promise<void>;
    /** ID of the currently active storage connection */
    activeConnection: string | null;
    /** Sets the active storage connection */
    setActiveConnection: (id: string | null) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

/**
 * Storage Provider Component.
 * Manages storage connections, persistence to MongoDB, and connection state.
 */
export function StorageProvider({ children }: { children: React.ReactNode }) {
    const [connections, setConnections] = useState<StorageConfig[]>([]);
    const [activeConnection, setActiveConnection] = useState<string | null>(null);

    // Load connections from YAML config on mount
    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            // Load connection list (without passwords)
            const response = await fetch('/api/storage/list');
            const data = await response.json();

            if (data.success) {
                setConnections(data.connections);
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
        }
    };

    const addConnection = async (config: StorageConfig) => {
        try {
            // Add to MongoDB via API
            const response = await fetch('/api/storage/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to connect');
            }

            // Reload connections from MongoDB
            await loadConnections();
        } catch (error) {
            console.error('Failed to add connection:', error);
            throw error;
        }
    };

    const removeConnection = async (id: string) => {
        try {
            // Remove from MongoDB via API
            await fetch(`/api/storage/connect?id=${id}`, {
                method: 'DELETE',
            });

            // Reload connections from MongoDB
            await loadConnections();

            if (activeConnection === id) {
                setActiveConnection(null);
            }
        } catch (error) {
            console.error('Failed to remove connection:', error);
        }
    };

    return (
        <StorageContext.Provider
            value={{
                connections,
                addConnection,
                removeConnection,
                activeConnection,
                setActiveConnection,
            }}
        >
            {children}
        </StorageContext.Provider>
    );
}

/**
 * Hook to access the Storage Context.
 * @returns The context value (connections, actions)
 * @throws Error if used outside of StorageProvider
 */
export function useStorage() {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within StorageProvider');
    }
    return context;
}
