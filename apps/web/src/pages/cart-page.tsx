import { Link, useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { useCart } from '../cart/cart-context';
import { formatTzs } from '../lib/format';

export function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <section className="page-wrap narrow-page">
        <p className="eyebrow">YOUR CART</p>
        <h1>Your cart is empty.</h1>
        <p className="muted">Browse the marketplace and add something useful.</p>
        <Link className="button button-primary" to="/products">Browse products</Link>
      </section>
    );
  }

  function checkout() {
    if (!user) {
      navigate('/sign-in', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  return (
    <section className="page-wrap cart-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR CART</p>
          <h1>{cart.count} {cart.count === 1 ? 'item' : 'items'}</h1>
        </div>
        <Link className="text-link" to="/products">Continue shopping</Link>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <article className="cart-item" key={item.productId}>
              <Link className="cart-thumb" to={'/products/' + item.slug}>
                {item.imageUrl ? (
                  <img src={resolveMediaUrl(item.imageUrl) ?? ''} alt={item.name} />
                ) : (
                  <span className="product-placeholder" aria-hidden="true">{item.name.slice(0, 1)}</span>
                )}
              </Link>
              <div className="cart-item-info">
                <Link to={'/products/' + item.slug}><strong>{item.name}</strong></Link>
                <span className="muted">{item.sellerName}</span>
                <span className="muted">{formatTzs(item.priceTzs)} per {item.unit}</span>
              </div>
              <label className="cart-quantity">
                <span className="sr-only">Quantity for {item.name}</span>
                <input
                  type="number"
                  min={1}
                  max={item.available}
                  value={item.quantity}
                  onChange={(event) => cart.setQuantity(item.productId, Number(event.target.value) || 0)}
                />
              </label>
              <strong className="cart-line-total">{formatTzs(item.priceTzs * item.quantity)}</strong>
              <button className="link-button" type="button" onClick={() => cart.remove(item.productId)}>
                Remove
              </button>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="summary-row"><span>Subtotal</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <div className="summary-row"><span>Delivery</span><span className="muted">Confirmed with the seller</span></div>
          <div className="summary-row total"><span>Total</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <button className="button button-primary full-width" type="button" onClick={checkout}>
            {user ? 'Continue to checkout' : 'Sign in to check out'}
          </button>
          <p className="muted small-note">Stock is checked again when you place the order.</p>
        </aside>
      </div>
    </section>
  );
}
