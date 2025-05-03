const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Map model
 * @typedef {Object} Map
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} imageUrl
 * @property {boolean} isPublic
 * @property {string} gameId
 * @property {Date} createdAt
 * @property {string} ownerId
 */

// Create a new map
async function createMap({ name, description, imageUrl, isPublic, gameId, ownerId }) {
  const id = uuidv4();
  const createdAt = new Date();
  await db.execute(
    `INSERT INTO maps (id, name, description, image_url, is_public, game_id, created_at, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, description, imageUrl, isPublic, gameId, createdAt, ownerId]
  );
  return { id, name, description, imageUrl, isPublic, gameId, createdAt, ownerId };
}

// Find a map by its id
async function findMapById(id) {
  const [rows] = await db.execute(`SELECT * FROM maps WHERE id = ?`, [id]);
  return rows[0] || null;
}

// Find all maps by owner
async function findMapsByOwner(ownerId) {
  const [rows] = await db.execute(`SELECT * FROM maps WHERE owner_id = ?`, [ownerId]);
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

// Vérifie si un utilisateur a le rôle editor sur une map
async function hasEditorAccess(mapId, userId) {
  const [rows] = await db.execute(
    'SELECT * FROM collaborations WHERE map_id = ? AND user_id = ? AND role = ? LIMIT 1',
    [mapId, userId, 'editor']
  );
  return !!rows[0];
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
  hasEditorAccess
  // addPOI,
  // removePOI,
  // inviteUser,
  // paginatePOIs,
  // generateThumbnails
};
// Note: Categories should be managed on the POI side, not on the Map side. 
