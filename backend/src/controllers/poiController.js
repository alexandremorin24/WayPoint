const POIModel = require('../models/POIModel');
const MapModel = require('../models/MapModel');

/**
 * Create a new POI
 */
async function createPOI(req, res) {
  try {
    const { mapId } = req.params;
    const { name, description, x, y, icon, imageUrl, categoryId } = req.body;
    const creatorId = req.user.id;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ error: 'Name is required (1-100 characters).' });
    }
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'Valid coordinates (x, y) are required.' });
    }

    // Check if map exists and user has access
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
    if (err.message.includes('coordinate')) {
      return res.status(400).json({ error: err.message });
    }
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
    const canView = await MapModel.canView(poi.map_id, userId);
    if (!canView) {
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

    // Check if map exists and user has access
    const map = await MapModel.findMapById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    const userId = req.user?.id;
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
    const pois = await POIModel.findPOIsByCategory(categoryId);

    if (pois.length > 0) {
      // Check if user can view the map
      const userId = req.user?.id;
      const canView = await MapModel.canView(pois[0].map_id, userId);
      if (!canView) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POIs.' });
      }
    }

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

    // Validate updates
    if (updates.name && (typeof updates.name !== 'string' || updates.name.length < 1 || updates.name.length > 100)) {
      return res.status(400).json({ error: 'Name must be 1-100 characters.' });
    }
    if ((updates.x !== undefined && typeof updates.x !== 'number') ||
      (updates.y !== undefined && typeof updates.y !== 'number')) {
      return res.status(400).json({ error: 'Coordinates must be numbers.' });
    }

    await POIModel.updatePOI(id, updates);
    const updatedPOI = await POIModel.findPOIById(id);
    res.json(updatedPOI);
  } catch (err) {
    console.error('updatePOI error:', err);
    if (err.message.includes('coordinate')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error updating POI.' });
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

module.exports = {
  createPOI,
  getPOIById,
  getPOIsByMapId,
  getPOIsByCategory,
  getPOIsByCreator,
  updatePOI,
  deletePOI
}; 
