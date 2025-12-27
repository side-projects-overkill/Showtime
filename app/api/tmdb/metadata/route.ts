import { NextRequest, NextResponse } from 'next/server';
import { createTMDBClient } from '@/lib/tmdb/tmdb-client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const tmdb = createTMDBClient();
        const metadata = type === 'tv'
            ? await tmdb.getTVDetails(parseInt(id))
            : await tmdb.getMovieDetails(parseInt(id));

        return NextResponse.json({
            success: true,
            metadata,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch metadata' },
            { status: 500 }
        );
    }
}
