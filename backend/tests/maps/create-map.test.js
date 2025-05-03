const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const path = require('path');
const jwt = require('jsonwebtoken');

// Utility to generate a JWT token
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('🗺️ POST /api/backend/maps (create map)', () => {
  let user;
  let token;
  const testEmail = 'mapcreator@example.com';

  beforeAll(async () => {
    // Delete in correct order to respect foreign key constraints
    await db.execute('DELETE FROM collaborations WHERE user_id IN (SELECT id FROM users WHERE email = ?)', [testEmail]);
    await db.execute('DELETE FROM maps WHERE owner_id IN (SELECT id FROM users WHERE email = ?)', [testEmail]);
    await db.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    const result = await createUser({
      email: testEmail,
      passwordHash: 'mockhash123',
      displayName: 'MapCreator'
    });
    user = result;
    token = generateToken(user);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .field('name', 'Test Map')
      .field('description', 'A test map')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Missing or invalid authorization header/i);
  });

  it('should reject if image is missing', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Map')
      .field('description', 'A test map')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Image is required/i);
  });

  it('should create a map with valid data and image', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Map')
      .field('description', 'A test map')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('gameId');
    expect(res.body).toHaveProperty('gameName', 'Test Game');
  });

  it('should reject map creation if name is too short', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'A')
      .field('description', 'desc')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Map name is required/i);
  });

  it('should reject map creation if name is too long', async () => {
    const longName = 'A'.repeat(101);
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', longName)
      .field('description', 'desc')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Map name is required/i);
  });

  it('should reject map creation if description is too long', async () => {
    const longDesc = 'A'.repeat(501);
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Valid Name')
      .field('description', longDesc)
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Description is required/i);
  });

  it('should reject map creation if gameName is missing', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Valid Name')
      .field('description', 'desc')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Game name is required/i);
  });

  it('should reject map creation with invalid token', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', 'Bearer invalid.token.here')
      .field('name', 'Valid Name')
      .field('description', 'desc')
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', path.join(__dirname, 'test-image.png'));
    expect([401, 403]).toContain(res.statusCode);
  });

  afterAll(async () => {
    await db.end();
  });
}); 
