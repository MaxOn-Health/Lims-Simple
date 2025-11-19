'use client';

import React from 'react';
import { Loading } from './Loading';

interface ButtonLoaderProps {
  className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Loading size="sm" className="mr-2" />
      Loading...
    </span>
  );
};

