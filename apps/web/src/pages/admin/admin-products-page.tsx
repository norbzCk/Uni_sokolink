import { useState } from 'react';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { Product } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatTzs, statusTone } from '../../lib/format';
import { useApi } from '../../lib/use-api';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'ARCHIVED'];

export function AdminProductsPage() {
  const { authRequest } = useAuth();
  const [status, setStatus] = useState('PENDING');
  const products = useApi(
    () => authRequest<{ items: Product[] }>('/catalogue/admin/products?status=' + status),
    [status],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function refresh() {
    const result = await authRequest<{ items: Product[] }>('/catalogue/admin/products?status=' + status);
    products.setData(result);
  }

  async function approve(product: Product) {
    setBusy(product.id);
    setError(null);
    try {
      await authRequest('/catalogue/admin/products/' + product.id + '/approve', { method: 'POST' });
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The product could not be approved.');
    } finally {
      setBusy(null);
    }
  }

  async function reject(product: Product) {
    if (reason.trim().length < 3) {
      setError('Enter a rejection reason of at least 3 characters.');
      return;
    }
    setBusy(product.id);
    setError(null);
    try {
      await authRequest('/catalogue/admin/products/' + product.id + '/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRejecting(null);
      setReason('');
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The product could not be rejected.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">CATALOGUE MODERATION</p>
          <h1>Products</h1>
          <p className="muted">Approve listings that meet marketplace standards, or reject with a clear reason.</p>
        </div>
        <label className="inline-label">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {products.loading ? (
        <LoadingState label="Loading products" />
      ) : products.error ? (
        <ErrorState message={products.error} />
      ) : products.data && products.data.items.length > 0 ? (
        <div className="moderation-list">
          {products.data.items.map((product) => (
            <article className="moderation-card" key={product.id}>
              <div className="moderation-head">
                <div className="cart-thumb">
                  {product.images[0] ? (
                    <img src={resolveMediaUrl(product.images[0].url) ?? ''} alt={product.name} />
                  ) : (
                    <span className="product-placeholder" aria-hidden="true">{product.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="moderation-title">
                  <h2>{product.name}</h2>
                  <p className="muted">{product.seller.name} · {product.category.name} · {formatTzs(product.priceTzs)}</p>
                </div>
                <span className={'badge ' + statusTone(product.status)}>{product.status}</span>
              </div>
              <p>{product.description}</p>
              {product.rejectionReason && <Alert tone="error">{product.rejectionReason}</Alert>}
              {product.status === 'PENDING' && (
                <div className="moderation-actions">
                  <button className="button button-primary button-small" type="button" disabled={busy === product.id} onClick={() => approve(product)}>
                    Approve listing
                  </button>
                  <button
                    className="button button-outline button-small"
                    type="button"
                    onClick={() => {
                      setReason('');
                      setError(null);
                      setRejecting(product.id);
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
              {rejecting === product.id && (
                <div className="reject-form">
                  <label className="field">
                    <span>Reason for rejection</span>
                    <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
                  </label>
                  <div className="row-actions">
                    <button className="button button-primary button-small" type="button" disabled={busy === product.id} onClick={() => reject(product)}>
                      Confirm rejection
                    </button>
                    <button className="link-button" type="button" onClick={() => { setRejecting(null); setReason(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>Nothing in this queue.</h2>
          <p className="muted">Products with this status will appear here.</p>
        </div>
      )}
    </div>
  );
}
