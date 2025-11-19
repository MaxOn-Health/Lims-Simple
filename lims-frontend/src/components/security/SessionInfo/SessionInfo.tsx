'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { tokenStorage } from '@/services/storage/token.storage';
import { format, differenceInMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const SessionInfo: React.FC = () => {
  const { user } = useAuthStore();
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // JWT tokens typically expire in 15 minutes
    // We'll estimate expiry time (in a real app, decode JWT to get actual expiry)
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken && !tokenExpiry) {
      // Estimate: tokens expire in 15 minutes from creation
      // In production, decode JWT to get actual exp claim
      const estimatedExpiry = new Date(Date.now() + 15 * 60 * 1000);
      setTokenExpiry(estimatedExpiry);
    }
  }, []); // Only run once on mount

  useEffect(() => {
    if (!tokenExpiry) return;

    // Update time remaining every second
    const updateTimeRemaining = () => {
      const now = new Date();
      const minutesRemaining = differenceInMinutes(tokenExpiry, now);
      
      if (minutesRemaining <= 0) {
        setTimeRemaining('Expired');
      } else if (minutesRemaining < 60) {
        setTimeRemaining(`${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`);
      } else {
        const hours = Math.floor(minutesRemaining / 60);
        const mins = minutesRemaining % 60;
        setTimeRemaining(`${hours}h ${mins}m`);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Then update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current User</p>
              <p className="text-base font-semibold">{user?.fullName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-base font-semibold">{user?.role || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Session Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-base font-semibold text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Token Expires In</p>
              <p className="text-base font-semibold">
                {timeRemaining || 'Calculating...'}
              </p>
              {tokenExpiry && (
                <p className="text-xs text-muted-foreground">
                  {format(tokenExpiry, 'MMM dd, yyyy HH:mm:ss')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Recommendations
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
              <li>Access tokens expire after 15 minutes for security</li>
              <li>Refresh tokens are automatically used to renew access</li>
              <li>Log out when finished to invalidate your session</li>
              <li>Do not share your session tokens with anyone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

