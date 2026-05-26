import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import BrandedLoader from './components/brand/BrandedLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const Prediction = lazy(() => import('./pages/Prediction'));
const Hospitals = lazy(() => import('./pages/Hospitals'));
const HospitalDashboard = lazy(() => import('./pages/HospitalDashboard'));
const OpsDashboardRouter = lazy(() => import('./components/OpsDashboardRouter'));
const ReceptionDashboard = lazy(() => import('./pages/ops/ReceptionDashboard'));
const PADashboard = lazy(() => import('./pages/ops/PADashboard'));
const DoctorWorkflowDashboard = lazy(() => import('./pages/ops/DoctorWorkflowDashboard'));
const LabDashboard = lazy(() => import('./pages/ops/LabDashboard'));
const BillingDashboard = lazy(() => import('./pages/ops/BillingDashboard'));
const WardDashboard = lazy(() => import('./pages/ops/WardDashboard'));
const SurgeryDashboard = lazy(() => import('./pages/ops/SurgeryDashboard'));
const PharmacyDashboard = lazy(() => import('./pages/ops/PharmacyDashboard'));
const DischargeDashboard = lazy(() => import('./pages/ops/DischargeDashboard'));
const StaffPrebookDashboard = lazy(() => import('./pages/ops/StaffPrebookDashboard'));
const StaffFollowUpDashboard = lazy(() => import('./pages/ops/StaffFollowUpDashboard'));
const StaffWardAttendance = lazy(() => import('./pages/ops/StaffWardAttendance'));
const CommandCenter = lazy(() => import('./pages/platform/CommandCenter'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

const PageLoader = () => <BrandedLoader />;

const DashboardRouter = () => <OpsDashboardRouter />;

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          },
        }}
      />

      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prediction"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout>
                  <Prediction />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospitals"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout>
                  <Hospitals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital-ops"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <HospitalDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <Layout>
                  <CommandCenter />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/reception"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <ReceptionDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/prebook"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <StaffPrebookDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/follow-up"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <StaffFollowUpDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/ward-attendance"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <StaffWardAttendance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/pa"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <PADashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/lab"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <LabDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/billing"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <BillingDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/ward"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <WardDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/surgery"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'doctor']}>
                <Layout>
                  <SurgeryDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/pharmacy"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <PharmacyDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/discharge"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <Layout>
                  <DischargeDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'staff', 'admin']}>
                <Layout>
                  <DoctorWorkflowDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
