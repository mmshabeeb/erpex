// ============================================================
// ERPEX — Day Book Service
// Chronological record of all transactions
// ============================================================
import prisma from '../lib/prisma.js';
export async function getDayBook(filters) {
    const where = {};
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate)
            where.date.gte = new Date(filters.startDate);
        if (filters.endDate)
            where.date.lte = new Date(filters.endDate);
    }
    if (filters.voucherType)
        where.type = filters.voucherType;
    if (filters.status)
        where.status = filters.status;
    if (filters.createdBy)
        where.createdBy = filters.createdBy;
    const entries = await prisma.journalEntry.findMany({
        where,
        include: {
            items: {
                include: {
                    account: { select: { id: true, code: true, name: true, type: true } },
                },
            },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return entries.map(entry => ({
        date: entry.date.toISOString(),
        voucherNo: entry.voucherNo,
        journalEntryId: entry.id,
        type: entry.type,
        status: entry.status,
        narration: entry.narration,
        totalDebit: entry.items.reduce((s, i) => s + Number(i.debit), 0),
        totalCredit: entry.items.reduce((s, i) => s + Number(i.credit), 0),
        createdBy: entry.createdBy,
        items: entry.items.map(i => ({
            id: i.id,
            journalEntryId: i.journalEntryId,
            accountId: i.accountId,
            account: i.account,
            debit: Number(i.debit),
            credit: Number(i.credit),
            narration: i.narration,
            taxConfigId: i.taxConfigId,
        })),
    }));
}
//# sourceMappingURL=daybook.service.js.map