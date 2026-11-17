import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { OrderStatus, SellerOrder } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatDateTime, formatTzs, ORDER_STATUS_LABELS, statusTone } from '../../lib/format';
import { useApi } from '../../lib/use-api';
import { NEXT_ACTIONS } from './seller-orders-page';

export function SellerOrderDetailPage() {
  const { id = '' } = useParams();
  const { authRequest } = useAuth();
  const order = useApi(
    () => authRequest<SellerOrder>('/orders/seller/' + encodeURIComponent(id)),
    [id],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  async function advance(status: OrderStatus) {
    setBusy(status);
    setError(null);
    try {
      const updated = await authRequest<SellerOrder>('/orders/seller/' + encodeURIComponent(id) + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      order.setData(updated);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The order could not be updated.');
    } finally {
      setBusy(null);
    }
  }

  if (order.loading) return <LoadingState label="Loading order" />;
  if (order.error || !order.data) return <ErrorState message={order.error ?? 'Order not found.'} />;

  const current = order.data;
  return (
    <div>
      <nav className="breadcrumb workspace-breadcrumb" aria-label="Breadcrumb">
        <Link to="/seller/orders">Seller orders</Link>
        <span aria-hidden="true">/</span>
        <span>{current.order?.orderNumber ?? current.id}</span>
      </nav>

      <div className="workspace-heading">
        <div>
          <p className="eyebrow">SELLER ORDER</p>
          <h1>{current.order?.orderNumber}</h1>
          <p className="muted">
            Placed {formatDateTime(current.createdAt)} · {formatTzs(current.subtotalTzs)} for your items
          </p>
        </div>
        <span className={'badge ' + statusTone(current.status)}>{ORDER_STATUS_LABELS[current.status]}</span>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="account-grid">
        <article className="account-card">
          <h2>Items</h2>
          <div className="order-items">
            {current.items.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="cart-thumb small">
                  {item.imageUrl ? (
                    <img src={resolveMediaUrl(item.imageUrl) ?? ''} alt={item.productName} />
                  ) : (
                    <span className="product-placeholder" aria-hidden="true">{item.productName.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <strong>{item.productName}</strong>
                  <span className="muted">{item.quantity} × {formatTzs(item.unitPriceTzs)} per {item.unit}</span>
                </div>
                <strong>{formatTzs(item.lineTotalTzs)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row total">
            <span>Your subtotal</span>
            <strong>{formatTzs(current.subtotalTzs)}</strong>
          </div>
        </article>

        <div>
          <article className="account-card">
            <h2>Buyer and delivery</h2>
            <dl className="detail-list">
              <div><dt>Contact</dt><dd>{current.order?.contactName} · {current.order?.contactPhone}</dd></div>
              <div>
                <dt>Method</dt>
                <dd>{current.order?.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</dd>
              </div>
              {current.order?.deliveryMethod === 'DELIVERY' && (
                <div>
                  <dt>Address</dt>
                  <dd>
                    {[current.order.addressLine, current.order.district, current.order.region]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
              )}
              {current.order?.landmark && <div><dt>Landmark</dt><dd>{current.order.landmark}</dd></div>}
              {current.order?.notes && <div><dt>Notes</dt><dd>{current.order.notes}</dd></div>}
            </dl>
          </article>

          <article className="account-card">
            <h2>Payment</h2>
            <p><strong>{current.order?.paymentMethodName}</strong></p>
            <div className="summary-row">
              <span>Status</span>
              <span className={'badge ' + statusTone(current.order?.paymentStatus ?? 'PENDING')}>
                {current.order?.paymentStatus}
              </span>
            </div>
            <div className="summary-row total">
              <span>Order total</span>
              <strong>{formatTzs(current.order?.totalTzs ?? current.subtotalTzs)}</strong>
            </div>
          </article>

          {(NEXT_ACTIONS[current.status] ?? []).length > 0 && (
            <div className="row-actions">
              {(NEXT_ACTIONS[current.status] ?? []).map((action) => (
                <button
                  className={'button ' + action.tone}
                  key={action.status}
                  type="button"
                  disabled={busy === action.status}
                  onClick={() => advance(action.status)}
                >
                  {busy === action.status ? 'Updating…' : action.label}
                </button>
              ))}
            </div>
          )}
          <Link className="text-link" to="/seller/orders">Back to all orders</Link>
        </div>
      </div>
    </div>
  );
}
