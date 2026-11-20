import { Link } from 'react-router-dom';
import type {
  CatalogueSellerStats,
  InventoryAnalytics,
  MySellerStatus,
  SellerStats,
  Storefront,
} from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatTzs } from '../../lib/format';
import { useApi } from '../../lib/use-api';

export function SellerDashboardPage() {
  const { authRequest } = useAuth();
  const catalogue = useApi(() => authRequest<CatalogueSellerStats>('/catalogue/seller/stats'), []);
  const orders = useApi(() => authRequest<SellerStats>('/orders/seller/stats'), []);
  const profile = useApi(() => authRequest<{ storefront: Storefront | null }>('/seller/profile'), []);
  const status = useApi(() => authRequest<MySellerStatus>('/seller/applications/me'), []);
  const inventory = useApi(
    () => authRequest<InventoryAnalytics>('/inventory/seller/analytics?days=30'),
    [],
  );

  if (catalogue.loading || orders.loading || profile.loading || status.loading || inventory.loading) {
    return <LoadingState label="Loading seller overview" />;
  }

  const loadError = catalogue.error ?? orders.error ?? profile.error ?? status.error ?? inventory.error;
  if (loadError) {
    return (
      <div className="workspace-entry">
        <ErrorState message={loadError} />
        <button className="button button-outline" type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  const storefront = profile.data?.storefront ?? null;
  const application = status.data?.application ?? null;

  return (
    <div className="seller-dashboard">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>{storefront?.businessName ?? application?.businessName ?? 'Your business'}</h1>
          <p className="muted">
            {storefront
              ? 'Your storefront is live. Keep listings and stock current so buyers can order with confidence.'
              : 'Set up your storefront to start publishing products.'}
          </p>
        </div>
        {!storefront && <Link className="button button-primary" to="/seller/storefront">Set up storefront</Link>}
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Orders to action</span>
          <strong>{orders.data?.actionRequired ?? 0}</strong>
          <Link className="text-link" to="/seller/orders">Review orders</Link>
        </article>
        <article className="stat-card">
          <span>Delivered sales</span>
          <strong>{formatTzs(orders.data?.deliveredSalesTzs ?? 0)}</strong>
          <span className="muted">Completed orders only</span>
        </article>
        <article className="stat-card">
          <span>Approved products</span>
          <strong>{catalogue.data?.APPROVED ?? 0}</strong>
          <Link className="text-link" to="/seller/products">Manage products</Link>
        </article>
        <article className="stat-card">
          <span>Stock alerts</span>
          <strong>
            {(inventory.data?.summary.lowStockProducts ?? 0) + (inventory.data?.summary.outOfStockProducts ?? 0)}
          </strong>
          <Link className="text-link" to="/seller/inventory">Review inventory</Link>
        </article>
      </div>

      <div className="account-grid">
        <article className="account-card">
          <h2>Order pipeline</h2>
          <dl className="detail-list">
            {Object.entries(orders.data?.counts ?? {}).map(([status, count]) => (
              <div className="summary-row" key={status}>
                <dt>{status.charAt(0) + status.slice(1).toLowerCase()}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="account-card">
          <h2>Product status</h2>
          <dl className="detail-list">
            {Object.entries(catalogue.data ?? {}).map(([status, count]) => (
              <div className="summary-row" key={status}>
                <dt>{status.charAt(0).toUpperCase() + status.slice(1)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <Link className="button button-primary" to="/seller/products/new">Add a product</Link>
        </article>
      </div>
    </div>
  );
}
