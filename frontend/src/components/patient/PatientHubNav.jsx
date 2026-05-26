import { motion } from 'framer-motion';

import { Home, Route, Sparkles, Upload } from 'lucide-react';



const TABS = [

  { id: 'home', label: 'Home', icon: Home },

  { id: 'journey', label: 'Journey', icon: Route },

  { id: 'prebook', label: 'Pre-book', icon: Sparkles },

  { id: 'records', label: 'Records', icon: Upload },

];



const PatientHubNav = ({ active, onChange }) => (

  <nav className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">

    {TABS.map((t) => {

      const isActive = active === t.id;

      return (

        <button

          key={t.id}

          type="button"

          onClick={() => onChange(t.id)}

          className={`relative snap-center shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition ${

            isActive ? 'text-blue-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'

          }`}

        >

          {isActive && (

            <motion.div

              layoutId="patient-tab"

              className="absolute inset-0 bg-white border border-blue-200 shadow-sm rounded-xl"

              transition={{ type: 'spring', stiffness: 400, damping: 30 }}

            />

          )}

          <t.icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-blue-600' : ''}`} />

          <span className="relative z-10">{t.label}</span>

        </button>

      );

    })}

  </nav>

);



export default PatientHubNav;

