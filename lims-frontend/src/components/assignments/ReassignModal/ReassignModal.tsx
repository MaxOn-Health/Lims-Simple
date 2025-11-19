'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/common/Button/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Assignment } from '@/types/assignment.types';
import { reassignAssignmentSchema } from '@/utils/validation/assignment-schemas';
import { assignmentsService } from '@/services/api/assignments.service';
import { usersService } from '@/services/api/users.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { User, UserRole } from '@/types/user.types';
import { UserCog, Loader2 } from 'lucide-react';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSuccess?: () => void;
}

interface ReassignFormData {
  adminId: string;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [availableAdmins, setAvailableAdmins] = useState<User[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const testAdminRole = assignment?.test?.adminRole;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReassignFormData>({
    resolver: zodResolver(reassignAssignmentSchema),
    defaultValues: {
      adminId: assignment?.adminId || '',
    },
  });

  useEffect(() => {
    if (assignment && isOpen && testAdminRole) {
      fetchAvailableAdmins();
      reset({
        adminId: assignment.adminId || '',
      });
    }
  }, [assignment, isOpen, testAdminRole, reset]);

  const fetchAvailableAdmins = async () => {
    if (!testAdminRole) return;

    setIsLoadingAdmins(true);
    try {
      // Fetch all TEST_TECHNICIAN users
      const response = await usersService.getUsers({
        limit: 100,
        role: UserRole.TEST_TECHNICIAN,
      });

      // Filter by testTechnicianType matching the test's adminRole
      const filteredAdmins = response.data.filter(
        (admin) => admin.testTechnicianType === testAdminRole && admin.isActive
      );

      setAvailableAdmins(filteredAdmins);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to load available admins',
      });
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const onSubmit = async (data: ReassignFormData) => {
    if (!assignment) return;

    try {
      await assignmentsService.reassign(assignment.id, { adminId: data.adminId });
      addToast({
        type: 'success',
        message: 'Assignment reassigned successfully',
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  if (!assignment) {
    return null;
  }

  const currentAdmin = assignment.admin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reassign Assignment</DialogTitle>
          <DialogDescription>
            Reassign test "{assignment.test?.name}" for patient "{assignment.patient?.name}" to a
            different admin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {currentAdmin && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Current Admin
                  </span>
                  <div className="text-sm font-semibold text-foreground">
                    {currentAdmin.fullName || currentAdmin.email}
                  </div>
                </div>
              </div>
            )}

            {!currentAdmin && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This assignment is currently unassigned
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-id">Select Admin</Label>
              {isLoadingAdmins ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableAdmins.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    No available admins found for this test type ({testAdminRole})
                  </p>
                </div>
              ) : (
                <Controller
                  name="adminId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="admin-id">
                        <SelectValue placeholder="Select an admin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAdmins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.fullName || admin.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.adminId && (
                <p className="text-sm font-medium text-destructive">
                  {errors.adminId.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={availableAdmins.length === 0}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Reassign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

