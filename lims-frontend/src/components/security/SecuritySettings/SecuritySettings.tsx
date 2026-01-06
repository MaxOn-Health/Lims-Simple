'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordPolicyDisplay } from '../PasswordPolicyDisplay/PasswordPolicyDisplay';
import { SessionInfo } from '../SessionInfo/SessionInfo';
import { Shield, Lock, Clock } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Current password requirements and security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordPolicyDisplay />
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Current session information and token details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionInfo />
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Features
          </CardTitle>
          <CardDescription>
            Security features enabled in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">JWT Authentication</p>
                <p className="text-sm text-green-700 dark:text-green-300">Secure token-based authentication</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Role-Based Access Control</p>
                <p className="text-sm text-green-700 dark:text-green-300">Granular permissions per role</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Passkey Authentication</p>
                <p className="text-sm text-green-700 dark:text-green-300">WebAuthn for doctors</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Audit Logging</p>
                <p className="text-sm text-green-700 dark:text-green-300">Comprehensive activity tracking</p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-md">
              <div>
                <p className="font-medium text-muted-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Additional security layer (coming soon)</p>
              </div>
              <span className="text-muted-foreground font-semibold">Coming Soon</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-md">
              <div>
                <p className="font-medium text-muted-foreground">API Key Management</p>
                <p className="text-sm text-muted-foreground">Manage API keys for integrations (coming soon)</p>
              </div>
              <span className="text-muted-foreground font-semibold">Coming Soon</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Transaction Security
          </CardTitle>
          <CardDescription>
            Manage your secure transaction PIN for approving sensitive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionPinForm />
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium">Use strong passwords</p>
                <p className="text-muted-foreground">Follow the password policy requirements</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium">Never share your credentials</p>
                <p className="text-muted-foreground">Keep your login information confidential</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium">Log out when finished</p>
                <p className="text-muted-foreground">Always log out from shared or public computers</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium">Report suspicious activity</p>
                <p className="text-muted-foreground">Contact your administrator if you notice anything unusual</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium">Set a Transaction PIN</p>
                <p className="text-muted-foreground">Use a 4-digit PIN for extra security on critical actions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Internal component for PIN form to keep main file clean or we should extract it
import { useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/store/ui.store';
import { authService } from '@/services/api/auth.service';
import { Loader2 } from 'lucide-react';

const TransactionPinForm: React.FC = () => {
  const { addToast } = useUIStore();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;

    setIsLoading(true);
    try {
      await authService.setupPin(pin);
      addToast({ type: 'success', message: 'Transaction PIN set successfully' });
      setPin('');
    } catch (error) {
      // Error handling via interceptor or toast
      addToast({ type: 'error', message: 'Failed to set PIN' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSetPin} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pin">New 4-Digit PIN</Label>
        <div className="flex gap-2">
          <Input
            id="pin"
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 4) setPin(val);
            }}
            placeholder="••••"
            className="tracking-widest"
          />
          <Button type="submit" disabled={pin.length !== 4 || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set PIN
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This PIN will be required for sensitive actions like submitting results.
        </p>
      </div>
    </form>
  );
};



