import { TagBadge } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { useLocale } from '../i18n/locale-context';

export function TermsPage() {
  const { locale } = useLocale();

  usePageMeta({
    title: 'Terms & Conditions — SokoLink',
    description:
      'Terms of use for buyers and IFM student sellers using the SokoLink campus marketplace in Dar es Salaam.',
  });

  const sections =
    locale === 'en'
      ? [
          {
            heading: '1. Marketplace Scope',
            body: 'SokoLink provides a structured online marketplace platform connecting student-owned shops at the Institute of Finance Management (IFM) in Dar es Salaam with campus buyers.',
          },
          {
            heading: '2. Account & Seller Verification Rules',
            body: 'Every user registers as a customer first. Submitting a seller application never grants automatic storefront access; seller privileges require manual administrator approval.',
          },
          {
            heading: '3. Prohibited Listings & Conduct',
            body: 'Sellers may only list lawful, accurately described items in Tanzanian Shillings (TZS). Academic dishonesty services, counterfeit goods, and off-platform fee evasion are strictly prohibited.',
          },
          {
            heading: '4. Commercial Fees, Refunds & Disputes',
            body: 'Marketplace commission rates, payment provider settlement windows, and formal refund/dispute rules: To be announced before launch.',
          },
        ]
      : [
          {
            heading: '1. Wigo wa Soko',
            body: 'SokoLink ni jukwaa la soko la mtandaoni linalounganisha maduka ya wanafunzi wa IFM jijini Dar es Salaam na wanunuzi ndani ya jumuiya ya chuo.',
          },
          {
            heading: '2. Sheria za Akaunti na Uhakiki wa Wauzaji',
            body: 'Kila mtumiaji huanza na akaunti ya mteja. Kuomba kuwa muuzaji hakutoi idhini ya moja kwa moja; kila duka lazima lihakikiwe na msimamizi.',
          },
          {
            heading: '3. Bidhaa Zinazoruhusiwa',
            body: 'Wauzaji wanapaswa kuweka bidhaa halali zenye maelezo ya kweli na bei kwa Shilingi ya Tanzania (TZS).',
          },
          {
            heading: '4. Ada, Marejesho na Migogoro',
            body: 'Viwango vya kamisheni, muda wa malipo na sera rasmi ya marejesho (refunds): To be announced before launch.',
          },
        ];

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#E4DFD3] pb-6">
        <TagBadge variant="subtle">
          {locale === 'en' ? 'LEGAL · TERMS' : 'SHERIA · MASHARTI'}
        </TagBadge>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#141413] sm:text-4xl">
          {locale === 'en' ? 'Terms & Conditions' : 'Masharti ya Matumizi'}
        </h1>
        <p className="text-sm text-[#5C5A54]">
          {locale === 'en'
            ? 'Platform rules for IFM buyers and student sellers in Dar es Salaam.'
            : 'Masharti ya matumizi kwa wanunuzi na wauzaji wanafunzi wa IFM Dar es Salaam.'}
        </p>
      </header>

      <div className="space-y-4">
        {sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6"
          >
            <h2 className="font-display text-lg font-bold text-[#141413]">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5A54]">
              {section.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
