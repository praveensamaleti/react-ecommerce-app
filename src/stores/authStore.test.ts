import { useAuthStore } from './authStore';
import api from '../utils/api';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockUser = { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'user' as const };

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  localStorage.clear();
  jest.clearAllMocks();
});

describe('initial state', () => {
  it('has null user, token, not loading, no error', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });
});

describe('login', () => {
  it('success sets user and token', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: 'tok1', refreshToken: 'ref1' },
    });

    const ok = await useAuthStore.getState().login('alice@test.com', 'pass');

    expect(ok).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe('tok1');
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('success stores token in localStorage', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: 'tok1', refreshToken: 'ref1' },
    });

    await useAuthStore.getState().login('alice@test.com', 'pass');

    expect(localStorage.getItem('token')).toBe('tok1');
  });

  it('failure sets error and returns false', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    const ok = await useAuthStore.getState().login('bad@test.com', 'wrong');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('failure uses fallback message when no response data', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network error'));

    const ok = await useAuthStore.getState().login('bad@test.com', 'wrong');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid email or password.');
  });
});

describe('register', () => {
  it('success sets user and token', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { user: mockUser, token: 'tok2', refreshToken: 'ref2' },
    });

    const ok = await useAuthStore.getState().register('Alice', 'alice@test.com', 'pass123');

    expect(ok).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('failure sets error and returns false', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Email taken' } },
    });

    const ok = await useAuthStore.getState().register('Bob', 'bob@test.com', 'pass123');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Email taken');
  });

  it('failure uses fallback message', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Server error'));

    const ok = await useAuthStore.getState().register('Bob', 'bob@test.com', 'pass123');

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Registration failed.');
  });
});

describe('logout', () => {
  it('clears user and token', async () => {
    useAuthStore.setState({ user: mockUser, token: 'tok1' });
    mockApi.post.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('still clears state even when api throws', async () => {
    useAuthStore.setState({ user: mockUser, token: 'tok1' });
    mockApi.post.mockRejectedValueOnce(new Error('Network'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('removes token from localStorage', async () => {
    localStorage.setItem('token', 'tok1');
    mockApi.post.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('updateProfile', () => {
  it('patches user name', () => {
    useAuthStore.setState({ user: mockUser });
    useAuthStore.getState().updateProfile({ name: 'Alice Updated' });
    expect(useAuthStore.getState().user?.name).toBe('Alice Updated');
  });

  it('is a no-op when user is null', () => {
    expect(() => useAuthStore.getState().updateProfile({ name: 'X' })).not.toThrow();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('clearError', () => {
  it('sets error to null', () => {
    useAuthStore.setState({ error: 'some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});

describe('auth-logout CustomEvent', () => {
  it('clears user and token when event is dispatched', () => {
    useAuthStore.setState({ user: mockUser, token: 'tok1' });
    window.dispatchEvent(new CustomEvent('auth-logout'));
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
