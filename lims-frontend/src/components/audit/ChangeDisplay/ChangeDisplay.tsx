'use client';

import React, { useState } from 'react';
import { AuditLogChanges } from '@/types/audit.types';
import { formatValueForDisplay } from '@/utils/audit-helpers';
import { ChevronDown, ChevronUp, Plus, Minus, Edit } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';

interface ChangeDisplayProps {
  changes: AuditLogChanges | null;
  className?: string;
}

export const ChangeDisplay: React.FC<ChangeDisplayProps> = ({
  changes,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!changes) {
    return (
      <span className="text-sm text-muted-foreground">No changes recorded</span>
    );
  }

  const hasChanges =
    (changes.added && Object.keys(changes.added).length > 0) ||
    (changes.removed && Object.keys(changes.removed).length > 0) ||
    (changes.modified && Object.keys(changes.modified).length > 0) ||
    (changes.before && changes.after);

  if (!hasChanges) {
    return (
      <span className="text-sm text-muted-foreground">No changes recorded</span>
    );
  }

  const renderField = (label: string, value: any, type: 'added' | 'removed' | 'modified' | 'before' | 'after') => {
    const formattedValue = formatValueForDisplay(value);
    const isLongValue = formattedValue.length > 100;

    return (
      <div key={label} className="space-y-1">
        <div className="flex items-center gap-2">
          {type === 'added' && <Plus className="h-3 w-3 text-green-600" />}
          {type === 'removed' && <Minus className="h-3 w-3 text-red-600" />}
          {(type === 'modified' || type === 'before' || type === 'after') && (
            <Edit className="h-3 w-3 text-blue-600" />
          )}
          <span className="text-sm font-medium text-muted-foreground">{label}:</span>
        </div>
        <div
          className={cn(
            'text-sm p-2 rounded-md font-mono text-xs',
            type === 'added' && 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
            type === 'removed' && 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
            (type === 'modified' || type === 'before' || type === 'after') &&
              'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
          )}
        >
          {isLongValue && !isExpanded ? (
            <div>
              <div className="line-clamp-3">{formattedValue}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="mt-2 h-6 text-xs"
              >
                Show more
              </Button>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words">{formattedValue}</pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {changes.added && Object.keys(changes.added).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Added Fields
          </h4>
          <div className="space-y-2 pl-6">
            {Object.entries(changes.added).map(([key, value]) =>
              renderField(key, value, 'added')
            )}
          </div>
        </div>
      )}

      {changes.removed && Object.keys(changes.removed).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
            <Minus className="h-4 w-4" />
            Removed Fields
          </h4>
          <div className="space-y-2 pl-6">
            {Object.entries(changes.removed).map(([key, value]) =>
              renderField(key, value, 'removed')
            )}
          </div>
        </div>
      )}

      {changes.modified && Object.keys(changes.modified).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Modified Fields
          </h4>
          <div className="space-y-3 pl-6">
            {Object.entries(changes.modified).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">{key}:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                    <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                      Before
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-red-800 dark:text-red-200">
                      {formatValueForDisplay(value.before)}
                    </pre>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                    <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                      After
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-green-800 dark:text-green-200">
                      {formatValueForDisplay(value.after)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {changes.before && changes.after && !changes.modified && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">Changes</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                Before
              </div>
              <pre className="whitespace-pre-wrap break-words text-xs text-red-800 dark:text-red-200">
                {formatValueForDisplay(changes.before)}
              </pre>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                After
              </div>
              <pre className="whitespace-pre-wrap break-words text-xs text-green-800 dark:text-green-200">
                {formatValueForDisplay(changes.after)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {changes.after && !changes.before && !changes.added && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Created
          </h4>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
            <pre className="whitespace-pre-wrap break-words text-xs text-green-800 dark:text-green-200">
              {formatValueForDisplay(changes.after)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};



