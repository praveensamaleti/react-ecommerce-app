import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('a');
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('b');
  });

  it('cancels the previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { jest.advanceTimersByTime(100); });
    rerender({ value: 'c' });
    act(() => { jest.advanceTimersByTime(100); });
    // Only 200ms elapsed since the last value change — should still be 'a'
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('c');
  });

  it('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'x' } }
    );

    rerender({ value: 'y' });
    act(() => { jest.advanceTimersByTime(499); });
    expect(result.current).toBe('x');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('y');
  });
});
