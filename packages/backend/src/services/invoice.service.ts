// ============================================================
// ERPEX — Invoice Service
// Commercial invoicing with auto-JE generation & inventory
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
import { recordOutMovement } from './inventory.service.js';
import { createAuditLog } from '../middleware/auditLogger.js';

const invoiceInclude = {
  contact: { select: { id: true, name: true, email: true, companyName: true, creditTermDays: true } },
  lines: {
    include: { item: { select: { id: true, name: true, sku: true, type: true, cogsAccountId: true, inventoryAccountId: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function listInvoices(filters: {
  contactId?: string; status?: string; search?: string; page?: number; pageSize?: number;
  startDate?: string; endDate?: string;
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
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  const page = parseInt(String(filters.page || '1'), 10) || 1;
  const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!inv) throw new AppError('Invoice not found', 404);
  return inv;
}

export async function createInvoice(data: any) {
  const number = await generateDocNumber('INVOICE', 'invoice');
  const { lines, discount, ...header } = data;

  const lineData = lines.map((l: any, idx: number) => ({
    ...l,
    amount: l.qty * l.rate + (l.taxAmount || 0),
    sortOrder: l.sortOrder ?? idx,
  }));

  const subtotal = lineData.reduce((s: number, l: any) => s + (l.qty * l.rate), 0);
  const taxTotal = lineData.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxTotal - (discount || 0);

  const invoice = await prisma.invoice.create({
    data: {
      ...header,
      number,
      discount: discount || 0,
      subtotal,
      taxTotal,
      total,
      amountPaid: 0,
      amountDue: total,
      dueDate: new Date(header.dueDate),
      date: new Date(header.date),
      lines: { create: lineData },
    },
    include: invoiceInclude,
  });

  return invoice;
}

/**
 * Post an invoice: generate journal entries and process inventory
 * Dr Accounts Receivable [total]
 *   Cr Revenue [subtotal]
 *   Cr Tax Payable [taxTotal]
 * For PRODUCT items: Dr COGS, Cr Inventory (FIFO)
 */
export async function postInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: { include: { item: true } },
      contact: true,
    },
  });
  if (!inv) throw new AppError('Invoice not found', 404);
  if (inv.status !== 'DRAFT') throw new AppError('Only draft invoices can be posted', 400);

  // Find AR account (default: 11200 Accounts Receivable)
  const arAccount = await prisma.account.findFirst({ where: { code: '11200' } });
  // Find default revenue account (41000 Sales Revenue)
  const revenueAccount = await prisma.account.findFirst({ where: { code: '41000' } });
  // Find GST output account (21300)
  const taxAccount = await prisma.account.findFirst({ where: { code: '21300' } });

  if (!arAccount || !revenueAccount) {
    throw new AppError('Required accounts (AR, Revenue) not found in COA', 500);
  }

  const jeItems: any[] = [
    { accountId: arAccount.id, debit: inv.total, credit: 0, narration: `Invoice ${inv.number}` },
    { accountId: revenueAccount.id, debit: 0, credit: inv.subtotal, narration: `Sales - ${inv.number}` },
  ];

  if (inv.taxTotal > 0 && taxAccount) {
    jeItems.push({
      accountId: taxAccount.id,
      debit: 0,
      credit: inv.taxTotal,
      narration: `Tax - ${inv.number}`,
    });
  }

  // Process inventory for product items (FIFO)
  for (const line of inv.lines) {
    if (line.item && line.item.type === 'PRODUCT' && line.item.cogsAccountId && line.item.inventoryAccountId) {
      try {
        const { cogs } = await recordOutMovement({
          itemId: line.item.id,
          date: inv.date,
          qty: line.qty,
          reference: inv.number,
          sourceType: 'SALE',
          sourceId: inv.id,
        });

        jeItems.push(
          { accountId: line.item.cogsAccountId, debit: cogs, credit: 0, narration: `COGS - ${line.item.name}` },
          { accountId: line.item.inventoryAccountId, debit: 0, credit: cogs, narration: `Inventory out - ${line.item.name}` },
        );
      } catch (e) {
        // If insufficient stock, still post invoice but skip COGS entry
      }
    }
  }

  const voucherNo = await generateVoucherNo('SALES');
  const je = await prisma.journalEntry.create({
    data: {
      voucherNo,
      date: inv.date,
      type: 'SALES',
      status: 'POSTED',
      narration: `Invoice ${inv.number} - ${inv.contact?.name}`,
      invoiceId: inv.id,
      items: { create: jeItems },
    },
  });

  await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', journalEntryId: je.id },
  });

  await createAuditLog({
    entityType: 'Invoice',
    entityId: id,
    action: 'POSTED',
    newValue: { number: inv.number, total: inv.total, journalEntryId: je.id },
  });

  return getInvoice(id);
}

export async function voidInvoice(id: string) {
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new AppError('Invoice not found', 404);
  if (inv.amountPaid > 0) throw new AppError('Cannot void an invoice with payments', 400);

  await prisma.invoice.update({ where: { id }, data: { status: 'VOID', amountDue: 0 } });
  return getInvoice(id);
}

/**
 * Get customer invoices for payment allocation
 */
export async function getUnpaidInvoices(contactId: string) {
  return prisma.invoice.findMany({
    where: {
      contactId,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      amountDue: { gt: 0 },
    },
    orderBy: { date: 'asc' },
    select: { id: true, number: true, date: true, dueDate: true, total: true, amountPaid: true, amountDue: true, status: true },
  });
}
