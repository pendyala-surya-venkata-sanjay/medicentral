import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, CheckCircle, CalendarClock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useQueue, transitionVisit, useOpsContext } from '../../hooks/useOpsContext';
import { useLivePulse } from '../../hooks/useLivePulse';
import QueuePatientCard from '../../components/ops/QueuePatientCard';
import PrescriptionForm from '../../components/clinical/PrescriptionForm';
import OpsShell from '../../components/enterprise/OpsShell';
import JourneyTimeline from '../../components/enterprise/JourneyTimeline';
import { workflowStateLabel } from '../../utils/visitLabels';

const DoctorWorkflowDashboard = () => {
  const { ctx } = useOpsContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const { patients, loading } = useQueue('DOCTOR', refreshKey, ctx);
  const [followUps, setFollowUps] = useState([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  useLivePulse(refreshKey);
  const [selected, setSelected] = useState(null);
  const [timelineKey, setTimelineKey] = useState(0);
  const [hasPrescription, setHasPrescription] = useState(false);
  const [closing, setClosing] = useState(false);

  const visitId = selected?.visit?._id;
  const patientId = selected?.patientId;
  const workflowState = selected?.visit?.workflowState;
  const canAccept = workflowState === 'WAITING_FOR_DOCTOR';
  const inConsultation = workflowState === 'IN_CONSULTATION';

  const loadFollowUps = useCallback(() => {
    setFollowUpsLoading(true);
    api
      .get('/ops/doctor/follow-ups')
      .then(({ data }) => setFollowUps(Array.isArray(data) ? data : []))
      .catch(() => setFollowUps([]))
      .finally(() => setFollowUpsLoading(false));
  }, []);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps, refreshKey]);

  useEffect(() => {
    if (!visitId) {
      setHasPrescription(false);
      return;
    }
    api
      .get(`/ops/doctor/visit/${visitId}`)
      .then(({ data }) => {
        setHasPrescription(Boolean(data.visit?.hasDoctorPrescription));
        if (data.visit?.workflowState && selected?.visit) {
          setSelected((prev) =>
            prev
              ? {
                  ...prev,
                  visit: { ...prev.visit, ...data.visit, workflowState: data.visit.workflowState },
                }
              : prev
          );
        }
      })
      .catch(() => setHasPrescription(false));
  }, [visitId, refreshKey, timelineKey]);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    setTimelineKey((k) => k + 1);
    loadFollowUps();
  };

  const acceptPatient = async () => {
    if (!visitId) return toast.error('Select a patient from the queue');
    try {
      await transitionVisit(visitId, 'accept_patient', {});
      toast.success('Patient accepted — review records and prescribe');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept patient');
    }
  };

  const completeVisit = async (action) => {
    if (!visitId) return;
    if (!hasPrescription) {
      return toast.error('Save a prescription first, then choose follow-up or discharge');
    }
    setClosing(true);
    try {
      await transitionVisit(visitId, action, {});
      toast.success(
        action === 'mark_follow_up'
          ? 'Patient moved to follow-up — staff billing & records updated'
          : 'Patient marked ready for discharge — removed from your consultation queue'
      );
      setSelected(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete visit');
    } finally {
      setClosing(false);
    }
  };

  const consultationPatients = patients.filter((p) =>
    ['WAITING_FOR_DOCTOR', 'IN_CONSULTATION'].includes(p.visit?.workflowState)
  );

  return (
    <OpsShell
      title="Doctor consultation"
      subtitle={`${ctx?.tenant?.name || 'Hospital'} · Queue · Prescribe · Follow-up or discharge`}
      icon={Stethoscope}
      role="doctor"
      refreshKey={refreshKey}
      showWidgets={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm px-1 mb-2">Consultation queue</h3>
            {loading ? (
              <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
            ) : consultationPatients.length === 0 ? (
              <div className="ops-card p-6 text-sm text-slate-600">
                No patients in consultation. Check follow-up list below if you already sent patients to staff.
              </div>
            ) : (
              consultationPatients.map((p, i) => (
                <QueuePatientCard
                  key={p.patientId + (p.visit?._id || '')}
                  patient={p}
                  selected={selected?.patientId === p.patientId}
                  onSelect={setSelected}
                  variant="ops"
                  index={i}
                />
              ))
            )}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm px-1 mb-2 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-600" />
              Follow-up queue ({followUps.length})
            </h3>
            <p className="text-xs text-slate-500 px-1 mb-2">
              Patients you sent for follow-up — with staff for billing & records.
            </p>
            {followUpsLoading ? (
              <div className="animate-pulse h-20 bg-slate-100 rounded-xl" />
            ) : followUps.length === 0 ? (
              <div className="ops-card p-4 text-sm text-slate-500">No follow-up patients yet.</div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {followUps.map((p) => (
                  <li
                    key={p.patientId + (p.visit?._id || '')}
                    className="ops-card p-3 text-sm cursor-pointer hover:border-blue-300"
                    onClick={() => setSelected(p)}
                  >
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="font-mono text-xs text-blue-700">{p.patientId}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {workflowStateLabel(p.visit?.workflowState)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <div className="ops-card p-8 text-center text-slate-600 text-sm">
              Select a patient from the consultation or follow-up queue.
            </div>
          ) : (
            <>
              <div className="ops-card p-5">
                <p className="text-lg font-bold text-slate-900">{selected.name}</p>
                <p className="font-mono text-sm text-blue-700 mt-0.5">{selected.patientId}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {workflowStateLabel(workflowState)}
                  {selected.visit?.tokenNumber ? ` · Token ${selected.visit.tokenNumber}` : ''}
                </p>
              </div>

              {canAccept && (
                <button
                  type="button"
                  onClick={acceptPatient}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" /> Accept patient
                </button>
              )}

              {inConsultation && (
                <>
                  <div className="ops-card p-5">
                    <h3 className="font-bold text-slate-900 mb-3">Previous records</h3>
                    {patientId ? (
                      <JourneyTimeline patientId={patientId} refreshKey={timelineKey} />
                    ) : (
                      <p className="text-sm text-slate-500">No patient history available.</p>
                    )}
                  </div>

                  <div className="ops-card p-5">
                    <h3 className="font-bold text-slate-900 mb-4">Prescription</h3>
                    <PrescriptionForm
                      patientId={patientId}
                      onSaved={() => {
                        setHasPrescription(true);
                        setTimelineKey((k) => k + 1);
                        toast.success('Prescription saved — choose follow-up or discharge');
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!hasPrescription || closing}
                      onClick={() => completeVisit('mark_follow_up')}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <CalendarClock className="w-5 h-5" /> Schedule follow-up
                    </button>
                    <button
                      type="button"
                      disabled={!hasPrescription || closing}
                      onClick={() => completeVisit('ready_discharge')}
                      className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" /> Ready for discharge
                    </button>
                  </div>
                  {!hasPrescription && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Save the prescription first. Then the patient leaves your consultation queue.
                    </p>
                  )}
                </>
              )}

              {!canAccept && !inConsultation && (
                <div className="ops-card p-6 text-sm text-slate-600">
                  This visit is with staff ({workflowStateLabel(workflowState)}). Open the staff
                  follow-up or discharge desk to continue.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </OpsShell>
  );
};

export default DoctorWorkflowDashboard;
