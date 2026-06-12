import { DOCUMENT_PREFIX } from '@erpex/shared';
type DocType = keyof typeof DOCUMENT_PREFIX;
/**
 * Generates the next sequential document number for any document type.
 * Format: {PREFIX}-{YYYY}-{NNNN}
 * Example: INV-2026-0001, PO-2026-0042
 */
export declare function generateDocNumber(companyId: string, type: DocType, model: string): Promise<string>;
export {};
//# sourceMappingURL=docNumber.d.ts.map