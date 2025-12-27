'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStorage } from '@/contexts/StorageContext';
import { StorageConfig } from '@/lib/storage/storage-adapter';

/**
 * Form for adding new storage connections.
 * Validates input and tests connection before saving.
 */
export default function StorageConnectionForm() {
    const router = useRouter();
    const { addConnection } = useStorage();
    const [formData, setFormData] = useState<Partial<StorageConfig>>({
        type: 'webdav',
        secure: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Destructure from formData for clarity and to match the provided snippet's variable names
            const { type, name, host, port, username, password, basePath, secure } = formData;

            // Basic validation for required fields
            if (!type || !host || !username || !password) {
                throw new Error('Please fill in all required fields: Type, Host, Username, and Password.');
            }

            const config: StorageConfig = {
                id: Date.now().toString(),
                type: type as 'webdav' | 'ftp' | 'smb', // Ensure type is correct
                name: name || `${type} Storage`, // Use type for default name
                host: host!,
                port: port ? parseInt(port.toString()) : undefined, // Ensure port is number or undefined
                username: username!,
                password: password!,
                basePath: basePath || undefined,
                secure: secure ?? false, // Default to false if undefined
                enabled: true,
            };

            // Test connection
            const response = await fetch('/api/storage/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to connect');
            }

            // Add to context (which now saves to MongoDB)
            await addConnection(config);

            // Show success and redirect
            setSuccess(true);
            setTimeout(() => {
                router.push('/browse');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to storage');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Add Storage Connection</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
                    ✓ Connected successfully! Redirecting to browse...
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Storage Type</label>
                    <select
                        className="input"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                        <option value="webdav">WebDAV</option>
                        <option value="ftp">FTP</option>
                        <option value="smb">SMB/CIFS</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Connection Name</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="My Storage"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Host</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="example.com"
                            required
                            value={formData.host || ''}
                            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Port (Optional)</label>
                        <input
                            type="number"
                            className="input"
                            placeholder={formData.type === 'ftp' ? '21' : formData.type === 'smb' ? '445' : '443'}
                            value={formData.port || ''}
                            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || undefined })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="username"
                            required
                            value={formData.username || ''}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            required
                            value={formData.password || ''}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Base Path (Optional)</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="/media"
                        value={formData.basePath || ''}
                        onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                    />
                </div>

                {(formData.type === 'webdav' || formData.type === 'ftp') && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="secure"
                            checked={formData.secure}
                            onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                            className="w-4 h-4 rounded border-dark-700 bg-dark-800 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="secure" className="text-sm">
                            Use secure connection (HTTPS/FTPS)
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? 'Connecting...' : 'Connect Storage'}
                </button>
            </form>
        </div>
    );
}
