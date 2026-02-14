import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Icons, formatNaira } from '../components/shared/Icons';

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Processing', 'Delivered'];

const STATUS_COLORS = {
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  PROCESSING: 'status-processing',
  READY_FOR_PICKUP: 'status-processing',
  IN_TRANSIT: 'status-processing',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatStatus(status) {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (activeTab !== 'All') {
        params.status = activeTab.toUpperCase();
      }
      const res = await orderApi.getAll(params);
      setOrders(res.orders || res.data || []);
      setTotal(res.total || res.count || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      showToast('Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, showToast]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft />
        </button>
        <h2>My Orders</h2>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`status-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {loading ? (
          <div className="loading-state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="order-card skeleton" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => {
            const itemsSummary =
              order.items && order.items.length > 0
                ? order.items.map((item) => item.product?.name || item.name || 'Item').join(', ')
                : `${order.itemCount || 0} item(s)`;

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="order-card"
              >
                <div className="order-card-top">
                  <span className="order-number">
                    {order.orderNumber || `#${order.id}`}
                  </span>
                  <span className={`status-badge ${STATUS_COLORS[order.status] || ''}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="order-card-body">
                  <p className="order-items-summary">{itemsSummary}</p>
                  <div className="order-card-meta">
                    <span className="order-date">
                      <Icons.Clock /> {formatDate(order.createdAt)}
                    </span>
                    <span className="order-total">
                      {formatNaira(order.totalAmount || order.total)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state">
            <Icons.Cart />
            <h3>No orders yet</h3>
            <p>
              {activeTab !== 'All'
                ? `No ${activeTab.toLowerCase()} orders found.`
                : 'Your orders will appear here once you make a purchase.'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Products
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      {!loading && orders.length < total && (
        <div className="load-more">
          <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
