import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Icons, formatNaira } from '../components/shared/Icons';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQty, removeItem, cartTotal, cartCount } = useCart();

  if (cartCount === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <button className="btn-icon" onClick={() => navigate(-1)}>
            <Icons.ArrowLeft />
          </button>
          <h2>Shopping Cart</h2>
        </div>
        <div className="empty-state">
          <Icons.Cart />
          <h3>Your cart is empty</h3>
          <p>Browse our marketplace to find the products you need.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <Icons.ArrowLeft />
        </button>
        <h2>Shopping Cart ({cartCount})</h2>
      </div>

      {/* Cart Items */}
      <div className="cart-items">
        {cart.map((item) => {
          const isBlood = item.type === 'BLOOD_PRODUCT';
          return (
            <div key={item.id} className="cart-item">
              <div className="cart-item-icon">
                {isBlood ? <Icons.Blood /> : <Icons.Pill />}
              </div>
              <div className="cart-item-details">
                <h4 className="cart-item-name">{item.name}</h4>
                {item.seller && (
                  <p className="cart-item-seller">
                    {item.seller.businessName || item.seller.name}
                  </p>
                )}
                {item.bloodType && (
                  <span className="blood-type-tag">{item.bloodType}</span>
                )}
                <span className="cart-item-price">{formatNaira(item.price)}</span>
              </div>
              <div className="cart-item-controls">
                <div className="qty-controls">
                  <button
                    className="btn-icon btn-sm"
                    onClick={() => updateQty(item.id, -1)}
                    disabled={item.qty <= 1}
                  >
                    <Icons.Minus />
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="btn-icon btn-sm"
                    onClick={() => updateQty(item.id, 1)}
                  >
                    <Icons.Plus />
                  </button>
                </div>
                <span className="cart-item-subtotal">
                  {formatNaira(item.price * item.qty)}
                </span>
                <button
                  className="btn-icon btn-sm btn-danger"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove item"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Summary */}
      <div className="cart-bottom-bar">
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
            <span className="cart-summary-total">{formatNaira(cartTotal)}</span>
          </div>
        </div>
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
