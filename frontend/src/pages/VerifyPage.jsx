import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/shared/Icons';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function VerifyPage() {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { showToast } = useToast();

  const phone = location.state?.phone;

  // Redirect to login if no phone in state
  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
  }, [phone, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = useCallback((index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const chars = pasted.split('');
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, i) => {
        next[i] = ch;
      });
      return next;
    });

    // Focus the input after the last pasted digit
    const focusIndex = Math.min(chars.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const code = digits.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== OTP_LENGTH) {
      showToast('Please enter the full 6-digit code', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.verifyOtp(phone, code);

      if (response.user && response.token) {
        // Existing user -- log in directly
        auth.login(response.token, response.user);
        showToast('Welcome back!');
        navigate('/', { replace: true });
      } else if (response.tempToken) {
        // New user -- needs registration
        navigate('/register', {
          state: { phone, tempToken: response.tempToken },
          replace: true,
        });
      } else {
        showToast('Unexpected response. Please try again.', 'error');
      }
    } catch (err) {
      showToast(err.error || 'Invalid or expired code', 'error');
      // Clear inputs so the user can retry
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      await authApi.sendOtp(phone);
      showToast('New code sent');
      setCooldown(COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      showToast(err.error || 'Failed to resend code', 'error');
    }
  };

  if (!phone) return null;

  const maskedPhone = phone.slice(0, 7) + '****' + phone.slice(-2);

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

        <div style={{ padding: '0 24px', textAlign: 'center' }}>
          <h1 className="auth-title">Verify Your Number</h1>
          <p className="auth-subtitle">
            Enter the 6-digit code sent to <strong>{maskedPhone}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 24px' }}>
          <div className="otp-inputs" style={{ marginBottom: '24px' }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                className="otp-input"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting || code.length !== OTP_LENGTH}
          >
            {submitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '32px' }}>
          {cooldown > 0 ? (
            <p style={{ color: '#888', fontSize: '14px' }}>
              Resend code in <strong>{cooldown}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: '#0A8F3C',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
