import { NextRequest, NextResponse } from 'next/server';
import { getStorageCollection } from '@/lib/db/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { id, enabled } = await request.json();

        const storageCollection = await getStorageCollection();
        await storageCollection.updateOne(
            { id },
            { $set: { enabled } }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to toggle storage' },
            { status: 500 }
        );
    }
}
