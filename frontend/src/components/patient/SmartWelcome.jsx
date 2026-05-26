import { motion } from 'framer-motion';

import { Shield, Sparkles } from 'lucide-react';



const SmartWelcome = ({ cockpit, patientId, onCopyId }) => {

  const name = cockpit?.patientName?.split(' ')[0] || 'there';

  const hospitalCount = cockpit?.consent?.hospitalsWithAccess?.length || 0;

  const accessLine =

    hospitalCount > 0

      ? `${hospitalCount} hospital${hospitalCount > 1 ? 's' : ''} can access your records (with consent)`

      : 'Your records are private until you approve sharing';



  return (

    <motion.div

      initial={{ opacity: 0, y: 12 }}

      animate={{ opacity: 1, y: 0 }}

      className="patient-glass patient-glow-ring rounded-3xl p-6 sm:p-10 relative overflow-hidden"

    >

      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="relative">

        <p className="text-blue-600 text-sm font-medium flex items-center gap-2">

          <Sparkles className="w-4 h-4" /> {cockpit?.greeting || 'Welcome'}

        </p>

        <h1 className="text-3xl sm:text-4xl font-bold mt-3 tracking-tight text-slate-900">

          {name}

        </h1>

        <p className="text-slate-600 mt-4 max-w-xl text-sm leading-relaxed">{accessLine}</p>

        {cockpit?.consent?.pending > 0 && (

          <p className="mt-3 text-amber-700 text-sm font-medium bg-amber-50 inline-block px-3 py-1 rounded-lg">

            {cockpit.consent.pending} consent request{cockpit.consent.pending > 1 ? 's' : ''} awaiting your review

          </p>

        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">

          <span className="text-xs text-slate-500 uppercase tracking-wider">Your ID</span>

          <code className="text-blue-800 font-mono text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">

            {patientId}

          </code>

          <button

            type="button"

            onClick={onCopyId}

            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"

          >

            Copy

          </button>

          <span className="flex items-center gap-1 text-xs text-emerald-700 ml-auto">

            <Shield className="w-3.5 h-3.5" /> Records secured

          </span>

        </div>

      </div>

    </motion.div>

  );

};



export default SmartWelcome;

