import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sellerApi } from '../services/api';
import { Icons } from '../components/shared/Icons';

const BUSINESS_TYPES = [
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'BLOOD_BANK', label: 'Blood Bank' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
];

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Kano', 'Kaduna', 'Delta', 'Enugu',
  'Anambra', 'Edo', 'Ogun', 'Ondo', 'Akwa Ibom', 'Cross River', 'Bayelsa',
  'Benue', 'Plateau', 'Kogi', 'Kwara', 'Niger', 'Adamawa', 'Borno', 'Bauchi',
  'Gombe', 'Taraba', 'Yobe', 'Jigawa', 'Katsina', 'Kebbi', 'Zamfara', 'Sokoto',
  'Nasarawa', 'Ekiti', 'Osun', 'Imo', 'Abia', 'Ebonyi',
];

const TOTAL_STEPS = 3;

function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator" style={{ justifyContent: 'center', padding: '0 20px' }}>
      {[1, 2, 3].map((step, i) => (
        <div key={step} style={{ display: 'contents' }}>
          <div
            className={`step-dot ${
              step < currentStep ? 'completed' : step === currentStep ? 'active' : ''
            }`}
          >
            {step < currentStep ? <Icons.Check /> : step}
          </div>
          {i < 2 && (
            <div className={`step-line ${step < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SellerOnboardingPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    nafdacLicense: '',
    cacNumber: '',
    businessPhone: '',
    businessEmail: '',
    whatsapp: '',
    state: '',
    city: '',
    address: '',
  });

  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { showToast } = useToast();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        showToast('Business name is required', 'error');
        return false;
      }
      if (!formData.businessType) {
        showToast('Please select a business type', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.nafdacLicense.trim()) {
        showToast('NAFDAC license number is required', 'error');
        return false;
      }
      if (!formData.cacNumber.trim()) {
        showToast('CAC registration number is required', 'error');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.businessPhone.trim()) {
        showToast('Business phone is required', 'error');
        return false;
      }
      if (!formData.state) {
        showToast('Please select your state', 'error');
        return false;
      }
      if (!formData.city.trim()) {
        showToast('City is required', 'error');
        return false;
      }
      if (!formData.address.trim()) {
        showToast('Address is required', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const result = await sellerApi.register(formData);
      if (result.user) {
        updateUser(result.user);
      } else {
        updateUser({ role: 'SELLER' });
      }
      showToast('Seller registration successful!');
      navigate('/seller');
    } catch (err) {
      showToast(err.error || 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Business Information', 'Verification', 'Contact & Location'];
  const stepDescriptions = [
    'Tell us about your business',
    'Provide your regulatory licenses',
    'How can customers reach you?',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A8F3C 0%, #067A32 100%)',
        color: '#fff',
        padding: '20px 20px 28px',
        textAlign: 'center',
        borderRadius: '0 0 24px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => step > 1 ? handleBack() : navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <Icons.ArrowLeft />
          </button>
          <div style={{ flex: 1, textAlign: 'center', paddingRight: 36 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Become a Seller</h1>
            <p style={{ fontSize: 12, opacity: 0.8, margin: '4px 0 0' }}>
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
        </div>
        <StepIndicator currentStep={step} />
      </div>

      {/* Step Content */}
      <div style={{ padding: '0 24px 120px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          {stepTitles[step - 1]}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>
          {stepDescriptions[step - 1]}
        </p>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Business Name</label>
              <input
                id="businessName"
                type="text"
                className="form-input"
                placeholder="e.g. MedPharm Nigeria Ltd"
                value={formData.businessName}
                onChange={handleChange('businessName')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, businessType: bt.value }))}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${formData.businessType === bt.value ? 'var(--green-600)' : 'var(--gray-200)'}`,
                      background: formData.businessType === bt.value ? 'var(--green-50)' : 'var(--white)',
                      color: formData.businessType === bt.value ? 'var(--green-700)' : 'var(--gray-600)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                className="form-input"
                placeholder="Tell buyers about your business..."
                value={formData.description}
                onChange={handleChange('description')}
                rows={4}
                style={{ resize: 'vertical', minHeight: 100 }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="nafdacLicense">NAFDAC License Number</label>
              <input
                id="nafdacLicense"
                type="text"
                className="form-input"
                placeholder="e.g. A1-0000"
                value={formData.nafdacLicense}
                onChange={handleChange('nafdacLicense')}
              />
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                Your NAFDAC registration or license number
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cacNumber">CAC Registration Number</label>
              <input
                id="cacNumber"
                type="text"
                className="form-input"
                placeholder="e.g. RC-123456"
                value={formData.cacNumber}
                onChange={handleChange('cacNumber')}
              />
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                Corporate Affairs Commission registration number
              </p>
            </div>

            <div style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              background: 'var(--amber-50)',
              border: '1px solid #FDE68A',
              marginTop: 20,
            }}>
              <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
                Your NAFDAC license and CAC number will be verified before your account is activated.
                This typically takes 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Contact & Location */}
        {step === 3 && (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="businessPhone">Business Phone</label>
              <input
                id="businessPhone"
                type="tel"
                className="form-input"
                placeholder="+234 800 000 0000"
                value={formData.businessPhone}
                onChange={handleChange('businessPhone')}
                inputMode="numeric"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="businessEmail">Business Email</label>
                <input
                  id="businessEmail"
                  type="email"
                  className="form-input"
                  placeholder="info@business.com"
                  value={formData.businessEmail}
                  onChange={handleChange('businessEmail')}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="whatsapp">WhatsApp</label>
                <input
                  id="whatsapp"
                  type="tel"
                  className="form-input"
                  placeholder="+234..."
                  value={formData.whatsapp}
                  onChange={handleChange('whatsapp')}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="state">State</label>
              <select
                id="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange('state')}
                style={{ appearance: 'auto' }}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                className="form-input"
                placeholder="e.g. Ikeja"
                value={formData.city}
                onChange={handleChange('city')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Business Address</label>
              <textarea
                id="address"
                className="form-input"
                placeholder="Full business address"
                value={formData.address}
                onChange={handleChange('address')}
                rows={3}
                style={{ resize: 'vertical', minHeight: 70 }}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
