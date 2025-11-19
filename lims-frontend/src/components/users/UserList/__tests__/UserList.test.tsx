import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserList } from '@/components/users/UserList/UserList';
import { User, UserRole } from '@/types/user.types';
import { usersService } from '@/services/api/users.service';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

jest.mock('@/services/api/users.service');
jest.mock('@/store/auth.store');
jest.mock('@/store/ui.store');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUsers: User[] = [
  {
    id: '1',
    email: 'user1@example.com',
    fullName: 'User One',
    role: UserRole.RECEPTIONIST,
    testTechnicianType: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'user2@example.com',
    fullName: 'User Two',
    role: UserRole.DOCTOR,
    testTechnicianType: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('UserList', () => {
  const mockGetUsers = usersService.getUsers as jest.Mock;
  const mockDeleteUser = usersService.deleteUser as jest.Mock;
  const mockAddToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: '1', role: UserRole.SUPER_ADMIN },
    });
    (useUIStore as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    });
    mockGetUsers.mockResolvedValue({
      data: mockUsers,
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('renders user list', async () => {
    render(<UserList />);
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockGetUsers.mockImplementation(() => new Promise(() => {}));
    render(<UserList />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    mockGetUsers.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
    render(<UserList />);
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  it('filters users by search query', async () => {
    render(<UserList />);
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'One' } });

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'One',
        })
      );
    });
  });

  it('shows create button for SUPER_ADMIN', async () => {
    render(<UserList />);
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
  });

  it('hides create button for non-SUPER_ADMIN', async () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: '2', role: UserRole.RECEPTIONIST },
    });
    render(<UserList />);
    await waitFor(() => {
      expect(screen.queryByText('Create User')).not.toBeInTheDocument();
    });
  });
});

