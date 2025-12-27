import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genres?: { id: number; name: string }[];
    runtime?: number;
}

/**
 * Represents a TV show result from TMDB API.
 */
export interface TMDBTVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genres?: { id: number; name: string }[];
    number_of_seasons?: number;
    number_of_episodes?: number;
}

/**
 * Client for interacting with The Movie Database (TMDB) API.
 */
export class TMDBClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Searches for movies by query.
     * @param query The search term
     * @returns Array of movie results
     */
    async searchMovie(query: string): Promise<TMDBMovie[]> {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
                params: {
                    api_key: this.apiKey,
                    query,
                    language: 'en-US',
                },
            });
            return response.data.results;
        } catch (error) {
            throw new Error(`TMDB search failed: ${error}`);
        }
    }

    /**
     * Searches for TV shows by query.
     * @param query The search term
     * @returns Array of TV show results
     */
    async searchTV(query: string): Promise<TMDBTVShow[]> {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
                params: {
                    api_key: this.apiKey,
                    query,
                    language: 'en-US',
                },
            });
            return response.data.results;
        } catch (error) {
            throw new Error(`TMDB search failed: ${error}`);
        }
    }

    /**
     * Fetches detailed information for a specific movie.
     * @param id The TMDB movie ID
     * @returns Detailed movie object
     */
    async getMovieDetails(id: number): Promise<TMDBMovie> {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
                params: {
                    api_key: this.apiKey,
                    language: 'en-US',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get movie details: ${error}`);
        }
    }

    /**
     * Fetches detailed information for a specific TV show.
     * @param id The TMDB TV show ID
     * @returns Detailed TV show object
     */
    async getTVDetails(id: number): Promise<TMDBTVShow> {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
                params: {
                    api_key: this.apiKey,
                    language: 'en-US',
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get TV show details: ${error}`);
        }
    }

    /**
     * Generates a full URL for a poster image.
     * @param path The image path from API response
     * @param size The desired image size
     * @returns The full image URL
     */
    getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
        if (!path) return null;
        return `${TMDB_IMAGE_BASE}/${size}${path}`;
    }

    getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
        if (!path) return null;
        return `${TMDB_IMAGE_BASE}/${size}${path}`;
    }
}

export const createTMDBClient = () => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB_API_KEY environment variable is not set');
    }
    return new TMDBClient(apiKey);
};
