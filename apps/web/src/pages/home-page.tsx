import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Category, ProductList } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { ProductCard } from '../components/product-card';
import { LoadingState } from '../components/async-state';
import { useApi } from '../lib/use-api';

export function HomePage() {
  const { user } = useAuth();
  const categories = useApi(
    () => apiRequest<Category[]>('/catalogue/categories'),
    [],
  );
  const featured = useApi(
    () => apiRequest<ProductList>('/catalogue/products?sort=newest&pageSize=8'),
    [],
  );

  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A MARKETPLACE FOR WHAT'S NEXT</p>
          <h1>Good ideas deserve a place to grow.</h1>
          <p className="lead">Discover student-led businesses and find the people building something of their own.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/products">Start shopping</Link>
            <Link className="text-link" to={user?.roles.includes('SELLER') ? '/seller' : '/sell'}>
              {user?.roles.includes('SELLER') ? 'Open seller workspace' : 'Become a seller'} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="trust-note">
            <span className="trust-dot" />A community marketplace shaped around student enterprise
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="art-card">
            <span className="art-kicker">MADE HERE</span>
            <div className="art-shape"><i /><b /><em /></div>
            <span className="art-caption">Ideas into livelihoods.</span>
          </div>
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SHOP BY CATEGORY</p>
            <h2>What are you looking for?</h2>
          </div>
          <Link className="text-link" to="/products">Browse everything →</Link>
        </div>
        {categories.loading ? (
          <LoadingState label="Loading categories" />
        ) : (
          <div className="category-grid">
            {(categories.data ?? []).slice(0, 8).map((category) => (
              <Link className="category-card" key={category.id} to={'/products?category=' + category.slug}>
                <span className="category-count">{category.productCount} listings</span>
                <strong>{category.name}</strong>
                <span>{category.description}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH ON SOKOLINK</p>
            <h2>New from local sellers</h2>
          </div>
          <Link className="text-link" to="/products?sort=newest">See all new arrivals →</Link>
        </div>
        {featured.loading ? (
          <LoadingState label="Loading products" />
        ) : featured.data && featured.data.items.length > 0 ? (
          <div className="product-grid">
            {featured.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <h3>Marketplace listings are on the way.</h3>
            <p className="muted">Approved products from verified sellers will appear here.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="steps-grid">
          <article>
            <span className="step-number">01</span>
            <h3>Find something useful</h3>
            <p>Browse approved products from sellers across Tanzania, with clear prices and stock.</p>
          </article>
          <article>
            <span className="step-number">02</span>
            <h3>Check out with confidence</h3>
            <p>Choose delivery or pickup. Pay in cash on delivery or when you collect your order.</p>
          </article>
          <article>
            <span className="step-number">03</span>
            <h3>Track every order</h3>
            <p>Follow each seller's progress from confirmation through to delivery.</p>
          </article>
        </div>
      </section>

      <section className="intro-strip">
        <span>One account. Room to grow.</span>
        <span>Shop local talent&nbsp; · &nbsp;Build with confidence</span>
      </section>
    </div>
  );
}
