import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
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

const mockRegister = jest.fn();
const mockClearError = jest.fn();

const makeAuthState = (overrides: any = {}) => {
  (useAuthStore as jest.Mock).mockImplementation((selector: any) => {
    const state = {
      user: null,
      isLoading: false,
      error: null,
      register: mockRegister,
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

const wrap = () => render(<MemoryRouter><RegisterPage /></MemoryRouter>);

describe('RegisterPage', () => {
  it('renders name, email, password, confirmPassword fields', () => {
    wrap();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows "Passwords do not match" for mismatched passwords', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'DifferentPass!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls register and navigates on success', async () => {
    mockRegister.mockResolvedValueOnce(true);
    wrap();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not navigate when register returns false', async () => {
    mockRegister.mockResolvedValueOnce(false);
    wrap();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/');
  });

  it('renders error alert when store error is set', () => {
    makeAuthState({ error: 'Email already taken' });
    wrap();
    expect(screen.getByRole('alert')).toHaveTextContent('Email already taken');
  });

  it('redirects to "/" when user is already logged in', () => {
    makeAuthState({ user: { id: 'u1', name: 'A', email: 'a@a.com', role: 'user' } });
    wrap();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
