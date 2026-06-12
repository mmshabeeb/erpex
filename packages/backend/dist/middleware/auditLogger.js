// ============================================================
// ERPEX — Audit Logger Middleware
// ============================================================
import prisma from '../lib/prisma.js';
/**
 * Creates an immutable audit log entry.
 * Called from services after state changes.
 */
export async function createAuditLog(data) {
    await prisma.auditLog.create({
        data: {
            companyId: data.companyId,
            entityType: data.entityType,
            entityId: data.entityId,
            action: data.action,
            oldValue: data.oldValue ? JSON.stringify(data.oldValue) : undefined,
            newValue: data.newValue ? JSON.stringify(data.newValue) : undefined,
            userId: data.userId,
            ipAddress: data.ipAddress,
            journalEntryId: data.journalEntryId || undefined,
        },
    });
}
//# sourceMappingURL=auditLogger.js.map