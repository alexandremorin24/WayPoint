const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const { v4: uuidv4 } = require('uuid');

describe('🧹 Suppression en cascade (ON DELETE CASCADE)', () => {
  let user, mapId, poiId, categoryId;
  const testGame = 'game-cascade';

  beforeAll(async () => {
    // Targeted cleanup
    await db.execute('DELETE FROM poi_logs');
    await db.execute('DELETE FROM poi_user_stats');
    await db.execute('DELETE FROM pois');
    await db.execute('DELETE FROM categories');
    await db.execute('DELETE FROM map_user_roles');
    await db.execute('DELETE FROM map_votes');
    await db.execute('DELETE FROM maps');
    await db.execute('DELETE FROM users WHERE email = ?', ['cascade-test@example.com']);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);

    // Game creation
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // User creation
    user = await createUser({ email: 'cascade-test@example.com', passwordHash: 'hash', displayName: 'CascadeTest' });

    // Map creation
    mapId = uuidv4();
    await db.execute(
      'INSERT INTO maps (id, name, description, owner_id, game_id, is_public, image_width, image_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [mapId, 'Cascade Map', 'desc', user.id, testGame, 1, 100, 100]
    );

    // Category creation
    categoryId = uuidv4();
    await db.execute(
      'INSERT INTO categories (id, map_id, name) VALUES (?, ?, ?)',
      [categoryId, mapId, 'CascadeCat']
    );

    // POI creation
    poiId = uuidv4();
    await db.execute(
      'INSERT INTO pois (id, map_id, name, x, y, creator_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [poiId, mapId, 'CascadePOI', 10, 10, user.id, categoryId]
    );

    // Role addition
    await db.execute('INSERT INTO map_user_roles (map_id, user_id, role) VALUES (?, ?, ?)', [mapId, user.id, 'editor']);
    // Verifications
    await db.execute('INSERT INTO map_votes (id, user_id, map_id) VALUES (?, ?, ?)', [uuidv4(), user.id, mapId]);
    await db.execute('INSERT INTO poi_user_stats (id, user_id, map_id, poi_created_count) VALUES (?, ?, ?, ?)', [uuidv4(), user.id, mapId, 1]);
    await db.execute('INSERT INTO poi_logs (id, poi_id, map_id, user_id, action) VALUES (?, ?, ?, ?, ?)', [uuidv4(), poiId, mapId, user.id, 'create']);
  });

  afterAll(async () => {
    await db.execute('DELETE FROM poi_logs');
    await db.execute('DELETE FROM poi_user_stats');
    await db.execute('DELETE FROM pois');
    await db.execute('DELETE FROM categories');
    await db.execute('DELETE FROM map_user_roles');
    await db.execute('DELETE FROM map_votes');
    await db.execute('DELETE FROM maps');
    await db.execute('DELETE FROM users WHERE email = ?', ['cascade-test@example.com']);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
  });

  it('supprime tout ce qui dépend d\'une map quand on supprime la map', async () => {
    // Suppression de la map
    await db.execute('DELETE FROM maps WHERE id = ?', [mapId]);
    // Vérifications
    const [[pois]] = await db.execute('SELECT COUNT(*) as count FROM pois WHERE map_id = ?', [mapId]);
    const [[cats]] = await db.execute('SELECT COUNT(*) as count FROM categories WHERE map_id = ?', [mapId]);
    const [[roles]] = await db.execute('SELECT COUNT(*) as count FROM map_user_roles WHERE map_id = ?', [mapId]);
    const [[votes]] = await db.execute('SELECT COUNT(*) as count FROM map_votes WHERE map_id = ?', [mapId]);
    const [[stats]] = await db.execute('SELECT COUNT(*) as count FROM poi_user_stats WHERE map_id = ?', [mapId]);
    const [[logs]] = await db.execute('SELECT COUNT(*) as count FROM poi_logs WHERE map_id = ?', [mapId]);
    expect(pois.count).toBe(0);
    expect(cats.count).toBe(0);
    expect(roles.count).toBe(0);
    expect(votes.count).toBe(0);
    expect(stats.count).toBe(0);
    expect(logs.count).toBe(0);
  });

  it('supprime tout ce qui dépend d\'un utilisateur quand on supprime l\'utilisateur', async () => {
    // Recreate everything as the map was deleted in previous test
    // Create a map, POI, log, vote, role, and stat
    const user2 = await createUser({ email: 'cascade-test2@example.com', passwordHash: 'hash', displayName: 'CascadeTest2' });
    const map2 = uuidv4();
    const cat2 = uuidv4();
    const poi2 = uuidv4();
    await db.execute('INSERT INTO maps (id, name, description, owner_id, game_id, is_public, image_width, image_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [map2, 'Cascade Map2', 'desc', user2.id, testGame, 1, 100, 100]);
    await db.execute('INSERT INTO categories (id, map_id, name) VALUES (?, ?, ?)', [cat2, map2, 'CascadeCat2']);
    await db.execute('INSERT INTO pois (id, map_id, name, x, y, creator_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [poi2, map2, 'CascadePOI2', 10, 10, user2.id, cat2]);
    await db.execute('INSERT INTO map_user_roles (map_id, user_id, role) VALUES (?, ?, ?)', [map2, user2.id, 'editor']);
    await db.execute('INSERT INTO map_votes (id, user_id, map_id) VALUES (?, ?, ?)', [uuidv4(), user2.id, map2]);
    await db.execute('INSERT INTO poi_user_stats (id, user_id, map_id, poi_created_count) VALUES (?, ?, ?, ?)', [uuidv4(), user2.id, map2, 1]);
    await db.execute('INSERT INTO poi_logs (id, poi_id, map_id, user_id, action) VALUES (?, ?, ?, ?, ?)', [uuidv4(), poi2, map2, user2.id, 'create']);
    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [user2.id]);
    // Verifications
    const [[roles]] = await db.execute('SELECT COUNT(*) as count FROM map_user_roles WHERE user_id = ?', [user2.id]);
    const [[votes]] = await db.execute('SELECT COUNT(*) as count FROM map_votes WHERE user_id = ?', [user2.id]);
    const [[stats]] = await db.execute('SELECT COUNT(*) as count FROM poi_user_stats WHERE user_id = ?', [user2.id]);
    const [[logs]] = await db.execute('SELECT COUNT(*) as count FROM poi_logs WHERE user_id = ?', [user2.id]);
    expect(roles.count).toBe(0);
    expect(votes.count).toBe(0);
    expect(stats.count).toBe(0);
    expect(logs.count).toBe(0);
  });

  it('supprime les logs liés à un POI quand on supprime le POI', async () => {
    // Create a POI and a log
    const user3 = await createUser({ email: 'cascade-test3@example.com', passwordHash: 'hash', displayName: 'CascadeTest3' });
    const map3 = uuidv4();
    const cat3 = uuidv4();
    const poi3 = uuidv4();
    await db.execute('INSERT INTO maps (id, name, description, owner_id, game_id, is_public, image_width, image_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [map3, 'Cascade Map3', 'desc', user3.id, testGame, 1, 100, 100]);
    await db.execute('INSERT INTO categories (id, map_id, name) VALUES (?, ?, ?)', [cat3, map3, 'CascadeCat3']);
    await db.execute('INSERT INTO pois (id, map_id, name, x, y, creator_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [poi3, map3, 'CascadePOI3', 10, 10, user3.id, cat3]);
    await db.execute('INSERT INTO poi_logs (id, poi_id, map_id, user_id, action) VALUES (?, ?, ?, ?, ?)', [uuidv4(), poi3, map3, user3.id, 'create']);
    // Delete POI
    await db.execute('DELETE FROM pois WHERE id = ?', [poi3]);
    // Verification
    const [[logs]] = await db.execute('SELECT COUNT(*) as count FROM poi_logs WHERE poi_id = ?', [poi3]);
    expect(logs.count).toBe(0);
    // Nettoyage
    await db.execute('DELETE FROM users WHERE id = ?', [user3.id]);
    await db.execute('DELETE FROM maps WHERE id = ?', [map3]);
  });

  it('met à NULL les sous-catégories quand on supprime une catégorie parente', async () => {
    // Create a map and parent/child categories
    const user4 = await createUser({ email: 'cascade-test4@example.com', passwordHash: 'hash', displayName: 'CascadeTest4' });
    const map4 = uuidv4();
    const parentCat = uuidv4();
    const childCat = uuidv4();

    await db.execute('INSERT INTO maps (id, name, description, owner_id, game_id, is_public, image_width, image_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [map4, 'Cascade Map4', 'desc', user4.id, testGame, 1, 100, 100]);

    // Create parent category
    await db.execute('INSERT INTO categories (id, map_id, name) VALUES (?, ?, ?)',
      [parentCat, map4, 'ParentCat']);

    // Create subcategory
    await db.execute('INSERT INTO categories (id, map_id, name, parent_category_id) VALUES (?, ?, ?, ?)',
      [childCat, map4, 'ChildCat', parentCat]);

    // Delete parent category
    await db.execute('DELETE FROM categories WHERE id = ?', [parentCat]);

    // Verify that subcategory still exists but with parent_category_id = NULL
    const [[child]] = await db.execute('SELECT parent_category_id FROM categories WHERE id = ?', [childCat]);
    expect(child.parent_category_id).toBeNull();

    // Cleanup
    await db.execute('DELETE FROM users WHERE id = ?', [user4.id]);
    await db.execute('DELETE FROM maps WHERE id = ?', [map4]);
  });

  it('supprime la map quand on supprime son propriétaire', async () => {
    // Create a user and their map
    const user5 = await createUser({ email: 'cascade-test5@example.com', passwordHash: 'hash', displayName: 'CascadeTest5' });
    const map5 = uuidv4();
    const cat5 = uuidv4();
    const poi5 = uuidv4();

    await db.execute('INSERT INTO maps (id, name, description, owner_id, game_id, is_public, image_width, image_height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [map5, 'Cascade Map5', 'desc', user5.id, testGame, 1, 100, 100]);

    await db.execute('INSERT INTO categories (id, map_id, name) VALUES (?, ?, ?)',
      [cat5, map5, 'CascadeCat5']);

    await db.execute('INSERT INTO pois (id, map_id, name, x, y, creator_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [poi5, map5, 'CascadePOI5', 10, 10, user5.id, cat5]);

    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [user5.id]);

    // Verify that the map and its dependencies are deleted
    const [[maps]] = await db.execute('SELECT COUNT(*) as count FROM maps WHERE id = ?', [map5]);
    const [[pois]] = await db.execute('SELECT COUNT(*) as count FROM pois WHERE map_id = ?', [map5]);
    const [[cats]] = await db.execute('SELECT COUNT(*) as count FROM categories WHERE map_id = ?', [map5]);

    expect(maps.count).toBe(0);
    expect(pois.count).toBe(0);
    expect(cats.count).toBe(0);
  });
}); 
