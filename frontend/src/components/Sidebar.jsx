import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  Map,
  BrainCircuit,
  LogOut,
  Building2,
  ClipboardList,
  Stethoscope,
  UserCog,
  FlaskConical,
  IndianRupee,
  BedDouble,
  Scissors,
  Pill,
  FileCheck,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/authStore';

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const opRole = user?.operationalRole;
  const isPatient = user?.role === 'patient';
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['patient', 'doctor', 'staff', 'admin'] },
    { name: 'Command Center', href: '/platform', icon: Globe, opRoles: ['super_admin'], roles: ['admin'] },
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, opRoles: ['receptionist'], roles: ['staff'] },
    { name: 'Ward attendance', href: '/ops/ward-attendance', icon: BedDouble, opRoles: ['receptionist'], roles: ['staff'] },
    { name: 'Reception desk', href: '/ops/reception', icon: ClipboardList, opRoles: ['receptionist'], roles: ['staff', 'admin'] },
    { name: 'Pre-booked visits', href: '/ops/prebook', icon: UserCog, opRoles: ['receptionist'], roles: ['staff'] },
    { name: 'Follow-up & records', href: '/ops/follow-up', icon: Stethoscope, opRoles: ['receptionist'], roles: ['staff'] },
    { name: 'Discharge desk', href: '/ops/discharge', icon: FileCheck, opRoles: ['receptionist', 'printer_filing_officer'], roles: ['staff', 'admin'] },
    { name: 'Revenue & billing', href: '/hospital-ops', icon: IndianRupee, opRoles: ['receptionist', 'billing_staff'], roles: ['staff', 'admin'] },
    { name: 'PA Preparation', href: '/ops/pa', icon: UserCog, opRoles: ['doctor_pa'], roles: ['staff', 'admin'] },
    { name: 'Doctor Queue', href: '/ops/doctor', icon: Stethoscope, opRoles: ['doctor'], roles: ['doctor'] },
    { name: 'Lab Queue', href: '/ops/lab', icon: FlaskConical, opRoles: ['lab_supervisor'], roles: ['staff', 'admin'] },
    { name: 'Billing', href: '/ops/billing', icon: IndianRupee, opRoles: ['billing_staff'], roles: ['staff', 'admin'] },
    { name: 'Ward', href: '/ops/ward', icon: BedDouble, opRoles: ['ward_manager'], roles: ['staff', 'admin'] },
    { name: 'Surgery', href: '/ops/surgery', icon: Scissors, opRoles: ['surgery_head'], roles: ['staff', 'admin', 'doctor'] },
    { name: 'Pharmacy', href: '/ops/pharmacy', icon: Pill, opRoles: ['pharmacist'], roles: ['staff', 'admin'] },
    { name: 'Discharge', href: '/ops/discharge', icon: FileCheck, opRoles: ['printer_filing_officer'], roles: ['staff', 'admin'] },
    { name: 'Symptom Assistant', href: '/prediction', icon: BrainCircuit, patientOnly: true },
    { name: 'Nearby hospitals', href: '/hospitals', icon: Map, patientOnly: true },
  ].filter((item) => {
    if (item.patientOnly) return isPatient;
    if (opRole === 'receptionist' && item.name === 'Dashboard' && item.href === '/dashboard') return false;
    if (item.opRoles) {
      return item.opRoles.includes(opRole) || (item.roles?.includes(user?.role) && !opRole);
    }
    return !item.roles || item.roles.includes(user?.role);
  });

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login');
  };

  const handleNav = () => onNavigate?.();

  return (
    <div className="flex flex-col w-full h-full bg-white border-r border-slate-200 text-slate-900 shadow-sm">
      <div className="flex items-center space-x-2 px-6 py-8 border-b border-slate-200">
        <HeartPulse className="h-8 w-8 text-blue-500 shrink-0" />
        <span className="text-xl font-bold tracking-tight">
          Medi<span className="text-blue-500">Central</span>
        </span>
      </div>

      <div className="px-6 py-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-lg shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.operationalRole?.replace(/_/g, ' ') || user?.role} Portal
            </p>
            {user?.patientId && (
              <p className="text-xs text-blue-600 font-mono mt-0.5">ID: {user.patientId}</p>
            )}
            {user?.doctorId && (
              <p className="text-xs text-blue-600 font-mono mt-0.5">ID: {user.doctorId}</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNav}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 shrink-0 ${
                  isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-600'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
