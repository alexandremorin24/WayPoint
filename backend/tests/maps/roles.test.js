const request = require('supertest');
const app = require('../../app');
const db = require('../../src/utils/db');
const { createUser, updateUserEmailVerified } = require('../../src/models/UserModel');
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

describe('🗺️ Map Roles Management', () => {
  let owner, editor, viewer, stranger, mapId, tokenOwner, tokenEditor, tokenViewer, tokenStranger;
  const testGame = 'RolesTestGame';
  const ownerEmail = 'owner-roles@example.com';
  const editorEmail = 'editor-roles@example.com';
  const viewerEmail = 'viewer-roles@example.com';
  const strangerEmail = 'stranger-roles@example.com';

  beforeAll(async () => {
    // Targeted cleanup of test data
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Roles Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Roles Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);

    // Création du jeu
    await db.execute(
      'INSERT INTO games (id, name, slug) VALUES (?, ?, ?)',
      [testGame, testGame, testGame.toLowerCase()]
    );

    // Users creation with Email verified
    owner = await createUser({ email: ownerEmail, passwordHash: 'hash', displayName: 'Owner' });
    await updateUserEmailVerified(owner.id);

    editor = await createUser({ email: editorEmail, passwordHash: 'hash', displayName: 'Editor' });
    await updateUserEmailVerified(editor.id);

    viewer = await createUser({ email: viewerEmail, passwordHash: 'hash', displayName: 'Viewer' });
    await updateUserEmailVerified(viewer.id);

    stranger = await createUser({ email: strangerEmail, passwordHash: 'hash', displayName: 'Stranger' });
    await updateUserEmailVerified(stranger.id);

    tokenOwner = generateToken(owner);
    tokenEditor = generateToken(editor);
    tokenViewer = generateToken(viewer);
    tokenStranger = generateToken(stranger);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    // Complete cleanup before each test
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Roles Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Roles Test Map']);

    // Clean up uploads directory
    const uploadsDir = path.join(__dirname, '../../../public/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }
    }

    // Recreate the map for each test
    const imagePath = await getTestImagePath('test-image');
    const res = await request(app)
      .post('/api/backend/maps')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .field('name', 'Roles Test Map')
      .field('description', 'A map for testing roles')
      .field('gameName', testGame)
      .field('isPublic', 'false')
      .attach('image', imagePath);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    mapId = res.body.id;
    expect(mapId).toBeDefined();

    // Clean up test image
    try {
      await fs.promises.unlink(imagePath);
    } catch (err) {
      // Ignore errors if file doesn't exist
    }
  });

  afterAll(async () => {
    // Final targeted cleanup
    await db.execute('DELETE FROM map_user_roles WHERE map_id IN (SELECT id FROM maps WHERE name = ?)', ['Roles Test Map']);
    await db.execute('DELETE FROM maps WHERE name = ?', ['Roles Test Map']);
    await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?)', [
      ownerEmail, editorEmail, viewerEmail, strangerEmail
    ]);
    await db.execute('DELETE FROM games WHERE id = ?', [testGame]);
  });

  afterEach(async () => {
    // Cleanup after each test
    if (mapId) {
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);
      await db.execute('DELETE FROM maps WHERE id = ?', [mapId]);
    }
  });

  describe('GET /api/backend/maps/:id/users', () => {
    it('should allow owner to see the list of users', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/users`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny access to non-owner users', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/users`)
        .set('Authorization', `Bearer ${tokenEditor}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/backend/maps/:id/users/:userId/role', () => {
    it('should allow owner to add editor role', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });
      expect(res.statusCode).toBe(200);
    });

    it('should allow owner to add viewer role', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(200);
    });

    it('should deny non-owner from adding roles', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenEditor}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(403);
    });

    it('should reject invalid roles', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'invalid_role' });
      expect(res.statusCode).toBe(400);
    });

    it('should prevent changing owner\'s role', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${owner.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/backend/maps/:id/users/:userId/role', () => {
    it('should allow owner to remove a role', async () => {
      // Add two editors
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });
      // Remove one editor
      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(200);
    });

    it('should deny non-owner from removing roles', async () => {
      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenEditor}`);
      expect(res.statusCode).toBe(403);
    });

    it('should prevent removing owner\'s role', async () => {
      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${owner.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Role-based access control', () => {
    it('should allow editor to access private map', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // Add editor role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`);
      expect(res.statusCode).toBe(200);
    });

    it('should allow viewer to access private map', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // Assign the viewer role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);
      expect(res.statusCode).toBe(200);
    });

    it('should deny access to banned user', async () => {
      // Ban the viewer
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'banned' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);
      expect(res.statusCode).toBe(403);
    });

    it('should deny access to stranger', async () => {
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenStranger}`);
      expect(res.statusCode).toBe(403);
    });

    it('should allow editor_own to edit their own POIs', async () => {
      // Add editor_own role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_own' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenEditor}`);
      expect(res.statusCode).toBe(200);
    });

    it('should allow contributor to add POIs', async () => {
      // Add contributor role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'contributor' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenViewer}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Role transitions and edge cases', () => {
    it('should handle role updates correctly', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // Start as viewer
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });

      // Update to editor
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      // Verify access
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenStranger}`);
      expect(res.statusCode).toBe(200);
    });

    it('should handle multiple role changes', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // Test multiple role changes
      const roles = ['viewer', 'editor_all', 'banned', 'contributor'];
      for (const role of roles) {
        await request(app)
          .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
          .set('Authorization', `Bearer ${tokenOwner}`)
          .send({ role });
      }

      // Final role should be contributor
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}`)
        .set('Authorization', `Bearer ${tokenStranger}`);
      expect(res.statusCode).toBe(200);
    });

    it('should handle concurrent role updates', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // Try to update role multiple times simultaneously
      const updates = [
        request(app)
          .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
          .set('Authorization', `Bearer ${tokenOwner}`)
          .send({ role: 'viewer' }),
        request(app)
          .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
          .set('Authorization', `Bearer ${tokenOwner}`)
          .send({ role: 'editor_all' })
      ];

      await Promise.all(updates);

      // Verify final state
      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/users`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      expect(Array.isArray(res.body)).toBe(true);
      const userRole = res.body.find(u => u.id === stranger.id);
      expect(userRole).toBeDefined();
      expect(['viewer', 'editor_all']).toContain(userRole.role);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent map', async () => {
      const nonExistentMapId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/backend/maps/${nonExistentMapId}/users`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(404);
    });

    it('should handle non-existent user', async () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${nonExistentUserId}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(404);
    });

    it('should handle malformed role data', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 123 }); // Invalid role type
      expect(res.statusCode).toBe(400);
    });

    it('should handle missing role data', async () => {
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${stranger.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Role list management', () => {
    it('should return correct user list with roles', async () => {
      // Add multiple users with different roles
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });

      const res = await request(app)
        .get(`/api/backend/maps/${mapId}/users`)
        .set('Authorization', `Bearer ${tokenOwner}`);

      if (Array.isArray(res.body)) {
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        const editorUser = res.body.find(u => u.id === editor.id);
        const viewerUser = res.body.find(u => u.id === viewer.id);
        expect(editorUser).toBeDefined();
        expect(editorUser.role).toBe('editor_all');
        expect(viewerUser).toBeDefined();
        expect(viewerUser.role).toBe('viewer');
      } else {
        expect(res.body).toHaveProperty('error');
        throw new Error('Erreur inattendue lors de la récupération des rôles utilisateurs');
      }
    });
  });

  describe('Role management security', () => {
    it('should prevent self-banning', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${owner.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'banned' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('You cannot ban yourself.');
    });

    it('should prevent self-role-removal', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);

      // First add a role to the owner
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${owner.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${owner.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('You cannot remove your own role.');
    });

    it('should prevent removing last editor', async () => {
      // First add editor role to a user
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      // Try to remove the editor role
      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Cannot remove the last editor. Please assign another editor first.');
    });

    it('should allow removing editor when another editor exists', async () => {
      // Add two editors
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      // Now try to remove one editor
      const res = await request(app)
        .delete(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Role listing and retrieval', () => {
    it('should list all available roles', async () => {
      const res = await request(app)
        .get('/api/backend/maps/roles');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.roles)).toBe(true);
      expect(res.body.roles).toContain('viewer');
      expect(res.body.roles).toContain('editor_all');
      expect(res.body.roles).toContain('editor_own');
      expect(res.body.roles).toContain('contributor');
      expect(res.body.roles).toContain('banned');
    });

    it('should get current user role', async () => {
      // Clean up existing roles
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ?', [mapId]);
      // Test owner role
      const ownerRes = await request(app)
        .get(`/api/backend/maps/${mapId}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(ownerRes.statusCode).toBe(200);
      expect(ownerRes.body.role).toBe('owner');

      // Test editor role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      const editorRes = await request(app)
        .get(`/api/backend/maps/${mapId}/role`)
        .set('Authorization', `Bearer ${tokenEditor}`);
      expect(editorRes.statusCode).toBe(200);
      expect(editorRes.body.role).toBe('editor_all');

      // Test no role
      await db.execute('DELETE FROM map_user_roles WHERE map_id = ? AND user_id = ?', [mapId, stranger.id]);
      const strangerRes = await request(app)
        .get(`/api/backend/maps/${mapId}/role`)
        .set('Authorization', `Bearer ${tokenStranger}`);
      expect(strangerRes.statusCode).toBe(200);
      expect(strangerRes.body.role).toBe(null);
    });

    it('should handle non-existent map for role retrieval', async () => {
      const nonExistentMapId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/backend/maps/${nonExistentMapId}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Role transitions with last editor protection', () => {
    it('should prevent downgrading last editor to viewer', async () => {
      // Add editor role
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      // Try to downgrade to viewer
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Cannot remove the last editor. Please assign another editor first.');
    });

    it('should allow role change when multiple editors exist', async () => {
      // Add two editors
      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      await request(app)
        .put(`/api/backend/maps/${mapId}/users/${viewer.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'editor_all' });

      // Now try to change one editor's role
      const res = await request(app)
        .put(`/api/backend/maps/${mapId}/users/${editor.id}/role`)
        .set('Authorization', `Bearer ${tokenOwner}`)
        .send({ role: 'viewer' });
      expect(res.statusCode).toBe(200);
    });
  });
});
