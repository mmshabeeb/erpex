declare function listUsers(companyId: string): Promise<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    role: string;
    phone: string | null;
    lastLoginAt: Date | null;
}[]>;
declare function createUser(companyId: string, data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
}): Promise<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    role: string;
    phone: string | null;
}>;
declare function updateUser(userId: string, data: {
    name?: string;
    role?: string;
    phone?: string;
}): Promise<{
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    role: string;
    phone: string | null;
}>;
declare function toggleUserStatus(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    role: string;
    phone: string | null;
    lastLoginAt: Date | null;
}>;
declare function resetUserPassword(userId: string, newPassword: string): Promise<{
    message: string;
}>;
export declare const userService: {
    listUsers: typeof listUsers;
    createUser: typeof createUser;
    updateUser: typeof updateUser;
    toggleUserStatus: typeof toggleUserStatus;
    resetUserPassword: typeof resetUserPassword;
    VALID_ROLES: string[];
};
export {};
//# sourceMappingURL=user.service.d.ts.map