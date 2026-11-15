import type { WorkflowStep } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

interface StepListProps {
  steps: WorkflowStep[];
}

export function StepList({ steps }: StepListProps) {
  const { locale } = useLocale();

  return (
    <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {steps.map((step) => (
        <li
          key={step.number}
          className="flex flex-col justify-between rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4DFD3] pb-3">
              <span className="font-display text-2xl font-bold tabular-nums text-[#0F533E]">
                {step.number}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#78756E]">
                {locale === 'en' ? `Step ${step.number}` : `Hatua ${step.number}`}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold leading-snug text-[#141413]">
              {step.title[locale]}
            </h3>
            <p className="text-sm leading-relaxed text-[#5C5A54]">
              {step.description[locale]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
