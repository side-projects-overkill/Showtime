import axios from 'axios';

const TVDB_BASE_URL = 'https://api4.thetvdb.com/v4';

export interface TVDBSeries {
    id: number;
    name: string;
    overview: string;
    image: string;
    firstAired: string;
    averageRuntime: number;
    score: number;
}

export class TVDBClient {
    private apiKey: string;
    private token: string | null = null;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async getToken(): Promise<string> {
        if (this.token) {
            return this.token;
        }

        try {
            const response = await axios.post(`${TVDB_BASE_URL}/login`, {
                apikey: this.apiKey,
            });

            this.token = response.data.data.token || '';
            return this.token || '';
        } catch (error) {
            throw new Error(`TVDB authentication failed: ${error}`);
        }
    }

    async searchSeries(name: string): Promise<TVDBSeries[]> {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${TVDB_BASE_URL}/search`, {
                params: { query: name, type: 'series' },
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data.data || [];
        } catch (error) {
            console.error('TVDB search failed:', error);
            return [];
        }
    }

    async getSeriesDetails(id: number): Promise<TVDBSeries | null> {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${TVDB_BASE_URL}/series/${id}/extended`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data.data;
        } catch (error) {
            console.error('TVDB details fetch failed:', error);
            return null;
        }
    }
}

export const createTVDBClient = () => {
    const apiKey = process.env.TVDB_API_KEY;
    if (!apiKey) {
        console.warn('TVDB_API_KEY not set, TVDB features will be disabled');
        return null;
    }
    return new TVDBClient(apiKey);
};
