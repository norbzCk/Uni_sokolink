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
      await screen.findByRole('heading', { name: /good ideas deserve a place to grow/i }),
    ).toBeTruthy();
  });

  it('renders the account creation form', async () => {
    render(<MemoryRouter initialEntries={['/sign-up']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /start with a customer account/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy();
  });

  it('redirects account visitors without a session to sign in', async () => {
    render(<MemoryRouter initialEntries={['/account']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: /sign in to continue/i })).toBeTruthy();
  });
});
