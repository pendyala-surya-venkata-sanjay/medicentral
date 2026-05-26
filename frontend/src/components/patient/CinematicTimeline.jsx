import { motion } from 'framer-motion';

import { Route } from 'lucide-react';

import SmartTimeline from '../intelligence/SmartTimeline';

import AIPatientSummaryCard from '../intelligence/AIPatientSummaryCard';



const CinematicTimeline = ({ patientId, refreshKey, hospitals = [] }) => {

  return (

    <motion.section

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      className="space-y-8"

    >

      <div className="flex items-center gap-4">

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">

          <Route className="w-6 h-6 text-blue-600" />

        </div>

        <div>

          <h2 className="text-xl font-bold text-slate-900">Your care journey</h2>

          <p className="text-sm text-slate-600 mt-1">

            Each hospital visit is grouped with time-ordered actions inside

          </p>

        </div>

      </div>



      <div className="relative pl-2">

        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-300 via-indigo-200 to-transparent" />

        <div className="pl-10 space-y-8">

          {patientId && <AIPatientSummaryCard patientId={patientId} />}

          <div className="patient-glass rounded-2xl p-6 sm:p-8">

            <SmartTimeline

              patientId={patientId}

              refreshKey={refreshKey}

              dark={false}

              groupByVisit

              hospitalFilter="all"

            />

          </div>

        </div>

      </div>

    </motion.section>

  );

};



export default CinematicTimeline;

