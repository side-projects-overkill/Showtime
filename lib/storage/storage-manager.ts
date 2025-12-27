import { IStorageAdapter, StorageConfig } from './storage-adapter';
import { WebDAVAdapter } from './webdav-adapter';
import { FTPAdapter } from './ftp-adapter';
import { SMBAdapter } from './smb-adapter';

/**
 * Manages storage adapters and connections.
 * Singleton class responsible for creating, retrieving, and removing storage adapters.
 */
class StorageManager {
    private adapters: Map<string, IStorageAdapter> = new Map();

    /**
     * Creates a new storage adapter based on the configuration.
     * @param config The storage configuration
     * @returns The created storage adapter
     * @throws Error if the storage type is not supported
     */
    createAdapter(config: StorageConfig): IStorageAdapter {
        let adapter: IStorageAdapter;

        switch (config.type) {
            case 'webdav':
                adapter = new WebDAVAdapter(config);
                break;
            case 'ftp':
                adapter = new FTPAdapter(config);
                break;
            case 'smb':
                adapter = new SMBAdapter(config);
                break;
            default:
                throw new Error(`Unsupported storage type: ${config.type}`);
        }

        this.adapters.set(config.id, adapter);
        return adapter;
    }

    /**
     * Retrieves an existing adapter by its ID.
     * @param id The storage ID
     * @returns The adapter instance or undefined if not found
     */
    getAdapter(id: string): IStorageAdapter | undefined {
        return this.adapters.get(id);
    }

    /**
     * Removes and disconnects an adapter.
     * @param id The storage ID to remove
     */
    removeAdapter(id: string): void {
        const adapter = this.adapters.get(id);
        if (adapter) {
            adapter.disconnect();
            this.adapters.delete(id);
        }
    }

    /**
     * Disconnects all active adapters.
     * Useful for cleanup during shutdown or reload.
     */
    async disconnectAll(): Promise<void> {
        const disconnectPromises = Array.from(this.adapters.values()).map((adapter) =>
            adapter.disconnect()
        );
        await Promise.all(disconnectPromises);
        this.adapters.clear();
    }

    /**
     * Gets all active adapter configurations
     * @returns Array of storage configs for active adapters
     */
    getAllConfigs(): StorageConfig[] {
        return Array.from(this.adapters.values()).map(adapter => adapter.getConfig());
    }

    /**
     * Initializes storage adapters from YAML configuration file
     * Loads storage.config.yaml and creates adapters for enabled connections
     */
    async initializeFromConfig(): Promise<void> {
        const { loadStorageConfig, validateStorageConfig } = await import('@/lib/config/storage-config');

        try {
            const configs = loadStorageConfig();

            for (const config of configs) {
                if (!validateStorageConfig(config)) {
                    console.warn(`[StorageManager] Skipping invalid config: ${config.id}`);
                    continue;
                }

                try {
                    const adapter = this.createAdapter(config);
                    await adapter.connect();
                    console.log(`[StorageManager] Connected to ${config.name} (${config.type})`);
                } catch (error) {
                    console.error(`[StorageManager] Failed to connect to ${config.name}:`, error);
                }
            }

            console.log(`[StorageManager] Initialized ${this.adapters.size} storage adapter(s)`);
        } catch (error) {
            console.error('[StorageManager] Failed to initialize from config:', error);
        }
    }
}

export const storageManager = new StorageManager();
