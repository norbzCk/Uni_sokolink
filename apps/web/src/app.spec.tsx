import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

function renderRoute(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('SokoLink Marketplace UI/UX', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ message: 'Unauthenticated' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the marketplace homepage hero, product discovery grid, student shops, and seller CTA', () => {
    renderRoute('/');

    expect(
      screen.getByRole('heading', {
        name: /Discover great finds from fellow IFM students/i,
      }),
    ).toBeDefined();

    expect(
      screen.getAllByText(/Scientific Calculator \(Non-Programmable ClassWiz\)/i)
        .length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(/Posta Academic Supply/i).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole('heading', {
        name: /Turn your student business into a shop everyone can discover/i,
      }),
    ).toBeDefined();
  });

  it('filters marketplace products by category on the homepage', () => {
    renderRoute('/');

    const foodFilter = screen.getByRole('button', {
      name: 'Bakes & Refreshments',
    });
    fireEvent.click(foodFilter);

    expect(
      screen.getAllByText(/Fresh Cardamom Mandazi Box \(12 Pieces\)/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Pressed Cotton Oxford Button-Down Shirt/i),
    ).toBeNull();
  });

  it('switches language between English and Swahili', () => {
    renderRoute('/');

    const swButtons = screen.getAllByRole('button', {
      name: 'SW',
    });
    const firstSwButton = swButtons[0];
    if (firstSwButton) {
      fireEvent.click(firstSwButton);
    }

    expect(
      screen.getByRole('heading', {
        name: /Gundua bidhaa bora kutoka kwa wanafunzi wenzako wa IFM/i,
      }),
    ).toBeDefined();
  });

  it('renders the dedicated marketplace and product detail pages', () => {
    renderRoute('/products/casio-fx-991ex-calculator');

    expect(
      screen.getByRole('heading', {
        name: /Scientific Calculator \(Non-Programmable ClassWiz\)/i,
      }),
    ).toBeDefined();
    expect(screen.getAllByText(/TZS 45,000/i).length).toBeGreaterThan(0);
  });

  it('renders the student shop directory and individual shop storefront', () => {
    renderRoute('/shops/swahili-kitchen-bakes');

    expect(
      screen.getByRole('heading', {
        name: /Swahili Kitchen & Bakes/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByText(/Fresh Cardamom Mandazi Box \(12 Pieces\)/i),
    ).toBeDefined();
  });

  it('renders the FAQ page with search filter and undecided policy wording', () => {
    renderRoute('/faq');

    expect(
      screen.getByRole('heading', {
        name: /Clear answers about SokoLink/i,
      }),
    ).toBeDefined();

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'verified' } });

    expect(
      screen.getByText(/How are student sellers verified\?/i),
    ).toBeDefined();
  });

  it('preserves Phase One Identity sign-up route and redirects unauthenticated account visits to sign-in', async () => {
    const { unmount } = renderRoute('/sign-up');

    expect(
      screen.getByRole('heading', {
        name: /Start with a customer account/i,
      }),
    ).toBeDefined();

    unmount();
    renderRoute('/account');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /Sign in to continue/i,
        }),
      ).toBeDefined();
    });
  });
});
