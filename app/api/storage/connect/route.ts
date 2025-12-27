import { NextRequest, NextResponse } from 'next/server';
import { storageManager } from '@/lib/storage/storage-manager';
import { StorageConfig } from '@/lib/storage/storage-adapter';
import { getStorageCollection } from '@/lib/db/mongodb';
import { LibraryIndexer } from '@/lib/indexing/library-indexer';

/**
 * Handles POST requests to create a new storage connection.
 * Tests the connection before saving to the database.
 * @param request The API request object containing StorageConfig
 * @returns JSON response indicating success or failure
 */
export async function POST(request: NextRequest) {
    try {
        const config: StorageConfig = await request.json();

        // Create and test connection
        const adapter = storageManager.createAdapter(config);
        await adapter.connect();

        // Save to MongoDB (exclude _id to avoid immutable field error)
        const storageCollection = await getStorageCollection();
        const { _id, ...configWithoutId } = config as any;
        await storageCollection.updateOne(
            { id: config.id },
            { $set: { ...configWithoutId, enabled: config.enabled !== false } },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Storage connected successfully',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to connect' },
            { status: 500 }
        );
    }
}

/**
 * Handles DELETE requests to remove a storage connection.
 * Disconnects the adapter and removes configuration from the database.
 * Also cleans up all indexed media associated with the storage.
 * @param request The API request object
 * @returns JSON response indicating success or failure
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get('id');

        if (!storageId) {
            return NextResponse.json(
                { error: 'Storage ID is required' },
                { status: 400 }
            );
        }

        storageManager.removeAdapter(storageId);

        // Remove from MongoDB
        const storageCollection = await getStorageCollection();
        await storageCollection.deleteOne({ id: storageId });

        // Remove all indexed media for this storage
        const indexer = new LibraryIndexer();
        const removedCount = await indexer.removeStorageMedia(storageId);
        console.log(`[Storage] Removed storage ${storageId} and ${removedCount} associated media items`);

        return NextResponse.json({
            success: true,
            message: 'Storage disconnected',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to disconnect' },
            { status: 500 }
        );
    }
}
