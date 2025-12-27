/**
 * Next.js Instrumentation
 * This file runs once when the server starts
 */

export async function register() {
    // Only run on server (not in edge runtime or client)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { storageManager } = await import('./lib/storage/storage-manager');

        console.log('[App] Initializing storage from YAML configuration...');
        await storageManager.initializeFromConfig();
        console.log('[App] Storage initialization complete');
    }
}
