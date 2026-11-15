import { Link } from 'react-router-dom';
import { ShopCard } from '../components/shop-card';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { uiCopy } from '../content/site-content';
import { DEMO_SHOPS } from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

export function ShopsPage() {
  const { locale } = useLocale();
  const copy = uiCopy[locale].shops;

  usePageMeta({
    title: 'Student-Owned Shops | SokoLink IFM Marketplace',
    description:
      'Discover student-owned storefronts at IFM in Dar es Salaam—academic supplies, campus bakes, study electronics, and everyday carry.',
  });

  return (
    <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#E4DFD3] pb-6">
        <TagBadge variant="subtle">{copy.eyebrow}</TagBadge>
        <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
          {copy.heading}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5A54] sm:text-base">
          {copy.description}
        </p>
      </header>

      <div className="rounded-md border border-[#E4DFD3] bg-[#F3EFE6] px-4 py-3 text-xs text-[#5C5A54]">
        {locale === 'en'
          ? 'Storefront previews below demonstrate how approved IFM student businesses are presented on SokoLink. Live seller badges are awarded only after manual administrator verification.'
          : 'Maduka haya ya mfano yanaonyesha jinsi biashara za wanafunzi wa IFM zitakavyoonekana baada ya kuhakikiwa na msimamizi.'}
      </div>

      <div className="commerce-grid">
        {DEMO_SHOPS.map((shop) => (
          <ShopCard key={shop.slug} shop={shop} />
        ))}
      </div>

      <section className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6 sm:p-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2 max-w-xl">
          <h2 className="font-display text-2xl font-bold text-[#141413]">
            {locale === 'en'
              ? 'Run your own student business at IFM?'
              : 'Una biashara yako ya ujasiriamali chuoni IFM?'}
          </h2>
          <p className="text-sm text-[#5C5A54]">
            {locale === 'en'
              ? 'Register a customer account and learn how manual IFM seller verification works.'
              : 'Fungua akaunti ya SokoLink na ujifunze jinsi uhakiki wa muuzaji wa IFM unavyofanyika.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TagLink to="/sign-up" variant="forest">
            {locale === 'en' ? 'Create account' : 'Fungua akaunti'}
          </TagLink>
          <Link
            to="/sellers"
            className="inline-flex min-h-[44px] items-center rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-4 text-sm font-semibold text-[#141413] hover:bg-[#F3EFE6]"
          >
            {locale === 'en' ? 'Seller guide & application' : 'Mwongozo wa muuzaji'}
          </Link>
        </div>
      </section>
    </div>
  );
}
