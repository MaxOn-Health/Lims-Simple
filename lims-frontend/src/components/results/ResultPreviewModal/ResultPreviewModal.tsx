'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/common/Button/Button';
import { Download } from 'lucide-react';
import { Result } from '@/types/result.types';
import { Test } from '@/types/test.types';
import { Assignment } from '@/types/assignment.types';
import { EyeTestReportView } from '../EyeTestReportView/EyeTestReportView';
import { AudiometryReportView } from '../AudiometryReportView/AudiometryReportView';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';


interface ResultPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any; // Form data
    test: Test;
    assignment: Assignment;
}

export const ResultPreviewModal: React.FC<ResultPreviewModalProps> = ({
    isOpen,
    onClose,
    data,
    test,
    assignment,
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const { addToast } = useUIStore();
    const { user } = useAuthStore();

    if (!isOpen) return null;

    const isAudiometryTest = test && (test.adminRole === 'audiometry' || test.name.toLowerCase().includes('audiometry'));
    const isEyeTest = test && (test.adminRole === 'eye' || test.name.toLowerCase().includes('eye'));

    // Construct mock result object for preview
    const mockResult = {
        id: 'preview-id',
        assignmentId: assignment.id,
        patientId: assignment.patientId,
        patient: assignment.patient,
        testId: test.id,
        test: test,
        resultValues: data.resultValues || {},
        notes: data.notes,
        status: 'PENDING',
        isVerified: false,
        enteredAt: new Date().toISOString(),
        enteredByUser: { fullName: user?.fullName || 'Current User' },
    } as unknown as Result;

    const handleExportPDF = async () => {
        setIsExporting(true);
        const elementId = isAudiometryTest ? 'audiometry-report' : isEyeTest ? 'eye-test-report' : null;

        if (!elementId) {
            addToast({ type: 'error', message: 'Report template not found' });
            setIsExporting(false);
            return;
        }

        const element = document.getElementById(elementId);
        if (!element) {
            addToast({ type: 'error', message: 'Report element not found' });
            setIsExporting(false);
            return;
        }

        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            const reportType = isAudiometryTest ? 'audiometry' : 'eye-test';
            const opt = {
                margin: 0.5,
                filename: `${reportType}-preview-${assignment.patient?.patientId || 'patient'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(element).save();
            addToast({ type: 'success', message: 'PDF downloaded successfully' });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            addToast({ type: 'error', message: 'Failed to export PDF' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Report Preview</DialogTitle>
                </DialogHeader>

                <div className="flex-1 bg-gray-100 overflow-auto p-8 flex justify-center">
                    <div
                        className="bg-white shadow-lg shrink-0"
                        style={{
                            width: '210mm',
                            minHeight: '297mm', // A4 height
                            padding: '0', // Let the component handle internal padding or add if needed
                            boxSizing: 'border-box'
                        }}
                    >
                        {isAudiometryTest ? (
                            <AudiometryReportView result={mockResult} test={test} />
                        ) : isEyeTest ? (
                            <EyeTestReportView result={mockResult} test={test} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground p-10">
                                Preview not available for this test type
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t gap-2 bg-white">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {(isAudiometryTest || isEyeTest) && (
                        <Button onClick={handleExportPDF} isLoading={isExporting}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
