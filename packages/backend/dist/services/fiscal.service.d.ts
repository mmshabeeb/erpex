import type { ICreateFiscalYearPayload } from '@erpex/shared';
export declare function listFiscalYears(companyId: string): Promise<({
    periods: {
        year: number;
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        month: number;
        isLocked: boolean;
        fiscalYearId: string;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    companyId: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean;
})[]>;
export declare function createFiscalYear(companyId: string, data: ICreateFiscalYearPayload): Promise<{
    periods: {
        year: number;
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        month: number;
        isLocked: boolean;
        fiscalYearId: string;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    companyId: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean;
}>;
export declare function togglePeriodLock(companyId: string, periodId: string, lock: boolean): Promise<{
    year: number;
    id: string;
    createdAt: Date;
    startDate: Date;
    endDate: Date;
    month: number;
    isLocked: boolean;
    fiscalYearId: string;
}>;
export declare function closeFiscalYear(companyId: string, id: string): Promise<({
    periods: {
        year: number;
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date;
        month: number;
        isLocked: boolean;
        fiscalYearId: string;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    companyId: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean;
}) | null>;
//# sourceMappingURL=fiscal.service.d.ts.map