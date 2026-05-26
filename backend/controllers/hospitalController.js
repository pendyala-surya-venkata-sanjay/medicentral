import { fetchNearbyHospitals } from '../utils/overpassHospitals.js';
import { TenantService } from '../modules/tenants/tenant.service.js';

export const getRegisteredHospitals = async (req, res, next) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const hospitals = await TenantService.listRegisteredHospitals({ lat, lng });
    res.json(hospitals);
  } catch (error) {
    next(error);
  }
};

// @desc    Real nearby hospitals (OpenStreetMap Overpass)
// @route   GET /api/hospitals/nearby
// @access  Private
export const getNearbyHospitals = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      res.status(400);
      throw new Error('Valid lat and lng query parameters are required');
    }

    const hospitals = await fetchNearbyHospitals({
      lat,
      lng,
      radiusMeters: req.query.radius || 15000,
      emergencyOnly: req.query.emergencyOnly === 'true',
      keyword: req.query.keyword || '',
    });

    res.json(hospitals);
  } catch (error) {
    if (error.response?.status === 429) {
      res.status(503);
      return next(new Error('Hospital lookup rate limited. Please try again in a moment.'));
    }
    next(error);
  }
};

// Legacy list route — redirects clients to use /nearby with coordinates
export const getHospitals = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return getNearbyHospitals(req, res, next);
    }

    res.status(400).json({
      message:
        'Location required. Pass lat and lng query parameters, or use GET /api/hospitals/nearby',
      hospitals: [],
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalById = async (req, res, next) => {
  try {
    res.status(404);
    throw new Error('Use nearby hospitals list; individual OSM hospital IDs are not stored locally.');
  } catch (error) {
    next(error);
  }
};
