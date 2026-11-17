import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { useCart, type CartItem } from '../cart/cart-context';
import { VerifiedSeller } from '../components/ui/primitives';
import { formatTzs } from '../lib/format';

function groupBySeller(items: CartItem[]) {
  const groups = new Map<string, { sellerName: string; items: CartItem[] }>();
  for (const item of items) {
    const group = groups.get(item.sellerId);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.sellerId, { sellerName: item.sellerName, items: [item] });
    }
  }
  return [...groups.entries()].map(([sellerId, group]) => ({ sellerId, ...group }));
}

export function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <section className="page-wrap narrow-page empty-cart">
        <div className="empty-panel">
          <ShoppingCart size={30} strokeWidth={1.6} aria-hidden="true" />
          <h1>Your cart is empty</h1>
          <p className="muted">Browse the marketplace and add something useful. Your cart is saved on this device.</p>
          <Link className="button button-primary" to="/search">Start shopping</Link>
        </div>
      </section>
    );
  }

  const groups = groupBySeller(cart.items);

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
          <h1>Shopping cart</h1>
          <p className="muted">{cart.count} {cart.count === 1 ? 'item' : 'items'} from {groups.length} {groups.length === 1 ? 'seller' : 'sellers'}</p>
        </div>
        <Link className="text-link" to="/search">Continue shopping</Link>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {groups.map((group) => {
            const groupTotal = group.items.reduce((sum, item) => sum + item.priceTzs * item.quantity, 0);
            return (
              <article className="cart-seller-group" key={group.sellerId}>
                <header className="cart-seller-head">
                  <div>
                    <strong>{group.sellerName}</strong>
                    <VerifiedSeller />
                  </div>
                  <span className="muted">{formatTzs(groupTotal)}</span>
                </header>
                {group.items.map((item) => (
                  <div className="cart-item" key={item.productId}>
                    <Link className="cart-thumb" to={'/p/' + item.slug}>
                      {item.imageUrl ? (
                        <img src={resolveMediaUrl(item.imageUrl) ?? ''} alt={item.name} />
                      ) : (
                        <span className="product-placeholder" aria-hidden="true">{item.name.slice(0, 1)}</span>
                      )}
                    </Link>
                    <div className="cart-item-info">
                      <Link to={'/p/' + item.slug}><strong>{item.name}</strong></Link>
                      <span className="muted">{formatTzs(item.priceTzs)} per {item.unit}</span>
                      {item.available <= 3 && <span className="stock-hint">Only {item.available} left in stock</span>}
                    </div>
                    <div className="qty-stepper">
                      <button
                        type="button"
                        aria-label={'Decrease quantity of ' + item.name}
                        onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.available}
                        aria-label={'Quantity for ' + item.name}
                        value={item.quantity}
                        onChange={(event) => cart.setQuantity(item.productId, Number(event.target.value) || 0)}
                      />
                      <button
                        type="button"
                        aria-label={'Increase quantity of ' + item.name}
                        onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.available}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong className="cart-line-total">{formatTzs(item.priceTzs * item.quantity)}</strong>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={'Remove ' + item.name + ' from cart'}
                      onClick={() => cart.remove(item.productId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="summary-row"><span>Subtotal ({cart.count} items)</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <div className="summary-row"><span>Delivery</span><span className="muted">Confirmed with the seller</span></div>
          <div className="summary-row total"><span>Total</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <button className="button button-primary full-width" type="button" onClick={checkout}>
            {user ? 'Proceed to checkout' : 'Sign in to check out'}
          </button>
          <p className="secure-note"><ShieldCheck size={14} /> Stock is checked again when you place the order.</p>
        </aside>
      </div>
    </section>
  );
}
