import { IStorageAdapter } from '../storage/storage-adapter';
import { getMediaCollection } from '../db/mongodb';
import { IndexedMedia } from '../db/types';
import { MetadataAggregator } from '../metadata/metadata-aggregator';
import { isVideoFile } from '../utils/media-utils';

export class LibraryIndexer {
    private metadataAggregator = new MetadataAggregator();

    async indexStorage(
        storageId: string,
        storageName: string,
        adapter: IStorageAdapter,
        forceReindex: boolean = false,
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<number> {
        const mediaCollection = await getMediaCollection();
        let indexed = 0;

        // If force re-indexing, delete all existing entries for this storage first
        if (forceReindex) {
            console.log(`[Indexer] Force re-index: Removing all existing entries for storage ${storageId}`);
            const deleteResult = await mediaCollection.deleteMany({ storageId });
            console.log(`[Indexer] Removed ${deleteResult.deletedCount} existing entries`);
        }

        // Recursively scan all files
        const allFiles = await this.scanRecursive(adapter, '/', onProgress);

        // Filter video files only
        const videoFiles = allFiles.filter(f => isVideoFile(f.name));

        // Track all current file paths for cleanup later
        const currentFilePaths = new Set(videoFiles.map(f => f.path));

        for (let i = 0; i < videoFiles.length; i++) {
            const file = videoFiles[i];

            if (onProgress) {
                onProgress(i + 1, videoFiles.length, file.name);
            }

            try {
                // Check if already indexed (only relevant if not force re-indexing)
                const existing = !forceReindex ? await mediaCollection.findOne({
                    storageId,
                    path: file.path,
                }) : null;

                if (existing && !forceReindex) {
                    // Update size if changed
                    if (existing.size !== file.size) {
                        await mediaCollection.updateOne(
                            { _id: existing._id },
                            { $set: { size: file.size } }
                        );
                    }
                    continue;
                }

                // Fetch metadata
                const metadata = await this.metadataAggregator.fetchMetadata(file.name);

                // Create indexed media entry
                const indexedMedia: Partial<IndexedMedia> = {
                    filename: file.name,
                    path: file.path,
                    storageId,
                    storageName,
                    size: file.size || 0,
                    ...metadata,
                    title: metadata.title || file.name,
                    indexed: new Date(),
                    enabled: true,
                };

                if (existing) {
                    // Update existing entry
                    await mediaCollection.updateOne(
                        { _id: existing._id },
                        { $set: indexedMedia }
                    );
                } else {
                    // Insert new entry (remove _id if present)
                    const { _id, ...mediaToInsert } = indexedMedia as any;
                    await mediaCollection.insertOne(mediaToInsert);
                }

                indexed++;
            } catch (error) {
                console.error(`Failed to index ${file.name}:`, error);
            }
        }

        // Remove files that no longer exist (only if not force re-indexing with full deletion)
        if (!forceReindex) {
            console.log(`[Indexer] Checking for deleted files...`);
            const allStorageEntries = await mediaCollection.find({ storageId }).toArray();
            const deletedFiles = allStorageEntries.filter(entry => !currentFilePaths.has(entry.path));

            if (deletedFiles.length > 0) {
                console.log(`[Indexer] Removing ${deletedFiles.length} deleted files from database`);
                const deletedIds = deletedFiles.map(f => f._id);
                await mediaCollection.deleteMany({ _id: { $in: deletedIds } });
            }
        }

        return indexed;
    }

    private async scanRecursive(
        adapter: IStorageAdapter,
        path: string,
        onProgress?: (current: number, total: number, file: string) => void
    ): Promise<Array<{ name: string; path: string; size?: number }>> {
        const results: Array<{ name: string; path: string; size?: number }> = [];

        try {
            const items = await adapter.listFiles(path);

            for (const item of items) {
                if (item.type === 'directory') {
                    // Recursively scan subdirectories
                    const subItems = await this.scanRecursive(adapter, item.path, onProgress);
                    results.push(...subItems);
                } else if (item.type === 'file') {
                    results.push({
                        name: item.name,
                        path: item.path,
                        size: item.size,
                    });
                }
            }
        } catch (error) {
            console.error(`Failed to scan ${path}:`, error);
        }

        return results;
    }

    async removeStorageMedia(storageId: string): Promise<number> {
        const mediaCollection = await getMediaCollection();
        const result = await mediaCollection.deleteMany({ storageId });
        return result.deletedCount || 0;
    }

    async getLibraryStats() {
        const mediaCollection = await getMediaCollection();

        const total = await mediaCollection.countDocuments({ enabled: true });
        const movies = await mediaCollection.countDocuments({ type: 'movie', enabled: true });
        const tvShows = await mediaCollection.countDocuments({ type: 'tv', enabled: true });

        return { total, movies, tvShows };
    }
}
