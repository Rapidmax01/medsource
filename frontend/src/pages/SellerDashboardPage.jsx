import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sellerApi, inquiryApi, orderApi, productApi } from '../services/api';
import { Icons, formatNaira } from '../components/shared/Icons';

const TABS = ['Overview', 'Products', 'Orders', 'Inquiries'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG');
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: { bg: '#FFFBEB', color: '#92400E' },
    CONFIRMED: { bg: '#EFF6FF', color: '#1D4ED8' },
    PROCESSING: { bg: '#EFF6FF', color: '#1D4ED8' },
    READY_FOR_PICKUP: { bg: '#F0FDF4', color: '#166534' },
    IN_TRANSIT: { bg: '#FFF7ED', color: '#9A3412' },
    DELIVERED: { bg: '#F0FDF4', color: '#166534' },
    CANCELLED: { bg: '#FEF2F2', color: '#991B1B' },
  };
  const s = colors[status] || colors.PENDING;
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.color }}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const colors = {
    LOW: { bg: '#F0FDF4', color: '#166534' },
    MEDIUM: { bg: '#FFFBEB', color: '#92400E' },
    HIGH: { bg: '#FEF2F2', color: '#991B1B' },
    CRITICAL: { bg: '#991B1B', color: '#FFFFFF' },
  };
  const s = colors[urgency] || colors.LOW;
  return (
    <span className="status-badge" style={{ background: s.bg, color: s.color }}>
      {urgency}
    </span>
  );
}

// ---- Overview Tab ----
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi.getDashboard()
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Icons.Settings />
        </div>
        <p className="empty-text">Could not load dashboard</p>
        <p className="empty-sub">Please try again later</p>
      </div>
    );
  }

  const s = data.stats || {};
  const earnings = s.earnings || {};
  const stats = [
    { label: 'Pending Balance', value: formatNaira(earnings.pendingBalance || 0), color: 'var(--green-600)' },
    { label: 'Total Earnings', value: formatNaira(earnings.totalEarnings || 0), color: 'var(--green-800)' },
    { label: 'Commission Paid', value: formatNaira(earnings.totalCommissionPaid || 0), color: 'var(--red-500)' },
    { label: 'Active Products', value: s.products?.active || 0, color: 'var(--blue-500)' },
  ];

  return (
    <div>
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <div className="admin-stat" key={s.label}>
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Commission info banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        marginBottom: 20,
        fontSize: 13,
        color: '#1D4ED8',
        fontWeight: 500,
      }}>
        A 5% platform commission is deducted from each sale. Your earnings reflect the amount after commission.
      </div>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Alerts
          </h3>
          {data.alerts.map((alert, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: alert.type === 'low_stock' ? 'var(--amber-50)' : 'var(--red-50)',
              border: `1px solid ${alert.type === 'low_stock' ? '#FDE68A' : 'var(--red-100)'}`,
              marginBottom: 8,
              fontSize: 13,
              color: alert.type === 'low_stock' ? '#92400E' : 'var(--red-700)',
              fontWeight: 500,
            }}>
              {alert.message || `${alert.type === 'low_stock' ? 'Low stock' : 'Expiring soon'}: ${alert.productName}`}
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Recent Orders
      </h3>
      {data.recentOrders && data.recentOrders.length > 0 ? (
        data.recentOrders.map((order) => (
          <div className="admin-card" key={order.id} style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
              {order.buyer?.name || order.buyer?.phone || 'Customer'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-800)' }}>
              {formatNaira(order.total)}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <p className="empty-text">No recent orders</p>
          <p className="empty-sub">Orders will appear here when customers purchase your products</p>
        </div>
      )}
    </div>
  );
}

// ---- Products Tab ----
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    sellerApi.getProducts()
      .then((res) => setProducts(res.products || res.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await productApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product removed');
    } catch (err) {
      showToast(err.error || 'Failed to remove product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>
          Your Products ({Array.isArray(products) ? products.length : 0})
        </h3>
        <Link to="/seller/products/new" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icons.Plus /> Add Product
        </Link>
      </div>

      {Array.isArray(products) && products.length > 0 ? (
        products.map((product) => (
          <div className="product-card" key={product.id} style={{ cursor: 'default' }}>
            <div className="product-top">
              <div>
                <span className={`product-badge ${product.type === 'BLOOD_PRODUCT' ? 'badge-blood' : 'badge-pharma'}`}>
                  {product.type === 'BLOOD_PRODUCT' ? 'Blood' : 'Pharma'}
                </span>
              </div>
              <div className={`stock-indicator ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                <span className="stock-dot" />
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>
            <div className="product-name">{product.name}</div>
            <div className="product-meta">
              {product.nafdacNumber && (
                <span className="meta-item">
                  <Icons.Verified /> NAFDAC
                </span>
              )}
              {product.viewCount !== undefined && (
                <span className="meta-item">
                  <Icons.Search /> {product.viewCount} views
                </span>
              )}
            </div>
            <div className="product-bottom">
              <span className="product-price">{formatNaira(product.price)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Link to={`/seller/products/${product.id}/edit`} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none' }}>
                  Edit
                </Link>
                {deletingId === product.id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Remove?</span>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{
                        padding: '4px 10px', fontSize: 12, fontWeight: 600,
                        border: '1px solid var(--red-500)', borderRadius: 'var(--radius-full)',
                        background: 'var(--red-500)', color: '#fff', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{
                        padding: '4px 10px', fontSize: 12, fontWeight: 600,
                        border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-full)',
                        background: '#fff', color: 'var(--gray-600)', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(product.id)}
                    style={{
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      border: '1px solid var(--red-100)', borderRadius: 'var(--radius-full)',
                      background: 'var(--red-50)', color: 'var(--red-500)', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icons.Pill />
          </div>
          <p className="empty-text">No products yet</p>
          <p className="empty-sub">Add your first product to start selling</p>
        </div>
      )}
    </div>
  );
}

// ---- Orders Tab ----
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { showToast } = useToast();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    sellerApi.getOrders()
      .then((res) => setOrders(res.orders || res.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      showToast(`Order ${newStatus.toLowerCase().replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err) {
      showToast(err.error || 'Failed to update order', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getNextActions = (status) => {
    switch (status) {
      case 'PENDING': return [
        { label: 'Confirm', next: 'CONFIRMED', color: 'var(--green-600)' },
        { label: 'Cancel', next: 'CANCELLED', color: 'var(--red-500)' },
      ];
      case 'CONFIRMED': return [
        { label: 'Ship', next: 'IN_TRANSIT', color: 'var(--blue-500)' },
        { label: 'Cancel', next: 'CANCELLED', color: 'var(--red-500)' },
      ];
      case 'IN_TRANSIT': return [
        { label: 'Mark Delivered', next: 'DELIVERED', color: 'var(--green-600)' },
      ];
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading orders...</span>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>
        Orders ({Array.isArray(orders) ? orders.length : 0})
      </h3>

      {Array.isArray(orders) && orders.length > 0 ? (
        orders.map((order) => (
          <div className="admin-card" key={order.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)' }}>
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>
              Buyer: {order.buyer?.name || order.buyer?.phone || 'Customer'}
            </div>
            {order.items && order.items.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>
                    {item.product?.name || 'Product'} x{item.quantity}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green-800)' }}>
                {formatNaira(order.sellerEarnings || order.total)}
              </div>
              {order.commission > 0 && (
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                  Subtotal: {formatNaira(order.subtotal)} | Commission: -{formatNaira(order.commission)} (5%)
                </div>
              )}
            </div>

            {getNextActions(order.status).length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {getNextActions(order.status).map((action) => (
                  <button
                    key={action.next}
                    onClick={() => handleStatusUpdate(order.id, action.next)}
                    disabled={updating === order.id}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${action.color}`,
                      background: action.next === 'CANCELLED' ? 'transparent' : action.color,
                      color: action.next === 'CANCELLED' ? action.color : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: updating === order.id ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: updating === order.id ? 0.6 : 1,
                    }}
                  >
                    {updating === order.id ? '...' : action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icons.Cart />
          </div>
          <p className="empty-text">No orders yet</p>
          <p className="empty-sub">Orders from buyers will appear here</p>
        </div>
      )}
    </div>
  );
}

// ---- Inquiries Tab ----
function InquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState(null);
  const { showToast } = useToast();

  const fetchInquiries = useCallback(() => {
    setLoading(true);
    inquiryApi.getSellerInquiries()
      .then((res) => setInquiries(res.inquiries || res.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleReply = async (id) => {
    const text = replyText[id]?.trim();
    if (!text) {
      showToast('Please enter a reply', 'error');
      return;
    }
    setReplying(id);
    try {
      await inquiryApi.respond(id, text);
      showToast('Reply sent');
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      fetchInquiries();
    } catch (err) {
      showToast(err.error || 'Failed to send reply', 'error');
    } finally {
      setReplying(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading inquiries...</span>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>
        Inquiries ({Array.isArray(inquiries) ? inquiries.length : 0})
      </h3>

      {Array.isArray(inquiries) && inquiries.length > 0 ? (
        inquiries.map((inq) => (
          <div className="admin-card" key={inq.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>
                {inq.buyer?.name || inq.buyer?.phone || 'Buyer'}
              </span>
              {inq.urgency && <UrgencyBadge urgency={inq.urgency} />}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 6 }}>
              Product: {inq.product?.name || 'N/A'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 12, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
              {inq.message}
            </div>
            {inq.response ? (
              <div style={{ fontSize: 13, color: 'var(--green-700)', background: 'var(--green-50)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <strong>Your reply:</strong> {inq.response}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  value={replyText[inq.id] || ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                  placeholder="Type your reply..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1.5px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: 44,
                    color: 'var(--gray-800)',
                  }}
                />
                <button
                  onClick={() => handleReply(inq.id)}
                  disabled={replying === inq.id}
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '8px 16px', alignSelf: 'flex-end' }}
                >
                  {replying === inq.id ? '...' : 'Reply'}
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
              {timeAgo(inq.createdAt)}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icons.Message />
          </div>
          <p className="empty-text">No inquiries</p>
          <p className="empty-sub">Buyer inquiries about your products will appear here</p>
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { user, isSeller } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSeller) {
      navigate('/seller/onboarding');
    }
  }, [user, isSeller, navigate]);

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  // Show pending approval screen for unverified sellers
  if (user.seller && !user.seller.isVerified) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0A8F3C 0%, #067A32 100%)',
          color: '#fff',
          padding: '20px 20px 16px',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Seller Dashboard</h1>
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
            {user.seller.businessName || 'Your Store'}
          </p>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#FEF3C7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
            Account Pending Approval
          </h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
            Your seller account is currently under review. Our team will verify your business details and approve your account shortly. You will be notified once your account is approved.
          </p>
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
            padding: 16, maxWidth: 360, margin: '0 auto 24px', textAlign: 'left',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 8px' }}>
              What happens next?
            </h3>
            <ul style={{ fontSize: 13, color: '#15803D', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Our team reviews your business information</li>
              <li>We verify your NAFDAC license and CAC registration</li>
              <li>You'll receive a notification once approved</li>
              <li>Once approved, you can list products and receive orders</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px', borderRadius: 8, border: '1px solid #D1D5DB',
              background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A8F3C 0%, #067A32 100%)',
        color: '#fff',
        padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Seller Dashboard</h1>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
              {user.seller?.businessName || user.name || 'Your Store'}
            </p>
          </div>
          <Link to="/seller/profile" style={{ color: '#fff' }}>
            <Icons.Settings />
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: 'nowrap',
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: 20 }}>
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Products' && <ProductsTab />}
        {activeTab === 'Orders' && <OrdersTab />}
        {activeTab === 'Inquiries' && <InquiriesTab />}
      </div>
    </div>
  );
}
