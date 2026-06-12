import type { ICreateAccountPayload, IUpdateAccountPayload, ILedgerResponse } from '@erpex/shared';
export declare function listAccounts(companyId: string): Promise<({
    parent: {
        id: string;
        name: string;
        code: string;
    } | null;
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    code: string;
    isCashOrBank: boolean;
    isSystemAccount: boolean;
    description: string | null;
    parentId: string | null;
    branchId: string | null;
})[]>;
export declare function getAccountTree(companyId: string): Promise<any[]>;
export declare function getAccount(companyId: string, id: string): Promise<{
    parent: {
        id: string;
        name: string;
        code: string;
    } | null;
    children: {
        id: string;
        name: string;
        type: string;
        code: string;
    }[];
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    code: string;
    isCashOrBank: boolean;
    isSystemAccount: boolean;
    description: string | null;
    parentId: string | null;
    branchId: string | null;
}>;
export declare function createAccount(companyId: string, data: ICreateAccountPayload): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    code: string;
    isCashOrBank: boolean;
    isSystemAccount: boolean;
    description: string | null;
    parentId: string | null;
    branchId: string | null;
}>;
export declare function updateAccount(companyId: string, id: string, data: IUpdateAccountPayload): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    code: string;
    isCashOrBank: boolean;
    isSystemAccount: boolean;
    description: string | null;
    parentId: string | null;
    branchId: string | null;
}>;
export declare function getAccountLedger(companyId: string, accountId: string, startDate?: string, endDate?: string): Promise<ILedgerResponse>;
export declare function getCashBankAccounts(companyId: string): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    code: string;
    isCashOrBank: boolean;
    isSystemAccount: boolean;
    description: string | null;
    parentId: string | null;
    branchId: string | null;
}[]>;
//# sourceMappingURL=account.service.d.ts.map