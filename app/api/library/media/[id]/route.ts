import { NextRequest, NextResponse } from 'next/server';
import { getMediaCollection } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const mediaCollection = await getMediaCollection();
        const media = await mediaCollection.findOne({ _id: new ObjectId(params.id) });

        if (!media) {
            return NextResponse.json(
                { error: 'Media not found' },
                { status: 404 }
            );
        }

        // If it's a TV show, fetch all episodes with the same tmdbId
        if (media.type === 'tv' && media.tmdbId) {
            const episodes = await mediaCollection
                .find({
                    type: 'tv',
                    tmdbId: media.tmdbId,
                    enabled: true,
                })
                .sort({ seasonNumber: 1, episodeNumber: 1 })
                .toArray();

            return NextResponse.json({
                success: true,
                media: {
                    ...media,
                    episodes,
                },
            });
        }

        return NextResponse.json({
            success: true,
            media,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch media' },
            { status: 500 }
        );
    }
}
