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
import { Input } from '@/components/common/Input/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentStatusBadge } from '../PaymentStatusBadge/PaymentStatusBadge';
import { Patient, PaymentStatus, UpdatePaymentRequest } from '@/types/patient.types';
import { updatePaymentSchema } from '@/utils/validation/patient-schemas';
import { patientsService } from '@/services/api/patients.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { calculateRemainingAmount } from '@/utils/patient-helpers';
import { IndianRupee } from 'lucide-react';

interface UpdatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

interface PaymentFormData {
  paymentStatus: PaymentStatus;
  paymentAmount: number;
}

export const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const patientPackage = patient?.patientPackages?.[0];

  const totalPrice = patientPackage?.totalPrice || 0;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(
      updatePaymentSchema.refine(
        (data) => {
          return data.paymentAmount <= totalPrice;
        },
        {
          message: 'Payment amount cannot exceed total price',
          path: ['paymentAmount'],
        }
      )
    ),
    defaultValues: {
      paymentStatus: patientPackage?.paymentStatus || PaymentStatus.PENDING,
      paymentAmount: patientPackage?.paymentAmount || 0,
    },
  });

  const paymentStatus = watch('paymentStatus');
  const paymentAmount = watch('paymentAmount');

  useEffect(() => {
    if (patientPackage) {
      reset({
        paymentStatus: patientPackage.paymentStatus,
        paymentAmount: patientPackage.paymentAmount,
      });
    }
  }, [patientPackage, reset]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!patient) return;

    try {
      const updateData: UpdatePaymentRequest = {
        paymentStatus: data.paymentStatus,
        paymentAmount: data.paymentAmount,
      };

      await patientsService.updatePayment(patient.id, updateData);
      addToast({
        type: 'success',
        message: 'Payment status updated successfully',
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

  if (!patient || !patientPackage) {
    return null;
  }

  const isPaymentAmountDisabled = paymentStatus === PaymentStatus.PENDING;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogDescription>
            Update payment information for {patient.name} ({patient.patientId})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Price</span>
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">
                    {Number(totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                <PaymentStatusBadge status={patientPackage.paymentStatus} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-muted-foreground">Current Amount</span>
                <span className="text-sm font-semibold text-foreground">
                  ₹{patientPackage.paymentAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Controller
                name="paymentStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                      <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentStatus && (
                <p className="text-sm font-medium text-destructive">
                  {errors.paymentStatus.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Controller
                name="paymentAmount"
                control={control}
                render={({ field }) => (
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalPrice}
                    disabled={isPaymentAmountDisabled}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value}
                  />
                )}
              />
              {errors.paymentAmount && (
                <p className="text-sm font-medium text-destructive">
                  {errors.paymentAmount.message}
                </p>
              )}
              {paymentStatus === PaymentStatus.PENDING && (
                <p className="text-xs text-muted-foreground">
                  Payment amount must be 0 for PENDING status
                </p>
              )}
              {paymentStatus === PaymentStatus.PAID && (
                <p className="text-xs text-muted-foreground">
                  Payment amount must equal total price ({Number(totalPrice).toFixed(2)}) for PAID status
                </p>
              )}
              {paymentStatus === PaymentStatus.PARTIAL && (
                <p className="text-xs text-muted-foreground">
                  Payment amount must be less than total price ({Number(totalPrice).toFixed(2)}) and greater than 0
                </p>
              )}
            </div>

            {paymentStatus !== PaymentStatus.PENDING && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Remaining Amount</span>
                  <span className="text-lg font-semibold text-foreground">
                    ₹{calculateRemainingAmount(Number(totalPrice), paymentAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

