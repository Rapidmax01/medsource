import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { Icons } from '../components/shared/Icons';
import PasswordInput from '../components/shared/PasswordInput';

const NIGERIAN_STATES_CITIES = {
  'Abia': ['Aba', 'Umuahia', 'Ohafia', 'Arochukwu'],
  'Abuja (FCT)': ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Bwari', 'Kuje', 'Lugbe'],
  'Adamawa': ['Yola', 'Jimeta', 'Mubi', 'Numan', 'Ganye'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Ogidi'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are'],
  'Bayelsa': ['Yenagoa', 'Brass', 'Ogbia', 'Sagbama'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'],
  'Borno': ['Maiduguri', 'Biu', 'Damboa', 'Gwoza'],
  'Cross River': ['Calabar', 'Ikom', 'Ogoja', 'Obudu'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor', 'Effurun'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua'],
  'Ekiti': ['Ado-Ekiti', 'Ikere-Ekiti', 'Oye-Ekiti', 'Ijero-Ekiti'],
  'Enugu': ['Enugu', 'Nsukka', 'Agbani', 'Oji River'],
  'Gombe': ['Gombe', 'Billiri', 'Kaltungo', 'Bajoga'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Oguta'],
  'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Kazaure'],
  'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro'],
  'Kano': ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Bichi'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru'],
  'Kogi': ['Lokoja', 'Okene', 'Idah', 'Kabba', 'Ankpa'],
  'Kwara': ['Ilorin', 'Offa', 'Jebba', 'Lafiagi'],
  'Lagos': ['Ikeja', 'Victoria Island', 'Lekki', 'Surulere', 'Yaba', 'Ikoyi', 'Ajah', 'Ikorodu', 'Epe', 'Badagry', 'Oshodi', 'Mushin', 'Agege', 'Apapa', 'Festac', 'Ojota', 'Maryland'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa'],
  'Niger': ['Minna', 'Bida', 'Suleja', 'Kontagora'],
  'Ogun': ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ota', 'Ilaro'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Ikare'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo'],
  'Oyo': ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Degema', 'Eleme'],
  'Sokoto': ['Sokoto', 'Tambuwal', 'Bodinga', 'Gwadabawa'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Takum'],
  'Yobe': ['Damaturu', 'Potiskum', 'Nguru', 'Gashua'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka'],
};

const NIGERIAN_STATES = Object.keys(NIGERIAN_STATES_CITIES).sort();

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
              const userState = user.state || '';
              const userCity = user.city || '';
              const knownCities = NIGERIAN_STATES_CITIES[userState] || [];
              setEditData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                state: userState,
                city: userCity,
                _customCity: userCity && !knownCities.includes(userCity),
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
                const { _customCity, ...profileData } = editData;
                const res = await authApi.updateProfile(profileData);
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
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>State</label>
              <select
                className="form-input"
                value={editData.state || ''}
                onChange={(e) => setEditData((p) => ({ ...p, state: e.target.value, city: '', _customCity: false }))}
                style={{ appearance: 'auto' }}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>City</label>
              {editData._customCity ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Enter your city"
                    value={editData.city || ''}
                    onChange={(e) => setEditData((p) => ({ ...p, city: e.target.value }))}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditData((p) => ({ ...p, city: '', _customCity: false }))}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--gray-200)',
                      background: 'var(--gray-50)',
                      color: 'var(--gray-600)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Back
                  </button>
                </div>
              ) : (
                <select
                  className="form-input"
                  value={editData.city || ''}
                  onChange={(e) => {
                    if (e.target.value === '__other__') {
                      setEditData((p) => ({ ...p, city: '', _customCity: true }));
                    } else {
                      setEditData((p) => ({ ...p, city: e.target.value }));
                    }
                  }}
                  style={{ appearance: 'auto' }}
                  disabled={!editData.state}
                >
                  <option value="">{editData.state ? 'Select city' : 'Select state first'}</option>
                  {(NIGERIAN_STATES_CITIES[editData.state] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {editData.state && <option value="__other__">Other (type your city)</option>}
                </select>
              )}
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
