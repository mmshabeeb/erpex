export declare function listPaymentsMade(companyId: string, filters: {
    contactId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: ({
        contact: {
            id: string;
            name: string;
        };
        allocations: ({
            bill: {
                number: string;
                id: string;
                total: number;
            };
        } & {
            id: string;
            billId: string;
            amount: number;
            paymentId: string;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        companyId: string;
        date: Date;
        notes: string | null;
        contactId: string;
        journalEntryId: string | null;
        amount: number;
        paymentMethod: string;
        referenceNo: string | null;
        bankAccountId: string | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function createPaymentMade(companyId: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
    };
    allocations: {
        id: string;
        billId: string;
        amount: number;
        paymentId: string;
    }[];
} & {
    number: string;
    id: string;
    createdAt: Date;
    companyId: string;
    date: Date;
    notes: string | null;
    contactId: string;
    journalEntryId: string | null;
    amount: number;
    paymentMethod: string;
    referenceNo: string | null;
    bankAccountId: string | null;
}>;
//# sourceMappingURL=paymentMade.service.d.ts.map