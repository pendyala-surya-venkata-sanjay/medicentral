import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/prediction': 'Symptom Assistant',
  '/hospitals': 'Hospital Locator',
  '/hospital-ops': 'Revenue & billing',
  '/ops/ward-attendance': 'Ward attendance',
  '/ops/follow-up': 'Follow-up & records',
  '/ops/prebook': 'Pre-booked visits',
  '/platform': 'Command Center',
  '/ops/reception': 'Reception',
  '/ops/doctor': 'Doctor',
  '/ops/lab': 'Lab',
  '/ops/ward': 'Ward',
  '/ops/surgery': 'Surgery',
  '/ops/pharmacy': 'Pharmacy',
  '/ops/billing': 'Billing',
  '/ops/discharge': 'Discharge',
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Overview';
  const isOpsRoute = location.pathname.startsWith('/ops') || location.pathname.startsWith('/platform');
  const isPatientHub =
    ['/dashboard', '/hospitals', '/prediction'].includes(location.pathname) && !isOpsRoute;

  return (
    <div
      className={`flex min-h-screen ${
        isOpsRoute ? 'bg-slate-100 layout-ops' : isPatientHub ? 'bg-slate-50' : 'bg-slate-50'
      }`}
    >
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col lg:ml-64 min-h-screen w-full">
        <header
          className={`sticky top-0 z-30 h-14 sm:h-16 flex items-center px-4 sm:px-8 gap-4 ${
            'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm text-slate-800'
          }`}
        >
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1
            className="text-lg font-semibold truncate text-slate-800"
          >
            {title}
          </h1>
        </header>

        <main
          className={`flex-1 overflow-y-auto ${
            isOpsRoute || isPatientHub ? '' : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <div className={isOpsRoute || isPatientHub ? 'w-full' : 'max-w-7xl mx-auto'}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
