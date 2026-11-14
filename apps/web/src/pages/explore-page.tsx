import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Category, ProductList } from '../api/marketplace';
import { ErrorState, LoadingState } from '../components/async-state';
import { ProductCard } from '../components/product-card';
import { useApi } from '../lib/use-api';

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const query = params.toString();
  const categories = useApi(() => apiRequest<Category[]>('/catalogue/categories'), []);
  const products = useApi(
    () => apiRequest<ProductList>('/catalogue/products?' + query),
    [query],
  );

  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'recommended';
  const page = Number(params.get('page') ?? '1');

  function update(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) copy.set(key, value);
      else copy.delete(key);
    }
    if (!('page' in next)) copy.delete('page');
    setParams(copy);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({ q: search.trim() || null });
  }

  const totalPages = products.data?.totalPages ?? 0;

  return (
    <section className="page-wrap explore-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MARKETPLACE</p>
          <h1>Find what you need.</h1>
          <p className="muted">Approved products from verified sellers, with stock shown before you buy.</p>
        </div>
      </div>

      <form className="filter-bar" onSubmit={submit} role="search">
        <input
          type="search"
          name="q"
          placeholder="Search products, brands or sellers"
          aria-label="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => update({ category: event.target.value || null })}
        >
          <option value="">All categories</option>
          {(categories.data ?? []).map((item) => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="recommended">Recommended</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="button button-primary" type="submit">Search</button>
      </form>

      {products.loading ? (
        <LoadingState label="Loading products" />
      ) : products.error ? (
        <ErrorState message={products.error} />
      ) : products.data && products.data.items.length > 0 ? (
        <>
          <div className="results-meta">
            <span>{products.data.total} {products.data.total === 1 ? 'product' : 'products'}</span>
            {query && <Link className="text-link" to="/products">Clear filters</Link>}
          </div>
          <div className="product-grid">
            {products.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                className="button button-outline"
                type="button"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="button button-outline"
                type="button"
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty-panel">
          <h2>No products match those filters.</h2>
          <p className="muted">Try a different search term or category.</p>
          <Link className="button button-primary" to="/products">View all products</Link>
        </div>
      )}
    </section>
  );
}
