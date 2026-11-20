import { Link } from 'react-router-dom';
import { Plus, ShoppingCart } from 'lucide-react';
import { resolveMediaUrl } from '../api/client';
import type { Product } from '../api/marketplace';
import { useCart } from '../cart/cart-context';
import { PriceTag, RatingStars } from './ui/primitives';

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const image = resolveMediaUrl(product.images[0]?.url);
  const available = product.stock?.available ?? 0;
  const lowStock = available > 0 && available <= (product.stock?.lowStockThreshold ?? 3);

  return (
    <article className="product-card">
      <Link className="product-card-media" to={'/p/' + product.slug}>
        {image ? (
          <img src={image} alt={product.images[0]?.alt ?? product.name} loading="lazy" />
        ) : (
          <span className="product-placeholder" aria-hidden="true">{product.name.slice(0, 1)}</span>
        )}
        {available <= 0 ? <span className="product-badge">Out of stock</span> : null}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category.name}</p>
        <h3><Link to={'/p/' + product.slug}>{product.name}</Link></h3>
        <RatingStars />
        <p className="product-seller">
          {product.seller.name}
          <span className="verified"> ✓</span>
        </p>
        {lowStock ? <span className="stock-hint">Only {available} left</span> : null}
        <div className="product-card-foot">
          <PriceTag amount={product.priceTzs} compact />
          <button
            className="product-add"
            type="button"
            disabled={available <= 0}
            onClick={() => cart.add(product)}
            aria-label={'Add ' + product.name + ' to cart'}
          >
            {available <= 0 ? <ShoppingCart size={16} /> : <Plus size={17} />}
          </button>
        </div>
      </div>
    </article>
  );
}
