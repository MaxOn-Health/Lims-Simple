'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { updatePatientSchema } from '@/utils/validation/patient-schemas';
import { UpdatePatientRequest, Patient, Gender } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { IndianRupee } from 'lucide-react';

interface PatientEditFormProps {
  patient: Patient;
  onSuccess?: () => void;
}

export const PatientEditForm: React.FC<PatientEditFormProps> = ({ patient, onSuccess }) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const patientPackage = patient.patientPackages?.[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePatientRequest>({
    resolver: zodResolver(updatePatientSchema),
    defaultValues: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      email: patient.email || undefined,
      employeeId: patient.employeeId || undefined,
      companyName: patient.companyName || undefined,
      address: patient.address || undefined,
      addonTestIds: patientPackage?.addonTestIds || [],
    },
  });

  const selectedAddonTestIds = watch('addonTestIds') || [];

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const testsData = await testsService.getTests({ isActive: true });
        setTests(testsData);
      } catch (err) {
        const apiError = err as ApiError;
        addToast({
          type: 'error',
          message: getErrorMessage(apiError),
        });
      } finally {
        setIsLoadingTests(false);
      }
    };

    fetchTests();
  }, [addToast]);

  const selectedAddonTests = useMemo(() => {
    return tests.filter((test) => selectedAddonTestIds.includes(test.id));
  }, [tests, selectedAddonTestIds]);

  const onSubmit = async (data: UpdatePatientRequest) => {
    try {
      await patientsService.updatePatient(patient.id, data);
      addToast({
        type: 'success',
        message: 'Patient updated successfully',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/patients/${patient.id}`);
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient ID - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle>Patient ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-md">
            <code className="font-mono text-sm font-semibold">{patient.patientId}</code>
            <p className="text-xs text-muted-foreground mt-1">
              Patient ID cannot be changed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Package/Test Information - Read Only */}
      {patientPackage && (
        <Card>
          <CardHeader>
            <CardTitle>
              {patientPackage.packageId ? 'Package Information' : 'Test Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md">
              {patientPackage.packageId && patientPackage.packageName ? (
                <>
                  <p className="font-semibold text-foreground">{patientPackage.packageName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Package cannot be changed after registration
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">Individual Tests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {patientPackage.addonTestIds?.length || 0} test{patientPackage.addonTestIds?.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tests cannot be changed after registration
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="name"
              label="Full Name"
              placeholder="Enter patient name"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="age"
                type="number"
                label="Age"
                placeholder="Enter age"
                error={errors.age?.message}
                {...register('age', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-sm font-medium text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="contactNumber"
                label="Contact Number"
                placeholder="Enter contact number"
                error={errors.contactNumber?.message}
                {...register('contactNumber')}
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Enter email (optional)"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="employeeId"
                label="Employee ID"
                placeholder="Enter employee ID (optional)"
                error={errors.employeeId?.message}
                {...register('employeeId')}
              />
            </div>

            <div>
              <Input
                id="companyName"
                label="Company Name"
                placeholder="Enter company name (optional)"
                error={errors.companyName?.message}
                {...register('companyName')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter address (optional)"
              rows={3}
              {...register('address')}
            />
            {errors.address && (
              <p className="mt-1 text-sm font-medium text-destructive">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Addon Tests Section */}
      {patientPackage && (
        <Card>
          <CardHeader>
            <CardTitle>Addon Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingTests ? (
              <p className="text-sm text-muted-foreground">Loading tests...</p>
            ) : tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests available</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-4">
                {tests.map((test) => (
                  <div key={test.id} className="flex items-start space-x-3">
                    <Controller
                      name="addonTestIds"
                      control={control}
                      render={({ field }) => {
                        const isChecked = field.value?.includes(test.id) || false;
                        return (
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentIds = field.value || [];
                              if (checked) {
                                field.onChange([...currentIds, test.id]);
                              } else {
                                field.onChange(currentIds.filter((id) => id !== test.id));
                              }
                            }}
                          />
                        );
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={test.id} className="font-medium cursor-pointer">
                        {test.name}
                      </Label>
                      {test.description && (
                        <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedAddonTests.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Selected Tests:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAddonTests.map((test) => (
                    <li key={test.id} className="text-sm text-foreground">
                      {test.name}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Price will be recalculated when you save changes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Update Patient
        </Button>
      </div>
    </form>
  );
};

