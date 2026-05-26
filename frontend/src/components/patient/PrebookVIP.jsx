import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { Calendar, Sparkles, Clock, X, Building2, MapPin } from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../api/axios';

import { formatDateIN } from '../../utils/format';



const DEPARTMENTS = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology'];



const PrebookVIP = ({ cockpit, onRefresh }) => {

  const [department, setDepartment] = useState('General Medicine');

  const [date, setDate] = useState('');

  const [time, setTime] = useState('09:00');

  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [hospitals, setHospitals] = useState([]);

  const [selected, setSelected] = useState(null);



  const pending = cockpit?.prebook;



  useEffect(() => {

    api

      .get('/patient-portal/hospitals')

      .then(({ data }) => setHospitals(Array.isArray(data) ? data : []))

      .catch(() => setHospitals([]));

  }, []);



  const submit = async (e) => {

    e.preventDefault();

    if (!date) return toast.error('Pick a date');

    if (!selected) return toast.error('Select a registered hospital');

    const scheduledAt = new Date(`${date}T${time}`);

    setSubmitting(true);

    try {

      const { data } = await api.post('/patient-portal/prebook', {

        department,

        scheduledAt: scheduledAt.toISOString(),

        notes,

        tenantSlug: selected.tenantSlug,

        branchSlug: selected.branchSlug,

      });

      toast.success(data.message || 'VIP pre-booking confirmed');

      onRefresh?.();

    } catch (err) {

      toast.error(err.response?.data?.message || 'Pre-book failed');

    } finally {

      setSubmitting(false);

    }

  };



  const cancel = async () => {

    if (!pending?._id) return;

    try {

      await api.delete(`/patient-portal/prebook/${pending._id}`);

      toast.success('Pre-booking cancelled');

      onRefresh?.();

    } catch (err) {

      toast.error(err.response?.data?.message || 'Cancel failed');

    }

  };



  return (

    <motion.div

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      className="patient-glass rounded-3xl p-6 sm:p-8 border border-violet-100"

    >

      <div className="flex items-center gap-3 mb-3">

        <Sparkles className="w-6 h-6 text-violet-600" />

        <h2 className="text-xl font-bold text-slate-900">VIP pre-book</h2>

      </div>

      <p className="text-sm text-slate-600 mb-8 leading-relaxed">

        Book only at MediCentral partner hospitals. Reception recognizes your Patient ID for priority check-in.

      </p>



      {pending ? (

        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">

          <p className="text-violet-800 font-semibold flex items-center gap-2">

            <Calendar className="w-4 h-4" /> Scheduled visit

          </p>

          <p className="text-slate-900 mt-3 text-lg font-medium">{pending.department}</p>

          <p className="text-sm text-slate-600 mt-2">

            {formatDateIN(pending.scheduledAt)} · {pending.tenant?.name}

            {pending.branch?.name ? ` · ${pending.branch.name}` : ''}

          </p>

          <p className="text-blue-700 text-sm mt-4 flex items-center gap-2">

            <Clock className="w-4 h-4" /> Show your Patient ID at reception for priority check-in

          </p>

          <button

            type="button"

            onClick={cancel}

            className="mt-5 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"

          >

            <X className="w-4 h-4" /> Cancel pre-booking

          </button>

        </div>

      ) : (

        <form onSubmit={submit} className="space-y-6">

          <div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Choose hospital</p>

            <div className="grid gap-3 sm:grid-cols-2">

              {hospitals.length === 0 ? (

                <p className="text-sm text-slate-500 col-span-2 py-4 text-center">

                  No partner hospitals loaded. Contact support if this persists.

                </p>

              ) : (

                hospitals.map((h) => {

                  const isSel = selected?._id === h._id;

                  return (

                    <button

                      key={h._id}

                      type="button"

                      onClick={() => setSelected(h)}

                      className={`text-left p-4 rounded-2xl border transition ${

                        isSel

                          ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'

                          : 'border-slate-200 bg-white hover:border-violet-200'

                      }`}

                    >

                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">

                        <Building2 className="w-4 h-4 text-violet-600 shrink-0" />

                        {h.hospitalName}

                      </p>

                      <p className="text-xs text-slate-600 mt-1">{h.branchName}</p>

                      <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">

                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />

                        {h.city}

                        {h.distanceText ? ` · ${h.distanceText}` : ''}

                      </p>

                    </button>

                  );

                })

              )}

            </div>

          </div>



          <select

            value={department}

            onChange={(e) => setDepartment(e.target.value)}

            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900"

          >

            {DEPARTMENTS.map((d) => (

              <option key={d} value={d}>{d}</option>

            ))}

          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <input

              type="date"

              value={date}

              onChange={(e) => setDate(e.target.value)}

              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900"

              required

            />

            <input

              type="time"

              value={time}

              onChange={(e) => setTime(e.target.value)}

              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900"

            />

          </div>

          <textarea

            value={notes}

            onChange={(e) => setNotes(e.target.value)}

            placeholder="Symptoms or reason for visit (optional)"

            rows={3}

            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900"

          />

          <button

            type="submit"

            disabled={submitting || !selected}

            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition disabled:opacity-50"

          >

            {submitting ? 'Booking…' : 'Confirm VIP pre-book'}

          </button>

        </form>

      )}

    </motion.div>

  );

};



export default PrebookVIP;

