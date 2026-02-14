import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/shared/Icons';

const COUNTRY_CODES = [
  { code: '+234', country: 'NG', flag: '\u{1F1F3}\u{1F1EC}', label: 'Nigeria' },
  { code: '+233', country: 'GH', flag: '\u{1F1EC}\u{1F1ED}', label: 'Ghana' },
  { code: '+254', country: 'KE', flag: '\u{1F1F0}\u{1F1EA}', label: 'Kenya' },
  { code: '+27', country: 'ZA', flag: '\u{1F1FF}\u{1F1E6}', label: 'South Africa' },
  { code: '+1', country: 'US', flag: '\u{1F1FA}\u{1F1F8}', label: 'United States' },
  { code: '+44', country: 'GB', flag: '\u{1F1EC}\u{1F1E7}', label: 'United Kingdom' },
  { code: '+91', country: 'IN', flag: '\u{1F1EE}\u{1F1F3}', label: 'India' },
  { code: '+971', country: 'AE', flag: '\u{1F1E6}\u{1F1EA}', label: 'UAE' },
  { code: '+966', country: 'SA', flag: '\u{1F1F8}\u{1F1E6}', label: 'Saudi Arabia' },
  { code: '+49', country: 'DE', flag: '\u{1F1E9}\u{1F1EA}', label: 'Germany' },
  { code: '+33', country: 'FR', flag: '\u{1F1EB}\u{1F1F7}', label: 'France' },
  { code: '+86', country: 'CN', flag: '\u{1F1E8}\u{1F1F3}', label: 'China' },
];

function formatPhone(input, code) {
  const digits = input.replace(/\D/g, '');
  // If user entered with country code already, use as-is
  if (input.startsWith('+')) return input;
  // Strip leading 0 (local format)
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return code + local;
}

export default function LoginPage() {
  const [tab, setTab] = useState('phone');
  const [countryCode, setCountryCode] = useState('+234');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const { showToast } = useToast();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const formatted = formatPhone(phone.trim(), countryCode);
    const totalDigits = formatted.replace(/\D/g, '').length;
    if (totalDigits < 8 || totalDigits > 16) {
      showToast('Enter a valid phone number', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.sendOtp(formatted);
      showToast('OTP sent to your phone');
      navigate('/verify', { state: { phone: formatted } });
    } catch (err) {
      showToast(err.error || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter your email and password', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await authApi.emailLogin(email.trim(), password);
      auth.login(response.token, response.user);
      showToast('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.error || 'Invalid email or password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSubmitting(true);
      try {
        const response = await authApi.googleLogin(tokenResponse.access_token);
        auth.login(response.token, response.user);
        showToast(response.isNewUser ? 'Account created!' : 'Welcome back!');
        navigate('/', { replace: true });
      } catch (err) {
        showToast(err.error || 'Google sign-in failed. Please try again.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => {
      showToast('Google sign-in was cancelled', 'error');
    },
    flow: 'implicit',
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Back to marketplace link */}
        <div style={{ padding: '16px 24px 0' }}>
          <Link to="/" className="auth-back-link">
            <Icons.ArrowLeft />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Branded header */}
        <div className="auth-header" style={{
          background: 'linear-gradient(135deg, #0A8F3C 0%, #067A32 100%)',
          color: '#fff',
          padding: '48px 24px 40px',
          textAlign: 'center',
          borderRadius: '0 0 24px 24px',
          marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <Icons.Shield />
          </div>
          <h1 className="auth-title" style={{ color: '#fff', margin: '0 0 8px' }}>
            MedSource
          </h1>
          <p className="auth-subtitle" style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Nigeria's Healthcare Marketplace
          </p>
        </div>

        {/* Auth tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'phone' ? 'active' : ''}`}
            onClick={() => setTab('phone')}
            type="button"
          >
            Phone
          </button>
          <button
            className={`auth-tab ${tab === 'email' ? 'active' : ''}`}
            onClick={() => setTab('email')}
            type="button"
          >
            Email
          </button>
        </div>

        {/* Phone tab */}
        {tab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} style={{ padding: '0 24px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <div className="phone-input-wrapper">
                <select
                  className="phone-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  autoFocus
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={submitting || !phone.trim()}
            >
              {submitting ? 'Sending OTP...' : 'Continue'}
            </button>
            <p style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              marginTop: '16px',
            }}>
              New to MedSource? Your account will be created automatically.
            </p>
          </form>
        )}

        {/* Email tab */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ padding: '0 24px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={submitting || !email.trim() || !password}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
            <p style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              marginTop: '16px',
            }}>
              Don't have an account?{' '}
              <Link to="/register/email" style={{ color: '#0A8F3C', fontWeight: 600 }}>
                Create account
              </Link>
            </p>
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google sign-in */}
        <div style={{ padding: '0 24px 32px' }}>
          <button
            type="button"
            className="google-btn"
            onClick={() => googleLogin()}
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
