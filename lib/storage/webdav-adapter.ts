import { createClient, WebDAVClient, FileStat } from 'webdav';
import { IStorageAdapter, StorageConfig, FileItem } from './storage-adapter';

/**
 * Storage adapter for WebDAV servers.
 * Implements the IStorageAdapter interface.
 */
export class WebDAVAdapter implements IStorageAdapter {
    private client: WebDAVClient | null = null;
    private config: StorageConfig;

    /**
     * Creates a new WebDAVAdapter instance.
     * @param config The storage configuration
     */
    constructor(config: StorageConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        const url = `${this.config.secure ? 'https' : 'http'}://${this.config.host}${this.config.port ? `:${this.config.port}` : ''
            }${this.config.basePath || ''}`;

        this.client = createClient(url, {
            username: this.config.username,
            password: this.config.password,
        });

        // Test connection
        try {
            await this.client.getDirectoryContents('/');
        } catch (error) {
            throw new Error(`WebDAV connection failed: ${error}`);
        }
    }

    async disconnect(): Promise<void> {
        this.client = null;
    }

    async listFiles(path: string): Promise<FileItem[]> {
        if (!this.client) {
            throw new Error('WebDAV client not connected');
        }

        try {
            const contents = await this.client.getDirectoryContents(path) as FileStat[];

            return contents.map((item) => ({
                name: item.basename,
                path: item.filename,
                type: item.type as 'file' | 'directory',
                size: item.size,
                modified: new Date(item.lastmod),
                isVideo: this.isVideoFile(item.basename),
            }));
        } catch (error) {
            throw new Error(`Failed to list files: ${error}`);
        }
    }

    async getFileStream(path: string, options?: { start?: number; end?: number }): Promise<ReadableStream> {
        if (!this.client) {
            throw new Error('WebDAV client not connected');
        }

        try {
            const stream = this.client.createReadStream(path, options ? {
                range: {
                    start: options.start || 0,
                    end: options.end
                }
            } : undefined);

            // Convert Node.js stream to Web ReadableStream with backpressure support
            return new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => {
                        try {
                            controller.enqueue(chunk);
                            // Simple backpressure: pause if queue is full
                            if (controller.desiredSize !== null && controller.desiredSize <= 0) {
                                stream.pause();
                            }
                        } catch (e) {
                            // Controller likely closed, destroy stream
                            stream.destroy();
                        }
                    });
                    stream.on('end', () => {
                        try { controller.close(); } catch (e) { }
                    });
                    stream.on('error', (error) => {
                        try { controller.error(error); } catch (e) { }
                    });
                },
                pull(controller) {
                    // Resume when consumer needs more data
                    stream.resume();
                },
                cancel() {
                    stream.destroy();
                }
            });
        } catch (error) {
            throw new Error(`Failed to get file stream: ${error}`);
        }
    }

    async getFileSize(path: string): Promise<number> {
        if (!this.client) {
            throw new Error('WebDAV client not connected');
        }

        try {
            const stat = await this.client.stat(path) as FileStat;
            return stat.size;
        } catch (error) {
            throw new Error(`Failed to get file size: ${error}`);
        }
    }

    async fileExists(path: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('WebDAV client not connected');
        }

        try {
            return await this.client.exists(path);
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
