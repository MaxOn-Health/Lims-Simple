export interface AdminRole {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAdminRoleRequest {
    name: string;
    displayName: string;
    description?: string;
}

export interface UpdateAdminRoleRequest {
    displayName?: string;
    description?: string;
    isActive?: boolean;
}
