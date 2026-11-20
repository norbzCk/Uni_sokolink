import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './app';

const fetchMock = vi.fn();

const product = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'test-product',
  name: 'Test Product',
  description: 'A product used to exercise marketplace interactions.',
  condition: 'NEW',
  brand: null,
  model: null,
  unit: 'piece',
  priceTzs: 5000,
  currency: 'TZS',
  status: 'APPROVED',
  seller: { id: '22222222-2222-2222-2222-222222222222', name: 'IFM Store' },
  category: { id: '33333333-3333-3333-3333-333333333333', slug: 'books', name: 'Books' },
  images: [],
  specifications: [],
  stock: {
    onHand: 10,
    reserved: 0,
    available: 10,
    lowStockThreshold: 2,
    unit: 'piece',
    inStock: true,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function fail() {
  return { ok: false, status: 401, json: async () => ({ message: 'No active session' }) };
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockImplementation((input: unknown) => {
    const url = String(input);
    if (url.includes('/auth/refresh')) return Promise.resolve(fail());
    if (url.includes('/catalogue/categories')) return Promise.resolve(ok([]));
    if (url.includes('/catalogue/products/test-product/related')) return Promise.resolve(ok([]));
    if (url.includes('/catalogue/products/test-product')) return Promise.resolve(ok(product));
    if (url.includes('/catalogue/products')) {
      return Promise.resolve(ok({ items: [product], total: 1, page: 1, pageSize: 20, totalPages: 1 }));
    }
    return Promise.resolve(fail());
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('marketplace interactions', () => {
  it('adds a product to the cart from the product page', async () => {
    render(<MemoryRouter initialEntries={['/p/test-product']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Test Product' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Add to cart' })[0]!);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Cart with 1 items').length).toBeGreaterThan(0);
    });
  }, 20000);

  it('keeps a saved product in the local wishlist', async () => {
    render(<MemoryRouter initialEntries={['/p/test-product']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Test Product' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /add to wishlist/i }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('sokolink.wishlist.v1') ?? '[]');
      expect(saved).toContain(product.id);
    });
    expect(screen.getByRole('button', { name: /saved/i }).getAttribute('aria-pressed')).toBe('true');
  }, 20000);

  it('sends Buy now to checkout', async () => {
    render(<MemoryRouter initialEntries={['/p/test-product']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Test Product' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Buy now' })[0]!);

    expect(await screen.findByRole('heading', { name: /sign in to continue/i })).toBeTruthy();
  }, 20000);

  it('does not expose a non-functional language switcher', async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /good ideas deserve a place to grow/i })).toBeTruthy();
    expect(screen.queryByTitle('Language')).toBeNull();
  }, 20000);

  it('accepts a contact message from the contact page', async () => {
    render(<MemoryRouter initialEntries={['/contact']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /talk to sokolink/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ada Student' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ada@ifm.ac.tz' } });
    fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: 'I need help with my order.' } });

    expect((screen.getByLabelText(/your name/i) as HTMLInputElement).value).toBe('Ada Student');
    expect(screen.getByRole('button', { name: /open email draft/i })).toBeTruthy();
  }, 20000);
});
