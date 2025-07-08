const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Generate a valid test image before all tests
const testImagePath = path.join(__dirname, 'test-image.png');
let user;
let token;

beforeAll(async () => {
  // Delete in correct order to respect foreign key constraints
  await db.execute('DELETE FROM maps WHERE owner_id IN (SELECT id FROM users WHERE email = ?)', ['mapcreator@example.com']);
  await db.execute('DELETE FROM users WHERE email = ?', ['mapcreator@example.com']);
  const result = await createUser({
    email: 'mapcreator@example.com',
    passwordHash: 'mockhash123',
    displayName: 'MapCreator'
  });
  user = result;
  token = generateToken(user);
});

afterAll(async () => {
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
});

// Utility to generate a JWT token
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('🗺️ POST /api/backend/maps (create map)', () => {
  beforeEach(async () => {
    // Generate a valid 300x300 PNG image before each test
    await sharp({ create: { width: 300, height: 300, channels: 3, background: 'white' } })
      .png()
      .toFile(testImagePath);
    await fs.promises.access(testImagePath);
  });

  it('should reject unauthenticated requests', async () => {
    expect(fs.existsSync(testImagePath)).toBe(true);
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
      .attach('image', testImagePath);
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
      .attach('image', testImagePath);
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
      .attach('image', testImagePath);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Map name is required/i);
  });

  it('should reject map creation if description is too long', async () => {
    const longDesc = 'A'.repeat(121); // Description longer than 120 characters
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Valid Name')
      .field('description', longDesc)
      .field('gameName', 'Test Game')
      .field('isPublic', 'true')
      .attach('image', testImagePath);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Description must be a string.*max 120 characters/i);
  });

  it('should reject map creation if gameName is missing', async () => {
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Valid Name')
      .field('description', 'desc')
      .field('isPublic', 'true')
      .attach('image', testImagePath);
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
      .attach('image', testImagePath);
    expect([401, 403]).toContain(res.statusCode);
  });

}); 
