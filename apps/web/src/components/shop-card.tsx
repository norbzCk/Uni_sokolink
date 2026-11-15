import { Link } from 'react-router-dom';
import { DEMO_PRODUCTS, type DemoShop } from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

interface ShopCardProps {
  shop: DemoShop;
}

export function ShopCard({ shop }: ShopCardProps) {
  const { locale } = useLocale();
  const productCount = DEMO_PRODUCTS.filter((p) => p.shopSlug === shop.slug).length;

  return (
    <article className="commerce-card">
      <img
        src={shop.image}
        alt={shop.name}
        width={600}
        height={400}
        loading="lazy"
        decoding="async"
        className="shop-media"
      />

      <header className="px-5 pt-4 pb-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded bg-[#EAF2EE] px-2 py-0.5 font-semibold text-[#0F533E]">
            {shop.categoryLabel[locale]}
          </span>
          <span className="text-[11px] font-medium text-[#78756E]">
            {productCount} {locale === 'en' ? 'sample items' : 'bidhaa za mfano'}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold text-[#141413]">
          <Link to={`/shops/${shop.slug}`} className="card-link">
            {shop.name}
          </Link>
        </h3>
      </header>

      <div className="px-5 py-2 space-y-2 text-xs text-[#5C5A54]">
        <p className="leading-relaxed text-sm text-[#141413]/85">{shop.tagline[locale]}</p>
        <p className="text-xs text-[#5C5A54]">{shop.pickupLocation[locale]}</p>
        <p className="rounded border border-[#E4DFD3] bg-[#FAF8F4] px-2.5 py-1.5 text-[11px] text-[#5C5A54]">
          {shop.verificationNote[locale]}
        </p>
      </div>

      <footer className="mt-2 flex items-center justify-between border-t border-[#E4DFD3] px-5 py-3">
        <span className="text-xs font-medium text-[#5C5A54]">IFM Main Campus</span>
        <span className="text-xs font-semibold text-[#0F533E]">
          {locale === 'en' ? 'View shop →' : 'Fungua duka →'}
        </span>
      </footer>
    </article>
  );
}
