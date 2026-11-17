import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, CalendarDays, MapPin, Package, Store } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../api/client';
import type { ProductList, Storefront } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { ProductCard } from '../components/product-card';
import { useApi } from '../lib/use-api';

interface StorefrontPayload {
  storefront: Storefront;
  products: ProductList;
}

export function StorefrontPage() {
  const { slug = '' } = useParams();
  const data = useApi<StorefrontPayload>(async () => {
    const storefront = await apiRequest<Storefront>('/seller/storefronts/' + encodeURIComponent(slug));
    const products = await apiRequest<ProductList>(
      '/catalogue/products?sellerId=' + encodeURIComponent(storefront.userId ?? '') + '&pageSize=48',
    );
    return { storefront, products };
  }, [slug]);

  if (data.loading) return <section className="page-wrap"><LoadingState label="Loading storefront" /></section>;
  if (data.error || !data.data) {
    return (
      <section className="page-wrap">
        <ErrorState message={data.error ?? 'Storefront not found.'} />
        <Link className="text-link" to="/search">Back to the marketplace</Link>
      </section>
    );
  }

  const { storefront, products } = data.data;
  const logo = resolveMediaUrl(storefront.logoUrl);

  return (
    <section className="page-wrap storefront-page">
      <div className="storefront-banner" aria-hidden="true" />
      <header className="storefront-header">
        {logo ? (
          <img className="storefront-logo" src={logo} alt={storefront.businessName} />
        ) : (
          <span className="storefront-logo placeholder" aria-hidden="true">{storefront.businessName.slice(0, 1)}</span>
        )}
        <div>
          <p className="eyebrow">SELLER STOREFRONT</p>
          <h1>{storefront.businessName}</h1>
          <div className="store-meta">
            {storefront.verified && <span className="badge badge-verified"><BadgeCheck size={12} /> Verified seller</span>}
            <span><Store size={13} /> {storefront.businessCategory}</span>
            <span><MapPin size={13} /> {storefront.district}, {storefront.region}</span>
            <span><Package size={13} /> {products.total} {products.total === 1 ? 'product' : 'products'}</span>
            <span><CalendarDays size={13} /> Joined {new Date(storefront.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="store-actions">
          <Link className="button button-outline" to="/contact">Contact seller</Link>
        </div>
      </header>

      {storefront.status === 'PAUSED' && (
        <p className="store-paused">This storefront is temporarily paused. Products may not be available for checkout.</p>
      )}

      <div className="store-tabs">
        <a className="active" href="#products">Products</a>
        <a href="#about">About the seller</a>
      </div>

      <div id="products">
        <div className="section-heading">
          <h2>All products</h2>
          <Link className="text-link" to="/search">Browse all products →</Link>
        </div>

        {products.items.length > 0 ? (
          <div className="product-grid">
            {products.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="empty-panel">
            <Package size={26} strokeWidth={1.6} aria-hidden="true" />
            <h2>No approved products yet.</h2>
            <p className="muted">This seller is still preparing their catalogue.</p>
          </div>
        )}
      </div>

      <article className="account-card store-about" id="about">
        <h2>About {storefront.businessName}</h2>
        <p className="muted">{storefront.description}</p>
        <dl className="detail-list">
          <div><dt>Business category</dt><dd>{storefront.businessCategory}</dd></div>
          <div><dt>Location</dt><dd>{storefront.district}, {storefront.region}</dd></div>
          <div><dt>Phone</dt><dd>{storefront.phone}</dd></div>
          {storefront.email && <div><dt>Email</dt><dd>{storefront.email}</dd></div>}
        </dl>
      </article>
    </section>
  );
}
