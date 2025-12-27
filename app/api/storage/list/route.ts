import { NextRequest, NextResponse } from 'next/server';
import { loadStorageConfig } from '@/lib/config/storage-config';

/**
 * Handles GET requests to list all configured storage connections.
 * Retrieves connections from YAML configuration file.
 * @param request The API request object
 * @returns JSON response with list of storage connections
 */
export async function GET(request: NextRequest) {
    try {
        const connections = loadStorageConfig();

        // Remove sensitive information before sending to client
        const safeConnections = connections.map(conn => ({
            ...conn,
            password: undefined, // Don't send passwords to client
        }));

        return NextResponse.json({
            success: true,
            connections: safeConnections,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch connections' },
            { status: 500 }
        );
    }
}
