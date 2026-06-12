export declare function listPurchaseOrders(companyId: string, filters: {
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
            amount: number;
            purchaseOrderId: string;
            taxAmount: number;
            sortOrder: number;
            receivedQty: number;
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
        subtotal: number;
        taxTotal: number;
        discount: number;
        total: number;
        expectedDelivery: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getPurchaseOrder(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
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
        amount: number;
        purchaseOrderId: string;
        taxAmount: number;
        sortOrder: number;
        receivedQty: number;
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
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    expectedDelivery: Date | null;
}>;
export declare function createPurchaseOrder(companyId: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
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
        amount: number;
        purchaseOrderId: string;
        taxAmount: number;
        sortOrder: number;
        receivedQty: number;
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
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    expectedDelivery: Date | null;
}>;
export declare function updatePurchaseOrderStatus(companyId: string, id: string, status: string): Promise<{
    contact: {
        id: string;
        name: string;
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
        amount: number;
        purchaseOrderId: string;
        taxAmount: number;
        sortOrder: number;
        receivedQty: number;
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
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    expectedDelivery: Date | null;
}>;
/**
 * Convert PO to Bill — transfers all lines
 */
export declare function convertToBill(companyId: string, poId: string): Promise<{
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
    dueDate: Date;
    amountPaid: number;
    amountDue: number;
    placeOfSupply: string | null;
    isReverseCharge: boolean;
    journalEntryId: string | null;
    purchaseOrderId: string | null;
    billNo: string | null;
}>;
//# sourceMappingURL=purchaseOrder.service.d.ts.map