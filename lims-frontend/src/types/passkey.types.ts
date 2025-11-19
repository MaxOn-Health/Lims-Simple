export interface PasskeyChallenge {
  challenge: string;
  rpId: string;
  allowCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  userVerification?: string;
  timeout?: number;
}

export interface PasskeyCredential {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle: string | null;
  };
  type: 'public-key';
}

export interface PasskeySetupRequest {
  credential: PasskeyCredential;
}

export interface PasskeyVerifyRequest {
  credential: PasskeyCredential;
  challenge: string;
}

export interface PasskeySetupResponse {
  success: boolean;
  message?: string;
}

export interface PasskeyVerifyResponse {
  success: boolean;
  verified: boolean;
  message?: string;
}

