const CategoryModel = require('../models/CategoryModel');
const MapModel = require('../models/MapModel');

/**
 * Create a new category
 */
async function createCategory(req, res) {
  try {
    const { mapId } = req.params;
    const { name, color = '#3498db', icon = 'map-marker', parentCategoryId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Name is required (1-100 characters).' });
    }

    // Check if map exists and user has access
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    // Check if user can edit the map
    const canEdit = await MapModel.canEdit(mapId, userId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to create category.' });
    }

    // If parent category is specified, validate it
    if (parentCategoryId) {
      const isValidParent = await CategoryModel.validateCategory(parentCategoryId, mapId);
      if (!isValidParent) {
        return res.status(400).json({ error: 'Invalid parent category.' });
      }
    }

    const category = await CategoryModel.createCategory({
      mapId,
      name,
      color,
      icon,
      parentCategoryId
    });

    res.status(201).json(category);
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ error: 'Error creating category.' });
  }
}

/**
 * Get all categories for a map
 */
async function getCategoriesByMapId(req, res) {
  try {
    const { mapId } = req.params;

    // Check if map exists
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    // If map is public, allow access without authentication
    if (map.isPublic) {
      const categories = await CategoryModel.findCategoriesByMapId(mapId);
      return res.json(categories);
    }

    // For private maps, require authentication and check permissions
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required for private maps.' });
    }

    const canView = await MapModel.canView(mapId, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view categories.' });
    }

    const categories = await CategoryModel.findCategoriesByMapId(mapId);
    res.json(categories);
  } catch (err) {
    console.error('getCategoriesByMapId error:', err);
    res.status(500).json({ error: 'Error fetching categories.' });
  }
}

/**
 * Get a category by id
 */
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const category = await CategoryModel.findCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if user can view the map
    const canView = await MapModel.canView(category.mapId, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view category.' });
    }

    res.json(category);
  } catch (err) {
    console.error('getCategoryById error:', err);
    res.status(500).json({ error: 'Error fetching category.' });
  }
}

/**
 * Update a category
 */
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Get current category to check permissions
    const category = await CategoryModel.findCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if user can edit the map
    const canEdit = await MapModel.canEdit(category.mapId, userId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to update category.' });
    }

    // If parent category is being updated, validate it
    if (updates.parentCategoryId) {
      const isValidParent = await CategoryModel.validateCategory(updates.parentCategoryId, category.mapId);
      if (!isValidParent) {
        return res.status(400).json({ error: 'Invalid parent category.' });
      }
    }

    const updatedCategory = await CategoryModel.updateCategory(id, updates);
    res.json(updatedCategory);
  } catch (err) {
    console.error('updateCategory error:', err);
    if (err.message === 'No valid fields to update') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error updating category.' });
  }
}

/**
 * Delete a category
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get current category to check permissions
    const category = await CategoryModel.findCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if user can edit the map
    const canEdit = await MapModel.canEdit(category.mapId, userId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to delete category.' });
    }

    await CategoryModel.deleteCategory(id);
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    if (err.message === 'Cannot delete category with subcategories') {
      return res.status(400).json({ error: 'Cannot delete a category that has subcategories. Please delete or move the subcategories first.' });
    }
    res.status(500).json({ error: 'Error deleting category.' });
  }
}

module.exports = {
  createCategory,
  getCategoriesByMapId,
  getCategoryById,
  updateCategory,
  deleteCategory
}; 
