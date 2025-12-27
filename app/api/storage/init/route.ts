import { NextRequest, NextResponse } from 'next/server';
import { storageManager } from '@/lib/storage/storage-manager';

/**
 * POST /api/storage/init
 * Initializes storage adapters from YAML configuration
 * This should be called on application startup
 */
export async function POST(req: NextRequest) {
    try {
        await storageManager.initializeFromConfig();

        return NextResponse.json({
            success: true,
            message: 'Storage initialized from configuration',
        });
    } catch (error: any) {
        console.error('[Storage Init] Failed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
