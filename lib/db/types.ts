/**
 * Represents a media file indexed in the library.
 * Stores metadata, file information, and user-specific data.
 */
export interface IndexedMedia {
    _id?: string;
    filename: string;
    path: string;
    storageId: string;
    storageName: string;
    size: number;

    // Multi-source metadata
    tmdbId?: number;
    omdbId?: string;
    tvdbId?: number;
    metadataSource?: 'tmdb' | 'omdb' | 'tvdb' | 'parsed';

    // Common metadata fields
    type?: 'movie' | 'tv';
    title: string;
    originalTitle?: string;
    overview?: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate?: string;
    rating?: number;
    voteCount?: number;
    genres?: string[];
    runtime?: number;

    // TV specific
    seasonNumber?: number;
    episodeNumber?: number;

    // Thumbnail
    thumbnail?: string;

    // Indexing metadata
    indexed: Date;
    enabled: boolean;
    lastPlayed?: Date;
    playCount?: number;
}

/**
 * Represents a stored connection to a remote storage provider.
 */
export interface StorageConnection {
    _id?: string;
    id: string;
    type: 'webdav' | 'ftp' | 'smb';
    name: string;
    host: string;
    port?: number;
    username: string;
    password: string;
    basePath?: string;
    secure?: boolean;
    enabled: boolean;
    lastIndexed?: Date;
    mediaCount?: number;
}

/**
 * Represents cached metadata from external APIs (TMDB, TVDB, etc.).
 */
export interface MetadataCache {
    _id?: string;
    source: 'tmdb' | 'omdb' | 'tvdb';
    sourceId: string | number;
    type: 'movie' | 'tv';
    data: any;
    cachedAt: Date;
    expiresAt: Date;
}
