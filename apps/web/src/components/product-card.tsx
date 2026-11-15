import { Link } from 'react-router-dom';
import { formatTzs, type DemoProduct } from '../data/demo-marketplace';
import { useLocale } from '../i18n/locale-context';

interface ProductCardProps {
  product: DemoProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { locale } = useLocale();

  return (
    <article className="commerce-card">
      <img
        src={product.image}
        alt={product.name[locale]}
        width={800}
        height={600}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="card-media"
      />

      <header className="px-4 pt-4 pb-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-[#0F533E]">{product.categoryLabel[locale]}</span>
          <span className="rounded bg-[#F3EFE6] px-2 py-0.5 text-[11px] font-medium text-[#5C5A54]">
            {product.availability[locale]}
          </span>
        </div>
        <h3 className="font-display text-base font-bold leading-snug text-[#141413]">
          <Link to={`/products/${product.id}`} className="card-link">
            {product.name[locale]}
          </Link>
        </h3>
      </header>

      <div className="px-4 py-2 space-y-1.5 text-xs text-[#5C5A54]">
        <p className="line-clamp-2 leading-relaxed">{product.summary[locale]}</p>
        <p className="pt-1">
          <span className="text-[#78756E]">{locale === 'en' ? 'Shop: ' : 'Duka: '}</span>
          <Link
            to={`/shops/${product.shopSlug}`}
            className="font-semibold text-[#141413] underline decoration-[#CFC8B8] underline-offset-2 hover:text-[#0F533E]"
          >
            {product.shopName}
          </Link>
        </p>
      </div>

      <footer className="mt-2 flex items-center justify-between border-t border-[#E4DFD3] px-4 py-3">
        <span className="font-display text-base font-bold tabular-nums text-[#141413]">
          {formatTzs(product.priceTzs)}
        </span>
        <span className="text-xs font-semibold text-[#0F533E]">
          {locale === 'en' ? 'View details →' : 'Maelezo →'}
        </span>
      </footer>
    </article>
  );
}
