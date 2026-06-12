export interface AuditLogData {
    companyId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: unknown;
    newValue?: unknown;
    userId?: string;
    ipAddress?: string;
    journalEntryId?: string;
}
/**
 * Creates an immutable audit log entry.
 * Called from services after state changes.
 */
export declare function createAuditLog(data: AuditLogData): Promise<void>;
//# sourceMappingURL=auditLogger.d.ts.map