// ============================================================
// ERPEX — Budget Service
// Budget creation + variance analysis (budget vs actual from GL)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listBudgets(fiscalYearId?: string) {
  const where: any = {};
  if (fiscalYearId) where.fiscalYearId = fiscalYearId;
  return prisma.budget.findMany({
    where,
    include: { account: { select: { id: true, code: true, name: true, type: true } } },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { account: { code: 'asc' } }],
  });
}

export async function upsertBudget(data: {
  name: string; fiscalYearId: string; accountId: string; month: number; year: number; amount: number;
}) {
  return prisma.budget.upsert({
    where: {
      fiscalYearId_accountId_month_year: {
        fiscalYearId: data.fiscalYearId,
        accountId: data.accountId,
        month: data.month,
        year: data.year,
      },
    },
    update: { amount: data.amount, name: data.name },
    create: data,
  });
}

export async function bulkUpsertBudgets(items: {
  name: string; fiscalYearId: string; accountId: string; month: number; year: number; amount: number;
}[]) {
  const results = [];
  for (const item of items) {
    results.push(await upsertBudget(item));
  }
  return results;
}

export async function getBudgetVsActual(fiscalYearId: string) {
  const fy = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
  if (!fy) throw new AppError('Fiscal year not found', 404);

  const budgets = await prisma.budget.findMany({
    where: { fiscalYearId },
    include: { account: { select: { id: true, code: true, name: true, type: true } } },
  });

  const results = [];
  for (const b of budgets) {
    const monthStart = new Date(b.year, b.month - 1, 1);
    const monthEnd = new Date(b.year, b.month, 0, 23, 59, 59);

    const items = await prisma.journalItem.findMany({
      where: {
        accountId: b.accountId,
        journalEntry: { status: 'POSTED', date: { gte: monthStart, lte: monthEnd } },
      },
      select: { debit: true, credit: true },
    });

    const totalDebit = items.reduce((s, i) => s + Number(i.debit), 0);
    const totalCredit = items.reduce((s, i) => s + Number(i.credit), 0);
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(b.account.type);
    const actual = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;
    const variance = b.amount - actual;
    const variancePercent = b.amount !== 0 ? (variance / b.amount) * 100 : 0;

    results.push({
      accountId: b.accountId,
      accountCode: b.account.code,
      accountName: b.account.name,
      accountType: b.account.type,
      month: b.month,
      year: b.year,
      budgetAmount: b.amount,
      actualAmount: actual,
      variance,
      variancePercent: Math.round(variancePercent * 100) / 100,
    });
  }

  return results;
}
