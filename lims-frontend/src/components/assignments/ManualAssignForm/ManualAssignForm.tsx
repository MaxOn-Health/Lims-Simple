'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createAssignmentSchema } from '@/utils/validation/assignment-schemas';
import { CreateAssignmentRequest } from '@/types/assignment.types';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { User, UserRole } from '@/types/user.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assignmentsService } from '@/services/api/assignments.service';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { usersService } from '@/services/api/users.service';
import { packagesService } from '@/services/api/packages.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { UserPlus } from 'lucide-react';

export const ManualAssignForm: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearchQuery, 300);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssignmentRequest>({
    resolver: zodResolver(createAssignmentSchema),
  });

  const selectedPatientId = watch('patientId');
  const selectedTestId = watch('testId');

  useEffect(() => {
    fetchPatients();
  }, [debouncedPatientSearch]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientTests();
    }
  }, [selectedPatientId]);

  useEffect(() => {
    if (selectedTestId) {
      fetchAvailableAdmins();
    }
  }, [selectedTestId]);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const response = await patientsService.getPatients({
        limit: 50,
        search: debouncedPatientSearch || undefined,
      });
      setPatients(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to load patients',
      });
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchPatientTests = async () => {
    if (!selectedPatientId) return;

    try {
      const patient = await patientsService.getPatientById(selectedPatientId);
      const patientPackage = patient.patientPackages?.[0];
      
      let allTestIds: string[] = [];
      
      // Get tests from package if package exists
      if (patientPackage?.packageId) {
        const packageTests = await packagesService.getPackageTests(patientPackage.packageId);
        const packageTestIds = packageTests.map((pt) => pt.testId);
        allTestIds.push(...packageTestIds);
      }
      
      // Add addon/standalone tests
      const addonTestIds = patientPackage?.addonTestIds || [];
      allTestIds.push(...addonTestIds);
      
      // Remove duplicates
      allTestIds = [...new Set(allTestIds)];
      
      // If no tests found, set empty array and return
      if (allTestIds.length === 0) {
        setTests([]);
        return;
      }
      
      // Fetch all active tests and filter to patient's tests
      const allTests = await testsService.getTests({ isActive: true });
      const patientTests = allTests.filter((test) => allTestIds.includes(test.id));
      
      setTests(patientTests);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to load patient tests',
      });
    }
  };

  const fetchAvailableAdmins = async () => {
    if (!selectedTestId) return;

    try {
      const test = tests.find((t) => t.id === selectedTestId);
      if (!test) return;

      // Fetch admins with matching testTechnicianType
      const response = await usersService.getUsers({
        limit: 100,
        role: UserRole.TEST_TECHNICIAN,
      });
      const filteredAdmins = response.data.filter(
        (admin) => admin.testTechnicianType === test.adminRole && admin.isActive
      );
      setAdmins(filteredAdmins);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to load admins',
      });
    }
  };

  const onSubmit = async (data: CreateAssignmentRequest) => {
    try {
      await assignmentsService.manualAssign(data);
      addToast({
        type: 'success',
        message: 'Assignment created successfully',
      });
      router.push('/assignments');
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-primary" />
          Manual Assign Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Manually assign a specific test to a patient and admin
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-search">Search Patient</Label>
              <SearchInput
                id="patient-search"
                value={patientSearchQuery}
                onChange={setPatientSearchQuery}
                placeholder="Search by name, patient ID, or contact..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient *</Label>
              <Controller
                name="patientId"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || ''} 
                    onValueChange={field.onChange}
                    disabled={isLoadingPatients}
                  >
                    <SelectTrigger id="patient-id">
                      <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingPatients ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading patients...</div>
                      ) : patients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {patientSearchQuery ? "No patients found matching your search" : "No patients available"}
                        </div>
                      ) : (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} ({patient.patientId})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.patientId && (
                <p className="text-sm font-medium text-destructive">
                  {errors.patientId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-id">Test *</Label>
              <Controller
                name="testId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={!selectedPatientId}
                  >
                    <SelectTrigger id="test-id">
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.testId && (
                <p className="text-sm font-medium text-destructive">
                  {errors.testId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-id">Admin (Optional - leave empty for auto-assign)</Label>
              <Controller
                name="adminId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value || undefined)}
                    disabled={!selectedTestId}
                  >
                    <SelectTrigger id="admin-id">
                      <SelectValue placeholder="Select an admin (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.fullName || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.adminId && (
                <p className="text-sm font-medium text-destructive">
                  {errors.adminId.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty to automatically assign to an available admin
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

