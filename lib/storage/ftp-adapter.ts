import { Client } from 'basic-ftp';
import { IStorageAdapter, StorageConfig, FileItem } from './storage-adapter';
import { Readable } from 'stream';

/**
 * Storage adapter for FTP servers.
 * Implements the IStorageAdapter interface using basic-ftp.
 */
export class FTPAdapter implements IStorageAdapter {
    private client: Client | null = null;
    private config: StorageConfig;

    /**
     * Creates a new FTPAdapter instance.
     * @param config The storage configuration
     */
    constructor(config: StorageConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        this.client = new Client();
        this.client.ftp.verbose = false;

        try {
            await this.client.access({
                host: this.config.host,
                port: this.config.port || 21,
                user: this.config.username,
                password: this.config.password,
                secure: this.config.secure || false,
            });
        } catch (error) {
            throw new Error(`FTP connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
    }

    async listFiles(path: string): Promise<FileItem[]> {
        if (!this.client) {
            throw new Error('FTP client not connected');
        }

        try {
            const list = await this.client.list(path);

            return list.map((item) => ({
                name: item.name,
                path: `${path}/${item.name}`.replace('//', '/'),
                type: item.isDirectory ? 'directory' : 'file',
                size: item.size,
                modified: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
                isVideo: this.isVideoFile(item.name),
            }));
        } catch (error) {
            throw new Error(`Failed to list files: ${error}`);
        }
    }

    async getFileStream(path: string, options?: { start?: number; end?: number }): Promise<ReadableStream> {
        if (!this.client) {
            throw new Error('FTP client not connected');
        }

        try {
            // Create a passthrough stream
            const { Readable } = await import('stream');
            const nodeStream = new Readable({
                read() { },
            });

            // Download file to stream
            this.client.downloadTo(nodeStream as any, path, options?.start).catch((error) => {
                nodeStream.destroy(error);
            });

            // Convert Node.js stream to Web ReadableStream
            return new ReadableStream({
                start(controller) {
                    nodeStream.on('data', (chunk) => {
                        controller.enqueue(chunk);
                    });
                    nodeStream.on('end', () => {
                        controller.close();
                    });
                    nodeStream.on('error', (error) => {
                        controller.error(error);
                    });
                },
            });
        } catch (error) {
            throw new Error(`Failed to get file stream: ${error}`);
        }
    }

    async getFileSize(path: string): Promise<number> {
        if (!this.client) {
            throw new Error('FTP client not connected');
        }

        try {
            return await this.client.size(path);
        } catch (error) {
            throw new Error(`Failed to get file size: ${error}`);
        }
    }

    async fileExists(path: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('FTP client not connected');
        }

        try {
            await this.client.size(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    getConfig(): StorageConfig {
        return this.config;
    }

    private isVideoFile(filename: string): boolean {
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
    }
}
