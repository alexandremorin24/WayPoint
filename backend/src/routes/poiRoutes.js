const express = require('express');
const router = express.Router();
const poiController = require('../controllers/poiController');
const requireAuth = require('../middlewares/authMiddleware');
const poiMiddleware = require('../middlewares/poiMiddleware');

// Get all POIs for a map
router.get('/map/:mapId', requireAuth, poiController.getPOIsByMapId);

// Get all POIs for a category
router.get('/category/:categoryId', requireAuth, poiMiddleware.canViewPOI, poiController.getPOIsByCategory);

// Get all POIs for a creator
router.get('/creator/:creatorId', requireAuth, poiController.getPOIsByCreator);

// Get a specific POI
router.get('/:id', requireAuth, poiMiddleware.canViewPOI, poiController.getPOIById);

// Create a new POI
router.post('/map/:mapId', requireAuth, poiMiddleware.canAddPOI, poiController.createPOI);

// Update a POI
router.put('/:id', requireAuth, poiMiddleware.canEditPOI, poiController.updatePOI);

// Delete a POI
router.delete('/:id', requireAuth, poiMiddleware.canDeletePOI, poiController.deletePOI);

module.exports = router; 
