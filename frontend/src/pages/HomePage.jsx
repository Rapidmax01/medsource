import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Icons, formatNaira } from '../components/shared/Icons';

const CATEGORIES = ['All', 'Oncology', 'Rare Disease', 'Orphan Drugs', 'Anti-infective', 'Blood Products', 'Vaccines', 'Diagnostics', 'Laboratories'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const QUICK_ACTIONS = [
  { label: 'Pharmaceuticals', icon: 'pill', color: '#0A8F3C', bg: '#F0FDF4', filter: 'PHARMACEUTICAL' },
  { label: 'Blood Products', icon: 'blood', color: '#B91C1C', bg: '#FEF2F2', filter: 'BLOOD_PRODUCT' },
  { label: 'Urgent Needs', icon: 'clock', color: '#D97706', bg: '#FFFBEB', filter: 'urgent' },
  { label: 'Verified', icon: 'verified', color: '#2563EB', bg: '#EFF6FF', filter: 'verified' },
];

function QuickActionIcon({ type }) {
  if (type === 'pill') return <Icons.Pill />;
  if (type === 'blood') return <Icons.Blood />;
  if (type === 'clock') return <Icons.Clock />;
  if (type === 'verified') return <Icons.Verified />;
  return <Icons.Search />;
}

function ProductCard({ product, onClick, index }) {
  const isBlood = product.type === 'BLOOD_PRODUCT';
  return (
    <div
      className={`product-card${isBlood ? ' blood-card' : ''}`}
      onClick={() => onClick(product.id)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="product-card-icon">
        {isBlood ? <Icons.Blood /> : <Icons.Pill />}
      </div>
      <div className="product-card-body">
        <div className="product-card-type">
          <span className={`type-badge ${isBlood ? 'blood' : 'pharma'}`}>
            {isBlood ? 'Blood Product' : 'Pharmaceutical'}
          </span>
          {product.verified && <Icons.Verified />}
        </div>
        <h3 className="product-card-name">{product.name}</h3>
        {product.genericName && (
          <p className="product-card-generic">{product.genericName}</p>
        )}
        {product.bloodType && (
          <span className="blood-type-tag">{product.bloodType}</span>
        )}
        <div className="product-card-meta">
          <span className="product-card-location">
            <Icons.Location /> {product.location || product.seller?.location || 'Nigeria'}
          </span>
          {product.coldChain && (
            <span className="product-card-cold">
              <Icons.Snowflake /> Cold Chain
            </span>
          )}
        </div>
        <div className="product-card-footer">
          <span className="product-card-price">{formatNaira(product.price)}</span>
          <span className={`stock-badge ${product.inStock !== false ? 'in-stock' : 'out-of-stock'}`}>
            {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || '';

  const [category, setCategory] = useState('All');
  const [bloodType, setBloodType] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const showBloodFilter = category === 'All' || category === 'Blood Products';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (query) params.q = query;
      if (category !== 'All') {
        if (category === 'Blood Products') {
          params.type = 'BLOOD_PRODUCT';
        } else {
          params.type = 'PHARMACEUTICAL';
          params.category = category;
        }
      }
      if (bloodType && showBloodFilter) {
        params.bloodType = bloodType;
      }
      const res = await productApi.search(params);
      setProducts(res.products || res.data || []);
      setTotal(res.total || res.count || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, bloodType, page, limit, showBloodFilter]);

  // Sync URL category param → local state
  useEffect(() => {
    if (urlCategory && CATEGORIES.includes(urlCategory)) {
      setCategory(urlCategory);
    } else if (!urlCategory && !query) {
      setCategory('All');
    }
  }, [urlCategory, query]);

  useEffect(() => {
    setPage(1);
  }, [query, category, bloodType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      navigate('/');
    } else {
      navigate(`/?category=${encodeURIComponent(cat)}`);
    }
    setCategory(cat);
    if (cat !== 'All' && cat !== 'Blood Products') {
      setBloodType('');
    }
  };

  const handleQuickAction = (filter) => {
    if (filter === 'PHARMACEUTICAL') {
      setCategory('All');
      navigate('/?type=pharmaceutical');
    } else if (filter === 'BLOOD_PRODUCT') {
      setCategory('Blood Products');
    } else if (filter === 'urgent') {
      navigate('/?q=urgent');
    } else if (filter === 'verified') {
      navigate('/?q=verified');
    }
  };

  const handleProductClick = (id) => {
    navigate(`/products/${id}`);
  };

  const greeting = user
    ? `Welcome back, ${user.firstName || user.name || 'there'}`
    : 'Find what you need';

  return (
    <div className="home-page">
      {/* Hero Banner */}
      {!query && category === 'All' && (
        <div className="hero-banner">
          <div className="hero-content">
            <h2 className="hero-title">{greeting}</h2>
            <p className="hero-subtitle">
              Access verified pharmaceuticals and blood products from trusted suppliers across Nigeria
            </p>
          </div>
          <div className="hero-pattern" />
        </div>
      )}

      {/* Quick Actions */}
      {!query && category === 'All' && (
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className="quick-action-card"
              onClick={() => handleQuickAction(action.filter)}
              style={{ '--action-color': action.color, '--action-bg': action.bg }}
            >
              <div className="quick-action-icon">
                <QuickActionIcon type={action.icon} />
              </div>
              <span className="quick-action-label">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category Chips */}
      <div className="category-strip">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${category === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blood Type Quick Filter */}
      {showBloodFilter && (
        <div className="blood-type-strip">
          <button
            className={`blood-chip ${bloodType === '' ? 'active' : ''}`}
            onClick={() => setBloodType('')}
          >
            All Types
          </button>
          {BLOOD_TYPES.map((bt) => (
            <button
              key={bt}
              className={`blood-chip ${bloodType === bt ? 'active' : ''}`}
              onClick={() => setBloodType(bloodType === bt ? '' : bt)}
            >
              {bt}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="results-header">
        <span className="results-count">
          {loading ? 'Searching...' : `${total} product${total !== 1 ? 's' : ''} found`}
        </span>
        {query && <span className="results-query">for "{query}"</span>}
      </div>

      {/* Product List */}
      <div className="product-list">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="product-card skeleton" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </>
        ) : products.length > 0 ? (
          products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
              index={index}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icons.Search />
            </div>
            <h3 className="empty-text">No products found</h3>
            <p className="empty-sub">Try adjusting your filters or search terms</p>
            <button className="btn btn-primary" onClick={() => { setCategory('All'); setBloodType(''); }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      {!loading && products.length < total && (
        <div className="load-more">
          <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}
