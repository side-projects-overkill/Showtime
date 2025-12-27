import axios from 'axios';
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

// In-memory cache for configurations
let cachedConfigs: StorageConfig[] | null = null;
let lastLoadTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Loads storage configuration from Environment Variable, Remote URL, or YAML file.
 * Includes caching to minimize network/filesystem overhead.
 * 
 * @returns Promise resolving to an array of storage configurations
 */
export async function loadStorageConfig(): Promise<StorageConfig[] | any> {
    const now = Date.now();

    // Return cached configs if within TTL
    if (cachedConfigs && (now - lastLoadTime < CACHE_TTL)) {
        return cachedConfigs;
    }

    let yamlContents: string | null = null;
    let source = '';

    // 1. Check for remote URL (Gist, raw snippet, etc)
    if (process.env.STORAGE_CONFIG_URL) {
        try {
            console.log(`[Config] Fetching configuration from remote URL...`);
            const response = await axios.get(process.env.STORAGE_CONFIG_URL);
            yamlContents = typeof response.data === 'string' ? response.data : yaml.dump(response.data);
            source = `Remote URL: ${process.env.STORAGE_CONFIG_URL}`;
        } catch (error: any) {
            console.error(`[Config] Failed to fetch remote configuration:`, error.message);
        }
    }

    // 2. Fallback: Local Filesystem
    if (!yamlContents) {
        const configPath = path.join(process.cwd(), 'storage.config.yaml');
        const examplePath = path.join(process.cwd(), 'storage.config.example.yaml');

        let fileToLoad = configPath;
        if (!fs.existsSync(configPath)) {
            if (!fs.existsSync(examplePath)) {
                console.warn('[Config] No storage configuration found (no env, url, or files)');
                return [];
            }
            console.warn('[Config] storage.config.yaml not found, using example config');
            fileToLoad = examplePath;
        }

        try {
            yamlContents = fs.readFileSync(fileToLoad, 'utf8');
            source = `Local file: ${path.basename(fileToLoad)}`;
        } catch (error) {
            console.error('[Config] Failed to read storage config file:', error);
        }
    }

    if (!yamlContents) {
        return [];
    }

    try {
        const config = yaml.load(yamlContents) as StorageConfigFile;

        if (!config.connections || !Array.isArray(config.connections)) {
            console.error('[Config] Invalid storage config format, connections must be an array');
            return [];
        }

        // Filter to only enabled connections
        const enabledConnections = config.connections.filter(conn => conn.enabled !== false);

        // Update cache
        cachedConfigs = enabledConnections;
        lastLoadTime = now;

        console.log(`[Config] Successfully loaded ${enabledConnections.length} connection(s) from ${source}`);
        return enabledConnections;
    } catch (error) {
        console.error('[Config] Failed to parse storage configuration:', error);
        return [];
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
export async function getStorageConfigById(id: string): Promise<StorageConfig | null> {
    const configs = await loadStorageConfig();
    return configs.find((c: any) => c.id === id) || null;
}
