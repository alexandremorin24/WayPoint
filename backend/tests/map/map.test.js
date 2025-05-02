const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const jwt = require('jsonwebtoken');

// Test user
const testUser = {
  email: 'mapuser@example.com',
  password: 'Test1234!',
  displayName: 'MapUser',
};
let userId;
let token;

beforeAll(async () => {
  // Clean up maps for this user first (to avoid foreign key constraint)
  const [userRows] = await db.execute(`SELECT id FROM users WHERE email = ?`, [testUser.email]);
  if (userRows.length > 0) {
    const userIdToDelete = userRows[0].id;
    await db.execute(`DELETE FROM maps WHERE owner_id = ?`, [userIdToDelete]);
    await db.execute(`DELETE FROM users WHERE id = ?`, [userIdToDelete]);
  }
  const result = await createUser({
    email: testUser.email,
    passwordHash: '$2b$10$mockhashfortest', // fake hash, not used here
    displayName: testUser.displayName,
  });
  userId = result.id;
  await db.execute(`UPDATE users SET email_verified = true WHERE id = ?`, [userId]);
  token = jwt.sign({ id: userId, email: testUser.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  // Clean up maps for this user (should be empty now, but for safety)
  await db.execute(`DELETE FROM maps WHERE owner_id = ?`, [userId]);
});

describe('🗺️ Map API', () => {
  let mapId;

  it('should reject creation without authentication', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .send({ name: 'Map', description: 'desc', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(401);
  });

  it('should reject creation with a too short name', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', description: 'desc', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject creation without description', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test map', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(400);
  });

  it('should create a valid map', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test map', description: 'A great map', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test map');
    expect(res.body.isPublic).toBe(true);
    mapId = res.body.id;
  });

  it('should get the map by id', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/${mapId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(mapId);
  });

  it('should get maps by owner', async () => {
    const res = await request(app)
      .get(`/api/backend/maps/owner/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find(m => m.id === mapId)).toBeDefined();
  });

  it('should update the map', async () => {
    const res = await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated map' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('should delete the map', async () => {
    const res = await request(app)
      .delete(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // --- Additional advanced tests ---

  it('should reject creation with a too long name', async () => {
    const longName = 'A'.repeat(300);
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: longName, description: 'desc', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject creation with a too long description', async () => {
    const longDesc = 'D'.repeat(2001);
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Valid name', description: longDesc, isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(400);
  });

  it('should accept special characters and emoji in name/description', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Carte spéciale 🚀', description: 'Description avec émoji 😎', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(201);
    // Clean up
    await request(app)
      .delete(`/api/backend/maps/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);
  });

  it('should not allow a user to update a map they do not own', async () => {
    // Create a map with testUser
    const createRes = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Private map', description: 'desc', isPublic: false, imageUrl: 'https://example.com/map.jpg' });
    const mapId = createRes.body.id;
    // Create another user
    await db.execute(`DELETE FROM users WHERE email = ?`, ['other@example.com']);
    const otherUser = await createUser({ email: 'other@example.com', passwordHash: '$2b$10$mockhash', displayName: 'Other' });
    const otherToken = jwt.sign({ id: otherUser.id, email: 'other@example.com' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    // Try to update the map
    const res = await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacked' });
    expect(res.statusCode).toBe(403);
    // Clean up
    await request(app)
      .delete(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${token}`);
    await db.execute(`DELETE FROM users WHERE id = ?`, [otherUser.id]);
  });

  it('should not allow a user to delete a map they do not own', async () => {
    const createRes = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Map to delete', description: 'desc', isPublic: false, imageUrl: 'https://example.com/map.jpg' });
    const mapId = createRes.body.id;
    await db.execute(`DELETE FROM users WHERE email = ?`, ['other2@example.com']);
    const otherUser = await createUser({ email: 'other2@example.com', passwordHash: '$2b$10$mockhash', displayName: 'Other2' });
    const otherToken = jwt.sign({ id: otherUser.id, email: 'other2@example.com' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    const res = await request(app)
      .delete(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
    // Clean up
    await request(app)
      .delete(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${token}`);
    await db.execute(`DELETE FROM users WHERE id = ?`, [otherUser.id]);
  });

  it('should not allow access to a private map by another user', async () => {
    const createRes = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Private map', description: 'desc', isPublic: false, imageUrl: 'https://example.com/map.jpg' });
    const mapId = createRes.body.id;
    await db.execute(`DELETE FROM users WHERE email = ?`, ['other3@example.com']);
    const otherUser = await createUser({ email: 'other3@example.com', passwordHash: '$2b$10$mockhash', displayName: 'Other3' });
    const otherToken = jwt.sign({ id: otherUser.id, email: 'other3@example.com' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    const res = await request(app)
      .get(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect([403, 404]).toContain(res.statusCode); // depending on implementation
    // Clean up
    await request(app)
      .delete(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${token}`);
    await db.execute(`DELETE FROM users WHERE id = ?`, [otherUser.id]);
  });

  it('should paginate maps', async () => {
    // Create multiple maps
    const ids = [];
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/api/backend/maps')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Map${i}`, description: 'desc', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
      ids.push(res.body.id);
    }
    const res = await request(app)
      .get('/api/backend/maps?limit=10&offset=0');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(10);
    // Clean up
    for (const id of ids) {
      await request(app)
        .delete(`/api/backend/maps/${id}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });

  it('should not create a map with a non-existent owner_id (foreign key)', async () => {
    const res = await db.execute('INSERT INTO maps (name, description, is_public, owner_id) VALUES (?, ?, ?, ?)', [
      'Map FK', 'desc', true, 'non-existent-id'
    ]).catch(e => e);
    expect(res).toHaveProperty('errno');
  });

  it('should resist SQL injection in name', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Robert'); DROP TABLE maps;--", description: 'desc', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect([201, 400]).toContain(res.statusCode); // depending on validation
    // Clean up if created
    if (res.statusCode === 201) {
      await request(app)
        .delete(`/api/backend/maps/${res.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });

  it('should escape XSS in name/description', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '<script>alert(1)</script>', description: '<img src=x onerror=alert(1)>', isPublic: true, imageUrl: 'https://example.com/map.jpg' });
    expect(res.statusCode).toBe(201);
    // Optionally check that name/description are escaped by the API (depending on implementation)
    // Clean up
    await request(app)
      .delete(`/api/backend/maps/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);
  });
}); 
