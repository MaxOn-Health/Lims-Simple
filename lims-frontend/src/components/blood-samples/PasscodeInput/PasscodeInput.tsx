'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasscodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const PasscodeInput: React.FC<PasscodeInputProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
  autoFocus = false,
  className,
}) => {
  const [showPasscode, setShowPasscode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));

  useEffect(() => {
    // Sync digits with value prop
    const valueDigits = value.split('').slice(0, 6);
    const newDigits = [...Array(6).fill('')];
    valueDigits.forEach((digit, index) => {
      newDigits[index] = digit;
    });
    setDigits(newDigits);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleDigitChange = (index: number, digit: string) => {
    // Only allow digits
    if (digit && !/^\d$/.test(digit)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Update parent value
    const newValue = newDigits.join('');
    onChange(newValue);

    // Auto-focus next field
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous field if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...Array(6).fill('')];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newDigits[index] = digit;
      }
    });
    setDigits(newDigits);
    onChange(newDigits.join(''));
    // Focus the next empty field or the last field
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleClear = () => {
    setDigits(Array(6).fill(''));
    onChange('');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className={cn(error && 'text-destructive')}>{label}</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPasscode(!showPasscode)}
              className="h-8 w-8 p-0"
              disabled={disabled}
            >
              {showPasscode ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type={showPasscode ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'h-12 w-12 text-center text-lg font-semibold',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label={`Passcode digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

