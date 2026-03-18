import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppNavbar } from './AppNavbar';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

jest.mock('../stores/authStore');
jest.mock('../stores/cartStore');

const mockLogout = jest.fn().mockResolvedValue(undefined);

const makeAuthState = (user: any) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { user, logout: mockLogout };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

const makeCartState = (itemCount: number) => {
  (useCartStore as jest.Mock).mockImplementation((selector: any) => {
    const state = { totals: { itemCount } };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  makeCartState(0);
});

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AppNavbar — logged out', () => {
  beforeEach(() => makeAuthState(null));

  it('shows Login link', () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows Register link', () => {
    wrap(<AppNavbar />);
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('does not show user dropdown', () => {
    wrap(<AppNavbar />);
    expect(screen.queryByText(/logout/i)).toBeNull();
  });
});

describe('AppNavbar — logged in as user', () => {
  const user = { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'user' as const };

  beforeEach(() => makeAuthState(user));

  it('shows user name', () => {
    wrap(<AppNavbar />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('does not show Admin link for non-admin', () => {
    wrap(<AppNavbar />);
    expect(screen.queryByText('Admin')).toBeNull();
  });
});

describe('AppNavbar — logged in as admin', () => {
  const admin = { id: 'u2', name: 'Bob', email: 'b@b.com', role: 'admin' as const };

  beforeEach(() => makeAuthState(admin));

  it('shows Admin link', async () => {
    wrap(<AppNavbar />);
    // Open the dropdown to reveal items
    fireEvent.click(screen.getByRole('button', { name: /bob/i }));
    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });
});

describe('AppNavbar — cart badge', () => {
  beforeEach(() => makeAuthState(null));

  it('shows item count in badge', () => {
    makeCartState(3);
    wrap(<AppNavbar />);
    expect(screen.getByLabelText('3 items in cart')).toBeInTheDocument();
  });

  it('shows 0 when cart is empty', () => {
    makeCartState(0);
    wrap(<AppNavbar />);
    expect(screen.getByLabelText('0 items in cart')).toBeInTheDocument();
  });
});

describe('AppNavbar — logout', () => {
  const user = { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'user' as const };

  beforeEach(() => makeAuthState(user));

  it('clicking Logout item calls logout()', async () => {
    wrap(<AppNavbar />);
    // Open the dropdown toggle first
    fireEvent.click(screen.getByRole('button', { name: /alice/i }));
    const logoutItem = await screen.findByText(/logout/i);
    fireEvent.click(logoutItem);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
