import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../stores/authStore';

jest.mock('../stores/authStore');
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockLogin = jest.fn();
const mockClearError = jest.fn();

const makeAuthState = (overrides: any = {}) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      user: null,
      isLoading: false,
      error: null,
      login: mockLogin,
      clearError: mockClearError,
      ...overrides,
    };
    return typeof selector === 'function' ? selector(state) : state;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  makeAuthState();
});

const wrap = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  it('renders email and password fields and submit button', () => {
    wrap();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows "Invalid email" for bad email format', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('calls login and navigate on success', async () => {
    mockLogin.mockResolvedValueOnce(true);
    wrap();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not navigate when login returns false', async () => {
    mockLogin.mockResolvedValueOnce(false);
    wrap();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/');
  });

  it('renders error alert when store error is set', () => {
    makeAuthState({ error: 'Invalid credentials' });
    wrap();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('navigates to "/" when user is already logged in', () => {
    makeAuthState({ user: { id: 'u1', name: 'Alice', email: 'a@a.com', role: 'user' } });
    wrap();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
