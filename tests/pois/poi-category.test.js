const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { createTestImage, getTestImagePath } = require('../utils/test-utils');
const fs = require('fs');

// Test data
const testGame = 'POICategoryTestGame';

describe('📍 POI-Category Integration', () => {
  let owner, viewer;
  let tokenOwner, tokenViewer;
  let mapId;
  let categoryId;
  let poiId;

  beforeAll(async () => {
    // Create test users
    owner = {
      id: uuidv4(),
      email: 'owner@test.com',
      password: 'password123',
      display_name: 'Owner User'
    };
    viewer = {
      id: uuidv4(),
      email: 'viewer@test.com',
      password: 'password123',
      display_name: 'Viewer User'
    };

    // Hash passwords
    const ownerPasswordHash = await bcrypt.hash(owner.password, 10);
    const viewerPasswordHash = await bcrypt.hash(viewer.password, 10);

    // Insert users
    await db.execute(
      'INSERT INTO users (id, email, password_hash, display_name, email_verified, auth_provider) VALUES (?, ?, ?, ?, 1, ?)',
      [owner.id, owner.email, ownerPasswordHash, owner.display_name, 'local']
    );
    await db.execute(
      'INSERT INTO users (id, email, password_hash, display_name, email_verified, auth_provider) VALUES (?, ?, ?, ?, 1, ?)',
      [viewer.id, viewer.email, viewerPasswordHash, viewer.display_name, 'local']
    );

    // Create test game
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // Get tokens
    const resOwner = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: owner.email, password: owner.password });
    tokenOwner = resOwner.body.token;

    const resViewer = await request(app)
      .post('/api/backend/auth/login')
      .send({ email: viewer.email, password: viewer.password });
    tokenViewer = resViewer.body.token;

    // Create a test map
    const imagePath = await getTestImagePath('test-image');
    const mapRes = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Test Map')
      .field('description', 'A test map')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .field('imageWidth', '300')
      .field('imageHeight', '300')
      .attach('image', imagePath);

    expect(mapRes.statusCode).toBe(201);
    mapId = mapRes.body.id;
    expect(mapId).toBeDefined();

    // Clean up test image
    try {
      await fs.promises.unlink(imagePath);
    } catch (err) {
      // Ignore errors if file doesn't exist
    }

    // Set up map roles
    await db.execute(
      'INSERT INTO map_user_roles (map_id, user_id, role) VALUES (?, ?, ?)',
      [mapId, viewer.id, 'viewer']
    );

    // Create a test category
    const categoryRes = await request(app)
      .post(`/api/backend/maps/${mapId}/categories`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Test Category',
        color: '#2196f3',
        icon: 'default-icon'
      });

    expect(categoryRes.statusCode).toBe(201);
    categoryId = categoryRes.body.id;
  });

  afterAll(async () => {
    // Clean up
    if (mapId) {
      await db.execute('DELETE FROM pois WHERE map_id = ?', [mapId]);
      await db.execute('DELETE FROM categories WHERE map_id = ?', [mapId]);
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);
      await db.execute('DELETE FROM maps WHERE id = ?', [mapId]);
    }
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
    await db.execute('DELETE FROM users WHERE id IN (?, ?)', [owner.id, viewer.id]);
  });

  describe('Create POI with Category', () => {
    it('should create a POI with a category', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Test POI with Category',
          description: 'A test POI with category',
          x: 100,
          y: 100,
          categoryId: categoryId
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test POI with Category');
      expect(res.body.categoryId).toBe(categoryId);
      expect(res.body.icon).toBe('default-icon');
      expect(res.body.color).toBe('#2196f3');
      expect(res.body.categoryName).toBe('Test Category');
      poiId = res.body.id;
    });

    it('should fail to create a POI without a category', async () => {
      const res = await request(app)
        .post(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Test POI without Category',
          description: 'A test POI without category',
          x: 200,
          y: 200
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/categoryId is required/);
    });
  });

  describe('Get POIs with Categories', () => {
    it('should get all POIs with their categories', async () => {
      const res = await request(app)
        .get(`/api/backend/pois/map/${mapId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Find the POI with category
      const poiWithCategory = res.body.find(p => p.categoryId === categoryId);
      expect(poiWithCategory).toBeDefined();
      expect(poiWithCategory.icon).toBe('default-icon');
      expect(poiWithCategory.color).toBe('#2196f3');
      expect(poiWithCategory.categoryName).toBe('Test Category');
    });

    it('should get POIs by category', async () => {
      const res = await request(app)
        .get(`/api/backend/pois/category/${categoryId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].categoryId).toBe(categoryId);
      expect(res.body[0].icon).toBe('default-icon');
      expect(res.body[0].color).toBe('#2196f3');
    });
  });

  describe('Update POI Category', () => {
    it('should update a POI\'s category', async () => {
      // Create a new category
      const newCategoryRes = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'New Category',
          color: '#2196f3',
          icon: 'default-icon'
        });

      // Update POI with new category
      const res = await request(app)
        .put(`/api/backend/pois/${poiId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          categoryId: newCategoryRes.body.id
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.categoryId).toBe(newCategoryRes.body.id);
      expect(res.body.icon).toBe('default-icon');
      expect(res.body.color).toBe('#2196f3');
      expect(res.body.categoryName).toBe('New Category');
    });

    it('should reject removing a POI\'s category', async () => {
      const res = await request(app)
        .put(`/api/backend/pois/${poiId}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          categoryId: null
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/categoryId is required/);
    });
  });
}); 
