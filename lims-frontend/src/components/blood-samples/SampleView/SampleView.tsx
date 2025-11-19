'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { BloodSample } from '@/types/blood-sample.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SampleStatusBadge } from '../SampleStatusBadge/SampleStatusBadge';
import { SampleStatusTimeline } from '../SampleStatusTimeline/SampleStatusTimeline';
import { UpdateStatusModal } from '../UpdateStatusModal/UpdateStatusModal';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { canSubmitResult } from '@/utils/blood-sample-helpers';
import {
  FlaskConical,
  User,
  Calendar,
  UserCheck,
  FileText,
  Edit,
} from 'lucide-react';

interface SampleViewProps {
  sample: BloodSample;
  onUpdate?: () => void;
}

export const SampleView: React.FC<SampleViewProps> = ({ sample, onUpdate }) => {
  const router = useRouter();
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);

  const handleStatusUpdate = () => {
    setUpdateStatusModalOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sample Information</CardTitle>
            <SampleStatusBadge status={sample.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sample ID</p>
              <p className="text-base font-mono font-semibold text-foreground mt-1">
                {sample.sampleId}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                <SampleStatusBadge status={sample.status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Timeline */}
          <SampleStatusTimeline currentStatus={sample.status} />

          <Separator />

          {/* Collection Information */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Collection Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collected Date</p>
              <p className="text-base text-foreground mt-1">
                {format(new Date(sample.collectedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collected By</p>
              <p className="text-base text-foreground mt-1">
                {sample.collectedByUser?.fullName || '—'}
              </p>
            </div>
          </div>

          {sample.testedAt && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Testing Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tested Date</p>
                  <p className="text-base text-foreground mt-1">
                    {format(new Date(sample.testedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tested By</p>
                  <p className="text-base text-foreground mt-1">
                    {sample.testedByUser?.fullName || '—'}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Patient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sample.patient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                <Link
                  href={`/patients/${sample.patient.id}`}
                  className="text-base font-semibold text-primary hover:underline mt-1 block"
                >
                  {sample.patient.name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                <p className="text-base text-foreground mt-1">{sample.patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-base text-foreground mt-1">{sample.patient.age}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-base text-foreground mt-1">{sample.patient.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                <p className="text-base text-foreground mt-1">{sample.patient.contactNumber}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Patient information not available</p>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <HasRole allowedRoles={[UserRole.LAB_TECHNICIAN, UserRole.SUPER_ADMIN]}>
              <Button
                variant="outline"
                onClick={() => setUpdateStatusModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </HasRole>
            {canSubmitResult(sample.status) && (
              <Button
                variant="default"
                onClick={() => router.push(`/blood-samples/${sample.id}/result`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Submit Result
              </Button>
            )}
            {sample.assignmentId && (
              <Link href={`/assignments/${sample.assignmentId}`}>
                <Button variant="outline">
                  View Assignment
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {updateStatusModalOpen && (
        <UpdateStatusModal
          isOpen={updateStatusModalOpen}
          onClose={() => setUpdateStatusModalOpen(false)}
          sample={sample}
          onSuccess={handleStatusUpdate}
        />
      )}
    </div>
  );
};

