import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { uiCopy } from '../content/site-content';
import { useLocale } from '../i18n/locale-context';

export function Header() {
  const { user, status } = useAuth();
  const { locale, setLocale } = useLocale();
  const copy = uiCopy[locale].nav;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const win = globalThis.window;
    if (!win) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-2.5 py-1.5 text-sm font-medium rounded transition-colors ${
      isActive
        ? 'text-[#0F533E] font-semibold bg-[#EAF2EE]'
        : 'text-[#141413] hover:text-[#0F533E] hover:bg-[#F3EFE6]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4DFD3] bg-[#FAF8F4]/95 backdrop-blur-xs">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* SokoLink Brand Logo */}
        <Link
          to="/"
          aria-label="SokoLink home"
          className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-[#141413]"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#0F533E] text-sm font-bold text-[#FAF8F4]"
          >
            S
          </span>
          <span>SokoLink</span>
        </Link>

        {/* Desktop Marketplace Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex lg:items-center lg:gap-1">
          <NavLink to="/marketplace" className={navLinkClass}>
            {copy.exploreProducts}
          </NavLink>
          <NavLink to="/shops" className={navLinkClass}>
            {copy.discoverShops}
          </NavLink>
          <Link
            to="/#how-it-works"
            className="inline-flex items-center rounded px-2.5 py-1.5 text-sm font-medium text-[#141413] transition-colors hover:bg-[#F3EFE6] hover:text-[#0F533E]"
          >
            {copy.howItWorks}
          </Link>
          <NavLink to="/faq" className={navLinkClass}>
            {copy.faq}
          </NavLink>
          {user?.roles.includes('SELLER') && (
            <NavLink to="/seller" className={navLinkClass}>
              Seller workspace
            </NavLink>
          )}
          {(user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN')) && (
            <NavLink to="/admin" className={navLinkClass}>
              Administration
            </NavLink>
          )}
        </nav>

        {/* Right Controls: Language Selector + Sign in + Join SokoLink */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Language selector"
            className="inline-flex items-center rounded-md border border-[#E4DFD3] bg-[#FFFFFF] p-0.5 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
              className={`min-h-[32px] rounded px-2.5 py-1 transition-colors cursor-pointer ${
                locale === 'en'
                  ? 'bg-[#0F533E] text-[#FAF8F4]'
                  : 'text-[#5C5A54] hover:text-[#141413]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale('sw')}
              aria-pressed={locale === 'sw'}
              className={`min-h-[32px] rounded px-2.5 py-1 transition-colors cursor-pointer ${
                locale === 'sw'
                  ? 'bg-[#0F533E] text-[#FAF8F4]'
                  : 'text-[#5C5A54] hover:text-[#141413]'
              }`}
            >
              SW
            </button>
          </div>

          {status === 'loading' ? (
            <span className="hidden text-xs text-[#5C5A54] sm:inline">Checking session…</span>
          ) : user ? (
            <Link
              to="/account"
              className="inline-flex min-h-[40px] items-center rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-3.5 text-sm font-semibold text-[#141413] hover:bg-[#F3EFE6]"
            >
              {user.fullName.split(' ')[0]}
            </Link>
          ) : (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Link
                to="/sign-in"
                className="inline-flex min-h-[40px] items-center rounded-md px-3 text-sm font-semibold text-[#141413] hover:bg-[#F3EFE6] hover:text-[#0F533E]"
              >
                {copy.signIn}
              </Link>
              <Link
                to="/sign-up"
                className="inline-flex min-h-[40px] items-center rounded-md bg-[#0F533E] px-4 text-sm font-semibold text-[#FAF8F4] transition-colors hover:bg-[#0A3D2E]"
              >
                {copy.join}
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger (44x44px touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E4DFD3] bg-[#FFFFFF] text-[#141413] lg:hidden"
          >
            {mobileMenuOpen ? (
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path
                  d="M3.5 6H16.5M3.5 10H16.5M3.5 14H16.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-site-menu"
          className="border-t border-[#E4DFD3] bg-[#FAF8F4] px-5 py-4 lg:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col divide-y divide-[#E4DFD3]">
            <NavLink
              to="/marketplace"
              className="flex min-h-[48px] items-center justify-between text-base font-semibold text-[#141413]"
            >
              <span>{copy.exploreProducts}</span>
              <span aria-hidden="true" className="text-[#5C5A54]">→</span>
            </NavLink>
            <NavLink
              to="/shops"
              className="flex min-h-[48px] items-center justify-between text-base font-semibold text-[#141413]"
            >
              <span>{copy.discoverShops}</span>
              <span aria-hidden="true" className="text-[#5C5A54]">→</span>
            </NavLink>
            <Link
              to="/#how-it-works"
              className="flex min-h-[48px] items-center justify-between text-base font-semibold text-[#141413]"
            >
              <span>{copy.howItWorks}</span>
              <span aria-hidden="true" className="text-[#5C5A54]">→</span>
            </Link>
            <NavLink
              to="/faq"
              className="flex min-h-[48px] items-center justify-between text-base font-semibold text-[#141413]"
            >
              <span>{copy.faq}</span>
              <span aria-hidden="true" className="text-[#5C5A54]">→</span>
            </NavLink>
            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Link
                  to="/sign-in"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#CFC8B8] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#141413]"
                >
                  {copy.signIn}
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0F533E] px-4 text-sm font-semibold text-[#FAF8F4]"
                >
                  {copy.join}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
