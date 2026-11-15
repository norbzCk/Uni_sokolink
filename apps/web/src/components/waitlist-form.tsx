import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/locale-context';
import { TagButton } from './tag-button';

export type InterestRole = 'buyer' | 'seller';

interface WaitlistFormProps {
  defaultRole?: InterestRole;
  showSellerFields?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TZ_PHONE_PATTERN = /^(?:\+?255|0)[67]\d{8}$/;

export function isValidEmailOrTzWhatsApp(raw: string): boolean {
  const cleaned = raw.trim();
  if (!cleaned) return false;
  if (cleaned.includes('@')) {
    return EMAIL_PATTERN.test(cleaned);
  }
  const digitsOnly = cleaned.replace(/[\s()-]/g, '');
  return TZ_PHONE_PATTERN.test(digitsOnly);
}

export function WaitlistForm({
  defaultRole = 'buyer',
  showSellerFields = false,
}: WaitlistFormProps) {
  const { locale } = useLocale();
  const baseId = useId();
  const [role, setRole] = useState<InterestRole>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [studyProgramme, setStudyProgramme] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedRole, setSubmittedRole] = useState<InterestRole | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (honeypot.trim() !== '') {
      setSubmittedRole(role);
      return;
    }

    if ((role === 'seller' || showSellerFields) && fullName.trim().length < 2) {
      setErrorMessage(
        locale === 'en'
          ? 'Please enter your full name as shown on your IFM student ID.'
          : 'Tafadhali weka jina lako kamili kama linavyoonekana kwenye kitambulisho cha IFM.',
      );
      return;
    }

    if (!isValidEmailOrTzWhatsApp(contactValue)) {
      setErrorMessage(
        locale === 'en'
          ? 'Enter a valid email address (e.g. student@example.com) or Tanzania phone number (e.g. +255 712 345 678).'
          : 'Weka barua pepe sahihi au namba ya simu ya Tanzania (mfano +255 712 345 678).',
      );
      return;
    }

    if ((role === 'seller' || showSellerFields) && studyProgramme.trim().length < 2) {
      setErrorMessage(
        locale === 'en'
          ? 'Please include your IFM course and year of study for manual eligibility review.'
          : 'Tafadhali taja kozi na mwaka wako wa masomo IFM kwa ajili ya uhakiki.',
      );
      return;
    }

    if (!privacyAccepted) {
      setErrorMessage(
        locale === 'en'
          ? 'Please confirm that you have read the Privacy Policy before submitting.'
          : 'Tafadhali thibitisha kuwa umesoma Sera ya Faragha kabla ya kutuma.',
      );
      return;
    }

    setSubmittedRole(role);
    setFullName('');
    setContactValue('');
    setStudyProgramme('');
    setProductCategory('');
    setPrivacyAccepted(false);
  };

  if (submittedRole) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-[#b7d4c8] bg-[#EAF2EE] p-6 text-[#141413]"
      >
        <p className="font-display text-lg font-bold text-[#0F533E]">
          {locale === 'en'
            ? 'Request recorded — thank you.'
            : 'Ombi lako limepokelewa — asante.'}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5C5A54]">
          {submittedRole === 'seller'
            ? locale === 'en'
              ? 'Your seller onboarding interest is queued. Remember that you can also create your base SokoLink customer account right now.'
              : 'Ombi lako la uuzaji limepokelewa. Unaweza pia kufungua akaunti yako ya SokoLink sasa.'
            : locale === 'en'
              ? 'We will notify you as student storefronts open on campus.'
              : 'Tutakujulisha maduka ya wanafunzi yatakapofunguliwa rasmi.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/sign-up"
            className="inline-flex min-h-[40px] items-center rounded-md bg-[#0F533E] px-4 text-xs font-semibold text-[#FAF8F4]"
          >
            {locale === 'en' ? 'Create SokoLink account →' : 'Fungua akaunti ya SokoLink →'}
          </Link>
          <button
            type="button"
            onClick={() => setSubmittedRole(null)}
            className="text-xs font-semibold text-[#0F533E] underline"
          >
            {locale === 'en' ? 'Submit another response' : 'Tuma taarifa nyingine'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5C5A54]">
          {locale === 'en' ? 'Select your role' : 'Chagua lengo lako'}
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            aria-pressed={role === 'buyer'}
            onClick={() => setRole('buyer')}
            className={`min-h-[42px] rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
              role === 'buyer'
                ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                : 'border-[#CFC8B8] bg-[#FAF8F4] text-[#141413]'
            }`}
          >
            {locale === 'en' ? 'Campus Buyer' : 'Mnunuzi Chuoni'}
          </button>
          <button
            type="button"
            aria-pressed={role === 'seller'}
            onClick={() => setRole('seller')}
            className={`min-h-[42px] rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
              role === 'seller'
                ? 'border-[#0F533E] bg-[#0F533E] text-[#FAF8F4]'
                : 'border-[#CFC8B8] bg-[#FAF8F4] text-[#141413]'
            }`}
          >
            {locale === 'en' ? 'IFM Student Seller' : 'Muuzaji Mwanafunzi IFM'}
          </button>
        </div>
      </fieldset>

      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${baseId}-website`}>Leave empty</label>
        <input
          id={`${baseId}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {(role === 'seller' || showSellerFields) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${baseId}-fullname`}
              className="block text-xs font-semibold text-[#141413]"
            >
              {locale === 'en' ? 'Full name (as on IFM ID)' : 'Jina kamili (kwenye kitambulisho cha IFM)'}
            </label>
            <input
              id={`${baseId}-fullname`}
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Neema Mwakasege"
              className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-programme`}
              className="block text-xs font-semibold text-[#141413]"
            >
              {locale === 'en' ? 'IFM programme & year' : 'Kozi na mwaka wa masomo IFM'}
            </label>
            <input
              id={`${baseId}-programme`}
              type="text"
              required
              value={studyProgramme}
              onChange={(e) => setStudyProgramme(e.target.value)}
              placeholder="e.g. BSc Accountancy · Year 2"
              className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
            />
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor={`${baseId}-contact`}
          className="block text-xs font-semibold text-[#141413]"
        >
          {locale === 'en' ? 'Email address or phone number' : 'Barua pepe au namba ya simu'}
        </label>
        <input
          id={`${baseId}-contact`}
          type="text"
          required
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          placeholder="you@example.com / +255 712 345 678"
          className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
        />
      </div>

      {(role === 'seller' || showSellerFields) && (
        <div>
          <label
            htmlFor={`${baseId}-category`}
            className="block text-xs font-semibold text-[#141413]"
          >
            {locale === 'en'
              ? 'Product category you plan to sell (Optional)'
              : 'Kategoria ya bidhaa unayopanga kuuza (Hiari)'}
          </label>
          <input
            id={`${baseId}-category`}
            type="text"
            value={productCategory}
            onChange={(e) => setProductCategory(e.target.value)}
            placeholder="e.g. Academic stationery, campus bakes, electronics"
            className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
          />
        </div>
      )}

      <label
        htmlFor={`${baseId}-privacy`}
        className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[#5C5A54]"
      >
        <input
          id={`${baseId}-privacy`}
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F533E]"
        />
        <span>
          {locale === 'en' ? (
            <>
              I have read the{' '}
              <Link to="/privacy" className="font-semibold text-[#0F533E] underline">
                Privacy Policy
              </Link>{' '}
              and consent to SokoLink contacting me regarding IFM onboarding.
            </>
          ) : (
            <>
              Nimesoma{' '}
              <Link to="/privacy" className="font-semibold text-[#0F533E] underline">
                Sera ya Faragha
              </Link>{' '}
              na kuridhia kuwasiliana na SokoLink.
            </>
          )}
        </span>
      </label>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md border border-[#e6b8b3] bg-[#fdf3f2] px-3.5 py-2.5 text-xs font-semibold text-[#8f2d24]"
        >
          {errorMessage}
        </p>
      )}

      <TagButton type="submit" variant="forest">
        {role === 'seller'
          ? locale === 'en'
            ? 'Submit seller onboarding request'
            : 'Wasilisha ombi la uuzaji'
          : locale === 'en'
            ? 'Join buyer notification list'
            : 'Jiunge kwenye orodha ya wanunuzi'}
      </TagButton>
    </form>
  );
}
