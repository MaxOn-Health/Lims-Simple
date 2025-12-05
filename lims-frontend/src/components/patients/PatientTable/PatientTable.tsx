'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Patient } from '@/types/patient.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/common/Button/Button';
import { PaymentStatusBadge } from '../PaymentStatusBadge/PaymentStatusBadge';
import { PatientIdDisplay } from '../PatientIdDisplay/PatientIdDisplay';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { Eye, Edit, DollarSign } from 'lucide-react';

interface PatientTableProps {
  patients: Patient[];
  onUpdatePayment?: (patientId: string) => void;
  isLoading?: boolean;
}

// Memoized row component for better performance
const PatientRow = memo(({
  patient,
  onUpdatePayment
}: {
  patient: Patient;
  onUpdatePayment?: (patientId: string) => void;
}) => {
  const patientPackage = patient.patientPackages?.[0];

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <PatientIdDisplay patientId={patient.patientId} showLabel={false} />
      </TableCell>
      <TableCell>
        <Link
          href={`/patients/${patient.id}`}
          className="font-medium text-primary hover:underline"
        >
          {patient.name}
        </Link>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <span className="text-foreground">{patient.age}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground capitalize">{patient.gender.toLowerCase()}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {patient.contactNumber}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {patientPackage?.packageName || '—'}
        </span>
      </TableCell>
      <TableCell>
        {patientPackage ? (
          <PaymentStatusBadge status={patientPackage.paymentStatus} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(patient.createdAt), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Link href={`/patients/${patient.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </Link>
            {onUpdatePayment && patientPackage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onUpdatePayment(patient.id)}
              >
                <DollarSign className="h-4 w-4" />
                <span className="sr-only">Update Payment</span>
              </Button>
            )}
          </HasRole>
        </div>
      </TableCell>
    </TableRow>
  );
});

PatientRow.displayName = 'PatientRow';

export const PatientTable: React.FC<PatientTableProps> = memo(({
  patients,
  onUpdatePayment,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-semibold">Patient ID</TableHead>
          <TableHead className="font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Age / Gender</TableHead>
          <TableHead className="font-semibold">Contact</TableHead>
          <TableHead className="font-semibold">Package</TableHead>
          <TableHead className="font-semibold">Payment Status</TableHead>
          <TableHead className="font-semibold">Registration Date</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <PatientRow
            key={patient.id}
            patient={patient}
            onUpdatePayment={onUpdatePayment}
          />
        ))}
      </TableBody>
    </Table>
  );
});

PatientTable.displayName = 'PatientTable';
