'use client';

import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { authService } from '@/services/api/auth.service';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';

interface PinConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export const PinConfirmationModal: React.FC<PinConfirmationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = 'Enter PIN',
    description = 'Please enter your 4-digit security PIN to continue.',
}) => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useUIStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await authService.verifyPin(pin);
            if (result.verified) {
                setPin(''); // Clear PIN
                onSuccess();
            } else {
                setError('Incorrect PIN');
                addToast({ type: 'error', message: 'Incorrect PIN' });
            }
        } catch (err) {
            setError('Failed to verify PIN');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pin" className="text-right">
                                PIN
                            </Label>
                            <Input
                                id="pin"
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) setPin(val);
                                }}
                                className="col-span-3 text-center tracking-widest text-lg"
                                autoFocus
                                placeholder="••••"
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || pin.length !== 4}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
