import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Search, Navigation, MapPin, RefreshCw, Map } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? 13);
  }, [center, zoom, map]);
  return null;
};

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  const fetchNearby = useCallback(async (lat, lng, kw = '') => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/hospitals/nearby?lat=${lat}&lng=${lng}&radius=20000&keyword=${encodeURIComponent(kw)}`
      );
      const list = Array.isArray(data) ? data : [];
      setHospitals(list);
      if (!list.length) toast('No hospitals found nearby. Try a wider search.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load nearby hospitals');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAt = (lat, lng) => {
      setUserLocation({ lat, lng });
      fetchNearby(lat, lng, '');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadAt(pos.coords.latitude, pos.coords.longitude),
        () => {
          setLocationError('Location denied — showing default center. Enable GPS for accurate distance.');
          loadAt(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    } else {
      loadAt(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    }
  }, [fetchNearby]);

  const mappableHospitals = hospitals.filter((h) => h.location?.lat != null && h.location?.lng != null);
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  const directionsUrl = (h) => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${h.location.lat},${h.location.lng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`;
  };

  return (
    <div className="patient-hub -m-4 sm:-m-6 lg:-m-8 p-0">
      <div className="relative h-[min(75vh,640px)] sm:h-[calc(100vh-8rem)] overflow-hidden border border-slate-200 shadow-lg bg-slate-100 rounded-none sm:rounded-2xl">
        <div className="absolute inset-0 z-0">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && <ChangeView center={[userLocation.lat, userLocation.lng]} zoom={13} />}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your location</Popup>
              </Marker>
            )}
            {mappableHospitals.map((hospital) => (
              <Marker key={hospital._id} position={[hospital.location.lat, hospital.location.lng]}>
                <Popup>
                  <strong className="text-sm block mb-1">{hospital.name}</strong>
                  {hospital.distanceKm != null && (
                    <span className="text-xs text-slate-600 block mb-1">{hospital.distanceKm} km away</span>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto z-10 w-auto sm:w-full max-w-md flex flex-col max-h-[calc(100%-2rem)] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-lg mb-4 pointer-events-auto"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Map className="text-blue-600 w-5 h-5" /> Nearby hospitals
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Real facilities near you for travel · Distance from your location · Route via Google Maps
              <br />
              <span className="text-slate-500">Book visits from your dashboard VIP pre-book.</span>
            </p>
            {locationError && (
              <p className="text-xs text-amber-700 mb-3 bg-amber-50 px-3 py-2 rounded-lg">{locationError}</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (userLocation) fetchNearby(userLocation.lat, userLocation.lng, keyword);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name or area..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => userLocation && fetchNearby(userLocation.lat, userLocation.lng, keyword)}
                  className="p-2.5 bg-slate-100 rounded-xl text-slate-700 border border-slate-200"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>

          <div className="flex-1 overflow-y-auto pointer-events-auto space-y-4 pr-1 custom-scrollbar">
            {loading ? (
              <div className="text-center py-6 text-slate-500 bg-white/95 rounded-2xl border border-slate-200">
                Loading nearby hospitals…
              </div>
            ) : mappableHospitals.length === 0 ? (
              <div className="text-center py-6 text-slate-500 bg-white/95 rounded-2xl border border-slate-200 px-4">
                No hospitals found in this area.
              </div>
            ) : (
              mappableHospitals.map((hospital, idx) => (
                <motion.div
                  key={hospital._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-md"
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{hospital.name}</h3>
                    {hospital.distanceKm != null && (
                      <span className="shrink-0 flex items-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                        <Navigation className="w-3 h-3 mr-1" /> {hospital.distanceKm} km
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-4 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {hospital.address}
                  </p>
                  <a
                    href={directionsUrl(hospital)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-900"
                  >
                    <Navigation className="w-4 h-4" /> Get directions
                  </a>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hospitals;
