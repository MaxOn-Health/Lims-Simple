'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/common/Button/Button';
import { passkeyService } from '@/services/api/passkey.service';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { createPasskey, getWebAuthnErrorMessage, isWebAuthnSupported } from '@/utils/webauthn';
import { Key, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';

export const PasskeySetup: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has passkey set up
    // In a real implementation, you'd check user.passkeyCredentialId or call an API
    // For now, we'll assume it's stored in user object or we need to check via API
    setIsChecking(false);
    // TODO: Check if user has passkey from user object or API
  }, [user]);

  const handleSetupPasskey = async () => {
    if (!isWebAuthnSupported()) {
      addToast({
        type: 'error',
        message: 'WebAuthn is not supported in this browser. Please use a modern browser.',
      });
      return;
    }

    setIsSettingUp(true);
    try {
      // Step 1: Get challenge from backend
      const challengeResponse = await passkeyService.setupPasskey();
      
      // Step 2: Create passkey using WebAuthn
      const credential = await createPasskey(challengeResponse.options);
      
      // Step 3: Verify and store passkey
      await passkeyService.verifyPasskeySetup(
        challengeResponse.challengeId,
        credential,
        challengeResponse.options.challenge
      );
      
      setHasPasskey(true);
      addToast({
        type: 'success',
        message: 'Passkey set up successfully! You can now use it to sign reports.',
      });
    } catch (err: any) {
      const apiError = err as ApiError;
      const errorMessage = err.name === 'WebAuthnError' 
        ? getWebAuthnErrorMessage(err)
        : getErrorMessage(apiError) || 'Failed to set up passkey';
      
      addToast({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Checking passkey status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Passkey Setup
        </CardTitle>
        <CardDescription>
          Set up a passkey (biometric or security key) to securely sign patient reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isWebAuthnSupported() && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                WebAuthn Not Supported
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your browser does not support WebAuthn. Please use a modern browser like Chrome,
                Firefox, Safari, or Edge to set up a passkey.
              </p>
            </div>
          </div>
        )}

        {hasPasskey ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Passkey Configured
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your passkey is set up and ready to use. You can use it to sign patient reports.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSetupPasskey}
              disabled={isSettingUp || !isWebAuthnSupported()}
              className="gap-2"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Change Passkey
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">What is a passkey?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Secure authentication using biometrics (fingerprint, face) or a security key</li>
                <li>Required to sign patient reports digitally</li>
                <li>More secure than passwords</li>
                <li>Works across your devices</li>
              </ul>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Security Note
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You will be prompted to authenticate using your device's biometric sensor or
                  security key. This ensures that only you can sign reports.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              onClick={handleSetupPasskey}
              disabled={isSettingUp || !isWebAuthnSupported()}
              className="gap-2 w-full sm:w-auto"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up passkey...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Set Up Passkey
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

