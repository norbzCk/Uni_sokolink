import { useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Role } from '../auth/auth-context';
import { LoadingState } from './async-state';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { status, user, refreshSession } = useAuth();
  const location = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  if (status === 'loading') {
    return <section className="page-wrap"><LoadingState label="Checking your session" /></section>;
  }
  if (status === 'anonymous' || !user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  const hasAccess = !roles || user.roles.includes('SUPER_ADMIN') || roles.some((role) => user.roles.includes(role));
  if (!hasAccess) {
    return (
      <section className="page-wrap workspace-entry">
        <p className="eyebrow">ACCESS RESTRICTED</p>
        <h1>This workspace is not available for your account.</h1>
        <p className="muted">Return to your account or contact SokoLink support if you believe this is a mistake.</p>
        <div className="inline-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              void refreshSession().finally(() => setRefreshing(false));
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh access'}
          </button>
          <Link className="button button-outline" to="/account">Your account</Link>
          <Link className="text-link" to="/">Return home</Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
