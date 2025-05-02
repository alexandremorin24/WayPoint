const MapModel = require('../models/MapModel');

// Create a new map
async function createMap(req, res) {
  try {
    const { name, description, imageUrl, isPublic } = req.body;
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
    // Validate imageUrl (required)
    if (!imageUrl || typeof imageUrl !== 'string' || !/^https?:\/\/.+\..+/.test(imageUrl)) {
      return res.status(400).json({ error: 'Image URL is required and must be a valid URL.' });
    }
    // Validate isPublic
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic is required and must be a boolean.' });
    }
    // gameId is null by default
    const map = await MapModel.createMap({ name, description, imageUrl, isPublic, ownerId, gameId: null });
    res.status(201).json(map);
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
    // If map is not public, only owner can access
    if (!map.is_public) {
      const userId = req.user && req.user.id;
      if (!userId || userId !== map.owner_id) {
        return res.status(403).json({ error: 'Forbidden: private map.' });
      }
    }
    res.json(map);
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
