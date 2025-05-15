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
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const poi = await POIModel.findPOIById(id);
    if (!poi) {
      return res.status(404).json({ error: 'POI not found.' });
    }

    // Validate coordinates if they are being updated
    if (updates.x !== undefined || updates.y !== undefined) {
      try {
        await POIModel.validateCoordinates(
          poi.mapId,
          updates.x !== undefined ? updates.x : poi.x,
          updates.y !== undefined ? updates.y : poi.y
        );
      } catch (err) {
        if (err.message.includes('coordinate')) {
          return res.status(400).json({ error: err.message });
        }
        throw err;
      }
    }

    const canEdit = await MapModel.canEditPOI(poi.mapId, userId, poi.creatorId);
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
    const map = await MapModel.findMapById(poi.mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }

    if (userId !== poi.creatorId && userId !== map.owner_id) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to delete POI.' });
    }

    next();
  } catch (err) {
    console.error('canDeletePOI middleware error:', err);
    res.status(500).json({ error: 'Error checking POI delete permissions.' });
  }
}

/**
 * Middleware to check if user can view a POI
 */
async function canViewPOI(req, res, next) {
  try {
    const { id, categoryId } = req.params;
    const userId = req.user?.id;

    let poi;
    if (id) {
      poi = await POIModel.findPOIById(id);
    } else if (categoryId) {
      const pois = await POIModel.findPOIsByCategory(categoryId);
      if (pois.length > 0) {
        poi = pois[0];
      }
    }

    if (!poi) {
      return res.status(404).json({ error: 'POI not found.' });
    }

    const canView = await MapModel.canView(poi.mapId, userId);
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions to view POI.' });
    }

    next();
  } catch (err) {
    console.error('canViewPOI middleware error:', err);
    res.status(500).json({ error: 'Error checking POI view permissions.' });
  }
}

module.exports = {
  canAddPOI,
  canEditPOI,
  canDeletePOI,
  canViewPOI
}; 
