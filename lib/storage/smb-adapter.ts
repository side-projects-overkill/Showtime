import SMB2 from '@marsaud/smb2';
import { IStorageAdapter, StorageConfig, FileItem } from './storage-adapter';

/**
 * Storage adapter for SMB/CIFS shares.
 * Implements the IStorageAdapter interface using @marsaud/smb2.
 */
export class SMBAdapter implements IStorageAdapter {
    private client: any = null;
    private config: StorageConfig;

    /**
     * Creates a new SMBAdapter instance.
     * @param config The storage configuration
     */
    constructor(config: StorageConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        try {
            this.client = new SMB2({
                share: `\\\\${this.config.host}\\${this.config.basePath || 'share'}`,
                domain: 'WORKGROUP',
                username: this.config.username,
                password: this.config.password,
            });

            // Test connection by listing root
            await new Promise((resolve, reject) => {
                this.client.readdir('', (err: any, files: any) => {
                    if (err) reject(err);
                    else resolve(files);
                });
            });
        } catch (error) {
            throw new Error(`SMB connection failed: ${error}`);
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
            throw new Error('SMB client not connected');
        }

        return new Promise((resolve, reject) => {
            this.client.readdir(path, (err: any, files: any[]) => {
                if (err) {
                    reject(new Error(`Failed to list files: ${err}`));
                    return;
                }

                const items: FileItem[] = files.map((file) => ({
                    name: file.name,
                    path: `${path}/${file.name}`.replace('//', '/'),
                    type: file.isDirectory() ? 'directory' : 'file',
                    size: file.size,
                    modified: file.mtime ? new Date(file.mtime) : undefined,
                    isVideo: this.isVideoFile(file.name),
                }));

                resolve(items);
            });
        });
    }

    async getFileStream(path: string, options?: { start?: number; end?: number }): Promise<ReadableStream> {
        if (!this.client) {
            throw new Error('SMB client not connected');
        }

        return new Promise((resolve, reject) => {
            this.client.createReadStream(path, options, (err: any, stream: any) => {
                if (err) {
                    reject(new Error(`Failed to get file stream: ${err}`));
                    return;
                }

                // In Node 18+ and Bun, we can use Readable.toWeb
                // But since we are in a text environment, we can check or implement a safer wrapper
                // For now, we manually implement a pull-based wrapper for compatibility

                const webStream = new ReadableStream({
                    start(controller) {
                        stream.on('data', (chunk: Buffer) => {
                            controller.enqueue(chunk);
                            // Simple backpressure: pause if queue is full
                            if (controller.desiredSize !== null && controller.desiredSize <= 0) {
                                stream.pause();
                            }
                        });
                        stream.on('end', () => {
                            controller.close();
                        });
                        stream.on('error', (error: Error) => {
                            controller.error(error);
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

                resolve(webStream);
            });
        });
    }

    async getFileSize(path: string): Promise<number> {
        if (!this.client) {
            throw new Error('SMB client not connected');
        }

        return new Promise((resolve, reject) => {
            this.client.getSize(path, (err: any, size: number) => {
                if (err) reject(new Error(`Failed to get file size: ${err}`));
                else resolve(size);
            });
        });
    }

    async fileExists(path: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('SMB client not connected');
        }

        return new Promise((resolve) => {
            this.client.exists(path, (err: any, exists: boolean) => {
                resolve(!err && exists);
            });
        });
    }

    getConfig(): StorageConfig {
        return this.config;
    }

    private isVideoFile(filename: string): boolean {
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
    }
}
