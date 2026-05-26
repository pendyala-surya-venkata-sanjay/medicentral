import { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Search, Plus, Activity, Users, AlertCircle, Scan, BrainCircuit } from 'lucide-react';
import RecordCard from '../components/RecordCard';
import PrescriptionForm from '../components/clinical/PrescriptionForm';
import VoiceRecorder from '../components/clinical/VoiceRecorder';
import SurgeryCapture from '../components/clinical/SurgeryCapture';
import TreatmentTimeline from '../components/clinical/TreatmentTimeline';
import PatientDocumentsList from '../components/patient/PatientDocumentsList';
import { extractPatientId } from '../utils/patientId';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const [patientId, setPatientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [clinicalTab, setClinicalTab] = useState('timeline');
  const [timelineKey, setTimelineKey] = useState(0);
  const [patientRecords, setPatientRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);

  useEffect(() => {
    api
      .get('/stats/doctor')
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Could not load analytics'));
  }, []);

  const runPatientSearch = async (q) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/patients/search?q=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  };

  const loadPatientById = async (rawId) => {
    const id = extractPatientId(rawId);
    if (!id) {
      setError('Enter a valid Patient ID (e.g. MC-PT-1001)');
      return;
    }

    setLoading(true);
    setError('');
    setActivePatient(null);
    setPatientRecords([]);

    try {
      const profileRes = await api.get(`/patients/lookup/${encodeURIComponent(id)}`);
      const profile = profileRes.data?.patient || profileRes.data;

      if (!profile?.patientId) {
        throw new Error('Patient profile is missing a Patient ID');
      }

      setActivePatient(profile);
      setPatientId(profile.patientId);
      setSearchQuery(`${profile.name || 'Patient'} (${profile.patientId})`);

      try {
        const recordsRes = await api.get(
          `/records/patient/${encodeURIComponent(profile.patientId)}`
        );
        const records = Array.isArray(recordsRes.data) ? recordsRes.data : [];
        setPatientRecords(records);
        if (!records.length) {
          setError('Patient found — no visit records yet. Use clinical workflow below.');
        }
      } catch (recErr) {
        console.error('Records load failed:', recErr.response?.data || recErr.message);
        setPatientRecords([]);
        setError(
          `${profile.name} loaded. Could not load records: ${
            recErr.response?.data?.message || 'try again'
          }`
        );
      }

      toast.success(`Patient ${profile.patientId} loaded`);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (err.response?.status === 403
          ? 'You are not authorized to search patients'
          : err.response?.status === 401
            ? 'Session expired — please log in again'
            : 'Patient not found — check the ID and try again');
      console.error('Patient lookup failed:', err.response?.data || err.message);
      setError(msg);
      setPatientRecords([]);
      setActivePatient(null);
      setPatientId('');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (p) => {
    setSearchResults([]);
    if (!p?.patientId) {
      toast.error('This patient profile has no Patient ID — contact admin');
      return;
    }
    await loadPatientById(p.patientId);
  };

  const searchPatient = async (e) => {
    e?.preventDefault?.();
    const raw = (searchQuery || patientId).trim();
    if (!raw) {
      setError('Enter a Patient ID, name, or phone to search');
      return;
    }
    if (searchResults.length === 1) {
      await selectPatient(searchResults[0]);
      return;
    }
    await loadPatientById(raw);
  };

  const handleOCRScan = async () => {
    if (!file) {
      toast.error('Please upload an image file first (JPG/PNG).');
      return;
    }
    setOcrScanning(true);
    const formData = new FormData();
    formData.append('document', file);
    try {
      const { data } = await api.post('/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('OCR scan complete');
      setNotes(
        (prev) => prev + (prev ? '\n\n' : '') + '--- OCR Extracted Text ---\n' + (data.raw_text || '')
      );
    } catch {
      toast.error('OCR scan failed — use a clear JPG or PNG image');
    } finally {
      setOcrScanning(false);
    }
  };

  const createRecord = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('patientId', patientId.trim());
    formData.append('diagnosis', diagnosis);
    formData.append('symptoms', symptoms);
    formData.append('notes', notes);
    if (file) formData.append('document', file);

    try {
      await api.post('/records/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Record created successfully');
      setShowModal(false);
      setDiagnosis('');
      setSymptoms('');
      setNotes('');
      setFile(null);
      if (activePatient?.patientId) await loadPatientById(activePatient.patientId);
      const { data } = await api.get('/stats/doctor');
      setStats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    }
  };

  const traffic = stats?.traffic?.length
    ? stats.traffic
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => ({ name, patients: 0 }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Patients Seen</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.uniquePatientsSeen ?? '—'}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl">
            <Users className="text-blue-600 h-6 w-6" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Records (7 days)</p>
            <p className="text-3xl font-bold text-slate-800">{stats?.weeklyConsultations ?? '—'}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl">
            <Activity className="text-indigo-600 h-6 w-6" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl shadow-sm flex items-center justify-between text-white"
        >
          <div>
            <p className="text-sm text-red-100 font-medium mb-1">Urgent Diagnoses</p>
            <p className="text-3xl font-bold">{stats?.criticalAlerts ?? 0}</p>
            <p className="text-xs text-red-100 mt-1">Keyword-based flags in records</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl">
            <AlertCircle className="text-white h-6 w-6" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800">Patient Directory</h3>
              <form onSubmit={searchPatient} className="flex w-full sm:w-auto relative">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Patient ID, name, phone, Aadhaar last 4"
                    value={searchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchQuery(v);
                      runPatientSearch(v);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <li key={p._id || p.patientId}>
                          <button
                            type="button"
                            onClick={() => selectPatient(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                          >
                            <span className="font-semibold">{p.name || 'Patient'}</span>
                            <span className="text-slate-500 ml-2 font-mono text-xs">
                              {p.patientId || 'No ID'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-xl text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Search
                </button>
              </form>
            </div>

            {activePatient && (
              <>
                <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold text-blue-600 uppercase">Active patient</p>
                  <p className="font-bold text-slate-800">{activePatient.name}</p>
                  <p className="font-mono text-lg text-blue-700 font-bold mt-1">{activePatient.patientId}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activePatient.bloodGroup && `Blood: ${activePatient.bloodGroup} · `}
                    {activePatient.contactNumber || activePatient.email}
                  </p>
                </div>
                <div className="mb-4">
                  <PatientDocumentsList patientId={activePatient.patientId} />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm mb-4 border border-amber-100">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : patientRecords.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-500 font-medium">
                    {patientRecords.length} record(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Record
                  </button>
                </div>
                {patientRecords.map((record) => (
                  <RecordCard key={record._id} record={record} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  Search by Patient ID to view medical history.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Records by Weekday</h3>
            <p className="text-xs text-slate-400 mb-4">Your created records — live data</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traffic}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      {activePatient?.patientId && !loading && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl space-y-6">
          <PatientDocumentsList patientId={activePatient.patientId} />
          <div>
            <h2 className="text-xl font-bold text-white">
              Clinical workflow — {activePatient.patientId}
            </h2>
            <p className="text-slate-400 text-sm">
              Review patient uploads, then prescribe, document, and track the full care journey
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['prescription', 'voice', 'surgery', 'timeline'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setClinicalTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
                  clinicalTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {clinicalTab === 'prescription' && (
            <PrescriptionForm
              patientId={activePatient.patientId}
              onSaved={() => setTimelineKey((k) => k + 1)}
            />
          )}
          {clinicalTab === 'voice' && (
            <VoiceRecorder
              patientId={activePatient.patientId}
              onUploaded={() => setTimelineKey((k) => k + 1)}
            />
          )}
          {clinicalTab === 'surgery' && (
            <SurgeryCapture
              patientId={activePatient.patientId}
              onUploaded={() => setTimelineKey((k) => k + 1)}
            />
          )}
          {clinicalTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-6">
              <TreatmentTimeline patientId={activePatient.patientId} refreshKey={timelineKey} />
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                <h2 className="text-xl font-bold text-slate-800">New Medical Record</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={createRecord} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    required
                    value={patientId}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Symptoms <span className="text-slate-400 font-normal">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Document (JPG/PNG, max 5MB)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                    />
                    {file && (
                      <button
                        type="button"
                        onClick={handleOCRScan}
                        disabled={ocrScanning}
                        className="shrink-0 flex items-center justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400"
                      >
                        {ocrScanning ? (
                          <BrainCircuit className="animate-pulse h-4 w-4 mr-2" />
                        ) : (
                          <Scan className="h-4 w-4 mr-2" />
                        )}
                        {ocrScanning ? 'Scanning…' : 'OCR'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Clinical Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Clinical observations or OCR text…"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!diagnosis}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
