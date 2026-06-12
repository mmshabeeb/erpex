export declare function listBranches(companyId: string): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    gstin: string | null;
    stateCode: string | null;
    code: string;
    address: string | null;
}[]>;
export declare function getBranch(companyId: string, id: string): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    gstin: string | null;
    stateCode: string | null;
    code: string;
    address: string | null;
}>;
export declare function createBranch(companyId: string, data: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
}): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    gstin: string | null;
    stateCode: string | null;
    code: string;
    address: string | null;
}>;
export declare function updateBranch(companyId: string, id: string, data: Partial<{
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
}>): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    gstin: string | null;
    stateCode: string | null;
    code: string;
    address: string | null;
}>;
//# sourceMappingURL=branch.service.d.ts.map