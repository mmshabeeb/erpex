export declare function listExpenses(companyId: string, filters: {
    search?: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    isBillable?: boolean;
}): Promise<{
    data: ({
        account: {
            id: string;
            name: string;
            code: string;
        };
        contact: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        description: string;
        accountId: string;
        date: Date;
        taxConfigId: string | null;
        contactId: string | null;
        journalEntryId: string | null;
        amount: number;
        paymentMethod: string;
        referenceNo: string | null;
        taxAmount: number;
        isBillable: boolean;
        billableContactId: string | null;
        isBilled: boolean;
        category: string | null;
        receiptUrl: string | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function createExpense(companyId: string, data: any): Promise<{
    account: {
        id: string;
        name: string;
        code: string;
    };
    contact: {
        id: string;
        name: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    companyId: string;
    description: string;
    accountId: string;
    date: Date;
    taxConfigId: string | null;
    contactId: string | null;
    journalEntryId: string | null;
    amount: number;
    paymentMethod: string;
    referenceNo: string | null;
    taxAmount: number;
    isBillable: boolean;
    billableContactId: string | null;
    isBilled: boolean;
    category: string | null;
    receiptUrl: string | null;
}>;
//# sourceMappingURL=expense.service.d.ts.map