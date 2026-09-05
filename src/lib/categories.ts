/**
 * Provides build-time data-access helpers for category records.
 *
 * The database is injected into each helper so callers can use the production
 * client or an in-memory test database.
 */
import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Retrieves all categories ordered alphabetically by name.
 *
 * @param db - The Drizzle database client used to query categories.
 * @returns A promise resolving to the categories ordered by name.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}
