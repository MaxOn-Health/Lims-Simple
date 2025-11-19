import apiClient from './api.client';
import {
  PasskeyChallenge,
  PasskeyCredential,
  PasskeySetupRequest,
  PasskeyVerifyRequest,
  PasskeySetupResponse,
  PasskeyVerifyResponse,
} from '../../types/passkey.types';

export interface PasskeySetupChallenge {
  challengeId: string;
  options: any; // WebAuthn PublicKeyCredentialCreationOptions
}

export interface PasskeyVerifyChallenge {
  challengeId: string;
  options: any; // WebAuthn PublicKeyCredentialRequestOptions
}

export const passkeyService = {
  async setupPasskey(): Promise<PasskeySetupChallenge> {
    const response = await apiClient.post<PasskeySetupChallenge>(
      '/auth/setup-passkey'
    );
    return response.data;
  },

  async verifyPasskeySetup(
    challengeId: string,
    credential: PasskeyCredential,
    challenge: string
  ): Promise<PasskeySetupResponse> {
    const response = await apiClient.post<PasskeySetupResponse>(
      '/auth/verify-passkey-setup',
      {
        challengeId,
        credential,
        challenge,
      }
    );
    return response.data;
  },

  async verifyPasskeyForSigning(
    challengeId: string,
    credential: PasskeyCredential,
    challenge: string
  ): Promise<PasskeyVerifyResponse> {
    const response = await apiClient.post<PasskeyVerifyResponse>(
      '/auth/verify-passkey',
      {
        challengeId,
        credential,
        challenge,
      }
    );
    return response.data;
  },
};

