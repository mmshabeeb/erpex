export declare function listBills(companyId: string, filters: {
    contactId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
}): Promise<{
    data: ({
        contact: {
            id: string;
            name: string;
            gstin: string | null;
            stateCode: string | null;
            companyName: string | null;
        };
        lines: ({
            item: {
                id: string;
                name: string;
                type: string;
                sku: string;
                hsnCode: string | null;
                sacCode: string | null;
                purchaseAccountId: string | null;
                inventoryAccountId: string | null;
            } | null;
        } & {
            id: string;
            description: string;
            rate: number;
            billId: string;
            taxConfigId: string | null;
            itemId: string | null;
            qty: number;
            amount: number;
            taxAmount: number;
            sortOrder: number;
            hsnSac: string | null;
            cgstAmount: number;
            sgstAmount: number;
            igstAmount: number;
        })[];
    } & {
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
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getBill(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            purchaseAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        billId: string;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        amount: number;
        taxAmount: number;
        sortOrder: number;
        hsnSac: string | null;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
    })[];
} & {
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
export declare function createBill(companyId: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            purchaseAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        billId: string;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        amount: number;
        taxAmount: number;
        sortOrder: number;
        hsnSac: string | null;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
    })[];
} & {
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
/**
 * Post a bill: generate JE and record inventory IN for product items
 * Dr Inventory/Expense [subtotal per line]
 * Dr Input Tax Credit [taxTotal]
 *   Cr Accounts Payable [total]
 */
export declare function postBill(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            purchaseAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        billId: string;
        taxConfigId: string | null;
        itemId: string | null;
        qty: number;
        amount: number;
        taxAmount: number;
        sortOrder: number;
        hsnSac: string | null;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
    })[];
} & {
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
export declare function getUnpaidBills(companyId: string, contactId: string): Promise<{
    number: string;
    id: string;
    status: string;
    date: Date;
    total: number;
    dueDate: Date;
    amountPaid: number;
    amountDue: number;
}[]>;
//# sourceMappingURL=bill.service.d.ts.map