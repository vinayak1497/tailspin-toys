/**
 * Tests category data-access helpers against an in-memory database.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { categories } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('category data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns categories ordered by name', async () => {
        await db.insert(categories).values([
            { name: 'Strategy', description: 'Strategy games' },
            { name: 'Adventure', description: 'Adventure games' },
        ]);

        const result = await getAllCategories(db);

        expect(result.map((category) => category.name)).toEqual(['Adventure', 'Strategy']);
    });
});
