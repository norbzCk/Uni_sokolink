import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import type { Order, Payment } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { Alert } from '../components/alert';
import { ErrorState, LoadingState } from '../components/async-state';
import {
  deliveryMethodLabel,
  formatDateTime,
  formatTzs,
  ORDER_STATUS_LABELS,
  statusTone,
} from '../lib/format';
import { useApi } from '../lib/use-api';

const STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { authRequest } = useAuth();
  const location = useLocation();
  const justPlaced = Boolean((location.state as { placed?: boolean } | null)?.placed);
  const order = useApi(() => authRequest<Order>('/orders/' + encodeURIComponent(id)), [id]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentError, setPaymentError] = useState(false);

  useEffect(() => {
    if (!id) return;
    authRequest<Payment>('/payment/payments/' + encodeURIComponent(id))
      .then((result) => {
        setPayment(result);
        setPaymentError(false);
      })
      .catch(() => setPaymentError(true));
  }, [authRequest, id]);

  if (order.loading) return <section className="page-wrap"><LoadingState label="Loading order" /></section>;
  if (order.error || !order.data) {
    return (
      <section className="page-wrap">
        <ErrorState message={order.error ?? 'Order not found.'} />
        <Link className="text-link" to="/orders">Back to your orders</Link>
      </section>
    );
  }

  const current = order.data;
  return (
    <section className="page-wrap order-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders">Your orders</Link>
        <span aria-hidden="true">/</span>
        <span>{current.orderNumber}</span>
      </nav>

      {justPlaced && (
        <Alert tone="success">
          Order placed. Each seller has received their part of the order. Payment is pending and will be settled using {current.paymentMethodName.toLowerCase()}.
        </Alert>
      )}

      <div className="page-heading">
        <div>
          <p className="eyebrow">ORDER {current.orderNumber}</p>
          <h1>{formatTzs(current.totalTzs)}</h1>
          <p className="muted">Placed {formatDateTime(current.createdAt)} · {current.sellerOrders.length} {current.sellerOrders.length === 1 ? 'seller' : 'sellers'}</p>
        </div>
        <div className="order-heading-badges">
          <span className={'badge ' + statusTone(current.status)}>{ORDER_STATUS_LABELS[current.status]}</span>
          <span className={'badge ' + statusTone(current.paymentStatus)}>Payment {current.paymentStatus.toLowerCase()}</span>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="order-main">
          {current.sellerOrders.map((sellerOrder) => {
            const stepIndex = STEPS.indexOf(sellerOrder.status);
            return (
              <article className="account-card" key={sellerOrder.id}>
                <div className="seller-order-heading">
                  <div>
                    <p className="eyebrow">SOLD BY</p>
                    <h2>{sellerOrder.sellerName}</h2>
                    <Link className="text-link" to={'/search?sellerId=' + encodeURIComponent(sellerOrder.sellerId)}>Visit shop</Link>
                  </div>
                  <span className={'badge ' + statusTone(sellerOrder.status)}>
                    {ORDER_STATUS_LABELS[sellerOrder.status]}
                  </span>
                </div>
                {sellerOrder.status !== 'CANCELLED' && (
                  <ol className="status-steps">
                    {STEPS.map((step, index) => (
                      <li
                        key={step}
                        className={index <= stepIndex ? 'complete' : undefined}
                        aria-current={index === stepIndex ? 'step' : undefined}
                      >
                        <span>{index + 1}</span>
                        {ORDER_STATUS_LABELS[step]}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="order-items">
                  {sellerOrder.items.map((item) => (
                    <div className="order-item" key={item.id}>
                      <div className="cart-thumb small">
                        {item.imageUrl ? (
                          <img src={resolveMediaUrl(item.imageUrl) ?? ''} alt={item.productName} />
                        ) : (
                          <span className="product-placeholder" aria-hidden="true">{item.productName.slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <Link to={'/p/' + item.productSlug}><strong>{item.productName}</strong></Link>
                        <span className="muted">{item.quantity} × {formatTzs(item.unitPriceTzs)} per {item.unit}</span>
                      </div>
                      <strong>{formatTzs(item.lineTotalTzs)}</strong>
                    </div>
                  ))}
                </div>
                <div className="summary-row total">
                  <span>Seller subtotal</span>
                  <strong>{formatTzs(sellerOrder.subtotalTzs)}</strong>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="order-side">
          <article className="account-card">
            <h2>Delivery details</h2>
            <dl className="detail-list">
              <div><dt>Method</dt><dd>{deliveryMethodLabel(current.deliveryMethod)}</dd></div>
              <div><dt>Contact</dt><dd>{current.contactName} · {current.contactPhone}</dd></div>
              {current.deliveryMethod !== 'PICKUP' && (
                <div>
                  <dt>Address</dt>
                  <dd>{[current.addressLine, current.district, current.region].filter(Boolean).join(', ')}</dd>
                </div>
              )}
              {current.landmark && <div><dt>Landmark</dt><dd>{current.landmark}</dd></div>}
              {current.notes && <div><dt>Notes</dt><dd>{current.notes}</dd></div>}
            </dl>
          </article>

          <article className="account-card">
            <h2>Payment</h2>
            <p><strong>{current.paymentMethodName}</strong></p>
            <p className="muted">
              {payment?.instructions ?? 'SokoLink records this payment and settles with the seller after fulfilment.'}
            </p>
            {paymentError && <p className="field-error">Payment details could not be loaded.</p>}
            <div className="summary-row"><span>Status</span><span className={'badge ' + statusTone(current.paymentStatus)}>{current.paymentStatus}</span></div>
            <div className="summary-row"><span>Subtotal</span><span>{formatTzs(current.subtotalTzs)}</span></div>
            <div className="summary-row"><span>Delivery fee</span><span>{formatTzs(current.deliveryFeeTzs)}</span></div>
            <div className="summary-row total"><span>Total</span><strong>{formatTzs(current.totalTzs)}</strong></div>
            <Link className="button button-outline full-width" to={'/payment/' + current.id}>Payment details</Link>
          </article>

          <Link className="button button-outline full-width" to="/search">Continue shopping</Link>
          <Link className="text-link" to="/help">Need help with this order?</Link>
        </aside>
      </div>
    </section>
  );
}
