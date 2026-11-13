import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <Link className="brand" to="/" aria-label="SokoLink home">
        <span className="brand-mark">S</span><span>SokoLink</span>
      </Link>
      <Outlet />
      <p className="auth-caption">A community marketplace shaped around student enterprise</p>
    </div>
  );
}
