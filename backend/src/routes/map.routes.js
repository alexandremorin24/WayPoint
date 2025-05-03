const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const requireAuth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');

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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Limit uploads to 10 per hour per user (based on IP)
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many map uploads from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Create a map (authenticated, with image upload)
router.post('/', requireAuth, uploadRateLimiter, upload.single('image'), mapController.createMap);
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
// Get public maps for a given game id
router.get('/public-by-game/:gameId', mapController.getPublicMapsByGameId);
// Get public maps for a given game name
router.get('/public-by-game-name/:gameName', mapController.getPublicMapsByGameName);

module.exports = router; 
