export declare function listContacts(filters: {
    type?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        outstandingBalance: number;
        overdueAmount: number;
        priceList: {
            id: string;
            name: string;
        } | null;
        addresses: {
            id: string;
            city: string;
            state: string | null;
            postalCode: string | null;
            country: string;
            type: string;
            contactId: string;
            line1: string;
            line2: string | null;
        }[];
        id: string;
        name: string;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        phone: string | null;
        pan: string | null;
        gstin: string | null;
        stateCode: string | null;
        type: string;
        branchId: string | null;
        companyName: string | null;
        taxId: string | null;
        creditTermDays: number;
        creditLimit: number | null;
        priceListId: string | null;
        notes: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getContact(id: string): Promise<{
    priceList: {
        id: string;
        name: string;
    } | null;
    addresses: {
        id: string;
        city: string;
        state: string | null;
        postalCode: string | null;
        country: string;
        type: string;
        contactId: string;
        line1: string;
        line2: string | null;
    }[];
} & {
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    pan: string | null;
    gstin: string | null;
    stateCode: string | null;
    type: string;
    branchId: string | null;
    companyName: string | null;
    taxId: string | null;
    creditTermDays: number;
    creditLimit: number | null;
    priceListId: string | null;
    notes: string | null;
}>;
export declare function createContact(data: any): Promise<{
    priceList: {
        id: string;
        name: string;
    } | null;
    addresses: {
        id: string;
        city: string;
        state: string | null;
        postalCode: string | null;
        country: string;
        type: string;
        contactId: string;
        line1: string;
        line2: string | null;
    }[];
} & {
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    pan: string | null;
    gstin: string | null;
    stateCode: string | null;
    type: string;
    branchId: string | null;
    companyName: string | null;
    taxId: string | null;
    creditTermDays: number;
    creditLimit: number | null;
    priceListId: string | null;
    notes: string | null;
}>;
export declare function updateContact(id: string, data: any): Promise<{
    priceList: {
        id: string;
        name: string;
    } | null;
    addresses: {
        id: string;
        city: string;
        state: string | null;
        postalCode: string | null;
        country: string;
        type: string;
        contactId: string;
        line1: string;
        line2: string | null;
    }[];
} & {
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    phone: string | null;
    pan: string | null;
    gstin: string | null;
    stateCode: string | null;
    type: string;
    branchId: string | null;
    companyName: string | null;
    taxId: string | null;
    creditTermDays: number;
    creditLimit: number | null;
    priceListId: string | null;
    notes: string | null;
}>;
export declare function getContactStatement(id: string, startDate?: string, endDate?: string): Promise<{
    contact: {
        priceList: {
            id: string;
            name: string;
        } | null;
        addresses: {
            id: string;
            city: string;
            state: string | null;
            postalCode: string | null;
            country: string;
            type: string;
            contactId: string;
            line1: string;
            line2: string | null;
        }[];
    } & {
        id: string;
        name: string;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        phone: string | null;
        pan: string | null;
        gstin: string | null;
        stateCode: string | null;
        type: string;
        branchId: string | null;
        companyName: string | null;
        taxId: string | null;
        creditTermDays: number;
        creditLimit: number | null;
        priceListId: string | null;
        notes: string | null;
    };
    invoices: {
        number: string;
        id: string;
        status: string;
        date: Date;
        total: number;
        amountPaid: number;
        amountDue: number;
    }[];
    payments: {
        number: string;
        id: string;
        date: Date;
        amount: number;
    }[];
}>;
//# sourceMappingURL=contact.service.d.ts.map