const MapModel = require('../models/MapModel');
const path = require('path');
const fs = require('fs');

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
    const { name, description, isPublic, gameName } = req.body;
    // ownerId comes from the authenticated user
    const ownerId = req.user && req.user.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    // Validate name
    if (!name || typeof name !== 'string' || name.length < 3 || name.length > 100) {
      return res.status(400).json({ error: 'Map name is required (3-100 characters).' });
    }
    // Validate description
    if (!description || typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({ error: 'Description is required (max 500 characters).' });
    }
    // Validate gameName
    if (!gameName || typeof gameName !== 'string' || gameName.length < 3 || gameName.length > 100) {
      return res.status(400).json({ error: 'Game name is required (3-100 characters).' });
    }
    // Validate image (upload)
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required.' });
    }
    // Validate isPublic
    const isPublicBool = isPublic === 'true' || isPublic === true;

    // Find or create the game
    let game = await MapModel.findGameByName(gameName);
    if (!game) {
      game = await MapModel.createGame(gameName);
    }
    const gameId = game.id;
    const gameSlug = slugify(gameName);

    // Create the map first to get the id
    const tempImageUrl = `/uploads/${req.file.filename}`;
    const map = await MapModel.createMap({
      name,
      description,
      imageUrl: tempImageUrl,
      isPublic: isPublicBool,
      ownerId,
      gameId
    });

    // Rename and move the image file
    const ext = path.extname(req.file.originalname);
    const uploadsDir = path.join(__dirname, '../../public/uploads', gameSlug);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const finalName = `${map.id}${ext}`;
    const finalPath = path.join(uploadsDir, finalName);
    const oldPath = path.join(__dirname, '../../public/uploads', req.file.filename);
    fs.renameSync(oldPath, finalPath);
    // Update the image path in the database
    const imageUrl = `/uploads/${gameSlug}/${finalName}`;
    await MapModel.updateMap(map.id, { image_url: imageUrl });

    res.status(201).json({ id: map.id, gameId, gameName });
  } catch (err) {
    console.error('createMap error:', err);
    res.status(500).json({ error: 'Error while creating map.' });
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
    await MapModel.deleteMap(id);
    res.json({ message: 'Map deleted.' });
  } catch (err) {
    console.error('deleteMap error:', err);
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

module.exports = {
  createMap,
  getMapById,
  getMapsByOwner,
  updateMap,
  deleteMap,
  getPublicMaps
}; 
