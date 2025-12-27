import { NextRequest, NextResponse } from 'next/server';
import { getMediaCollection } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'movie' | 'tv' | 'all'
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');
        const search = searchParams.get('search');

        const mediaCollection = await getMediaCollection();

        // Build query
        const query: any = { enabled: true };

        if (type && type !== 'all') {
            query.type = type;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Get all matching media
        const allMedia = await mediaCollection
            .find(query)
            .sort({ indexed: -1 })
            .toArray();

        // Group TV shows by tmdbId (or title if no tmdbId)
        const grouped = new Map();

        for (const item of allMedia) {
            if (item.type === 'tv') {
                // Group by tmdbId or title
                const groupKey = item.tmdbId || item.title;

                if (!grouped.has(groupKey)) {
                    // First episode of this show - use as representative
                    grouped.set(groupKey, {
                        ...item,
                        episodeCount: 1,
                        episodes: [item],
                    });
                } else {
                    // Additional episode - increment count
                    const existing = grouped.get(groupKey);
                    existing.episodeCount++;
                    existing.episodes.push(item);
                }
            } else {
                // Movies - add directly
                grouped.set(item._id.toString(), item);
            }
        }

        // Convert map to array and apply pagination
        const groupedArray = Array.from(grouped.values());
        const total = groupedArray.length;
        const paginatedMedia = groupedArray.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            media: paginatedMedia,
            total,
            hasMore: skip + limit < total,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch library' },
            { status: 500 }
        );
    }
}
