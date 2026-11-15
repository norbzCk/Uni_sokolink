import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type TagVariant = 'forest' | 'accent' | 'outline' | 'subtle' | 'orange' | 'green' | 'cream' | 'ink';

const variantStyles: Record<TagVariant, string> = {
  forest: 'bg-[#0F533E] text-[#FAF8F4] border border-[#0F533E] hover:bg-[#0A3D2E] font-semibold',
  green: 'bg-[#0F533E] text-[#FAF8F4] border border-[#0F533E] hover:bg-[#0A3D2E] font-semibold',
  accent: 'bg-[#D95D24] text-[#FFFFFF] border border-[#BF4E1B] hover:bg-[#BF4E1B] font-semibold',
  orange: 'bg-[#D95D24] text-[#FFFFFF] border border-[#BF4E1B] hover:bg-[#BF4E1B] font-semibold',
  outline:
    'bg-[#FFFFFF] text-[#141413] border border-[#CFC8B8] hover:bg-[#F3EFE6] hover:border-[#141413] font-semibold',
  subtle: 'bg-[#EAF2EE] text-[#0F533E] border border-[#b7d4c8] font-semibold',
  cream: 'bg-[#FAF8F4] text-[#141413] border border-[#E4DFD3] font-semibold',
  ink: 'bg-[#141413] text-[#FAF8F4] border border-[#141413] font-semibold',
};

interface BaseTagProps {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}

export interface TagButtonProps
  extends BaseTagProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {}

export function TagButton({
  variant = 'forest',
  children,
  className = '',
  type = 'button',
  ...rest
}: TagButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors cursor-pointer ${variantStyles[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface TagLinkProps extends BaseTagProps, Omit<LinkProps, 'children' | 'className'> {}

export function TagLink({
  variant = 'forest',
  children,
  className = '',
  ...rest
}: TagLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors ${variantStyles[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function TagBadge({
  variant = 'subtle',
  children,
  className = '',
}: BaseTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold tracking-wide ${variantStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
