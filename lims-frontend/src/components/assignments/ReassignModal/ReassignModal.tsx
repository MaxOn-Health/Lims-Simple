'use client';

import React, { useState } from 'react';
import { Assignment } from '@/types/assignment.types';
import { assignmentsService } from '@/services/api/assignments.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { TechnicianSelector } from '../TechnicianSelector/TechnicianSelector';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSuccess?: () => void;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [isReassigning, setIsReassigning] = useState(false);

  const handleTechnicianSelect = async (technicianId: string | null) => {
    if (!assignment || !technicianId) {
      onClose();
      return;
    }

    setIsReassigning(true);
    try {
      await assignmentsService.reassign(assignment.id, { adminId: technicianId });
      addToast({
        type: 'success',
        message: 'Assignment reassigned successfully',
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    } finally {
      setIsReassigning(false);
    }
  };

  if (!assignment) {
    return null;
  }

  return (
    <TechnicianSelector
      isOpen={isOpen}
      onClose={onClose}
      testId={assignment.testId}
      projectId={assignment.patient?.projectId}
      selectedTechnicianId={assignment.adminId || undefined}
      onSelect={handleTechnicianSelect}
      testName={assignment.test?.name}
      showAutoAssign={false}
    />
  );
};
