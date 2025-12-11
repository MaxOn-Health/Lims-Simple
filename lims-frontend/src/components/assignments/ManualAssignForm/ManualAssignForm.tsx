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
import { UserPlus, Users } from 'lucide-react';
import { TechnicianSelector } from '../TechnicianSelector/TechnicianSelector';

export const ManualAssignForm: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showTechnicianSelector, setShowTechnicianSelector] = useState(false);
  const debouncedPatientSearch = useDebounce(patientSearchQuery, 300);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
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
      // Get patient's project for project-scoped technician filtering
      const patient = patients.find((p) => p.id === selectedPatientId);
      const projectId = patient?.projectId;

      // Use new getAvailableTechnicians API
      const technicians = await assignmentsService.getAvailableTechnicians(
        selectedTestId,
        projectId || undefined
      );

      // Map to User format for compatibility with existing dropdown
      const mappedAdmins = technicians.map((tech) => ({
        id: tech.id,
        email: tech.email,
        fullName: tech.fullName,
        testTechnicianType: tech.testTechnicianType,
        currentAssignmentCount: tech.currentAssignmentCount,
        isActive: tech.isAvailable !== false,
        role: UserRole.TEST_TECHNICIAN,
      })) as any[];

      setAdmins(mappedAdmins);
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to load technicians',
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-gray-900">
          <UserPlus className="h-8 w-8 text-primary" />
          Assign New Test
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a patient and assign a test to a technician.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
              <CardTitle className="text-xl text-primary flex items-center gap-2">
                1. Select Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="patient-search" className="text-base font-medium">
                  Find Patient
                </Label>
                <SearchInput
                  value={patientSearchQuery}
                  onChange={setPatientSearchQuery}
                  placeholder="Search by name, ID, or phone number..."
                  className="h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Start typing to search for a registered patient.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-id" className="text-base font-medium">
                  Select from Results
                </Label>
                <Controller
                  name="patientId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={isLoadingPatients}
                    >
                      <SelectTrigger id="patient-id" className="h-12 text-base">
                        <SelectValue placeholder={isLoadingPatients ? "Searching..." : "Select a patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPatients ? (
                          <div className="p-4 text-center text-muted-foreground">Loading...</div>
                        ) : patients.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            {patientSearchQuery ? "No patients found." : "Type above to search."}
                          </div>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{patient.name}</span>
                                <span className="text-xs text-muted-foreground">ID: {patient.patientId}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.patientId && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.patientId.message}
                  </p>
                )}
              </div>

              {/* Selected Patient Summary Card */}
              {selectedPatientId && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                  <h3 className="font-semibold text-blue-900 mb-2">Selected Patient</h3>
                  {patients.find(p => p.id === selectedPatientId) && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 block text-xs uppercase tracking-wider">Name</span>
                        <span className="font-medium text-blue-950 text-lg">
                          {patients.find(p => p.id === selectedPatientId)?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 block text-xs uppercase tracking-wider">ID</span>
                        <span className="font-medium text-blue-950">
                          {patients.find(p => p.id === selectedPatientId)?.patientId}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Test & Technician (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card className="border-none shadow-lg ring-1 ring-black/5">
              <CardHeader className="bg-gray-50 border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  2. Assign Test
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Test Selection */}
                <div className="space-y-3">
                  <Label htmlFor="test-id" className="font-medium">Select Test *</Label>
                  <Controller
                    name="testId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!selectedPatientId}
                      >
                        <SelectTrigger id="test-id" className="h-11">
                          <SelectValue placeholder="Choose test..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tests.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              No tests available for this patient.
                            </div>
                          ) : (
                            tests.map((test) => (
                              <SelectItem key={test.id} value={test.id}>
                                {test.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.testId && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.testId.message}
                    </p>
                  )}
                  {!selectedPatientId && (
                    <p className="text-xs text-muted-foreground">
                      Select a patient first.
                    </p>
                  )}
                </div>

                {/* Technician Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-id" className="font-medium">Technician</Label>
                    {selectedTestId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTechnicianSelector(true)}
                        className="h-7 text-xs text-primary hover:text-primary"
                      >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Browse
                      </Button>
                    )}
                  </div>
                  <Controller
                    name="adminId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value || undefined)}
                        disabled={!selectedTestId}
                      >
                        <SelectTrigger id="admin-id" className="h-11">
                          <SelectValue placeholder="Auto-assign (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {admins.map((admin) => {
                            const workload = (admin as any).currentAssignmentCount;
                            return (
                              <SelectItem key={admin.id} value={admin.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{admin.fullName || admin.email}</span>
                                  {workload !== undefined && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({workload} active)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-assign, or click Browse for technician details.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="w-full h-12 text-base shadow-lg shadow-primary/20"
                    disabled={!selectedPatientId || !selectedTestId}
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Confirm Assignment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* TechnicianSelector Modal */}
      {selectedTestId && (
        <TechnicianSelector
          isOpen={showTechnicianSelector}
          onClose={() => setShowTechnicianSelector(false)}
          testId={selectedTestId}
          projectId={patients.find(p => p.id === selectedPatientId)?.projectId}
          selectedTechnicianId={(watch('adminId') || undefined) as string | undefined}
          onSelect={(technicianId) => {
            if (technicianId) {
              setValue('adminId', technicianId);
            }
          }}
          testName={tests.find(t => t.id === selectedTestId)?.name}
          showAutoAssign={false}
        />
      )}
    </div>
  );
};

