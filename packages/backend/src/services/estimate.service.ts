// ============================================================
// ERPEX — Estimate Service
// Quote management with conversion to SO/Invoice
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';

const estimateInclude = {
  contact: { select: { id: true, name: true, email: true, companyName: true } },
  lines: {
    include: { item: { select: { id: true, name: true, sku: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

function computeTotals(lines: any[], discount: number = 0) {
  const subtotal = lines.reduce((s: number, l: any) => s + (l.qty * l.rate), 0);
  const taxTotal = lines.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxTotal - discount;
  return { subtotal, taxTotal, total };
}

export async function listEstimates(filters: {
  contactId?: string; status?: string; search?: string; page?: number; pageSize?: number;
}) {
  const where: any = {};
  if (filters.contactId) where.contactId = filters.contactId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search } },
      { contact: { name: { contains: filters.search } } },
    ];
  }

  const page = parseInt(String(filters.page || '1'), 10) || 1;
  const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;

  const [data, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      include: estimateInclude,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.estimate.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getEstimate(id: string) {
  const est = await prisma.estimate.findUnique({ where: { id }, include: estimateInclude });
  if (!est) throw new AppError('Estimate not found', 404);
  return est;
}

export async function createEstimate(data: any) {
  const number = await generateDocNumber('ESTIMATE', 'estimate');
  const { lines, discount, ...header } = data;
  const lineData = lines.map((l: any, idx: number) => ({
    ...l,
    amount: l.qty * l.rate + (l.taxAmount || 0),
    sortOrder: l.sortOrder ?? idx,
  }));
  const totals = computeTotals(lineData, discount || 0);

  return prisma.estimate.create({
    data: {
      ...header,
      number,
      discount: discount || 0,
      ...totals,
      lines: { create: lineData },
    },
    include: estimateInclude,
  });
}

export async function updateEstimateStatus(id: string, status: string) {
  const est = await prisma.estimate.findUnique({ where: { id } });
  if (!est) throw new AppError('Estimate not found', 404);
  return prisma.estimate.update({ where: { id }, data: { status }, include: estimateInclude });
}

export async function convertToInvoice(estimateId: string) {
  const est = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { lines: true, contact: true },
  });
  if (!est) throw new AppError('Estimate not found', 404);
  if (est.status === 'INVOICED') throw new AppError('Estimate already invoiced', 400);

  const { generateDocNumber: genInv } = await import('../utils/docNumber.js');
  const invNumber = await genInv('INVOICE', 'invoice');
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (est.contact?.creditTermDays || 30));

  const invoice = await prisma.invoice.create({
    data: {
      number: invNumber,
      contactId: est.contactId,
      estimateId: est.id,
      date: new Date(),
      dueDate,
      subtotal: est.subtotal,
      taxTotal: est.taxTotal,
      discount: est.discount,
      total: est.total,
      amountDue: est.total,
      lines: {
        create: est.lines.map((l) => ({
          itemId: l.itemId,
          description: l.description,
          qty: l.qty,
          rate: l.rate,
          taxConfigId: l.taxConfigId,
          taxAmount: l.taxAmount,
          amount: l.amount,
          sortOrder: l.sortOrder,
        })),
      },
    },
  });

  await prisma.estimate.update({ where: { id: estimateId }, data: { status: 'INVOICED' } });
  return invoice;
}
