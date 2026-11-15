import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { FaqAccordion } from '../components/faq-accordion';
import { ProductCard } from '../components/product-card';
import { ShopCard } from '../components/shop-card';
import { StepList } from '../components/step-list';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import {
  buyerSteps,
  faqItems,
  sellerSteps,
  trustEvidenceItems,
  uiCopy,
} from '../content/site-content';
import {
  DEMO_PRODUCTS,
  DEMO_SHOPS,
  formatTzs,
  PRODUCT_CATEGORIES,
  type ProductCategoryId,
} from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

export function HomePage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const copy = uiCopy[locale];
  const searchId = useId();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workflowTab, setWorkflowTab] = useState<'buyer' | 'seller'>('buyer');

  usePageMeta({
    title: 'SokoLink — IFM Student Marketplace in Dar es Salaam',
    description:
      'Discover great finds from fellow IFM students. Explore student-owned shops, discover everyday products and shop confidently within your campus community.',
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProducts = DEMO_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    if (!matchesCategory) return false;
    if (!normalizedSearch) return true;
    return (
      product.name.en.toLowerCase().includes(normalizedSearch) ||
      product.name.sw.toLowerCase().includes(normalizedSearch) ||
      product.shopName.toLowerCase().includes(normalizedSearch) ||
      product.categoryLabel.en.toLowerCase().includes(normalizedSearch)
    );
  });

  const featuredFaqs = faqItems.filter((item) => item.featuredOnHome);
  const heroHighlightProducts = DEMO_PRODUCTS.slice(0, 3);
  const heroFeaturedShop = DEMO_SHOPS[0];

  return (
    <div>
      {/* B. HERO SECTION */}
      <section className="border-b border-[#E4DFD3] bg-[#FAF8F4] py-6 sm:py-8 lg:py-10">
        <div className="grid w-full grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          {/* Left Column: Marketplace Value Proposition & CTAs */}
          <div className="min-w-0 space-y-4 lg:col-span-6">
            <TagBadge variant="subtle">{copy.hero.badge}</TagBadge>

            <h1 className="font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-[#141413] sm:text-4xl lg:text-[2.75rem]">
              {copy.hero.headline}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-[#5C5A54] sm:text-lg">
              {copy.hero.subheadline}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TagLink
                to="/marketplace"
                variant="forest"
                className="w-full justify-center sm:w-auto"
              >
                <span>{copy.hero.primaryCta}</span>
                <span aria-hidden="true">→</span>
              </TagLink>

              <TagLink
                to={user?.roles.includes('SELLER') ? '/seller' : '/sellers'}
                variant="outline"
                className="w-full justify-center sm:w-auto"
              >
                {user?.roles.includes('SELLER') ? 'Open seller workspace' : copy.hero.secondaryCta}
              </TagLink>
            </div>

            {/* Quick Category Jump Pills */}
            <div className="pt-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#78756E]">
                {locale === 'en' ? 'Popular Campus Categories' : 'Kategoria Maarufu Chuoni'}
              </p>
              <div className="pill-row">
                {PRODUCT_CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
                  <a
                    key={cat.id}
                    href="#explore-products"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="inline-flex min-h-[34px] items-center rounded-md border border-[#E4DFD3] bg-[#FFFFFF] px-3 py-1 text-xs font-medium text-[#141413] transition-colors hover:border-[#0F533E] hover:text-[#0F533E]"
                  >
                    {cat.label[locale]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Marketplace Collection & Shop Preview */}
          <div className="min-w-0 lg:col-span-6">
            <div className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-4 shadow-xs sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DFD3] pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0F533E]" aria-hidden="true" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-[#141413]">
                    {copy.hero.previewHeader}
                  </span>
                </div>
                <span className="rounded bg-[#F3EFE6] px-2 py-0.5 text-[11px] font-medium text-[#5C5A54]">
                  {copy.hero.previewNotice}
                </span>
              </div>

              {/* Mini Product Collection Grid */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {heroHighlightProducts.map((item) => (
                  <Link
                    key={item.id}
                    to={`/products/${item.id}`}
                    className="group flex flex-row items-center gap-3 rounded-md border border-[#E4DFD3] bg-[#FAF8F4] p-2.5 transition-colors hover:border-[#0F533E] sm:flex-col sm:items-stretch"
                  >
                    <img
                      src={item.image}
                      alt={item.name[locale]}
                      width={800}
                      height={600}
                      loading="eager"
                      decoding="async"
                      className="h-16 w-20 shrink-0 rounded object-cover sm:aspect-4/3 sm:h-auto sm:w-full"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-[11px] font-medium text-[#0F533E]">
                        {item.shopName}
                      </p>
                      <p className="line-clamp-2 font-display text-xs font-bold leading-snug text-[#141413] group-hover:text-[#0F533E]">
                        {item.name[locale]}
                      </p>
                      <p className="font-display text-xs font-bold tabular-nums text-[#141413]">
                        {formatTzs(item.priceTzs)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Featured Student Storefront Bar */}
              {heroFeaturedShop && (
                <div className="mt-4 flex flex-col justify-between gap-3 rounded-md border border-[#E4DFD3] bg-[#F3EFE6] p-3.5 sm:flex-row sm:items-center">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0F533E]">
                      {copy.hero.featuredShopLabel} · {heroFeaturedShop.name}
                    </p>
                    <p className="text-xs text-[#5C5A54]">
                      {heroFeaturedShop.pickupLocation[locale]}
                    </p>
                  </div>
                  <Link
                    to={`/shops/${heroFeaturedShop.slug}`}
                    className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded border border-[#CFC8B8] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#141413] hover:border-[#0F533E] hover:text-[#0F533E]"
                  >
                    {copy.shops.viewShop} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* C. MARKETPLACE PRODUCT DISCOVERY */}
      <section id="explore-products" className="border-b border-[#E4DFD3] py-8 sm:py-10">
        <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-1.5">
              <p className="eyebrow">{copy.discovery.eyebrow}</p>
              <h2 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
                {copy.discovery.heading}
              </h2>
              <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
                {copy.discovery.description}
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex min-h-[40px] shrink-0 items-center text-sm font-semibold text-[#0F533E] hover:underline"
            >
              {copy.discovery.viewAllProducts} →
            </Link>
          </div>

          {/* Transparent Demo Data Notice */}
          <div className="flex flex-col justify-between gap-3 rounded-md border border-[#E4DFD3] bg-[#F3EFE6] px-4 py-3 text-xs text-[#5C5A54] sm:flex-row sm:items-center">
            <p>{copy.discovery.demoBanner}</p>
            <Link to="/sellers" className="shrink-0 font-semibold text-[#0F533E] underline">
              {locale === 'en' ? 'Apply to list your products' : 'Omba kuweka bidhaa zako'}
            </Link>
          </div>

          {/* Category Navigation & Search Toolbar */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div
              role="group"
              aria-label="Product categories"
              className="pill-row"
            >
              {PRODUCT_CATEGORIES.map((category) => {
                const active = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`min-h-[40px] rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${active
                      ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                      : 'border-[#E4DFD3] bg-[#FFFFFF] text-[#141413] hover:border-[#CFC8B8] hover:bg-[#F3EFE6]'
                      }`}
                  >
                    {category.label[locale]}
                  </button>
                );
              })}
            </div>

            <div className="w-full md:w-72">
              <label htmlFor={searchId} className="sr-only">
                {copy.discovery.searchPlaceholder}
              </label>
              <input
                id={searchId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.discovery.searchPlaceholder}
                className="h-10 w-full rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-3.5 text-sm text-[#141413] placeholder:text-[#78756E]"
              />
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="commerce-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-8 text-center">
              <p className="text-sm text-[#5C5A54]">{copy.discovery.noResults}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 inline-flex min-h-[40px] items-center rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-4 text-xs font-semibold text-[#141413]"
              >
                {locale === 'en' ? 'Reset filters' : 'Ondoa vichujio'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* D. STUDENT-OWNED SHOPS */}
      <section id="discover-shops" className="border-b border-[#E4DFD3] bg-[#F3EFE6] py-8 sm:py-10">
        <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-1.5">
              <p className="eyebrow">{copy.shops.eyebrow}</p>
              <h2 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
                {copy.shops.heading}
              </h2>
              <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
                {copy.shops.description}
              </p>
            </div>
            <Link
              to="/shops"
              className="inline-flex min-h-[40px] shrink-0 items-center text-sm font-semibold text-[#0F533E] hover:underline"
            >
              {copy.shops.allShopsCta} →
            </Link>
          </div>

          <div className="commerce-grid">
            {DEMO_SHOPS.map((shop) => (
              <ShopCard key={shop.slug} shop={shop} />
            ))}
          </div>
        </div>
      </section>

      {/* E. HOW SOKOLINK WORKS (Buyer & Seller 3-Step Workflows) */}
      <section id="how-it-works" className="border-b border-[#E4DFD3] py-8 sm:py-10">
        <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-1.5">
              <p className="eyebrow">{copy.howItWorks.eyebrow}</p>
              <h2 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
                {copy.howItWorks.heading}
              </h2>
              <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
                {copy.howItWorks.description}
              </p>
            </div>

            <div
              role="group"
              aria-label="Workflow perspective"
              className="inline-flex rounded-md border border-[#E4DFD3] bg-[#FFFFFF] p-1"
            >
              <button
                type="button"
                aria-pressed={workflowTab === 'buyer'}
                onClick={() => setWorkflowTab('buyer')}
                className={`min-h-[38px] rounded px-4 text-xs font-semibold transition-colors cursor-pointer ${workflowTab === 'buyer'
                  ? 'bg-[#0F533E] text-[#FAF8F4]'
                  : 'text-[#5C5A54] hover:text-[#141413]'
                  }`}
              >
                {copy.howItWorks.buyerTab}
              </button>
              <button
                type="button"
                aria-pressed={workflowTab === 'seller'}
                onClick={() => setWorkflowTab('seller')}
                className={`min-h-[38px] rounded px-4 text-xs font-semibold transition-colors cursor-pointer ${workflowTab === 'seller'
                  ? 'bg-[#0F533E] text-[#FAF8F4]'
                  : 'text-[#5C5A54] hover:text-[#141413]'
                  }`}
              >
                {copy.howItWorks.sellerTab}
              </button>
            </div>
          </div>

          <StepList steps={workflowTab === 'buyer' ? buyerSteps : sellerSteps} />

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-5">
            <p className="text-sm text-[#5C5A54]">
              {workflowTab === 'buyer'
                ? locale === 'en'
                  ? 'Ready to browse student shops or register your customer account?'
                  : 'Uko tayari kutazama maduka ya wanafunzi au kufungua akaunti?'
                : locale === 'en'
                  ? 'Want to learn what documents and details are required for manual IFM seller verification?'
                  : 'Unataka kujua mahitaji ya uhakiki wa muuzaji mwanafunzi wa IFM?'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/buyers"
                className="inline-flex min-h-[40px] items-center rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-4 text-xs font-semibold text-[#141413] hover:bg-[#F3EFE6]"
              >
                {copy.howItWorks.buyerCta}
              </Link>
              <Link
                to="/sellers"
                className="inline-flex min-h-[40px] items-center rounded-md bg-[#0F533E] px-4 text-xs font-semibold text-[#FAF8F4] hover:bg-[#0A3D2E]"
              >
                {copy.howItWorks.sellerCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* F. TRUST AND COMMUNITY */}
      <section className="border-b border-[#E4DFD3] bg-[#F3EFE6] py-8 sm:py-10">
        <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-1.5">
            <p className="eyebrow">{copy.trust.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
              {copy.trust.heading}
            </h2>
            <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
              {copy.trust.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {trustEvidenceItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6"
              >
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded bg-[#EAF2EE] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F533E]">
                    {item.badge[locale]}
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#141413]">
                    {item.title[locale]}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5C5A54]">
                    {item.description[locale]}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* G. SELLER ACQUISITION SECTION */}
      <section className="border-b border-[#E4DFD3] py-8 sm:py-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 rounded-lg border border-[#0F533E] bg-[#0F533E] p-6 text-[#FAF8F4] sm:p-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <span className="inline-flex items-center rounded bg-[#FAF8F4]/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#FAF8F4]">
                {copy.sellerCta.eyebrow}
              </span>
              <h2 className="font-display text-2xl font-bold leading-tight text-[#FAF8F4] sm:text-3xl">
                {copy.sellerCta.heading}
              </h2>
              <p className="text-sm leading-relaxed text-[#FAF8F4]/85 sm:text-base">
                {copy.sellerCta.description}
              </p>
              <ul className="space-y-2 pt-1 text-sm text-[#FAF8F4]/90">
                {copy.sellerCta.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D95D24]"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[#FAF8F4]/20 bg-[#0A3D2E] p-6 lg:col-span-5">
              <p className="font-display text-base font-bold text-[#FAF8F4]">
                {locale === 'en'
                  ? 'Start with a SokoLink account, then submit your IFM seller application.'
                  : 'Anza na akaunti ya SokoLink, kisha wasilisha ombi lako la uuzaji.'}
              </p>
              <p className="text-xs leading-relaxed text-[#FAF8F4]/75">
                {locale === 'en'
                  ? 'Seller permissions are granted after manual administrator review of your student and shop details.'
                  : 'Idhini ya kufungua duka hutolewa baada ya msimamizi kuhakiki taarifa zako.'}
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                <TagLink to="/sign-up" variant="accent" className="w-full justify-center">
                  {copy.sellerCta.primaryButton}
                </TagLink>
                <Link
                  to="/sellers"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#FAF8F4]/30 px-4 text-sm font-semibold text-[#FAF8F4] hover:bg-[#FAF8F4]/10"
                >
                  {copy.sellerCta.secondaryButton}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* H. FAQ PREVIEW */}
      <section className="py-8 sm:py-10">
        <div className="grid w-full grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="space-y-3 lg:col-span-4">
            <p className="eyebrow">{copy.faq.eyebrow}</p>
            <h2 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
              {copy.faq.heading}
            </h2>
            <p className="text-sm leading-relaxed text-[#5C5A54]">{copy.faq.description}</p>
            <div className="pt-2">
              <Link
                to="/faq"
                className="inline-flex min-h-[40px] items-center rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-4 text-xs font-semibold text-[#141413] hover:bg-[#F3EFE6]"
              >
                {copy.faq.viewAllFaq} →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <FaqAccordion items={featuredFaqs} groupName="home-faq" />
          </div>
        </div>
      </section>
    </div>
  );
}
