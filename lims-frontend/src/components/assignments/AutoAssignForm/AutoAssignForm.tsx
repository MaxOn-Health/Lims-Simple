'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { patientsService } from '@/services/api/patients.service';
import { Patient } from '@/types/patient.types';
import { Assignment } from '@/types/assignment.types';
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
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { SearchInput } from '@/components/common/SearchInput/SearchInput';
import { AssignmentStatusBadge } from '../AssignmentStatusBadge/AssignmentStatusBadge';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { ClipboardCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AutoAssignForm: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

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

  const handleAutoAssign = async () => {
    if (!selectedPatient) return;

    setIsAssigning(true);
    try {
      const createdAssignments = await assignmentsService.autoAssign(selectedPatient.id);
      setAssignments(createdAssignments);
      addToast({
        type: 'success',
        message: `Successfully assigned ${createdAssignments.length} test(s)`,
      });
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedPatientPackage = selectedPatient?.patientPackages?.[0];
  const packageTests = selectedPatientPackage?.packageId
    ? [] // Would need to fetch package tests
    : [];
  const addonTestIds = selectedPatientPackage?.addonTestIds || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Auto Assign Tests
        </h1>
        <p className="text-muted-foreground mt-1">
          Automatically assign all tests from a patient's package to available admins
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-search">Search Patient</Label>
            <SearchInput
              id="patient-search"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, patient ID, or contact..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-select">Select Patient</Label>
            <Select
              value={selectedPatient?.id || ''}
              onValueChange={(value) => {
                const patient = patients.find((p) => p.id === value);
                setSelectedPatient(patient || null);
                setAssignments([]);
              }}
            >
              <SelectTrigger id="patient-select">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} ({patient.patientId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && selectedPatientPackage && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Package</p>
                <p className="text-base font-semibold">{selectedPatientPackage.packageName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tests to Assign
                </p>
                <p className="text-sm text-muted-foreground">
                  Package tests + {addonTestIds.length} addon test(s)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click "Auto Assign" to automatically assign all tests from the patient's package to
              available admins based on test admin types.
            </p>
            <Button
              variant="primary"
              onClick={handleAutoAssign}
              isLoading={isAssigning}
              disabled={!selectedPatient || isAssigning}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Auto Assign
            </Button>
          </CardContent>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Assignments Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Successfully created {assignments.length} assignment(s)
            </p>
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{assignment.test?.name || 'Unknown Test'}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {assignment.admin?.fullName || assignment.admin?.email || 'Unassigned'}
                    </p>
                  </div>
                  <AssignmentStatusBadge status={assignment.status} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => router.push(`/patients/${selectedPatient?.id}`)}
              >
                View Patient
              </Button>
              <Button variant="outline" onClick={() => router.push('/assignments')}>
                View All Assignments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

