import { FaqAccordion } from '../components/faq-accordion';
import { StepList } from '../components/step-list';
import { TagBadge, TagLink } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { WaitlistForm } from '../components/waitlist-form';
import { faqItems, sellerSteps } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function SellersPage() {
  const { locale } = useLocale();
  const sellerFaqs = faqItems.filter(
    (item) => item.category === 'Sellers' || item.category === 'Safety',
  );

  usePageMeta({
    title: 'For Student Sellers — Open Your Shop at IFM | SokoLink',
    description:
      'Turn your student business into a structured online shop on SokoLink. Learn how IFM student verification and seller onboarding work.',
  });

  return (
    <div className="w-full space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-4 border-b border-[#E4DFD3] pb-8">
        <TagBadge variant="subtle">
          {locale === 'en' ? 'FOR IFM STUDENT SELLERS' : 'KWA WAUZAJI WANAFUNZI WA IFM'}
        </TagBadge>
        <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
          {locale === 'en'
            ? 'Turn your student business into a shop everyone can discover.'
            : 'Badilisha biashara yako ya chuoni kuwa duka ambalo kila mtu anaweza kulipata.'}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5A54] sm:text-base">
          {locale === 'en'
            ? 'Start with a verified customer account, submit your IFM student and business details for manual administrator review, and manage your products in one structured storefront.'
            : 'Anza kwa kufungua akaunti, wasilisha taarifa zako za uanafunzi wa IFM kwa uhakiki wa msimamizi, na panga bidhaa zako kwenye duka moja.'}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <TagLink to="/sign-up" variant="forest">
            {locale === 'en' ? 'Create account first' : 'Fungua akaunti kwanza'}
          </TagLink>
          <a
            href="#seller-apply"
            className="inline-flex min-h-[44px] items-center rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#141413] hover:bg-[#F3EFE6]"
          >
            {locale === 'en' ? 'Submit early seller interest' : 'Jaza fomu ya awali ya uuzaji'}
          </a>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-[#141413]">
          {locale === 'en' ? 'How seller onboarding works' : 'Hatua za kuwa muuzaji'}
        </h2>
        <StepList steps={sellerSteps} />
      </section>

      <section
        id="seller-apply"
        className="grid grid-cols-1 gap-8 rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6 sm:p-8 lg:grid-cols-12"
      >
        <div className="space-y-3 lg:col-span-5">
          <TagBadge variant="subtle">
            {locale === 'en' ? 'EARLY ONBOARDING' : 'USAJILI WA AWALI'}
          </TagBadge>
          <h2 className="font-display text-2xl font-bold text-[#141413]">
            {locale === 'en'
              ? 'Register for the founding IFM seller cohort'
              : 'Jiunge na kundi la kwanza la wauzaji wa IFM'}
          </h2>
          <p className="text-sm leading-relaxed text-[#5C5A54]">
            {locale === 'en'
              ? 'Share your IFM study details and product category below. Seller privileges are only granted after manual administrator review.'
              : 'Jaza taarifa zako za masomo IFM na aina ya bidhaa unazouza. Uuzaji unaruhusiwa baada ya uhakiki wa msimamizi.'}
          </p>
        </div>
        <div className="lg:col-span-7">
          <WaitlistForm defaultRole="seller" showSellerFields />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-2xl font-bold text-[#141413]">
          {locale === 'en' ? 'Seller questions' : 'Maswali ya wauzaji'}
        </h2>
        <FaqAccordion items={sellerFaqs} showCategoryBadge groupName="sellers-faq" />
      </section>
    </div>
  );
}
