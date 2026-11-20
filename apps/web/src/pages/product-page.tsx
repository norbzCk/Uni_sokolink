import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Heart,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../api/client';
import type { Product } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { ProductCard } from '../components/product-card';
import { PriceTag, RatingStars, VerifiedSeller } from '../components/ui/primitives';
import { useCart } from '../cart/cart-context';
import { formatTzs } from '../lib/format';
import { useApi } from '../lib/use-api';

const WISHLIST_KEY = 'sokolink.wishlist.v1';

function readWishlist(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareLabel, setShareLabel] = useState('Share');
  const product = useApi(() => apiRequest<Product>('/catalogue/products/' + encodeURIComponent(slug)), [slug]);
  const related = useApi(
    () => apiRequest<Product[]>('/catalogue/products/' + encodeURIComponent(slug) + '/related'),
    [slug],
  );
  const productId = product.data?.id;

  useEffect(() => {
    if (productId) setSaved(readWishlist().includes(productId));
  }, [productId]);

  if (product.loading) {
    return <section className="page-wrap"><LoadingState label="Loading product" /></section>;
  }
  if (product.error || !product.data) {
    return (
      <section className="page-wrap">
        <ErrorState message={product.error ?? 'Product not found.'} />
        <Link className="text-link" to="/search">Back to the marketplace</Link>
      </section>
    );
  }

  const item = product.data;
  const available = item.stock?.available ?? 0;
  const lowStock = available > 0 && available <= (item.stock?.lowStockThreshold ?? 3);
  const images = item.images;
  const active = images[activeImage];

  function addToCart(buyNow = false) {
    cart.add(item, quantity);
    if (buyNow) navigate('/checkout');
  }

  function toggleSaved() {
    const next = !saved;
    try {
      const updated = next
        ? [...new Set([...readWishlist(), item.id])]
        : readWishlist().filter((id) => id !== item.id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    } catch {
      setSaved(false);
      return;
    }
    setSaved(next);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel('Link copied');
        setTimeout(() => setShareLabel('Share'), 1800);
      }
    } catch {
      setShareLabel('Share');
    }
  }

  return (
    <section className="page-wrap product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to={'/c/' + item.category.slug}>{item.category.name}</Link>
        <span aria-hidden="true">›</span>
        <span>{item.name}</span>
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
          {images.length > 1 ? (
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
          ) : null}
        </div>

        <div className="product-info">
          <p className="eyebrow">{item.category.name}</p>
          <h1>{item.name}</h1>
          <div className="product-meta-row">
            <RatingStars />
            <span className="muted small-note">·</span>
            <Link className="text-link small-note" to={'/search?sellerId=' + item.seller.id}>
              Visit the {item.seller.name} store
            </Link>
          </div>
          <p className="product-seller-line">
            Sold by <Link className="text-link" to={'/search?sellerId=' + item.seller.id}>{item.seller.name}</Link>{' '}
            <VerifiedSeller compact />
          </p>
          <p className="product-price">
            <PriceTag amount={item.priceTzs} /> <span className="muted">per {item.unit}</span>
          </p>
          <div className="product-meta-row">
            <span className={'badge ' + (available > 0 ? 'badge-success' : 'badge-danger')}>
              {available > 0 ? available + ' in stock' : 'Out of stock'}
            </span>
            <span className="badge badge-neutral">{item.condition.toLowerCase()}</span>
            {item.brand ? <span className="badge badge-neutral">{item.brand}</span> : null}
            {lowStock ? <span className="badge badge-warning">Low stock</span> : null}
          </div>

          <div className="purchase-panel">
            <div className="qty-stepper" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(available, 1)}
                value={quantity}
                aria-label="Quantity"
                onChange={(event) =>
                  setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, Math.max(available, 1))))
                }
              />
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => Math.min(Math.max(available, 1), value + 1))}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              className="button button-primary"
              type="button"
              disabled={available <= 0}
              onClick={() => addToCart(false)}
            >
              Add to cart
            </button>
            <button
              className="button button-strong"
              type="button"
              disabled={available <= 0}
              onClick={() => addToCart(true)}
            >
              Buy now
            </button>
          </div>

          <div className="share-row">
            <button
              className="share-button"
              type="button"
              aria-pressed={saved}
              onClick={toggleSaved}
            >
              <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Add to wishlist'}
            </button>
            <button className="share-button" type="button" onClick={() => void share()}>
              <Share2 size={15} />
              {shareLabel}
            </button>
          </div>

          <div className="product-description">
            <h2>About this product</h2>
            <p>{item.description}</p>
          </div>

          {item.specifications.length > 0 ? (
            <div className="product-specs">
              <h2>Details</h2>
              <dl className="detail-list">
                {item.specifications.map((spec) => (
                  <div key={spec.name + spec.value}>
                    <dt>{spec.name}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
                {item.model ? <div><dt>Model</dt><dd>{item.model}</dd></div> : null}
              </dl>
            </div>
          ) : null}

          <div className="seller-card">
            <span className="store-avatar" aria-hidden="true">
              {item.seller.name.slice(0, 1)}
            </span>
            <div>
              <strong>{item.seller.name}</strong>
              <span><BadgeCheck size={12} /> IFM Verified Seller</span>
            </div>
            <Link className="button button-outline button-small" to={'/search?sellerId=' + item.seller.id}>
              <Store size={14} /> Visit store
            </Link>
          </div>
        </div>

        <aside className="buy-box">
          <PriceTag amount={item.priceTzs} />
          <p className="muted small-note" style={{ margin: 0 }}>
            or {formatTzs(item.priceTzs * quantity)} for {quantity} {item.unit}
            {quantity > 1 ? 's' : ''}
          </p>
          <div className="buy-box-meta">
            <span><Truck size={15} /> Delivery from TSh 3,000</span>
            <span><MapPin size={15} /> Campus pickup available</span>
            <span><RotateCcw size={15} /> 7-day return window</span>
          </div>
          <button
            className="button button-primary button-block"
            type="button"
            disabled={available <= 0}
            onClick={() => addToCart(false)}
          >
            <ShoppingBag size={17} /> Add to cart
          </button>
          <button
            className="button button-strong button-block"
            type="button"
            disabled={available <= 0}
            onClick={() => addToCart(true)}
          >
            Buy now
          </button>
          <div className="secure-note">
            <ShieldCheck size={15} />
            <span>
              <strong>Secure checkout</strong>
              Pay on delivery or when you pick up your order.
            </span>
          </div>
          <p className="muted small-note" style={{ margin: 0 }}>
            <Check size={13} /> Sold and fulfilled by {item.seller.name}
          </p>
        </aside>
      </div>

      {related.data && related.data.length > 0 ? (
        <section className="home-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOU MAY ALSO LIKE</p>
              <h2>More in {item.category.name}</h2>
            </div>
            <Link className="text-link" to={'/c/' + item.category.slug}>See all →</Link>
          </div>
          <div className="product-grid">
            {related.data.map((entry) => <ProductCard key={entry.id} product={entry} />)}
          </div>
        </section>
      ) : null}

      <div className="mobile-buy-bar">
        <div>
          <PriceTag amount={item.priceTzs} />
          <span className="muted small-note">{available > 0 ? 'In stock' : 'Out of stock'}</span>
        </div>
        <button
          className="button button-primary"
          type="button"
          disabled={available <= 0}
          onClick={() => addToCart(true)}
        >
          Buy now
        </button>
      </div>
    </section>
  );
}
