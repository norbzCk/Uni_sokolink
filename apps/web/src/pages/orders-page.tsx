import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Search } from 'lucide-react';
import { resolveMediaUrl } from '../api/client';
import { useAuth } from '../auth/auth-context';
import type { Order } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { formatDate, formatTzs, ORDER_STATUS_LABELS, statusTone } from '../lib/format';
import { useApi } from '../lib/use-api';

const FILTERS = [
  { key: 'all', label: 'All orders' },
  { key: 'active', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function matches(order: Order, filter: FilterKey) {
  if (filter === 'active') return order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
  if (filter === 'delivered') return order.status === 'DELIVERED';
  if (filter === 'cancelled') return order.status === 'CANCELLED';
  return true;
}

export function OrdersPage() {
  const { authRequest } = useAuth();
  const orders = useApi(() => authRequest<Order[]>('/orders'), []);
  const [filter, setFilter] = useState<FilterKey>('all');

  const visible = (orders.data ?? []).filter((order) => matches(order, filter));

  return (
    <section className="page-wrap orders-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ORDERS</p>
          <h1>Orders and deliveries</h1>
          <p className="muted">Track each seller's progress on your orders.</p>
        </div>
        <Link className="text-link" to="/search">Continue shopping</Link>
      </div>

      <div className="order-tabs" role="tablist" aria-label="Filter orders">
        {FILTERS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={filter === entry.key}
            className={filter === entry.key ? 'active' : undefined}
            onClick={() => setFilter(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {orders.loading ? (
        <LoadingState label="Loading orders" />
      ) : orders.error ? (
        <ErrorState message={orders.error} />
      ) : visible.length > 0 ? (
        <div className="order-list">
          {visible.map((order) => {
            const items = order.sellerOrders.flatMap((sellerOrder) => sellerOrder.items);
            return (
              <Link className="order-card" key={order.id} to={'/orders/' + order.id}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span className="muted">{formatDate(order.createdAt)} · {order.sellerOrders.length} {order.sellerOrders.length === 1 ? 'seller' : 'sellers'}</span>
                  <span className={'badge ' + statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</span>
                </div>
                <div className="order-card-mid">
                  <div className="order-card-thumbs">
                    {items.slice(0, 3).map((item) => (
                      <span className="cart-thumb small" key={item.id}>
                        {item.imageUrl ? (
                          <img src={resolveMediaUrl(item.imageUrl) ?? ''} alt={item.productName} />
                        ) : (
                          <Package size={16} aria-hidden="true" />
                        )}
                      </span>
                    ))}
                    {items.length > 3 && <span className="order-more">+{items.length - 3}</span>}
                  </div>
                  <span className="muted">
                    {items.slice(0, 2).map((item) => item.productName).join(', ')}
                    {items.length > 2 ? ' and more' : ''}
                  </span>
                </div>
                <div className="order-card-total">
                  <strong>{formatTzs(order.totalTzs)}</strong>
                  <span className="text-link">View details <ChevronRight size={13} /></span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-panel">
          <Search size={26} strokeWidth={1.6} aria-hidden="true" />
          <h2>{filter === 'all' ? 'No orders yet.' : 'No orders in this view.'}</h2>
          <p className="muted">
            {filter === 'all'
              ? 'Your placed orders will appear here.'
              : 'Try another filter to see your other orders.'}
          </p>
          <Link className="button button-primary" to="/search">Start shopping</Link>
        </div>
      )}
    </section>
  );
}
