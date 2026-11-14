import { Link } from 'react-router-dom';
import type { Product, SellerApplication } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { LoadingState } from '../../components/async-state';
import { useApi } from '../../lib/use-api';

export function AdminDashboardPage() {
  const { authRequest } = useAuth();
  const applications = useApi(
    () => authRequest<{ applications: SellerApplication[] }>('/seller/admin/applications?status=PENDING'),
    [],
  );
  const products = useApi(
    () => authRequest<{ items: Product[] }>('/catalogue/admin/products?status=PENDING'),
    [],
  );

  if (applications.loading || products.loading) {
    return <LoadingState label="Loading administration overview" />;
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Platform operations</h1>
          <p className="muted">Review seller applications and keep the marketplace catalogue trustworthy.</p>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Seller applications</span>
          <strong>{applications.data?.applications.length ?? 0}</strong>
          <Link className="text-link" to="/admin/sellers">Review applications</Link>
        </article>
        <article className="stat-card">
          <span>Products awaiting review</span>
          <strong>{products.data?.items.length ?? 0}</strong>
          <Link className="text-link" to="/admin/products">Moderate products</Link>
        </article>
      </div>

      <article className="account-card">
        <h2>How moderation works</h2>
        <ul className="plain-list">
          <li>Approving a seller grants the SELLER role in identity immediately.</li>
          <li>Approved products become publicly searchable and buyable.</li>
          <li>Rejections require a clear reason so sellers can correct their submission.</li>
        </ul>
      </article>
    </div>
  );
}
