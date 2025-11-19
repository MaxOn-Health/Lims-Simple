'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerBloodSampleSchema } from '@/utils/validation/blood-sample-schemas';
import { RegisterBloodSampleRequest, RegisterBloodSampleResponse } from '@/types/blood-sample.types';
import { Patient } from '@/types/patient.types';
import { patientsService } from '@/services/api/patients.service';
import { bloodSamplesService } from '@/services/api/blood-samples.service';
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
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { Droplet, Loader2 } from 'lucide-react';
import { SampleIdPasscodeDisplay } from '../SampleIdPasscodeDisplay/SampleIdPasscodeDisplay';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';

export const SampleRegistrationForm: React.FC = () => {
  const { addToast } = useUIStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegisterBloodSampleResponse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterBloodSampleRequest>({
    resolver: zodResolver(registerBloodSampleSchema),
  });

  const selectedPatientId = watch('patientId');

  useEffect(() => {
    fetchPatients();
  }, [debouncedSearch]);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const response = await patientsService.getPatients({
        limit: 50,
        search: debouncedSearch || undefined,
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

  const onSubmit = async (data: RegisterBloodSampleRequest) => {
    setIsRegistering(true);
    try {
      const result = await bloodSamplesService.registerBloodSample(data);
      setRegistrationResult(result);
      
      // Find patient for display
      const patient = patients.find((p) => p.id === data.patientId);
      setSelectedPatient(patient || null);

      addToast({
        type: 'success',
        message: 'Blood sample registered successfully',
      });
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setValue('patientId', patientId);
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient || null);
  };

  const handleReset = () => {
    setRegistrationResult(null);
    setSelectedPatient(null);
    setSearchQuery('');
    setValue('patientId', '');
  };

  if (registrationResult) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Droplet className="h-8 w-8 text-primary" />
            Register Blood Sample
          </h1>
          <p className="text-muted-foreground mt-1">
            Register a new blood sample for a patient
          </p>
        </div>

        <SampleIdPasscodeDisplay
          sampleId={registrationResult.sampleId}
          passcode={registrationResult.passcode}
          patientName={selectedPatient?.name}
        />

        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline">
            Register Another Sample
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Droplet className="h-8 w-8 text-primary" />
          Register Blood Sample
        </h1>
        <p className="text-muted-foreground mt-1">
          Register a new blood sample for a patient
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-search" className="text-sm font-medium mb-2 block">
                  Search Patient
                </Label>
                <SearchInput
                  id="patient-search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name, patient ID, contact, or employee ID..."
                  onClear={() => {
                    setSearchQuery('');
                    setSelectedPatient(null);
                    setValue('patientId', '');
                  }}
                />
              </div>

              <div>
                <Label htmlFor="patient-select" className="text-sm font-medium mb-2 block">
                  Select Patient <span className="text-destructive">*</span>
                </Label>
                {isLoadingPatients ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedPatientId || ''}
                    onValueChange={handlePatientSelect}
                  >
                    <SelectTrigger id="patient-select" className={errors.patientId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select a patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {searchQuery ? 'No patients found' : 'Start typing to search...'}
                        </div>
                      ) : (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{patient.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {patient.patientId} • {patient.contactNumber}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.patientId && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {errors.patientId.message}
                  </p>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Selected Patient</p>
                  <p className="font-semibold">{selectedPatient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.patientId} • {selectedPatient.contactNumber}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isRegistering || !selectedPatientId}>
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Droplet className="h-4 w-4 mr-2" />
                    Register Sample
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

