const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Get all categories for a map (public access, but authentication is checked inside controller)
router.get('/maps/:mapId/categories', categoryController.getCategoriesByMapId);

// Get a specific category
router.get('/categories/:id', requireAuth, categoryController.getCategoryById);

// Create a new category
router.post('/maps/:mapId/categories', requireAuth, categoryController.createCategory);

// Update a category
router.put('/categories/:id', requireAuth, categoryController.updateCategory);

// Delete a category
router.delete('/categories/:id', requireAuth, categoryController.deleteCategory);

module.exports = router; 
