'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { PatientView } from '@/components/patients/PatientView/PatientView';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { patientsService } from '@/services/api/patients.service';
import { Patient } from '@/types/patient.types';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await patientsService.getPatientById(patientId);
        setPatient(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(getErrorMessage(apiError));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleUpdate = async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await patientsService.getPatientById(patientId);
      setPatient(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <Skeleton height="h-8" />
              <Skeleton height="h-64" />
              <Skeleton height="h-64" />
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Failed to load patient"
              message={error}
              onRetry={() => {
                if (patientId) {
                  handleUpdate();
                }
              }}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!patient) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="px-4 py-6 sm:px-0">
            <ErrorState
              title="Patient not found"
              message="The patient you're looking for doesn't exist."
              onRetry={() => router.push('/patients')}
            />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="px-4 py-6 sm:px-0">
          <PatientView patient={patient} onUpdate={handleUpdate} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

