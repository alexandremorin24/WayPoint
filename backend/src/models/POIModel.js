const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const MapModel = require('./MapModel');

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
  if (x < 0 || x > map.imageWidth) {
    throw new Error(`X coordinate must be between 0 and ${map.imageWidth}`);
  }
  if (y < 0 || y > map.imageHeight) {
    throw new Error(`Y coordinate must be between 0 and ${map.imageHeight}`);
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
 * @param {string} [poi.icon]
 * @param {string} [poi.imageUrl]
 * @param {string} [poi.categoryId]
 * @param {string} poi.creatorId
 */
async function createPOI({ mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId }) {
  await validateCoordinates(mapId, x, y);

  const id = uuidv4();
  const now = new Date();
  await db.execute(
    `INSERT INTO pois (id, map_id, name, description, x, y, icon, image_url, category_id, creator_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId, now, now]
  );
  return { id, mapId, name, description, x, y, icon, imageUrl, categoryId, creatorId, createdAt: now, updatedAt: now };
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
 * Find all POIs for a category
 * @param {string} categoryId
 */
async function findPOIsByCategory(categoryId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.category_id = ?`,
    [categoryId]
  );
  return rows;
}

/**
 * Find all POIs created by a user
 * @param {string} creatorId
 */
async function findPOIsByCreator(creatorId) {
  const [rows] = await db.execute(
    `SELECT p.*, c.name as category_name, u.display_name as creator_name
     FROM pois p 
     LEFT JOIN categories c ON p.category_id = c.id 
     LEFT JOIN users u ON p.creator_id = u.id
     WHERE p.creator_id = ?`,
    [creatorId]
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

  // If coordinates are being updated, validate them
  if (updates.x !== undefined || updates.y !== undefined) {
    const poi = await findPOIById(id);
    if (!poi) {
      throw new Error('POI not found');
    }
    await validateCoordinates(
      poi.mapId,
      updates.x !== undefined ? updates.x : poi.x,
      updates.y !== undefined ? updates.y : poi.y
    );
  }

  for (const key in updates) {
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add updated_at timestamp
  fields.push('updated_at = ?');
  values.push(new Date());

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
  findPOIsByCategory,
  findPOIsByCreator,
  updatePOI,
  deletePOI
}; 
