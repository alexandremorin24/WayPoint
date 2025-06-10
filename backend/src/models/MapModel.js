const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const roles = require('./roles');

/**
 * Map model
 * @typedef {Object} Map
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} imageUrl
 * @property {string} thumbnailUrl
 * @property {boolean} isPublic
 * @property {string} gameId
 * @property {Date} createdAt
 * @property {string} ownerId
 * @property {number} imageWidth
 * @property {number} imageHeight
 */

// Create a new map
async function createMap({ name, description, imageUrl, thumbnailUrl = null, isPublic, gameId, ownerId, imageWidth, imageHeight }) {
  const id = uuidv4();
  const createdAt = new Date();
  await db.execute(
    `INSERT INTO maps (id, name, description, image_url, thumbnail_url, is_public, game_id, created_at, owner_id, image_width, image_height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description, imageUrl, thumbnailUrl, isPublic, gameId, createdAt, ownerId, imageWidth, imageHeight]
  );
  return { id, name, description, imageUrl, thumbnailUrl, isPublic, gameId, createdAt, ownerId, imageWidth, imageHeight };
}

// Convert a database row to a map object
function convertRowToMap(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    isPublic: Boolean(row.is_public),
    gameId: row.game_id,
    ownerId: row.owner_id,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    gameName: row.game_name
  };
}

// Find a map by its id
async function findMapById(id) {
  const [rows] = await db.execute(
    `SELECT m.*, g.name as game_name FROM maps m JOIN games g ON m.game_id = g.id WHERE m.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  return convertRowToMap(rows[0]);
}

// Find all maps by owner
async function findMapsByOwner(ownerId) {
  const [rows] = await db.execute(
    `SELECT m.*, g.name as game_name 
     FROM maps m 
     JOIN games g ON m.game_id = g.id 
     WHERE m.owner_id = ?`,
    [ownerId]
  );
  return rows.map(convertRowToMap);
}

// Update a map
async function updateMap(id, data) {
  try {
    // Validate required fields
    if (!data.name) {
      throw new Error('Map name is required');
    }

    const fields = [];
    const values = [];

    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      name: 'name',
      description: 'description',
      isPublic: 'is_public',
      imageUrl: 'image_url',
      thumbnailUrl: 'thumbnail_url',
      gameId: 'game_id',
      ownerId: 'owner_id',
      imageWidth: 'image_width',
      imageHeight: 'image_height'
    };

    // Only update fields that are provided
    for (const key in data) {
      if (data[key] !== undefined && fieldMapping[key]) {
        const dbField = fieldMapping[key];
        fields.push(`${dbField} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    await db.execute(`UPDATE maps SET ${fields.join(', ')} WHERE id = ?`, values);

    // Return the updated map
    return findMapById(id);
  } catch (error) {
    console.error('Error in updateMap:', error);
    throw error;
  }
}

// Delete a map
async function deleteMap(id) {
  await db.execute('DELETE FROM poi_logs WHERE poi_id IN (SELECT id FROM pois WHERE map_id = ?)', [id]);
  await db.execute('DELETE FROM pois WHERE map_id = ?', [id]);
  await db.execute('DELETE FROM categories WHERE map_id = ? AND parent_category_id IS NOT NULL', [id]);
  await db.execute('DELETE FROM categories WHERE map_id = ?', [id]);
  await db.execute('DELETE FROM maps WHERE id = ?', [id]);
}

// Find public maps with pagination
async function findPublicMapsPaginated(limit, offset) {
  // Ensure limit/offset are integers to prevent SQL injection
  limit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  offset = Math.max(0, parseInt(offset) || 0);
  const [rows] = await db.execute(
    `SELECT m.*, g.name as game_name 
     FROM maps m 
     JOIN games g ON m.game_id = g.id 
     WHERE m.is_public = true 
     ORDER BY m.created_at DESC 
     LIMIT ${limit} OFFSET ${offset}`
  );
  return rows.map(convertRowToMap);
}

// Find a game by name
async function findGameByName(name) {
  const [rows] = await db.execute('SELECT * FROM games WHERE name = ? LIMIT 1', [name]);
  return rows[0] || null;
}

// Create a new game
async function createGame(name) {
  const id = uuidv4();
  await db.execute('INSERT INTO games (id, name) VALUES (?, ?)', [id, name]);
  return { id, name };
}

// Check if a user has the editor role on a map
async function hasEditorAccess(mapId, userId) {
  const [rows] = await db.execute(
    'SELECT * FROM map_user_roles WHERE map_id = ? AND user_id = ? AND role IN (?, ?) LIMIT 1',
    [mapId, userId, 'editor_all', 'editor_own']
  );
  return !!rows[0];
}

// Count the number of maps for a user
async function countByUser(ownerId) {
  const [rows] = await db.execute('SELECT COUNT(*) as count FROM maps WHERE owner_id = ?', [ownerId]);
  return rows[0]?.count || 0;
}

// Find all public maps for a given game id
async function findPublicMapsByGameId(gameId) {
  const [rows] = await db.execute(
    `SELECT m.*, g.name as game_name 
     FROM maps m 
     JOIN games g ON m.game_id = g.id 
     WHERE m.is_public = true AND m.game_id = ?`,
    [gameId]
  );
  return rows.map(convertRowToMap);
}

// Find all public maps for a given game name
async function findPublicMapsByGameName(gameName) {
  const [rows] = await db.execute(
    `SELECT m.*, g.name as game_name 
     FROM maps m 
     JOIN games g ON m.game_id = g.id 
     WHERE m.is_public = true AND g.name = ?`,
    [gameName]
  );
  return rows.map(convertRowToMap);
}

// Check if a user has any role on a map
async function hasAnyRole(mapId, userId) {
  const [rows] = await db.execute(
    'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ? LIMIT 1',
    [mapId, userId]
  );
  return rows[0]?.role || null;
}

// Check if a user is banned from a map
async function isBanned(mapId, userId) {
  const [rows] = await db.execute(
    'SELECT * FROM map_user_roles WHERE map_id = ? AND user_id = ? AND role = ? LIMIT 1',
    [mapId, userId, 'banned']
  );
  return !!rows[0];
}

// Check if a user can view a map
async function canView(mapId, userId) {
  if (!mapId) return false;

  // Get map info
  const [rows] = await db.execute('SELECT * FROM maps WHERE id = ?', [mapId]);
  if (!rows[0]) return false;

  // Public maps are viewable by everyone
  if (rows[0].is_public) return true;

  // Owner can always view
  if (userId && rows[0].owner_id === userId) return true;

  // Check if user has a valid role
  if (!userId) return false;

  // Check if user is banned
  const [banned] = await db.execute(
    'SELECT * FROM map_user_roles WHERE map_id = ? AND user_id = ? AND role = ?',
    [mapId, userId, 'banned']
  );
  if (banned[0]) return false;

  // Check if user has any valid role (viewer, editor, contributor)
  const [role] = await db.execute(
    'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ? AND role IN (?, ?, ?, ?)',
    [mapId, userId, 'viewer', 'editor_all', 'editor_own', 'contributor']
  );
  return !!role[0];
}

// Check if a user can edit a map
async function canEdit(mapId, userId) {
  if (!mapId || !userId) return false;

  const [map] = await db.execute('SELECT owner_id FROM maps WHERE id = ?', [mapId]);
  if (!map[0]) return false;

  // Owner can always edit
  if (map[0].owner_id === userId) return true;

  // Check if user has editor role
  const role = await hasAnyRole(mapId, userId);
  return role === 'editor_all' || role === 'editor_own';
}

// Add a role to a user for a map
async function addRole(mapId, userId, role) {
  await db.execute(
    'INSERT INTO map_user_roles (map_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = ?',
    [mapId, userId, role, role]
  );
}

// Remove a role from a user for a map
async function removeRole(mapId, userId) {
  await db.execute(
    'DELETE FROM map_user_roles WHERE map_id = ? AND user_id = ?',
    [mapId, userId]
  );
}

// Get all users with their roles for a map
async function getMapUsers(mapId) {
  const [rows] = await db.execute(
    `SELECT u.id, u.email, u.display_name, mur.role 
     FROM map_user_roles mur 
     JOIN users u ON mur.user_id = u.id 
     WHERE mur.map_id = ?`,
    [mapId]
  );
  return rows;
}

// Helper: get user role for a map (returns null if no role)
async function getUserRole(mapId, userId) {
  if (!userId) return null;
  const [rows] = await db.execute(
    'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ? LIMIT 1',
    [mapId, userId]
  );
  return rows[0]?.role || null;
}

// Helper: can add a POI?
async function canAddPOI(mapId, userId) {
  if (!mapId || !userId) return false;

  // Get map info
  const [map] = await db.execute('SELECT owner_id FROM maps WHERE id = ?', [mapId]);
  if (!map[0]) return false;

  // Owner can always add POIs
  if (map[0].owner_id === userId) return true;

  // Check role-based permissions
  const role = await hasAnyRole(mapId, userId);
  return role === 'editor_all' || role === 'editor_own' || role === 'contributor';
}

// Helper: can edit a POI?
async function canEditPOI(mapId, userId, poiOwnerId) {
  if (!mapId || !userId) return false;

  // Get map info
  const [map] = await db.execute('SELECT owner_id FROM maps WHERE id = ?', [mapId]);
  if (!map[0]) return false;

  // Owner can always edit
  if (map[0].owner_id === userId) return true;

  // Check role-based permissions
  const role = await hasAnyRole(mapId, userId);
  if (role === 'editor_all') return true;
  if (role === 'editor_own' && poiOwnerId === userId) return true;

  return false;
}

// --- Advanced methods to implement ---
// async function addPOI(mapId, poiData) { /* ... */ }
// async function removePOI(mapId, poiId) { /* ... */ }
// async function inviteUser(mapId, userId) { /* ... */ }
// async function paginatePOIs(mapId, page, limit) { /* ... */ }
// async function generateThumbnails(mapId) { /* ... */ }

module.exports = {
  createMap,
  findMapById,
  findMapsByOwner,
  updateMap,
  deleteMap,
  findPublicMapsPaginated,
  findGameByName,
  createGame,
  hasEditorAccess,
  countByUser,
  findPublicMapsByGameId,
  findPublicMapsByGameName,
  hasAnyRole,
  isBanned,
  canView,
  canEdit,
  addRole,
  removeRole,
  getMapUsers,
  getUserRole,
  canAddPOI,
  canEditPOI
  // addPOI,
  // removePOI,
  // inviteUser,
  // paginatePOIs,
  // generateThumbnails
};
