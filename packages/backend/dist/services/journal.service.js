// ============================================================
// ERPEX — Journal Service
// Core double-entry accounting business logic
// ============================================================
import prisma from '../lib/prisma.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
// ─── List Journals (Paginated + Filtered) ───────────────────
export async function listJournals(companyId, filters) {
    const where = { companyId };
    if (filters.type)
        where.type = filters.type;
    if (filters.status)
        where.status = filters.status;
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate)
            where.date.gte = new Date(filters.startDate);
        if (filters.endDate)
            where.date.lte = new Date(filters.endDate);
    }
    if (filters.search) {
        where.OR = [
            { voucherNo: { contains: filters.search } },
            { narration: { contains: filters.search } },
        ];
    }
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
        prisma.journalEntry.findMany({
            where,
            include: {
                items: {
                    include: {
                        account: { select: { id: true, code: true, name: true, type: true } },
                    },
                },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.journalEntry.count({ where }),
    ]);
    // Compute totals for each entry
    const enriched = data.map(entry => {
        const totalDebit = entry.items.reduce((s, i) => s + Number(i.debit), 0);
        const totalCredit = entry.items.reduce((s, i) => s + Number(i.credit), 0);
        return { ...entry, totalDebit, totalCredit };
    });
    return { data: enriched, total, page, pageSize };
}
// ─── Get Single Journal ─────────────────────────────────────
export async function getJournal(companyId, id) {
    const entry = await prisma.journalEntry.findFirst({
        where: { id, companyId },
        include: {
            items: {
                include: {
                    account: { select: { id: true, code: true, name: true, type: true } },
                    taxConfig: true,
                },
            },
            rectifies: { select: { id: true, voucherNo: true } },
            rectifiedBy: { select: { id: true, voucherNo: true } },
            fiscalYear: { select: { id: true, name: true } },
        },
    });
    if (!entry)
        throw new AppError('Journal entry not found', 404);
    const totalDebit = entry.items.reduce((s, i) => s + Number(i.debit), 0);
    const totalCredit = entry.items.reduce((s, i) => s + Number(i.credit), 0);
    return { ...entry, totalDebit, totalCredit };
}
// ─── Create Journal Entry ───────────────────────────────────
export async function createJournal(companyId, data) {
    // Double-entry validation (already done in Zod, but double-check)
    const totalDebit = data.items.reduce((s, i) => s + i.debit, 0);
    const totalCredit = data.items.reduce((s, i) => s + i.credit, 0);
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
        throw new AppError('Total debits must equal total credits', 400);
    }
    // Check fiscal period is not locked
    const txDate = new Date(data.date);
    const lockedPeriod = await prisma.fiscalPeriod.findFirst({
        where: {
            fiscalYear: { companyId },
            isLocked: true,
            startDate: { lte: txDate },
            endDate: { gte: txDate },
        },
    });
    if (lockedPeriod) {
        throw new AppError(`Cannot post to locked period (${lockedPeriod.month}/${lockedPeriod.year})`, 403);
    }
    // Find matching fiscal year
    const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
            companyId,
            startDate: { lte: txDate },
            endDate: { gte: txDate },
            isClosed: false,
        },
    });
    // Verify all account IDs exist
    const accountIds = data.items.map(i => i.accountId);
    const accounts = await prisma.account.findMany({
        where: { id: { in: accountIds }, companyId },
        select: { id: true, isActive: true },
    });
    if (accounts.length !== new Set(accountIds).size) {
        throw new AppError('One or more account IDs are invalid', 400);
    }
    const inactiveAcct = accounts.find(a => !a.isActive);
    if (inactiveAcct) {
        throw new AppError('Cannot post to inactive account', 400);
    }
    const voucherNo = await generateVoucherNo(companyId, data.type);
    const entry = await prisma.journalEntry.create({
        data: {
            companyId,
            voucherNo,
            date: txDate,
            type: data.type,
            status: data.status || 'DRAFT',
            narration: data.narration || null,
            currencyCode: data.currencyCode || 'INR',
            exchangeRate: data.exchangeRate || 1,
            fiscalYearId: fiscalYear?.id || null,
            items: {
                create: data.items.map(item => ({
                    accountId: item.accountId,
                    debit: item.debit,
                    credit: item.credit,
                    narration: item.narration || null,
                    taxConfigId: item.taxConfigId || null,
                })),
            },
        },
        include: {
            items: {
                include: {
                    account: { select: { id: true, code: true, name: true, type: true } },
                },
            },
        },
    });
    await createAuditLog({
        companyId,
        entityType: 'JournalEntry',
        entityId: entry.id,
        action: 'CREATED',
        newValue: { voucherNo, type: data.type, status: data.status || 'DRAFT', totalDebit, totalCredit },
        journalEntryId: entry.id,
    });
    return { ...entry, totalDebit, totalCredit };
}
// ─── Post a Draft Journal (Immutable Once Posted) ───────────
export async function postJournal(companyId, id) {
    const entry = await prisma.journalEntry.findFirst({ where: { id, companyId } });
    if (!entry)
        throw new AppError('Journal entry not found', 404);
    if (entry.status === 'POSTED')
        throw new AppError('Journal is already posted', 400);
    // Check fiscal period lock again at posting time
    const lockedPeriod = await prisma.fiscalPeriod.findFirst({
        where: {
            fiscalYear: { companyId },
            isLocked: true,
            startDate: { lte: entry.date },
            endDate: { gte: entry.date },
        },
    });
    if (lockedPeriod) {
        throw new AppError(`Cannot post to locked period (${lockedPeriod.month}/${lockedPeriod.year})`, 403);
    }
    const updated = await prisma.journalEntry.update({
        where: { id, companyId },
        data: { status: 'POSTED' },
        include: {
            items: {
                include: {
                    account: { select: { id: true, code: true, name: true, type: true } },
                },
            },
        },
    });
    await createAuditLog({
        companyId,
        entityType: 'JournalEntry',
        entityId: id,
        action: 'POSTED',
        oldValue: { status: 'DRAFT' },
        newValue: { status: 'POSTED' },
        journalEntryId: id,
    });
    return updated;
}
// ─── Create Rectification Entry ─────────────────────────────
export async function createRectification(companyId, originalId, narration) {
    const original = await prisma.journalEntry.findFirst({
        where: { id: originalId, companyId },
        include: { items: true },
    });
    if (!original)
        throw new AppError('Original journal entry not found', 404);
    if (original.status !== 'POSTED')
        throw new AppError('Can only rectify posted entries', 400);
    const voucherNo = await generateVoucherNo(companyId, original.type);
    // Create mirror entry (swap debits and credits)
    const rectEntry = await prisma.journalEntry.create({
        data: {
            companyId,
            voucherNo,
            date: new Date(),
            type: original.type,
            status: 'POSTED',
            narration: narration || `Rectification of ${original.voucherNo}`,
            currencyCode: original.currencyCode,
            exchangeRate: original.exchangeRate,
            fiscalYearId: original.fiscalYearId,
            rectifiesId: originalId,
            items: {
                create: original.items.map(item => ({
                    accountId: item.accountId,
                    debit: item.credit, // Swap: original credit → rectification debit
                    credit: item.debit, // Swap: original debit → rectification credit
                    narration: `Rectification of ${original.voucherNo}`,
                })),
            },
        },
        include: {
            items: {
                include: {
                    account: { select: { id: true, code: true, name: true, type: true } },
                },
            },
        },
    });
    await createAuditLog({
        companyId,
        entityType: 'JournalEntry',
        entityId: rectEntry.id,
        action: 'RECTIFICATION_CREATED',
        newValue: { voucherNo: rectEntry.voucherNo, rectifies: original.voucherNo },
        journalEntryId: rectEntry.id,
    });
    return rectEntry;
}
//# sourceMappingURL=journal.service.js.map