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
 */

// Create a new map
async function createMap({ name, description, imageUrl, thumbnailUrl = null, isPublic, gameId, ownerId }) {
  const id = uuidv4();
  const createdAt = new Date();
  await db.execute(
    `INSERT INTO maps (id, name, description, image_url, thumbnail_url, is_public, game_id, created_at, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description, imageUrl, thumbnailUrl, isPublic, gameId, createdAt, ownerId]
  );
  return { id, name, description, imageUrl, thumbnailUrl, isPublic, gameId, createdAt, ownerId };
}

// Find a map by its id
async function findMapById(id) {
  const [rows] = await db.execute(`SELECT * FROM maps WHERE id = ?`, [id]);
  return rows[0] || null;
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
  return rows;
}

// Update a map
async function updateMap(id, data) {
  const fields = [];
  const values = [];
  for (const key in data) {
    fields.push(`${key} = ?`);
    values.push(data[key]);
  }
  values.push(id);
  await db.execute(`UPDATE maps SET ${fields.join(', ')} WHERE id = ?`, values);
}

// Delete a map
async function deleteMap(id) {
  await db.execute(`DELETE FROM maps WHERE id = ?`, [id]);
}

// Find public maps with pagination
async function findPublicMapsPaginated(limit, offset) {
  // Ensure limit/offset are integers to prevent SQL injection
  limit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  offset = Math.max(0, parseInt(offset) || 0);
  const [rows] = await db.execute(
    `SELECT * FROM maps WHERE is_public = true ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  );
  return rows;
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
    `SELECT id, name, image_url, thumbnail_url FROM maps WHERE is_public = true AND game_id = ?`,
    [gameId]
  );
  return rows;
}

// Find all public maps for a given game name
async function findPublicMapsByGameName(gameName) {
  const [rows] = await db.execute(
    `SELECT m.id, m.name, m.image_url, m.thumbnail_url 
     FROM maps m 
     JOIN games g ON m.game_id = g.id 
     WHERE m.is_public = true AND g.name = ?`,
    [gameName]
  );
  return rows;
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
  const [rows] = await db.execute(
    'SELECT * FROM maps WHERE id = ? AND (is_public = true OR owner_id = ?)',
    [mapId, userId]
  );
  if (rows[0]) return true;

  // If the user has a role (except banned), they can view the map
  const role = await hasAnyRole(mapId, userId);
  return role && role !== 'banned';
}

// Check if a user can edit a map
async function canEdit(mapId, userId) {
  const [map] = await db.execute('SELECT owner_id FROM maps WHERE id = ?', [mapId]);
  if (!map[0]) return false;

  // Owner can always edit
  if (map[0].owner_id === userId) return true;

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
  const role = await getUserRole(mapId, userId);
  return (
    role === 'editor_all' ||
    role === 'editor_own' ||
    role === 'contributor'
  );
}

// Helper: can edit a POI? (here, we assume we pass the POI creator's id for editor_own)
async function canEditPOI(mapId, userId, poiOwnerId) {
  const role = await getUserRole(mapId, userId);
  if (role === 'editor_all') return true;
  if (role === 'editor_own' && userId === poiOwnerId) return true;
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
