'use client';

import React, { useState, useRef } from 'react';
import { Copy, Check, Printer, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUIStore } from '@/store/ui.store';
import { formatSampleId, formatPasscode } from '@/utils/blood-sample-helpers';

interface SampleIdPasscodeDisplayProps {
  sampleId: string;
  passcode: string;
  patientName?: string;
  className?: string;
  onPrint?: () => void;
}

export const SampleIdPasscodeDisplay: React.FC<SampleIdPasscodeDisplayProps> = ({
  sampleId,
  passcode,
  patientName,
  className = '',
  onPrint,
}) => {
  const [copiedSampleId, setCopiedSampleId] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const { addToast } = useUIStore();
  const printRef = useRef<HTMLDivElement>(null);

  const handleCopySampleId = async () => {
    try {
      await navigator.clipboard.writeText(sampleId);
      setCopiedSampleId(true);
      addToast({
        type: 'success',
        message: 'Sample ID copied to clipboard',
      });
      setTimeout(() => setCopiedSampleId(false), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to copy sample ID',
      });
    }
  };

  const handleCopyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(passcode);
      setCopiedPasscode(true);
      addToast({
        type: 'success',
        message: 'Passcode copied to clipboard',
      });
      setTimeout(() => setCopiedPasscode(false), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to copy passcode',
      });
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={className}>
      <Card ref={printRef} className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Sample Registration Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-semibold">
              ⚠️ Important: The passcode is shown only once. Please save it now or print this receipt.
            </AlertDescription>
          </Alert>

          {patientName && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
              <p className="text-lg font-semibold">{patientName}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sample ID</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-2xl font-bold text-center">
                  {formatSampleId(sampleId)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySampleId}
                  className="h-10 w-10 p-0"
                  aria-label="Copy sample ID"
                >
                  {copiedSampleId ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Passcode</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-2xl font-bold text-center tracking-widest">
                  {showPasscode ? formatPasscode(passcode, true) : formatPasscode(passcode, false)}
                </code>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="h-10 w-10 p-0"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPasscode}
                    className="h-10 w-10 p-0"
                    aria-label="Copy passcode"
                  >
                    {copiedPasscode ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handlePrint} variant="default" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

