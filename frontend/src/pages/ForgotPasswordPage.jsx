import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/shared/Icons';
import PasswordInput from '../components/shared/PasswordInput';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // email | code | newpass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      showToast('Reset code sent to your email');
      setStep('code');
      setResendCooldown(60);
    } catch (err) {
      showToast(err.error || 'Failed to send reset code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
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

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    setStep('newpass');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code, newPassword);
      showToast('Password reset successfully! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      showToast(err.error || 'Failed to reset password', 'error');
      if (err.error?.includes('expired') || err.error?.includes('Invalid')) {
        setOtp(['', '', '', '', '', '']);
        setStep('code');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.forgotPassword(email.trim());
      showToast('New reset code sent to your email');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      showToast(err.error || 'Failed to resend code', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ padding: '24px 24px 0' }}>
          <button
            type="button"
            onClick={() => {
              if (step === 'code') setStep('email');
              else if (step === 'newpass') setStep('code');
              else navigate('/login');
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#333' }}
            aria-label="Go back"
          >
            <Icons.ArrowLeft />
          </button>
        </div>

        <div style={{ padding: '0 24px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px', color: '#131921' }}>
            <Icons.Shield />
          </div>
          <h1 className="auth-title">
            {step === 'email' && 'Forgot Password'}
            {step === 'code' && 'Enter Reset Code'}
            {step === 'newpass' && 'Set New Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 'email' && 'Enter your email and we\'ll send you a reset code'}
            {step === 'code' && `We sent a 6-digit code to ${email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)}`}
            {step === 'newpass' && 'Choose a new password for your account'}
          </p>
        </div>

        {/* Step 1: Enter email */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} style={{ padding: '0 24px 32px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={submitting || !email.trim()}
            >
              {submitting ? 'Sending...' : 'Send Reset Code'}
            </button>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '16px' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#0A8F3C', fontWeight: 600 }}>Sign in</Link>
            </p>
          </form>
        )}

        {/* Step 2: Enter OTP code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} style={{ padding: '0 24px 32px' }}>
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={code.length !== 6}
              style={{ marginTop: '24px' }}
            >
              Continue
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
        )}

        {/* Step 3: New password */}
        {step === 'newpass' && (
          <form onSubmit={handleResetPassword} style={{ padding: '0 24px 32px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <PasswordInput
                id="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
              <PasswordInput
                id="confirm-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={submitting || !newPassword || !confirmPassword}
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
