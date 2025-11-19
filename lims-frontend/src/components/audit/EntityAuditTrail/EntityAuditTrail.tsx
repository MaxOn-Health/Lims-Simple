'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auditService } from '@/services/api/audit.service';
import { AuditLog, AuditAction } from '@/types/audit.types';
import { AuditTimelineItem } from '../AuditTimelineItem/AuditTimelineItem';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/common/Button/Button';
import { formatEntityType, getEntityDetailUrl } from '@/utils/audit-helpers';
import { ArrowLeft, FileText } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { format, groupBy } from 'date-fns';
import Link from 'next/link';

export const EntityAuditTrail: React.FC<{
  entityType: string;
  entityId: string;
}> = ({ entityType, entityId }) => {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string | undefined>();

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const logsData = await auditService.getAuditLogsForEntity(entityType, entityId);
      // Sort by timestamp descending (newest first)
      const sortedLogs = logsData.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.statusCode === 404) {
        setError('Audit trail endpoint is not available. Please ensure the backend API is implemented.');
      } else {
        setError(getErrorMessage(apiError));
      }
      addToast({
        type: 'error',
        message: 'Failed to load audit trail',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId]);

  useEffect(() => {
    if (actionFilter) {
      setFilteredLogs(logs.filter((log) => log.action === actionFilter));
    } else {
      setFilteredLogs(logs);
    }
  }, [actionFilter, logs]);

  // Group logs by date
  const groupedLogs = groupBy(filteredLogs, (log) =>
    format(new Date(log.timestamp), 'yyyy-MM-dd')
  );

  const entityUrl = getEntityDetailUrl(entityType, entityId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height="h-10" />
        <Skeleton height="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load audit trail"
        message={error}
        onRetry={fetchAuditLogs}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Entity Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Trail for {formatEntityType(entityType)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {entityId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {entityUrl && (
                <Link href={entityUrl}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    View Entity
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="action-filter">Filter by Action</Label>
              <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? undefined : value)}>
                <SelectTrigger id="action-filter" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.values(AuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Logs"
          message="There are no audit logs for this entity."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-8">
              {Object.entries(groupedLogs)
                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                .map(([date, dateLogs]) => (
                  <div key={date} className="space-y-4">
                    <div className="sticky top-0 bg-background z-10 py-2 border-b">
                      <h3 className="text-lg font-semibold">
                        {format(new Date(date), 'MMMM dd, yyyy')}
                      </h3>
                    </div>
                    <div className="pl-4">
                      {dateLogs.map((log, index) => (
                        <AuditTimelineItem
                          key={log.id}
                          log={log}
                          isLast={index === dateLogs.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

