'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/common/Button/Button';
import { Result } from '@/types/result.types';
import { resultsService } from '@/services/api/results.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { ResultView } from '../ResultView/ResultView';
import { CheckCircle, Loader2 } from 'lucide-react';
import { testsService } from '@/services/api/tests.service';
import { Test } from '@/types/test.types';

interface VerifyResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: Result | null;
  onSuccess?: () => void;
}

export const VerifyResultModal: React.FC<VerifyResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const [test, setTest] = useState<Test | null>(null);

  React.useEffect(() => {
    if (result?.test?.id) {
      testsService
        .getTestById(result.test.id)
        .then(setTest)
        .catch(() => {
          // Silently fail
        });
    }
  }, [result]);

  const handleVerify = async () => {
    if (!result) return;

    setIsVerifying(true);
    try {
      await resultsService.verifyResult(result.id);
      addToast({
        type: 'success',
        message: 'Result verified successfully',
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to verify result',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" /> Verify Test Result
          </DialogTitle>
          <DialogDescription>
            Review the result details below and confirm verification. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {test ? (
            <ResultView result={result} test={test} />
          ) : (
            <div className="p-4">
              <p className="text-muted-foreground">Loading test details...</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button" disabled={isVerifying}>
            Cancel
          </Button>
          <Button type="button" onClick={handleVerify} isLoading={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

