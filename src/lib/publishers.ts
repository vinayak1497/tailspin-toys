/**
 * Provides build-time data-access helpers for publisher records.
 *
 * The database is injected into each helper so callers can use the production
 * client or an in-memory test database.
 */
import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves all publishers ordered alphabetically by name.
 *
 * @param db - The Drizzle database client used to query publishers.
 * @returns A promise resolving to the publishers ordered by name.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
