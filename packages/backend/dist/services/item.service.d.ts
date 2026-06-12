export declare function listItems(companyId: string, filters: {
    type?: string;
    groupId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        stockOnHand: number;
        committedStock: number;
        availableStock: number;
        group: {
            id: string;
            name: string;
        } | null;
        purchaseAccount: {
            id: string;
            name: string;
            code: string;
        } | null;
        salesAccount: {
            id: string;
            name: string;
            code: string;
        } | null;
        cogsAccount: {
            id: string;
            name: string;
            code: string;
        } | null;
        inventoryAccount: {
            id: string;
            name: string;
            code: string;
        } | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        type: string;
        description: string | null;
        taxConfigId: string | null;
        sku: string;
        unit: string;
        barcode: string | null;
        hsnCode: string | null;
        sacCode: string | null;
        groupId: string | null;
        purchasePrice: number;
        sellingPrice: number;
        purchaseAccountId: string | null;
        salesAccountId: string | null;
        cogsAccountId: string | null;
        inventoryAccountId: string | null;
        reorderLevel: number;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getItem(companyId: string, id: string): Promise<{
    group: {
        id: string;
        name: string;
    } | null;
    purchaseAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    salesAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    cogsAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    inventoryAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    description: string | null;
    taxConfigId: string | null;
    sku: string;
    unit: string;
    barcode: string | null;
    hsnCode: string | null;
    sacCode: string | null;
    groupId: string | null;
    purchasePrice: number;
    sellingPrice: number;
    purchaseAccountId: string | null;
    salesAccountId: string | null;
    cogsAccountId: string | null;
    inventoryAccountId: string | null;
    reorderLevel: number;
}>;
export declare function createItem(companyId: string, data: any): Promise<{
    group: {
        id: string;
        name: string;
    } | null;
    purchaseAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    salesAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    cogsAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    inventoryAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    description: string | null;
    taxConfigId: string | null;
    sku: string;
    unit: string;
    barcode: string | null;
    hsnCode: string | null;
    sacCode: string | null;
    groupId: string | null;
    purchasePrice: number;
    sellingPrice: number;
    purchaseAccountId: string | null;
    salesAccountId: string | null;
    cogsAccountId: string | null;
    inventoryAccountId: string | null;
    reorderLevel: number;
}>;
export declare function updateItem(companyId: string, id: string, data: any): Promise<{
    group: {
        id: string;
        name: string;
    } | null;
    purchaseAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    salesAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    cogsAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
    inventoryAccount: {
        id: string;
        name: string;
        code: string;
    } | null;
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    type: string;
    description: string | null;
    taxConfigId: string | null;
    sku: string;
    unit: string;
    barcode: string | null;
    hsnCode: string | null;
    sacCode: string | null;
    groupId: string | null;
    purchasePrice: number;
    sellingPrice: number;
    purchaseAccountId: string | null;
    salesAccountId: string | null;
    cogsAccountId: string | null;
    inventoryAccountId: string | null;
    reorderLevel: number;
}>;
export declare function listItemGroups(companyId: string): Promise<({
    children: {
        id: string;
        name: string;
        createdAt: Date;
        companyId: string;
        description: string | null;
        parentId: string | null;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    companyId: string;
    description: string | null;
    parentId: string | null;
})[]>;
export declare function createItemGroup(companyId: string, data: {
    name: string;
    description?: string;
    parentId?: string;
}): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    companyId: string;
    description: string | null;
    parentId: string | null;
}>;
export declare function listPriceLists(companyId: string): Promise<({
    items: ({
        item: {
            id: string;
            name: string;
            sku: string;
        };
    } & {
        id: string;
        rate: number;
        priceListId: string;
        itemId: string;
        minQty: number;
    })[];
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    description: string | null;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    currencyCode: string;
    isPercentage: boolean;
    roundTo: number | null;
})[]>;
export declare function createPriceList(companyId: string, data: any): Promise<{
    items: {
        id: string;
        rate: number;
        priceListId: string;
        itemId: string;
        minQty: number;
    }[];
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    description: string | null;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    currencyCode: string;
    isPercentage: boolean;
    roundTo: number | null;
}>;
export declare function updatePriceList(companyId: string, id: string, data: any): Promise<{
    items: ({
        item: {
            id: string;
            name: string;
            sku: string;
        };
    } & {
        id: string;
        rate: number;
        priceListId: string;
        itemId: string;
        minQty: number;
    })[];
} & {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
    companyId: string;
    description: string | null;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    currencyCode: string;
    isPercentage: boolean;
    roundTo: number | null;
}>;
//# sourceMappingURL=item.service.d.ts.map