'use client';

import React, { useEffect } from 'react';
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
import { BloodSample, BloodSampleStatus } from '@/types/blood-sample.types';
import { updateStatusSchema } from '@/utils/validation/blood-sample-schemas';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { SampleStatusBadge } from '../SampleStatusBadge/SampleStatusBadge';
import { getValidStatusTransitions, getStatusLabel } from '@/utils/blood-sample-helpers';
import { RefreshCw } from 'lucide-react';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: BloodSample | null;
  onSuccess?: () => void;
}

interface StatusFormData {
  status: BloodSampleStatus;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  sample,
  onSuccess,
}) => {
  const { addToast } = useUIStore();

  const validTransitions = sample
    ? getValidStatusTransitions(sample.status)
    : [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StatusFormData & { currentStatus?: BloodSampleStatus }>({
    resolver: zodResolver(
      updateStatusSchema.refine(
        (data) => {
          if (!sample) return false;
          const transitions = getValidStatusTransitions(sample.status);
          return transitions.includes(data.status);
        },
        {
          message: 'Invalid status transition',
          path: ['status'],
        }
      )
    ),
    defaultValues: {
      status: validTransitions[0] || sample?.status || BloodSampleStatus.COLLECTED,
      currentStatus: sample?.status,
    },
  });

  useEffect(() => {
    if (sample && isOpen) {
      const transitions = getValidStatusTransitions(sample.status);
      reset({
        status: transitions[0] || sample.status,
        currentStatus: sample.status,
      });
    }
  }, [sample, isOpen, reset]);

  const onSubmit = async (data: StatusFormData) => {
    if (!sample) return;

    try {
      await bloodSamplesService.updateStatus(sample.id, { status: data.status });
      addToast({
        type: 'success',
        message: 'Sample status updated successfully',
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

  if (!sample) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Sample Status</DialogTitle>
          <DialogDescription>
            Update status for sample "{sample.sampleId}" for patient "{sample.patient?.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                <SampleStatusBadge status={sample.status} />
              </div>
            </div>

            {validTransitions.length === 0 ? (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No valid status transitions available. Current status: {getStatusLabel(sample.status)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {validTransitions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm font-medium text-destructive">{errors.status.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Valid transitions: {validTransitions.map(getStatusLabel).join(', ')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={validTransitions.length === 0}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

