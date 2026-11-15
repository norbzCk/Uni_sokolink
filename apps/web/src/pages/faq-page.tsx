import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaqAccordion } from '../components/faq-accordion';
import { TagBadge } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { faqItems, type FaqCategory } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

const CATEGORIES: FaqCategory[] = ['Buyers', 'Sellers', 'Payments', 'Delivery', 'Safety'];

export function FaqPage() {
  const { locale } = useLocale();
  const searchInputId = useId();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | FaqCategory>('ALL');

  usePageMeta({
    title: 'FAQ — Buyers, Sellers, Payments, Delivery & Safety | SokoLink',
    description:
      'Answers to common questions about SokoLink at IFM in Dar es Salaam: who can sell, who can buy, campus pickup, and manual verification.',
  });

  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      item.question.en.toLowerCase().includes(normalizedQuery) ||
      item.answer.en.toLowerCase().includes(normalizedQuery) ||
      item.question.sw.toLowerCase().includes(normalizedQuery) ||
      item.answer.sw.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#E4DFD3] pb-6">
        <TagBadge variant="subtle">
          {locale === 'en' ? 'FREQUENTLY ASKED QUESTIONS' : 'MASWALI YA MARA KWA MARA'}
        </TagBadge>
        <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
          {locale === 'en'
            ? 'Clear answers about SokoLink.'
            : 'Majibu ya wazi kuhusu SokoLink.'}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5A54] sm:text-base">
          {locale === 'en'
            ? 'Where a policy is still being finalized before public transactions launch (such as fees, refund windows, or supported mobile money providers), we state “To be announced before launch”.'
            : 'Pale ambapo sera bado zinakamilishwa kabla ya uzinduzi rasmi, tumeandika “To be announced before launch”.'}
        </p>
      </header>

      <div className="space-y-4 rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-5">
        <div>
          <label htmlFor={searchInputId} className="block text-xs font-semibold text-[#141413]">
            {locale === 'en' ? 'Search questions' : 'Tafuta swali'}
          </label>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === 'en'
                ? 'Search e.g. "mobile money", "verified", "pickup"...'
                : 'Tafuta mfano "malipo", "muuzaji", "chuoni"...'
            }
            className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413] placeholder:text-[#78756E]"
          />
        </div>

        <div className="pill-row" role="group" aria-label="Filter FAQ by category">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`min-h-[38px] rounded-md border px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === 'ALL'
                ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                : 'border-[#E4DFD3] bg-[#FAF8F4] text-[#141413] hover:bg-[#F3EFE6]'
            }`}
          >
            {locale === 'en' ? 'All topics' : 'Mada zote'} ({faqItems.length})
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`min-h-[38px] rounded-md border px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === category
                  ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                  : 'border-[#E4DFD3] bg-[#FAF8F4] text-[#141413] hover:bg-[#F3EFE6]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {activeCategory === 'ALL' && !normalizedQuery ? (
        <div className="space-y-8">
          {CATEGORIES.map((category) => {
            const categoryItems = faqItems.filter((item) => item.category === category);
            return (
              <section key={category} className="space-y-3">
                <TagBadge variant="subtle">{category}</TagBadge>
                <FaqAccordion items={categoryItems} />
              </section>
            );
          })}
        </div>
      ) : (
        <FaqAccordion items={filteredItems} showCategoryBadge />
      )}

      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#E4DFD3] bg-[#F3EFE6] p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-bold text-[#141413]">
            {locale === 'en' ? 'Need more details?' : 'Unahitaji maelezo zaidi?'}
          </h2>
          <p className="text-sm text-[#5C5A54]">
            {locale === 'en'
              ? 'Contact the SokoLink team in Dar es Salaam.'
              : 'Wasiliana na timu ya SokoLink Dar es Salaam.'}
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#0F533E] px-4 text-xs font-semibold text-[#FAF8F4] hover:bg-[#0A3D2E]"
        >
          {locale === 'en' ? 'Contact us →' : 'Wasiliana nasi →'}
        </Link>
      </div>
    </div>
  );
}
