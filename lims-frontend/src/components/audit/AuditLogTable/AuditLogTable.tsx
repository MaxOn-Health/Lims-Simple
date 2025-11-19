'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuditLog } from '@/types/audit.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActionBadge } from '../ActionBadge/ActionBadge';
import { EntityTypeBadge } from '../EntityTypeBadge/EntityTypeBadge';
import { ChangeDisplay } from '../ChangeDisplay/ChangeDisplay';
import { formatAuditTimestamp, getEntityDetailUrl } from '@/utils/audit-helpers';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';

interface AuditLogTableProps {
  logs: AuditLog[];
  onEntityClick?: (entityType: string, entityId: string) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  onEntityClick,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handleEntityClick = (entityType: string, entityId: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (entityId && onEntityClick) {
      onEntityClick(entityType, entityId);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Entity Type</TableHead>
          <TableHead>Entity ID</TableHead>
          <TableHead>Changes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No audit logs found
            </TableCell>
          </TableRow>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);
            const entityUrl = getEntityDetailUrl(log.entityType, log.entityId);
            const hasChanges = log.changes && Object.keys(log.changes).length > 0;

            return (
              <React.Fragment key={log.id}>
                <TableRow
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    hasChanges && 'border-b-0'
                  )}
                  onClick={() => hasChanges && toggleRow(log.id)}
                >
                  <TableCell className="font-mono text-xs">
                    {formatAuditTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div>
                        <div className="font-medium">{log.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <EntityTypeBadge entityType={log.entityType} />
                  </TableCell>
                  <TableCell>
                    {log.entityId ? (
                      entityUrl ? (
                        <Link
                          href={entityUrl}
                          onClick={(e) => handleEntityClick(log.entityType, log.entityId, e)}
                          className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {log.entityId.substring(0, 8)}...
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">{log.entityId.substring(0, 8)}...</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasChanges ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(log.id);
                        }}
                        className="gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No changes</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && hasChanges && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30 p-4">
                      <ChangeDisplay changes={log.changes} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};



