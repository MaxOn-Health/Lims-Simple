'use client';

import React from 'react';
import { ButtonHTMLAttributes } from 'react';
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<ShadcnButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantMap: Record<string, ShadcnButtonProps['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  outline: 'outline',
  ghost: 'ghost',
  link: 'link',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <ShadcnButton
      variant={variantMap[variant] || 'default'}
      size={size}
      disabled={disabled || isLoading}
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </ShadcnButton>
  );
};


