// ============================================================
// ERPEX — Budget Service
// Budget creation + variance analysis (budget vs actual from GL)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listBudgets(companyId: string, fiscalYearId?: string) {
  const where: any = { companyId };
  if (fiscalYearId) where.fiscalYearId = fiscalYearId;
  return prisma.budget.findMany({
    where,
    include: { account: { select: { id: true, code: true, name: true, type: true } } },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { account: { code: 'asc' } }],
  });
}

export async function upsertBudget(companyId: string, data: {
  name: string; fiscalYearId: string; accountId: string; month: number; year: number; amount: number;
}) {
  return prisma.budget.upsert({
    where: {
      companyId_fiscalYearId_accountId_month_year: {
        companyId,
        fiscalYearId: data.fiscalYearId,
        accountId: data.accountId,
        month: data.month,
        year: data.year,
      },
    },
    update: { amount: data.amount, name: data.name },
    create: { ...data, companyId },
  });
}

export async function bulkUpsertBudgets(companyId: string, items: {
  name: string; fiscalYearId: string; accountId: string; month: number; year: number; amount: number;
}[]) {
  const results: any[] = [];
  for (const item of items) {
    results.push(await upsertBudget(companyId, item));
  }
  return results;
}

export async function getBudgetVsActual(companyId: string, fiscalYearId: string) {
  const fy = await prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, companyId } });
  if (!fy) throw new AppError('Fiscal year not found', 404);

  const budgets = await prisma.budget.findMany({
    where: { companyId, fiscalYearId },
    include: { account: { select: { id: true, code: true, name: true, type: true } } },
  });

  const results: any[] = [];
  for (const b of budgets) {
    const monthStart = new Date(b.year, b.month - 1, 1);
    const monthEnd = new Date(b.year, b.month, 0, 23, 59, 59);

    const items = await prisma.journalItem.findMany({
      where: {
        accountId: b.accountId,
        journalEntry: { companyId, status: 'POSTED', date: { gte: monthStart, lte: monthEnd } },
      },
      select: { debit: true, credit: true },
    });

    const totalDebit = items.reduce((s, i) => s + Number(i.debit), 0);
    const totalCredit = items.reduce((s, i) => s + Number(i.credit), 0);
    const account = (b as any).account;
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account?.type);
    const actual = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;
    const variance = b.amount - actual;
    const variancePercent = b.amount !== 0 ? (variance / b.amount) * 100 : 0;

    results.push({
      accountId: b.accountId,
      accountCode: account?.code,
      accountName: account?.name,
      accountType: account?.type,
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
