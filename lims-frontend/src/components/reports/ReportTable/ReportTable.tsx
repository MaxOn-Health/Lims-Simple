'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Report, ReportStatus } from '@/types/report.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReportStatusBadge } from '../ReportStatusBadge/ReportStatusBadge';
import { Button } from '@/components/common/Button/Button';
import { Eye, Download } from 'lucide-react';

interface ReportTableProps {
  reports: Report[];
  onView?: (reportId: string) => void;
  onDownload?: (reportId: string) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onView,
  onDownload,
}) => {
  const handleView = (reportId: string) => {
    if (onView) {
      onView(reportId);
    }
  };

  const handleDownload = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(reportId);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Report Number</TableHead>
          <TableHead>Patient Name</TableHead>
          <TableHead>Patient ID</TableHead>
          <TableHead>Generated Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No reports found
            </TableCell>
          </TableRow>
        ) : (
          reports.map((report) => (
            <TableRow
              key={report.id}
              className="cursor-pointer"
              onClick={() => handleView(report.id)}
            >
              <TableCell className="font-medium font-mono">
                {report.reportNumber}
              </TableCell>
              <TableCell>{report.patient?.name || 'N/A'}</TableCell>
              <TableCell className="font-mono text-sm">
                {report.patient?.patientId || 'N/A'}
              </TableCell>
              <TableCell>
                {report.generatedAt
                  ? format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <ReportStatusBadge status={report.status} />
              </TableCell>
              <TableCell>
                {report.generatedByUser?.fullName || 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/reports/${report.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  {report.status === ReportStatus.COMPLETED && report.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDownload(report.id, e)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

