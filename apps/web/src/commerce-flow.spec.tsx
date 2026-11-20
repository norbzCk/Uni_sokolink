import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { CartProvider } from './cart/cart-context';
import { CheckoutPage } from './pages/checkout-page';
import { SellerProductFormPage } from './pages/seller/seller-product-form-page';

const fetchMock = vi.fn();
const categoryId = '33333333-3333-3333-3333-333333333333';
const productId = '11111111-1111-1111-1111-111111111111';
let currentUser: Record<string, unknown>;

const baseUser = {
  fullName: 'Ada Student',
  email: 'ada@ifm.ac.tz',
  phone: '+255700000000',
  status: 'ACTIVE',
  customerCategory: 'STUDENT',
  institution: 'IFM',
  studentRegistrationNumber: 'IFM-001',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function renderWithProviders(node: ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>{node}</CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  currentUser = { ...baseUser, id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', roles: ['SELLER'] };
  fetchMock.mockReset();
  fetchMock.mockImplementation((input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/auth/refresh')) {
      return Promise.resolve(ok({ accessToken: 'token', expiresIn: 3600, user: currentUser }));
    }
    if (url.includes('/catalogue/categories')) {
      return Promise.resolve(ok([{ id: categoryId, name: 'Books', slug: 'books' }]));
    }
    if (url.includes('/catalogue/seller/products') && init?.method === 'POST') {
      return Promise.resolve(ok({ id: productId, name: 'Field Guide' }));
    }
    if (url.includes('/payment/methods')) {
      return Promise.resolve(
        ok([
          {
            code: 'CASH_ON_DELIVERY',
            name: 'Cash on delivery',
            description: 'Pay when your order arrives.',
            kind: 'CASH',
            instructions: null,
          },
        ]),
      );
    }
    if (url.includes('/orders') && init?.method === 'POST') {
      return Promise.resolve(ok({ id: 'order-1', orderNumber: 'ORD-1' }));
    }
    return Promise.resolve(ok({}));
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('marketplace core flows', () => {
  it('lets a seller create a product draft with opening stock', async () => {
    renderWithProviders(<SellerProductFormPage />);
    expect(await screen.findByRole('heading', { name: 'Create a listing' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Field Guide' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: categoryId } });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'A practical field guide for campus students.' },
    });
    fireEvent.change(screen.getByLabelText('Price (TZS)'), { target: { value: '12000' } });
    fireEvent.change(screen.getByLabelText('Opening stock'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Low stock alert at'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            String(input).includes('/catalogue/seller/products') &&
            init?.method === 'POST' &&
            String(init.body).includes('"name":"Field Guide"') &&
            String(init.body).includes('"openingStock":15') &&
            String(init.body).includes('"categoryId":"' + categoryId + '"'),
        ),
      ).toBe(true);
    });
  }, 20000);

  it('lets a customer place an order from the cart', async () => {
    currentUser = { ...baseUser, id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', roles: ['CUSTOMER'] };
    localStorage.setItem(
      'sokolink.cart.v1',
      JSON.stringify([
        {
          productId,
          slug: 'field-guide',
          name: 'Field Guide',
          priceTzs: 12000,
          unit: 'piece',
          imageUrl: null,
          sellerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          sellerName: 'IFM Store',
          quantity: 2,
          available: 15,
        },
      ]),
    );

    renderWithProviders(<CheckoutPage />);
    expect(await screen.findByRole('heading', { name: 'Complete your order' })).toBeTruthy();
    expect(await screen.findByText('Cash on delivery')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Contact name'), { target: { value: 'Ada Student' } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+255700000000' } });
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Ilala' } });
    fireEvent.change(screen.getByLabelText('Delivery address'), {
      target: { value: 'IFM Campus, Dar es Salaam' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            String(input).includes('/orders') &&
            init?.method === 'POST' &&
            String(init.body).includes('"productId":"' + productId + '"') &&
            String(init.body).includes('"quantity":2') &&
            String(init.body).includes('"paymentMethodCode":"CASH_ON_DELIVERY"') &&
            String(init.body).includes('"district":"Ilala"'),
        ),
      ).toBe(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('sokolink.cart.v1')).toBe('[]');
    });
  }, 20000);
});
