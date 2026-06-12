/**
 * Record an inventory IN movement (purchase, return, adjustment)
 */
export declare function recordInMovement(companyId: string, data: {
    itemId: string;
    date: Date;
    qty: number;
    unitCost: number;
    reference?: string;
    sourceType?: string;
    sourceId?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    companyId: string;
    type: string;
    date: Date;
    itemId: string;
    qty: number;
    unitCost: number;
    totalCost: number;
    reference: string | null;
    sourceType: string | null;
    sourceId: string | null;
    remainingQty: number;
}>;
/**
 * Record an inventory OUT movement using FIFO costing.
 * Consumes oldest lots first and returns the weighted COGS.
 */
export declare function recordOutMovement(companyId: string, data: {
    itemId: string;
    date: Date;
    qty: number;
    reference?: string;
    sourceType?: string;
    sourceId?: string;
}): Promise<{
    movement: any;
    cogs: number;
}>;
/**
 * Record an inventory adjustment (positive or negative)
 */
export declare function recordAdjustment(companyId: string, data: {
    itemId: string;
    date: Date;
    qty: number;
    unitCost: number;
    reference?: string;
}): Promise<{
    id: string;
    createdAt: Date;
    companyId: string;
    type: string;
    date: Date;
    itemId: string;
    qty: number;
    unitCost: number;
    totalCost: number;
    reference: string | null;
    sourceType: string | null;
    sourceId: string | null;
    remainingQty: number;
}>;
/**
 * Get stock summary for all products
 */
export declare function getStockSummary(companyId: string): Promise<{
    itemId: string;
    itemName: string;
    sku: string;
    stockOnHand: number;
    committedStock: number;
    availableStock: number;
    avgCost: number;
    totalValue: number;
    reorderLevel: number;
    isLowStock: boolean;
}[]>;
/**
 * Get movement history for a specific item
 */
export declare function getItemMovements(companyId: string, itemId: string): Promise<{
    id: string;
    createdAt: Date;
    companyId: string;
    type: string;
    date: Date;
    itemId: string;
    qty: number;
    unitCost: number;
    totalCost: number;
    reference: string | null;
    sourceType: string | null;
    sourceId: string | null;
    remainingQty: number;
}[]>;
/**
 * Get items that are at or below reorder level
 */
export declare function getLowStockAlerts(companyId: string): Promise<{
    itemId: string;
    itemName: string;
    sku: string;
    stockOnHand: number;
    committedStock: number;
    availableStock: number;
    avgCost: number;
    totalValue: number;
    reorderLevel: number;
    isLowStock: boolean;
}[]>;
//# sourceMappingURL=inventory.service.d.ts.map