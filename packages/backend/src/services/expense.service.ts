// ============================================================
// ERPEX — Expense Service
// Quick expense entry with billable tracking
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';

export async function listExpenses(companyId: string, filters: {
  search?: string; page?: number; pageSize?: number; startDate?: string; endDate?: string;
  isBillable?: boolean;
}) {
  const where: any = { companyId };
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { referenceNo: { contains: filters.search } },
    ];
  }
  if (filters.isBillable !== undefined) where.isBillable = filters.isBillable;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  const page = parseInt(String(filters.page || '1'), 10) || 1;
  const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, name: true } },
        contact: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function createExpense(companyId: string, data: any) {
  // Create the expense record
  const expense = await prisma.expense.create({
    data: {
      ...data,
      companyId,
      date: new Date(data.date),
      taxAmount: data.taxAmount || 0,
    },
    include: {
      account: { select: { id: true, code: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
  });

  // Auto-generate journal entry: Dr Expense, Cr Cash/Bank
  const paymentAccountCode = data.paymentMethod === 'CASH' ? '11101' : '11103'; // Cash or HDFC
  const paymentAccount = await prisma.account.findFirst({ where: { code: paymentAccountCode, companyId } });

  if (paymentAccount) {
    const totalAmount = data.amount + (data.taxAmount || 0);
    const voucherNo = await generateVoucherNo(companyId, 'PAYMENT');
    const jeItems: any[] = [
      { accountId: data.accountId, debit: data.amount, credit: 0, narration: data.description },
    ];

    if (data.taxAmount > 0) {
      const itcAccount = await prisma.account.findFirst({ where: { code: '11500', companyId } });
      if (itcAccount) {
        jeItems.push({ accountId: itcAccount.id, debit: data.taxAmount, credit: 0, narration: `ITC - ${data.description}` });
      }
    }

    jeItems.push({ accountId: paymentAccount.id, debit: 0, credit: totalAmount, narration: data.description });

    const je = await prisma.journalEntry.create({
      data: {
        companyId,
        voucherNo, date: new Date(data.date), type: 'PAYMENT', status: 'POSTED',
        narration: `Expense: ${data.description}`,
        items: { create: jeItems },
      },
    });

    await prisma.expense.update({ where: { id: expense.id, companyId }, data: { journalEntryId: je.id } });
  }

  return expense;
}
