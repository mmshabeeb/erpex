// ============================================================
// ERPEX — Contra Transaction Service
// Internal fund movements (Cash ↔ Bank only)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { createJournal } from './journal.service.js';
import { VoucherType, VoucherStatus } from '@erpex/shared';
import type { ICreateContraPayload } from '@erpex/shared';

export async function listContraTransactions(companyId: string, startDate?: string, endDate?: string) {
  const where: any = { companyId, type: 'CONTRA' as any };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  return prisma.journalEntry.findMany({
    where,
    include: {
      items: {
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function createContraTransaction(companyId: string, data: ICreateContraPayload) {
  // Validate both accounts are Cash/Bank
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: { id: data.fromAccountId, companyId } }),
    prisma.account.findFirst({ where: { id: data.toAccountId, companyId } }),
  ]);

  if (!fromAccount) throw new AppError('Source account not found', 404);
  if (!toAccount) throw new AppError('Destination account not found', 404);

  if (!fromAccount.isCashOrBank) {
    throw new AppError(`"${fromAccount.name}" is not a Cash or Bank account. Contra transactions are restricted to Cash/Bank accounts only.`, 400);
  }
  if (!toAccount.isCashOrBank) {
    throw new AppError(`"${toAccount.name}" is not a Cash or Bank account. Contra transactions are restricted to Cash/Bank accounts only.`, 400);
  }

  // Create journal entry with CONTRA type
  // Credit the source (money leaving), Debit the destination (money arriving)
  return createJournal(companyId, {
    date: data.date,
    type: VoucherType.CONTRA,
    status: VoucherStatus.POSTED,
    narration: data.narration || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
    items: [
      { accountId: data.toAccountId, debit: data.amount, credit: 0 },
      { accountId: data.fromAccountId, debit: 0, credit: data.amount },
    ],
  });
}
