import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/shared/Icons';

const ACCOUNT_TYPES = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'BLOOD_BANK', label: 'Blood Bank' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    accountType: '',
    state: '',
    city: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { showToast } = useToast();

  const phone = location.state?.phone;
  const tempToken = location.state?.tempToken;

  // Redirect if missing required state
  useEffect(() => {
    if (!phone || !tempToken) {
      navigate('/login', { replace: true });
    }
  }, [phone, tempToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.accountType &&
    form.state &&
    form.city.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.register({
        tempToken,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        accountType: form.accountType,
        state: form.state,
        city: form.city.trim(),
      });

      auth.login(response.token, response.user);
      showToast('Account created successfully!');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.error || 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!phone || !tempToken) return null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ padding: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              color: '#333',
            }}
            aria-label="Go back"
          >
            <Icons.ArrowLeft />
          </button>
        </div>

        <div style={{ padding: '0 24px' }}>
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">
            Just a few details to get you started
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="form-input"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              autoFocus
              autoComplete="given-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="form-input"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="accountType">Account Type</label>
          <select
            id="accountType"
            name="accountType"
            className="form-input"
            value={form.accountType}
            onChange={handleChange}
          >
            <option value="" disabled>Select account type</option>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="state">State</label>
          <select
            id="state"
            name="state"
            className="form-input"
            value={form.state}
            onChange={handleChange}
          >
            <option value="" disabled>Select your state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            className="form-input"
            placeholder="e.g. Ikeja, Port Harcourt"
            value={form.city}
            onChange={handleChange}
            autoComplete="address-level2"
          />
        </div>

        <button
          type="submit"
          className="btn-primary btn-full"
          disabled={submitting || !isValid}
          style={{ marginTop: '8px' }}
        >
          {submitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      </div>
    </div>
  );
}
