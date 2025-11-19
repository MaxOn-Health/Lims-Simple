'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';

interface PatientIdDisplayProps {
  patientId: string;
  className?: string;
  showLabel?: boolean;
}

export const PatientIdDisplay: React.FC<PatientIdDisplayProps> = ({
  patientId,
  className = '',
  showLabel = true,
}) => {
  const [copied, setCopied] = useState(false);
  const { addToast } = useUIStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(patientId);
      setCopied(true);
      addToast({
        type: 'success',
        message: 'Patient ID copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to copy patient ID',
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">Patient ID:</span>
      )}
      <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-sm font-semibold text-foreground">
        {patientId}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0"
        aria-label="Copy patient ID"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

