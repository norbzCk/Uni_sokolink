import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TagBadge, TagButton } from '../components/tag-button';
import { usePageMeta } from '../components/use-page-meta';
import { isValidEmailOrTzWhatsApp } from '../components/waitlist-form';
import { contactDetails } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function ContactPage() {
  const { locale } = useLocale();
  const baseId = useId();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  usePageMeta({
    title: 'Contact SokoLink | IFM Student Marketplace',
    description:
      'Get in touch with the SokoLink team in Dar es Salaam regarding student shops, buying, or campus partnerships.',
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (honeypot.trim() !== '') {
      setSent(true);
      return;
    }

    if (name.trim().length < 2) {
      setError(locale === 'en' ? 'Please enter your name.' : 'Tafadhali weka jina lako.');
      return;
    }

    if (!isValidEmailOrTzWhatsApp(contact)) {
      setError(
        locale === 'en'
          ? 'Please enter a valid email address or Tanzania phone number.'
          : 'Tafadhali weka barua pepe sahihi au namba ya simu ya Tanzania.',
      );
      return;
    }

    if (message.trim().length < 10) {
      setError(
        locale === 'en'
          ? 'Please write a short message (at least 10 characters).'
          : 'Tafadhali andika ujumbe mfupi (angalau herufi 10).',
      );
      return;
    }

    if (!privacyAccepted) {
      setError(
        locale === 'en'
          ? 'Please confirm the Privacy Policy before sending your message.'
          : 'Tafadhali kubaliana na Sera ya Faragha kabla ya kutuma ujumbe.',
      );
      return;
    }

    setSent(true);
    setName('');
    setContact('');
    setMessage('');
    setPrivacyAccepted(false);
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <TagBadge variant="subtle">
            {locale === 'en' ? 'CONTACT SOKOLINK' : 'WASILIANA NA SOKOLINK'}
          </TagBadge>
          <h1 className="font-display text-3xl font-bold text-[#141413] sm:text-4xl">
            {locale === 'en' ? 'Get in touch with our team.' : 'Wasiliana na timu yetu.'}
          </h1>
          <p className="text-sm leading-relaxed text-[#5C5A54] sm:text-base">
            {locale === 'en'
              ? 'Questions about opening an IFM student shop, buyer accounts, or campus pickup? Send us a message or reach us by email.'
              : 'Una swali kuhusu kufungua duka la mwanafunzi wa IFM au manunuzi? Tutumie ujumbe hapa.'}
          </p>

          <div className="space-y-4 rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F533E]">Email</h2>
              <a
                href={`mailto:${contactDetails.email}`}
                className="mt-1 inline-block font-display text-base font-bold text-[#141413] underline"
              >
                {contactDetails.email}
              </a>
            </div>
            <div className="border-t border-[#E4DFD3] pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F533E]">
                {locale === 'en' ? 'Campus community focus' : 'Eneo la huduma'}
              </h2>
              <p className="mt-1 text-sm text-[#5C5A54]">{contactDetails.campusArea}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#E4DFD3] bg-[#FFFFFF] p-6 sm:p-8 lg:col-span-7">
          {sent ? (
            <div role="status" aria-live="polite" className="space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0F533E]">
                {locale === 'en' ? 'Message received.' : 'Ujumbe wako umepokelewa.'}
              </h2>
              <p className="text-sm text-[#5C5A54]">
                {locale === 'en'
                  ? 'Thank you for reaching out. We will respond using the contact details you provided.'
                  : 'Asante kwa kuwasiliana nasi. Tutakujibu kupitia mawasiliano uliyoweka.'}
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="inline-flex min-h-[40px] items-center rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-4 text-xs font-semibold text-[#141413]"
              >
                {locale === 'en' ? 'Send another message' : 'Tuma ujumbe mwingine'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#141413]">
                {locale === 'en' ? 'Send a message' : 'Tuma ujumbe'}
              </h2>

              <div className="hidden" aria-hidden="true">
                <label htmlFor={`${baseId}-hp`}>Company</label>
                <input
                  id={`${baseId}-hp`}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={`${baseId}-name`} className="block text-xs font-semibold text-[#141413]">
                  {locale === 'en' ? 'Your name' : 'Jina lako'}
                </label>
                <input
                  id={`${baseId}-name`}
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
                />
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-contact`}
                  className="block text-xs font-semibold text-[#141413]"
                >
                  {locale === 'en' ? 'Email or phone number' : 'Barua pepe au namba ya simu'}
                </label>
                <input
                  id={`${baseId}-contact`}
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com / +255 712 345 678"
                  className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
                />
              </div>

              <div>
                <label htmlFor={`${baseId}-topic`} className="block text-xs font-semibold text-[#141413]">
                  {locale === 'en' ? 'Topic' : 'Mada'}
                </label>
                <select
                  id={`${baseId}-topic`}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] px-3.5 text-sm text-[#141413]"
                >
                  <option value="general">
                    {locale === 'en' ? 'General enquiry' : 'Swali la kawaida'}
                  </option>
                  <option value="seller">
                    {locale === 'en'
                      ? 'Opening an IFM student shop'
                      : 'Kufungua duka la mwanafunzi wa IFM'}
                  </option>
                  <option value="buyer">
                    {locale === 'en' ? 'Buyer account & orders' : 'Akaunti ya mnunuzi na oda'}
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-message`}
                  className="block text-xs font-semibold text-[#141413]"
                >
                  {locale === 'en' ? 'Message' : 'Ujumbe'}
                </label>
                <textarea
                  id={`${baseId}-message`}
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#CFC8B8] bg-[#FAF8F4] p-3.5 text-sm text-[#141413]"
                />
              </div>

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
                  I have read the{' '}
                  <Link to="/privacy" className="font-semibold text-[#0F533E] underline">
                    Privacy Policy
                  </Link>{' '}
                  and consent to SokoLink responding to this enquiry.
                </span>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-[#e6b8b3] bg-[#fdf3f2] px-3.5 py-2.5 text-xs font-semibold text-[#8f2d24]"
                >
                  {error}
                </p>
              )}

              <TagButton type="submit" variant="forest">
                {locale === 'en' ? 'Send message' : 'Tuma ujumbe'}
              </TagButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
