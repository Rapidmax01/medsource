import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, inquiryApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons, formatNaira } from '../components/shared/Icons';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    buyerName: '',
    buyerPhone: '',
    message: '',
    quantity: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productApi.getById(id);
        setProduct(res.product || res);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        showToast('Product not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, showToast]);

  useEffect(() => {
    if (user && showInquiry) {
      setInquiryForm((prev) => ({
        ...prev,
        buyerName: prev.buyerName || user.name || '',
        buyerPhone: prev.buyerPhone || user.phone || '',
      }));
    }
  }, [user, showInquiry]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      type: product.type,
      seller: product.seller,
      image: product.image,
      bloodType: product.bloodType,
    });
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryForm.buyerName || !inquiryForm.buyerPhone) {
      showToast('Please fill in your name and phone number', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await inquiryApi.create({
        productId: product.id,
        buyerName: inquiryForm.buyerName,
        buyerPhone: inquiryForm.buyerPhone,
        message: inquiryForm.message,
        quantity: inquiryForm.quantity,
      });
      showToast('Inquiry sent successfully!');
      setShowInquiry(false);
      setInquiryForm({ buyerName: '', buyerPhone: '', message: '', quantity: 1 });
    } catch (err) {
      showToast(err.error || 'Failed to send inquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-icon" onClick={() => navigate(-1)}>
            <Icons.ArrowLeft />
          </button>
        </div>
        <div className="loading-state">
          <div className="skeleton detail-skeleton" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button className="btn-icon" onClick={() => navigate(-1)}>
            <Icons.ArrowLeft />
          </button>
        </div>
        <div className="empty-state">
          <h3>Product not found</h3>
          <p>This product may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  const isBlood = product.type === 'BLOOD_PRODUCT';
  const expiryDate = product.expiryDate
    ? new Date(product.expiryDate).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="detail-view">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft />
        </button>
        <h2>Product Details</h2>
      </div>

      {/* Product Info */}
      <div className="detail-content">
        <div className="detail-top">
          <div className="detail-icon">
            {isBlood ? <Icons.Blood /> : <Icons.Pill />}
          </div>
          <div>
            <h1 className="detail-name">{product.name}</h1>
            {product.genericName && (
              <p className="detail-generic">{product.genericName}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="detail-badges">
          <span className={`type-badge ${isBlood ? 'blood' : 'pharma'}`}>
            {isBlood ? 'Blood Product' : 'Pharmaceutical'}
          </span>
          {product.verified && (
            <span className="badge verified">
              <Icons.Verified /> NAFDAC Verified
            </span>
          )}
          {product.coldChain && (
            <span className="badge cold-chain">
              <Icons.Snowflake /> Cold Chain
            </span>
          )}
          <span className={`badge ${product.inStock !== false ? 'in-stock' : 'out-of-stock'}`}>
            {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
          </span>
          {product.bloodType && (
            <span className="badge blood-type">{product.bloodType}</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
        )}

        {/* Info Grid */}
        <div className="detail-section">
          <h3>Product Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <Icons.Location />
              <div>
                <span className="info-label">Location</span>
                <span className="info-value">{product.location || product.seller?.location || 'Nigeria'}</span>
              </div>
            </div>
            {expiryDate && (
              <div className="info-item">
                <Icons.Clock />
                <div>
                  <span className="info-label">Expiry Date</span>
                  <span className="info-value">{expiryDate}</span>
                </div>
              </div>
            )}
            {isBlood ? (
              <div className="info-item">
                <Icons.Shield />
                <div>
                  <span className="info-label">Screening Status</span>
                  <span className="info-value">{product.screeningStatus || 'Screened'}</span>
                </div>
              </div>
            ) : (
              product.nafdacNumber && (
                <div className="info-item">
                  <Icons.Shield />
                  <div>
                    <span className="info-label">NAFDAC Number</span>
                    <span className="info-value">{product.nafdacNumber}</span>
                  </div>
                </div>
              )
            )}
            <div className="info-item">
              <Icons.Pill />
              <div>
                <span className="info-label">Available Quantity</span>
                <span className="info-value">{product.quantity || product.stock || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        {product.seller && (
          <div className="detail-section">
            <h3>Seller</h3>
            <div className="seller-card">
              <div className="seller-info">
                <div className="seller-avatar">
                  {(product.seller.businessName || product.seller.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{product.seller.businessName || product.seller.name}</h4>
                  <span className="seller-location">
                    <Icons.Location /> {product.seller.location || 'Nigeria'}
                  </span>
                  {product.seller.rating && (
                    <span className="seller-rating">
                      <Icons.Star /> {product.seller.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="seller-actions">
                <button className="btn btn-outline btn-sm" onClick={() => setShowInquiry(true)}>
                  <Icons.Message /> Send Inquiry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="detail-bottom-bar">
        <div className="detail-price">
          <span className="price-label">Price</span>
          <span className="price-value">{formatNaira(product.price)}</span>
          {product.unit && <span className="price-unit">/ {product.unit}</span>}
        </div>
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={() => setShowInquiry(true)}>
            Inquire
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={product.inStock === false}
          >
            <Icons.Cart /> Add to Cart
          </button>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiry && (
        <div className="modal-overlay" onClick={() => setShowInquiry(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Inquiry</h3>
              <button className="btn-icon" onClick={() => setShowInquiry(false)}>
                <Icons.Close />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleInquirySubmit}>
              <p className="modal-subtitle">
                Inquiring about: <strong>{product.name}</strong>
              </p>
              <div className="form-group">
                <label htmlFor="buyerName">Your Name</label>
                <input
                  id="buyerName"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={inquiryForm.buyerName}
                  onChange={(e) =>
                    setInquiryForm((prev) => ({ ...prev, buyerName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="buyerPhone">Phone Number</label>
                <input
                  id="buyerPhone"
                  type="tel"
                  className="form-input"
                  placeholder="+234..."
                  value={inquiryForm.buyerPhone}
                  onChange={(e) =>
                    setInquiryForm((prev) => ({ ...prev, buyerPhone: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="inquiryQty">Quantity Needed</label>
                <input
                  id="inquiryQty"
                  type="number"
                  className="form-input"
                  min="1"
                  value={inquiryForm.quantity}
                  onChange={(e) =>
                    setInquiryForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="inquiryMsg">Message</label>
                <textarea
                  id="inquiryMsg"
                  className="form-input"
                  rows="3"
                  placeholder="Any specific requirements or questions..."
                  value={inquiryForm.message}
                  onChange={(e) =>
                    setInquiryForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
