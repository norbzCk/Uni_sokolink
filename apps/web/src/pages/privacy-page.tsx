import { TagBadge } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { contactDetails } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function PrivacyPage() {
  const { locale } = useLocale();

  usePageMeta({
    title: 'Privacy Policy — SokoLink',
    description:
      'How SokoLink collects, uses, and protects account and seller onboarding data for the IFM student marketplace.',
  });

  const sections =
    locale === 'en'
      ? [
          {
            heading: '1. Data We Collect',
            body: 'When you create a SokoLink account or submit a student seller onboarding request, we collect your full name, email address, phone number, and (for seller applicants) your IFM programme and product category details.',
          },
          {
            heading: '2. How We Use Your Information',
            body: 'We use your contact and student information strictly to verify account ownership, review IFM student seller eligibility, send transactional security notifications, and operate marketplace orders.',
          },
          {
            heading: '3. Account Security & Storage',
            body: 'Passwords are hashed using Argon2id, sessions are managed via HTTP-only refresh tokens, and verification codes are stored as cryptographic hashes.',
          },
          {
            heading: '4. Retention & Contact',
            body: `Formal student verification document retention schedules: To be announced before launch. For data access or deletion requests, contact ${contactDetails.email}.`,
          },
        ]
      : [
          {
            heading: '1. Taarifa Tunazokusanya',
            body: 'Unapofungua akaunti ya SokoLink au kutuma ombi la kuwa muuzaji mwanafunzi, tunakusanya jina lako kamili, barua pepe, namba ya simu na kozi unayosoma IFM.',
          },
          {
            heading: '2. Matumizi ya Taarifa Zako',
            body: 'Tunatumia taarifa zako kuhakiki umiliki wa akaunti, kukagua sifa za uanafunzi wa IFM kwa wauzaji, na kuendesha huduma za soko pekee.',
          },
          {
            heading: '3. Usalama wa Akaunti',
            body: 'Nenosiri linahifadhiwa kwa usalama wa Argon2id na taarifa za uthibitisho zinalindwa kwa viwango vya kisasa.',
          },
          {
            heading: '4. Mawasiliano',
            body: `Sera kamili ya muda wa kuhifadhi nyaraka: To be announced before launch. Kwa maswali kuhusu faragha, wasiliana nasi kupitia ${contactDetails.email}.`,
          },
        ];

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b border-[#E4DFD3] pb-6">
        <TagBadge variant="subtle">
          {locale === 'en' ? 'LEGAL · PRIVACY' : 'SHERIA · FARAGHA'}
        </TagBadge>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#141413] sm:text-4xl">
          {locale === 'en' ? 'Privacy Policy' : 'Sera ya Faragha'}
        </h1>
        <p className="text-sm text-[#5C5A54]">
          {locale === 'en'
            ? 'Effective for the SokoLink IFM Dar es Salaam foundation release.'
            : 'Inatumika kwa toleo la msingi la SokoLink IFM Dar es Salaam.'}
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
