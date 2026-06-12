export declare function validateGSTIN(gstin: string): {
    valid: boolean;
    error: string;
    stateCode?: undefined;
    pan?: undefined;
} | {
    valid: boolean;
    stateCode: string;
    pan: string;
    error?: undefined;
};
export interface GSTSplit {
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    isInterState: boolean;
}
/**
 * Resolves GST components (CGST/SGST vs IGST) based on place of supply.
 */
export declare function resolveGSTComponents(companyStateCode: string, placeOfSupplyStateCode: string, taxRate: number, lineAmount: number): GSTSplit;
/**
 * Generates GSTR-1 Data for the specified company and period.
 */
export declare function generateGSTR1Data(companyId: string, periodFrom: Date, periodTo: Date): Promise<{
    b2b: any[];
    b2cs: any[];
    hsnSummary: {
        hsnSac: string;
        qty: number;
        value: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
    }[];
}>;
//# sourceMappingURL=gst.service.d.ts.map