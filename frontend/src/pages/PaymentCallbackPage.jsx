import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { paymentApi } from '../services/api';
import { Icons } from '../components/shared/Icons';

export default function PaymentCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { showToast } = useToast();

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [orderInfo, setOrderInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment reference found. Please contact support if you were charged.');
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      try {
        const result = await paymentApi.verify(reference, transactionId);

        if (cancelled) return;

        if (result.success && result.payment?.status === 'COMPLETED') {
          setStatus('success');
          setOrderInfo({
            orderNumber: result.order?.orderNumber || result.payment?.orderNumber,
            amount: result.payment?.amount,
          });
          clearCart();
          showToast('Payment successful!', 'success');
        } else if (result.success && result.payment?.status === 'PENDING') {
          // Payment still processing, wait and retry once
          setTimeout(async () => {
            if (cancelled) return;
            try {
              const retryResult = await paymentApi.verify(reference, transactionId);
              if (cancelled) return;
              if (retryResult.success && retryResult.payment?.status === 'COMPLETED') {
                setStatus('success');
                setOrderInfo({
                  orderNumber: retryResult.order?.orderNumber || retryResult.payment?.orderNumber,
                  amount: retryResult.payment?.amount,
                });
                clearCart();
                showToast('Payment successful!', 'success');
              } else {
                setStatus('failed');
                setErrorMessage('Payment could not be confirmed. If you were charged, it will be verified shortly.');
              }
            } catch {
              if (!cancelled) {
                setStatus('failed');
                setErrorMessage('Unable to verify payment. Please check your orders page.');
              }
            }
          }, 3000);
        } else {
          setStatus('failed');
          setErrorMessage(result.message || 'Payment was not successful. Please try again.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('failed');
          setErrorMessage(err?.error || err?.message || 'Unable to verify payment. Please check your orders page.');
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference, transactionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '16px', paddingBottom: '100px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Verifying State */}
      {status === 'verifying' && (
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            Verifying Payment
          </h2>
          <p style={{ fontSize: '14px', color: '#666', maxWidth: '300px' }}>
            Please wait while we confirm your payment. Do not close this page.
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#0A8F3C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#fff',
          }}>
            <Icons.Check />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
            Payment Successful!
          </h2>
          {orderInfo?.orderNumber && (
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              Order Number: <strong style={{ color: '#1a1a1a' }}>{orderInfo.orderNumber}</strong>
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', maxWidth: '300px' }}>
            Your order has been placed and the seller has been notified. You can track your order status from the orders page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate('/orders')}
              style={{ padding: '14px', fontSize: '15px', fontWeight: 600 }}
            >
              View Orders
            </button>
            <button
              className="btn btn-full"
              onClick={() => navigate('/')}
              style={{ padding: '14px', fontSize: '15px', fontWeight: 500, background: '#f5f5f5', color: '#1a1a1a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Failed State */}
      {status === 'failed' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#dc2626',
          }}>
            <Icons.Close />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
            Payment Failed
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px', maxWidth: '320px' }}>
            {errorMessage}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate('/checkout')}
              style={{ padding: '14px', fontSize: '15px', fontWeight: 600 }}
            >
              Try Again
            </button>
            <button
              className="btn btn-full"
              onClick={() => navigate('/orders')}
              style={{ padding: '14px', fontSize: '15px', fontWeight: 500, background: '#f5f5f5', color: '#1a1a1a', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              View Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
