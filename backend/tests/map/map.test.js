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
  await db.execute(`DELETE FROM users WHERE email = ?`, [testUser.email]);
  const result = await createUser({
    email: testUser.email,
    passwordHash: '$2b$10$mockhashfortest', // fake hash, not used here
    displayName: testUser.displayName,
  });
  userId = result.id;
  await db.execute(`UPDATE users SET email_verified = true WHERE id = ?`, [userId]);
  token = jwt.sign({ id: userId, email: testUser.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
  // Clean up maps
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
}); 
