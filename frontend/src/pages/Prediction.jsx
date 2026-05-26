import { useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ChevronRight,
  CheckCircle2,
  Stethoscope,
  Clock,
  ListChecks,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SYMPTOM_CATEGORIES = [
  {
    id: 'respiratory',
    label: 'Respiratory',
    symptoms: ['fever', 'cough', 'sore throat', 'difficulty breathing', 'loss of smell', 'loss of taste'],
  },
  {
    id: 'general',
    label: 'General',
    symptoms: ['fatigue', 'body aches', 'chills', 'sweating', 'headache', 'dizziness', 'confusion'],
  },
  {
    id: 'gi',
    label: 'Digestive',
    symptoms: ['nausea', 'vomiting', 'diarrhea'],
  },
  {
    id: 'cardiac',
    label: 'Chest & heart',
    symptoms: ['chest pain'],
  },
  {
    id: 'msk',
    label: 'Musculoskeletal',
    symptoms: ['joint pain', 'rash'],
  },
];

const ALL_SYMPTOMS = SYMPTOM_CATEGORIES.flatMap((c) => c.symptoms);

const Prediction = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [activeCategory, setActiveCategory] = useState('respiratory');
  const [duration, setDuration] = useState('today');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const runPrediction = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Select at least one symptom');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post('/prediction/predict', {
        symptoms: selectedSymptoms,
        duration,
      });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Symptom assistant unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const activeSymptoms =
    SYMPTOM_CATEGORIES.find((c) => c.id === activeCategory)?.symptoms || ALL_SYMPTOMS;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-1">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900 leading-relaxed">
        <strong>Medical disclaimer:</strong> Advanced triage-style assistant for education only — not a diagnosis or
        medical device. Always consult a licensed healthcare professional.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-50 p-3 rounded-xl">
              <BrainCircuit className="text-blue-600 h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Symptom Assistant</h2>
              <p className="text-slate-600 text-sm mt-1">
                Pattern-matching engine with specialty routing and care urgency bands
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How long?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'today', label: 'Started today' },
                { id: 'days', label: '2–7 days' },
                { id: 'weeks', label: 'Over a week' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    duration === d.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {SYMPTOM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {activeSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <motion.button
                  key={symptom}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition border flex items-center ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  <span className="capitalize">{symptom}</span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mb-4">
            {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
          </p>

          <button
            type="button"
            onClick={runPrediction}
            disabled={loading || selectedSymptoms.length === 0}
            className="w-full relative overflow-hidden group bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? 'Analyzing symptom profile…' : 'Run clinical-style analysis'}
              {!loading && <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </motion.div>

        <div className="lg:col-span-5 relative min-h-[320px]">
          <AnimatePresence mode="wait">
            {!loading && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-5">
                  <Activity className="h-9 w-9 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Ready for analysis</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Select symptoms by category, then run the assistant to see urgency, specialty, and care steps.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 flex flex-col items-center justify-center text-center text-white"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full mb-6"
                />
                <p className="font-semibold tracking-wide text-sm">Building symptom profile…</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-xs font-bold tracking-wider mb-1">LIKELY PATTERN</p>
                      <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">{result.disease || '—'}</h3>
                    </div>
                    <div className="bg-white/10 px-3 py-2 rounded-xl text-center shrink-0">
                      <p className="text-[10px] text-slate-300 font-bold">MATCH</p>
                      <p className="text-lg font-bold text-blue-300">{result.confidence || '—'}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(result.severity)}`}
                  >
                    {result.severity === 'High' ? (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 mr-1" />
                    )}
                    {result.severity?.toUpperCase()} PRIORITY
                  </span>
                </div>

                <div className="p-8 space-y-6">
                  {result.urgency && (
                    <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-900 font-medium">{result.urgency}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-blue-600" /> Recommended actions
                    </h4>
                    <ul className="space-y-2">
                      {result.precautions?.map((precaution, idx) => (
                        <li
                          key={idx}
                          className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-700"
                        >
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                            {idx + 1}
                          </span>
                          {precaution}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Suggested specialist</p>
                      <p className="text-slate-900 font-bold">{result.specialist || '—'}</p>
                    </div>
                  </div>

                  {result.relatedConditions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Related patterns</p>
                      <div className="flex flex-wrap gap-2">
                        {result.relatedConditions.map((r) => (
                          <span key={r} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.analysisSteps?.length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      Analysis: {result.analysisSteps.join(' → ')}
                    </p>
                  )}

                  {result.disclaimer && (
                    <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-4">{result.disclaimer}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
