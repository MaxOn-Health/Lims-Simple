'use client';

import React, { useState, useEffect } from 'react';
import { AdminRole, CreateAdminRoleRequest, UpdateAdminRoleRequest } from '@/types/admin-role.types';
import { adminRolesService } from '@/services/api/admin-roles.service';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

interface AdminRolesManagerProps {
    className?: string;
}

export const AdminRolesManager: React.FC<AdminRolesManagerProps> = ({ className }) => {
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useUIStore();

    // Form state for new/edit
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const data = await adminRolesService.getAdminRoles(true);
            setRoles(data);
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to fetch admin roles' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingId(null);
        setFormData({ name: '', displayName: '', description: '' });
    };

    const handleEdit = (role: AdminRole) => {
        setEditingId(role.id);
        setIsAdding(false);
        setFormData({
            name: role.name,
            displayName: role.displayName,
            description: role.description || '',
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', displayName: '', description: '' });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.displayName) {
            addToast({ type: 'error', message: 'Name and Display Name are required' });
            return;
        }

        try {
            setIsSaving(true);
            if (isAdding) {
                const newRole = await adminRolesService.createAdminRole({
                    name: formData.name,
                    displayName: formData.displayName,
                    description: formData.description || undefined,
                });
                setRoles([...roles, newRole]);
                addToast({ type: 'success', message: 'Admin role created successfully' });
            } else if (editingId) {
                const updated = await adminRolesService.updateAdminRole(editingId, {
                    displayName: formData.displayName,
                    description: formData.description || undefined,
                });
                setRoles(roles.map(r => r.id === editingId ? updated : r));
                addToast({ type: 'success', message: 'Admin role updated successfully' });
            }
            handleCancel();
        } catch (error) {
            addToast({ type: 'error', message: getErrorMessage(error as ApiError) });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this admin role?')) return;

        try {
            await adminRolesService.deleteAdminRole(id);
            setRoles(roles.map(r => r.id === id ? { ...r, isActive: false } : r));
            addToast({ type: 'success', message: 'Admin role deleted successfully' });
        } catch (error) {
            addToast({ type: 'error', message: getErrorMessage(error as ApiError) });
        }
    };

    const handleToggleActive = async (role: AdminRole) => {
        try {
            const updated = await adminRolesService.updateAdminRole(role.id, {
                isActive: !role.isActive,
            });
            setRoles(roles.map(r => r.id === role.id ? updated : r));
            addToast({ type: 'success', message: `Admin role ${updated.isActive ? 'activated' : 'deactivated'}` });
        } catch (error) {
            addToast({ type: 'error', message: getErrorMessage(error as ApiError) });
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="ml-2 text-gray-600">Loading admin roles...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow ${className}`}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Admin Roles</h3>
                {!isAdding && (
                    <Button variant="primary" size="sm" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Role
                    </Button>
                )}
            </div>

            <div className="p-6">
                {/* Add new role form */}
                {isAdding && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">New Admin Role</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                id="new-name"
                                label="Name (lowercase, no spaces)"
                                placeholder="e.g., blood_test"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                            />
                            <Input
                                id="new-displayName"
                                label="Display Name"
                                placeholder="e.g., Blood Test"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                            <Input
                                id="new-description"
                                label="Description (optional)"
                                placeholder="Description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
                                Create Role
                            </Button>
                        </div>
                    </div>
                )}

                {/* Roles list */}
                <div className="space-y-2">
                    {roles.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No admin roles found</p>
                    ) : (
                        roles.map((role) => (
                            <div
                                key={role.id}
                                className={`flex items-center justify-between p-4 rounded-lg border ${role.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                                    }`}
                            >
                                {editingId === role.id ? (
                                    <div className="flex-1 flex items-center gap-4">
                                        <Input
                                            id={`edit-displayName-${role.id}`}
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="max-w-[200px]"
                                        />
                                        <Input
                                            id={`edit-description-${role.id}`}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Description..."
                                            className="max-w-[300px]"
                                        />
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className={`font-medium ${role.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {role.displayName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    <code className="bg-gray-100 px-1 rounded text-xs">{role.name}</code>
                                                    {role.description && <span className="ml-2">{role.description}</span>}
                                                </p>
                                            </div>
                                            {!role.isActive && (
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(role)}
                                                title={role.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {role.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(role.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
