// ============================================================
// ERPEX — Payment Made Service
// Vendor payment processing with multi-bill allocation
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';

export async function listPaymentsMade(filters: {
  contactId?: string; search?: string; page?: number; pageSize?: number;
}) {
  const where: any = {};
  if (filters.contactId) where.contactId = filters.contactId;
  if (filters.search) {
    where.OR = [{ number: { contains: filters.search } }, { referenceNo: { contains: filters.search } }];
  }

  const page = parseInt(String(filters.page || '1'), 10) || 1;
  const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;

  const [data, total] = await Promise.all([
    prisma.paymentMade.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true } },
        allocations: { include: { bill: { select: { id: true, number: true, total: true } } } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.paymentMade.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function createPaymentMade(data: any) {
  const { allocations, ...paymentData } = data;
  const number = await generateDocNumber('PAYMENT_MADE', 'paymentMade');

  const totalAllocated = allocations.reduce((s: number, a: any) => s + a.amount, 0);
  if (Math.abs(totalAllocated - data.amount) > 0.01) {
    throw new AppError('Allocation total must match payment amount', 400);
  }

  const payment = await prisma.paymentMade.create({
    data: {
      ...paymentData, number, date: new Date(paymentData.date),
      allocations: { create: allocations },
    },
    include: { contact: { select: { id: true, name: true } }, allocations: true },
  });

  // Update bill balances
  for (const alloc of allocations) {
    const bill = await prisma.bill.findUnique({ where: { id: alloc.billId } });
    if (!bill) continue;
    const newPaid = bill.amountPaid + alloc.amount;
    const newDue = bill.total - newPaid;
    await prisma.bill.update({
      where: { id: alloc.billId },
      data: { amountPaid: newPaid, amountDue: Math.max(0, newDue), status: newDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID' },
    });
  }

  // JE: Dr AP, Cr Bank
  const apAccount = await prisma.account.findFirst({ where: { code: '21100' } });
  const bankAccount = data.bankAccountId
    ? await prisma.account.findUnique({ where: { id: data.bankAccountId } })
    : await prisma.account.findFirst({ where: { code: '11103' } });

  if (apAccount && bankAccount) {
    const voucherNo = await generateVoucherNo('PAYMENT');
    const je = await prisma.journalEntry.create({
      data: {
        voucherNo, date: new Date(data.date), type: 'PAYMENT', status: 'POSTED',
        narration: `Payment ${number} to ${payment.contact?.name}`,
        items: {
          create: [
            { accountId: apAccount.id, debit: data.amount, credit: 0, narration: `Payment ${number}` },
            { accountId: bankAccount.id, debit: 0, credit: data.amount, narration: `Payment ${number}` },
          ],
        },
      },
    });
    await prisma.paymentMade.update({ where: { id: payment.id }, data: { journalEntryId: je.id } });
  }

  return payment;
}
