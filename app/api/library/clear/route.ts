import { NextRequest, NextResponse } from 'next/server';
import { getMediaCollection } from '@/lib/db/mongodb';

/**
 * DELETE /api/library/clear
 * Clears all media entries from the database
 * Useful for fixing duplicates or starting fresh
 */
export async function DELETE(req: NextRequest) {
    try {
        const mediaCollection = await getMediaCollection();
        const result = await mediaCollection.deleteMany({});

        console.log(`[Library] Cleared ${result.deletedCount} media entries`);

        return NextResponse.json({
            success: true,
            deleted: result.deletedCount,
            message: `Cleared ${result.deletedCount} media entries`,
        });
    } catch (error: any) {
        console.error('[Library Clear] Failed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
