import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './app';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ message: 'No active session', code: 'UNAUTHENTICATED' }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('web foundation', () => {
  it('shows the SokoLink landing page', async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(
      await screen.findByRole('heading', { name: /good ideas deserve a place to grow/i }, { timeout: 15000 }),
    ).toBeTruthy();
  }, 20000);

  it('renders the account creation form', async () => {
    render(<MemoryRouter initialEntries={['/sign-up']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /start with a customer account/i }, { timeout: 15000 })).toBeTruthy();
    expect(screen.getByLabelText(/account type/i)).toBeTruthy();
    expect(screen.getByLabelText(/^institution$/i)).toBeTruthy();
    expect(screen.getByLabelText(/student registration number/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy();
  }, 20000);

  it('redirects account visitors without a session to sign in', async () => {
    render(<MemoryRouter initialEntries={['/account']}><App /></MemoryRouter>);
    expect(
      await screen.findByRole('heading', { name: /sign in to continue/i }, { timeout: 15000 }),
    ).toBeTruthy();
  }, 20000);

  it('shows the seller landing page to anonymous visitors', async () => {
    render(<MemoryRouter initialEntries={['/sell']}><App /></MemoryRouter>);
    expect(
      await screen.findByRole('heading', { name: /create an account to apply/i }, { timeout: 15000 }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /create account/i })).toBeTruthy();
  }, 20000);

  it('redirects anonymous seller workspace visitors to sign in', async () => {
    render(<MemoryRouter initialEntries={['/seller']}><App /></MemoryRouter>);
    expect(
      await screen.findByRole('heading', { name: /sign in to continue/i }, { timeout: 15000 }),
    ).toBeTruthy();
  }, 20000);
});
