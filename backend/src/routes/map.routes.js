const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const requireAuth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer to store images in public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// Create a map (authenticated, with image upload)
router.post('/', requireAuth, upload.single('image'), mapController.createMap);
// Get a map by id (public)
router.get('/:id', mapController.getMapById);
// Get all maps by owner (public)
router.get('/owner/:ownerId', mapController.getMapsByOwner);
// Update a map (authenticated)
router.put('/:id', requireAuth, mapController.updateMap);
// Delete a map (authenticated)
router.delete('/:id', requireAuth, mapController.deleteMap);
// Get public maps with pagination
router.get('/', mapController.getPublicMaps);

module.exports = router; 
