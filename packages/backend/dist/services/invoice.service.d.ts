export declare function listInvoices(companyId: string, filters: {
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
            email: string | null;
            gstin: string | null;
            stateCode: string | null;
            companyName: string | null;
            creditTermDays: number;
        };
        lines: ({
            item: {
                id: string;
                name: string;
                type: string;
                sku: string;
                hsnCode: string | null;
                sacCode: string | null;
                cogsAccountId: string | null;
                inventoryAccountId: string | null;
            } | null;
        } & {
            id: string;
            description: string;
            rate: number;
            invoiceId: string;
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
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getInvoice(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
        creditTermDays: number;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            cogsAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        invoiceId: string;
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
export declare function createInvoice(companyId: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
        creditTermDays: number;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            cogsAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        invoiceId: string;
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
/**
 * Post an invoice: generate journal entries and process inventory
 * Dr Accounts Receivable [total]
 *   Cr Revenue [subtotal]
 *   Cr GST components or Tax Payable [taxTotal]
 * For PRODUCT items: Dr COGS, Cr Inventory (FIFO)
 */
export declare function postInvoice(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
        creditTermDays: number;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            cogsAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        invoiceId: string;
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
export declare function voidInvoice(companyId: string, id: string): Promise<{
    contact: {
        id: string;
        name: string;
        email: string | null;
        gstin: string | null;
        stateCode: string | null;
        companyName: string | null;
        creditTermDays: number;
    };
    lines: ({
        item: {
            id: string;
            name: string;
            type: string;
            sku: string;
            hsnCode: string | null;
            sacCode: string | null;
            cogsAccountId: string | null;
            inventoryAccountId: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        rate: number;
        invoiceId: string;
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
/**
 * Get customer invoices for payment allocation
 */
export declare function getUnpaidInvoices(companyId: string, contactId: string): Promise<{
    number: string;
    id: string;
    status: string;
    date: Date;
    total: number;
    dueDate: Date;
    amountPaid: number;
    amountDue: number;
}[]>;
//# sourceMappingURL=invoice.service.d.ts.map