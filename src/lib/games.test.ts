import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters games by category and publisher together', async () => {
        const categoryRows = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: 'strategy' },
                { name: 'Puzzle', description: 'puzzle' },
            ])
            .returning({ id: categories.id, name: categories.name });
        const publisherRows = await db
            .insert(publishers)
            .values([
                { name: 'Pub One', description: 'first' },
                { name: 'Pub Two', description: 'second' },
            ])
            .returning({ id: publishers.id, name: publishers.name });

        await db.insert(games).values([
            {
                title: 'Matching Game',
                description: 'matches both filters',
                starRating: 4,
                categoryId: categoryRows[0].id,
                publisherId: publisherRows[0].id,
            },
            {
                title: 'Other Publisher',
                description: 'does not match publisher',
                starRating: 4,
                categoryId: categoryRows[0].id,
                publisherId: publisherRows[1].id,
            },
            {
                title: 'Other Category',
                description: 'does not match category',
                starRating: 4,
                categoryId: categoryRows[1].id,
                publisherId: publisherRows[0].id,
            },
        ]);

        const result = await getFilteredGames(db, {
            categoryIds: [categoryRows[0].id],
            publisherId: publisherRows[0].id,
        });

        expect(result.map((game) => game.title)).toEqual(['Matching Game']);
    });

    it('filters games by multiple categories', async () => {
        const categoryRows = await db
            .insert(categories)
            .values([
                { name: 'Adventure', description: 'adventure' },
                { name: 'Puzzle', description: 'puzzle' },
            ])
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Publisher', description: 'publisher' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            {
                title: 'Puzzle Game',
                description: 'puzzle',
                categoryId: categoryRows[1].id,
                publisherId: publisher.id,
            },
            {
                title: 'Adventure Game',
                description: 'adventure',
                categoryId: categoryRows[0].id,
                publisherId: publisher.id,
            },
        ]);

        const result = await getFilteredGames(db, {
            categoryIds: categoryRows.map((category) => category.id),
        });

        expect(result.map((game) => game.title)).toEqual(['Adventure Game', 'Puzzle Game']);
    });

    it('returns no games when filters have no matches', async () => {
        await seedGames(db, 1);

        const result = await getFilteredGames(db, { publisherId: 99999 });

        expect(result).toEqual([]);
    });
});
