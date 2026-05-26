import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Pill,
  Mic,
  Image,
  Receipt,
  BrainCircuit,
  Building2,
  LogIn,
  LogOut,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react';
import api from '../../api/axios';
import { resolveUploadUrl } from '../../utils/media';
import { formatINR } from '../../utils/format';

const icons = {
  record: FileText,
  prescription: Pill,
  voice: Mic,
  surgery: Image,
  billing: Receipt,
  prediction: BrainCircuit,
  visit: Building2,
  admission: LogIn,
  discharge: LogOut,
  lab: FlaskConical,
  patient_upload: Upload,
  workflow: Building2,
  consent: Building2,
  vitals: FlaskConical,
  admission: LogIn,
  nursing: FileText,
};

const colors = {
  record: 'bg-blue-500',
  prescription: 'bg-emerald-500',
  voice: 'bg-red-500',
  surgery: 'bg-purple-500',
  billing: 'bg-amber-500',
  prediction: 'bg-indigo-500',
  visit: 'bg-cyan-500',
  admission: 'bg-teal-500',
  discharge: 'bg-slate-500',
  lab: 'bg-orange-500',
  patient_upload: 'bg-sky-500',
  workflow: 'bg-indigo-500',
  consent: 'bg-violet-500',
  vitals: 'bg-rose-500',
  admission: 'bg-teal-500',
  nursing: 'bg-cyan-500',
};

const typeLabels = {
  record: 'Clinic visit',
  prescription: 'Prescription',
  voice: 'Voice note',
  surgery: 'Surgery media',
  billing: 'Bill',
  prediction: 'Symptom check',
  visit: 'Hospital visit',
  admission: 'Admission',
  discharge: 'Discharge',
  lab: 'Lab report',
  patient_upload: 'Your upload',
  workflow: 'Workflow',
  consent: 'Consent',
  vitals: 'Vitals',
  nursing: 'Nursing note',
};

const TreatmentTimeline = ({ patientId, refreshKey = 0 }) => {
  const [events, setEvents] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const url = patientId ? `/timeline/patient/${patientId}` : '/timeline/patient';
        const { data } = await api.get(url);
        setEvents(data.events || []);
        setHospitals(data.hospitals || []);
      } catch {
        setEvents([]);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId, refreshKey]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;
  }

  if (!events.length) {
    return (
      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-slate-500 font-medium">No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hospitals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hospitals.map((h) => (
            <span
              key={h.tenant?.slug || h.tenant?.name}
              className="text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100 px-2 py-1 rounded-lg"
            >
              {h.tenant?.name}
              {h.branches?.[0]?.city ? ` · ${h.branches[0].city}` : ''} ({h.visitCount})
            </span>
          ))}
        </div>
      )}
    <div className="relative space-y-0 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-slate-200 before:to-transparent">
      {events.map((ev) => {
        const Icon = icons[ev.type] || FileText;
        const eventKey = String(ev.id ?? `${ev.type}-${ev.date}`);
        const open = expanded === eventKey;
        return (
          <motion.div key={eventKey} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="relative pl-14 pb-8">
            <div className={`absolute left-2 top-1 w-7 h-7 rounded-full ${colors[ev.type] || 'bg-slate-400'} flex items-center justify-center shadow-lg border-2 border-white`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full flex justify-between items-start p-4 text-left hover:bg-slate-50 transition"
                onClick={() => setExpanded(open ? null : eventKey)}
              >
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    {typeLabels[ev.type] || ev.type}
                  </p>
                  {ev.hospital && (
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">
                      {ev.hospital}
                      {ev.branch ? ` · ${ev.branch}` : ''}
                    </p>
                  )}
                  <h4 className="font-bold text-slate-800">{ev.displayTitle || ev.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{new Date(ev.date).toLocaleString()}</p>
                </div>
                {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-slate-100 p-4 text-sm text-slate-600">
                    {ev.summary && <p className="mb-3">{ev.summary}</p>}
                    {ev.type === 'prescription' && ev.data?.medicines?.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {ev.data.medicines.map((m, i) => (
                          <li key={i}>{m.medicine} — {m.dosage} {m.frequency}{m.timing ? ` (${m.timing})` : ''} — {m.duration}</li>
                        ))}
                      </ul>
                    )}
                    {ev.type === 'prescription' && ev.data?.clinicalNotes && (
                      <div className="mt-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ev.data.clinicalNotes }} />
                    )}
                    {ev.type === 'voice' && ev.data?.audioUrl && (
                      <audio controls className="w-full mt-2" src={resolveUploadUrl(ev.data.audioUrl)} />
                    )}
                    {ev.type === 'surgery' && ev.data?.mediaUrl && (
                      <img src={resolveUploadUrl(ev.data.mediaUrl)} alt={ev.title} className="mt-2 rounded-xl max-h-48 object-cover" />
                    )}
                    {ev.type === 'billing' && (
                      <p className="font-semibold">Amount: {formatINR(ev.data?.totalAmount)} — {ev.data?.status}</p>
                    )}
                    {ev.type === 'lab' && ev.data?.reportUrl && (
                      <a href={resolveUploadUrl(ev.data.reportUrl)} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View lab report</a>
                    )}
                    {ev.type === 'patient_upload' && ev.data?.fileUrl && (
                      <a
                        href={resolveUploadUrl(ev.data.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-cyan-700 font-semibold text-sm mt-2"
                      >
                        View uploaded document
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
    </div>
  );
};

export default TreatmentTimeline;
