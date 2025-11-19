'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/common/Button/Button';
import { Label } from '@/components/ui/label';
import { doctorReviewsService } from '@/services/api/doctor-reviews.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { FileText, Save, CheckCircle2 } from 'lucide-react';
import { SignReportButton } from '../SignReportButton/SignReportButton';

interface ReviewFormProps {
  patientId: string;
  existingReview?: {
    id: string;
    remarks: string | null;
    reviewedAt: Date | null;
    signedAt: Date | null;
    isSigned: boolean;
  };
  onUpdate?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  patientId,
  existingReview,
  onUpdate,
}) => {
  const { addToast } = useUIStore();
  const [remarks, setRemarks] = useState(existingReview?.remarks || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigned, setIsSigned] = useState(existingReview?.isSigned || false);

  const handleSaveReview = async () => {
    setIsSaving(true);
    try {
      await doctorReviewsService.createOrUpdateReview({
        patientId,
        remarks: remarks.trim() || undefined,
      });
      addToast({
        type: 'success',
        message: 'Review saved successfully',
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError) || 'Failed to save review',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignSuccess = () => {
    setIsSigned(true);
    addToast({
      type: 'success',
      message: 'Report signed successfully',
    });
    if (onUpdate) {
      onUpdate();
    }
  };

  const canSign = (!existingReview || !existingReview.isSigned) && remarks.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Doctor Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="remarks">
            Remarks
            <span className="text-muted-foreground text-sm ml-2">
              (Optional - Add your clinical observations and recommendations)
            </span>
          </Label>
          <Textarea
            id="remarks"
            placeholder="Enter your clinical remarks, observations, and recommendations here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={6}
            className="resize-none"
            maxLength={2000}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {remarks.length} / 2000 characters
            </span>
            {existingReview?.reviewedAt && (
              <span>
                Last reviewed: {new Date(existingReview.reviewedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            onClick={handleSaveReview}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Review'}
          </Button>

          {canSign && (
            <SignReportButton
              patientId={patientId}
              onSuccess={handleSignSuccess}
            />
          )}

          {isSigned && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Report Signed</span>
              {existingReview?.signedAt && (
                <span className="text-xs text-muted-foreground">
                  on {new Date(existingReview.signedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {existingReview?.remarks && !remarks && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium text-muted-foreground mb-1">Previous Remarks:</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {existingReview.remarks}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

