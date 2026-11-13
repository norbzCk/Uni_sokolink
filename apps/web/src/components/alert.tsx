import type { ReactNode } from 'react';

interface AlertProps {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
}

export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div
      className={'alert alert-' + tone}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  );
}
