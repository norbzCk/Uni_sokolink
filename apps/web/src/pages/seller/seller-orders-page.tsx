import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { OrderStatus, SellerOrder } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import {
  deliveryMethodLabel,
  formatDateTime,
  formatTzs,
  ORDER_STATUS_LABELS,
  statusTone,
} from '../../lib/format';
import { useApi } from '../../lib/use-api';

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All orders' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Preparing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const NEXT_ACTIONS: Partial<Record<OrderStatus, Array<{ status: OrderStatus; label: string; tone: string }>>> = {
  PLACED: [
    { status: 'CONFIRMED', label: 'Confirm order', tone: 'button-primary' },
    { status: 'CANCELLED', label: 'Cancel', tone: 'button-outline' },
  ],
  CONFIRMED: [
    { status: 'PROCESSING', label: 'Start preparing', tone: 'button-primary' },
    { status: 'CANCELLED', label: 'Cancel', tone: 'button-outline' },
  ],
  PROCESSING: [
    { status: 'SHIPPED', label: 'Mark shipped', tone: 'button-primary' },
    { status: 'CANCELLED', label: 'Cancel', tone: 'button-outline' },
  ],
  SHIPPED: [{ status: 'DELIVERED', label: 'Mark delivered', tone: 'button-primary' }],
};

export function SellerOrdersPage() {
  const { authRequest } = useAuth();
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const orders = useApi(
    () => authRequest<SellerOrder[]>('/orders/seller' + (filter ? '?status=' + filter : '')),
    [filter],
  );

  async function advance(order: SellerOrder, status: OrderStatus) {
    setBusy(order.id + status);
    setError(null);
    try {
      await authRequest('/orders/seller/' + order.id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const refreshed = await authRequest<SellerOrder[]>(
        '/orders/seller' + (filter ? '?status=' + filter : ''),
      );
      orders.setData(refreshed);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The order could not be updated.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">ORDERS</p>
          <h1>Fulfil orders</h1>
          <p className="muted">Confirm, prepare, ship and deliver each buyer order. Delivering commits reserved stock.</p>
        </div>
        <label className="inline-label">
          Show
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            {FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {orders.loading ? (
        <LoadingState label="Loading orders" />
      ) : orders.error ? (
        <ErrorState message={orders.error} />
      ) : orders.data && orders.data.length > 0 ? (
        <div className="seller-order-list">
          {orders.data.map((order) => (
            <article className="seller-order-card" key={order.id}>
              <div className="seller-order-top">
                <div>
                  <strong>{order.order?.orderNumber}</strong>
                  <span className="muted">{formatDateTime(order.createdAt)} · {formatTzs(order.subtotalTzs)}</span>
                </div>
                <span className={'badge ' + statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</span>
              </div>

              <div className="seller-order-body">
                <div>
                  <h3>Buyer</h3>
                  <p>{order.order?.contactName} · {order.order?.contactPhone}</p>
                  <p className="muted">
                    {deliveryMethodLabel(order.order?.deliveryMethod)}
                    {' · '}
                    {order.order?.deliveryMethod === 'PICKUP'
                      ? 'Arrange collection with the buyer'
                      : [order.order?.addressLine, order.order?.district, order.order?.region]
                          .filter(Boolean)
                          .join(', ')}
                  </p>
                  {order.order?.landmark && <p className="muted">Landmark: {order.order.landmark}</p>}
                  {order.order?.notes && <p className="muted">Notes: {order.order.notes}</p>}
                </div>
                <div>
                  <h3>Payment</h3>
                  <p>{order.order?.paymentMethodName}</p>
                  <span className={'badge ' + statusTone(order.order?.paymentStatus ?? 'PENDING')}>
                    {order.order?.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
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

              <div className="row-actions">
                <Link className="button button-outline button-small" to={'/seller/orders/' + order.id}>
                  View details
                </Link>
                {(NEXT_ACTIONS[order.status] ?? []).map((action) => (
                  <button
                    className={'button button-small ' + action.tone}
                    key={action.status}
                    type="button"
                    disabled={busy === order.id + action.status}
                    onClick={() => advance(order, action.status)}
                  >
                    {busy === order.id + action.status ? 'Updating…' : action.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No orders here yet.</h2>
          <p className="muted">Orders from buyers will appear as soon as they are placed.</p>
        </div>
      )}
    </div>
  );
}
