const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * POI model
 * @typedef {Object} POI
 * @property {string} id
 * @property {string} mapId
 * @property {string} name
 * @property {string} description
 * @property {number} x
 * @property {number} y
 * @property {string} icon
 * @property {string} imageUrl
 * @property {string} categoryId
 * @property {string} creatorId
 */

/**
 * Create a new POI
 * @param {Object} poi
 * @param {string} poi.mapId
 * @param {string} poi.name
 * @param {string} [poi.description]
 * @param {number} poi.x
 * @param {number} poi.y
 * @param {string} [poi.icon]
 * @param {string} [poi.imageUrl]
 * @param {string} [poi.categoryId]
 * @param {string} poi.creatorId
 */
async function createPOI({ mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId }) {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO pois (id, map_id, name, description, x, y, icon, image_url, category_id, creator_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId]
  );
  return { id, mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId };
}

/**
 * Find a POI by its id
 * @param {string} id
 */
async function findPOIById(id) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find all POIs for a map
 * @param {string} mapId
 */
async function findPOIsByMapId(mapId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.map_id = ?`,
    [mapId]
  );
  return rows;
}

/**
 * Update a POI
 * @param {string} id
 * @param {Object} updates
 */
async function updatePOI(id, updates) {
  const fields = [];
  const values = [];

  for (const key in updates) {
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  await db.execute(`UPDATE pois SET ${fields.join(', ')} WHERE id = ?`, values);
}

/**
 * Delete a POI
 * @param {string} id
 */
async function deletePOI(id) {
  await db.execute('DELETE FROM pois WHERE id = ?', [id]);
}

module.exports = {
  createPOI,
  findPOIById,
  findPOIsByMapId,
  updatePOI,
  deletePOI
}; 
