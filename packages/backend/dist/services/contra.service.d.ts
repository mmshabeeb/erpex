import type { ICreateContraPayload } from '@erpex/shared';
export declare function listContraTransactions(companyId: string, startDate?: string, endDate?: string): Promise<({
    items: ({
        account: {
            id: string;
            name: string;
            type: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        accountId: string;
        narration: string | null;
        debit: number;
        credit: number;
        taxConfigId: string | null;
        journalEntryId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    companyId: string;
    type: string;
    status: string;
    branchId: string | null;
    voucherNo: string;
    date: Date;
    narration: string | null;
    currencyCode: string;
    exchangeRate: number;
    createdBy: string | null;
    invoiceId: string | null;
    billId: string | null;
    fiscalYearId: string | null;
    rectifiesId: string | null;
})[]>;
export declare function createContraTransaction(companyId: string, data: ICreateContraPayload): Promise<{
    totalDebit: number;
    totalCredit: number;
    items: ({
        account: {
            id: string;
            name: string;
            type: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        accountId: string;
        narration: string | null;
        debit: number;
        credit: number;
        taxConfigId: string | null;
        journalEntryId: string;
    })[];
    id: string;
    createdAt: Date;
    companyId: string;
    type: string;
    status: string;
    branchId: string | null;
    voucherNo: string;
    date: Date;
    narration: string | null;
    currencyCode: string;
    exchangeRate: number;
    createdBy: string | null;
    invoiceId: string | null;
    billId: string | null;
    fiscalYearId: string | null;
    rectifiesId: string | null;
}>;
//# sourceMappingURL=contra.service.d.ts.map