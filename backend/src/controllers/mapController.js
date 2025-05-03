const MapModel = require('../models/MapModel');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const fileType = require('file-type');
const imageUtils = require('../utils/imageUtils');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Create a new map
async function createMap(req, res) {
  try {
    const { name, description, gameName, imageFromMapId } = req.body;
    const ownerId = req.user && req.user.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Enforce map quota per user EDIT BEFORE PROD
    const mapCount = await MapModel.countByUser(ownerId);
    if (mapCount >= 10000) {
      return res.status(403).json({ error: 'Map quota exceeded (max 5 maps per user).' });
    }

    // Validate fields
    if (!name || typeof name !== 'string' || name.length < 3 || name.length > 100) {
      return res.status(400).json({ error: 'Map name is required (3-100 characters).' });
    }
    if (!description || typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({ error: 'Description is required (max 500 characters).' });
    }
    if (!gameName || typeof gameName !== 'string' || gameName.length < 1) {
      return res.status(400).json({ error: 'Game name is required.' });
    }

    // Trouver ou créer le jeu, puis récupérer son id
    let game = await MapModel.findGameByName(gameName);
    if (!game) {
      game = await MapModel.createGame(gameName);
    }
    const gameId = game.id;

    // Get isPublic from request body
    const isPublic = req.body.isPublic === 'true';
    let imageUrl = null;
    let thumbnailUrl = null;

    // Option 1: Use an existing public map image
    if (imageFromMapId) {
      const refMap = await MapModel.findMapById(imageFromMapId);
      if (!refMap || !refMap.is_public || refMap.game_id !== gameId) {
        return res.status(400).json({ error: 'Invalid reference map for image.' });
      }
      imageUrl = refMap.image_url;
      thumbnailUrl = refMap.thumbnail_url;
    } else {
      // Option 2: Upload a new image
      if (!req.file) {
        return res.status(400).json({ error: 'Image is required.' });
      }

      try {
        // Validate image (allow large images for maps)
        await imageUtils.validateImageBuffer(req.file.buffer, {
          maxWidth: 10000,
          maxHeight: 10000,
          minWidth: 100,
          minHeight: 100
        });

        let map;
        try {
          // Create the map to get the id
          map = await MapModel.createMap({
            name,
            description,
            imageUrl: '/uploads/temp',
            isPublic,
            ownerId,
            gameId
          });

          // Prepare paths
          const gameSlug = slugify(gameName);
          const uploadsDir = path.join(__dirname, '../../public/uploads', gameSlug);
          fs.mkdirSync(uploadsDir, { recursive: true });

          // Generate filenames
          const finalName = `${map.id}.webp`;
          const thumbName = `${map.id}_thumb.webp`;
          const finalPath = path.join(uploadsDir, finalName);
          const thumbPath = path.join(uploadsDir, thumbName);

          // Process image
          await Promise.all([
            imageUtils.convertToWebP(req.file.buffer, finalPath),
            imageUtils.generateThumbnail(req.file.buffer, thumbPath)
          ]);

          // Update URLs
          imageUrl = `/uploads/${gameSlug}/${finalName}`;
          thumbnailUrl = `/uploads/${gameSlug}/${thumbName}`;
          await MapModel.updateMap(map.id, { image_url: imageUrl, thumbnail_url: thumbnailUrl });

          return res.status(201).json({
            id: map.id,
            gameId,
            gameName,
            imageUrl,
            thumbnailUrl
          });
        } catch (err) {
          // In case of error, delete the created map
          if (map && map.id) {
            await MapModel.deleteMap(map.id);
          }
          throw err;
        }
      } catch (err) {
        throw err;
      }
    }

    // Create the map with the selected image
    const map = await MapModel.createMap({
      name,
      description,
      imageUrl,
      thumbnailUrl,
      isPublic,
      ownerId,
      gameId
    });

    res.status(201).json({
      id: map.id,
      gameId,
      gameName,
      imageUrl,
      thumbnailUrl
    });
  } catch (err) {
    console.error('createMap error:', err.stack || err);
    if (err.message.includes('image')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error while creating the map.' });
  }
}

// Get a map by id
async function getMapById(req, res) {
  try {
    const { id } = req.params;
    const map = await MapModel.findMapById(id);
    if (!map) return res.status(404).json({ error: 'Map not found.' });
    // If the map is public, access is OK
    if (map.is_public) {
      return res.json(map);
    }
    // Otherwise, must be owner or editor
    let userId = null;
    // Get user id from token if present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Invalid token, access denied
        return res.status(403).json({ error: 'Forbidden: invalid token.' });
      }
    }
    if (!userId) {
      return res.status(403).json({ error: 'Forbidden: private map.' });
    }
    if (userId === map.owner_id) {
      return res.json(map);
    }
    // Vérifier si editor
    const isEditor = await MapModel.hasEditorAccess(map.id, userId);
    if (isEditor) {
      return res.json(map);
    }
    return res.status(403).json({ error: 'Forbidden: private map.' });
  } catch (err) {
    console.error('getMapById error:', err);
    res.status(500).json({ error: 'Error while fetching map.' });
  }
}

// Get all maps by owner
async function getMapsByOwner(req, res) {
  try {
    const { ownerId } = req.params;
    const maps = await MapModel.findMapsByOwner(ownerId);
    res.json(maps);
  } catch (err) {
    console.error('getMapsByOwner error:', err);
    res.status(500).json({ error: 'Error while fetching maps.' });
  }
}

// Update a map
async function updateMap(req, res) {
  try {
    const { id } = req.params;
    const map = await MapModel.findMapById(id);
    if (!map) return res.status(404).json({ error: 'Map not found.' });
    // Only owner can update
    const userId = req.user && req.user.id;
    if (!userId || userId !== map.owner_id) {
      return res.status(403).json({ error: 'Forbidden: not the owner.' });
    }
    await MapModel.updateMap(id, req.body);
    res.json({ message: 'Map updated.' });
  } catch (err) {
    console.error('updateMap error:', err);
    res.status(500).json({ error: 'Error while updating map.' });
  }
}

// Delete a map
async function deleteMap(req, res) {
  try {
    const { id } = req.params;
    const map = await MapModel.findMapById(id);
    if (!map) return res.status(404).json({ error: 'Map not found.' });
    // Only owner can delete
    const userId = req.user && req.user.id;
    if (!userId || userId !== map.owner_id) {
      return res.status(403).json({ error: 'Forbidden: not the owner.' });
    }
    // Delete the map from DB
    await MapModel.deleteMap(id);
    // Delete the image file if it exists
    if (map.image_url) {
      const imagePath = path.join(__dirname, '../../public', map.image_url);
      fs.unlink(imagePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          // Log but do not block deletion if file is missing
          console.error('Error deleting image file:', err);
        }
      });
    }
    res.json({ message: 'Map deleted.' });
  } catch (err) {
    console.error('deleteMap error:', err.stack || err);
    res.status(500).json({ error: 'Error while deleting map.' });
  }
}

// Get public maps with pagination
async function getPublicMaps(req, res) {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const maps = await MapModel.findPublicMapsPaginated(limit, offset);
    res.json(maps);
  } catch (err) {
    console.error('getPublicMaps error:', err);
    res.status(500).json({ error: 'Error while fetching public maps.' });
  }
}

// Get all public maps for a given game id
async function getPublicMapsByGameId(req, res) {
  try {
    const { gameId } = req.params;
    const maps = await MapModel.findPublicMapsByGameId(gameId);
    res.json(maps);
  } catch (err) {
    console.error('getPublicMapsByGameId error:', err);
    res.status(500).json({ error: 'Error while fetching public maps for game.' });
  }
}

// Get all public maps for a given game name
async function getPublicMapsByGameName(req, res) {
  try {
    const { gameName } = req.params;
    const maps = await MapModel.findPublicMapsByGameName(gameName);
    res.json(maps);
  } catch (err) {
    console.error('getPublicMapsByGameName error:', err);
    res.status(500).json({ error: 'Error while fetching public maps for game name.' });
  }
}

module.exports = {
  createMap,
  getMapById,
  getMapsByOwner,
  updateMap,
  deleteMap,
  getPublicMaps,
  getPublicMapsByGameId,
  getPublicMapsByGameName
}; 
