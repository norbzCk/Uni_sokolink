import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useCart } from '../cart/cart-context';

export function AppLayout() {
  const { user, status } = useAuth();
  const cart = useCart();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="SokoLink home">
          <span className="brand-mark">S</span><span>SokoLink</span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Explore</NavLink>
          <NavLink to="/products">Marketplace</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.roles.includes('SELLER') && <NavLink to="/seller">Seller workspace</NavLink>}
          {(user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) && (
            <NavLink to="/admin">Administration</NavLink>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="cart-link" to="/cart" aria-label={'Cart with ' + cart.count + ' items'}>
            Cart <span className="cart-count">{cart.count}</span>
          </Link>
          {status === 'loading' ? (
            <span className="nav-muted">Checking session…</span>
          ) : user ? (
            <Link className="button button-outline nav-account" to="/account">
              {user.fullName.split(' ')[0]}
            </Link>
          ) : (
            <>
              <Link className="text-link" to="/sign-in">Sign in</Link>
              <Link className="button button-primary" to="/sign-up">Create account</Link>
            </>
          )}
        </div>
      </header>
      <main><Outlet /></main>
      <footer>
        <span>Built for student enterprise.</span>
        <span>Dar es Salaam, Tanzania</span>
      </footer>
    </div>
  );
}
