import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="text-center max-w-md">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-600 mb-6">You do not have permission to view this page.</p>
      <Link
        to="/dashboard"
        className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default Unauthorized;
