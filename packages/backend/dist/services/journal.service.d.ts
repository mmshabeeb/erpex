import type { ICreateJournalPayload, IJournalFilter } from '@erpex/shared';
export declare function listJournals(companyId: string, filters: IJournalFilter): Promise<{
    data: {
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
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getJournal(companyId: string, id: string): Promise<{
    totalDebit: number;
    totalCredit: number;
    items: ({
        account: {
            id: string;
            name: string;
            type: string;
            code: string;
        };
        taxConfig: {
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
        } | null;
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
    fiscalYear: {
        id: string;
        name: string;
    } | null;
    rectifies: {
        id: string;
        voucherNo: string;
    } | null;
    rectifiedBy: {
        id: string;
        voucherNo: string;
    }[];
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
export declare function createJournal(companyId: string, data: ICreateJournalPayload): Promise<{
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
export declare function postJournal(companyId: string, id: string): Promise<{
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
}>;
export declare function createRectification(companyId: string, originalId: string, narration?: string): Promise<{
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
}>;
//# sourceMappingURL=journal.service.d.ts.map