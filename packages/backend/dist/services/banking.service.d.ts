import type { IReconciliationMatch, IReconciliationSummary } from '@erpex/shared';
export interface ParsedStatementLine {
    date: string;
    description: string;
    reference?: string;
    debit: number;
    credit: number;
    balance?: number;
}
export declare function createBankStatement(companyId: string, accountId: string, fileName: string, periodStart: string, periodEnd: string, lines: ParsedStatementLine[]): Promise<{
    lines: {
        id: string;
        createdAt: Date;
        description: string;
        date: Date;
        debit: number;
        credit: number;
        reference: string | null;
        statementId: string;
        balance: number | null;
        isReconciled: boolean;
        matchedItemId: string | null;
        reconciledAt: Date | null;
    }[];
} & {
    id: string;
    companyId: string;
    accountId: string;
    fileName: string;
    uploadedAt: Date;
    periodStart: Date;
    periodEnd: Date;
}>;
export declare function getReconciliationView(companyId: string, accountId: string, statementId?: string): Promise<{
    bankAccount: {
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
    };
    statement: {
        lines: {
            id: string;
            createdAt: Date;
            description: string;
            date: Date;
            debit: number;
            credit: number;
            reference: string | null;
            statementId: string;
            balance: number | null;
            isReconciled: boolean;
            matchedItemId: string | null;
            reconciledAt: Date | null;
        }[];
    } & {
        id: string;
        companyId: string;
        accountId: string;
        fileName: string;
        uploadedAt: Date;
        periodStart: Date;
        periodEnd: Date;
    };
    systemEntries: {
        id: any;
        date: any;
        voucherNo: any;
        journalEntryId: any;
        narration: any;
        debit: number;
        credit: number;
    }[];
    statementLines: {
        id: string;
        createdAt: Date;
        description: string;
        date: Date;
        debit: number;
        credit: number;
        reference: string | null;
        statementId: string;
        balance: number | null;
        isReconciled: boolean;
        matchedItemId: string | null;
        reconciledAt: Date | null;
    }[];
    suggestedMatches: IReconciliationMatch[];
    summary: IReconciliationSummary;
}>;
export declare function applyMatches(matches: Array<{
    systemEntryId: string;
    statementLineId: string;
}>): Promise<any[]>;
export declare function clearStatementLines(lineIds: string[]): Promise<import("@prisma/client").Prisma.BatchPayload>;
export declare function listBankStatements(companyId: string, accountId?: string): Promise<({
    lines: {
        id: string;
        isReconciled: boolean;
    }[];
} & {
    id: string;
    companyId: string;
    accountId: string;
    fileName: string;
    uploadedAt: Date;
    periodStart: Date;
    periodEnd: Date;
})[]>;
//# sourceMappingURL=banking.service.d.ts.map