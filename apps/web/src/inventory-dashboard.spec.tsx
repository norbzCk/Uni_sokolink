import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { SellerInventoryPage } from './pages/seller/seller-inventory-page';

const fetchMock = vi.fn();
const seller = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  fullName: 'Ada Student',
  email: 'ada@ifm.ac.tz',
  phone: '+255700000000',
  status: 'ACTIVE',
  customerCategory: 'STUDENT',
  institution: 'IFM',
  studentRegistrationNumber: 'IFM-001',
  emailVerified: true,
  phoneVerified: true,
  roles: ['SELLER'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const products = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Healthy Product',
    unit: 'piece',
    status: 'APPROVED',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Low Stock Product',
    unit: 'piece',
    status: 'APPROVED',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Sold Out Product',
    unit: 'piece',
    status: 'APPROVED',
  },
];

const items = [
  {
    productId: products[0]!.id,
    onHand: 20,
    reserved: 2,
    available: 18,
    lowStockThreshold: 5,
    unit: 'piece',
    lowStock: false,
    outOfStock: false,
  },
  {
    productId: products[1]!.id,
    onHand: 6,
    reserved: 5,
    available: 1,
    lowStockThreshold: 2,
    unit: 'piece',
    lowStock: true,
    outOfStock: false,
  },
  {
    productId: products[2]!.id,
    onHand: 1,
    reserved: 1,
    available: 0,
    lowStockThreshold: 0,
    unit: 'piece',
    lowStock: true,
    outOfStock: true,
  },
];

function analytics(days: number) {
  return {
    range: { days, from: '2026-11-01T00:00:00.000Z', to: '2026-11-20T00:00:00.000Z' },
    summary: {
      products: 3,
      onHand: 27,
      reserved: 8,
      available: 19,
      lowStockProducts: 1,
      outOfStockProducts: 1,
      healthyProducts: 1,
      movementCount: 4,
      stockIn: 20,
      stockOut: 6,
      reservations: 8,
      releases: 2,
      netOnHand: 14,
    },
    trend: [
      {
        date: '2026-11-20',
        label: 'Nov 20',
        stockIn: 20,
        stockOut: 6,
        reserved: 8,
        released: 2,
        net: 14,
      },
    ],
    topMoved: [
      {
        productId: products[0]!.id,
        movements: 2,
        stockIn: 20,
        stockOut: 6,
        reserved: 2,
        released: 0,
      },
    ],
  };
}

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SellerInventoryPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockImplementation((input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/auth/refresh')) {
      return Promise.resolve(ok({ accessToken: 'token', expiresIn: 3600, user: seller }));
    }
    if (url.includes('/inventory/seller/analytics?days=7')) return Promise.resolve(ok(analytics(7)));
    if (url.includes('/inventory/seller/analytics')) return Promise.resolve(ok(analytics(30)));
    if (url.includes('/inventory/seller/items') && url.includes('/movements')) {
      return Promise.resolve(
        ok({
          item: items[1],
          movements: [
            {
              id: 'movement-1',
              type: 'ADJUSTMENT',
              onHandDelta: 2,
              reservedDelta: 0,
              onHandAfter: 6,
              reservedAfter: 5,
              reason: 'Physical stock count',
              reference: 'MANUAL_ADJUSTMENT',
              createdAt: '2026-11-20T10:00:00.000Z',
            },
          ],
        }),
      );
    }
    if (url.includes('/inventory/seller/items') && init?.method === 'POST') {
      return Promise.resolve(ok({ ...items[1], onHand: 10, available: 5 }));
    }
    if (url.includes('/inventory/seller/items') && init?.method === 'PATCH') {
      return Promise.resolve(ok({ ...items[1], lowStockThreshold: 3 }));
    }
    if (url.includes('/inventory/seller/items')) return Promise.resolve(ok({ items }));
    if (url.includes('/catalogue/seller/products')) return Promise.resolve(ok({ items: products }));
    return Promise.resolve(ok({}));
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('seller inventory dashboard', () => {
  it('renders visual analytics and filters stock items', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Stock control' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Stock in and stock out by day' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /3 products: 1 healthy, 1 low stock, 1 out of stock/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Needs attention (2)' }));

    expect(screen.queryByRole('heading', { name: 'Healthy Product' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Low Stock Product' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Sold Out Product' })).toBeTruthy();
  }, 20000);

  it('reloads analytics when the range changes', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Stock control' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '7 days' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => String(input).includes('days=7')),
      ).toBe(true);
    });
    const rangeButton = await screen.findByRole('button', { name: '7 days' });
    expect(rangeButton.getAttribute('aria-pressed')).toBe('true');
  }, 20000);

  it('submits a stock adjustment and refreshes the dashboard', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Stock control' })).toBeTruthy();

    const delta = screen.getByLabelText('Stock adjustment for Low Stock Product');
    const card = delta.closest('article');
    expect(card).toBeTruthy();
    fireEvent.change(delta, { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Adjustment reason for Low Stock Product'), {
      target: { value: 'Physical count correction' },
    });
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Adjust stock' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([, init]) =>
            init?.method === 'POST' &&
            String(init.body).includes('"quantityDelta":4') &&
            String(init.body).includes('Physical count correction'),
        ),
      ).toBe(true);
    });
  }, 20000);

  it('opens and closes an item movement history', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Stock control' })).toBeTruthy();

    const historyButton = screen.getAllByRole('button', { name: 'History' })[1]!;
    const card = historyButton.closest('article') as HTMLElement;
    fireEvent.click(historyButton);

    expect(await within(card).findByText(/Movement history/)).toBeTruthy();
    expect(within(card).getByText('Physical stock count')).toBeTruthy();
    fireEvent.click(within(card).getByRole('button', { name: 'Close history' }));
    expect(within(card).queryByText(/Movement history/)).toBeNull();
  }, 20000);
});
