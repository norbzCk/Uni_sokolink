import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, ApiError } from '../api/client';
import type { CheckoutInput, Order, PaymentMethod } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { useCart } from '../cart/cart-context';
import { Alert } from '../components/alert';
import { LoadingState } from '../components/async-state';
import { FormField } from '../components/form-field';
import { formatTzs } from '../lib/format';

const REGIONS = [
  'Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Mbeya', 'Tanga', 'Morogoro',
  'Kilimanjaro', 'Zanzibar Urban/West', 'Pemba North', 'Other',
];

export function CheckoutPage() {
  const { user, authRequest } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [region, setRegion] = useState('Dar es Salaam');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodCode, setPaymentMethodCode] = useState('');
  const [idempotencyKey] = useState(() => {
    try {
      return crypto.randomUUID();
    } catch {
      return 'checkout-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    apiRequest<PaymentMethod[]>('/payment/methods')
      .then((items) => {
        setMethods(items);
        setPaymentMethodCode((current) => current || items[0]?.code || '');
      })
      .catch(() => setError('Payment methods could not be loaded. Refresh the page to try again.'))
      .finally(() => setLoadingMethods(false));
  }, []);

  if (cart.items.length === 0) {
    return (
      <section className="page-wrap narrow-page">
        <h1>Your cart is empty.</h1>
        <p className="muted">Add products before checking out.</p>
        <Link className="button button-primary" to="/products">Browse products</Link>
      </section>
    );
  }

  const selectedMethod = methods.find((method) => method.code === paymentMethodCode);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    if (!paymentMethodCode) {
      setError('Choose a payment method.');
      return;
    }
    if (deliveryMethod === 'DELIVERY' && (!region || !district.trim() || !addressLine.trim())) {
      setError('Enter the region, district and delivery address for a delivery order.');
      return;
    }
    setPending(true);
    const input: CheckoutInput = {
      items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      deliveryMethod,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      paymentMethodCode,
      idempotencyKey,
      ...(deliveryMethod === 'DELIVERY'
        ? { region, district: district.trim(), addressLine: addressLine.trim() }
        : {}),
      ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    try {
      const order = await authRequest<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      cart.clear();
      navigate('/orders/' + order.id, { state: { placed: true } });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors ?? []);
      } else {
        setError('Checkout could not be completed. Try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="page-wrap checkout-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHECKOUT</p>
          <h1>Complete your order</h1>
        </div>
        <Link className="text-link" to="/cart">Back to cart</Link>
      </div>

      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-main">
          {error && (
            <Alert tone="error">
              {error}
              {fieldErrors.length > 0 && (
                <ul className="alert-list">
                  {fieldErrors.map((entry) => <li key={entry}>{entry}</li>)}
                </ul>
              )}
            </Alert>
          )}

          <article className="account-card">
            <h2>Delivery or pickup</h2>
            <div className="segmented">
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DELIVERY"
                  checked={deliveryMethod === 'DELIVERY'}
                  onChange={() => setDeliveryMethod('DELIVERY')}
                />
                <span>Deliver to me</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP"
                  checked={deliveryMethod === 'PICKUP'}
                  onChange={() => setDeliveryMethod('PICKUP')}
                />
                <span>Pick up from seller</span>
              </label>
            </div>

            <div className="form-grid">
              <FormField
                label="Contact name"
                name="contactName"
                autoComplete="name"
                required
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
              />
              <FormField
                label="Phone number"
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                placeholder="+255712345678"
                required
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
              {deliveryMethod === 'DELIVERY' && (
                <>
                  <label className="field">
                    <span>Region</span>
                    <select value={region} onChange={(event) => setRegion(event.target.value)} required>
                      {REGIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                  <FormField
                    label="District"
                    name="district"
                    required
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  />
                  <FormField
                    label="Delivery address"
                    name="addressLine"
                    required
                    placeholder="Street, area or campus"
                    value={addressLine}
                    onChange={(event) => setAddressLine(event.target.value)}
                  />
                  <FormField
                    label="Landmark (optional)"
                    name="landmark"
                    value={landmark}
                    onChange={(event) => setLandmark(event.target.value)}
                  />
                </>
              )}
            </div>
            <label className="field">
              <span>Notes for the seller (optional)</span>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </article>

          <article className="account-card">
            <h2>Payment method</h2>
            <p className="muted">Only methods the seller can currently honour are shown.</p>
            {loadingMethods ? (
              <LoadingState label="Loading payment methods" />
            ) : (
              <div className="payment-methods">
                {methods.map((method) => (
                  <label className={'payment-method' + (paymentMethodCode === method.code ? ' selected' : '')} key={method.code}>
                    <input
                      type="radio"
                      name="paymentMethodCode"
                      value={method.code}
                      checked={paymentMethodCode === method.code}
                      onChange={() => setPaymentMethodCode(method.code)}
                    />
                    <span>
                      <strong>{method.name}</strong>
                      <span className="muted">{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedMethod?.instructions && (
              <p className="payment-note">{selectedMethod.instructions}</p>
            )}
          </article>
        </div>

        <aside className="cart-summary">
          <h2>Your order</h2>
          <div className="checkout-lines">
            {cart.items.map((item) => (
              <div className="summary-row" key={item.productId}>
                <span>{item.quantity} × {item.name}</span>
                <span>{formatTzs(item.priceTzs * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <div className="summary-row"><span>Delivery</span><span className="muted">Confirmed with seller</span></div>
          <div className="summary-row total"><span>Total</span><strong>{formatTzs(cart.subtotalTzs)}</strong></div>
          <button className="button button-primary full-width" type="submit" disabled={pending || loadingMethods}>
            {pending ? 'Placing order…' : 'Place order'}
          </button>
          <p className="muted small-note">
            Your order is recorded as awaiting payment. Sellers confirm cash or pickup payment directly with you.
          </p>
        </aside>
      </form>
    </section>
  );
}
