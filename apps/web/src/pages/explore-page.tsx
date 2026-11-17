import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import type { Category, ProductList } from '../api/marketplace';
import { ErrorState } from '../components/async-state';
import { ProductCard } from '../components/product-card';
import { ProductGridSkeleton } from '../components/ui/primitives';
import { useApi } from '../lib/use-api';

const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'USED', label: 'Used' },
  { value: 'REFURBISHED', label: 'Refurbished' },
];

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '');
  const [filterOpen, setFilterOpen] = useState(false);
  const query = params.toString();
  const categories = useApi(() => apiRequest<Category[]>('/catalogue/categories'), []);
  const products = useApi(
    () => apiRequest<ProductList>('/catalogue/products?' + query),
    [query],
  );

  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'recommended';
  const page = Number(params.get('page') ?? '1');
  const q = params.get('q') ?? '';
  const selectedConditions = (params.get('condition') ?? '').split(',').filter(Boolean);
  const inStockOnly = params.get('stock') === 'in';

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    setMinPrice(params.get('minPrice') ?? '');
    setMaxPrice(params.get('maxPrice') ?? '');
  }, [params]);

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
    update({
      q: search.trim() || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  }

  function toggleCondition(value: string) {
    const next = selectedConditions.includes(value)
      ? selectedConditions.filter((item) => item !== value)
      : [...selectedConditions, value];
    update({ condition: next.join(',') || null });
  }

  function clearFilters() {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setParams(new URLSearchParams());
  }

  const totalPages = products.data?.totalPages ?? 0;
  const items = (products.data?.items ?? []).filter((product) => {
    if (selectedConditions.length && !selectedConditions.includes(product.condition)) return false;
    if (inStockOnly && (product.stock?.available ?? 0) <= 0) return false;
    return true;
  });

  const title = q
    ? 'Results for “' + q + '”'
    : category
      ? (categories.data?.find((item) => item.slug === category)?.name ?? 'Category')
      : 'All products';

  const filters = (
    <>
      <div className="filter-group">
        <div className="results-meta" style={{ margin: 0 }}>
          <h3>Category</h3>
          {category ? (
            <button className="link-button" type="button" onClick={() => update({ category: null })}>
              Clear
            </button>
          ) : null}
        </div>
        <label>
          <input
            type="radio"
            name="category"
            checked={!category}
            onChange={() => update({ category: null })}
          />
          All categories
        </label>
        {(categories.data ?? []).map((item) => (
          <label key={item.id}>
            <input
              type="radio"
              name="category"
              checked={category === item.slug}
              onChange={() => update({ category: item.slug })}
            />
            {item.name}
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 10 }}>
              {item.productCount}
            </span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Price (TZS)</h3>
        <div className="filter-price">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Min"
            aria-label="Minimum price"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <button
          className="button button-outline button-small"
          type="button"
          onClick={() => update({ minPrice: minPrice || null, maxPrice: maxPrice || null })}
        >
          Apply price
        </button>
      </div>
      <div className="filter-group">
        <h3>Condition</h3>
        {conditions.map((item) => (
          <label key={item.value}>
            <input
              type="checkbox"
              checked={selectedConditions.includes(item.value)}
              onChange={() => toggleCondition(item.value)}
            />
            {item.label}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Availability</h3>
        <label>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => update({ stock: inStockOnly ? null : 'in' })}
          />
          In stock only
        </label>
      </div>
      <div className="filter-group">
        <h3>Seller</h3>
        <p className="muted small-note" style={{ margin: 0 }}>
          Verified IFM student sellers appear with a green check on every listing.
        </p>
        <Link className="text-link small-note" to="/sell">Become a seller →</Link>
      </div>
      <button className="button button-ghost button-small" type="button" onClick={clearFilters}>
        Clear all filters
      </button>
    </>
  );

  return (
    <section className="page-wrap explore-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <span>{title}</span>
      </div>
      <div className="results-header">
        <div>
          <p className="eyebrow">MARKETPLACE</p>
          <h1>{title}</h1>
          <p className="muted small-note">
            Approved products from verified sellers, with stock shown before you buy.
          </p>
        </div>
        <button
          className="button button-outline filter-mobile-toggle"
          type="button"
          onClick={() => setFilterOpen(true)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
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
          <option value="newest">Newest arrivals</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="button button-primary" type="submit">Search</button>
      </form>

      <div className="search-layout">
        {filterOpen ? (
          <button
            className="overlay"
            type="button"
            aria-label="Close filters"
            onClick={() => setFilterOpen(false)}
          />
        ) : null}
        <aside className={'filter-sidebar' + (filterOpen ? ' open' : '')} aria-label="Filters">
          <div className="results-meta" style={{ margin: 0 }}>
            <h2 style={{ fontSize: 16 }}>Filters</h2>
            <button
              className="filter-close icon-button"
              type="button"
              aria-label="Close filters"
              onClick={() => setFilterOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          {filters}
        </aside>

        <div>
          <div className="results-meta">
            <span>
              {products.loading
                ? 'Loading products…'
                : products.data
                  ? products.data.total + ' ' + (products.data.total === 1 ? 'product' : 'products')
                  : 'No products'}
            </span>
            <span className="muted small-note">Prices include VAT where applicable</span>
          </div>

          {products.loading ? (
            <ProductGridSkeleton count={10} />
          ) : products.error ? (
            <ErrorState message={products.error} />
          ) : items.length > 0 ? (
            <>
              <div className="product-grid">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 ? (
                <nav className="pagination" aria-label="Product pages">
                  <button
                    className="button button-outline button-small"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) })}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    className="button button-outline button-small"
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => update({ page: String(page + 1) })}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <div className="empty-panel">
              <h2>No products match those filters.</h2>
              <p className="muted">Try a different search term, category or price range.</p>
              <button className="button button-primary" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
