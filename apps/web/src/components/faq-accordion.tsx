import type { FaqItem } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

interface FaqAccordionProps {
  items: FaqItem[];
  showCategoryBadge?: boolean;
  groupName?: string;
}

export function FaqAccordion({
  items,
  showCategoryBadge = false,
  groupName,
}: FaqAccordionProps) {
  const { locale } = useLocale();

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6 text-sm text-[#5C5A54]">
        {locale === 'en'
          ? 'No matching questions found. Try another keyword or contact us directly.'
          : 'Hakuna swali lililopatikana. Jaribu neno jingine au wasiliana nasi moja kwa moja.'}
      </p>
    );
  }

  return (
    <div className="divide-y divide-[#E4DFD3] rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] px-5 sm:px-6">
      {items.map((item) => (
        <details
          key={item.id}
          className="faq-item group last:border-b-0"
          {...(groupName ? { name: groupName } : {})}
        >
          <summary className="faq-summary text-left text-base">
            <span className="flex flex-wrap items-center gap-2.5 pr-2">
              {showCategoryBadge && (
                <span className="inline-flex items-center rounded bg-[#EAF2EE] px-2 py-0.5 text-xs font-semibold text-[#0F533E]">
                  {item.category}
                </span>
              )}
              <span className="font-display font-bold text-[#141413]">
                {item.question[locale]}
              </span>
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="faq-chevron h-5 w-5 text-[#5C5A54]"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="faq-body pr-6 text-sm leading-relaxed text-[#5C5A54] sm:text-base">
            <p>{item.answer[locale]}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
