import { Link, useParams } from 'react-router-dom';
import { ProductCard } from '../components/product-card';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { DEMO_PRODUCTS, DEMO_SHOPS } from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

export function ShopDetailPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const { locale } = useLocale();

  const shop = DEMO_SHOPS.find((s) => s.slug === shopSlug);
  const shopProducts = shop
    ? DEMO_PRODUCTS.filter((p) => p.shopSlug === shop.slug)
    : [];

  usePageMeta({
    title: shop ? `${shop.name} | SokoLink Student Storefront` : 'Shop Not Found | SokoLink',
    description: shop ? shop.description[locale] : 'Student-owned storefronts on SokoLink.',
  });

  if (!shop) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16 text-center space-y-4">
        <p className="eyebrow">STUDENT SHOPS</p>
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          {locale === 'en' ? 'Storefront not found.' : 'Duka halijapatikana.'}
        </h1>
        <TagLink to="/shops" variant="forest">
          {locale === 'en' ? 'Browse student shops' : 'Tazama maduka ya wanafunzi'}
        </TagLink>
      </section>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5C5A54]">
        <Link to="/" className="hover:text-[#0F533E] hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/shops" className="hover:text-[#0F533E] hover:underline">
          {locale === 'en' ? 'Student Shops' : 'Maduka ya Wanafunzi'}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[#141413]">{shop.name}</span>
      </nav>

      {/* Storefront Header Card */}
      <section className="grid grid-cols-1 gap-8 rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <img
            src={shop.image}
            alt={shop.name}
            width={600}
            height={400}
            className="aspect-3/2 w-full rounded-md border border-[#E4DFD3] object-cover"
          />
        </div>
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <TagBadge variant="subtle">{shop.categoryLabel[locale]}</TagBadge>
            <span className="rounded border border-[#E4DFD3] bg-[#F3EFE6] px-2.5 py-1 text-xs font-medium text-[#5C5A54]">
              {shop.verificationNote[locale]}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#141413]">{shop.name}</h1>
          <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
            {shop.description[locale]}
          </p>
          <div className="rounded-md border border-[#E4DFD3] bg-[#FAF8F4] px-4 py-3 text-xs text-[#141413]">
            <strong>{locale === 'en' ? 'Fulfilment & Pickup:' : 'Kuchukua Oda:'}</strong>{' '}
            {shop.pickupLocation[locale]}
          </div>
        </div>
      </section>

      {/* Storefront Products */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#141413]">
            {locale === 'en' ? 'Products in this shop' : 'Bidhaa kwenye duka hili'} (
            {shopProducts.length})
          </h2>
          <Link to="/marketplace" className="text-xs font-semibold text-[#0F533E] hover:underline">
            {locale === 'en' ? 'All marketplace items →' : 'Bidhaa zote sokoni →'}
          </Link>
        </div>

        <div className="commerce-grid">
          {shopProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
