// ============================================================
// ERPEX — Fiscal Year Service
// Fiscal year and period management
// ============================================================
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
// ─── List Fiscal Years ──────────────────────────────────────
export async function listFiscalYears(companyId) {
    return prisma.fiscalYear.findMany({
        where: { companyId },
        include: {
            periods: { orderBy: [{ year: 'asc' }, { month: 'asc' }] },
        },
        orderBy: { startDate: 'desc' },
    });
}
// ─── Create Fiscal Year with Auto-Generated Periods ─────────
export async function createFiscalYear(companyId, data) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    // Check for overlap with existing fiscal years
    const overlap = await prisma.fiscalYear.findFirst({
        where: {
            companyId,
            OR: [
                { startDate: { lte: endDate }, endDate: { gte: startDate } },
            ],
        },
    });
    if (overlap)
        throw new AppError('Fiscal year overlaps with existing year: ' + overlap.name, 409);
    // Generate monthly periods
    const periods = [];
    const current = new Date(startDate);
    while (current < endDate) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0); // Last day of month
        if (periodEnd > endDate) {
            periods.push({
                month: current.getMonth() + 1,
                year: current.getFullYear(),
                startDate: periodStart,
                endDate,
            });
        }
        else {
            periods.push({
                month: current.getMonth() + 1,
                year: current.getFullYear(),
                startDate: periodStart,
                endDate: periodEnd,
            });
        }
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
    }
    const fiscalYear = await prisma.fiscalYear.create({
        data: {
            companyId,
            name: data.name,
            startDate,
            endDate,
            periods: { create: periods },
        },
        include: {
            periods: { orderBy: [{ year: 'asc' }, { month: 'asc' }] },
        },
    });
    await createAuditLog({
        companyId,
        entityType: 'FiscalYear',
        entityId: fiscalYear.id,
        action: 'CREATED',
        newValue: { name: data.name, startDate: data.startDate, endDate: data.endDate, periodsCount: periods.length },
    });
    return fiscalYear;
}
// ─── Lock/Unlock Period ─────────────────────────────────────
export async function togglePeriodLock(companyId, periodId, lock) {
    const period = await prisma.fiscalPeriod.findFirst({
        where: { id: periodId, fiscalYear: { companyId } },
    });
    if (!period)
        throw new AppError('Fiscal period not found', 404);
    const updated = await prisma.fiscalPeriod.update({
        where: { id: periodId },
        data: { isLocked: lock },
    });
    await createAuditLog({
        companyId,
        entityType: 'FiscalPeriod',
        entityId: periodId,
        action: lock ? 'LOCKED' : 'UNLOCKED',
        oldValue: { isLocked: period.isLocked },
        newValue: { isLocked: lock },
    });
    return updated;
}
// ─── Close Fiscal Year ──────────────────────────────────────
export async function closeFiscalYear(companyId, id) {
    const fy = await prisma.fiscalYear.findFirst({
        where: { id, companyId },
        include: { periods: true },
    });
    if (!fy)
        throw new AppError('Fiscal year not found', 404);
    if (fy.isClosed)
        throw new AppError('Fiscal year is already closed', 400);
    // Check for any draft entries in this fiscal year
    const draftCount = await prisma.journalEntry.count({
        where: {
            companyId,
            fiscalYearId: id,
            status: 'DRAFT',
        },
    });
    if (draftCount > 0) {
        throw new AppError(`Cannot close fiscal year: ${draftCount} draft entries exist. Post or delete them first.`, 400);
    }
    // Lock all periods and close the year
    await prisma.$transaction([
        prisma.fiscalPeriod.updateMany({
            where: { fiscalYearId: id },
            data: { isLocked: true },
        }),
        prisma.fiscalYear.update({
            where: { id, companyId },
            data: { isClosed: true },
        }),
    ]);
    await createAuditLog({
        companyId,
        entityType: 'FiscalYear',
        entityId: id,
        action: 'CLOSED',
        newValue: { name: fy.name, isClosed: true },
    });
    return prisma.fiscalYear.findFirst({
        where: { id, companyId },
        include: { periods: true },
    });
}
//# sourceMappingURL=fiscal.service.js.map