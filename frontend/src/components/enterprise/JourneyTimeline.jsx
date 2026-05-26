import { useState } from 'react';
import { Filter } from 'lucide-react';
import SmartTimeline from '../intelligence/SmartTimeline';

const JourneyTimeline = ({ patientId, refreshKey = 0, hospitals = [] }) => {
  const [hospitalFilter, setHospitalFilter] = useState('all');

  return (
    <div className="ops-glass rounded-2xl border border-slate-800/80 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/90">Healthcare journey</p>
          <p className="text-sm text-slate-400">Interactive timeline · grouped by care events</p>
        </div>
        {hospitals.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="text-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
            >
              <option value="all">All hospitals</option>
              {hospitals.map((h) => (
                <option key={h.tenant?.slug} value={h.tenant?.name}>
                  {h.tenant?.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="p-4 max-h-[28rem] overflow-y-auto">
        <SmartTimeline patientId={patientId} refreshKey={refreshKey} hospitalFilter={hospitalFilter} dark />
      </div>
    </div>
  );
};

export default JourneyTimeline;
