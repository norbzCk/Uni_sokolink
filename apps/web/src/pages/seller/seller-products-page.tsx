import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { Product } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatTzs, statusTone } from '../../lib/format';
import { useApi } from '../../lib/use-api';

export function SellerProductsPage() {
  const { authRequest } = useAuth();
  const products = useApi(() => authRequest<{ items: Product[] }>('/catalogue/seller/products'), []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(product: Product, action: 'submit' | 'archive' | 'restore') {
    setBusy(product.id + action);
    setError(null);
    try {
      await authRequest('/catalogue/seller/products/' + product.id + '/' + action, { method: 'POST' });
      const next = await authRequest<{ items: Product[] }>('/catalogue/seller/products');
      products.setData(next);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The product could not be updated.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">CATALOGUE</p>
          <h1>Products</h1>
          <p className="muted">Draft, submit for review, and manage stock from one place.</p>
        </div>
        <Link className="button button-primary" to="/seller/products/new">Add product</Link>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {products.loading ? (
        <LoadingState label="Loading products" />
      ) : products.error ? (
        <ErrorState message={products.error} />
      ) : products.data && products.data.items.length > 0 ? (
        <div className="seller-product-list">
          {products.data.items.map((product) => (
            <article className="seller-product-row" key={product.id}>
              <div className="cart-thumb">
                {product.images[0] ? (
                  <img src={resolveMediaUrl(product.images[0].url) ?? ''} alt={product.name} />
                ) : (
                  <span className="product-placeholder" aria-hidden="true">{product.name.slice(0, 1)}</span>
                )}
              </div>
              <div className="seller-product-info">
                <Link to={'/seller/products/' + product.id}><strong>{product.name}</strong></Link>
                <span className="muted">{product.category.name} · {formatTzs(product.priceTzs)}</span>
                {product.stock && (
                  <span className="muted">{product.stock.available} available · {product.stock.onHand} on hand</span>
                )}
                {product.rejectionReason && <span className="field-error">{product.rejectionReason}</span>}
              </div>
              <span className={'badge ' + statusTone(product.status)}>{product.status}</span>
              <div className="row-actions">
                <Link className="button button-outline button-small" to={'/seller/products/' + product.id}>Edit</Link>
                {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                  <button className="button button-primary button-small" type="button" disabled={busy === product.id + 'submit'} onClick={() => act(product, 'submit')}>
                    Submit
                  </button>
                )}
                {product.status !== 'ARCHIVED' && (
                  <button className="button button-outline button-small" type="button" disabled={busy === product.id + 'archive'} onClick={() => act(product, 'archive')}>
                    Archive
                  </button>
                )}
                {product.status === 'ARCHIVED' && (
                  <button className="button button-outline button-small" type="button" disabled={busy === product.id + 'restore'} onClick={() => act(product, 'restore')}>
                    Restore
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No products yet.</h2>
          <p className="muted">Create a draft, add photos and stock, then submit it for review.</p>
          <Link className="button button-primary" to="/seller/products/new">Create your first product</Link>
        </div>
      )}
    </div>
  );
}
