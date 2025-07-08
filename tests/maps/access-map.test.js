const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const path = require('path');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs');
const { getTestImagePath } = require('../utils/test-utils');

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

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

describe('🗺️ GET /api/backend/maps/:id (access map)', () => {
  let owner, editor, stranger, publicMapId, privateMapId, tokenOwner, tokenEditor, tokenStranger;
  const testGame = 'AccessTestGame';
  const ownerEmail = 'owner-access@example.com';
  const editorEmail = 'editor-access@example.com';
  const strangerEmail = 'stranger-access@example.com';

  beforeAll(async () => {
    // Targeted cleanup of test data
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name IN (?, ?))', ['Public Map', 'Private Map']);
    await db.execute('DELETE FROM maps WHERE name IN (?, ?)', ['Public Map', 'Private Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [
      ownerEmail, editorEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);

    // Game creation
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // User creation
    owner = await createUser({ email: ownerEmail, passwordHash: 'hash', displayName: 'Owner' });
    editor = await createUser({ email: editorEmail, passwordHash: 'hash', displayName: 'Editor' });
    stranger = await createUser({ email: strangerEmail, passwordHash: 'hash', displayName: 'Stranger' });
    tokenOwner = generateToken(owner);
    tokenEditor = generateToken(editor);
    tokenStranger = generateToken(stranger);

    // Public map creation
    const publicImagePath = await getTestImagePath('test-image');
    let res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Public Map')
      .field('description', 'A public map')
      .field('gameName', testGame)
      .field('isPublic', 'true')
      .attach('image', publicImagePath);
    publicMapId = res.body.id;

    // Private map creation
    const privateImagePath = await getTestImagePath('test-image');
    res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Private Map')
      .field('description', 'A private map')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', privateImagePath);
    privateMapId = res.body.id;

    // Add editor role
    await db.execute(
      'INSERT INTO map_user_roles (map_id, user_id, role) VALUES (?, ?, ?)',
      [privateMapId, editor.id, 'editor']
    );
  });

  afterAll(async () => {
    // Cleanup test images
    const testImages = ['public-test-image.png', 'private-test-image.png'];
    for (const image of testImages) {
      try {
        await fs.promises.unlink(path.join(__dirname, image));
      } catch (err) {
        // Ignore errors if files don't exist
      }
    }
    // Final targeted cleanup
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name IN (?, ?))', ['Public Map', 'Private Map']);
    await db.execute('DELETE FROM maps WHERE name IN (?, ?)', ['Public Map', 'Private Map']);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [
      ownerEmail, editorEmail, strangerEmail
    ]);
  });

  it('should allow access to a public map without authentication', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${publicMapId}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', publicMapId);
    expect(res.body.isPublic).toBe(true);
  });

  it('should deny access to a private map without authentication', async () => {
    await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .expect(401);
  });

  it('should allow the owner to access a private map', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', privateMapId);
    expect(res.body.isPublic).toBe(false);
  });

  it('should allow an editor to access a private map', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenEditor}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', privateMapId);
    expect(res.body.isPublic).toBe(false);
  });

  it('should deny access to a private map for a stranger', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenStranger}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/insufficient permissions/i);
  });

  it('should return 404 for a deleted map', async () => {
    // Delete the public map directly in DB
    await db.execute('DELETE FROM maps WHERE id = ?', [publicMapId]);
    const res = await request(app).get(`/api/backend/maps/${publicMapId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('should deny access with a malformed token', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', 'Bearer malformed.token');
    expect([401, 403, 404]).toContain(res.statusCode);
  });
});

describe('🗺️ GET /api/backend/maps (pagination)', () => {
  it('should return paginated public maps', async () => {
    const res = await request(app).get('/api/backend/maps?limit=2&offset=0');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(2);
  });
}); 
