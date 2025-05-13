const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const path = require('path');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const fs = require('fs');

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

describe('🗺️ PUT/DELETE /api/backend/maps/:id (update/delete map)', () => {
  let owner, editor, stranger, mapId, tokenOwner, tokenEditor, tokenStranger;
  const testGame = 'UpdateDeleteTestGame';

  beforeAll(async () => {
    // Delete in correct order to respect foreign key constraints
    await db.execute('DELETE FROM maps WHERE owner_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))', [
      'owner2@example.com', 'editor2@example.com', 'stranger2@example.com'
    ]);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?)', [
      'owner2@example.com', 'editor2@example.com', 'stranger2@example.com'
    ]);
    owner = await createUser({ email: 'owner2@example.com', passwordHash: 'hash', displayName: 'Owner2' });
    editor = await createUser({ email: 'editor2@example.com', passwordHash: 'hash', displayName: 'Editor2' });
    stranger = await createUser({ email: 'stranger2@example.com', passwordHash: 'hash', displayName: 'Stranger2' });
    tokenOwner = generateToken(owner);
    tokenEditor = generateToken(editor);
    tokenStranger = generateToken(stranger);

    // Create a private map
    const testImagePath = await createTestImage('test-image-1');
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Map to Update')
      .field('description', 'desc')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', testImagePath);
    mapId = res.body.id;

  });

  it('should allow the owner to update the map', async () => {
    const res = await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('should deny update to editor', async () => {
    const res = await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${tokenEditor}`)
      .send({ name: 'Editor Update' });
    expect(res.statusCode).toBe(403);
  });

  it('should deny update to stranger', async () => {
    const res = await request(app)
      .put(`/api/backend/maps/${mapId}`)
      .set('Authorization', `Bearer ${tokenStranger}`)
      .send({ name: 'Stranger Update' });
    expect(res.statusCode).toBe(403);
  });


  it('should deny delete to editor', async () => {
    // recreate the map for this test
    const testImagePath = await createTestImage('test-image-2');
    const resCreate = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Map to Delete')
      .field('description', 'desc')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', testImagePath);
    const newMapId = resCreate.body.id;
    const res = await request(app)
      .delete(`/api/backend/maps/${newMapId}`)
      .set('Authorization', `Bearer ${tokenEditor}`);
    expect(res.statusCode).toBe(403);
  });

  it('should deny delete to stranger', async () => {
    // recreate the map for this test
    const testImagePath = await createTestImage('test-image-3');
    const resCreate = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Map to Delete')
      .field('description', 'desc')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', testImagePath);
    const newMapId = resCreate.body.id;
    const res = await request(app)
      .delete(`/api/backend/maps/${newMapId}`)
      .set('Authorization', `Bearer ${tokenStranger}`);
    expect(res.statusCode).toBe(403);
  });

  afterAll(async () => {
    // Clean up test images
    const testImages = ['test-image-1.png', 'test-image-2.png', 'test-image-3.png'];
    for (const image of testImages) {
      try {
        await fs.promises.unlink(path.join(__dirname, image));
      } catch (err) {
        // Ignore errors if files don't exist
      }
    }
  });
}); 
