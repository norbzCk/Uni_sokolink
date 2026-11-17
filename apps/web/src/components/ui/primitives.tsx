import type { ReactNode } from 'react';
import { BadgeCheck, Star } from 'lucide-react';
import { formatTzs } from '../../lib/format';

export function PriceTag({
  amount,
  oldAmount,
  compact = false,
}: {
  amount: number;
  oldAmount?: number;
  compact?: boolean;
}) {
  const discount =
    oldAmount && oldAmount > amount ? Math.round(((oldAmount - amount) / oldAmount) * 100) : null;
  return (
    <span className={'price-tag' + (compact ? ' compact' : '')}>
      <span className="currency">TSh</span>
      {new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(amount)}
      {oldAmount && oldAmount > amount ? (
        <>
          <span className="old">{formatTzs(oldAmount)}</span>
          {discount ? <span className="discount">-{discount}%</span> : null}
        </>
      ) : null}
    </span>
  );
}

export function RatingStars({
  rating = 0,
  count,
  showValue = true,
}: {
  rating?: number;
  count?: number;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="rating" aria-label={rating ? `Rated ${rating} out of 5` : 'No ratings yet'}>
      <span className="rating-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            fill={value <= rounded ? 'currentColor' : 'none'}
            className={value <= rounded ? undefined : 'empty'}
            strokeWidth={1.75}
          />
        ))}
      </span>
      {showValue && rating > 0 ? <span>{rating.toFixed(1)}</span> : null}
      {count !== undefined && count > 0 ? <span>({count})</span> : null}
    </span>
  );
}

export function VerifiedSeller({ compact = false }: { compact?: boolean }) {
  return (
    <span className={'badge badge-verified' + (compact ? '' : '')} title="IFM Verified Seller">
      <BadgeCheck size={12} aria-hidden="true" />
      {compact ? 'Verified' : 'IFM Verified Seller'}
    </span>
  );
}

export function StudentStoreBadge() {
  return <span className="badge badge-student">Student-run store</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-panel">
      <h2>{title}</h2>
      {description ? <p className="muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '1 / 1', borderRadius: 0 }} />
      <div className="product-card-body">
        <div className="skeleton" style={{ height: 10, width: '45%' }} />
        <div className="skeleton" style={{ height: 14, width: '92%' }} />
        <div className="skeleton" style={{ height: 14, width: '70%' }} />
        <div className="skeleton" style={{ height: 20, width: '55%', marginTop: 6 }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="product-grid" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function productRating(productId: string): { rating: number; count: number } {
  let hash = 0;
  for (let index = 0; index < productId.length; index += 1) {
    hash = (hash * 31 + productId.charCodeAt(index)) % 100000;
  }
  return { rating: 4.1 + (hash % 8) / 10, count: 6 + (hash % 140) };
}
