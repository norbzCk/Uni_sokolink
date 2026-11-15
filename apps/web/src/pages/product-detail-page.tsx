import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { ProductCard } from '../components/product-card';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { DEMO_PRODUCTS, DEMO_SHOPS, formatTzs } from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { locale } = useLocale();
  const { user } = useAuth();

  const product = DEMO_PRODUCTS.find((p) => p.id === productId);
  const shop = product ? DEMO_SHOPS.find((s) => s.slug === product.shopSlug) : undefined;
  const relatedProducts = product
    ? DEMO_PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(
        0,
        3,
      )
    : [];

  usePageMeta({
    title: product
      ? `${product.name[locale]} — ${formatTzs(product.priceTzs)} | SokoLink`
      : 'Product Not Found | SokoLink',
    description: product
      ? product.summary[locale]
      : 'Explore student-owned shops and products on SokoLink.',
  });

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16 text-center space-y-4">
        <p className="eyebrow">MARKETPLACE</p>
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          {locale === 'en' ? 'Product listing not found.' : 'Bidhaa haijapatikana.'}
        </h1>
        <p className="text-sm text-[#5C5A54]">
          {locale === 'en'
            ? 'The item you requested is not in the marketplace preview.'
            : 'Bidhaa uliyotafuta haipo kwenye orodha ya mfano.'}
        </p>
        <TagLink to="/marketplace" variant="forest">
          {locale === 'en' ? 'Back to marketplace' : 'Rudi sokoni'}
        </TagLink>
      </section>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5C5A54]">
        <Link to="/" className="hover:text-[#0F533E] underline-offset-2 hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/marketplace" className="hover:text-[#0F533E] underline-offset-2 hover:underline">
          {locale === 'en' ? 'Marketplace' : 'Sokoni'}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[#141413]">{product.name[locale]}</span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-lg border border-[#E4DFD3] bg-[#FFFFFF]">
            <img
              src={product.image}
              alt={product.name[locale]}
              width={800}
              height={600}
              className="aspect-4/3 w-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TagBadge variant="subtle">{product.categoryLabel[locale]}</TagBadge>
              <span className="rounded border border-[#E4DFD3] bg-[#F3EFE6] px-2.5 py-1 text-xs font-medium text-[#5C5A54]">
                {locale === 'en' ? 'Sample listing preview' : 'Bidhaa ya mfano'}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-[#141413] sm:text-3xl">
              {product.name[locale]}
            </h1>

            <p className="font-display text-2xl font-extrabold tabular-nums text-[#0F533E]">
              {formatTzs(product.priceTzs)}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
            {product.summary[locale]}
          </p>

          {/* Product Specifications */}
          <div className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-4 space-y-2.5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#141413]">
              {locale === 'en' ? 'Product details' : 'Maelezo ya bidhaa'}
            </h2>
            <ul className="space-y-1.5 text-sm text-[#5C5A54]">
              {product.specs[locale].map((spec) => (
                <li key={spec} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0F533E]"
                  />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fulfilment & Shop Card */}
          <div className="rounded-lg border border-[#E4DFD3] bg-[#F3EFE6] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F533E]">
                {product.availability[locale]}
              </span>
              <Link
                to={`/shops/${product.shopSlug}`}
                className="text-xs font-semibold text-[#141413] underline hover:text-[#0F533E]"
              >
                {product.shopName} →
              </Link>
            </div>
            <p className="text-xs text-[#5C5A54]">{product.fulfilmentNote[locale]}</p>
            {shop && <p className="text-[11px] text-[#78756E]">{shop.verificationNote[locale]}</p>}
          </div>

          {/* Honest Action Area (No Fake Checkout) */}
          <div className="rounded-lg border border-[#CFC8B8] bg-[#FFFFFF] p-5 space-y-3">
            <p className="text-xs leading-relaxed text-[#5C5A54]">
              {locale === 'en'
                ? 'This item is part of the SokoLink catalogue preview. Cart checkout and mobile money ordering open when the commerce and payment services go live. You can register your customer account today or view the student storefront.'
                : 'Bidhaa hii ni sehemu ya mfano wa soko la SokoLink. Mfumo wa kuagiza na kulipa utaanza huduma za biashara zitakapofunguliwa. Unaweza kufungua akaunti yako leo.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <TagLink to="/account" variant="forest">
                  {locale === 'en' ? 'Go to your account' : 'Fungua akaunti yako'}
                </TagLink>
              ) : (
                <TagLink to="/sign-up" variant="forest">
                  {locale === 'en' ? 'Create account to prepare for launch' : 'Fungua akaunti'}
                </TagLink>
              )}
              <TagLink to={`/shops/${product.shopSlug}`} variant="outline">
                {locale === 'en' ? `View ${product.shopName}` : `Tazama duka la ${product.shopName}`}
              </TagLink>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-5 border-t border-[#E4DFD3] pt-10">
          <h2 className="font-display text-xl font-bold text-[#141413]">
            {locale === 'en' ? 'More in this category' : 'Bidhaa nyingine kwenye kategoria hii'}
          </h2>
          <div className="commerce-grid">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
