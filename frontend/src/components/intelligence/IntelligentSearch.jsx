import { useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../api/axios';

const kindLabels = {
  patient: 'Patient',
  visit: 'Visit',
  lab: 'Lab',
  prescription: 'Rx',
  hospital: 'Hospital',
  doctor: 'Doctor',
};

const IntelligentSearch = ({ onSelectPatient, compact = false }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    if (q.length < 2) return;
    const { data } = await api.get('/intelligence/search', { params: { q } });
    setResults(data.results || []);
  };

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl border p-4 shadow-sm'}>
      {!compact && (
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Intelligent search</p>
      )}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Patient, medicine, diagnosis, workflow…"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={search}
          className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto text-sm divide-y border rounded-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-50"
                onClick={() => r.kind === 'patient' && onSelectPatient?.(r.id)}
              >
                <span className="text-[10px] font-bold text-indigo-600 uppercase">{kindLabels[r.kind] || r.kind}</span>
                <p className="font-medium">{r.title}</p>
                {r.subtitle && <p className="text-xs text-slate-500">{r.subtitle}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IntelligentSearch;
