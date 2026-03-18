import { sleep, withDelay } from './mockApi';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('sleep', () => {
  it('resolves after the specified ms', async () => {
    let resolved = false;
    const p = sleep(100).then(() => { resolved = true; });
    expect(resolved).toBe(false);
    jest.advanceTimersByTime(100);
    await p;
    expect(resolved).toBe(true);
  });
});

describe('withDelay', () => {
  it('returns ok:true with the function result after delay', async () => {
    const p = withDelay(() => 42, 200);
    jest.advanceTimersByTime(200);
    const result = await p;
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it('returns ok:false with error message when fn throws an Error', async () => {
    const p = withDelay(() => { throw new Error('oops'); }, 50);
    jest.advanceTimersByTime(50);
    const result = await p;
    expect(result).toEqual({ ok: false, error: 'oops' });
  });

  it('returns ok:false with "Unknown error" when fn throws a string', async () => {
    const p = withDelay(() => { throw 'string error'; }, 50);
    jest.advanceTimersByTime(50);
    const result = await p;
    expect(result).toEqual({ ok: false, error: 'Unknown error' });
  });

  it('uses default delay of 450ms', async () => {
    let settled = false;
    const p = withDelay(() => 1).then(() => { settled = true; });
    jest.advanceTimersByTime(449);
    expect(settled).toBe(false);
    jest.advanceTimersByTime(1);
    await p;
    expect(settled).toBe(true);
  });
});
