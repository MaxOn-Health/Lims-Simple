'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accessBloodSampleSchema } from '@/utils/validation/blood-sample-schemas';
import { AccessBloodSampleRequest } from '@/types/blood-sample.types';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasscodeInput } from '../PasscodeInput/PasscodeInput';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Key, Loader2 } from 'lucide-react';

export const PasscodeAccessForm: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isAccessing, setIsAccessing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccessBloodSampleRequest>({
    resolver: zodResolver(accessBloodSampleSchema),
  });

  const passcode = watch('passcode');

  const onSubmit = async (data: AccessBloodSampleRequest) => {
    setIsAccessing(true);
    try {
      const sample = await bloodSamplesService.accessBloodSample(data);
      addToast({
        type: 'success',
        message: 'Sample accessed successfully',
      });
      // Redirect to sample detail view
      router.push(`/blood-samples/${sample.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = getErrorMessage(apiError);
      
      // Handle specific error cases
      if (errorMessage.includes('not found')) {
        addToast({
          type: 'error',
          message: 'Invalid sample ID. Please check and try again.',
        });
      } else if (errorMessage.includes('passcode') || errorMessage.includes('Invalid')) {
        addToast({
          type: 'error',
          message: 'Invalid passcode. Please check and try again.',
        });
      } else if (errorMessage.includes('status') || errorMessage.includes('Cannot access')) {
        addToast({
          type: 'error',
          message: 'This sample cannot be accessed. It may have already been processed.',
        });
      } else {
        addToast({
          type: 'error',
          message: errorMessage || 'Failed to access sample',
        });
      }
    } finally {
      setIsAccessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Key className="h-8 w-8 text-primary" />
          Access Blood Sample
        </h1>
        <p className="text-muted-foreground mt-1">
          Enter the sample ID and passcode to access a blood sample
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sample Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                id="sampleId"
                label="Sample ID"
                placeholder="BL-YYYYMMDD-XXXX"
                {...register('sampleId')}
                error={errors.sampleId?.message}
                required
                className="font-mono"
              />
            </div>

            <div>
              <PasscodeInput
                value={passcode || ''}
                onChange={(value) => setValue('passcode', value, { shouldValidate: true })}
                label="Passcode"
                error={errors.passcode?.message}
                disabled={isAccessing}
                autoFocus={false}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isAccessing} className="flex-1">
                {isAccessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accessing...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Access Sample
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

