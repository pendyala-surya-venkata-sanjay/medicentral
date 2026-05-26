import { useState, useContext } from 'react';
import { AuthContext } from '../context/authStore';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { AuthTrustBadge } from '../components/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('We could not reach the server. Please try again in a moment.');
      } else {
        setError(err.response?.data?.message || 'Sign in failed. Check your email and password.');
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your health dashboard and medical records."
      footer={
        <p className="mt-6 text-center text-sm text-slate-600">
          New to MediCentral?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:text-cyan-600">
            Create your account
          </Link>
        </p>
      }
    >
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl mb-4 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-premium"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-premium"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Sign in securely
        </button>
      </form>
      <AuthTrustBadge />
    </AuthLayout>
  );
};

export default Login;
