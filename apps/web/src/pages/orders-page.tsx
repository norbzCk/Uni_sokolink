import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import type { Order } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { formatDate, formatTzs, ORDER_STATUS_LABELS, statusTone } from '../lib/format';
import { useApi } from '../lib/use-api';

export function OrdersPage() {
  const { authRequest } = useAuth();
  const orders = useApi(() => authRequest<Order[]>('/orders'), []);

  return (
    <section className="page-wrap orders-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ORDERS</p>
          <h1>Orders and deliveries</h1>
          <p className="muted">Track each seller's progress on your orders.</p>
        </div>
        <Link className="text-link" to="/products">Continue shopping</Link>
      </div>

      {orders.loading ? (
        <LoadingState label="Loading orders" />
      ) : orders.error ? (
        <ErrorState message={orders.error} />
      ) : orders.data && orders.data.length > 0 ? (
        <div className="order-list">
          {orders.data.map((order) => (
            <Link className="order-card" key={order.id} to={'/orders/' + order.id}>
              <div>
                <strong>{order.orderNumber}</strong>
                <span className="muted">{formatDate(order.createdAt)} · {order.sellerOrders.length} {order.sellerOrders.length === 1 ? 'seller' : 'sellers'}</span>
              </div>
              <div className="order-card-mid">
                {order.sellerOrders.map((sellerOrder) => (
                  <span className={'badge ' + statusTone(sellerOrder.status)} key={sellerOrder.id}>
                    {sellerOrder.sellerName}: {ORDER_STATUS_LABELS[sellerOrder.status]}
                  </span>
                ))}
              </div>
              <strong>{formatTzs(order.totalTzs)}</strong>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No orders yet.</h2>
          <p className="muted">Your placed orders will appear here.</p>
          <Link className="button button-primary" to="/products">Start shopping</Link>
        </div>
      )}
    </section>
  );
}
