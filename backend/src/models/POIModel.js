const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const MapModel = require('./MapModel');
const CategoryModel = require('./CategoryModel');

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
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Validate POI coordinates against map dimensions
 * @param {string} mapId
 * @param {number} x
 * @param {number} y
 */
async function validateCoordinates(mapId, x, y) {
  const map = await MapModel.findMapById(mapId);
  if (!map) {
    throw new Error('Map not found');
  }
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    throw new Error('Coordinates must be numbers');
  }
  // Round to 2 decimal places
  x = Math.round(x * 100) / 100;
  y = Math.round(y * 100) / 100;
  if (x < 0 || x > map.image_width) {
    throw new Error(`X coordinate must be between 0 and ${map.image_width}`);
  }
  if (y < 0 || y > map.image_height) {
    throw new Error(`Y coordinate must be between 0 and ${map.image_height}`);
  }
}

/**
 * Create a new POI
 * @param {Object} poi
 * @param {string} poi.mapId
 * @param {string} poi.name
 * @param {string} [poi.description]
 * @param {number} poi.x
 * @param {number} poi.y
 * @param {string} [poi.imageUrl]
 * @param {string} [poi.categoryId]
 * @param {string} poi.creatorId
 */
async function createPOI({ mapId, name, description, x, y, imageUrl, categoryId, creatorId }) {
  if (!categoryId || typeof categoryId !== 'string') {
    throw new Error('categoryId is required and must be a string');
  }
  // Round to 2 decimal places
  x = Math.round(x * 100) / 100;
  y = Math.round(y * 100) / 100;
  await validateCoordinates(mapId, x, y);

  const id = uuidv4();
  const now = new Date();
  // Force optional fields to null if undefined
  description = description === undefined ? null : description;
  imageUrl = imageUrl === undefined ? null : imageUrl;

  await db.execute(
    `INSERT INTO pois (id, map_id, name, description, x, y, image_url, category_id, creator_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, mapId, name, description, x, y, imageUrl, categoryId, creatorId, now, now]
  );

  // Log creation
  await logPOIAction({ poiId: id, mapId, userId: creatorId, action: 'create', payload: { name, description, x, y, imageUrl, categoryId } });
  // Update stats
  await incrementUserPOICreated(creatorId, mapId);

  return findPOIById(id);
}

/**
 * Convert database row to API response format
 * @param {Object} row
 */
function convertToApiFormat(row) {
  if (!row) return null;
  return {
    id: row.id,
    mapId: row.map_id,
    name: row.name,
    description: row.description,
    x: row.x,
    y: row.y,
    icon: row.category_icon || 'map-marker',
    color: row.category_color || '#3498db',
    imageUrl: row.image_url,
    categoryId: row.category_id,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: row.category_name,
    creatorName: row.creator_name
  };
}

/**
 * Find a POI by its id
 * @param {string} id
 */
async function findPOIById(id) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return convertToApiFormat(rows[0]);
}

/**
 * Find all POIs for a map
 * @param {string} mapId
 */
async function findPOIsByMapId(mapId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.map_id = ?`,
    [mapId]
  );
  return rows.map(convertToApiFormat);
}

/**
 * Find all POIs for a category
 * @param {string} categoryId
 */
async function findPOIsByCategory(categoryId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.category_id = ?`,
    [categoryId]
  );
  return rows.map(convertToApiFormat);
}

/**
 * Find all POIs created by a user
 * @param {string} creatorId
 */
async function findPOIsByCreator(creatorId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.creator_id = ?`,
    [creatorId]
  );
  return rows.map(convertToApiFormat);
}

/**
 * Update a POI
 * @param {string} id
 * @param {Object} updates
 */
async function updatePOI(id, updates, userId) {
  const fields = [];
  const values = [];

  // Get current POI data
  const currentPOI = await findPOIById(id);
  if (!currentPOI) {
    throw new Error('POI not found');
  }

  // Validate categoryId if provided
  if (updates.categoryId !== undefined) {
    if (!updates.categoryId || typeof updates.categoryId !== 'string') {
      throw new Error('categoryId is required and must be a string');
    }
  }

  // If coordinates are being updated, validate them
  if (updates.x !== undefined || updates.y !== undefined) {
    await validateCoordinates(
      currentPOI.mapId,
      updates.x !== undefined ? updates.x : currentPOI.x,
      updates.y !== undefined ? updates.y : currentPOI.y
    );
  }

  // Convert camelCase field names to snake_case and only update provided fields
  const fieldMappings = {
    name: 'name',
    description: 'description',
    x: 'x',
    y: 'y',
    imageUrl: 'image_url',
    categoryId: 'category_id'
  };

  for (const key in updates) {
    if (fieldMappings[key] && updates[key] !== undefined) {
      fields.push(`${fieldMappings[key]} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add updated_at timestamp
  fields.push('updated_at = ?');
  values.push(new Date());

  // If coordinates, round to 2 decimal places
  if (updates.x !== undefined) updates.x = Math.round(updates.x * 100) / 100;
  if (updates.y !== undefined) updates.y = Math.round(updates.y * 100) / 100;

  values.push(id);
  await db.execute(`UPDATE pois SET ${fields.join(', ')} WHERE id = ?`, values);

  // Log update
  await logPOIAction({
    poiId: id,
    mapId: currentPOI.mapId,
    userId: userId,
    action: 'update',
    payload: updates
  });

  // Update stats
  await db.execute(
    'UPDATE poi_user_stats SET poi_updated_count = poi_updated_count + 1 WHERE user_id = ? AND map_id = ?',
    [userId, currentPOI.mapId]
  );

  return findPOIById(id);
}

/**
 * Delete a POI
 * @param {string} id
 */
async function deletePOI(id) {
  await db.execute('DELETE FROM pois WHERE id = ?', [id]);
}

async function logPOIAction({ poiId, mapId, userId, action, payload }) {
  await db.execute(
    `INSERT INTO poi_logs (id, poi_id, map_id, user_id, action, payload) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), poiId, mapId, userId, action, JSON.stringify(payload)]
  );
}

async function incrementUserPOICreated(userId, mapId) {
  // Try to update, if no row, insert
  const [rows] = await db.execute(
    'SELECT * FROM poi_user_stats WHERE user_id = ? AND map_id = ?',
    [userId, mapId]
  );
  if (rows.length > 0) {
    await db.execute(
      'UPDATE poi_user_stats SET poi_created_count = poi_created_count + 1 WHERE user_id = ? AND map_id = ?',
      [userId, mapId]
    );
  } else {
    await db.execute(
      'INSERT INTO poi_user_stats (id, user_id, map_id, poi_created_count, poi_updated_count) VALUES (?, ?, ?, 1, 0)',
      [uuidv4(), userId, mapId]
    );
  }
}

module.exports = {
  createPOI,
  findPOIById,
  findPOIsByMapId,
  findPOIsByCategory,
  findPOIsByCreator,
  updatePOI,
  deletePOI,
  validateCoordinates,
  logPOIAction,
  incrementUserPOICreated
}; 
