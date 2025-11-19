import { tokenStorage } from '@/services/storage/token.storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('setAccessToken', () => {
    it('stores access token in localStorage', () => {
      tokenStorage.setAccessToken('test-access-token');
      expect(localStorageMock.getItem('lims_access_token')).toBe(
        'test-access-token'
      );
    });
  });

  describe('getAccessToken', () => {
    it('retrieves access token from localStorage', () => {
      localStorageMock.setItem('lims_access_token', 'test-access-token');
      expect(tokenStorage.getAccessToken()).toBe('test-access-token');
    });

    it('returns null if token does not exist', () => {
      expect(tokenStorage.getAccessToken()).toBeNull();
    });
  });

  describe('setRefreshToken', () => {
    it('stores refresh token in localStorage', () => {
      tokenStorage.setRefreshToken('test-refresh-token');
      expect(localStorageMock.getItem('lims_refresh_token')).toBe(
        'test-refresh-token'
      );
    });
  });

  describe('getRefreshToken', () => {
    it('retrieves refresh token from localStorage', () => {
      localStorageMock.setItem('lims_refresh_token', 'test-refresh-token');
      expect(tokenStorage.getRefreshToken()).toBe('test-refresh-token');
    });

    it('returns null if token does not exist', () => {
      expect(tokenStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from localStorage', () => {
      localStorageMock.setItem('lims_access_token', 'test-access-token');
      localStorageMock.setItem('lims_refresh_token', 'test-refresh-token');

      tokenStorage.clearTokens();

      expect(localStorageMock.getItem('lims_access_token')).toBeNull();
      expect(localStorageMock.getItem('lims_refresh_token')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
      // Create an expired JWT token (exp: past timestamp)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjEwMDAwMDAwMDB9.signature';
      expect(tokenStorage.isTokenExpired(expiredToken)).toBe(true);
    });

    it('returns false for valid token', () => {
      // Create a valid JWT token (exp: future timestamp)
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(
        JSON.stringify({ userId: '123', exp: futureExp })
      );
      const validToken = `header.${payload}.signature`;
      expect(tokenStorage.isTokenExpired(validToken)).toBe(false);
    });

    it('returns true for invalid token format', () => {
      expect(tokenStorage.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('returns expiration date for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ userId: '123', exp: futureExp }));
      const token = `header.${payload}.signature`;

      const expiration = tokenStorage.getTokenExpiration(token);
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration?.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns null for invalid token', () => {
      expect(tokenStorage.getTokenExpiration('invalid-token')).toBeNull();
    });
  });
});

