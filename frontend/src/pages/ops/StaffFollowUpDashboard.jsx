import { useEffect, useState } from 'react';
import { Stethoscope, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import OpsShell from '../../components/enterprise/OpsShell';
import OpsPatientIdBar from '../../components/ops/OpsPatientIdBar';
import PatientSmartPanel from '../../components/ops/PatientSmartPanel';
import { workflowStateLabel, visitTypeLabel } from '../../utils/visitLabels';
import { Link } from 'react-router-dom';

const StaffFollowUpDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [upload, setUpload] = useState({ title: '', category: 'imaging' });
  const [file, setFile] = useState(null);

  const load = () => {
    api
      .get('/ops/follow-up/patients')
      .then(({ data }) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleLookup = (data) => {
    if (data?.patient) {
      setSelected(data.patient);
      load();
    }
  };

  const uploadScan = async () => {
    const visitId = selected?.visit?._id;
    if (!visitId || !file) return toast.error('Select a patient with active visit and choose a file');
    const form = new FormData();
    form.append('document', file);
    form.append('title', upload.title || file.name);
    form.append('category', upload.category);
    try {
      await api.post(`/ops/visit/${visitId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Scan / report uploaded to patient record');
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <OpsShell
      title="Follow-up & records"
      subtitle="Patients seen by doctors · Upload imaging · Route to discharge & billing"
      icon={Stethoscope}
      role="receptionist"
      showWidgets={false}
    >
      <OpsPatientIdBar onResolved={handleLookup} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ops-card">
          <h3 className="font-bold text-slate-900 mb-4">Doctor-seen patients (in progress)</h3>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {patients.map((p) => (
              <li key={p.patientId + (p.visit?._id || '')}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                    selected?.patientId === p.patientId
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-blue-700">{p.patientId}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {workflowStateLabel(p.visit?.workflowState)} · {visitTypeLabel(p.visit?.visitType)}
                  </p>
                </button>
              </li>
            ))}
            {patients.length === 0 && (
              <p className="text-sm text-slate-500">No patients in follow-up stage.</p>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <PatientSmartPanel patient={selected} />
          {selected?.visit?._id && (
            <div className="ops-card space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload X-ray / scan / report
              </h3>
              <input
                placeholder="Report title"
                value={upload.title}
                onChange={(e) => setUpload({ ...upload, title: e.target.value })}
                className="ops-input"
              />
              <select
                value={upload.category}
                onChange={(e) => setUpload({ ...upload, category: e.target.value })}
                className="ops-input"
              >
                <option value="imaging">Imaging</option>
                <option value="lab">Laboratory</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other</option>
              </select>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0])} className="text-sm text-slate-800" />
              <button type="button" onClick={uploadScan} className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm">
                Upload to patient timeline
              </button>
              <Link
                to="/ops/discharge"
                className="block text-center text-sm text-blue-700 font-semibold hover:underline"
              >
                Open discharge & billing desk →
              </Link>
            </div>
          )}
        </div>
      </div>
    </OpsShell>
  );
};

export default StaffFollowUpDashboard;
