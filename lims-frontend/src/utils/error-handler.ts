import { AxiosError } from 'axios';
import { ApiError } from './api.types';

export function transformError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as ApiError;
      return {
        statusCode: error.response.status,
        message: data.message || error.message,
        error: data.error || error.response.statusText,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        statusCode: 0,
        message: 'Network error. Please check your connection.',
        error: 'Network Error',
      };
    }
  }

  // Unknown error
  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
    error: 'Unknown Error',
  };
}

export function getErrorMessage(error: ApiError): string {
  if (Array.isArray(error.message)) {
    return error.message.join(', ');
  }
  return error.message || 'An error occurred';
}

export function isNetworkError(error: ApiError): boolean {
  return error.statusCode === 0;
}

export function isUnauthorizedError(error: ApiError): boolean {
  return error.statusCode === 401;
}

export function isForbiddenError(error: ApiError): boolean {
  return error.statusCode === 403;
}

export function isValidationError(error: ApiError): boolean {
  return error.statusCode === 400;
}

export function isServerError(error: ApiError): boolean {
  return error.statusCode >= 500;
}

