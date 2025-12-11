'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, FolderOpen, Mail } from 'lucide-react';

interface AccessDeniedProps {
    title?: string;
    message?: string;
    showProjectsLink?: boolean;
    showBackButton?: boolean;
    showContactAdmin?: boolean;
    onBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
    title = 'Access Denied',
    message = "You don't have permission to access this resource.",
    showProjectsLink = true,
    showBackButton = true,
    showContactAdmin = true,
    onBack,
}) => {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldX className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="text-base">{message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3">
                        {showBackButton && (
                            <Button
                                variant="outline"
                                onClick={onBack || (() => window.history.back())}
                                className="w-full"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}

                        {showProjectsLink && (
                            <Link href="/projects">
                                <Button variant="outline" className="w-full">
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    View Your Projects
                                </Button>
                            </Link>
                        )}
                    </div>

                    {showContactAdmin && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4" />
                                Contact your administrator if you need access.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// Simplified variant for inline use
export const AccessDeniedInline: React.FC<{
    message?: string;
    compact?: boolean;
}> = ({
    message = "You don't have access to this content.",
    compact = false,
}) => {
        return (
            <div
                className={`flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 ${compact ? 'py-2' : ''
                    }`}
            >
                <ShieldX className={`text-destructive ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <p className={`text-destructive ${compact ? 'text-sm' : ''}`}>{message}</p>
            </div>
        );
    };
