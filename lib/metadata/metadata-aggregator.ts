import { createTMDBClient } from '../tmdb/tmdb-client';
import { createOMDBClient } from './omdb-client';
import { createTVDBClient } from './tvdb-client';
import { parseFilename } from '../utils/media-utils';
import { IndexedMedia } from '../db/types';

/**
 * Aggregates metadata from multiple sources (TMDB, OMDB, TVDB).
 * Implements a fallback strategy to find the best available metadata for a file.
 */
export class MetadataAggregator {
    private tmdb = createTMDBClient();
    private omdb = createOMDBClient();
    private tvdb = createTVDBClient();

    /**
     * Fetches metadata for a given filename.
     * Tries TMDB first, then OMDB/TVDB as fallbacks, and finally defaults to parsed filename data.
     * @param filename The name of the file
     * @returns Partial indexed media object containing metadata
     */
    async fetchMetadata(filename: string): Promise<Partial<IndexedMedia>> {
        const parsed = parseFilename(filename);

        // Try TMDB first
        const tmdbResult = await this.tryTMDB(parsed.title, parsed.year, parsed.season);
        if (tmdbResult) {
            return tmdbResult;
        }

        // Fallback to OMDB for movies
        if (!parsed.season && this.omdb) {
            const omdbResult = await this.tryOMDB(parsed.title, parsed.year);
            if (omdbResult) {
                return omdbResult;
            }
        }

        // Fallback to TVDB for TV shows
        if (parsed.season && this.tvdb) {
            const tvdbResult = await this.tryTVDB(parsed.title);
            if (tvdbResult) {
                return tvdbResult;
            }
        }

        // Last resort: use parsed filename
        return {
            title: parsed.title,
            type: parsed.season ? 'tv' : 'movie',
            seasonNumber: parsed.season,
            episodeNumber: parsed.episode,
            metadataSource: 'parsed',
        };
    }

    private async tryTMDB(title: string, year?: number, season?: number): Promise<Partial<IndexedMedia> | null> {
        try {
            const type = season ? 'tv' : 'movie';

            console.log(`[TMDB] Searching for ${type}: "${title}" (year: ${year || 'unknown'})`);

            // Try exact search first
            let results = type === 'tv'
                ? await this.tmdb.searchTV(title)
                : await this.tmdb.searchMovie(title);

            console.log(`[TMDB] Found ${results?.length || 0} results for "${title}"`);

            // If no results, try without special characters
            if (!results || results.length === 0) {
                const cleanedTitle = title.replace(/[^\w\s]/g, '').trim();
                console.log(`[TMDB] Retrying with cleaned title: "${cleanedTitle}"`);

                results = type === 'tv'
                    ? await this.tmdb.searchTV(cleanedTitle)
                    : await this.tmdb.searchMovie(cleanedTitle);

                console.log(`[TMDB] Found ${results?.length || 0} results for cleaned title`);
            }

            if (!results || results.length === 0) {
                console.log(`[TMDB] No results found for "${title}"`);
                return null;
            }

            // Filter by year if provided
            let match = results[0];
            if (year && results.length > 1) {
                const yearMatch = results.find(r => {
                    const date = (r as any).first_air_date || (r as any).release_date;
                    return date && date.startsWith(year.toString());
                });
                if (yearMatch) {
                    match = yearMatch;
                    console.log(`[TMDB] Matched by year: ${year}`);
                }
            }

            console.log(`[TMDB] Selected match: ${(match as any).title || (match as any).name} (ID: ${match.id})`);

            const details = type === 'tv'
                ? await this.tmdb.getTVDetails(match.id)
                : await this.tmdb.getMovieDetails(match.id);

            // Type-safe property access
            const title_name = type === 'tv' ? (details as any).name : (details as any).title;
            const release = type === 'tv' ? (details as any).first_air_date : (details as any).release_date;
            const runtime = type === 'movie' ? (details as any).runtime : undefined;

            const result = {
                tmdbId: match.id,
                metadataSource: 'tmdb' as const,
                type: type as 'movie' | 'tv',
                title: title_name,
                originalTitle: title_name,
                overview: details.overview,
                posterPath: details.poster_path ? this.tmdb.getPosterUrl(details.poster_path, 'w500') ?? undefined : undefined,
                backdropPath: details.backdrop_path ? this.tmdb.getBackdropUrl(details.backdrop_path) ?? undefined : undefined,
                releaseDate: release,
                rating: details.vote_average,
                voteCount: details.vote_count,
                genres: details.genres?.map((g: any) => g.name),
                runtime,
            };

            console.log(`[TMDB] Successfully fetched metadata for: ${title_name}`);
            return result;
        } catch (error) {
            console.error('[TMDB] Fetch failed:', error);
            return null;
        }
    }

    private async tryOMDB(title: string, year?: number): Promise<Partial<IndexedMedia> | null> {
        if (!this.omdb) return null;

        try {
            const result = await this.omdb.searchByTitle(title, year);
            if (!result) return null;

            return {
                omdbId: result.imdbID,
                metadataSource: 'omdb',
                type: 'movie',
                title: result.Title,
                overview: result.Plot,
                posterPath: result.Poster !== 'N/A' ? result.Poster : undefined,
                releaseDate: result.Released,
                rating: parseFloat(result.imdbRating),
                genres: result.Genre.split(', '),
                runtime: parseInt(result.Runtime),
            };
        } catch (error) {
            console.error('OMDB fetch failed:', error);
            return null;
        }
    }

    private async tryTVDB(title: string): Promise<Partial<IndexedMedia> | null> {
        if (!this.tvdb) return null;

        try {
            const results = await this.tvdb.searchSeries(title);
            if (!results || results.length === 0) return null;

            const match = results[0];
            const details = await this.tvdb.getSeriesDetails(match.id);
            if (!details) return null;

            return {
                tvdbId: details.id,
                metadataSource: 'tvdb',
                type: 'tv',
                title: details.name,
                overview: details.overview,
                posterPath: details.image,
                releaseDate: details.firstAired,
                rating: details.score,
                runtime: details.averageRuntime,
            };
        } catch (error) {
            console.error('TVDB fetch failed:', error);
            return null;
        }
    }
}
