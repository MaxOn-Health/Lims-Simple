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
import { doctorReviewsService } from '@/services/api/doctor-reviews.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { verifyPasskey, getWebAuthnErrorMessage } from '@/utils/webauthn';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { PatientResults } from '@/types/doctor-review.types';

interface SignReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientResults?: PatientResults;
  onSuccess?: () => void;
}

export const SignReportModal: React.FC<SignReportModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientResults,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      // Generate challenge client-side
      const challengeArray = new Uint8Array(32);
      crypto.getRandomValues(challengeArray);
      const challengeBase64 = btoa(String.fromCharCode(...challengeArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      // Use WebAuthn to verify
      const options = {
        challenge: challengeBase64,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials: [],
        userVerification: 'required' as const,
        timeout: 60000,
      };
      
      const credential = await verifyPasskey(options);
      
      // Sign the report
      await doctorReviewsService.signReport({
        patientId,
        passkeyCredential: credential,
      });
      
      addToast({
        type: 'success',
        message: 'Report signed successfully',
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const apiError = err as ApiError;
      const errorMessage = err.name === 'WebAuthnError' 
        ? getWebAuthnErrorMessage(err)
        : getErrorMessage(apiError) || 'Failed to sign report';
      
      addToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sign Report</DialogTitle>
          <DialogDescription>
            Sign this report using your passkey. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {patientResults && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Patient:</p>
              <p className="text-sm text-muted-foreground">
                {patientResults.patient.name} ({patientResults.patient.patientId})
              </p>
            </div>
            {patientResults.review?.remarks && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Remarks:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {patientResults.review.remarks}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                You will be prompted to authenticate with your passkey (biometric or security key).
                Make sure you have set up a passkey in your account settings.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSigning}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSign} disabled={isSigning} className="gap-2">
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Sign Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

