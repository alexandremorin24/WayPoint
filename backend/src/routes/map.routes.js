const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const requireAuth = require('../middlewares/authMiddleware');

// Create a map (authenticated)
router.post('/', requireAuth, mapController.createMap);
// Get a map by id (public)
router.get('/:id', mapController.getMapById);
// Get all maps by owner (public)
router.get('/owner/:ownerId', mapController.getMapsByOwner);
// Update a map (authenticated)
router.put('/:id', requireAuth, mapController.updateMap);
// Delete a map (authenticated)
router.delete('/:id', requireAuth, mapController.deleteMap);

module.exports = router; 
