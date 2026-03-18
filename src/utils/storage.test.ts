import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  safeJsonParse,
  readStorage,
  writeStorage,
  removeStorage,
} from './storage';

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

describe('getStorageItem', () => {
  beforeEach(() => localStorage.clear());

  it('returns the stored value', () => {
    localStorage.setItem('key1', 'hello');
    expect(getStorageItem('key1')).toBe('hello');
  });

  it('returns null for missing key', () => {
    expect(getStorageItem('missing')).toBeNull();
  });

  it('returns null when localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(getStorageItem('key1')).toBeNull();
  });
});

describe('setStorageItem', () => {
  beforeEach(() => localStorage.clear());

  it('stores the value', () => {
    setStorageItem('key2', 'world');
    expect(localStorage.getItem('key2')).toBe('world');
  });

  it('swallows QuotaExceededError', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => setStorageItem('key2', 'val')).not.toThrow();
  });
});

describe('removeStorageItem', () => {
  beforeEach(() => localStorage.clear());

  it('removes the item', () => {
    localStorage.setItem('key3', 'to-be-removed');
    removeStorageItem('key3');
    expect(localStorage.getItem('key3')).toBeNull();
  });

  it('swallows errors', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => removeStorageItem('key3')).not.toThrow();
  });
});

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for invalid JSON', () => {
    expect(safeJsonParse('{not json}')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(safeJsonParse(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(safeJsonParse('')).toBeNull();
  });
});

describe('readStorage', () => {
  beforeEach(() => localStorage.clear());

  it('reads and parses a stored object', () => {
    localStorage.setItem('obj', '{"x":42}');
    expect(readStorage<{ x: number }>('obj')).toEqual({ x: 42 });
  });

  it('returns null for missing key', () => {
    expect(readStorage('missing')).toBeNull();
  });
});

describe('writeStorage and removeStorage', () => {
  beforeEach(() => localStorage.clear());

  it('writeStorage serialises the value', () => {
    writeStorage('data', { n: 7 });
    expect(localStorage.getItem('data')).toBe('{"n":7}');
  });

  it('removeStorage deletes the item', () => {
    localStorage.setItem('data', '{}');
    removeStorage('data');
    expect(localStorage.getItem('data')).toBeNull();
  });

  it('writeStorage swallows quota errors', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => writeStorage('k', { v: 1 })).not.toThrow();
  });

  it('removeStorage swallows errors', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => removeStorage('k')).not.toThrow();
  });
});
