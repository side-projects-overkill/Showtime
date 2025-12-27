import { NextRequest, NextResponse } from 'next/server';
import { createTMDBClient } from '@/lib/tmdb/tmdb-client';

/**
 * Handles GET requests to search TMDB.
 * Proxies requests to TMDB API to avoid exposing API key on client.
 * @param request The API request object
 * @returns JSON response with search results
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        const tmdb = createTMDBClient();
        const results = type === 'tv'
            ? await tmdb.searchTV(query)
            : await tmdb.searchMovie(query);

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to search TMDB' },
            { status: 500 }
        );
    }
}
