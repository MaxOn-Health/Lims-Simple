/**
 * WebAuthn utility functions for passkey creation and verification
 */

export interface WebAuthnError extends Error {
  code?: string;
  name: string;
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

/**
 * Convert base64url to ArrayBuffer
 */
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  const paddedBase64 = padding
    ? base64 + '='.repeat(4 - padding)
    : base64;
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64url
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert WebAuthn options from server format to browser format
 */
function convertCreateOptions(options: any): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToArrayBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64UrlToArrayBuffer(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToArrayBuffer(cred.id),
    })),
  };
}

/**
 * Convert WebAuthn options from server format to browser format (for authentication)
 */
function convertGetOptions(options: any): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToArrayBuffer(options.challenge),
    allowCredentials: options.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: base64UrlToArrayBuffer(cred.id),
    })),
  };
}

/**
 * Convert credential response to server format
 */
function convertCredentialToServerFormat(
  credential: PublicKeyCredential
): any {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  
  if (response instanceof AuthenticatorAttestationResponse) {
    return {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      response: {
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(response.attestationObject),
      },
      type: credential.type,
    };
  } else {
    return {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      response: {
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        signature: arrayBufferToBase64Url(response.signature),
        userHandle: response.userHandle
          ? arrayBufferToBase64Url(response.userHandle)
          : null,
      },
      type: credential.type,
    };
  }
}

/**
 * Create a new passkey credential
 */
export async function createPasskey(
  options: any
): Promise<any> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    const publicKeyCredentialCreationOptions = convertCreateOptions(options);
    
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    return convertCredentialToServerFormat(credential);
  } catch (error: any) {
    const webauthnError: WebAuthnError = new Error(
      error.message || 'Failed to create passkey'
    );
    webauthnError.name = error.name || 'WebAuthnError';
    webauthnError.code = error.code;
    throw webauthnError;
  }
}

/**
 * Verify a passkey credential (for signing)
 */
export async function verifyPasskey(options: any): Promise<any> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  try {
    const publicKeyCredentialRequestOptions = convertGetOptions(options);
    
    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Failed to verify credential');
    }

    return convertCredentialToServerFormat(credential);
  } catch (error: any) {
    const webauthnError: WebAuthnError = new Error(
      error.message || 'Failed to verify passkey'
    );
    webauthnError.name = error.name || 'WebAuthnError';
    webauthnError.code = error.code;
    throw webauthnError;
  }
}

/**
 * Get user-friendly error message from WebAuthn error
 */
export function getWebAuthnErrorMessage(error: WebAuthnError): string {
  if (error.name === 'NotAllowedError') {
    return 'Passkey creation was cancelled or timed out. Please try again.';
  }
  if (error.name === 'InvalidStateError') {
    return 'This passkey already exists. Please use a different device or remove the existing passkey.';
  }
  if (error.name === 'NotSupportedError') {
    return 'Your browser or device does not support passkeys. Please use a different browser or device.';
  }
  if (error.name === 'SecurityError') {
    return 'Security error occurred. Please ensure you are using HTTPS or localhost.';
  }
  if (error.name === 'UnknownError') {
    return 'An unknown error occurred. Please try again.';
  }
  return error.message || 'An error occurred while setting up your passkey.';
}

