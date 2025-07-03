const POIModel = require('../models/POIModel');
const MapModel = require('../models/MapModel');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const imageUtils = require('../utils/imageUtils');

/**
 * Create a new POI
 */
async function createPOI(req, res) {
  try {
    const { mapId } = req.params;
    const { name, description, x, y, icon, imageUrl, categoryId } = req.body;
    const creatorId = req.user.id;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 40) {
      return res.status(400).json({ error: 'Name is required (1-40 characters).' });
    }
    if (!categoryId || typeof categoryId !== 'string') {
      return res.status(400).json({ error: 'categoryId is required and must be a string.' });
    }

    // Check if map exists
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    const poi = await POIModel.createPOI({
      mapId,
      name,
      description,
      x,
      y,
      icon,
      imageUrl,
      categoryId,
      creatorId
    });

    res.status(201).json(poi);
  } catch (err) {
    console.error('createPOI error:', err);
    res.status(500).json({ error: 'Error creating POI.' });
  }
}

/**
 * Get a POI by id
 */
async function getPOIById(req, res) {
  try {
    const { id } = req.params;
    const poi = await POIModel.findPOIById(id);

    if (!poi) {
      return res.status(404).json({ error: 'POI not found.' });
    }

    // Check if user can view the map
    const userId = req.user?.id;
    const canView = await MapModel.canView(poi.mapId, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POI.' });
    }

    // Check if user has a valid role for this map
    const role = await MapModel.hasAnyRole(poi.mapId, userId);
    if (!role && !poi.isPublic) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POI.' });
    }

    res.json(poi);
  } catch (err) {
    console.error('getPOIById error:', err);
    res.status(500).json({ error: 'Error fetching POI.' });
  }
}

/**
 * Get all POIs for a map
 */
async function getPOIsByMapId(req, res) {
  try {
    const { mapId } = req.params;

    // Check if map exists
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    // If map is public, allow access without authentication
    if (map.isPublic) {
      const pois = await POIModel.findPOIsByMapId(mapId);
      return res.json(pois);
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
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POIs.' });
    }

    const pois = await POIModel.findPOIsByMapId(mapId);
    res.json(pois);
  } catch (err) {
    console.error('getPOIsByMapId error:', err);
    res.status(500).json({ error: 'Error fetching POIs.' });
  }
}

/**
 * Get all POIs for a category
 */
async function getPOIsByCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const userId = req.user?.id;

    // Get the first POI to check map permissions
    const [firstPOI] = await POIModel.findPOIsByCategory(categoryId);
    if (firstPOI) {
      const canView = await MapModel.canView(firstPOI.mapId, userId);
      if (!canView) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POIs.' });
      }
    }

    const pois = await POIModel.findPOIsByCategory(categoryId);
    res.json(pois);
  } catch (err) {
    console.error('getPOIsByCategory error:', err);
    res.status(500).json({ error: 'Error fetching POIs by category.' });
  }
}

/**
 * Get all POIs created by a user
 */
async function getPOIsByCreator(req, res) {
  try {
    const { creatorId } = req.params;
    const pois = await POIModel.findPOIsByCreator(creatorId);

    // Filter POIs based on user's access to maps
    const userId = req.user?.id;
    const accessiblePois = [];

    for (const poi of pois) {
      const canView = await MapModel.canView(poi.map_id, userId);
      if (canView) {
        accessiblePois.push(poi);
      }
    }

    res.json(accessiblePois);
  } catch (err) {
    console.error('getPOIsByCreator error:', err);
    res.status(500).json({ error: 'Error fetching POIs by creator.' });
  }
}

/**
 * Update a POI
 */
async function updatePOI(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    // Validate categoryId if provided
    if (updates.categoryId !== undefined) {
      if (!updates.categoryId || typeof updates.categoryId !== 'string') {
        return res.status(400).json({ error: 'categoryId is required and must be a string.' });
      }
    }

    const poi = await POIModel.updatePOI(id, updates, userId);
    res.json(poi);
  } catch (err) {
    console.error('updatePOI error:', err);
    if (err.message === 'POI not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'No valid fields to update') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete a POI
 */
async function deletePOI(req, res) {
  try {
    const { id } = req.params;
    await POIModel.deletePOI(id);
    res.json({ message: 'POI deleted successfully.' });
  } catch (err) {
    console.error('deletePOI error:', err);
    res.status(500).json({ error: 'Error deleting POI.' });
  }
}

/**
 * Upload POI image
 */
async function uploadPOIImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const { mapId } = req.params;

    // Check if map exists
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    // Validate image
    await imageUtils.validateImageBuffer(req.file.buffer, {
      maxWidth: 10000,
      maxHeight: 10000,
      minWidth: 100,
      minHeight: 100
    });

    // Prepare paths
    const uploadsDir = path.join(__dirname, '../../public/uploads/pois');
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err);
      return res.status(500).json({ error: 'Error creating uploads directory.' });
    }

    // Generate filenames
    const poiId = uuidv4();
    const finalName = `${poiId}.webp`;
    const thumbName = `${poiId}_thumb.webp`;
    const finalPath = path.join(uploadsDir, finalName);
    const thumbPath = path.join(uploadsDir, thumbName);

    // Process image
    await Promise.all([
      imageUtils.convertToWebP(req.file.buffer, finalPath),
      imageUtils.generateThumbnail(req.file.buffer, thumbPath)
    ]);

    // Return the URLs
    const imageUrl = `/uploads/pois/${finalName}`;
    const thumbnailUrl = `/uploads/pois/${thumbName}`;
    res.json({ url: imageUrl, thumbnailUrl });
  } catch (err) {
    console.error('uploadPOIImage error:', err);
    if (err.message.includes('image')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to process image' });
  }
}

module.exports = {
  createPOI,
  getPOIById,
  getPOIsByMapId,
  getPOIsByCategory,
  getPOIsByCreator,
  updatePOI,
  deletePOI,
  uploadPOIImage
}; 
