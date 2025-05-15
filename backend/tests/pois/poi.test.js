const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Test data
const testGame = 'POITestGame';
const ownerEmail = 'owner-poi@example.com';
const editorEmail = 'editor-poi@example.com';
const viewerEmail = 'viewer-poi@example.com';
const strangerEmail = 'stranger-poi@example.com';

describe('📍 POI Management', () => {
  let owner, editor, viewer, stranger;
  let tokenOwner, tokenEditor, tokenViewer, tokenStranger;
  let mapId;
  let testPOI;

  beforeAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM poi_logs WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM poi_user_stats WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM pois WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['POI Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);

    // Create test game
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // Create test users
    owner = await createUser({ email: ownerEmail, passwordHash: 'hash', displayName: 'Owner' });
    editor = await createUser({ email: editorEmail, passwordHash: 'hash', displayName: 'Editor' });
    viewer = await createUser({ email: viewerEmail, passwordHash: 'hash', displayName: 'Viewer' });
    stranger = await createUser({ email: strangerEmail, passwordHash: 'hash', displayName: 'Stranger' });

    // Generate tokens
    tokenOwner = jwt.sign({ id: owner.id, email: ownerEmail }, process.env.JWT_SECRET, { expiresIn: '2h' });
    tokenEditor = jwt.sign({ id: editor.id, email: editorEmail }, process.env.JWT_SECRET, { expiresIn: '2h' });
    tokenViewer = jwt.sign({ id: viewer.id, email: viewerEmail }, process.env.JWT_SECRET, { expiresIn: '2h' });
    tokenStranger = jwt.sign({ id: stranger.id, email: strangerEmail }, process.env.JWT_SECRET, { expiresIn: '2h' });

    // Create test map
    const imagePath = await createTestImage('poi-test-image');
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'POI Test Map')
      .field('description', 'A map for testing POIs')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .field('imageWidth', '300')
      .field('imageHeight', '300')
      .attach('image', imagePath);

    expect(res.statusCode).toBe(201);
    mapId = res.body.id;

    // Add editor role
    await request(app)
      .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ role: 'editor_all' });

    // Add viewer role
    await request(app)
      .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ role: 'viewer' });

    // Create test POI
    const createRes = await request(app)
      .post(`/api/backend/pois/map/${mapId}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Test POI',
        description: 'A test POI',
        x: 100,
        y: 100,
        icon: 'test-icon',
        categoryId: null
      });

    expect(createRes.statusCode).toBe(201);
    testPOI = createRes.body;

    // Make sure the map is public for testing
    await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ isPublic: true });

    // Clean up test image
    try {
      await fs.promises.unlink(imagePath);
    } catch (err) {
      // Ignore errors if file doesn't exist
    }
  });

  afterAll(async () => {
    // Final cleanup
    await db.execute('DELETE FROM poi_logs WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM poi_user_stats WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM pois WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['POI Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['POI Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
  });

  describe('Create POI', () => {
    it('should create a POI with valid data', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Test POI',
          description: 'A test POI',
          x: 100,
          y: 100,
          icon: 'test-icon',
          categoryId: null
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test POI');
      expect(res.body.x).toBe(100);
      expect(res.body.y).toBe(100);
      testPOI = res.body;
    });

    it('should reject POI creation with invalid coordinates', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Invalid POI',
          description: 'A POI with invalid coordinates',
          x: -1,
          y: 1000,
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/coordinate/i);
    });

    it('should reject POI creation with missing required fields', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          description: 'Missing name and coordinates',
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should reject POI creation by unauthorized user', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenStranger}`)
        .send({
          name: 'Unauthorized POI',
          x: 100,
          y: 100
        });

      expect(res.statusCode).toBe(403);
    });

    it('should create a POI with decimal coordinates', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Decimal POI',
          x: 123.456,
          y: 45.6789
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.x).toBeCloseTo(123.46, 2);
      expect(res.body.y).toBeCloseTo(45.68, 2);
    });
  });

  describe('Get POI', () => {
    it('should get a POI by ID', async () => {
      const res = await request(app)
        .get(`/api/backend/pois/${testPOI.id}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testPOI.id);
    });

    it('should get all POIs for a map', async () => {
      const res = await request(app)
        .get(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should reject access to POI by unauthorized user', async () => {
      const res = await request(app)
        .get(`/api/backend/pois/${testPOI.id}`)
        .set('Authorization', `Bearer ${tokenStranger}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Update POI', () => {
    it('should update a POI with valid data', async () => {
      // Create a new POI as editor
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Editor POI',
          x: 100,
          y: 100
        });

      expect(createRes.statusCode).toBe(201);
      const editorPOI = createRes.body;

      const res = await request(app)
        .put(`/api/backend/pois/${editorPOI.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Updated POI',
          description: 'An updated test POI',
          x: 150,
          y: 150
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated POI');
      expect(res.body.x).toBe(150);
      expect(res.body.y).toBe(150);
    });

    it('should reject POI update with invalid coordinates', async () => {
      // Create a new POI as editor
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Invalid Coordinates POI',
          x: 100,
          y: 100
        });

      expect(createRes.statusCode).toBe(201);
      const editorPOI = createRes.body;

      const res = await request(app)
        .put(`/api/backend/pois/${editorPOI.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          x: -1,
          y: 1000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/coordinate/i);
    });

    it('should reject POI update by unauthorized user', async () => {
      const res = await request(app)
        .put(`/api/backend/pois/${testPOI.id}`)
        .set('Authorization', `Bearer ${tokenStranger}`)
        .send({
          name: 'Unauthorized Update'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should update a POI with decimal coordinates', async () => {
      // Create a new POI as editor
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Editor POI Dec',
          x: 10,
          y: 10
        });
      expect(createRes.statusCode).toBe(201);
      const editorPOI = createRes.body;
      const res = await request(app)
        .put(`/api/backend/pois/${editorPOI.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          x: 300,
          y: 300
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.x).toBe(300);
      expect(res.body.y).toBe(300);
    });
  });

  describe('Delete POI', () => {
    it('should delete a POI', async () => {
      // Create a new POI for deletion test
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'POI to Delete',
          x: 100,
          y: 100
        });

      const res = await request(app)
        .delete(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it('should reject POI deletion by unauthorized user', async () => {
      // Create a new POI for this test
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'POI to Delete',
          x: 100,
          y: 100
        });

      const res = await request(app)
        .delete(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenStranger}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POI Categories', () => {
    let categoryId;

    beforeAll(async () => {
      // Create a test category
      const categoryUuid = uuidv4();
      await db.execute(
        'INSERT INTO categories (id, name, map_id) VALUES (?, ?, ?)',
        [categoryUuid, 'Test Category', mapId]
      );
      categoryId = categoryUuid;
    });

    afterAll(async () => {
      await db.execute('DELETE FROM categories WHERE map_id = ?', [mapId]);
    });

    it('should create a POI with a category', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Categorized POI',
          x: 100,
          y: 100,
          categoryId: categoryId
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.categoryId).toBe(categoryId);
    });

    it('should get POIs by category', async () => {
      // Create a POI with category first
      await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Categorized POI for List',
          x: 100,
          y: 100,
          categoryId: categoryId
        });

      const res = await request(app)
        .get(`/api/backend/pois/category/${categoryId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].categoryId).toBe(categoryId);
    });
  });

  describe('POI User Stats', () => {
    it('should track user stats when creating a POI', async () => {
      // Clean up any existing stats
      await db.execute('DELETE FROM poi_user_stats WHERE user_id = ? AND map_id = ?', [editor.id, mapId]);

      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Stats Test POI',
          x: 100,
          y: 100
        });

      expect(res.statusCode).toBe(201);

      const [stats] = await db.execute(
        'SELECT * FROM poi_user_stats WHERE user_id = ? AND map_id = ?',
        [editor.id, mapId]
      );

      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0].poi_created_count).toBeGreaterThan(0);
    });
  });

  describe('POI Logs', () => {
    it('should create a log entry when creating a POI', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Log Test POI',
          x: 100,
          y: 100
        });

      expect(res.statusCode).toBe(201);

      const [logs] = await db.execute(
        'SELECT * FROM poi_logs WHERE poi_id = ?',
        [res.body.id]
      );

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('create');
      expect(logs[0].user_id).toBe(owner.id);
    });

    it('should create a log entry when updating a POI', async () => {
      const updateRes = await request(app)
        .put(`/api/backend/pois/${testPOI.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Updated POI for Log Test'
        });

      expect(updateRes.statusCode).toBe(200);

      const [logs] = await db.execute(
        'SELECT * FROM poi_logs WHERE poi_id = ? ORDER BY timestamp DESC',
        [testPOI.id]
      );

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe('update');
    });
  });

  describe('POI Permissions', () => {
    it('should allow editor_own to edit their own POIs', async () => {
      // Add editor_own role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_own' });

      // Create a POI as editor
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Editor Own POI',
          x: 100,
          y: 100
        });

      expect(createRes.statusCode).toBe(201);
      const editorPOI = createRes.body;

      // Update the POI
      const updateRes = await request(app)
        .put(`/api/backend/pois/${editorPOI.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Updated Editor Own POI'
        });

      expect(updateRes.statusCode).toBe(200);
    });

    it('should allow contributor to create POIs', async () => {
      // Add contributor role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'contributor' });

      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenViewer}`)
        .send({
          name: 'Contributor POI',
          x: 100,
          y: 100
        });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('POI Coordinate Validation', () => {
    it('should reject POI creation with coordinates outside map bounds', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Invalid Coordinates POI',
          x: 1000,
          y: 1000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/coordinate/i);
    });

    it('should reject POI update with coordinates outside map bounds', async () => {
      // Create a new POI for this test
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Valid POI',
          x: 100,
          y: 100
        });

      const updateRes = await request(app)
        .put(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          x: 301,
          y: 301
        });

      expect(updateRes.statusCode).toBe(400);
      expect(updateRes.body.error).toMatch(/coordinate/i);
    });
  });

  describe('Partial POI Updates', () => {
    beforeAll(async () => {
      // Ensure editor has all permissions
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });
    });

    it('should allow updating only specific fields', async () => {
      // Create a new POI for this test
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Partial Update POI',
          description: 'Original description',
          x: 100,
          y: 100,
          icon: 'original-icon'
        });

      const updateRes = await request(app)
        .put(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Updated Name Only'
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name Only');

      // Get the updated POI to verify other fields
      const getRes = await request(app)
        .get(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.description).toBe('Original description');
      expect(getRes.body.icon).toBe('original-icon');
    });

    it('should handle null values in updates', async () => {
      // Create a new POI for this test
      const createRes = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Null Update POI',
          description: 'Original description',
          x: 100,
          y: 100,
          icon: 'original-icon'
        });

      const updateRes = await request(app)
        .put(`/api/backend/pois/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          description: null,
          icon: null
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.description).toBeNull();
      expect(updateRes.body.icon).toBeNull();
    });
  });
});

// Helper function to create test image
async function createTestImage(name) {
  const imagePath = path.join(__dirname, `${name}.png`);
  await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .png()
    .toFile(imagePath);
  return imagePath;
} 
