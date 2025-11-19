'use client';

import React from 'react';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/store/auth.store';

interface HasRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasRole: React.FC<HasRoleProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user } = useAuthStore();

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

