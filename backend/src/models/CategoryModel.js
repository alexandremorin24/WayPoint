const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Category model
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} mapId
 * @property {string} name
 * @property {string} color - Hex color code (e.g. #3498db)
 * @property {string} icon - Icon identifier
 * @property {string} [parentCategoryId] - Optional parent category
 */

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
    color: row.color,
    icon: row.icon,
    parentCategoryId: row.parent_category_id,
    parentCategoryName: row.parent_category_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Create a new category
 * @param {Object} category
 * @param {string} category.mapId
 * @param {string} category.name
 * @param {string} [category.color]
 * @param {string} [category.icon]
 * @param {string} [category.parentCategoryId]
 */
async function createCategory({ mapId, name, color, icon, parentCategoryId = null }) {
  const id = uuidv4();
  const now = new Date();

  // If color or icon are not defined, we leave them NULL to use the default values from the database
  const params = [id, mapId, name];
  const placeholders = ['?', '?', '?'];

  if (color !== undefined) {
    params.push(color);
    placeholders.push('?');
  }

  if (icon !== undefined) {
    params.push(icon);
    placeholders.push('?');
  }

  params.push(parentCategoryId, now, now);
  placeholders.push('?', '?', '?');

  await db.execute(
    `INSERT INTO categories (id, map_id, name${color !== undefined ? ', color' : ''}${icon !== undefined ? ', icon' : ''}, parent_category_id, created_at, updated_at)
     VALUES (${placeholders.join(', ')})`,
    params
  );

  return findCategoryById(id);
}

/**
 * Find a category by its id
 * @param {string} id
 */
async function findCategoryById(id) {
  const [rows] = await db.execute(
    `SELECT c.*, pc.name as parent_category_name
     FROM categories c
     LEFT JOIN categories pc ON c.parent_category_id = pc.id
     WHERE c.id = ?`,
    [id]
  );
  return convertToApiFormat(rows[0]);
}

/**
 * Find all categories for a map
 * @param {string} mapId
 */
async function findCategoriesByMapId(mapId) {
  const [rows] = await db.execute(
    `SELECT c.*, pc.name as parent_category_name
     FROM categories c
     LEFT JOIN categories pc ON c.parent_category_id = pc.id
     WHERE c.map_id = ?
     ORDER BY c.name`,
    [mapId]
  );
  return rows.map(convertToApiFormat);
}

/**
 * Update a category
 * @param {string} id
 * @param {Object} updates
 */
async function updateCategory(id, updates) {
  const fields = [];
  const values = [];

  // Convert camelCase field names to snake_case and only update provided fields
  const fieldMappings = {
    name: 'name',
    color: 'color',
    icon: 'icon',
    parentCategoryId: 'parent_category_id'
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

  values.push(id);
  await db.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

  return findCategoryById(id);
}

/**
 * Delete a category
 * @param {string} id
 */
async function deleteCategory(id) {
  // First, update all POIs in this category to have no category
  await db.execute('UPDATE pois SET category_id = NULL WHERE category_id = ?', [id]);
  // Then delete the category
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
}

/**
 * Check if a category exists and belongs to a map
 * @param {string} id
 * @param {string} mapId
 */
async function validateCategory(id, mapId) {
  const [rows] = await db.execute(
    'SELECT id FROM categories WHERE id = ? AND map_id = ?',
    [id, mapId]
  );
  return rows.length > 0;
}

module.exports = {
  createCategory,
  findCategoryById,
  findCategoriesByMapId,
  updateCategory,
  deleteCategory,
  validateCategory
};
