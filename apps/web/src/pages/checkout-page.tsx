import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';
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

const MOBILE_MONEY_PAYMENT_CODES = ['MPESA', 'AIRTEL_MONEY', 'MIXX_BY_YAS'];

function allowedPaymentCodes(deliveryMethod: 'SELLER_DELIVERY' | 'PICKUP'): Set<string> {
  return new Set(
    deliveryMethod === 'PICKUP'
      ? ['PAY_ON_PICKUP', ...MOBILE_MONEY_PAYMENT_CODES]
      : ['CASH_ON_DELIVERY', ...MOBILE_MONEY_PAYMENT_CODES],
  );
}

export function CheckoutPage() {
  const { user, authRequest } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'SELLER_DELIVERY' | 'PICKUP'>('SELLER_DELIVERY');
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

  useEffect(() => {
    const allowed = allowedPaymentCodes(deliveryMethod);
    if (methods.length === 0 || allowed.has(paymentMethodCode)) return;
    const replacement = methods.find((method) => allowed.has(method.code));
    if (replacement) setPaymentMethodCode(replacement.code);
  }, [deliveryMethod, methods, paymentMethodCode]);

  if (cart.items.length === 0) {
    return (
      <section className="page-wrap narrow-page">
        <h1>Your cart is empty.</h1>
        <p className="muted">Add products before checking out.</p>
        <Link className="button button-primary" to="/search">Browse products</Link>
      </section>
    );
  }

  const visibleMethods = methods.filter((method) =>
    allowedPaymentCodes(deliveryMethod).has(method.code),
  );
  const selectedMethod = visibleMethods.find((method) => method.code === paymentMethodCode);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    if (!paymentMethodCode) {
      setError('Choose a payment method.');
      return;
    }
    if (!allowedPaymentCodes(deliveryMethod).has(paymentMethodCode)) {
      setError(
        deliveryMethod === 'PICKUP'
          ? 'Choose a payment method available for campus pickup.'
          : 'Choose a payment method available for seller-arranged delivery.',
      );
      return;
    }
    if (deliveryMethod === 'SELLER_DELIVERY' && (!region || !district.trim() || !addressLine.trim())) {
      setError('Enter the region, district and delivery address for a seller-delivered order.');
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
      ...(deliveryMethod === 'SELLER_DELIVERY'
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
          <p className="muted">Choose campus pickup or seller-arranged delivery, then how you will pay.</p>
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

          <article className="checkout-step">
            <header className="checkout-step-head">
              <span className="checkout-step-icon"><Truck size={18} /></span>
              <div>
                <p className="eyebrow">STEP 1</p>
                <h2>Delivery or pickup</h2>
              </div>
            </header>
            <div className="checkout-step-body">
              <div className="segmented">
                <label>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="SELLER_DELIVERY"
                    checked={deliveryMethod === 'SELLER_DELIVERY'}
                    onChange={() => setDeliveryMethod('SELLER_DELIVERY')}
                  />
                  <Truck size={16} />
                  <span>Seller-arranged delivery</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="PICKUP"
                    checked={deliveryMethod === 'PICKUP'}
                    onChange={() => setDeliveryMethod('PICKUP')}
                  />
                  <Store size={16} />
                  <span>Campus pickup</span>
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
                {deliveryMethod === 'SELLER_DELIVERY' && (
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
            </div>
          </article>

          <article className="checkout-step">
            <header className="checkout-step-head">
              <span className="checkout-step-icon"><CreditCard size={18} /></span>
              <div>
                <p className="eyebrow">STEP 2</p>
                <h2>Payment method</h2>
              </div>
            </header>
            <div className="checkout-step-body">
              <p className="muted">
                Only cash and approved mobile money methods are shown. SokoLink settles with sellers
                after fulfilment.
              </p>
              {loadingMethods ? (
                <LoadingState label="Loading payment methods" />
              ) : visibleMethods.length === 0 ? (
                <p className="muted">No compatible payment methods are currently configured.</p>
              ) : (
                <div className="payment-methods">
                  {visibleMethods.map((method) => (
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
                <p className="payment-note"><MapPin size={14} /> {selectedMethod.instructions}</p>
              )}
            </div>
          </article>

          <article className="checkout-step">
            <header className="checkout-step-head">
              <span className="checkout-step-icon"><ShoppingBag size={18} /></span>
              <div>
                <p className="eyebrow">STEP 3</p>
                <h2>Review your items</h2>
              </div>
            </header>
            <div className="checkout-step-body">
              <div className="checkout-lines">
                {cart.items.map((item) => (
                  <div className="summary-row" key={item.productId}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>{formatTzs(item.priceTzs * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
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
          <p className="secure-note"><ShieldCheck size={14} /> SokoLink records your payment and settles with the seller after fulfilment. For cash orders the seller confirms payment on handover.</p>
        </aside>
      </form>
    </section>
  );
}
