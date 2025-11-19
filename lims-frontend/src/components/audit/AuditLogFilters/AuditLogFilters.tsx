'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/common/Button/Button';
import { AuditAction, EntityType } from '@/types/audit.types';
import { User } from '@/types/user.types';
import { usersService } from '@/services/api/users.service';
import { X } from 'lucide-react';

interface AuditLogFiltersProps {
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  onUserIdChange: (userId: string | undefined) => void;
  onActionChange: (action: string | undefined) => void;
  onEntityTypeChange: (entityType: string | undefined) => void;
  onDateFromChange: (date: string | undefined) => void;
  onDateToChange: (date: string | undefined) => void;
  onClear: () => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  userId,
  action,
  entityType,
  dateFrom,
  dateTo,
  onUserIdChange,
  onActionChange,
  onEntityTypeChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await usersService.getUsers({ limit: 100 });
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const hasFilters = userId || action || entityType || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="user-filter">User</Label>
          <Select value={userId || 'all'} onValueChange={(value) => onUserIdChange(value === 'all' ? undefined : value)}>
            <SelectTrigger id="user-filter">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {isLoadingUsers ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="action-filter">Action</Label>
          <Select value={action || 'all'} onValueChange={(value) => onActionChange(value === 'all' ? undefined : value)}>
            <SelectTrigger id="action-filter">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.values(AuditAction).map((act) => (
                <SelectItem key={act} value={act}>
                  {act}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="entity-type-filter">Entity Type</Label>
          <Select value={entityType || 'all'} onValueChange={(value) => onEntityTypeChange(value === 'all' ? undefined : value)}>
            <SelectTrigger id="entity-type-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(EntityType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date-from">From Date</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onDateFromChange(e.target.value || undefined)}
          />
        </div>

        <div>
          <Label htmlFor="date-to">To Date</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo || ''}
            onChange={(e) => onDateToChange(e.target.value || undefined)}
          />
        </div>
      </div>

      {hasFilters && (
        <div>
          <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

