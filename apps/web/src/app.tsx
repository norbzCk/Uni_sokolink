import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './layouts/admin-layout';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { SellerLayout } from './layouts/seller-layout';
import { AccountPage } from './pages/account-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SignInPage } from './pages/sign-in-page';
import { SignUpPage } from './pages/sign-up-page';
import { VerifyEmailPage } from './pages/verify-email-page';

function SellerEntry() {
  const { user } = useAuth();
  return (
    <section className="page-wrap workspace-entry">
      <p className="eyebrow">SELLER WORKSPACE</p>
      <h1>Welcome{user ? ', ' + user.fullName.split(' ')[0] : ''}.</h1>
      <p className="muted">
        Storefront, catalogue, inventory and order tools arrive in the seller implementation phases.
        Your seller access has been approved and verified by the backend.
      </p>
      <Link className="text-link" to="/account">View your account</Link>
    </section>
  );
}

function AdminEntry() {
  const { user } = useAuth();
  return (
    <section className="page-wrap workspace-entry">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Administration workspace</h1>
      <p className="muted">
        Signed in as {user?.fullName}. User, seller review, moderation and platform operations
        interfaces are implemented in the administration phase.
      </p>
      <Link className="text-link" to="/account">View your account</Link>
    </section>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/account"
            element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
          />
          <Route
            path="/seller"
            element={<ProtectedRoute roles={['SELLER']}><SellerLayout /></ProtectedRoute>}
          >
            <Route index element={<SellerEntry />} />
          </Route>
          <Route
            path="/admin"
            element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}
          >
            <Route index element={<AdminEntry />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
