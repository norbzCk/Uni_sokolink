import { Link, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/admin-layout';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { SellerLayout } from './layouts/seller-layout';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { SignInPage } from './pages/sign-in-page';

function SellerEntry() {
  return (
    <section className="page-wrap workspace-entry">
      <p className="eyebrow">SELLER WORKSPACE</p>
      <h1>Seller tools are being prepared.</h1>
      <p>This area will be available to approved sellers.</p>
      <Link className="text-link" to="/sign-in">Sign in</Link>
    </section>
  );
}

function AdminEntry() {
  return (
    <section className="page-wrap workspace-entry">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Administration workspace</h1>
      <p>Access is restricted to authorized administrators.</p>
    </section>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<SellerLayout />}><Route path="/seller" element={<SellerEntry />} /></Route>
        <Route element={<AdminLayout />}><Route path="/admin" element={<AdminEntry />} /></Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<AuthLayout />}><Route path="/sign-in" element={<SignInPage />} /></Route>
    </Routes>
  );
}
