import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { motion } from 'framer-motion';
import {
  Phone,
  Navigation,
  Share2,
  Siren,
  MapPin,
  Star,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const emergencyIcon = L.divIcon({
  className: 'emergency-marker-pulse',
  html: '<div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 0 12px #ef4444"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? 14);
  }, [center, zoom, map]);
  return null;
};

const EmergencyPanel = ({ emergencyProfile }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const fetchEmergency = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/hospitals/nearby?lat=${lat}&lng=${lng}&radius=25000&emergencyOnly=true`
      );
      setHospitals(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load emergency hospitals');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchEmergency(loc.lat, loc.lng);
        },
        () => {
          setUserLocation(DEFAULT_CENTER);
          fetchEmergency(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
      fetchEmergency(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    }
  }, [fetchEmergency]);

  const shareProfile = () => {
    const text = [
      'MediCentral Emergency Profile',
      `Patient ID: ${emergencyProfile?.patientId || '—'}`,
      `Blood: ${emergencyProfile?.bloodGroup || '—'}`,
      `Allergies: ${(emergencyProfile?.allergies || []).join(', ') || 'None'}`,
      `Emergency contact: ${emergencyProfile?.emergencyContact?.name || '—'} ${emergencyProfile?.emergencyContact?.phone || ''}`,
    ].join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Emergency health profile', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Emergency profile copied');
    }
  };

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="patient-glass rounded-2xl p-5 border border-red-500/30 bg-red-950/20"
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Siren className="w-6 h-6 text-red-400 animate-pulse" /> Emergency assistance
        </h2>
        <p className="text-sm text-slate-400 mt-2">Help is immediately reachable — call, navigate, or share your profile.</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => toast('Emergency alert to hospital network — connect SMS/API in production')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <AlertCircle className="w-4 h-4" /> Send alert (demo)
          </button>
          <button
            type="button"
            onClick={shareProfile}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-600"
          >
            <Share2 className="w-4 h-4" /> Share emergency profile
          </button>
          <Link
            to="/hospitals"
            className="flex items-center gap-2 text-cyan-400 text-sm font-semibold px-3 py-2"
          >
            Full map view →
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[min(420px,50vh)] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" attribution="© OSM" />
            {userLocation && (
              <>
                <ChangeView center={mapCenter} zoom={13} />
                <Circle
                  center={mapCenter}
                  radius={8000}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1 }}
                />
                <Marker position={mapCenter}>
                  <Popup>You are here</Popup>
                </Marker>
              </>
            )}
            {hospitals
              .filter((h) => h.location?.lat != null)
              .map((h) => (
                <Marker
                  key={h._id}
                  position={[h.location.lat, h.location.lng]}
                  icon={/emergency/i.test(h.name || '') ? emergencyIcon : DefaultIcon}
                >
                  <Popup>
                    <strong>{h.name}</strong>
                    <br />
                    {h.contactNumber}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        <div className="space-y-3 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
          {loading ? (
            <div className="shimmer-bg h-24 rounded-2xl" />
          ) : hospitals.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No emergency facilities found nearby.</p>
          ) : (
            hospitals.slice(0, 12).map((h, idx) => (
              <motion.div
                key={h._id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="patient-glass rounded-xl p-4 border border-slate-700/60 hover:border-red-500/40 transition"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-bold text-white text-sm leading-tight">{h.name}</h3>
                  {h.distanceKm != null && (
                    <span className="text-xs text-cyan-400 font-bold shrink-0">{h.distanceKm} km</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.address}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-400/80">
                  <Star className="w-3 h-3" /> Emergency care
                  <span className="text-slate-600">· 24/7 (verify)</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {h.contactNumber && h.contactNumber !== '—' && (
                    <a
                      href={`tel:${h.contactNumber.replace(/\s/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600/90 text-white py-2 rounded-lg text-xs font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  )}
                  {h.location?.lat != null && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-cyan-300 py-2 rounded-lg text-xs font-semibold border border-slate-600"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyPanel;
