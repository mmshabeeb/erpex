export declare function listBudgets(companyId: string, fiscalYearId?: string): Promise<({
    account: {
        id: string;
        name: string;
        type: string;
        code: string;
    };
} & {
    year: number;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    month: number;
    accountId: string;
    fiscalYearId: string;
    amount: number;
})[]>;
export declare function upsertBudget(companyId: string, data: {
    name: string;
    fiscalYearId: string;
    accountId: string;
    month: number;
    year: number;
    amount: number;
}): Promise<{
    year: number;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    month: number;
    accountId: string;
    fiscalYearId: string;
    amount: number;
}>;
export declare function bulkUpsertBudgets(companyId: string, items: {
    name: string;
    fiscalYearId: string;
    accountId: string;
    month: number;
    year: number;
    amount: number;
}[]): Promise<any[]>;
export declare function getBudgetVsActual(companyId: string, fiscalYearId: string): Promise<any[]>;
//# sourceMappingURL=budget.service.d.ts.map