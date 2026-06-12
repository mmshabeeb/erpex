// ============================================================
// ERPEX — Cash Book Service
// Dual-column cash receipts/payments with running balance
// ============================================================

import prisma from '../lib/prisma.js';
import type { ICashBookEntry, ICashBookFilter } from '@erpex/shared';

export async function getCashBook(filters: ICashBookFilter): Promise<ICashBookEntry[]> {
  const dateFilter: any = {};
  if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
  if (filters.endDate) dateFilter.lte = new Date(filters.endDate);

  // Find all cash accounts (isCashOrBank = true AND type = ASSET with "cash" in name or code starting with specific prefix)
  const cashAccounts = await prisma.account.findMany({
    where: {
      isCashOrBank: true,
      isActive: true,
      // Look specifically for cash accounts (not bank accounts)
      OR: [
        { name: { contains: 'cash' } },
        { name: { contains: 'Cash' } },
        { code: { startsWith: '1001' } },
      ],
    },
    select: { id: true },
  });

  // If no specific cash accounts found, use all cash/bank accounts
  const cashAccountIds = cashAccounts.length > 0
    ? cashAccounts.map(a => a.id)
    : (await prisma.account.findMany({
        where: { isCashOrBank: true, isActive: true },
        select: { id: true },
      })).map(a => a.id);

  // Get all posted journal items affecting cash accounts
  const items = await prisma.journalItem.findMany({
    where: {
      accountId: { in: cashAccountIds },
      journalEntry: {
        status: 'POSTED',
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        ...(filters.voucherType ? { type: filters.voucherType as any } : {}),
      },
    },
    include: {
      journalEntry: {
        select: { id: true, voucherNo: true, date: true, narration: true, items: {
          include: { account: { select: { name: true } } },
        }},
      },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  });

  let balance = 0;
  return items.map(item => {
    const debit = Number(item.debit);
    const credit = Number(item.credit);
    balance += debit - credit;

    // Find counter-account (the other side of the entry)
    const counterItem = item.journalEntry.items.find(i => i.id !== item.id);
    const counterAccount = counterItem?.account?.name || 'Multiple accounts';

    return {
      date: item.journalEntry.date.toISOString(),
      voucherNo: item.journalEntry.voucherNo,
      journalEntryId: item.journalEntry.id,
      counterAccount,
      narration: item.narration || item.journalEntry.narration,
      receipt: debit,    // Debit to cash = receipt
      payment: credit,   // Credit from cash = payment
      balance,
    };
  });
}
