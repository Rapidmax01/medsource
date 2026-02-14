import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderApi } from '../services/api';
import { Icons, formatNaira } from '../components/shared/Icons';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const SERVICE_FEE_RATE = 0.025;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, cartCount } = useCart();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    deliveryAddress: '',
    deliveryState: '',
    deliveryCity: '',
    deliveryPhone: user?.phone || '',
    deliveryNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const serviceFee = Math.round(cartTotal * SERVICE_FEE_RATE);
  const total = cartTotal + serviceFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.deliveryAddress.trim()) newErrors.deliveryAddress = 'Delivery address is required';
    if (!form.deliveryState) newErrors.deliveryState = 'Please select a state';
    if (!form.deliveryCity.trim()) newErrors.deliveryCity = 'City is required';
    if (!form.deliveryPhone.trim()) {
      newErrors.deliveryPhone = 'Phone number is required';
    } else if (!/^(\+234|0)[789]\d{9}$/.test(form.deliveryPhone.trim())) {
      newErrors.deliveryPhone = 'Enter a valid Nigerian phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (cartCount === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the order
      const orderData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.qty,
        })),
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryState: form.deliveryState,
        deliveryCity: form.deliveryCity.trim(),
        deliveryPhone: form.deliveryPhone.trim(),
        deliveryNotes: form.deliveryNotes.trim(),
      };

      const orderResult = await orderApi.create(orderData);

      if (!orderResult.success || !orderResult.orders?.length) {
        throw new Error('Failed to create order');
      }

      // 2. Initialize payment for the first order (Paystack handles the rest)
      const firstOrder = orderResult.orders[0];
      const paymentResult = await orderApi.initializePayment(firstOrder.id, 'PAYSTACK');

      if (!paymentResult.success || !paymentResult.paymentUrl) {
        throw new Error('Failed to initialize payment');
      }

      // 3. Redirect to Paystack checkout
      showToast('Redirecting to payment...', 'info');
      window.location.href = paymentResult.paymentUrl;
    } catch (err) {
      const message = err?.error || err?.message || 'Something went wrong. Please try again.';
      showToast(message, 'error');
      setLoading(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="checkout-page" style={{ padding: '16px', paddingBottom: '100px' }}>
        <div className="cart-header">
          <button className="btn-icon" onClick={() => navigate('/cart')}>
            <Icons.ArrowLeft />
          </button>
          <h2>Checkout</h2>
        </div>
        <div className="empty-state">
          <Icons.Cart />
          <h3>Your cart is empty</h3>
          <p>Add items to your cart before checking out.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" style={{ padding: '16px', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="cart-header">
        <button className="btn-icon" onClick={() => navigate('/cart')}>
          <Icons.ArrowLeft />
        </button>
        <h2>Checkout</h2>
      </div>

      {/* Order Summary */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#1a1a1a' }}>
          Order Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{item.name}</p>
                <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0' }}>
                  Qty: {item.qty} {item.bloodType ? `\u00B7 ${item.bloodType}` : ''}
                </p>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                {formatNaira(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Location /> Delivery Details
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="deliveryAddress">Delivery Address *</label>
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              className={`form-input ${errors.deliveryAddress ? 'form-input-error' : ''}`}
              value={form.deliveryAddress}
              onChange={handleChange}
              placeholder="Enter your full delivery address"
              rows={3}
              style={{ resize: 'vertical' }}
            />
            {errors.deliveryAddress && <span className="form-error">{errors.deliveryAddress}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deliveryState">State *</label>
            <select
              id="deliveryState"
              name="deliveryState"
              className={`form-input ${errors.deliveryState ? 'form-input-error' : ''}`}
              value={form.deliveryState}
              onChange={handleChange}
            >
              <option value="">Select a state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.deliveryState && <span className="form-error">{errors.deliveryState}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deliveryCity">City *</label>
            <input
              type="text"
              id="deliveryCity"
              name="deliveryCity"
              className={`form-input ${errors.deliveryCity ? 'form-input-error' : ''}`}
              value={form.deliveryCity}
              onChange={handleChange}
              placeholder="Enter your city"
            />
            {errors.deliveryCity && <span className="form-error">{errors.deliveryCity}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deliveryPhone">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Phone /> Phone Number *
              </span>
            </label>
            <input
              type="tel"
              id="deliveryPhone"
              name="deliveryPhone"
              className={`form-input ${errors.deliveryPhone ? 'form-input-error' : ''}`}
              value={form.deliveryPhone}
              onChange={handleChange}
              placeholder="+234XXXXXXXXXX"
            />
            {errors.deliveryPhone && <span className="form-error">{errors.deliveryPhone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deliveryNotes">Delivery Notes (Optional)</label>
            <textarea
              id="deliveryNotes"
              name="deliveryNotes"
              className="form-input"
              value={form.deliveryNotes}
              onChange={handleChange}
              placeholder="Any special instructions for delivery"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Price Breakdown */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
            <span>{formatNaira(cartTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
            <span>Service Fee (2.5%)</span>
            <span>{formatNaira(serviceFee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #f0f0f0', fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>
            <span>Total</span>
            <span style={{ color: '#0A8F3C' }}>{formatNaira(total)}</span>
          </div>
        </div>

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0faf4', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#0A8F3C' }}>
          <Icons.Shield />
          <span>Secured by Paystack. Your payment information is encrypted.</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ padding: '14px', fontSize: '16px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner" style={{ width: '18px', height: '18px' }} />
              Processing...
            </span>
          ) : (
            `Pay ${formatNaira(total)}`
          )}
        </button>
      </form>
    </div>
  );
}
