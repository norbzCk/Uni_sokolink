import { Link } from 'react-router-dom';
import { FaqAccordion } from '../components/faq-accordion';
import { StepList } from '../components/step-list';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { buyerSteps, faqItems } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function BuyersPage() {
  const { locale } = useLocale();
  const buyerFaqs = faqItems.filter(
    (item) =>
      item.category === 'Buyers' ||
      item.category === 'Payments' ||
      item.category === 'Delivery',
  );

  usePageMeta({
    title: 'For Buyers — How SokoLink Works at IFM | SokoLink',
    description:
      'Learn how IFM students discover products and student-owned shops, place orders, and arrange campus pickup or delivery on SokoLink.',
  });

  return (
    <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-4 border-b border-[#E4DFD3] pb-8">
        <TagBadge variant="subtle">
          {locale === 'en' ? 'FOR CAMPUS BUYERS' : 'KWA WANUNUZI WA CHUONI'}
        </TagBadge>
        <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
          {locale === 'en'
            ? 'Shop from fellow IFM students with clarity and confidence.'
            : 'Nunua kutoka kwa wanafunzi wenzako wa IFM kwa uwazi na uaminifu.'}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5A54] sm:text-base">
          {locale === 'en'
            ? 'SokoLink replaces scattered status updates and unverified DMs with structured product catalogues, transparent TZS pricing, and organized campus pickup.'
            : 'SokoLink inaondoa changamoto ya kutafuta bidhaa kwenye status zisizo na mpangilio kwa kuleta orodha wazi ya bidhaa na bei kwa TZS.'}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <TagLink to="/marketplace" variant="forest">
            {locale === 'en' ? 'Explore marketplace' : 'Tembelea soko'}
          </TagLink>
          <TagLink to="/sign-up" variant="outline">
            {locale === 'en' ? 'Create buyer account' : 'Fungua akaunti ya mnunuzi'}
          </TagLink>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-[#141413]">
          {locale === 'en' ? 'Three simple steps for buyers' : 'Hatua tatu rahisi kwa wanunuzi'}
        </h2>
        <StepList steps={buyerSteps} />
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#141413]">
            {locale === 'en' ? 'Buyer questions' : 'Maswali ya wanunuzi'}
          </h2>
          <Link to="/faq" className="text-xs font-semibold text-[#0F533E] hover:underline">
            {locale === 'en' ? 'All FAQ topics →' : 'Maswali yote →'}
          </Link>
        </div>
        <FaqAccordion items={buyerFaqs} showCategoryBadge groupName="buyers-faq" />
      </section>
    </div>
  );
}
