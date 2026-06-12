export declare function listEstimates(companyId: string, filters: {
    contactId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: ({
        contact: {
            id: string;
            name: string;
            email: string | null;
            companyName: string | null;
        };
        lines: ({
            item: {
                id: string;
                name: string;
                sku: string;
            } | null;
        } & {
            id: string;
            description: string;
            rate: number;
            taxConfigId: string | null;
            itemId: string | null;
            qty: number;
            estimateId: string;
            amount: number;
            taxAmount: number;
            sortOrder: number;
        })[];
    } & {
        number: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: string;
        date: Date;
        notes: string | null;
        contactId: string;
        expiryDate: Date | null;
        subtotal: number;
        taxTotal: number;
        discount: number;
        total: number;
        termsConditions: string | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getEstimate(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            sku: string;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        estimateId: string;
        amount: number;
        taxAmount: number;
        sortOrder: number;
    })[];
} & {
    number: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    status: string;
    date: Date;
    notes: string | null;
    contactId: string;
    expiryDate: Date | null;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    termsConditions: string | null;
}>;
export declare function createEstimate(companyId: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            sku: string;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        estimateId: string;
        amount: number;
        taxAmount: number;
        sortOrder: number;
    })[];
} & {
    number: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    status: string;
    date: Date;
    notes: string | null;
    contactId: string;
    expiryDate: Date | null;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    termsConditions: string | null;
}>;
export declare function updateEstimateStatus(companyId: string, id: string, status: string): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            sku: string;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        estimateId: string;
        amount: number;
        taxAmount: number;
        sortOrder: number;
    })[];
} & {
    number: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    status: string;
    date: Date;
    notes: string | null;
    contactId: string;
    expiryDate: Date | null;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    termsConditions: string | null;
}>;
export declare function convertToInvoice(companyId: string, estimateId: string): Promise<{
    number: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    status: string;
    branchId: string | null;
    date: Date;
    notes: string | null;
    contactId: string;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    termsConditions: string | null;
    estimateId: string | null;
    salesOrderId: string | null;
    dueDate: Date;
    amountPaid: number;
    amountDue: number;
    placeOfSupply: string | null;
    isReverseCharge: boolean;
    irnNumber: string | null;
    qrCode: string | null;
    eWayBillNo: string | null;
    recurringProfileId: string | null;
    journalEntryId: string | null;
}>;
//# sourceMappingURL=estimate.service.d.ts.map