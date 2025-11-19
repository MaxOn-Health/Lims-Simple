'use client';

import React from 'react';
import { Loading } from './Loading';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading size="lg" />
    </div>
  );
};

