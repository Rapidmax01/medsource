import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { notificationApi } from '../services/api';
import { Icons } from '../components/shared/Icons';

const NOTIFICATION_ICONS = {
  ORDER_PLACED: { icon: '🛒', bg: 'var(--green-50)', color: 'var(--green-600)' },
  ORDER_CONFIRMED: { icon: '✓', bg: 'var(--blue-50)', color: 'var(--blue-500)' },
  ORDER_SHIPPED: { icon: '🚚', bg: '#FFF7ED', color: '#9A3412' },
  ORDER_DELIVERED: { icon: '📦', bg: 'var(--green-50)', color: 'var(--green-700)' },
  INQUIRY_RECEIVED: { icon: '💬', bg: 'var(--amber-50)', color: 'var(--amber-500)' },
  INQUIRY_RESPONDED: { icon: '💬', bg: 'var(--blue-50)', color: 'var(--blue-500)' },
  PAYMENT_RECEIVED: { icon: '💰', bg: 'var(--green-50)', color: 'var(--green-600)' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-NG');
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await notificationApi.getAll({ page: pageNum });
      const items = res.notifications || res.data || res || [];
      if (pageNum === 1) {
        setNotifications(items);
      } else {
        setNotifications((prev) => [...prev, ...items]);
      }
      setHasMore(items.length >= 20);
    } catch {
      if (pageNum === 1) setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    try {
      await notificationApi.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, read: true } : n)
      );
    } catch {
      // silent fail
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } catch (err) {
      showToast(err.error || 'Failed to mark all as read', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-100)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          <Icons.ArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--green-600)',
              fontSize: 13,
              fontWeight: 600,
              cursor: markingAll ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: markingAll ? 0.6 : 1,
            }}
          >
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Notification List */}
      <div style={{ paddingBottom: 80 }}>
        {loading && notifications.length === 0 ? (
          <div className="loading-screen">
            <div className="spinner" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--gray-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--gray-300)',
            }}>
              <Icons.Bell />
            </div>
            <p className="empty-text">No notifications yet</p>
            <p className="empty-sub">
              You will be notified about orders, inquiries, and important updates
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => {
              const meta = NOTIFICATION_ICONS[notification.type] || { icon: '🔔', bg: 'var(--gray-50)', color: 'var(--gray-500)' };
              return (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleMarkRead(notification)}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      background: meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span className="notification-title" style={{ flex: 1 }}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--green-500)',
                            flexShrink: 0,
                          }} />
                        )}
                      </div>
                      <p className="notification-body">{notification.body}</p>
                      <span className="notification-time">{timeAgo(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
