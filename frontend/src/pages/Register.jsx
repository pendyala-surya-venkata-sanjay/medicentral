import { useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/authStore';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { AuthTrustBadge } from '../components/AuthLayout';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Tamil Nadu', 'Telangana',
  'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Other',
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    bloodGroup: '',
    contactNumber: '',
    state: '',
    city: '',
    pincode: '',
    emergencyName: '',
    emergencyPhone: '',
    tenantSlug: '',
    branchSlug: '',
    specialization: 'General Medicine',
    operationalRole: 'receptionist',
  });
  const [hospitals, setHospitals] = useState([]);
  const [showIndiaFields, setShowIndiaFields] = useState(false);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('We could not reach the server. Please try again shortly.');
      } else {
        setError(err.response?.data?.message || 'Registration could not be completed.');
      }
    }
  };

  const set = (key, val) => setFormData({ ...formData, [key]: val });

  useEffect(() => {
    api.get('/auth/hospitals').then(({ data }) => setHospitals(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const branches =
    hospitals.find((h) => h.slug === formData.tenantSlug)?.branches || [];

  return (
    <AuthLayout
      title="Join MediCentral"
      subtitle="Create your account — patients, doctors, and hospital staff welcome."
      footer={
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:text-cyan-600">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl mb-4 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => set('name', e.target.value)}
            className="input-premium"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => set('email', e.target.value)}
            className="input-premium"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => set('password', e.target.value)}
            className="input-premium"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">I am joining as</label>
          <select
            value={formData.role}
            onChange={(e) => set('role', e.target.value)}
            className="input-premium bg-white"
          >
            <option value="patient">Patient — manage my health records</option>
            <option value="doctor">Doctor — care for patients</option>
            <option value="staff">Hospital staff — operations & billing</option>
          </select>
        </div>

        {(formData.role === 'staff' || formData.role === 'doctor') && (
          <div className="space-y-3 p-4 bg-blue-50/80 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-900 font-semibold">
              Hospital affiliation (required) — you will only see doctors and patients for this branch. Patients remain global.
            </p>
            <select
              required
              value={formData.tenantSlug}
              onChange={(e) => setFormData({ ...formData, tenantSlug: e.target.value, branchSlug: '' })}
              className="input-premium bg-white"
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.slug} value={h.slug}>{h.name}</option>
              ))}
            </select>
            <select
              required
              value={formData.branchSlug}
              onChange={(e) => set('branchSlug', e.target.value)}
              className="input-premium bg-white"
              disabled={!formData.tenantSlug}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name} — {b.city}</option>
              ))}
            </select>
            {formData.role === 'doctor' && (
              <input
                required
                placeholder="Specialization (e.g. Cardiology)"
                value={formData.specialization}
                onChange={(e) => set('specialization', e.target.value)}
                className="input-premium"
              />
            )}
            {formData.role === 'staff' && (
              <select
                value={formData.operationalRole}
                onChange={(e) => set('operationalRole', e.target.value)}
                className="input-premium bg-white"
              >
                <option value="receptionist">Reception</option>
                <option value="doctor">Doctor (clinical)</option>
                <option value="billing_staff">Billing</option>
                <option value="lab_supervisor">Laboratory</option>
                <option value="ward_manager">Ward</option>
                <option value="pharmacist">Pharmacy</option>
                <option value="printer_filing_officer">Discharge & records</option>
              </select>
            )}
            {formData.role === 'staff' && formData.operationalRole === 'doctor' && (
              <input
                required
                placeholder="Specialization (e.g. Cardiology)"
                value={formData.specialization}
                onChange={(e) => set('specialization', e.target.value)}
                className="input-premium"
              />
            )}
          </div>
        )}

        {formData.role === 'patient' && (
          <>
            <button
              type="button"
              onClick={() => setShowIndiaFields(!showIndiaFields)}
              className="text-sm text-cyan-700 font-semibold w-full text-left"
            >
              {showIndiaFields ? '− Hide' : '+ Add'} profile details (optional)
            </button>
            {showIndiaFields && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  placeholder="Mobile (+91)"
                  value={formData.contactNumber}
                  onChange={(e) => set('contactNumber', e.target.value)}
                  className="input-premium"
                />
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => set('bloodGroup', e.target.value)}
                  className="input-premium bg-white"
                >
                  <option value="">Blood group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.state}
                  onChange={(e) => set('state', e.target.value)}
                  className="input-premium bg-white"
                >
                  <option value="">State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="input-premium"
                />
                <input
                  placeholder="PIN code"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => set('pincode', e.target.value)}
                  className="input-premium"
                />
                <input
                  placeholder="Emergency contact name"
                  value={formData.emergencyName}
                  onChange={(e) => set('emergencyName', e.target.value)}
                  className="input-premium"
                />
                <input
                  placeholder="Emergency mobile"
                  value={formData.emergencyPhone}
                  onChange={(e) => set('emergencyPhone', e.target.value)}
                  className="input-premium"
                />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition sticky bottom-0"
        >
          Create my account
        </button>
      </form>
      <AuthTrustBadge />
    </AuthLayout>
  );
};

export default Register;
