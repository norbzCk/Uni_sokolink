import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/product-card';
import { TagBadge } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { uiCopy } from '../content/site-content';
import {
  DEMO_PRODUCTS,
  PRODUCT_CATEGORIES,
  type ProductCategoryId,
} from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

type SortOption = 'featured' | 'price-asc' | 'price-desc';

export function MarketplacePage() {
  const { locale } = useLocale();
  const copy = uiCopy[locale].discovery;
  const searchId = useId();
  const sortId = useId();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  usePageMeta({
    title: 'Explore Marketplace Products | SokoLink IFM',
    description:
      'Browse everyday products from student-owned shops at IFM in Dar es Salaam—calculators, accounting notebooks, campus bakes, power banks, and bags.',
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filtered = DEMO_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    if (!matchesCategory) return false;
    if (!normalizedSearch) return true;
    return (
      product.name.en.toLowerCase().includes(normalizedSearch) ||
      product.name.sw.toLowerCase().includes(normalizedSearch) ||
      product.shopName.toLowerCase().includes(normalizedSearch)
    );
  });

  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.priceTzs - b.priceTzs;
    if (sortBy === 'price-desc') return b.priceTzs - a.priceTzs;
    return 0;
  });

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#E4DFD3] pb-6">
        <TagBadge variant="subtle">{copy.eyebrow}</TagBadge>
        <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
          {copy.heading}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5A54] sm:text-base">
          {copy.description}
        </p>
      </header>

      <div className="flex flex-col justify-between gap-3 rounded-md border border-[#E4DFD3] bg-[#F3EFE6] px-4 py-3 text-xs text-[#5C5A54] sm:flex-row sm:items-center">
        <p>{copy.demoBanner}</p>
        <Link to="/shops" className="shrink-0 font-semibold text-[#0F533E] underline">
          {locale === 'en' ? 'Browse student shops →' : 'Tazama maduka ya wanafunzi →'}
        </Link>
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div role="group" aria-label="Filter by product category" className="pill-row">
          {PRODUCT_CATEGORIES.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-[40px] rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                    : 'border-[#E4DFD3] bg-[#FFFFFF] text-[#141413] hover:bg-[#F3EFE6]'
                }`}
              >
                {category.label[locale]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <label htmlFor={searchId} className="sr-only">
              {copy.searchPlaceholder}
            </label>
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-10 w-full rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-3.5 text-sm text-[#141413] placeholder:text-[#78756E]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor={sortId} className="text-xs font-semibold text-[#5C5A54] shrink-0">
              {locale === 'en' ? 'Sort:' : 'Panga:'}
            </label>
            <select
              id={sortId}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#141413]"
            >
              <option value="featured">
                {locale === 'en' ? 'Featured' : 'Zilizochaguliwa'}
              </option>
              <option value="price-asc">
                {locale === 'en' ? 'Price: Low to High' : 'Bei: Ndogo kwenda Kubwa'}
              </option>
              <option value="price-desc">
                {locale === 'en' ? 'Price: High to Low' : 'Bei: Kubwa kwenda Ndogo'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {sortedProducts.length > 0 ? (
        <div className="commerce-grid">
          {sortedProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-8 text-center">
          <p className="text-sm text-[#5C5A54]">{copy.noResults}</p>
        </div>
      )}
    </div>
  );
}
