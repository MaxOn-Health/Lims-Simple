import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserForm } from '@/components/users/UserForm/UserForm';
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
    back: jest.fn(),
  }),
}));

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: UserRole.RECEPTIONIST,
  testTechnicianType: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserForm', () => {
  const mockCreateUser = usersService.createUser as jest.Mock;
  const mockUpdateUser = usersService.updateUser as jest.Mock;
  const mockAddToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      user: { id: '1', role: UserRole.SUPER_ADMIN },
    });
    (useUIStore as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    });
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
    });
  });

  it('renders create form correctly', () => {
    render(<UserForm mode="create" />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(<UserForm user={mockUser} mode="edit" />);
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Update User')).toBeInTheDocument();
  });

  it('shows test technician type field when TEST_TECHNICIAN role is selected', async () => {
    render(<UserForm mode="create" />);
    const roleSelect = screen.getByLabelText(/role/i);
    fireEvent.change(roleSelect, { target: { value: UserRole.TEST_TECHNICIAN } });
    await waitFor(() => {
      expect(screen.getByLabelText(/test technician type/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<UserForm mode="create" />);
    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it('submits create form successfully', async () => {
    mockCreateUser.mockResolvedValue(mockUser);
    render(<UserForm mode="create" />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: UserRole.RECEPTIONIST },
    });

    fireEvent.click(screen.getByText('Create User'));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'User created successfully',
      });
    });
  });

  it('submits edit form successfully', async () => {
    mockUpdateUser.mockResolvedValue(mockUser);
    render(<UserForm user={mockUser} mode="edit" />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Updated User' },
    });

    fireEvent.click(screen.getByText('Update User'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'User updated successfully',
      });
    });
  });
});

