import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { StorageConfig } from '@/lib/storage/storage-adapter';

/**
 * Storage configuration loaded from YAML file
 */
interface StorageConfigFile {
    connections: StorageConfig[];
}

/**
 * Loads storage configuration from YAML file
 * @returns Array of storage configurations
 * @throws Error if config file cannot be read or parsed
 */
export function loadStorageConfig(): StorageConfig[] {
    const configPath = path.join(process.cwd(), 'storage.config.yaml');
    const examplePath = path.join(process.cwd(), 'storage.config.example.yaml');

    // Check if config file exists, otherwise use example
    let fileToLoad = configPath;
    if (!fs.existsSync(configPath)) {
        console.warn('[Config] storage.config.yaml not found, using example config');
        if (!fs.existsSync(examplePath)) {
            console.warn('[Config] No storage configuration found, returning empty array');
            return [];
        }
        fileToLoad = examplePath;
    }

    try {
        const fileContents = fs.readFileSync(fileToLoad, 'utf8');
        const config = yaml.load(fileContents) as StorageConfigFile;

        if (!config.connections || !Array.isArray(config.connections)) {
            console.error('[Config] Invalid storage config format, connections must be an array');
            return [];
        }

        // Filter to only enabled connections
        const enabledConnections = config.connections.filter(conn => conn.enabled !== false);

        console.log(`[Config] Loaded ${enabledConnections.length} enabled storage connection(s) from ${path.basename(fileToLoad)}`);
        return enabledConnections;
    } catch (error) {
        console.error('[Config] Failed to load storage configuration:', error);
        throw new Error(`Failed to load storage configuration: ${error}`);
    }
}

/**
 * Validates that required fields are present in storage config
 * @param config Storage configuration to validate
 * @returns True if valid, false otherwise
 */
export function validateStorageConfig(config: StorageConfig): boolean {
    if (!config.id || !config.name || !config.type || !config.host) {
        console.error('[Config] Invalid storage config, missing required fields:', config);
        return false;
    }

    const validTypes = ['smb', 'ftp', 'webdav'];
    if (!validTypes.includes(config.type)) {
        console.error(`[Config] Invalid storage type '${config.type}', must be one of: ${validTypes.join(', ')}`);
        return false;
    }

    return true;
}

/**
 * Gets a single storage configuration by ID
 * @param id Storage connection ID
 * @returns Storage config or null if not found
 */
export function getStorageConfigById(id: string): StorageConfig | null {
    const configs = loadStorageConfig();
    return configs.find(c => c.id === id) || null;
}
