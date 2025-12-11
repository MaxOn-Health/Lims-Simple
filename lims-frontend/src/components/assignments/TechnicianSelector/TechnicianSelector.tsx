'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AvailableTechnician } from '@/types/assignment.types';
import { assignmentsService } from '@/services/api/assignments.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import {
    Search,
    User,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Users,
    Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicianSelectorProps {
    testId: string;
    projectId?: string;
    selectedTechnicianId?: string;
    onSelect: (technicianId: string | null) => void;
    onCancel?: () => void;
    showAutoAssign?: boolean;
    onAutoAssign?: () => void;
    isOpen: boolean;
    onClose: () => void;
    testName?: string;
}

export const TechnicianSelector: React.FC<TechnicianSelectorProps> = ({
    testId,
    projectId,
    selectedTechnicianId: initialSelectedId,
    onSelect,
    onCancel,
    showAutoAssign = true,
    onAutoAssign,
    isOpen,
    onClose,
    testName,
}) => {
    const { addToast } = useUIStore();
    const [technicians, setTechnicians] = useState<AvailableTechnician[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(
        initialSelectedId || null
    );

    // Fetch technicians when modal opens or testId/projectId changes
    useEffect(() => {
        if (isOpen && testId) {
            fetchTechnicians();
        }
    }, [isOpen, testId, projectId]);

    // Reset selection when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedId(initialSelectedId || null);
            setSearchQuery('');
        }
    }, [isOpen, initialSelectedId]);

    const fetchTechnicians = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await assignmentsService.getAvailableTechnicians(
                testId,
                projectId
            );
            setTechnicians(data);
        } catch (err) {
            const apiError = err as ApiError;
            const message =
                getErrorMessage(apiError) || 'Failed to load available technicians';
            setError(message);
            addToast({
                type: 'error',
                message,
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter technicians by search query
    const filteredTechnicians = useMemo(() => {
        if (!searchQuery.trim()) return technicians;
        const query = searchQuery.toLowerCase();
        return technicians.filter(
            (tech) =>
                tech.fullName.toLowerCase().includes(query) ||
                tech.email.toLowerCase().includes(query)
        );
    }, [technicians, searchQuery]);

    const handleSelect = () => {
        onSelect(selectedId);
        onClose();
    };

    const handleAutoAssign = () => {
        if (onAutoAssign) {
            onAutoAssign();
        } else {
            onSelect(null);
        }
        onClose();
    };

    const handleClose = () => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    };

    const getWorkloadColor = (count?: number) => {
        if (count === undefined) return 'bg-gray-100 text-gray-600';
        if (count === 0) return 'bg-green-100 text-green-700';
        if (count < 3) return 'bg-blue-100 text-blue-700';
        if (count < 5) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Select Technician
                    </DialogTitle>
                    <DialogDescription>
                        {testName
                            ? `Choose a technician to assign "${testName}"`
                            : 'Select a technician from the available list'}
                    </DialogDescription>
                </DialogHeader>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Technicians List */}
                <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] border rounded-lg">
                    {loading ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                            <p className="text-destructive font-medium">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchTechnicians}
                                className="mt-3"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : filteredTechnicians.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <User className="h-10 w-10 text-muted-foreground mb-3" />
                            {technicians.length === 0 ? (
                                <>
                                    <p className="font-medium text-muted-foreground">
                                        No technicians available
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        No technicians are available for this test type in this
                                        project
                                    </p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">
                                    No technicians match your search
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredTechnicians.map((technician) => {
                                const isSelected = selectedId === technician.id;
                                return (
                                    <button
                                        key={technician.id}
                                        type="button"
                                        onClick={() => setSelectedId(technician.id)}
                                        className={cn(
                                            'w-full px-4 py-3 flex items-center gap-4 text-left transition-colors hover:bg-muted/50',
                                            isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary'
                                        )}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={cn(
                                                'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {technician.fullName
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground truncate">
                                                    {technician.fullName}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {technician.email}
                                            </p>
                                        </div>

                                        {/* Workload Badge */}
                                        <div className="flex flex-col items-end gap-1">
                                            {technician.testTechnicianType && (
                                                <Badge variant="outline" className="text-xs">
                                                    {technician.testTechnicianType}
                                                </Badge>
                                            )}
                                            <span
                                                className={cn(
                                                    'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                                                    getWorkloadColor(technician.currentAssignmentCount)
                                                )}
                                            >
                                                <Briefcase className="h-3 w-3" />
                                                {technician.currentAssignmentCount ?? '?'} active
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    {showAutoAssign && technicians.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoAssign}
                            className="sm:mr-auto"
                        >
                            Auto-Assign
                        </Button>
                    )}
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSelect}
                        disabled={!selectedId || loading}
                    >
                        Select Technician
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
