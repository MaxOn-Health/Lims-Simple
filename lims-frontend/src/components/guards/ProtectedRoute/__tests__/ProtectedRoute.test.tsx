import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';

// Mock the auth store
jest.mock('@/store/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ProtectedRoute', () => {
  const mockGetCurrentUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders children when authenticated', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', fullName: 'Test User', role: 'ADMIN' },
      isLoading: false,
      getCurrentUser: mockGetCurrentUser,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-token'),
      },
      writable: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      getCurrentUser: mockGetCurrentUser,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows loading state while checking authentication', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true,
      getCurrentUser: mockGetCurrentUser,
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-token'),
      },
      writable: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show loading (PageLoader component)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects when getCurrentUser fails', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    (useAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      getCurrentUser: mockGetCurrentUser,
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'test-token'),
      },
      writable: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});

