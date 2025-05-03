const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const path = require('path');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('🗺️ GET /api/backend/maps/:id (access map)', () => {
  let owner, editor, stranger, publicMapId, privateMapId, tokenOwner, tokenEditor, tokenStranger;
  const testGame = 'AccessTestGame';

  beforeAll(async () => {
    // Create users
    // Delete in correct order to respect foreign key constraints
    await db.execute('DELETE FROM collaborations WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))', [
      'owner@example.com', 'editor@example.com', 'stranger@example.com'
    ]);
    await db.execute('DELETE FROM maps WHERE owner_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))', [
      'owner@example.com', 'editor@example.com', 'stranger@example.com'
    ]);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [
      'owner@example.com', 'editor@example.com', 'stranger@example.com'
    ]);
    owner = await createUser({ email: 'owner@example.com', passwordHash: 'hash', displayName: 'Owner' });
    editor = await createUser({ email: 'editor@example.com', passwordHash: 'hash', displayName: 'Editor' });
    stranger = await createUser({ email: 'stranger@example.com', passwordHash: 'hash', displayName: 'Stranger' });
    tokenOwner = generateToken(owner);
    tokenEditor = generateToken(editor);
    tokenStranger = generateToken(stranger);

    // Create a public map
    let res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Public Map')
      .field('description', 'A public map')
      .field('gameName', testGame)
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    publicMapId = res.body.id;

    // Create a private map
    res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Private Map')
      .field('description', 'A private map')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', path.join(__dirname, 'test-image.png'));
    privateMapId = res.body.id;

    // Add the editor as a collaborator (role editor)
    await db.execute(
      'INSERT INTO collaborations (id, user_id, map_id, role) VALUES (UUID(), ?, ?, ?)',
      [editor.id, privateMapId, 'editor']
    );
  });

  it('should allow access to a public map without authentication', async () => {
    const res = await request(app).get(`/api/backend/maps/${publicMapId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', publicMapId);
    expect(res.body.is_public).toBe(1);
  });

  it('should deny access to a private map without authentication', async () => {
    const res = await request(app).get(`/api/backend/maps/${privateMapId}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/private map/i);
  });

  it('should allow the owner to access a private map', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenOwner}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', privateMapId);
    expect(res.body.is_public).toBe(0);
  });

  it('should allow an editor to access a private map', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenEditor}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', privateMapId);
    expect(res.body.is_public).toBe(0);
  });

  it('should deny access to a private map for a stranger', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${privateMapId}`)
      .set('Authorization', `Bearer ${tokenStranger}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/private map/i);
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
    expect([401, 403]).toContain(res.statusCode);
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
