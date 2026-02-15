import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Icons } from './Icons';

const CATEGORIES = [
  'All',
  'Oncology',
  'Rare Disease',
  'Orphan Drugs',
  'Anti-infective',
  'Blood Products',
  'Vaccines',
  'Diagnostics',
  'Laboratories',
];

function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/?q=${encodeURIComponent(q)}`);
      setQuery('');
    }
  };

  return (
    <form className="amz-search" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search medications, blood products, suppliers..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="amz-search-input"
      />
      <button type="submit" className="amz-search-btn" aria-label="Search">
        <Icons.Search />
      </button>
    </form>
  );
}

export default function Layout() {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.firstName || user?.name?.split(' ')[0] || '';

  return (
    <div className="app-layout">
      {/* Main Header — Amazon-style dark */}
      <header className="amz-header">
        <div className="amz-header-main">
          {/* Logo */}
          <Link to="/" className="amz-logo">
            <span className="amz-logo-text">MedSource</span>
            <span className="amz-logo-sub">.ng</span>
          </Link>

          {/* Search */}
          <SearchBar />

          {/* Right nav items */}
          <div className="amz-header-nav">
            {user ? (
              <Link to="/profile" className="amz-nav-link">
                <span className="amz-nav-small">Hello, {firstName || 'User'}</span>
                <span className="amz-nav-bold">Account</span>
              </Link>
            ) : (
              <Link to="/login" className="amz-nav-link">
                <span className="amz-nav-small">Hello, Sign in</span>
                <span className="amz-nav-bold">Account</span>
              </Link>
            )}

            <Link to="/orders" className="amz-nav-link">
              <span className="amz-nav-small">Returns</span>
              <span className="amz-nav-bold">& Orders</span>
            </Link>

            <Link to="/cart" className="amz-cart-link">
              <div className="amz-cart-icon">
                <Icons.Cart />
                {cartCount > 0 && <span className="amz-cart-count">{cartCount}</span>}
              </div>
              <span className="amz-cart-label">Cart</span>
            </Link>
          </div>
        </div>

        {/* Sub-nav — category bar */}
        <nav className="amz-subnav">
          <button className="amz-subnav-menu" onClick={() => navigate('/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            All
          </button>
          {CATEGORIES.slice(1).map((cat) => (
            <Link
              key={cat}
              to={`/?category=${encodeURIComponent(cat)}`}
              className="amz-subnav-link"
            >
              {cat}
            </Link>
          ))}
          {!user && (
            <Link to="/register/email" className="amz-subnav-link amz-subnav-highlight">
              Register
            </Link>
          )}
        </nav>
      </header>

      {/* Page Content */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <span>Powered by <a href="https://www.xdosdev.com" target="_blank" rel="noopener noreferrer" className="site-footer-link">Xdosdev</a></span>
      </footer>

      {/* Bottom Navigation — mobile only */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icons.Home />
          <span>Home</span>
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-wrapper">
            <Icons.Cart />
            {cartCount > 0 && <span className="nav-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </div>
          <span>Cart</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icons.Clock />
          <span>Orders</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icons.User />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
}
