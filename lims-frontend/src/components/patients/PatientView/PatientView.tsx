'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Patient } from '@/types/patient.types';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PatientIdDisplay } from '../PatientIdDisplay/PatientIdDisplay';
import { PaymentStatusBadge } from '../PaymentStatusBadge/PaymentStatusBadge';
import { UpdatePaymentModal } from '../UpdatePaymentModal/UpdatePaymentModal';
import { HasRole } from '@/components/common/HasRole/HasRole';
import { UserRole } from '@/types/user.types';
import { calculateRemainingAmount } from '@/utils/patient-helpers';
import { Edit, DollarSign, IndianRupee, FileText } from 'lucide-react';

interface PatientViewProps {
  patient: Patient;
  onUpdate?: () => void;
}

export const PatientView: React.FC<PatientViewProps> = ({ patient, onUpdate }) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const patientPackage = patient.patientPackages?.[0];

  const handlePaymentUpdate = () => {
    setPaymentModalOpen(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PatientIdDisplay patientId={patient.patientId} />

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-base font-semibold text-foreground mt-1">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age / Gender</p>
              <p className="text-base font-semibold text-foreground mt-1">
                {patient.age} / {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
              <p className="text-base text-foreground mt-1">{patient.contactNumber}</p>
            </div>
            {patient.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base text-foreground mt-1">{patient.email}</p>
              </div>
            )}
            {patient.employeeId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p className="text-base text-foreground mt-1">{patient.employeeId}</p>
              </div>
            )}
            {patient.companyName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                <p className="text-base text-foreground mt-1">{patient.companyName}</p>
              </div>
            )}
            {patient.address && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-base text-foreground mt-1">{patient.address}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Package Information Card */}
      {patientPackage && (
        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Package Name</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {patientPackage.packageName}
              </p>
            </div>

            <Separator />

            {patientPackage.addonTestIds && patientPackage.addonTestIds.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Addon Tests</p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {patientPackage.addonTestIds.length} addon test
                    {patientPackage.addonTestIds.length !== 1 ? 's' : ''} selected
                  </p>
                  {/* Note: Test names would need to be fetched separately if needed */}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Price</span>
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">
                    {Number(patientPackage.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Payment Status</span>
                <PaymentStatusBadge status={patientPackage.paymentStatus} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Payment Amount</span>
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold text-foreground">
                    {Number(patientPackage.paymentAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {patientPackage.paymentStatus !== 'PAID' && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Remaining Amount
                    </span>
                    <div className="flex items-baseline gap-1">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {calculateRemainingAmount(
                          Number(patientPackage.totalPrice),
                          Number(patientPackage.paymentAmount)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
              <p className="text-base text-foreground mt-1">
                {format(new Date(patient.createdAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-base text-foreground mt-1">
                {format(new Date(patient.updatedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            {patientPackage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered By</p>
                <p className="text-base text-foreground mt-1">
                  User ID: {patientPackage.registeredBy}
                </p>
                {/* Note: User name would need to be fetched separately */}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <HasRole allowedRoles={[UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]}>
          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="primary">
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </Button>
          </Link>
          {patientPackage && (
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Update Payment
            </Button>
          )}
        </HasRole>
        <Link href={`/patients/${patient.id}/results`}>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Results
          </Button>
        </Link>
        {/* Future links */}
        {/* <Link href={`/patients/${patient.id}/assignments`}>
          <Button variant="outline">View Assignments</Button>
        </Link>
        <Link href={`/patients/${patient.id}/report`}>
          <Button variant="outline">Generate Report</Button>
        </Link> */}
      </div>

      {/* Payment Update Modal */}
      {patientPackage && (
        <UpdatePaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          patient={patient}
          onSuccess={handlePaymentUpdate}
        />
      )}
    </div>
  );
};

