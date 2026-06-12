import type { ICreateTaxConfigPayload, ITaxReportEntry } from '@erpex/shared';
export declare function listTaxConfigs(companyId: string): Promise<({
    account: {
        id: string;
        name: string;
        code: string;
    };
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    taxType: string;
    rate: number;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    accountId: string;
})[]>;
export declare function createTaxConfig(companyId: string, data: ICreateTaxConfigPayload): Promise<{
    account: {
        id: string;
        name: string;
        code: string;
    };
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    taxType: string;
    rate: number;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    accountId: string;
}>;
export declare function updateTaxConfig(companyId: string, id: string, data: {
    name?: string;
    rate?: number;
    effectiveTo?: string;
    isActive?: boolean;
}): Promise<{
    account: {
        id: string;
        name: string;
        code: string;
    };
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    taxType: string;
    rate: number;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    accountId: string;
}>;
export declare function getTaxReport(companyId: string, startDate: string, endDate: string): Promise<ITaxReportEntry[]>;
//# sourceMappingURL=tax.service.d.ts.map