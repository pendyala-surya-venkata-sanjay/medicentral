import { useEffect, useState } from 'react';
import { useAuth } from '../context/authStore';
import api from '../api/axios';
import PatientDashboard from '../pages/PatientDashboard';
import DoctorWorkflowDashboard from '../pages/ops/DoctorWorkflowDashboard';
import ReceptionDashboard from '../pages/ops/ReceptionDashboard';
import StaffOverviewDashboard from '../pages/ops/StaffOverviewDashboard';
import PADashboard from '../pages/ops/PADashboard';
import HospitalDashboard from '../pages/HospitalDashboard';
import LabDashboard from '../pages/ops/LabDashboard';
import BillingDashboard from '../pages/ops/BillingDashboard';
import WardDashboard from '../pages/ops/WardDashboard';
import SurgeryDashboard from '../pages/ops/SurgeryDashboard';
import PharmacyDashboard from '../pages/ops/PharmacyDashboard';
import DischargeDashboard from '../pages/ops/DischargeDashboard';
import CommandCenter from '../pages/platform/CommandCenter';

const OpsDashboardRouter = () => {
  const { user } = useAuth();
  const [operationalRole, setOperationalRole] = useState(user?.operationalRole || null);
  const [loading, setLoading] = useState(
    ['staff', 'admin', 'doctor'].includes(user?.role) && !user?.operationalRole
  );

  useEffect(() => {
    if (!user?.token) return;
    if (user.role === 'patient') {
      setLoading(false);
      return;
    }
    if (user.operationalRole) {
      setOperationalRole(user.operationalRole);
      setLoading(false);
      return;
    }
    if (!['staff', 'admin', 'doctor'].includes(user.role)) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/profile')
      .then(({ data }) => {
        setOperationalRole(data.operationalRole);
      })
      .catch(() => {
        api
          .get('/ops/context')
          .then(({ data }) => setOperationalRole(data.operationalRole))
          .catch(() => setOperationalRole(user.role === 'doctor' ? 'doctor' : 'receptionist'));
      })
      .finally(() => setLoading(false));
  }, [user?.token, user?.role, user?.operationalRole]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user?.role === 'patient') return <PatientDashboard />;

  if (operationalRole === 'super_admin') {
    return <CommandCenter />;
  }

  if (operationalRole === 'receptionist' || (user?.role === 'staff' && !operationalRole)) {
    return <StaffOverviewDashboard />;
  }
  if (operationalRole === 'doctor_pa') return <PADashboard />;
  if (operationalRole === 'lab_supervisor') return <LabDashboard />;
  if (operationalRole === 'billing_staff') return <BillingDashboard />;
  if (operationalRole === 'ward_manager') return <WardDashboard />;
  if (operationalRole === 'surgery_head') return <SurgeryDashboard />;
  if (operationalRole === 'pharmacist') return <PharmacyDashboard />;
  if (operationalRole === 'printer_filing_officer') return <DischargeDashboard />;
  if (operationalRole === 'doctor' || user?.role === 'doctor') {
    return <DoctorWorkflowDashboard />;
  }
  if (user?.role === 'staff' || user?.role === 'admin') {
    return <HospitalDashboard />;
  }

  return <PatientDashboard />;
};

export default OpsDashboardRouter;
