import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'showtime-secure-key-2025';

/**
 * Encrypts sensitive credentials using AES encryption.
 * @param data The string to encrypt
 * @returns The encrypted string
 */
export function encryptCredentials(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypts sensitive credentials.
 * @param encrypted The encrypted string
 * @returns The decrypted string
 */
export function decryptCredentials(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Parses a video filename to extract metadata.
 * Extracts title, year, season, and episode information.
 * @param filename The filename to parse
 * @returns Object containing extracted metadata
 */
export function parseFilename(filename: string): { title: string; year?: number; season?: number; episode?: number } {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|mpg|mpeg)$/i, '');

    // Try to extract year (in parentheses, brackets, or standalone)
    const yearMatch = nameWithoutExt.match(/[\(\[]?(19\d{2}|20\d{2})[\)\]]?/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    // Try to extract season and episode (S01E01 or 1x01 format)
    const seasonEpisodeMatch = nameWithoutExt.match(/[Ss](\d{1,2})[Ee](\d{1,2})|(\d{1,2})[xX](\d{1,2})/);
    const season = seasonEpisodeMatch ? parseInt(seasonEpisodeMatch[1] || seasonEpisodeMatch[3]) : undefined;
    const episode = seasonEpisodeMatch ? parseInt(seasonEpisodeMatch[2] || seasonEpisodeMatch[4]) : undefined;

    // Clean up title
    let title = nameWithoutExt;

    // For movies (no season/episode), remove everything after the year
    if (year && !season && !episode && yearMatch) {
        // Cut off everything after the year
        title = nameWithoutExt.substring(0, yearMatch.index! + yearMatch[0].length);
        // Remove the year itself from title
        title = title.replace(yearMatch[0], '');
    } else if (yearMatch) {
        // For TV shows or if no year, just remove the year
        title = title.replace(yearMatch[0], '');
    }

    // Remove season/episode
    if (seasonEpisodeMatch) {
        title = title.substring(0, seasonEpisodeMatch.index);
    }

    // Clean up title - remove quality indicators and common tags
    title = title
        .replace(/[\[\(].*?[\]\)]/g, '') // Remove anything in brackets/parentheses
        .replace(/\b(720p|1080p|2160p|4K|BluRay|WEB-DL|HDRip|BRRip|HDTV|HDTC|HDTS|PROPER|REPACK|EXTENDED|UNRATED|DC|Directors\.Cut|x264|x265|HEVC|AAC|AC3|DTS|Hindi|English|Tamil|Telugu|Gujarati|ESub|HC|10bit|10Bit|5\.1)\b/gi, '')
        .replace(/[._\-]+/g, ' ') // Replace dots, dashes, underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

    return { title, year, season, episode };
}


/**
 * Checks if a file is a supported video format based on its extension.
 * @param filename The filename to check
 * @returns True if the file is a video, false otherwise
 */
export function isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'];
    return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

/**
 * Determines the MIME type of a file based on its extension.
 * Defaults to 'video/mp4' if unknown.
 * @param filename The filename
 * @returns The MIME type string
 */
export function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'mp4': return 'video/mp4';
        case 'mkv': return 'video/x-matroska';
        case 'webm': return 'video/webm';
        case 'avi': return 'video/x-msvideo';
        case 'mov': return 'video/quicktime';
        case 'wmv': return 'video/x-ms-wmv';
        case 'flv': return 'video/x-flv';
        case 'mpg':
        case 'mpeg': return 'video/mpeg';
        default: return 'video/mp4'; // Fallback
    }
}

/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB, etc.).
 * @param bytes The size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
