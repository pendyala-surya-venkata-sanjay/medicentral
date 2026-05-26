import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Stethoscope, FlaskConical, IndianRupee, BedDouble, LayoutDashboard } from 'lucide-react';

const links = [
  { href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
  { href: '/ops/reception', icon: ClipboardList, roles: ['receptionist'] },
  { href: '/ops/doctor', icon: Stethoscope, roles: ['doctor'] },
  { href: '/ops/lab', icon: FlaskConical, roles: ['lab_supervisor'] },
  { href: '/ops/ward', icon: BedDouble, roles: ['ward_manager'] },
  { href: '/ops/billing', icon: IndianRupee, roles: ['billing_staff'] },
];

const MobileOpsNav = ({ role }) => {
  const location = useLocation();
  const visible = links.filter((l) => l.roles.includes('*') || l.roles.includes(role));

  if (visible.length <= 2) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 safe-area-pb">
      <div className="flex justify-around items-center h-14 px-2">
        {visible.slice(0, 5).map((l) => {
          const active = location.pathname === l.href;
          return (
            <Link
              key={l.href}
              to={l.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 touch-manipulation ${
                active ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <l.icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-medium truncate max-w-[4rem]">
                {l.href.split('/').pop()}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileOpsNav;
