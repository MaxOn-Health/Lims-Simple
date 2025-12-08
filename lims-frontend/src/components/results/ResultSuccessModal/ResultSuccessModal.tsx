'use client';

import React from 'react';
import { Button } from '@/components/common/Button/Button';
import { CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ResultSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrintReport: () => void;
    onBackToDashboard: () => void;
}

export const ResultSuccessModal: React.FC<ResultSuccessModalProps> = ({
    isOpen,
    onClose,
    onPrintReport,
    onBackToDashboard,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">Result Submitted!</DialogTitle>
                    <DialogDescription className="text-center text-gray-500 mt-2">
                        The test results have been successfully recorded. You can now generate and print the report.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-6">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onPrintReport}
                        className="w-full flex items-center justify-center gap-2 text-lg h-14"
                    >
                        <FileText className="h-5 w-5" />
                        Generate & Print Report
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onBackToDashboard}
                        className="w-full flex items-center justify-center gap-2"
                    >
                        Back to Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
