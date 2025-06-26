const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { getTestImagePath } = require('../utils/test-utils');

// Test data
const testGame = 'CategoryTestGame';
const ownerEmail = 'owner-category@example.com';
const editorEmail = 'editor-category@example.com';
const viewerEmail = 'viewer-category@example.com';
const strangerEmail = 'stranger-category@example.com';

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

describe('🏷️ Category Management', () => {
  let owner, editor, viewer, stranger;
  let tokenOwner, tokenEditor, tokenViewer, tokenStranger;
  let mapId;
  let testCategory;
  let testImagePath;

  beforeAll(async () => {
    // Clean up test data (disable FK checks temporarily)
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DELETE FROM categories WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Category Test Map']);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Category Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Category Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

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
    const testImagePath = await getTestImagePath('test-image');
    const mapRes = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Test Map')
      .field('description', 'A test map')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .field('imageWidth', '300')
      .field('imageHeight', '300')
      .attach('image', testImagePath);

    expect(mapRes.statusCode).toBe(201);
    mapId = mapRes.body.id;

    // Add roles
    await request(app)
      .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ role: 'editor' });

    await request(app)
      .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ role: 'viewer' });

    // Create test category
    const createRes = await request(app)
      .post(`/api/backend/maps/${mapId}/categories`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        name: 'Test Category',
        color: '#3498db',
        icon: 'test-icon'
      });

    expect(createRes.statusCode).toBe(201);
    testCategory = createRes.body;
  });

  afterAll(async () => {
    // Clean up test image
    if (testImagePath) {
      try {
        await fs.promises.unlink(testImagePath);
      } catch (err) {
        // Ignore errors if file doesn't exist
      }
    }

    // Final cleanup (disable FK checks temporarily)
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DELETE FROM categories WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Category Test Map']);
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Category Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Category Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('Create Category', () => {
    it('should create a category as owner', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Owner Category',
          color: '#3498db',
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Owner Category');
    });

    it('should create a category as editor', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Editor Category',
          color: '#3498db',
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Editor Category');
    });

    it('should reject category creation as viewer', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenViewer}`)
        .send({
          name: 'Viewer Category',
          color: '#3498db',
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject category creation as stranger', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenStranger}`)
        .send({
          name: 'Stranger Category',
          color: '#3498db',
          icon: 'test-icon'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Update Category', () => {
    it('should update a category as owner', async () => {
      const res = await request(app)
        .put(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Updated Owner Category',
          color: '#e74c3c'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Owner Category');
      expect(res.body.color).toBe('#e74c3c');
    });

    it('should update a category as editor', async () => {
      const res = await request(app)
        .put(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Updated Editor Category',
          icon: 'new-icon'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Editor Category');
      expect(res.body.icon).toBe('new-icon');
    });

    it('should reject category update as viewer', async () => {
      const res = await request(app)
        .put(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenViewer}`)
        .send({
          name: 'Updated Viewer Category'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject category update as stranger', async () => {
      const res = await request(app)
        .put(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenStranger}`)
        .send({
          name: 'Updated Stranger Category'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Delete Category', () => {
    it('should delete a category as owner', async () => {
      // Create a category to delete
      const createRes = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Category to Delete',
          color: '#3498db',
          icon: 'test-icon'
        });

      const res = await request(app)
        .delete(`/api/backend/categories/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
    });

    it('should delete a category as editor', async () => {
      // Create a category to delete
      const createRes = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({
          name: 'Category to Delete',
          color: '#3498db',
          icon: 'test-icon'
        });

      const res = await request(app)
        .delete(`/api/backend/categories/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenEditor}`);

      expect(res.statusCode).toBe(200);
    });

    it('should reject category deletion as viewer', async () => {
      const res = await request(app)
        .delete(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(403);
    });

    it('should reject category deletion as stranger', async () => {
      const res = await request(app)
        .delete(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenStranger}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('View Categories', () => {
    it('should allow owner to view categories', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow editor to view categories', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenEditor}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow viewer to view categories', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenViewer}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject category viewing as stranger', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenStranger}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Parent Category Management', () => {
    let parentCategory;

    beforeAll(async () => {
      // Create a parent category
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Parent Category',
          color: '#3498db',
          icon: 'parent-icon'
        });

      expect(res.statusCode).toBe(201);
      parentCategory = res.body;
    });

    it('should create a category with parent', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Child Category',
          color: '#e74c3c',
          icon: 'child-icon',
          parentCategoryId: parentCategory.id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.parentCategoryId).toBe(parentCategory.id);
    });

    it('should reject invalid parent category', async () => {
      const res = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'Invalid Parent Category',
          color: '#e74c3c',
          icon: 'child-icon',
          parentCategoryId: 'invalid-uuid'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should update category parent', async () => {
      // Create a new parent category
      const newParentRes = await request(app)
        .post(`/api/backend/maps/${mapId}/categories`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          name: 'New Parent Category',
          color: '#2ecc71',
          icon: 'new-parent-icon'
        });

      const res = await request(app)
        .put(`/api/backend/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({
          parentCategoryId: newParentRes.body.id
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.parentCategoryId).toBe(newParentRes.body.id);
    });
  });

  test('should create category', async () => {
    const testImagePath = getTestImagePath('test-image');
    // ... existing code ...
  });
}); 
