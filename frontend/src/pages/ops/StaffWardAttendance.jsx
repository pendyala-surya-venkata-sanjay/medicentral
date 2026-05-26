import { useEffect, useState } from 'react';
import { BedDouble } from 'lucide-react';
import api from '../../api/axios';
import OpsShell from '../../components/enterprise/OpsShell';
import { workflowStateLabel } from '../../utils/visitLabels';

const StaffWardAttendance = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    api
      .get('/ops/ward/admitted')
      .then(({ data }) => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]));
  }, []);

  return (
    <OpsShell
      title="Ward attendance"
      subtitle="Patients currently admitted or under observation"
      icon={BedDouble}
      role="receptionist"
      showWidgets={false}
    >
      <div className="ops-card">
        {patients.length === 0 ? (
          <p className="text-sm text-slate-500 p-4">No patients admitted to ward at this branch.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {patients.map((p) => (
              <li key={p.patientId + (p.visit?._id || '')} className="py-4 px-1 flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-blue-700">{p.patientId}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.visit?.inpatient?.wardName || 'Ward pending'} · Bed{' '}
                    {p.visit?.inpatient?.bedNumber || '—'} · Room {p.visit?.inpatient?.roomNumber || '—'}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg h-fit">
                  {workflowStateLabel(p.visit?.workflowState)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </OpsShell>
  );
};

export default StaffWardAttendance;
