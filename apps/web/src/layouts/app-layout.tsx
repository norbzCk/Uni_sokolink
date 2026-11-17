import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  Globe,
  Home,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import type { Category } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { useCart } from '../cart/cart-context';
import { CategoryDrawer } from '../components/ui/category-drawer';
import { SearchBar } from '../components/ui/search-bar';

export function AppLayout() {
  const { user, status } = useAuth();
  const cart = useCart();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    apiRequest<Category[]>('/catalogue/categories')
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  const firstName = user?.fullName.split(' ')[0];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-main">
          <button
            className="icon-button"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open categories"
          >
            <Menu size={22} />
          </button>
          <Link className="brand" to="/" aria-label="SokoLink home">
            <span className="brand-mark">S</span>
            <span>SokoLink</span>
          </Link>
          <Link className="pickup" to="/help#delivery">
            <MapPin size={18} />
            <span>
              <span>Pickup location</span>
              <strong>IFM Campus</strong>
            </span>
          </Link>
          <SearchBar />
          <button className="language-toggle" type="button" title="Language">
            <Globe size={14} />
            EN
            <ChevronDown size={12} />
          </button>
          <div className="header-actions">
            {status === 'loading' ? (
              <span className="nav-muted">Checking session…</span>
            ) : user ? (
              <Link className="header-action" to="/account">
                <span>Hello, {firstName}</span>
                <strong>Account &amp; Lists</strong>
              </Link>
            ) : (
              <Link className="header-action" to="/sign-in">
                <span>Hello, sign in</span>
                <strong>Account &amp; Lists</strong>
              </Link>
            )}
            <Link className="header-action" to="/orders">
              <span>Returns</span>
              <strong>&amp; Orders</strong>
            </Link>
            <Link className="cart-link" to="/cart" aria-label={'Cart with ' + cart.count + ' items'}>
              <span className="cart-icon-wrap">
                <ShoppingCart size={23} />
                <span className="cart-count">{cart.count}</span>
              </span>
              <strong>Cart</strong>
            </Link>
          </div>
        </div>
        <nav className="subnav" aria-label="Marketplace navigation">
          <div className="subnav-inner">
            <button type="button" onClick={() => setDrawerOpen(true)}>
              <Menu size={15} />
              All
            </button>
            {categories.slice(0, 8).map((category) => (
              <Link key={category.id} to={'/c/' + category.slug}>
                {category.name}
              </Link>
            ))}
            <Link to="/deals">Today&apos;s Deals</Link>
            <Link to="/help">Help</Link>
            {user?.roles.includes('SELLER') ? (
              <Link to="/seller">Seller workspace</Link>
            ) : null}
            {(user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) ? (
              <Link to="/admin">Administration</Link>
            ) : null}
            <Link className="subnav-sell" to="/sell">
              Sell on SokoLink
            </Link>
          </div>
        </nav>
        <div className="mobile-header">
          <div className="mobile-header-top">
            <button
              className="icon-button"
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open categories"
            >
              <Menu size={21} />
            </button>
            <Link className="brand" to="/" aria-label="SokoLink home">
              <span className="brand-mark">S</span>
              <span>SokoLink</span>
            </Link>
            <div className="header-actions">
              <Link className="cart-link" to="/cart" aria-label={'Cart with ' + cart.count + ' items'}>
                <span className="cart-icon-wrap">
                  <ShoppingCart size={22} />
                  <span className="cart-count">{cart.count}</span>
                </span>
              </Link>
            </div>
          </div>
          <div className="mobile-search-row">
            <SearchBar mobile />
          </div>
          <Link className="mobile-pickup" to="/help#delivery">
            <MapPin size={14} />
            Pickup: <strong>IFM Campus</strong>
            <ChevronDown size={12} />
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <button
          className="back-to-top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to top
        </button>
        <div className="footer-grid">
          <div>
            <h3>Get to know us</h3>
            <Link to="/about">About SokoLink</Link>
            <Link to="/about#impact">Our impact</Link>
            <Link to="/sell">Sell on SokoLink</Link>
            <Link to="/about#careers">Careers</Link>
          </div>
          <div>
            <h3>Make money with us</h3>
            <Link to="/sell">Become a student seller</Link>
            <Link to="/seller">Seller workspace</Link>
            <Link to="/help#fees">Fees and payments</Link>
            <Link to="/help#delivery">Deliver with SokoLink</Link>
          </div>
          <div>
            <h3>Let us help you</h3>
            <Link to="/account">Your account</Link>
            <Link to="/orders">Your orders</Link>
            <Link to="/help">Help centre</Link>
            <Link to="/policies/refunds">Returns and refunds</Link>
          </div>
          <div>
            <h3>SokoLink for IFM</h3>
            <Link to="/about">Student enterprise</Link>
            <Link to="/campus">Campus pickup</Link>
            <Link to="/policies">Policies</Link>
            <Link to="/contact">Contact us</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <Link className="brand" to="/" aria-label="SokoLink home">
            <span className="brand-mark">S</span>
            <span>SokoLink</span>
          </Link>
          <span>Built for student enterprise. Dar es Salaam, Tanzania.</span>
          <span>© {new Date().getFullYear()} SokoLink</span>
        </div>
      </footer>

      <nav className="bottom-tabs" aria-label="Mobile navigation">
        <NavLink to="/" end>
          <Home />
          Home
        </NavLink>
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Browse categories">
          <Menu />
          Categories
        </button>
        <NavLink to="/search">
          <Search />
          Search
        </NavLink>
        <NavLink to="/cart">
          <ShoppingCart />
          Cart
        </NavLink>
        <NavLink to="/account">
          <User />
          Account
        </NavLink>
      </nav>

      <CategoryDrawer
        open={drawerOpen}
        categories={categories}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
