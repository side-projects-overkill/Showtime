import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Establishes a connection to the MongoDB database.
 * Reuses the existing connection if available (connection pooling).
 * @returns Object containing the MongoDB client and database instance
 */
export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

/**
 * Retrieves the MongoDB collection for media library items.
 */
export async function getMediaCollection() {
    const { db } = await connectToDatabase();
    return db.collection('media_library');
}

/**
 * Retrieves the MongoDB collection for storage settings.
 */
export async function getStorageCollection() {
    const { db } = await connectToDatabase();
    return db.collection('storage_connections');
}

/**
 * Retrieves the MongoDB collection for metadata caching.
 */
export async function getMetadataCacheCollection() {
    const { db } = await connectToDatabase();
    return db.collection('metadata_cache');
}
