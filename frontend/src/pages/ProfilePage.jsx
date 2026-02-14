import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/shared/Icons';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSeller, logout } = useAuth();

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h2>Account</h2>
        </div>
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <div className="empty-icon" style={{ width: 80, height: 80, marginBottom: 20 }}>
            <Icons.User />
          </div>
          <h3 className="empty-text">Not logged in</h3>
          <p className="empty-sub">Log in to access your account, orders, and more.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : user.name || 'MedSource User';
  const initials = (firstName || displayName || '?').charAt(0).toUpperCase();
  const roleName = user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'SUB_ADMIN' ? 'Sub-Admin' : isSeller ? 'Seller' : 'Buyer';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { label: 'My Orders', path: '/orders', icon: <Icons.Cart />, desc: 'Track your purchases' },
    { label: 'Notifications', path: '/notifications', icon: <Icons.Bell />, desc: 'Stay updated' },
    ...(isSeller
      ? [{ label: 'Seller Dashboard', path: '/seller', icon: <Icons.Star />, desc: 'Manage your shop' }]
      : [{ label: 'Become a Seller', path: '/seller/register', icon: <Icons.Plus />, desc: 'Start selling on MedSource' }]
    ),
    { label: 'Settings', path: '/profile', icon: <Icons.Settings />, desc: 'Preferences & privacy' },
  ];

  return (
    <div className="profile-page">
      {/* Gradient Profile Card */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div className="profile-avatar-lg">{initials}</div>
          <h2 className="profile-hero-name">{displayName}</h2>
          <span className="profile-hero-role">{roleName}</span>
          {user.email && <span className="profile-hero-email">{user.email}</span>}
          {user.phone && <span className="profile-hero-phone">{user.phone}</span>}
        </div>
      </div>

      {/* Stats Row */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{user.state || '--'}</span>
          <span className="profile-stat-label">State</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-value">{user.city || '--'}</span>
          <span className="profile-stat-label">City</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-value">{user.accountType ? user.accountType.charAt(0) + user.accountType.slice(1).toLowerCase().replace(/_/g, ' ') : 'Individual'}</span>
          <span className="profile-stat-label">Account</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="profile-menu">
        {menuItems.map((item) => (
          <Link key={item.path + item.label} to={item.path} className="profile-menu-item">
            <span className="profile-menu-icon">{item.icon}</span>
            <div className="profile-menu-text">
              <span className="profile-menu-label">{item.label}</span>
              {item.desc && <span className="profile-menu-desc">{item.desc}</span>}
            </div>
            <span className="profile-menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="profile-footer">
        <button className="btn btn-outline btn-full btn-danger" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
