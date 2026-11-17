import { Link, useParams } from 'react-router-dom';
import { Banknote, CreditCard, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import type { Payment } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { ErrorState, LoadingState } from '../components/async-state';
import { formatDateTime, formatTzs, statusTone } from '../lib/format';
import { useApi } from '../lib/use-api';

function PaymentIcon({ kind }: { kind: string }) {
  if (kind === 'CASH') return <Banknote size={20} />;
  if (kind === 'MOBILE_MONEY') return <Smartphone size={20} />;
  if (kind === 'CARD') return <CreditCard size={20} />;
  return <Wallet size={20} />;
}

export function PaymentPage() {
  const { orderId = '' } = useParams();
  const { authRequest } = useAuth();
  const payment = useApi(
    () => authRequest<Payment>('/payment/payments/' + encodeURIComponent(orderId)),
    [orderId],
  );

  if (payment.loading) {
    return <section className="page-wrap narrow-page"><LoadingState label="Loading payment" /></section>;
  }
  if (payment.error || !payment.data) {
    return (
      <section className="page-wrap narrow-page">
        <ErrorState message={payment.error ?? 'Payment details not found.'} />
        <Link className="text-link" to={'/orders/' + orderId}>Back to order</Link>
      </section>
    );
  }

  const item = payment.data;

  return (
    <section className="page-wrap narrow-page">
      <div className="breadcrumb">
        <Link to="/orders">Orders</Link>
        <span aria-hidden="true">›</span>
        <Link to={'/orders/' + orderId}>Order</Link>
        <span aria-hidden="true">›</span>
        <span>Payment</span>
      </div>
      <div className="account-card payment-panel">
        <div className="payment-panel-head">
          <span className="payment-panel-icon">
            <PaymentIcon kind={item.methodCode.includes('cash') ? 'CASH' : 'MOBILE_MONEY'} />
          </span>
          <div>
            <p className="eyebrow">PAYMENT</p>
            <h1>{formatTzs(item.amountTzs)}</h1>
            <p className="muted">{item.methodName}</p>
          </div>
          <span className={'badge ' + statusTone(item.status)}>{item.status.toLowerCase()}</span>
        </div>
        {item.instructions ? <p className="payment-note">{item.instructions}</p> : null}
        <dl className="detail-list">
          <div><dt>Payment reference</dt><dd>{item.id}</dd></div>
          <div><dt>Order</dt><dd><Link className="text-link" to={'/orders/' + orderId}>{orderId}</Link></dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(item.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDateTime(item.updatedAt)}</dd></div>
        </dl>
        <div className="secure-note">
          <ShieldCheck size={15} />
          <span>
            <strong>Pay the seller directly</strong>
            Cash on delivery and pay-on-pickup are confirmed by the seller when you receive the order.
          </span>
        </div>
        <Link className="button button-primary" to={'/orders/' + orderId}>View order</Link>
      </div>
    </section>
  );
}
