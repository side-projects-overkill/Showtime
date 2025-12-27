/**
 * Configuration for a storage connection.
 */
export interface StorageConfig {
    /** Unique identifier for the storage connection */
    id: string;
    /** Type of storage protocol */
    type: 'webdav' | 'ftp' | 'smb';
    /** Display name for the connection */
    name: string;
    /** Hostname or IP address */
    host: string;
    /** Port number (optional) */
    port?: number;
    /** Username for authentication */
    username: string;
    /** Password for authentication */
    password: string;
    /** Base path on the remote storage (optional) */
    basePath?: string;
    /** SMB share name (SMB only) */
    shareName?: string;
    /** Whether to use a secure connection (FTPS/HTTPS) */
    secure?: boolean;
    /** Whether the storage connection is currently enabled */
    enabled?: boolean;
}

/**
 * Represents a file or directory on the remote storage.
 */
export interface FileItem {
    /** Name of the file or directory */
    name: string;
    /** Full path to the item */
    path: string;
    /** Type of the item ('file' or 'directory') */
    type: 'file' | 'directory';
    /** Size of the file in bytes (optional) */
    size?: number;
    /** Last modification date (optional) */
    modified?: Date;
    /** Whether the file is identified as a video file */
    isVideo?: boolean;
}

/**
 * Interface that all storage adapters must implement.
 */
export interface IStorageAdapter {
    /** Establishes a connection to the storage server */
    connect(): Promise<void>;
    /** Closes the connection to the storage server */
    disconnect(): Promise<void>;
    /**
     * Lists files and directories at the specified path.
     * @param path The path to list contents of
     */
    listFiles(path: string): Promise<FileItem[]>;
    /**
     * Gets a readable stream for a file.
     * @param path The path to the file
     * @param options Optional range options for partial content
     */
    getFileStream(path: string, options?: { start?: number; end?: number }): Promise<ReadableStream>;
    /**
     * Gets the size of a file in bytes.
     * @param path The path to the file
     */
    getFileSize(path: string): Promise<number>;
    /**
     * Checks if a file or directory exists at the specified path.
     * @param path The path to check
     */
    fileExists(path: string): Promise<boolean>;
    /**
     * Gets the configuration for this adapter.
     * @returns The storage configuration object
     */
    getConfig(): StorageConfig;
}
