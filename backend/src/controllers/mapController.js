const MapModel = require('../models/MapModel');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const fileType = require('file-type');
const imageUtils = require('../utils/imageUtils');
const db = require('../utils/db');
const roles = require('../models/roles');
const { v4: uuidv4 } = require('uuid');

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
  let map = null;
  try {
    const { name, description, gameName, imageFromMapId } = req.body;
    const ownerId = req.user && req.user.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Enforce map quota per user
    const mapCount = await MapModel.countByUser(ownerId);
    if (mapCount >= 4) {
      return res.status(403).json({ error: 'Map quota exceeded (max 4 maps per user).' });
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

    // Find or create the game, then get its id
    let game = await MapModel.findGameByName(gameName);
    if (!game) {
      game = await MapModel.createGame(gameName);
    }
    const gameId = game.id;

    // Get isPublic from request body
    const isPublic = req.body.isPublic === 'true';
    let imageUrl = null;
    let thumbnailUrl = null;
    let imageWidth = null;
    let imageHeight = null;

    // Option 1: Use an existing public map image
    if (imageFromMapId) {
      const refMap = await MapModel.findMapById(imageFromMapId);
      if (!refMap || !refMap.is_public || refMap.game_id !== gameId) {
        return res.status(400).json({ error: 'Invalid reference map for image.' });
      }
      imageUrl = refMap.image_url;
      thumbnailUrl = refMap.thumbnail_url;
      imageWidth = refMap.image_width;
      imageHeight = refMap.image_height;
    } else {
      // Option 2: Upload a new image
      if (!req.file) {
        return res.status(400).json({ error: 'Image is required.' });
      }

      // Get image dimensions and validate
      const metadata = await sharp(req.file.buffer).metadata();
      imageWidth = metadata.width;
      imageHeight = metadata.height;

      // Validate image (allow large images for maps)
      await imageUtils.validateImageBuffer(req.file.buffer, {
        maxWidth: 10000,
        maxHeight: 10000,
        minWidth: 100,
        minHeight: 100
      });

      // Prepare paths
      const gameSlug = slugify(gameName);
      const uploadsDir = path.join(__dirname, '../../public/uploads', gameSlug);
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (err) {
        console.error('Error creating uploads directory:', err);
        return res.status(500).json({ error: 'Error creating uploads directory.' });
      }

      // Generate filenames
      const mapId = uuidv4();
      const finalName = `${mapId}.webp`;
      const thumbName = `${mapId}_thumb.webp`;
      const finalPath = path.join(uploadsDir, finalName);
      const thumbPath = path.join(uploadsDir, thumbName);

      // Process image
      await Promise.all([
        imageUtils.convertToWebP(req.file.buffer, finalPath),
        imageUtils.generateThumbnail(req.file.buffer, thumbPath)
      ]);

      // Set URLs
      imageUrl = `/uploads/${gameSlug}/${finalName}`;
      thumbnailUrl = `/uploads/${gameSlug}/${thumbName}`;
    }

    // Create the map with the final image URLs
    map = await MapModel.createMap({
      name,
      description,
      imageUrl,
      thumbnailUrl,
      isPublic,
      ownerId,
      gameId,
      imageWidth,
      imageHeight
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

    // Cleanup in case of error
    if (map && map.id) {
      try {
        await MapModel.deleteMap(map.id);
      } catch (deleteErr) {
        console.error('Error cleaning up map after creation error:', deleteErr);
      }
    }

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

    // Get user id from token if present
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

    // Check if user can view the map
    const canAccess = await MapModel.canView(map.id, userId);
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden: private map.' });
    }

    // Check if user is banned
    if (userId && await MapModel.isBanned(map.id, userId)) {
      return res.status(403).json({ error: 'Forbidden: you are banned from this map.' });
    }

    // Get user role if authenticated
    let userRole = null;
    if (userId) {
      if (userId === map.ownerId) {
        userRole = 'owner';
      } else {
        userRole = await MapModel.getUserRole(map.id, userId);
      }
    }

    // Add user role to response
    const response = {
      ...map,
      userRole
    };

    return res.json(response);
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

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if user can edit the map
    const canEdit = await MapModel.canEdit(map.id, userId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
    }

    // Validate input data
    const { name, description, isPublic } = req.body;
    if (name !== undefined && (typeof name !== 'string' || name.length < 3 || name.length > 100)) {
      return res.status(400).json({ error: 'Map name must be between 3 and 100 characters.' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ error: 'Description must be less than 500 characters.' });
    }
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean value.' });
    }

    const updatedMap = await MapModel.updateMap(id, req.body);
    res.json(updatedMap);
  } catch (err) {
    console.error('updateMap error:', err);
    if (err.message === 'Map name is required') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'No valid fields to update') {
      return res.status(400).json({ error: err.message });
    }
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
    if (!userId || userId !== map.ownerId) {
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

// Get all users with their roles for a map
async function getMapUsers(req, res) {
  try {
    const { id } = req.params;
    const map = await MapModel.findMapById(id);
    if (!map) return res.status(404).json({ error: 'Map not found.' });

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if user is the owner
    if (userId !== map.ownerId) {
      return res.status(403).json({ error: 'Forbidden: only the owner can see the list of users.' });
    }

    const users = await MapModel.getMapUsers(id);
    res.json(users);
  } catch (err) {
    console.error('getMapUsers error:', err);
    res.status(500).json({ error: 'Error while fetching map users.' });
  }
}

// Get all available roles
async function getAvailableRoles(req, res) {
  try {
    res.json({ roles: roles.ROLES });
  } catch (err) {
    console.error('getAvailableRoles error:', err);
    res.status(500).json({ error: 'Error while fetching available roles.' });
  }
}

// Add or update a user's role for a map
async function updateUserRole(req, res) {
  try {
    const { id: mapId, userId } = req.params;
    const { role } = req.body;

    const map = await MapModel.findMapById(mapId);
    if (!map) return res.status(404).json({ error: 'Map not found.' });

    const currentUserId = req.user && req.user.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if user is the owner
    if (currentUserId !== map.ownerId) {
      return res.status(403).json({ error: 'Forbidden: only the owner can manage roles.' });
    }

    // Check if role is valid
    if (!roles.ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    // Prevent self-banning
    if (currentUserId === userId && role === 'banned') {
      return res.status(400).json({ error: 'You cannot ban yourself.' });
    }

    // Prevent changing owner's role
    if (userId === map.ownerId) {
      return res.status(400).json({ error: 'Cannot change owner\'s role.' });
    }

    // Check if user exists
    const [user] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user[0]) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if current user is an editor
    const currentRole = await MapModel.getUserRole(mapId, userId);
    const isCurrentlyEditor = currentRole === 'editor_all' || currentRole === 'editor_own';

    // If downgrading an editor to viewer or banned
    if (isCurrentlyEditor && (role === 'viewer' || role === 'banned')) {
      // Check if there are other editors left
      const [editors] = await db.execute(
        'SELECT COUNT(*) as count FROM map_user_roles WHERE map_id = ? AND role IN (?, ?) AND user_id != ?',
        [mapId, 'editor_all', 'editor_own', userId]
      );
      if (editors[0].count === 0) {
        return res.status(400).json({ error: 'Cannot remove the last editor. Please assign another editor first.' });
      }
    }

    await MapModel.addRole(mapId, userId, role);
    res.json({ message: 'Role updated successfully.' });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ error: 'Error while updating user role.' });
  }
}

// Remove a user's role from a map
async function removeUserRole(req, res) {
  try {
    const { id: mapId, userId } = req.params;

    const map = await MapModel.findMapById(mapId);
    if (!map) return res.status(404).json({ error: 'Map not found.' });

    const currentUserId = req.user && req.user.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if user is the owner
    if (currentUserId !== map.ownerId) {
      return res.status(403).json({ error: 'Forbidden: only the owner can manage roles.' });
    }

    // Prevent self-removal
    if (currentUserId === userId) {
      return res.status(400).json({ error: 'You cannot remove your own role.' });
    }

    // Prevent removing owner's role
    if (userId === map.ownerId) {
      return res.status(400).json({ error: 'Cannot remove owner\'s role.' });
    }

    // Check if current user is an editor
    const currentRole = await MapModel.getUserRole(mapId, userId);
    const isCurrentlyEditor = currentRole === 'editor_all' || currentRole === 'editor_own';

    // If removing an editor's role
    if (isCurrentlyEditor) {
      // Check if there are other editors left
      const [editors] = await db.execute(
        'SELECT COUNT(*) as count FROM map_user_roles WHERE map_id = ? AND role IN (?, ?) AND user_id != ?',
        [mapId, 'editor_all', 'editor_own', userId]
      );
      if (editors[0].count === 0) {
        return res.status(400).json({ error: 'Cannot remove the last editor. Please assign another editor first.' });
      }
    }

    await MapModel.removeRole(mapId, userId);
    res.json({ message: 'Role removed successfully.' });
  } catch (err) {
    console.error('removeUserRole error:', err);
    res.status(500).json({ error: 'Error while removing user role.' });
  }
}

// GET /api/backend/maps/:id/role
async function getCurrentUserRole(req, res) {
  try {
    const { id: mapId } = req.params;
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    // If user is the owner, return 'owner'
    if (userId === map.ownerId) {
      return res.json({ role: 'owner' });
    }

    // Otherwise, look for role in map_user_roles table
    const [rows] = await db.execute(
      'SELECT role FROM map_user_roles WHERE map_id = ? AND user_id = ?',
      [mapId, userId]
    );

    res.json({ role: rows[0]?.role || null });
  } catch (err) {
    console.error('getCurrentUserRole error:', err);
    res.status(500).json({ error: 'Error while fetching user role.' });
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
  getPublicMapsByGameName,
  getMapUsers,
  updateUserRole,
  removeUserRole,
  getCurrentUserRole,
  getAvailableRoles
}; 
