import { useContext } from 'react';
import { AuthContext } from '../context/authStore';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">MediCentral</h1>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition">
              Dashboard
            </Link>
            <Link to="/prediction" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition">
              AI Prediction
            </Link>
            <Link to="/hospitals" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition">
              Find Hospital
            </Link>
            <span className="text-slate-600 font-medium text-sm border-l pl-6 border-slate-200">
              {user?.name} ({user?.role})
            </span>
            <button 
              onClick={handleLogout}
              className="bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-md transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
