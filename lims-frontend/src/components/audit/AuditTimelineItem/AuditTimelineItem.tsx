'use client';

import React, { useState } from 'react';
import { AuditLog } from '@/types/audit.types';
import { formatAuditTimestamp, formatEntityType } from '@/utils/audit-helpers';
import { ActionBadge } from '../ActionBadge/ActionBadge';
import { ChangeDisplay } from '../ChangeDisplay/ChangeDisplay';

interface AuditTimelineItemProps {
  log: AuditLog;
  isLast?: boolean;
}

export const AuditTimelineItem: React.FC<AuditTimelineItemProps> = ({
  log,
  isLast = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = log.changes && Object.keys(log.changes).length > 0;

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
      )}

      {/* Timeline dot */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <div className="h-2 w-2 rounded-full bg-current" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ActionBadge action={log.action} />
            <span className="text-sm text-muted-foreground">
              {formatAuditTimestamp(log.timestamp)}
            </span>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-medium">
            {log.user ? `${log.user.fullName} (${log.user.email})` : 'System'}
          </span>
          {' '}
          <span className="text-muted-foreground">
            {log.action.toLowerCase()} {formatEntityType(log.entityType).toLowerCase()}
            {log.entityId && ` (${log.entityId.substring(0, 8)}...)`}
          </span>
        </div>

        {hasChanges && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary hover:underline"
            >
              {isExpanded ? 'Hide changes' : 'Show changes'}
            </button>
            {isExpanded && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <ChangeDisplay changes={log.changes} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

