import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

export function AppLayout() {
  const { user, status } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="SokoLink home">
          <span className="brand-mark">S</span><span>SokoLink</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/">Explore</Link>
          {user?.roles.includes('SELLER') && <Link to="/seller">Seller workspace</Link>}
          {(user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) && (
            <Link to="/admin">Administration</Link>
          )}
        </nav>
        {status === 'loading' ? (
          <span className="nav-muted">Checking session…</span>
        ) : user ? (
          <Link className="button button-outline nav-account" to="/account">
            {user.fullName.split(' ')[0]}
          </Link>
        ) : (
          <div className="nav-actions">
            <Link className="text-link" to="/sign-in">Sign in</Link>
            <Link className="button button-primary" to="/sign-up">Create account</Link>
          </div>
        )}
      </header>
      <main><Outlet /></main>
      <footer>
        <span>Built for student enterprise.</span>
        <span>Dar es Salaam, Tanzania</span>
      </footer>
    </div>
  );
}
