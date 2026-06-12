// ============================================================
// ERPEX — Bill Service
// Accounts Payable recording with auto-JE and inventory IN
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
import { recordInMovement } from './inventory.service.js';
import { createAuditLog } from '../middleware/auditLogger.js';

const billInclude = {
  contact: { select: { id: true, name: true, companyName: true } },
  lines: {
    include: { item: { select: { id: true, name: true, sku: true, type: true, inventoryAccountId: true, purchaseAccountId: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function listBills(companyId: string, filters: {
  contactId?: string; status?: string; search?: string; page?: number; pageSize?: number;
  startDate?: string; endDate?: string;
}) {
  const where: any = { companyId };
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
    prisma.bill.findMany({
      where, include: billInclude, orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.bill.count({ where }),
  ]);

  return { data, total, page, pageSize };
}

export async function getBill(companyId: string, id: string) {
  const bill = await prisma.bill.findFirst({ where: { id, companyId }, include: billInclude });
  if (!bill) throw new AppError('Bill not found', 404);
  return bill;
}

export async function createBill(companyId: string, data: any) {
  const number = await generateDocNumber(companyId, 'BILL', 'bill');
  const { lines, discount, ...header } = data;

  const lineData = lines.map((l: any, idx: number) => ({
    ...l, amount: l.qty * l.rate + (l.taxAmount || 0), sortOrder: l.sortOrder ?? idx,
  }));

  const subtotal = lineData.reduce((s: number, l: any) => s + (l.qty * l.rate), 0);
  const taxTotal = lineData.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxTotal - (discount || 0);

  return prisma.bill.create({
    data: {
      ...header, companyId, number, discount: discount || 0, subtotal, taxTotal, total,
      amountPaid: 0, amountDue: total,
      date: new Date(header.date), dueDate: new Date(header.dueDate),
      lines: { create: lineData },
    },
    include: billInclude,
  });
}

/**
 * Post a bill: generate JE and record inventory IN for product items
 * Dr Inventory/Expense [subtotal per line]
 * Dr Input Tax Credit [taxTotal]
 *   Cr Accounts Payable [total]
 */
export async function postBill(companyId: string, id: string) {
  const bill = await prisma.bill.findFirst({
    where: { id, companyId }, include: { lines: { include: { item: true } }, contact: true },
  });
  if (!bill) throw new AppError('Bill not found', 404);
  if (bill.status !== 'DRAFT') throw new AppError('Only draft bills can be posted', 400);

  const apAccount = await prisma.account.findFirst({ where: { code: '21100', companyId } }); // Accounts Payable
  const itcAccount = await prisma.account.findFirst({ where: { code: '11500', companyId } }); // GST Receivable (ITC)

  if (!apAccount) throw new AppError('Accounts Payable account not found in COA', 500);

  const jeItems: any[] = [];

  // Process each line — Dr Inventory or Expense account
  for (const line of bill.lines) {
    if (line.item && line.item.type === 'PRODUCT' && line.item.inventoryAccountId) {
      // Record inventory IN movement
      await recordInMovement(companyId, {
        itemId: line.item.id, date: bill.date, qty: line.qty, unitCost: line.rate,
        reference: bill.number, sourceType: 'PURCHASE', sourceId: bill.id,
      });
      jeItems.push({
        accountId: line.item.inventoryAccountId,
        debit: line.qty * line.rate, credit: 0,
        narration: `Inventory - ${line.item.name}`,
      });
    } else if (line.item?.purchaseAccountId) {
      jeItems.push({
        accountId: line.item.purchaseAccountId,
        debit: line.qty * line.rate, credit: 0,
        narration: `Purchase - ${line.description}`,
      });
    } else {
      // Fallback: use a generic purchase account
      const genericPurchase = await prisma.account.findFirst({ where: { code: '51000', companyId } });
      if (genericPurchase) {
        jeItems.push({
          accountId: genericPurchase.id, debit: line.qty * line.rate, credit: 0,
          narration: `Purchase - ${line.description}`,
        });
      }
    }
  }

  // Dr Input Tax Credit
  if (bill.taxTotal > 0 && itcAccount) {
    jeItems.push({
      accountId: itcAccount.id, debit: bill.taxTotal, credit: 0,
      narration: `ITC - ${bill.number}`,
    });
  }

  // Cr Accounts Payable
  jeItems.push({
    accountId: apAccount.id, debit: 0, credit: bill.total,
    narration: `Bill ${bill.number}`,
  });

  const voucherNo = await generateVoucherNo(companyId, 'PURCHASE');
  const je = await prisma.journalEntry.create({
    data: {
      companyId,
      voucherNo, date: bill.date, type: 'PURCHASE', status: 'POSTED',
      narration: `Bill ${bill.number} - ${bill.contact?.name}`,
      billId: bill.id,
      items: { create: jeItems },
    },
  });

  await prisma.bill.update({
    where: { id, companyId }, data: { status: 'RECEIVED', journalEntryId: je.id },
  });

  await createAuditLog({
    companyId,
    entityType: 'Bill', entityId: id, action: 'POSTED',
    newValue: { number: bill.number, total: bill.total, journalEntryId: je.id },
  });

  return getBill(companyId, id);
}

export async function getUnpaidBills(companyId: string, contactId: string) {
  return prisma.bill.findMany({
    where: {
      companyId,
      contactId, status: { in: ['RECEIVED', 'PARTIALLY_PAID', 'OVERDUE'] },
      amountDue: { gt: 0 },
    },
    orderBy: { date: 'asc' },
    select: { id: true, number: true, date: true, dueDate: true, total: true, amountPaid: true, amountDue: true, status: true },
  });
}
