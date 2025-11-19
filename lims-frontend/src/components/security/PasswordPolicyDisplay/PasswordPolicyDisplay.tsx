'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordPolicyDisplay: React.FC = () => {
  const requirements = [
    {
      label: 'Minimum 8 characters',
      met: true,
    },
    {
      label: 'At least one uppercase letter',
      met: true,
    },
    {
      label: 'At least one lowercase letter',
      met: true,
    },
    {
      label: 'At least one number',
      met: true,
    },
    {
      label: 'At least one special character',
      met: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Password Requirements</h4>
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md',
                req.met ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              )}
            >
              {req.met ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm',
                  req.met
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                )}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Example Valid Password:
        </p>
        <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded">
          MyP@ssw0rd123
        </code>
      </div>

      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
          Example Invalid Password:
        </p>
        <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded">
          password123 (too weak)
        </code>
      </div>
    </div>
  );
};



