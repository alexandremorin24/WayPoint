const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const requireAuth = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Configure multer to store images in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large (max 50MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Rate limiter for uploads
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many map uploads from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' // Disable rate limit in test
});

// Create a map (authenticated, with image upload)
if (process.env.NODE_ENV !== 'test') {
  router.post('/', requireAuth, uploadRateLimiter, upload.single('image'), handleMulterError, mapController.createMap);
} else {
  router.post('/', requireAuth, upload.single('image'), handleMulterError, mapController.createMap);
}
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
