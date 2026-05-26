import { motion } from 'framer-motion';
import { Search, User } from 'lucide-react';
import IntelligentSearch from '../intelligence/IntelligentSearch';

const CinematicPatientSearch = ({ onSelectPatient, ecosystem, selectedPatient }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="ops-glass rounded-2xl border border-indigo-500/20 p-6 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-cyan-600/5 pointer-events-none" />
    <div className="relative">
      <h2 className="font-bold text-lg flex items-center gap-2 text-white mb-1">
        <Search className="w-5 h-5 text-indigo-400" /> Global patient search
      </h2>
      <p className="text-xs text-slate-500 mb-4">Instant cross-hospital continuity lookup</p>
      <IntelligentSearch onSelectPatient={onSelectPatient} compact />
      {ecosystem && selectedPatient && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-slate-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <p className="font-bold text-white">{ecosystem.patient?.name}</p>
              <p className="text-xs font-mono text-cyan-400">{ecosystem.patient?.patientId}</p>
            </div>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {(ecosystem.timeline || []).slice(0, 10).map((e, i) => (
              <li
                key={i}
                className="text-sm text-slate-400 border-l-2 border-indigo-500/60 pl-3 py-1"
              >
                {e.title || e.displayTitle}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  </motion.div>
);

export default CinematicPatientSearch;
