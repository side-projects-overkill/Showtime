import { NextRequest, NextResponse } from 'next/server';
import { LibraryIndexer } from '@/lib/indexing/library-indexer';
import { storageManager } from '@/lib/storage/storage-manager';
import { getStorageConfigById } from '@/lib/config/storage-config';

/**
 * Handles POST requests to trigger storage indexing.
 * Scans files, fetches metadata, and updates the database.
 * @param request The API request object
 * @returns JSON response with indexing results
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { storageId, forceReindex = false } = body;

        if (!storageId) {
            return NextResponse.json(
                { error: 'Storage ID is required' },
                { status: 400 }
            );
        }

        // Get storage connection from YAML config
        const storage = await getStorageConfigById(storageId);

        if (!storage) {
            return NextResponse.json(
                { error: 'Storage not found in configuration' },
                { status: 404 }
            );
        }

        // Get adapter (or create if not found)
        let adapter = storageManager.getAdapter(storageId);
        if (!adapter) {
            console.log(`[Index] Adapter not found for ${storageId}, creating...`);

            // Try to create and connect
            try {
                adapter = storageManager.createAdapter(storage);
                await adapter.connect();
                console.log(`[Index] Successfully connected adapter for ${storage.name}`);
            } catch (reconnectError) {
                console.error(`[Index] Failed to connect:`, reconnectError);
                return NextResponse.json(
                    { error: 'Storage adapter connection failed. Please check your storage configuration.' },
                    { status: 500 }
                );
            }
        }

        // Index the storage
        const indexer = new LibraryIndexer();
        const indexed = await indexer.indexStorage(
            storageId,
            storage.name,
            adapter,
            forceReindex
        );

        return NextResponse.json({
            success: true,
            indexed,
            message: forceReindex
                ? `Re-indexed ${indexed} files`
                : `Indexed ${indexed} new files`,
        });
    } catch (error: any) {
        console.error('Indexing error:', error);
        return NextResponse.json(
            { error: error.message || 'Indexing failed' },
            { status: 500 }
        );
    }
}

// Get indexing progress (for future real-time updates)
/**
 * Handles GET requests to retrieve library statistics.
 * returns counts for movies, tv shows, and total files.
 * @param request The API request object
 * @returns JSON response with library stats
 */
export async function GET(request: NextRequest) {
    try {
        const indexer = new LibraryIndexer();
        const stats = await indexer.getLibraryStats();

        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to get stats' },
            { status: 500 }
        );
    }
}
