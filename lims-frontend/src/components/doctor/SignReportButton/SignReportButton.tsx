'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import { doctorReviewsService } from '@/services/api/doctor-reviews.service';
import { passkeyService } from '@/services/api/passkey.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { verifyPasskey, getWebAuthnErrorMessage } from '@/utils/webauthn';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface SignReportButtonProps {
  patientId: string;
  onSuccess?: () => void;
}

export const SignReportButton: React.FC<SignReportButtonProps> = ({
  patientId,
  onSuccess,
}) => {
  const { addToast } = useUIStore();
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      // Generate challenge client-side (in production, backend should provide endpoint)
      // The backend signReport method extracts challenge from clientDataJSON
      const challengeArray = new Uint8Array(32);
      crypto.getRandomValues(challengeArray);
      const challengeBase64 = btoa(String.fromCharCode(...challengeArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      // Use WebAuthn to verify with the challenge
      const options = {
        challenge: challengeBase64,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials: [], // Browser will use stored credentials
        userVerification: 'required' as const,
        timeout: 60000,
      };
      
      const credential = await verifyPasskey(options);
      
      // Sign the report with the credential
      // Backend will extract challenge from credential.clientDataJSON
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
    <Button
      variant="default"
      onClick={handleSign}
      disabled={isSigning}
      className="gap-2"
    >
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
  );
};

