import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { LocaleProvider } from './i18n/locale-context';
import { AdminLayout } from './layouts/admin-layout';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { SellerLayout } from './layouts/seller-layout';
import { AccountPage } from './pages/account-page';
import { BuyersPage } from './pages/buyers-page';
import { ContactPage } from './pages/contact-page';
import { FaqPage } from './pages/faq-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { HomePage } from './pages/home-page';
import { MarketplacePage } from './pages/marketplace-page';
import { NotFoundPage } from './pages/not-found-page';
import { PrivacyPage } from './pages/privacy-page';
import { ProductDetailPage } from './pages/product-detail-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SellersPage } from './pages/sellers-page';
import { ShopDetailPage } from './pages/shop-detail-page';
import { ShopsPage } from './pages/shops-page';
import { SignInPage } from './pages/sign-in-page';
import { SignUpPage } from './pages/sign-up-page';
import { TermsPage } from './pages/terms-page';
import { VerifyEmailPage } from './pages/verify-email-page';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    const win = globalThis.window;
    if (win && typeof win.scrollTo === 'function') {
      try {
        win.scrollTo(0, 0);
      } catch {
        // Ignore jsdom unimplemented scrollTo in test environments
      }
    }
  }, [pathname, hash]);

  return null;
}

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
      <Link className="text-link" to="/account">
        View your account
      </Link>
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
      <Link className="text-link" to="/account">
        View your account
      </Link>
    </section>
  );
}

export function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ScrollManager />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/shops/:shopSlug" element={<ShopDetailPage />} />
            <Route path="/buyers" element={<BuyersPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller"
              element={
                <ProtectedRoute roles={['SELLER']}>
                  <SellerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SellerEntry />} />
            </Route>
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
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
    </LocaleProvider>
  );
}
