'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doctorReviewsService } from '@/services/api/doctor-reviews.service';
import { PatientReview, ReviewStatus } from '@/types/doctor-review.types';
import { PatientReviewCard } from '../PatientReviewCard/PatientReviewCard';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/common/Skeleton';
import { Search, FileText, CheckCircle2, Clock } from 'lucide-react';
import { format, isToday } from 'date-fns';

export const DoctorDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [patients, setPatients] = useState<PatientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPatients = async (status?: ReviewStatus, search?: string, pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorReviewsService.getPatientsForReview({
        status,
        search,
        page: pageNum,
        limit: 12,
      });
      setPatients(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
      addToast({
        type: 'error',
        message: 'Failed to load patients',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const status = selectedStatus === 'all' ? undefined : (selectedStatus as ReviewStatus);
    fetchPatients(status, searchQuery || undefined, page);
  }, [selectedStatus, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const status = selectedStatus === 'all' ? undefined : (selectedStatus as ReviewStatus);
    fetchPatients(status, searchQuery || undefined, 1);
  };

  const statistics = useMemo(() => {
    const pending = patients.filter((p) => p.status === ReviewStatus.PENDING).length;
    const reviewed = patients.filter((p) => p.status === ReviewStatus.REVIEWED).length;
    const signed = patients.filter((p) => p.status === ReviewStatus.SIGNED).length;
    const reviewedToday = patients.filter(
      (p) => p.reviewedAt && isToday(new Date(p.reviewedAt))
    ).length;
    const signedToday = patients.filter(
      (p) => p.signedAt && isToday(new Date(p.signedAt))
    ).length;

    return {
      pending,
      reviewed,
      signed,
      reviewedToday,
      signedToday,
    };
  }, [patients]);

  const handleReview = (patientId: string) => {
    router.push(`/doctor/patients/${patientId}/review`);
  };

  if (error && !isLoading) {
    return (
      <ErrorState
        title="Failed to load patients"
        message={error}
        onRetry={() => {
          const status = selectedStatus === 'all' ? undefined : (selectedStatus as ReviewStatus);
          fetchPatients(status, searchQuery || undefined, page);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Doctor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Review patient test results and sign reports
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.reviewedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.signedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.reviewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Signed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.signed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {/* Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList>
          <TabsTrigger value="PENDING">
            <Clock className="h-4 w-4 mr-2" />
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="REVIEWED">
            <FileText className="h-4 w-4 mr-2" />
            Reviewed
          </TabsTrigger>
          <TabsTrigger value="SIGNED">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Signed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <EmptyState
              title="No patients found"
              message={
                selectedStatus === ReviewStatus.PENDING
                  ? 'No patients are ready for review yet.'
                  : `No patients with ${selectedStatus.toLowerCase()} status.`
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {patients.map((patientReview) => (
                  <PatientReviewCard
                    key={patientReview.patient.id}
                    patientReview={patientReview}
                    onReview={handleReview}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

