import axios from 'axios';

const OMDB_BASE_URL = 'http://www.omdbapi.com';

export interface OMDBMovie {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Poster: string;
    imdbRating: string;
    imdbID: string;
    Type: string;
}

export class OMDBClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async searchByTitle(title: string, year?: number): Promise<OMDBMovie | null> {
        try {
            const params: any = {
                apikey: this.apiKey,
                t: title,
                plot: 'full',
            };

            if (year) {
                params.y = year;
            }

            const response = await axios.get(OMDB_BASE_URL, { params });

            if (response.data.Response === 'True') {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('OMDB search failed:', error);
            return null;
        }
    }

    async searchByIMDB(imdbId: string): Promise<OMDBMovie | null> {
        try {
            const response = await axios.get(OMDB_BASE_URL, {
                params: {
                    apikey: this.apiKey,
                    i: imdbId,
                    plot: 'full',
                },
            });

            if (response.data.Response === 'True') {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('OMDB search failed:', error);
            return null;
        }
    }
}

export const createOMDBClient = () => {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
        console.warn('OMDB_API_KEY not set, OMDB features will be disabled');
        return null;
    }
    return new OMDBClient(apiKey);
};
