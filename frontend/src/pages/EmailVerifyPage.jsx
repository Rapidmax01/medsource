import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/shared/Icons';

export default function EmailVerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { showToast } = useToast();

  const tempToken = location.state?.tempToken;
  const email = location.state?.email || '';

  useEffect(() => {
    if (!tempToken) {
      navigate('/register/email', { replace: true });
    }
  }, [tempToken, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  const code = otp.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await authApi.emailVerify(tempToken, code);
      auth.login(response.token, response.user);
      showToast('Account verified successfully!');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.error || 'Invalid verification code', 'error');
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.emailResend(tempToken);
      showToast('New code sent to your email');
      setResendCooldown(60);
    } catch (err) {
      showToast(err.error || 'Failed to resend code', 'error');
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ padding: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/register/email')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#333' }}
            aria-label="Go back"
          >
            <Icons.ArrowLeft />
          </button>
        </div>

        <div style={{ padding: '0 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', color: '#131921' }}>
            <Icons.Shield />
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to <strong>{maskedEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting || code.length !== 6}
            style={{ marginTop: '24px' }}
          >
            {submitting ? 'Verifying...' : 'Verify Email'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {resendCooldown > 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>
                Resend code in {resendCooldown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#131921',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                Resend Code
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
