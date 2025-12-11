import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignmentsService } from '@/services/api/assignments.service';
import { patientsService } from '@/services/api/patients.service';
import { Patient } from '@/types/patient.types';
import { Assignment, AutoAssignPreviewItem } from '@/types/assignment.types';
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
import { ClipboardCheck, CheckCircle2, AlertCircle, RefreshCw, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TechnicianSelector } from '../TechnicianSelector/TechnicianSelector';
import { UserRole } from '@/types/user.types';

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

  // Preview State
  const [previewItems, setPreviewItems] = useState<AutoAssignPreviewItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // Technician Selector State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectingForTest, setSelectingForTest] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [debouncedSearch]);

  // Fetch preview when patient selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPreview();
    } else {
      setPreviewItems([]);
      setOverrides({});
    }
  }, [selectedPatient]);

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

  const fetchPreview = async () => {
    if (!selectedPatient) return;
    setLoadingPreview(true);
    try {
      const items = await assignmentsService.previewAutoAssign(selectedPatient.id);
      setPreviewItems(items);
    } catch (err) {
      // If error (e.g. no package), clear preview
      setPreviewItems([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedPatient) return;

    setIsAssigning(true);
    try {
      const createdAssignments = await assignmentsService.autoAssign(
        selectedPatient.id,
        overrides
      );
      setAssignments(createdAssignments);
      addToast({
        type: 'success',
        message: `Successfully assigned ${createdAssignments.length} test(s)`,
      });
      // Clear preview after success
      setPreviewItems([]);
      setOverrides({});
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

  const openTechnicianSelector = (testId: string, adminRole: string) => {
    setSelectingForTest({ id: testId, role: adminRole });
    setIsSelectorOpen(true);
  };

  const handleTechnicianSelect = (technician: any) => {
    if (selectingForTest) {
      setOverrides((prev) => ({
        ...prev,
        [selectingForTest.id]: technician.id,
      }));
      // Update preview item locally to reflect change immediately in UI (optional, but good UX)
      setPreviewItems((prev) =>
        prev.map((item) =>
          item.testId === selectingForTest.id
            ? {
              ...item,
              adminId: technician.id,
              adminName: technician.fullName,
              adminEmail: technician.email,
              isAvailable: true, // Manually selected is assumed available/valid
            }
            : item
        )
      );
    }
    setIsSelectorOpen(false);
    setSelectingForTest(null);
  };

  const selectedPatientPackage = selectedPatient?.patientPackages?.[0];
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

      {/* Preview Section */}
      {selectedPatient && !assignments.length && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Assignment Preview
              {loadingPreview && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPreview} disabled={loadingPreview}>
              Refresh Preview
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewItems.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4">
                  {previewItems.map((item) => (
                    <div key={item.testId} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.testName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.adminId ? (
                            <>
                              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {item.adminName}
                              </span>
                              <span className="text-xs text-muted-foreground">({item.adminEmail})</span>
                              {overrides[item.testId] && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Manual Override
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              No available technician
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => openTechnicianSelector(item.testId, item.adminRole)}
                        >
                          <UserCog className="h-4 w-4" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleAutoAssign}
                    isLoading={isAssigning}
                    disabled={loadingPreview || isAssigning || previewItems.length === 0}
                    className="w-full sm:w-auto"
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Confirm & Assign All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loadingPreview ? 'Loading assignment preview...' : 'No assignable tests found for this patient.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Section */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Assignments Created Successfully
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
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={() => router.push(`/patients/${selectedPatient?.id}`)}
              >
                View Patient
              </Button>
              <Button variant="outline" onClick={() => {
                setAssignments([]);
                setSelectedPatient(null);
                setOverrides({});
                setPreviewItems([]);
              }}>
                Assign Another Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technician Selector Modal */}
      <TechnicianSelector
        isOpen={isSelectorOpen}
        onClose={() => {
          setIsSelectorOpen(false);
          setSelectingForTest(null);
        }}
        onSelect={handleTechnicianSelect}
        requiredRole={selectingForTest?.role || ''}
        projectId={selectedPatient?.projectId} // Pass project ID for filtering
      />
    </div>
  );
};

