import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, resolveMediaUrl } from '../api/client';
import type { Product } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { useCart } from '../cart/cart-context';
import { formatTzs } from '../lib/format';
import { useApi } from '../lib/use-api';

export function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const product = useApi(() => apiRequest<Product>('/catalogue/products/' + encodeURIComponent(slug)), [slug]);
  const related = useApi(
    () => apiRequest<Product[]>('/catalogue/products/' + encodeURIComponent(slug) + '/related'),
    [slug],
  );

  if (product.loading) return <section className="page-wrap"><LoadingState label="Loading product" /></section>;
  if (product.error || !product.data) {
    return (
      <section className="page-wrap">
        <ErrorState message={product.error ?? 'Product not found.'} />
        <Link className="text-link" to="/products">Back to the marketplace</Link>
      </section>
    );
  }

  const item = product.data;
  const available = item.stock?.available ?? 0;
  const images = item.images.length > 0 ? item.images : [];
  const active = images[activeImage];

  function addToCart(goToCart = false) {
    cart.add(item, quantity);
    if (goToCart) navigate('/cart');
  }

  return (
    <section className="page-wrap product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Marketplace</Link>
        <span aria-hidden="true">/</span>
        <Link to={'/products?category=' + item.category.slug}>{item.category.name}</Link>
      </nav>

      <div className="product-detail">
        <div className="product-gallery">
          <div className="product-main-image">
            {active ? (
              <img src={resolveMediaUrl(active.url) ?? ''} alt={active.alt} />
            ) : (
              <span className="product-placeholder large" aria-hidden="true">{item.name.slice(0, 1)}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-thumbs">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === activeImage ? 'thumb active' : 'thumb'}
                  onClick={() => setActiveImage(index)}
                  aria-label={'Show image ' + (index + 1)}
                >
                  <img src={resolveMediaUrl(image.url) ?? ''} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="eyebrow">{item.category.name}</p>
          <h1>{item.name}</h1>
          <p className="product-seller-line">
            Sold by <Link className="text-link" to={'/products?sellerId=' + item.seller.id}>{item.seller.name}</Link>
          </p>
          <p className="product-price">{formatTzs(item.priceTzs)} <span className="muted">per {item.unit}</span></p>
          <div className="product-meta-row">
            <span className={'badge ' + (available > 0 ? 'badge-success' : 'badge-danger')}>
              {available > 0 ? available + ' available' : 'Out of stock'}
            </span>
            <span className="badge badge-neutral">{item.condition.toLowerCase()}</span>
            {item.brand && <span className="badge badge-neutral">{item.brand}</span>}
          </div>

          <div className="purchase-panel">
            <label className="quantity-field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                max={Math.max(available, 1)}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, Math.max(available, 1))))
                }
              />
            </label>
            <button className="button button-primary" type="button" disabled={available <= 0} onClick={() => addToCart(false)}>
              Add to cart
            </button>
            <button className="button button-outline" type="button" disabled={available <= 0} onClick={() => addToCart(true)}>
              Buy now
            </button>
          </div>
          <p className="muted small-note">Checkout supports cash on delivery and pay on pickup. Online payment is not enabled yet.</p>

          <div className="product-description">
            <h2>About this product</h2>
            <p>{item.description}</p>
          </div>

          {item.specifications.length > 0 && (
            <div className="product-specs">
              <h2>Details</h2>
              <dl className="detail-list">
                {item.specifications.map((spec) => (
                  <div key={spec.name + spec.value}>
                    <dt>{spec.name}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
                {item.model && (
                  <div><dt>Model</dt><dd>{item.model}</dd></div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="home-section">
          <div className="section-heading">
            <h2>More in {item.category.name}</h2>
            <Link className="text-link" to={'/products?category=' + item.category.slug}>See all →</Link>
          </div>
          <div className="product-grid">
            {related.data.map((entry) => (
              <article className="product-card" key={entry.id}>
                <Link className="product-card-media" to={'/products/' + entry.slug}>
                  {entry.images[0] ? (
                    <img src={resolveMediaUrl(entry.images[0].url) ?? ''} alt={entry.images[0].alt} loading="lazy" />
                  ) : (
                    <span className="product-placeholder" aria-hidden="true">{entry.name.slice(0, 1)}</span>
                  )}
                </Link>
                <div className="product-card-body">
                  <h3><Link to={'/products/' + entry.slug}>{entry.name}</Link></h3>
                  <strong>{formatTzs(entry.priceTzs)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
