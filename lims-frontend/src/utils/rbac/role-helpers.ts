import { UserRole, AuthUser } from '@/types/user.types';

export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role;
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return hasRole(user, UserRole.SUPER_ADMIN);
}

export function canManageUsers(user: AuthUser | null): boolean {
  return isSuperAdmin(user);
}

export function canEditUser(
  currentUser: AuthUser | null,
  targetUserId: string
): boolean {
  if (!currentUser) return false;
  if (isSuperAdmin(currentUser)) return true;
  return currentUser.id === targetUserId;
}

export function canDeleteUser(
  currentUser: AuthUser | null,
  targetUserId: string
): boolean {
  if (!currentUser) return false;
  if (isSuperAdmin(currentUser) && currentUser.id !== targetUserId) {
    return true;
  }
  return false;
}

export function getRoleDisplayName(role: UserRole): string {
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function getRoleColor(role: UserRole): string {
  const colors = {
    [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
    [UserRole.RECEPTIONIST]: 'bg-blue-100 text-blue-800',
    [UserRole.TEST_TECHNICIAN]: 'bg-green-100 text-green-800',
    [UserRole.LAB_TECHNICIAN]: 'bg-yellow-100 text-yellow-800',
    [UserRole.DOCTOR]: 'bg-red-100 text-red-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

