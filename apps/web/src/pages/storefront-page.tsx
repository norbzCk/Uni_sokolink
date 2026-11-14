import { Link, useParams } from 'react-router-dom';
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
        <Link className="text-link" to="/products">Back to the marketplace</Link>
      </section>
    );
  }

  const { storefront, products } = data.data;
  const logo = resolveMediaUrl(storefront.logoUrl);

  return (
    <section className="page-wrap storefront-page">
      <header className="storefront-header">
        {logo ? (
          <img className="storefront-logo" src={logo} alt={storefront.businessName} />
        ) : (
          <span className="storefront-logo placeholder" aria-hidden="true">{storefront.businessName.slice(0, 1)}</span>
        )}
        <div>
          <p className="eyebrow">VERIFIED SELLER</p>
          <h1>{storefront.businessName}</h1>
          <p className="muted">{storefront.businessCategory} · {storefront.district}, {storefront.region}</p>
          <p className="storefront-description">{storefront.description}</p>
        </div>
      </header>

      <div className="section-heading">
        <h2>{products.total} {products.total === 1 ? 'product' : 'products'}</h2>
        <Link className="text-link" to="/products">Browse all products →</Link>
      </div>

      {products.items.length > 0 ? (
        <div className="product-grid">
          {products.items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No approved products yet.</h2>
          <p className="muted">This seller is still preparing their catalogue.</p>
        </div>
      )}
    </section>
  );
}
