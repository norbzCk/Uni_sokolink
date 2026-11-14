import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/client';
import type { Product } from '../api/marketplace';
import { useCart } from '../cart/cart-context';
import { formatTzs } from '../lib/format';

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const image = resolveMediaUrl(product.images[0]?.url);
  const available = product.stock?.available ?? 0;
  return (
    <article className="product-card">
      <Link className="product-card-media" to={'/products/' + product.slug}>
        {image ? (
          <img src={image} alt={product.images[0]?.alt ?? product.name} loading="lazy" />
        ) : (
          <span className="product-placeholder" aria-hidden="true">{product.name.slice(0, 1)}</span>
        )}
        {available <= 0 && <span className="product-badge">Out of stock</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category.name}</p>
        <h3><Link to={'/products/' + product.slug}>{product.name}</Link></h3>
        <p className="product-seller">{product.seller.name}</p>
        <div className="product-card-foot">
          <strong>{formatTzs(product.priceTzs)}</strong>
          <button
            className="button button-outline button-small"
            type="button"
            disabled={available <= 0}
            onClick={() => cart.add(product)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
