const MapModel = require('../models/MapModel');
const POIModel = require('../models/POIModel');

/**
 * Middleware to check if user can add POIs to a map
 */
async function canAddPOI(req, res, next) {
  try {
    const { mapId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const canAdd = await MapModel.canAddPOI(mapId, userId);
    if (!canAdd) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to add POIs.' });
    }

    next();
  } catch (err) {
    console.error('canAddPOI middleware error:', err);
    res.status(500).json({ error: 'Error checking POI permissions.' });
  }
}

/**
 * Middleware to check if user can edit a POI
 */
async function canEditPOI(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const poi = await POIModel.findPOIById(id);
    if (!poi) {
      return res.status(404).json({ error: 'POI not found.' });
    }

    const canEdit = await MapModel.canEditPOI(poi.map_id, userId, poi.creator_id);
    if (!canEdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to edit POI.' });
    }

    next();
  } catch (err) {
    console.error('canEditPOI middleware error:', err);
    res.status(500).json({ error: 'Error checking POI edit permissions.' });
  }
}

/**
 * Middleware to check if user can delete a POI
 */
async function canDeletePOI(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const poi = await POIModel.findPOIById(id);
    if (!poi) {
      return res.status(404).json({ error: 'POI not found.' });
    }

    // Only creator or map owner can delete
    const map = await MapModel.findMapById(poi.map_id);
    if (userId !== poi.creator_id && userId !== map.owner_id) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to delete POI.' });
    }

    next();
  } catch (err) {
    console.error('canDeletePOI middleware error:', err);
    res.status(500).json({ error: 'Error checking POI delete permissions.' });
  }
}

module.exports = {
  canAddPOI,
  canEditPOI,
  canDeletePOI
}; 
