const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser } = require('../../src/models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

describe('🔐 PUT /api/backend/me', () => {
  const testUser = {
    id: null,
    email: 'meupdate@example.com',
    password: 'Test1234!',
    displayName: 'MeUpdate',
  };

  const otherUser = {
    id: null,
    email: 'other@example.com',
    password: 'Test1234!',
    displayName: 'OtherUser',
  };

  let validToken = null;
  const uploadsDir = path.join(__dirname, '../../../public/uploads/avatars');
  const testFilesDir = path.join(__dirname, 'test-files');

  beforeAll(async () => {
    // Clean up test users
    await db.execute(`DELETE FROM users WHERE email IN (?, ?)`, [testUser.email, otherUser.email]);

    // Create test users
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    const otherPasswordHash = await bcrypt.hash(otherUser.password, 10);

    const result = await createUser({
      email: testUser.email.toLowerCase(),
      passwordHash,
      displayName: testUser.displayName,
    });
    testUser.id = result.id;

    const otherResult = await createUser({
      email: otherUser.email.toLowerCase(),
      passwordHash: otherPasswordHash,
      displayName: otherUser.displayName,
    });
    otherUser.id = otherResult.id;

    // Set email_verified to true for both users
    await db.execute(
      `UPDATE users SET email_verified = true WHERE id IN (?, ?)`,
      [testUser.id, otherUser.id]
    );

    // Create a valid JWT token
    validToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email.toLowerCase()
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir);
    }

    // 1. Text file (should be rejected)
    fs.writeFileSync(path.join(testFilesDir, 'test.txt'), 'This is a test file.\nIt should be rejected by the avatar upload endpoint.');

    // 2. Large image (should be rejected)
    await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(path.join(testFilesDir, 'large.png'));

    // 3. Valid test avatar (400x400)
    await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(path.join(testFilesDir, 'test-avatar.png'));
  });

  afterAll(async () => {
    // Clean up test users
    await db.execute(`DELETE FROM users WHERE email IN (?, ?)`, [testUser.email, otherUser.email]);

    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  describe('Authentication', () => {
    it('should reject without authorization header', async () => {
      const res = await request(app).put('/api/backend/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/authorization/i);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  describe('Email Update', () => {
    it('should reject email update without current password', async () => {
      const uniqueEmail = `newemail_${Date.now()}@example.com`;
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ email: uniqueEmail });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/current password required/i);
    });

    it('should reject email update with incorrect current password', async () => {
      const uniqueEmail = `newemail_${Date.now()}@example.com`;
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          email: uniqueEmail,
          currentPassword: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/current password is incorrect/i);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          email: 'invalid-email',
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid email format/i);
    });

    it('should reject email already in use', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          email: otherUser.email,
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/email already in use/i);
    });

    it('should successfully update email', async () => {
      const uniqueEmail = `newemail_${Date.now()}@example.com`;
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          email: uniqueEmail,
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);

      // Verify the update in database
      const [rows] = await db.execute('SELECT email FROM users WHERE id = ?', [testUser.id]);
      expect(rows[0].email).toBe(uniqueEmail.toLowerCase());

      // Update token with new email
      validToken = jwt.sign(
        {
          id: testUser.id,
          email: uniqueEmail.toLowerCase()
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );
    });
  });

  describe('Password Update', () => {
    it('should reject password update without current password', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/current password required/i);
    });

    it('should reject password update with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
          currentPassword: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/current password is incorrect/i);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'weak',
          confirmPassword: 'weak',
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/password must be at least 8 characters/i);
    });

    it('should reject non-matching passwords', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/passwords do not match/i);
    });

    it('should successfully update password', async () => {
      const newPassword = 'NewPassword123!';
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          newPassword,
          confirmPassword: newPassword,
          currentPassword: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);

      // Retrieve the updated email before login
      const [rows] = await db.execute('SELECT email FROM users WHERE id = ?', [testUser.id]);
      const currentEmail = rows[0].email;

      // Ensure email is verified before login
      await db.execute('UPDATE users SET email_verified = true WHERE id = ?', [testUser.id]);

      // Verify we can login with new password
      const loginRes = await request(app)
        .post('/api/backend/login')
        .send({
          email: currentEmail,
          password: newPassword
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });
  });

  describe('Language and Opt-in Update', () => {
    it('should successfully update preferred language', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ preferredLanguage: 'fr' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);

      // Verify the update in database
      const [rows] = await db.execute('SELECT preferred_language FROM users WHERE id = ?', [testUser.id]);
      expect(rows[0].preferred_language).toBe('fr');
    });

    it('should successfully update email opt-in', async () => {
      const res = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ emailOptin: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);

      // Verify the update in database
      const [rows] = await db.execute('SELECT email_optin FROM users WHERE id = ?', [testUser.id]);
      expect(rows[0].email_optin).toBe(1);
    });
  });

  describe('Avatar Upload', () => {
    it('should reject non-image file', async () => {
      const res = await request(app)
        .put('/api/backend/me/avatar')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('avatar', path.join(testFilesDir, 'test.txt'));

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid image file/i);
    });

    it('should reject image that is too large', async () => {
      const res = await request(app)
        .put('/api/backend/me/avatar')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('avatar', path.join(testFilesDir, 'large.png'));

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/image is too large/i);
    });

    it('should successfully upload and process avatar', async () => {
      const res = await request(app)
        .put('/api/backend/me/avatar')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('avatar', path.join(testFilesDir, 'test-avatar.png'));

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/uploaded successfully/i);

      // Debug: log the photoUrl and filepath
      const photoUrl = res.body.photoUrl;
      const filepath = path.join(__dirname, '../../public', photoUrl);
      console.log('[DEBUG] photoUrl returned by API:', photoUrl);
      console.log('[DEBUG] resolved filepath:', filepath);
      expect(fs.existsSync(filepath)).toBe(true);

      // Verify the image is a WebP
      const metadata = await sharp(filepath).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBe(200);
      expect(metadata.height).toBe(200);
    });
  });

  describe('Multiple Updates', () => {
    it('should successfully update multiple fields at once', async () => {
      // 1. Update text fields
      const res1 = await request(app)
        .put('/api/backend/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ preferredLanguage: 'en', emailOptin: false });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.message).toMatch(/updated successfully/i);

      // 2. Update avatar
      const res2 = await request(app)
        .put('/api/backend/me/avatar')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('avatar', path.join(testFilesDir, 'test-avatar.png'));

      expect(res2.statusCode).toBe(200);
      expect(res2.body.message).toMatch(/uploaded successfully/i);

      // Verify in database
      const [rows] = await db.execute(
        'SELECT preferred_language, email_optin, photo_url FROM users WHERE id = ?',
        [testUser.id]
      );
      expect(rows[0].preferred_language).toBe('en');
      expect(rows[0].email_optin).toBe(0);
      expect(rows[0].photo_url).toMatch(/\/uploads\/avatars\/.*\.webp$/);
    });
  });
}); 
