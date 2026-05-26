import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MediCentral/1.0 (education; contact@medicentral.local)';

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const mapNominatimResult = (item, userLat, userLng) => {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  const parts = (item.display_name || '').split(',').map((s) => s.trim());
  const name = item.name || parts[0] || 'Healthcare facility';
  const type = item.type || item.class || '';
  const facilities = [];
  if (/hospital/i.test(type) || /hospital/i.test(name)) facilities.push('Hospital');
  if (/clinic/i.test(type) || /clinic/i.test(name)) facilities.push('Clinic');
  if (/pharmacy/i.test(type)) facilities.push('Pharmacy');
  if (!facilities.length) facilities.push('Healthcare');

  return {
    _id: `osm-${item.osm_type || 'place'}-${item.osm_id || item.place_id}`,
    name,
    address: parts.slice(0, 3).join(', ') || item.display_name,
    city: parts[1] || '',
    state: parts[2] || '',
    zipCode: '',
    contactNumber: '—',
    emergencyNumber: /emergency|hospital/i.test(name) ? 'Check local emergency' : '—',
    facilities,
    location: { lat, lng },
    rating: null,
    source: 'openstreetmap-nominatim',
    distanceKm: Number(haversineKm(userLat, userLng, lat, lng).toFixed(1)),
  };
};

/**
 * Fetch real hospitals/clinics near lat/lng via OpenStreetMap Nominatim (worldwide).
 */
export const fetchNearbyHospitals = async ({
  lat,
  lng,
  radiusMeters = 15000,
  emergencyOnly = false,
  keyword = '',
}) => {
  const radius = Math.min(Math.max(Number(radiusMeters) || 15000, 1000), 50000);
  const radiusDeg = (radius / 1000 / 111).toFixed(4);

  const viewbox = [
    lng - Number(radiusDeg),
    lat + Number(radiusDeg),
    lng + Number(radiusDeg),
    lat - Number(radiusDeg),
  ].join(',');

  const q = keyword.trim()
    ? `hospital ${keyword.trim()}`
    : emergencyOnly
      ? 'emergency hospital'
      : 'hospital';

  const { data } = await axios.get(NOMINATIM_URL, {
    params: {
      format: 'json',
      q,
      lat,
      lon: lng,
      limit: 40,
      bounded: 1,
      viewbox,
      addressdetails: 1,
    },
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    timeout: 20000,
  });

  let items = (Array.isArray(data) ? data : [])
    .filter((item) => item.lat && item.lon)
    .map((item) => mapNominatimResult(item, lat, lng))
    .filter((h) => h.distanceKm <= radius / 1000 + 2);

  if (emergencyOnly) {
    items = items.filter(
      (h) =>
        h.facilities.some((f) => /emergency|hospital/i.test(f)) ||
        /emergency|hospital/i.test(h.name)
    );
  }

  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    items = items.filter(
      (h) =>
        h.name.toLowerCase().includes(kw) ||
        h.city.toLowerCase().includes(kw) ||
        h.address.toLowerCase().includes(kw)
    );
  }

  const seen = new Set();
  items = items.filter((h) => {
    const key = `${h.name}-${h.location.lat}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  items.sort((a, b) => a.distanceKm - b.distanceKm);
  return items.slice(0, 50);
};
