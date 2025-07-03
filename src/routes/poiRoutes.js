const express = require('express');
const router = express.Router();
const poiController = require('../controllers/poiController');
const { requireAuth } = require('../middlewares/authMiddleware');
const poiMiddleware = require('../middlewares/poiMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for POI image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
      return res.status(400).json({ error: 'File is too large (max 5MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Get all POIs for a map (public access, but authentication is checked inside controller)
router.get('/map/:mapId', poiController.getPOIsByMapId);

// Get all POIs for a category
router.get('/category/:categoryId', requireAuth, poiMiddleware.canViewPOI, poiController.getPOIsByCategory);

// Get all POIs for a creator
router.get('/creator/:creatorId', requireAuth, poiController.getPOIsByCreator);

// Get a specific POI
router.get('/:id', requireAuth, poiMiddleware.canViewPOI, poiController.getPOIById);

// Create a new POI
router.post('/map/:mapId', requireAuth, poiMiddleware.canAddPOI, poiController.createPOI);

// Upload POI image
router.post('/map/:mapId/image', requireAuth, poiMiddleware.canAddPOI, upload.single('image'), handleMulterError, poiController.uploadPOIImage);

// Update a POI
router.put('/:id', requireAuth, poiMiddleware.canEditPOI, poiController.updatePOI);

// Delete a POI
router.delete('/:id', requireAuth, poiMiddleware.canDeletePOI, poiController.deletePOI);

module.exports = router; 
