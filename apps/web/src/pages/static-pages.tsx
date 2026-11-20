import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MapPin, PackageCheck, ShieldCheck, Store, Truck, Wallet } from 'lucide-react';
import { apiRequest } from '../api/client';
import type { ProductList } from '../api/marketplace';
import { ErrorState } from '../components/async-state';
import { ProductCard } from '../components/product-card';
import { ProductGridSkeleton, SectionHeading } from '../components/ui/primitives';
import { useApi } from '../lib/use-api';

export function CategoryPage() {
  const { slug = '' } = useParams();
  return <Navigate to={'/search?category=' + encodeURIComponent(slug)} replace />;
}

export function DealsPage() {
  const products = useApi(
    () => apiRequest<ProductList>('/catalogue/products?sort=price_asc&pageSize=24'),
    [],
  );
  return (
    <section className="page-wrap explore-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <span>Today&apos;s Deals</span>
      </div>
      <SectionHeading
        eyebrow="TODAY'S DEALS"
        title="Popular picks at student-friendly prices"
        action={<Link className="text-link" to="/search">Browse everything →</Link>}
      />
      <p className="muted">Fresh listings from verified IFM sellers, sorted from the lowest price.</p>
      {products.loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.error ? (
        <ErrorState message={products.error} />
      ) : products.data && products.data.items.length > 0 ? (
        <div className="product-grid">
          {products.data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No deals yet.</h2>
          <p className="muted">Approved products will appear here as sellers list them.</p>
        </div>
      )}
    </section>
  );
}

export function HelpPage() {
  return (
    <section className="page-wrap info-page">
      <div className="info-hero">
        <p className="eyebrow">HELP CENTRE</p>
        <h1>How can we help?</h1>
        <p>Answers about orders, delivery, payments, returns and selling on SokoLink.</p>
      </div>
      <div className="account-grid">
        <article className="account-card" id="delivery">
          <Truck size={22} className="info-icon" />
          <h2>Delivery and pickup</h2>
          <p className="muted">
            Choose seller-arranged delivery or campus pickup. Delivery fees and pickup points are
            confirmed with the seller before fulfilment. Partner delivery is not available in the MVP.
          </p>
          <Link className="text-link" to="/campus">See campus pickup →</Link>
        </article>
        <article className="account-card" id="fees">
          <Wallet size={22} className="info-icon" />
          <h2>Fees and payments</h2>
          <p className="muted">
            SokoLink supports cash on delivery, pay on pickup and approved mobile money methods.
            SokoLink records payments and settles with sellers after fulfilment. Card and bank
            payments are not available in the MVP.
          </p>
        </article>
        <article className="account-card" id="refunds">
          <PackageCheck size={22} className="info-icon" />
          <h2>Returns and refunds</h2>
          <p className="muted">
            Contact the seller within 7 days of delivery if an item is damaged, incorrect or not as
            described. Keep the item and packaging until the issue is resolved.
          </p>
          <Link className="text-link" to="/policies/refunds">Read the refund policy →</Link>
        </article>
        <article className="account-card" id="selling">
          <Store size={22} className="info-icon" />
          <h2>Selling on SokoLink</h2>
          <p className="muted">
            IFM students can apply with their student evidence and storefront details. Approved
            sellers can list products, and every listing is reviewed before it appears in the
            marketplace.
          </p>
          <Link className="text-link" to="/sell">Start selling →</Link>
        </article>
      </div>
      <div className="info-grid">
        <article className="account-card">
          <h2>Track an order</h2>
          <p className="muted">Open your orders to see seller-level progress from placed to delivered.</p>
          <Link className="button button-outline" to="/orders">View orders</Link>
        </article>
        <article className="account-card">
          <h2>Contact support</h2>
          <p className="muted">Reach the SokoLink team for account, order or seller questions.</p>
          <Link className="button button-outline" to="/contact">Contact us</Link>
        </article>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <section className="page-wrap info-page">
      <div className="info-hero">
        <p className="eyebrow">ABOUT SOKOLINK</p>
        <h1>A marketplace built for student enterprise.</h1>
        <p>
          SokoLink connects IFM students who are building businesses with buyers who want useful
          products from their community.
        </p>
      </div>
      <div className="info-grid">
        <article className="account-card">
          <ShieldCheck size={22} className="info-icon" />
          <h2>Verified sellers</h2>
          <p className="muted">
            Seller applications are reviewed by the SokoLink team before a store can publish
            products.
          </p>
        </article>
        <article className="account-card">
          <MapPin size={22} className="info-icon" />
          <h2>Local by design</h2>
          <p className="muted">
            Delivery and pickup options are built around campus life and Dar es Salaam.
          </p>
        </article>
        <article className="account-card">
          <Store size={22} className="info-icon" />
          <h2>Room to grow</h2>
          <p className="muted">
            Sellers get stock tools, order management and a storefront they can share with buyers.
          </p>
        </article>
        <article className="account-card" id="impact">
          <PackageCheck size={22} className="info-icon" />
          <h2>Our impact</h2>
          <p className="muted">
            Every order supports an IFM student business. Shopping on campus keeps money within the
            community and gives student sellers a real market for their work.
          </p>
          <Link className="text-link" to="/sell">Sell on SokoLink →</Link>
        </article>
        <article className="account-card" id="careers">
          <ShieldCheck size={22} className="info-icon" />
          <h2>Careers</h2>
          <p className="muted">
            SokoLink is built with students. If you want to help shape campus commerce, reach out to
            the team and tell us what you would build.
          </p>
          <Link className="text-link" to="/contact">Get in touch →</Link>
        </article>
      </div>
    </section>
  );
}

export function PoliciesPage() {
  return (
    <section className="page-wrap info-page narrow-info">
      <p className="eyebrow">POLICIES</p>
      <h1>Marketplace policies</h1>
      <article className="account-card" id="refunds">
        <h2>Refunds and returns</h2>
        <p className="muted">
          Buyers should contact the seller within 7 days of delivery. Items must be unused and in
          their original packaging unless they arrived damaged or incorrect. SokoLink coordinates
          refunds with the seller and records the outcome against the original payment.
        </p>
      </article>
      <article className="account-card">
        <h2>Product listings</h2>
        <p className="muted">
          Sellers must describe items accurately, show real photos and keep stock up to date.
          Prohibited items and misleading listings are removed during moderation.
        </p>
      </article>
      <article className="account-card">
        <h2>Privacy</h2>
        <p className="muted">
          We use account and order information to operate the marketplace, support deliveries and
          keep buyers and sellers safe. Contact us to request account data or deletion.
        </p>
      </article>
    </section>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General question');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = [`From: ${name} <${email}>`, '', message].join('\n');
    window.location.href =
      'mailto:support@sokolink.local?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    setSent(true);
  }

  return (
    <section className="page-wrap info-page narrow-info">
      <p className="eyebrow">CONTACT</p>
      <h1>Talk to SokoLink</h1>
      <article className="account-card">
        <h2>Send us a message</h2>
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Your name</span>
            <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>Email address</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>What is this about?</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>General question</option>
              <option>Order or payment support</option>
              <option>Seller application</option>
              <option>Report a listing</option>
            </select>
          </label>
          <label className="field">
            <span>Message</span>
            <textarea rows={5} minLength={10} maxLength={2000} required value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button className="button button-primary" type="submit">Open email draft</button>
          {sent && <p className="muted small-note">Your email app should open with the message ready to send.</p>}
        </form>
      </article>
      <article className="account-card">
        <h2>Support</h2>
        <p className="muted">Email: <a className="text-link" href="mailto:support@sokolink.local">support@sokolink.local</a></p>
        <p className="muted">Phone: <a className="text-link" href="tel:+255700000000">+255 700 000 000</a></p>
        <p className="muted">Hours: Monday to Saturday, 08:00–18:00 EAT</p>
      </article>
      <article className="account-card">
        <h2>Visit us</h2>
        <p className="muted">IFM Campus, Dar es Salaam, Tanzania</p>
        <p className="muted">Campus pickup desk: Main campus, weekdays 09:00–17:00.</p>
      </article>
    </section>
  );
}

export function CampusPage() {
  return (
    <section className="page-wrap info-page">
      <div className="info-hero campus-hero">
        <p className="eyebrow">CAMPUS PICKUP</p>
        <h1>Collect your order between classes.</h1>
        <p>Choose pickup at checkout and arrange a collection time with the seller.</p>
        <Link className="button button-primary" to="/search">Start shopping</Link>
      </div>
      <div className="steps-grid">
        <article>
          <span className="step-number">01</span>
          <h3>Choose pickup</h3>
          <p>            Select “Campus pickup” at checkout instead of seller-arranged delivery.</p>
        </article>
        <article>
          <span className="step-number">02</span>
          <h3>Arrange a time</h3>
          <p>The seller confirms the pickup point and a time that works for both of you.</p>
        </article>
        <article>
          <span className="step-number">03</span>
          <h3>Collect and pay</h3>
          <p>Pay in cash when you collect, or use the method agreed with the seller.</p>
        </article>
      </div>
    </section>
  );
}
