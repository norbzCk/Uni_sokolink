import { Link } from 'react-router-dom';
import { contactDetails, uiCopy } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function Footer() {
  const { locale, setLocale } = useLocale();
  const nav = uiCopy[locale].nav;
  const foot = uiCopy[locale].footer;

  return (
    <footer className="border-t border-[#E4DFD3] bg-[#141413] text-[#FAF8F4]">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Description */}
          <div className="space-y-4 lg:col-span-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-[#FAF8F4]"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#0F533E] text-xs font-bold text-[#FAF8F4]"
              >
                S
              </span>
              <span>SokoLink</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[#FAF8F4]/75">
              {foot.description}
            </p>
            <div className="pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FAF8F4]/60">
                {foot.languageHeading}
              </p>
              <div className="mt-2 inline-flex rounded-md border border-[#FAF8F4]/20 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  aria-pressed={locale === 'en'}
                  className={`min-h-[32px] rounded px-3 py-1 font-semibold cursor-pointer ${
                    locale === 'en'
                      ? 'bg-[#0F533E] text-[#FAF8F4]'
                      : 'text-[#FAF8F4]/70 hover:text-[#FAF8F4]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('sw')}
                  aria-pressed={locale === 'sw'}
                  className={`min-h-[32px] rounded px-3 py-1 font-semibold cursor-pointer ${
                    locale === 'sw'
                      ? 'bg-[#0F533E] text-[#FAF8F4]'
                      : 'text-[#FAF8F4]/70 hover:text-[#FAF8F4]'
                  }`}
                >
                  Kiswahili
                </button>
              </div>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="space-y-2.5 lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#FAF8F4]/60">
              {foot.marketplaceHeading}
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/marketplace" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {nav.exploreProducts}
                </Link>
              </li>
              <li>
                <Link to="/shops" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {nav.discoverShops}
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {nav.faq}
                </Link>
              </li>
            </ul>
          </div>

          {/* Buyer Information */}
          <div className="space-y-2.5 lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#FAF8F4]/60">
              {foot.buyersHeading}
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/buyers" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {locale === 'en' ? 'How buying works' : 'Jinsi ya kununua'}
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {locale === 'en' ? 'Create buyer account' : 'Fungua akaunti ya mnunuzi'}
                </Link>
              </li>
              <li>
                <Link to="/sign-in" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {nav.signIn}
                </Link>
              </li>
            </ul>
          </div>

          {/* Seller Information */}
          <div className="space-y-2.5 lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#FAF8F4]/60">
              {foot.sellersHeading}
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/sellers" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {locale === 'en' ? 'Open a student shop' : 'Fungua duka la mwanafunzi'}
                </Link>
              </li>
              <li>
                <Link to="/sellers#seller-apply" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {locale === 'en' ? 'Seller verification' : 'Uhakiki wa muuzaji'}
                </Link>
              </li>
              <li>
                <Link to="/seller" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {locale === 'en' ? 'Seller workspace' : 'Eneo la muuzaji'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-2.5 lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#FAF8F4]/60">
              {foot.legalHeading}
            </h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/contact" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {foot.contact}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {foot.privacy}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#FAF8F4]/85 hover:text-[#FAF8F4]">
                  {foot.terms}
                </Link>
              </li>
              <li className="pt-1 text-xs text-[#FAF8F4]/65">
                <a href={`mailto:${contactDetails.email}`} className="underline">
                  {contactDetails.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#FAF8F4]/15 pt-6 text-xs text-[#FAF8F4]/65 sm:flex-row sm:items-center">
          <p>{foot.builtIn}</p>
          <p>© {new Date().getFullYear()} SokoLink · Dar es Salaam, Tanzania</p>
        </div>
      </div>
    </footer>
  );
}
