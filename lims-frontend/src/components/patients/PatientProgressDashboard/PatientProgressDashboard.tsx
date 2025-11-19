'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { patientsService } from '@/services/api/patients.service';
import { PatientProgress } from '@/types/patient.types';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { Skeleton } from '@/components/common/Skeleton';
import { Search, AlertTriangle, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { AssignmentStatus } from '@/types/assignment.types';
import { BloodSampleStatus } from '@/types/blood-sample.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const PatientProgressDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [patients, setPatients] = useState<PatientProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPatients = async (search?: string, pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patientsService.getPatientProgress({
        search,
        page: pageNum,
        limit,
      });
      setPatients(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load patient progress',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(searchQuery || undefined, page);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients(searchQuery || undefined, 1);
  };

  const filteredPatients = useMemo(() => {
    if (!filterMissing) return patients;
    return patients.filter((p) => p.hasMissingItems);
  }, [patients, filterMissing]);

  const statistics = useMemo(() => {
    const allPatients = filteredPatients;
    const withMissing = allPatients.filter((p) => p.hasMissingItems).length;
    const allCompleted = allPatients.filter(
      (p) => p.testsCompleted === p.totalTestsExpected && !p.bloodSampleMissing
    ).length;
    const avgProgress = allPatients.length > 0
      ? Math.round(allPatients.reduce((sum, p) => sum + p.overallProgress, 0) / allPatients.length)
      : 0;

    return {
      total: allPatients.length,
      withMissing,
      allCompleted,
      avgProgress,
    };
  }, [filteredPatients]);

  const getStatusBadge = (patient: PatientProgress, testIndex: number) => {
    const test = patient.testProgress[testIndex];
    if (!test) return <Badge variant="outline">N/A</Badge>;

    if (test.assignmentStatus === AssignmentStatus.SUBMITTED && test.hasResult) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }

    if (test.assignmentStatus && test.assignmentStatus !== AssignmentStatus.PENDING) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }

    if (test.assignmentId) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          Assigned
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Not Assigned
      </Badge>
    );
  };

  const getBloodSampleBadge = (patient: PatientProgress) => {
    if (patient.bloodSampleStatus === BloodSampleStatus.COMPLETED) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Collected
        </Badge>
      );
    }

    if (patient.bloodSampleStatus) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {patient.bloodSampleStatus}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Not Collected
      </Badge>
    );
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load patient progress"
        message={error}
        onRetry={() => fetchPatients(searchQuery || undefined, page)}
      />
    );
  }

  const maxTestsToShow = Math.max(...filteredPatients.map((p) => p.testProgress.length), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Progress Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track all patients and their test completion status
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Missing Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics.withMissing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.allCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by patient ID, name, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Button
              type="button"
              variant={filterMissing ? 'default' : 'outline'}
              onClick={() => {
                setFilterMissing(!filterMissing);
                setPage(1);
              }}
            >
              {filterMissing ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Show All
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Show Missing Only
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              title="No patients found"
              message={filterMissing ? 'No patients with missing items' : 'Try adjusting your search or filters'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tests Expected</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Blood Sample</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-sm">{patient.patientId}</TableCell>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.contactNumber}</TableCell>
                      <TableCell>{patient.totalTestsExpected}</TableCell>
                      <TableCell>{patient.testsAssigned}</TableCell>
                      <TableCell>{patient.testsCompleted}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                patient.overallProgress === 100
                                  ? 'bg-green-500'
                                  : patient.overallProgress >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${patient.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {patient.overallProgress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getBloodSampleBadge(patient)}</TableCell>
                      <TableCell>
                        {patient.hasMissingItems ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Missing Items
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(patient.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredPatients.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

