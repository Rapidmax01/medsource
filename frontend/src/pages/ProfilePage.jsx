import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { Icons } from '../components/shared/Icons';
import PasswordInput from '../components/shared/PasswordInput';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSeller, isAdmin, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Check if user logged in via email/password (has passwordHash)
  const hasPassword = user?.email && !user?.googleId;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword || null, newPassword);
      showToast('Password updated successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.error || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

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
    ...(isAdmin
      ? [{ label: 'Admin Dashboard', path: '/admin', icon: <Icons.Shield />, desc: 'Manage platform' }]
      : []
    ),
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

      {/* Edit Profile */}
      <div className="profile-menu" style={{ marginBottom: 0 }}>
        <button
          className="profile-menu-item"
          onClick={() => {
            if (!showEditProfile) {
              setEditData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                state: user.state || '',
                city: user.city || '',
              });
            }
            setShowEditProfile(!showEditProfile);
          }}
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span className="profile-menu-icon"><Icons.User /></span>
          <div className="profile-menu-text">
            <span className="profile-menu-label">Edit Profile</span>
            <span className="profile-menu-desc">
              {!user.phone ? 'Add your phone number & location' : 'Update your personal info'}
            </span>
          </div>
          <span className="profile-menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points={showEditProfile ? "18 15 12 9 6 15" : "9 18 15 12 9 6"} />
            </svg>
          </span>
        </button>

        {showEditProfile && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editData.firstName?.trim() || !editData.lastName?.trim()) {
                showToast('First and last name are required', 'error');
                return;
              }
              if (editData.phone && !/^(\+234|0)[789]\d{9}$/.test(editData.phone)) {
                showToast('Enter a valid Nigerian phone number', 'error');
                return;
              }
              setSavingProfile(true);
              try {
                const res = await authApi.updateProfile(editData);
                updateUser(res.user || editData);
                showToast('Profile updated!');
                setShowEditProfile(false);
              } catch (err) {
                showToast(err.error || 'Failed to update profile', 'error');
              } finally {
                setSavingProfile(false);
              }
            }}
            style={{ padding: '0 16px 16px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>First Name</label>
                <input
                  className="form-input"
                  value={editData.firstName || ''}
                  onChange={(e) => setEditData((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>Last Name</label>
                <input
                  className="form-input"
                  value={editData.lastName || ''}
                  onChange={(e) => setEditData((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>Phone Number</label>
              <input
                className="form-input"
                type="tel"
                placeholder="+234 800 000 0000"
                inputMode="numeric"
                value={editData.phone || ''}
                onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>State</label>
                <input
                  className="form-input"
                  placeholder="e.g. Lagos"
                  value={editData.state || ''}
                  onChange={(e) => setEditData((p) => ({ ...p, state: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>City</label>
                <input
                  className="form-input"
                  placeholder="e.g. Ikeja"
                  value={editData.city || ''}
                  onChange={(e) => setEditData((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
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

      {/* Change Password */}
      {user.email && (
        <div className="profile-menu" style={{ marginTop: 0 }}>
          <button
            className="profile-menu-item"
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span className="profile-menu-icon"><Icons.Settings /></span>
            <div className="profile-menu-text">
              <span className="profile-menu-label">Change Password</span>
              <span className="profile-menu-desc">Update your account password</span>
            </div>
            <span className="profile-menu-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points={showChangePassword ? "18 15 12 9 6 15" : "9 18 15 12 9 6"} />
              </svg>
            </span>
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} style={{ padding: '0 16px 16px' }}>
              {hasPassword && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>
                    Current Password
                  </label>
                  <PasswordInput
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>
                  New Password
                </label>
                <PasswordInput
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', display: 'block', marginBottom: 4 }}>
                  Confirm New Password
                </label>
                <PasswordInput
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="btn-primary btn-full"
                disabled={changingPassword || !newPassword || !confirmPassword}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Logout */}
      <div className="profile-footer">
        <button className="btn btn-outline btn-full btn-danger" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}
