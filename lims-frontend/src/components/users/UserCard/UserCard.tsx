'use client';

import React from 'react';
import { format } from 'date-fns';
import { User } from '@/types/user.types';
import { getRoleDisplayName, getRoleColor } from '@/utils/rbac/role-helpers';

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {user.fullName}
          </h2>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
              user.role
            )}`}
          >
            {getRoleDisplayName(user.role)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>

          {user.testTechnicianType && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Test Technician Type
              </label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {user.testTechnicianType.replace('_', ' ')}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-500">
              Created Date
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(user.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Last Updated
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(user.updatedAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

