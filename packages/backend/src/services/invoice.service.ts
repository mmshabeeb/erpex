// ============================================================
// ERPEX — Invoice Service (Localized & Scoped)
// Commercial invoicing with auto-JE generation & inventory
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
import { recordOutMovement } from './inventory.service.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { resolveGSTComponents } from './gst.service.js';

const invoiceInclude = {
  contact: { select: { id: true, name: true, email: true, companyName: true, creditTermDays: true, stateCode: true, gstin: true } },
  lines: {
    include: { item: { select: { id: true, name: true, sku: true, type: true, cogsAccountId: true, inventoryAccountId: true, hsnCode: true, sacCode: true } } },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function listInvoices(companyId: string, filters: {
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

export async function getInvoice(companyId: string, id: string) {
  const inv = await prisma.invoice.findFirst({ where: { id, companyId }, include: invoiceInclude });
  if (!inv) throw new AppError('Invoice not found', 404);
  return inv;
}

export async function createInvoice(companyId: string, data: any) {
  const number = await generateDocNumber(companyId, 'INVOICE', 'invoice');
  const { lines, discount, ...header } = data;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Company not found', 404);

  const isIndia = company.country === 'India';
  const companyState = company.stateCode || '07';

  const contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
  const placeOfSupply = data.placeOfSupply || contact?.stateCode || companyState;

  // Pre-load items to get HSN/SAC codes
  const itemIds = lines.map((l: any) => l.itemId).filter(Boolean);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds }, companyId }
  });
  const itemMap = new Map(items.map(it => [it.id, it]));

  // Pre-load tax configs to get rates
  const taxConfigIds = lines.map((l: any) => l.taxConfigId).filter(Boolean);
  const taxConfigs = await prisma.taxConfig.findMany({
    where: { id: { in: taxConfigIds }, companyId }
  });
  const taxConfigMap = new Map(taxConfigs.map(tc => [tc.id, tc]));

  const lineData = lines.map((l: any, idx: number) => {
    const item = l.itemId ? itemMap.get(l.itemId) : null;
    const taxConfig = l.taxConfigId ? taxConfigMap.get(l.taxConfigId) : null;
    const taxRate = taxConfig ? taxConfig.rate : 0;
    const lineSubtotal = l.qty * l.rate;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let taxAmount = 0;

    if (isIndia && taxRate > 0) {
      const gstSplit = resolveGSTComponents(companyState, placeOfSupply, taxRate, lineSubtotal);
      cgstAmount = gstSplit.cgstAmount;
      sgstAmount = gstSplit.sgstAmount;
      igstAmount = gstSplit.igstAmount;
      taxAmount = cgstAmount + sgstAmount + igstAmount;
    } else {
      taxAmount = Number((lineSubtotal * (taxRate / 100)).toFixed(2));
    }

    const hsnSac = l.hsnSac || item?.hsnCode || item?.sacCode || null;

    return {
      ...l,
      hsnSac,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      amount: lineSubtotal + taxAmount,
      sortOrder: l.sortOrder ?? idx,
    };
  });

  const subtotal = lineData.reduce((s: number, l: any) => s + (l.qty * l.rate), 0);
  const taxTotal = lineData.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
  const total = subtotal + taxTotal - (discount || 0);

  const invoice = await prisma.invoice.create({
    data: {
      ...header,
      companyId,
      number,
      discount: discount || 0,
      subtotal,
      taxTotal,
      total,
      amountPaid: 0,
      amountDue: total,
      dueDate: new Date(header.dueDate),
      date: new Date(header.date),
      placeOfSupply,
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
 *   Cr GST components or Tax Payable [taxTotal]
 * For PRODUCT items: Dr COGS, Cr Inventory (FIFO)
 */
export async function postInvoice(companyId: string, id: string) {
  const inv = await prisma.invoice.findFirst({
    where: { id, companyId },
    include: {
      lines: { include: { item: true } },
      contact: true,
    },
  });
  if (!inv) throw new AppError('Invoice not found', 404);
  if (inv.status !== 'DRAFT') throw new AppError('Only draft invoices can be posted', 400);

  // Find AR account (default: 11200 Accounts Receivable)
  const arAccount = await prisma.account.findFirst({ where: { code: '11200', companyId } });
  // Find default revenue account (41000 Sales Revenue)
  const revenueAccount = await prisma.account.findFirst({ where: { code: '41000', companyId } });
  // Find generic GST output account (21300 Duties & Taxes)
  const taxAccount = await prisma.account.findFirst({ where: { code: '21300', companyId } });
  
  // Find company-specific GSTConfig
  const gstConfig = await prisma.gSTConfig.findFirst({ where: { companyId } });

  if (!arAccount || !revenueAccount) {
    throw new AppError('Required accounts (AR, Revenue) not found in COA', 500);
  }

  const jeItems: any[] = [
    { accountId: arAccount.id, debit: inv.total, credit: 0, narration: `Invoice ${inv.number}` },
    { accountId: revenueAccount.id, debit: 0, credit: inv.subtotal, narration: `Sales - ${inv.number}` },
  ];

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  for (const line of inv.lines) {
    totalCGST += line.cgstAmount || 0;
    totalSGST += line.sgstAmount || 0;
    totalIGST += line.igstAmount || 0;
  }

  if (gstConfig && (totalCGST > 0 || totalSGST > 0 || totalIGST > 0)) {
    if (totalCGST > 0 && gstConfig.outputCGSTAccountId) {
      jeItems.push({
        accountId: gstConfig.outputCGSTAccountId,
        debit: 0, credit: totalCGST,
        narration: `Output CGST - Invoice ${inv.number}`,
      });
    }
    if (totalSGST > 0 && gstConfig.outputSGSTAccountId) {
      jeItems.push({
        accountId: gstConfig.outputSGSTAccountId,
        debit: 0, credit: totalSGST,
        narration: `Output SGST - Invoice ${inv.number}`,
      });
    }
    if (totalIGST > 0 && gstConfig.outputIGSTAccountId) {
      jeItems.push({
        accountId: gstConfig.outputIGSTAccountId,
        debit: 0, credit: totalIGST,
        narration: `Output IGST - Invoice ${inv.number}`,
      });
    }
  } else if (inv.taxTotal > 0 && taxAccount) {
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
        const { cogs } = await recordOutMovement(companyId, {
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

  const voucherNo = await generateVoucherNo(companyId, 'SALES');
  const je = await prisma.journalEntry.create({
    data: {
      companyId,
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
    where: { id, companyId },
    data: { status: 'SENT', journalEntryId: je.id },
  });

  await createAuditLog({
    companyId,
    entityType: 'Invoice',
    entityId: id,
    action: 'POSTED',
    newValue: { number: inv.number, total: inv.total, journalEntryId: je.id },
  });

  return getInvoice(companyId, id);
}

export async function voidInvoice(companyId: string, id: string) {
  const inv = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!inv) throw new AppError('Invoice not found', 404);
  if (inv.amountPaid > 0) throw new AppError('Cannot void an invoice with payments', 400);

  await prisma.invoice.update({ where: { id, companyId }, data: { status: 'VOID', amountDue: 0 } });
  return getInvoice(companyId, id);
}

/**
 * Get customer invoices for payment allocation
 */
export async function getUnpaidInvoices(companyId: string, contactId: string) {
  return prisma.invoice.findMany({
    where: {
      companyId,
      contactId,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      amountDue: { gt: 0 },
    },
    orderBy: { date: 'asc' },
    select: { id: true, number: true, date: true, dueDate: true, total: true, amountPaid: true, amountDue: true, status: true },
  });
}
