import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icons, formatNaira } from '../components/shared/Icons';
import { adminApi } from '../services/api';
import PasswordInput from '../components/shared/PasswordInput';

function StatusBadge({ status, small }) {
  const colors = {
    PENDING: { bg: '#FFFBEB', color: '#92400E' },
    VERIFIED: { bg: '#F0FDF4', color: '#166534' },
    REJECTED: { bg: '#FEF2F2', color: '#991B1B' },
    FLAGGED: { bg: '#FEF2F2', color: '#991B1B' },
    ACTIVE: { bg: '#F0FDF4', color: '#166534' },
    SUSPENDED: { bg: '#FEF2F2', color: '#991B1B' },
  };
  const s = colors[status] || colors.PENDING;
  return (
    <span
      className="status-badge"
      style={{
        background: s.bg,
        color: s.color,
        fontSize: small ? 10 : 11,
      }}
    >
      {status}
    </span>
  );
}

const btnStyle = (variant = 'primary', disabled = false) => ({
  flex: 1,
  padding: '10px 16px',
  borderRadius: 'var(--radius-full)',
  border: variant === 'danger' ? '1.5px solid var(--red-500)' : 'none',
  background: variant === 'primary' ? 'var(--green-600)' : 'transparent',
  color: variant === 'primary' ? '#fff' : 'var(--red-500)',
  fontSize: 13,
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  opacity: disabled ? 0.6 : 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
});

const labelStyle = { fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 2 };
const valueStyle = { fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' };

// ---- Sellers Tab ----
function SellersTab({ isSuperAdmin }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    adminApi.getPendingSellers()
      .then((res) => setSellers(res.sellers || []))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (sellerId) => {
    setProcessing(sellerId);
    try {
      await adminApi.verifySeller(sellerId);
      showToast('Seller verified successfully');
      setSellers((prev) => prev.filter((s) => s.id !== sellerId));
    } catch (err) {
      showToast(err.error || 'Failed to verify seller', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (sellerId) => {
    setProcessing(sellerId);
    try {
      await adminApi.rejectSeller(sellerId);
      showToast('Seller rejected');
      setSellers((prev) => prev.filter((s) => s.id !== sellerId));
    } catch (err) {
      showToast(err.error || 'Failed to reject seller', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading sellers...</span>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>
        Pending Verifications ({sellers.length})
      </h3>

      {sellers.length > 0 ? (
        sellers.map((seller) => (
          <div className="admin-card" key={seller.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
                  {seller.businessName}
                </h4>
                <StatusBadge status="PENDING" />
              </div>
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {new Date(seller.createdAt).toLocaleDateString('en-NG')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={labelStyle}>Business Type</div>
                <div style={valueStyle}>{seller.businessType?.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div style={labelStyle}>Location</div>
                <div style={valueStyle}>{seller.city}, {seller.state}</div>
              </div>
              <div>
                <div style={labelStyle}>NAFDAC License</div>
                <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icons.Shield /> {seller.nafdacLicense || 'N/A'}
                </div>
              </div>
              <div>
                <div style={labelStyle}>CAC Number</div>
                <div style={valueStyle}>{seller.cacNumber || 'N/A'}</div>
              </div>
              <div>
                <div style={labelStyle}>NIN</div>
                <div style={valueStyle}>{seller.nin ? `*******${seller.nin.slice(-4)}` : 'N/A'}</div>
              </div>
              <div>
                <div style={labelStyle}>BVN</div>
                <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {seller.bvn ? `*******${seller.bvn.slice(-4)}` : 'Not provided'}
                  {seller.bvn ? (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: seller.bvnVerified ? '#F0FDF4' : '#FFFBEB',
                      color: seller.bvnVerified ? '#166534' : '#92400E',
                    }}>
                      {seller.bvnVerified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--gray-100)',
                      color: 'var(--gray-400)',
                    }}>
                      N/A
                    </span>
                  )}
                </div>
              </div>
              {seller.bvnFirstName && seller.bvnLastName && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>BVN Name</div>
                  <div style={valueStyle}>{seller.bvnFirstName} {seller.bvnLastName}</div>
                </div>
              )}
              {seller.user && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Owner</div>
                  <div style={valueStyle}>{seller.user.firstName} {seller.user.lastName} ({seller.user.phone})</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleVerify(seller.id)}
                disabled={processing === seller.id}
                style={btnStyle('primary', processing === seller.id)}
              >
                <Icons.Check /> {processing === seller.id ? '...' : 'Verify'}
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => handleReject(seller.id)}
                  disabled={processing === seller.id}
                  style={btnStyle('danger', processing === seller.id)}
                >
                  <Icons.Close /> {processing === seller.id ? '...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icons.Check />
          </div>
          <p className="empty-text">All caught up</p>
          <p className="empty-sub">No pending seller verifications</p>
        </div>
      )}
    </div>
  );
}

// ---- Users Tab (SUPER_ADMIN only) ----
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subAdmins, setSubAdmins] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const { showToast } = useToast();

  const fetchUsers = (p = 1, q = '') => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (q) params.search = q;
    adminApi.getUsers(params)
      .then((res) => {
        setUsers(res.users || []);
        setTotalPages(res.totalPages || 1);
        setPage(res.page || 1);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  const fetchSubAdmins = () => {
    adminApi.getSubAdmins()
      .then((res) => setSubAdmins(res.subAdmins || []))
      .catch(() => setSubAdmins([]));
  };

  useEffect(() => {
    fetchUsers();
    fetchSubAdmins();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleSuspend = async (userId) => {
    setProcessing(userId);
    try {
      await adminApi.suspendUser(userId);
      showToast('User suspended');
      fetchUsers(page, search);
    } catch (err) {
      showToast(err.error || 'Failed to suspend user', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (userId) => {
    setProcessing(userId);
    try {
      await adminApi.approveUser(userId);
      showToast('User activated');
      fetchUsers(page, search);
    } catch (err) {
      showToast(err.error || 'Failed to activate user', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password || !newAdmin.firstName || !newAdmin.lastName) {
      showToast('Email, password, first name, and last name are required', 'error');
      return;
    }
    if (newAdmin.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await adminApi.createSubAdmin(newAdmin);
      showToast('Sub-admin created');
      setNewAdmin({ email: '', password: '', firstName: '', lastName: '', phone: '' });
      setShowCreateForm(false);
      fetchSubAdmins();
    } catch (err) {
      showToast(err.error || 'Failed to create sub-admin', 'error');
    }
  };

  const handleDeleteSubAdmin = async (id) => {
    setProcessing(id);
    try {
      await adminApi.deleteSubAdmin(id);
      showToast('Sub-admin deleted');
      fetchSubAdmins();
    } catch (err) {
      showToast(err.error || 'Failed to delete sub-admin', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--gray-200)',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Sub-Admin Management */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', margin: 0 }}>
            Sub-Admins ({subAdmins.length})
          </h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'var(--green-600)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Add Sub-Admin'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSubAdmin} className="admin-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input
                style={inputStyle}
                placeholder="First Name *"
                value={newAdmin.firstName}
                onChange={(e) => setNewAdmin((p) => ({ ...p, firstName: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Last Name *"
                value={newAdmin.lastName}
                onChange={(e) => setNewAdmin((p) => ({ ...p, lastName: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Email *"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <PasswordInput
                  className=""
                  style={{ ...inputStyle, flex: 1, paddingRight: 44 }}
                  placeholder="Password *"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
                    let pwd = '';
                    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
                    setNewAdmin((p) => ({ ...p, password: pwd }));
                    showToast('Temp password generated — copy it before creating');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--gray-200)',
                    background: '#f7f8fa',
                    color: 'var(--gray-700)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: 'nowrap',
                  }}
                >
                  Generate
                </button>
              </div>
              <input
                style={{ ...inputStyle, gridColumn: '1 / -1' }}
                placeholder="Phone (optional)"
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <button type="submit" style={{ ...btnStyle('primary'), flex: 'none', width: '100%' }}>
              Create Sub-Admin
            </button>
          </form>
        )}

        {subAdmins.map((admin) => (
          <div className="admin-card" key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>
                {admin.firstName} {admin.lastName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {admin.phone} {admin.email ? `| ${admin.email}` : ''}
              </div>
            </div>
            <button
              onClick={() => handleDeleteSubAdmin(admin.id)}
              disabled={processing === admin.id}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--red-500)',
                background: 'transparent',
                color: 'var(--red-500)',
                fontSize: 12,
                fontWeight: 600,
                cursor: processing === admin.id ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: processing === admin.id ? 0.6 : 1,
              }}
            >
              {processing === admin.id ? '...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>

      {/* All Users */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 12 }}>
        All Users
      </h3>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" style={{ ...btnStyle('primary'), flex: 'none', padding: '10px 20px' }}>
          Search
        </button>
      </form>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading users...</span>
        </div>
      ) : (
        <>
          {users.map((u) => (
            <div className="admin-card" key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>
                    {u.firstName} {u.lastName}
                  </span>
                  <StatusBadge status={u.isActive ? 'ACTIVE' : 'SUSPENDED'} small />
                  <span style={{ fontSize: 10, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                    {u.role}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.phone} {u.email ? `| ${u.email}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!u.isActive ? (
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={processing === u.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: 'var(--green-600)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: processing === u.id ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: processing === u.id ? 0.6 : 1,
                    }}
                  >
                    {processing === u.id ? '...' : 'Activate'}
                  </button>
                ) : u.role !== 'SUPER_ADMIN' ? (
                  <button
                    onClick={() => handleSuspend(u.id)}
                    disabled={processing === u.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: '1.5px solid var(--red-500)',
                      background: 'transparent',
                      color: 'var(--red-500)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: processing === u.id ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: processing === u.id ? 0.6 : 1,
                    }}
                  >
                    {processing === u.id ? '...' : 'Suspend'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => fetchUsers(page - 1, search)}
                disabled={page <= 1}
                style={{ ...btnStyle('primary', page <= 1), flex: 'none', padding: '8px 16px' }}
              >
                Prev
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchUsers(page + 1, search)}
                disabled={page >= totalPages}
                style={{ ...btnStyle('primary', page >= totalPages), flex: 'none', padding: '8px 16px' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- Analytics Tab ----
function AnalyticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then((res) => setStats(res))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading stats...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <p className="empty-text">Failed to load stats</p>
      </div>
    );
  }

  const items = [
    { label: 'Platform Revenue', value: formatNaira(stats.platformRevenue || 0), color: 'var(--green-800)' },
    { label: 'Total Commission (5%)', value: formatNaira(stats.totalCommission || 0), color: 'var(--green-600)' },
    { label: 'Total Service Fees (2.5%)', value: formatNaira(stats.totalServiceFees || 0), color: 'var(--green-600)' },
    { label: 'Seller Earnings', value: formatNaira(stats.totalSellerEarnings || 0), color: 'var(--blue-500)' },
    { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), color: 'var(--blue-500)' },
    { label: 'Total Sellers', value: (stats.totalSellers || 0).toLocaleString(), color: 'var(--green-600)' },
    { label: 'Pending Sellers', value: (stats.pendingSellers || 0).toLocaleString(), color: 'var(--amber-500)' },
    { label: 'Total Orders', value: (stats.totalOrders || 0).toLocaleString(), color: 'var(--amber-500)' },
    { label: 'Total Revenue', value: formatNaira(stats.totalRevenue || 0), color: 'var(--green-800)' },
    { label: 'Active Products', value: (stats.activeProducts || 0).toLocaleString(), color: 'var(--blue-500)' },
  ];

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>
        Platform Analytics
      </h3>

      <div className="admin-stat-grid">
        {items.map((s) => (
          <div className="admin-stat" key={s.label}>
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value" style={{ color: s.color, fontSize: s.label === 'Total Revenue' ? 18 : 22 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main Admin Page ----
export default function AdminPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const TABS = isSuperAdmin ? ['Sellers', 'Users', 'Analytics'] : ['Sellers', 'Analytics'];
  const [activeTab, setActiveTab] = useState('Sellers');

  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%)',
        color: '#fff',
        padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
              {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'} — MedSource Platform
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
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
            <Icons.Home />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: activeTab === tab ? 1 : 0.6,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="admin-container">
        {activeTab === 'Sellers' && <SellersTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 'Users' && isSuperAdmin && <UsersTab />}
        {activeTab === 'Analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}
