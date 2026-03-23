import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginThunk } from '../store/slices/authSlice';

jest.mock('../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const makeAuthState = (overrides: any = {}) => {
  (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({
      auth: { user: null, isLoading: false, error: null, ...overrides },
    })
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockResolvedValue(undefined);
  makeAuthState();
});

const wrap = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  it('renders email and password fields and submit button', () => {
    wrap();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows "Invalid email" for bad email format', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('calls dispatch and navigates on success', async () => {
    const loginResult = loginThunk.fulfilled(
      { user: { id: 'u1', name: 'Alice', email: 'user@test.com', role: 'user' as const }, token: 'tok1', refreshToken: '' },
      'reqId',
      { email: 'user@test.com', password: 'password123' }
    );
    mockDispatch
      .mockReturnValueOnce(undefined)
      .mockResolvedValueOnce(loginResult);

    wrap();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not navigate when login is rejected', async () => {
    // Default mockDispatch resolves to undefined → fulfilled.match(undefined) = false
    wrap();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
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
