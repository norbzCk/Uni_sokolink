import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Baby,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Gem,
  Headphones,
  House,
  Laptop,
  Palette,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Utensils,
} from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../api/client';
import type { Category, ProductList } from '../api/marketplace';
import { useAuth } from '../auth/auth-context';
import { ProductCard } from '../components/product-card';
import { LoadingState } from '../components/async-state';
import { SectionHeading } from '../components/ui/primitives';
import { useApi } from '../lib/use-api';

const heroSlides = [
  {
    eyebrow: 'IFM STUDENT MARKETPLACE',
    title: 'Good ideas deserve a place to grow.',
    body: 'Discover student-led businesses, shop verified sellers and find something made with care.',
    primary: { label: 'Start shopping', to: '/search' },
    secondary: { label: 'Sell on SokoLink', to: '/sell' },
  },
  {
    eyebrow: 'CAMPUS PICKUP',
    title: 'From campus sellers to your doorstep.',
    body: 'Order from fellow students and choose delivery or a convenient campus pickup point.',
    primary: { label: 'Explore campus picks', to: '/campus' },
    secondary: { label: 'How delivery works', to: '/help#delivery' },
  },
  {
    eyebrow: 'VERIFIED STUDENT STORES',
    title: 'Every order supports a student business.',
    body: 'Shop confidently from IFM verified sellers with clear pricing, stock and order tracking.',
    primary: { label: 'Meet the sellers', to: '/search?sort=newest' },
    secondary: { label: 'Become a seller', to: '/sell' },
  },
];

const categoryIcons = [
  Shirt,
  Smartphone,
  Utensils,
  BookOpen,
  Sparkles,
  Dumbbell,
  Baby,
  House,
  Gem,
  Laptop,
  Headphones,
  Palette,
];

function CategoryIcon({ slug, index }: { slug: string; index: number }) {
  const Icon =
    slug.includes('fashion') || slug.includes('cloth')
      ? Shirt
      : slug.includes('phone') || slug.includes('electronic')
        ? Smartphone
        : slug.includes('food') || slug.includes('kitchen')
          ? Utensils
          : slug.includes('book') || slug.includes('station')
            ? BookOpen
            : slug.includes('beauty') || slug.includes('health')
              ? Sparkles
              : slug.includes('sport')
                ? Dumbbell
                : slug.includes('baby') || slug.includes('kid')
                  ? Baby
                  : slug.includes('home')
                    ? House
                    : (categoryIcons[index % categoryIcons.length] ?? ShoppingBag);
  return <Icon size={19} aria-hidden="true" />;
}

export function HomePage() {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const categories = useApi(() => apiRequest<Category[]>('/catalogue/categories'), []);
  const products = useApi(
    () => apiRequest<ProductList>('/catalogue/products?sort=newest&pageSize=12'),
    [],
  );
  const deals = useApi(
    () => apiRequest<ProductList>('/catalogue/products?sort=price_asc&pageSize=6'),
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % heroSlides.length), 6500);
    return () => clearInterval(timer);
  }, []);

  const current = heroSlides[slide] ?? heroSlides[0]!;
  const items = products.data?.items ?? [];
  const heroProducts = items.slice(0, 3);
  const dealItems = deals.data?.items ?? [];
  const recommended = items.slice(0, 12);

  return (
    <div className="page-wrap">
      <section className="hero" aria-roledescription="carousel" aria-label="SokoLink highlights">
        <div className="hero-slide">
          <div className="hero-copy">
            <p className="eyebrow">{current.eyebrow}</p>
            <h1>{current.title}</h1>
            <p>{current.body}</p>
            <div className="hero-actions">
              <Link className="button button-primary" to={current.primary.to}>
                {current.primary.label}
              </Link>
              <Link className="hero-link" to={current.secondary.to}>
                {current.secondary.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} />
              Verified student sellers
              <span className="dot-sep" />
              <Truck size={16} />
              Delivery or campus pickup
            </div>
          </div>
          <div className="hero-panel" aria-hidden="true">
            <div className="hero-panel-grid">
              {(heroProducts.length ? heroProducts : [null, null, null]).map((product, index) => (
                <div className="hero-panel-card" key={product?.id ?? index}>
                  {product?.images[0]?.url ? (
                    <img src={resolveMediaUrl(product.images[0].url) ?? ''} alt="" />
                  ) : (
                    <span className="hero-panel-art">
                      {index === 1 ? <Store size={26} /> : <ShoppingBag size={26} />}
                    </span>
                  )}
                  <strong>{product?.name ?? 'Student essentials'}</strong>
                  <small>{product ? product.seller.name : 'Verified seller'}</small>
                </div>
              ))}
            </div>
            <div className="hero-panel-stamp">
              <strong>IFM</strong>
              <span>Verified student enterprise</span>
            </div>
          </div>
        </div>
        <button
          className="hero-arrow prev"
          type="button"
          aria-label="Previous highlight"
          onClick={() => setSlide((slide - 1 + heroSlides.length) % heroSlides.length)}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="hero-arrow next"
          type="button"
          aria-label="Next highlight"
          onClick={() => setSlide((slide + 1) % heroSlides.length)}
        >
          <ChevronRight size={20} />
        </button>
        <div className="hero-dots" aria-label="Choose highlight">
          {heroSlides.map((item, index) => (
            <button
              key={item.eyebrow}
              className={'hero-dot' + (index === slide ? ' active' : '')}
              type="button"
              aria-label={'Show ' + item.eyebrow}
              aria-current={index === slide ? 'true' : undefined}
              onClick={() => setSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="SHOP BY CATEGORY"
          title="What are you looking for?"
          action={<Link className="text-link" to="/search">Browse everything →</Link>}
        />
        {categories.loading ? (
          <LoadingState label="Loading categories" />
        ) : (
          <div className="category-grid">
            {(categories.data ?? []).slice(0, 8).map((category, index) => (
              <Link className="category-card" key={category.id} to={'/c/' + category.slug}>
                <span className="category-icon">
                  <CategoryIcon slug={category.slug} index={index} />
                </span>
                <strong>{category.name}</strong>
                <span className="category-count">{category.productCount} listings</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeading
          eyebrow="TODAY'S DEALS"
          title="Popular on campus"
          action={<Link className="text-link" to="/deals">See all deals →</Link>}
        />
        {deals.loading ? (
          <LoadingState label="Loading products" />
        ) : dealItems.length > 0 ? (
          <div className="product-carousel">
            {dealItems.map((product) => (
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
        <SectionHeading
          eyebrow="FRESH ON SOKOLINK"
          title="New from local sellers"
          action={<Link className="text-link" to="/search?sort=newest">See all new arrivals →</Link>}
        />
        {products.loading ? (
          <LoadingState label="Loading products" />
        ) : recommended.length > 0 ? (
          <div className="product-grid">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-panel">
            <h3>New arrivals are coming soon.</h3>
            <p className="muted">Fresh products from student sellers will show up here.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="seller-banner">
          <div>
            <p className="eyebrow">SELL ON SOKOLINK</p>
            <h2>Turn your student hustle into a storefront.</h2>
            <p>Reach buyers on campus, manage stock and grow with a verified IFM seller profile.</p>
          </div>
          <Link
            className="button button-primary"
            to={user?.roles.includes('SELLER') ? '/seller' : '/sell'}
          >
            {user?.roles.includes('SELLER') ? 'Open seller workspace' : 'Become a seller'}
          </Link>
        </div>
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
            <p>Follow each seller&apos;s progress from confirmation through to delivery.</p>
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
