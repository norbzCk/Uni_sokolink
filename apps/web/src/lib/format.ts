export function formatTzs(amount: number): string {
  return 'TZS ' + new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Preparing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function statusTone(status: string): string {
  if (status === 'DELIVERED' || status === 'APPROVED' || status === 'ACTIVE') return 'badge-success';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'badge-danger';
  if (status === 'PENDING' || status === 'PLACED') return 'badge-warning';
  return 'badge-neutral';
}
