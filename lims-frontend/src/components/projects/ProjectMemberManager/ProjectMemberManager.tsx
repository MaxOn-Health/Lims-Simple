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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProjectMember, RoleInProject } from '@/types/project.types';
import { User, UserRole } from '@/types/user.types';
import { usersService } from '@/services/api/users.service';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import {
    Users,
    UserPlus,
    Trash2,
    Search,
    Loader2,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectMemberManagerProps {
    projectId: string;
    members: ProjectMember[];
    onAddMember: (userId: string, roleInProject?: RoleInProject) => Promise<void>;
    onRemoveMember: (userId: string) => Promise<void>;
    readOnly?: boolean;
    isLoading?: boolean;
}

const ROLE_COLORS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-700 border-red-200',
    [UserRole.RECEPTIONIST]: 'bg-blue-100 text-blue-700 border-blue-200',
    [UserRole.TEST_TECHNICIAN]: 'bg-green-100 text-green-700 border-green-200',
    [UserRole.LAB_TECHNICIAN]: 'bg-purple-100 text-purple-700 border-purple-200',
    [UserRole.DOCTOR]: 'bg-orange-100 text-orange-700 border-orange-200',
};

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.RECEPTIONIST]: 'Receptionist',
    [UserRole.TEST_TECHNICIAN]: 'Test Technician',
    [UserRole.LAB_TECHNICIAN]: 'Lab Technician',
    [UserRole.DOCTOR]: 'Doctor',
};

export const ProjectMemberManager: React.FC<ProjectMemberManagerProps> = ({
    projectId,
    members,
    onAddMember,
    onRemoveMember,
    readOnly = false,
    isLoading = false,
}) => {
    const { addToast } = useUIStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<RoleInProject>(RoleInProject.MEMBER);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const memberUserIds = new Set(members.map((m) => m.userId));

    const fetchAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await usersService.getUsers({ limit: 100 });
            const filtered = response.data.filter(
                (user) => user.isActive && !memberUserIds.has(user.id)
            );
            setAvailableUsers(filtered);
        } catch (err) {
            const apiError = err as ApiError;
            addToast({
                type: 'error',
                message: getErrorMessage(apiError) || 'Failed to load users',
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleOpenAddModal = async () => {
        setIsAddModalOpen(true);
        setSearchQuery('');
        setSelectedUserId('');
        setSelectedRole(RoleInProject.MEMBER);
        await fetchAvailableUsers();
    };

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        setSubmitting(true);
        try {
            await onAddMember(selectedUserId, selectedRole);
            setIsAddModalOpen(false);
            addToast({
                type: 'success',
                message: 'Member added successfully',
            });
        } catch (err) {
            const apiError = err as ApiError;
            addToast({
                type: 'error',
                message: getErrorMessage(apiError) || 'Failed to add member',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmRemove = async () => {
        if (!selectedMember) return;
        setSubmitting(true);
        try {
            await onRemoveMember(selectedMember.userId);
            setIsRemoveDialogOpen(false);
            setSelectedMember(null);
            addToast({
                type: 'success',
                message: 'Member removed successfully',
            });
        } catch (err) {
            const apiError = err as ApiError;
            addToast({
                type: 'error',
                message: getErrorMessage(apiError) || 'Failed to remove member',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = availableUsers.filter(
        (user) =>
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group members by role
    const groupedMembers = members.reduce(
        (acc, member) => {
            const role = member.user?.role || UserRole.TEST_TECHNICIAN;
            if (!acc[role]) acc[role] = [];
            acc[role].push(member);
            return acc;
        },
        {} as Record<UserRole, ProjectMember[]>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <Badge variant="secondary">{members.length}</Badge>
                </div>
                {!readOnly && (
                    <Button variant="outline" size="sm" onClick={handleOpenAddModal}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                    </Button>
                )}
            </div>

            {/* Members List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : members.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No team members yet</p>
                        {!readOnly && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenAddModal}
                                className="mt-4"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add First Member
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedMembers).map(([role, roleMembers]) => (
                        <div key={role} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn('text-xs', ROLE_COLORS[role as UserRole])}
                                >
                                    {ROLE_LABELS[role as UserRole]}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    ({roleMembers.length})
                                </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {roleMembers.map((member) => (
                                    <Card key={member.id} className="overflow-hidden">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Avatar */}
                                                    <div
                                                        className={cn(
                                                            'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                                                            ROLE_COLORS[member.user?.role || UserRole.TEST_TECHNICIAN]
                                                        )}
                                                    >
                                                        {member.user?.fullName
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .slice(0, 2)
                                                            .toUpperCase() || '?'}
                                                    </div>
                                                    {/* Info */}
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">
                                                            {member.user?.fullName || 'Unknown'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                                            {member.user?.email || ''}
                                                        </p>
                                                        {member.roleInProject && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground capitalize">
                                                                    {member.roleInProject.toLowerCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Remove Button */}
                                                {!readOnly && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setIsRemoveDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Member Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Select a user to add to this project team.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* User List */}
                        <div className="border rounded-lg max-h-[250px] overflow-y-auto">
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <p className="text-muted-foreground">
                                        {availableUsers.length === 0
                                            ? 'No available users to add'
                                            : 'No users match your search'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={cn(
                                                'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-muted/50',
                                                selectedUserId === user.id &&
                                                'bg-primary/5 ring-1 ring-inset ring-primary'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium',
                                                    ROLE_COLORS[user.role]
                                                )}
                                            >
                                                {user.fullName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{user.fullName}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={cn('text-xs', ROLE_COLORS[user.role])}>
                                                {ROLE_LABELS[user.role]}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label>Role in Project</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) => setSelectedRole(value as RoleInProject)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={RoleInProject.ADMIN}>Admin</SelectItem>
                                    <SelectItem value={RoleInProject.MEMBER}>Member</SelectItem>
                                    <SelectItem value={RoleInProject.VIEWER}>Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAddMember}
                            disabled={!selectedUserId || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Member'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>{selectedMember?.user?.fullName}</strong> from this project?
                            They will no longer have access to this project.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmRemove}
                            disabled={submitting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
