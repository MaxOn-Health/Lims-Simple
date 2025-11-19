import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Check if the current user can access a resource
 * SUPER_ADMIN can access everything
 * Users can access their own profile
 */
export function canAccessResource(
  currentUser: JwtPayload,
  resourceUserId: string,
): boolean {
  // SUPER_ADMIN has access to everything
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Users can access their own profile
  return currentUser.userId === resourceUserId;
}

/**
 * Throw ForbiddenException if user cannot access resource
 */
export function ensureCanAccessResource(
  currentUser: JwtPayload,
  resourceUserId: string,
): void {
  if (!canAccessResource(currentUser, resourceUserId)) {
    throw new ForbiddenException('You do not have permission to access this resource');
  }
}

