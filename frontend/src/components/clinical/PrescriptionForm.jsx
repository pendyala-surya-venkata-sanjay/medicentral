import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';

const emptyMed = () => ({
  medicine: '',
  dosage: '',
  frequency: '',
  duration: '',
  durationDays: '',
  timing: '',
  instructions: '',
});

const PrescriptionForm = ({ patientId, onSaved }) => {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  const updateMed = (idx, field, value) => {
    const next = [...medicines];
    next[idx][field] = value;
    setMedicines(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!patientId || !diagnosis.trim()) {
      toast.error('Patient ID and diagnosis are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/prescriptions', {
        patientId,
        symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        diagnosis,
        medicines: medicines
          .filter((m) => m.medicine.trim())
          .map((m) => ({
            ...m,
            durationDays: m.durationDays ? Number(m.durationDays) : undefined,
          })),
        clinicalNotes,
        notes,
        followUpDate: followUpDate || undefined,
      });
      toast.success('Prescription saved');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800">Digital prescription</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Symptoms</label>
          <input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="fever, cough"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Diagnosis *</label>
          <input
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Follow-up date</label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Medicines</label>
          <button type="button" onClick={() => setMedicines([...medicines, emptyMed()])} className="text-blue-600 text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {medicines.map((m, idx) => (
            <div key={idx} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end bg-slate-50 p-3 rounded-xl">
              <input placeholder="Medicine *" value={m.medicine} onChange={(e) => updateMed(idx, 'medicine', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMed(idx, 'frequency', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Timing" value={m.timing} onChange={(e) => updateMed(idx, 'timing', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <input type="number" min={1} placeholder="Days *" title="Patient alert duration" value={m.durationDays} onChange={(e) => updateMed(idx, 'durationDays', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Duration note" value={m.duration} onChange={(e) => updateMed(idx, 'duration', e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="text-red-500 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Clinical description (surgery, ICU, progress)</label>
        <RichTextEditor value={clinicalNotes} onChange={setClinicalNotes} />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase">Additional notes</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save prescription'}
      </button>
    </form>
  );
};

export default PrescriptionForm;
