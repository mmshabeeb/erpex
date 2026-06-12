// ============================================================
// ERPEX — Bill Service (Localized & Scoped)
// Accounts Payable recording with auto-JE and inventory IN
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
import { recordInMovement } from './inventory.service.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { resolveGSTComponents } from './gst.service.js';
const billInclude = {
    contact: { select: { id: true, name: true, companyName: true, stateCode: true, gstin: true } },
    lines: {
        include: { item: { select: { id: true, name: true, sku: true, type: true, inventoryAccountId: true, purchaseAccountId: true, hsnCode: true, sacCode: true } } },
        orderBy: { sortOrder: 'asc' },
    },
};
export async function listBills(companyId, filters) {
    const where = { companyId };
    if (filters.contactId)
        where.contactId = filters.contactId;
    if (filters.status)
        where.status = filters.status;
    if (filters.search) {
        where.OR = [
            { number: { contains: filters.search } },
            { contact: { name: { contains: filters.search } } },
        ];
    }
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate)
            where.date.gte = new Date(filters.startDate);
        if (filters.endDate)
            where.date.lte = new Date(filters.endDate);
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
export async function getBill(companyId, id) {
    const bill = await prisma.bill.findFirst({ where: { id, companyId }, include: billInclude });
    if (!bill)
        throw new AppError('Bill not found', 404);
    return bill;
}
export async function createBill(companyId, data) {
    const number = await generateDocNumber(companyId, 'BILL', 'bill');
    const { lines, discount, ...header } = data;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company)
        throw new AppError('Company not found', 404);
    const isIndia = company.country === 'India';
    const companyState = company.stateCode || '07';
    const contact = await prisma.contact.findUnique({ where: { id: data.contactId } });
    const placeOfSupply = data.placeOfSupply || contact?.stateCode || companyState;
    // Pre-load items to get HSN/SAC codes
    const itemIds = lines.map((l) => l.itemId).filter(Boolean);
    const items = await prisma.item.findMany({
        where: { id: { in: itemIds }, companyId }
    });
    const itemMap = new Map(items.map(it => [it.id, it]));
    // Pre-load tax configs to get rates
    const taxConfigIds = lines.map((l) => l.taxConfigId).filter(Boolean);
    const taxConfigs = await prisma.taxConfig.findMany({
        where: { id: { in: taxConfigIds }, companyId }
    });
    const taxConfigMap = new Map(taxConfigs.map(tc => [tc.id, tc]));
    const lineData = lines.map((l, idx) => {
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
        }
        else {
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
    const subtotal = lineData.reduce((s, l) => s + (l.qty * l.rate), 0);
    const taxTotal = lineData.reduce((s, l) => s + (l.taxAmount || 0), 0);
    // Under Reverse Charge (RCM), tax is paid directly to government, not to vendor.
    // Hence, vendor total payable excludes the tax amount.
    const total = header.isReverseCharge
        ? subtotal - (discount || 0)
        : subtotal + taxTotal - (discount || 0);
    return prisma.bill.create({
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
            date: new Date(header.date),
            dueDate: new Date(header.dueDate),
            placeOfSupply,
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
export async function postBill(companyId, id) {
    const bill = await prisma.bill.findFirst({
        where: { id, companyId }, include: { lines: { include: { item: true } }, contact: true },
    });
    if (!bill)
        throw new AppError('Bill not found', 404);
    if (bill.status !== 'DRAFT')
        throw new AppError('Only draft bills can be posted', 400);
    const apAccount = await prisma.account.findFirst({ where: { code: '21100', companyId } }); // Accounts Payable
    const itcAccount = await prisma.account.findFirst({ where: { code: '11500', companyId } }); // Generic GST Receivable (ITC)
    const gstConfig = await prisma.gSTConfig.findFirst({ where: { companyId } });
    if (!apAccount)
        throw new AppError('Accounts Payable account not found in COA', 500);
    const jeItems = [];
    // Process each line — Dr Inventory or Expense account
    for (const line of bill.lines) {
        if (line.item && line.item.type === 'PRODUCT' && line.item.inventoryAccountId) {
            await recordInMovement(companyId, {
                itemId: line.item.id, date: bill.date, qty: line.qty, unitCost: line.rate,
                reference: bill.number, sourceType: 'PURCHASE', sourceId: bill.id,
            });
            jeItems.push({
                accountId: line.item.inventoryAccountId,
                debit: line.qty * line.rate, credit: 0,
                narration: `Inventory - ${line.item.name}`,
            });
        }
        else if (line.item?.purchaseAccountId) {
            jeItems.push({
                accountId: line.item.purchaseAccountId,
                debit: line.qty * line.rate, credit: 0,
                narration: `Purchase - ${line.description}`,
            });
        }
        else {
            const genericPurchase = await prisma.account.findFirst({ where: { code: '51000', companyId } });
            if (genericPurchase) {
                jeItems.push({
                    accountId: genericPurchase.id, debit: line.qty * line.rate, credit: 0,
                    narration: `Purchase - ${line.description}`,
                });
            }
        }
    }
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    for (const line of bill.lines) {
        totalCGST += line.cgstAmount || 0;
        totalSGST += line.sgstAmount || 0;
        totalIGST += line.igstAmount || 0;
    }
    // 1. If Reverse Charge (RCM), book RCM liability & credit clearing accounts
    if (bill.isReverseCharge && gstConfig && bill.taxTotal > 0) {
        if (gstConfig.rcmCreditAccountId && gstConfig.rcmLiabilityAccountId) {
            // Dr Input RCM Credit (Asset)
            jeItems.push({
                accountId: gstConfig.rcmCreditAccountId,
                debit: bill.taxTotal, credit: 0,
                narration: `Input RCM Credit - Bill ${bill.number}`,
            });
            // Cr RCM Liability Clearing (Liability)
            jeItems.push({
                accountId: gstConfig.rcmLiabilityAccountId,
                debit: 0, credit: bill.taxTotal,
                narration: `RCM Liability Clearing - Bill ${bill.number}`,
            });
        }
    }
    // 2. Regular GST Input Tax Credits (ITC)
    else if (gstConfig && (totalCGST > 0 || totalSGST > 0 || totalIGST > 0)) {
        if (totalCGST > 0 && gstConfig.inputCGSTAccountId) {
            jeItems.push({
                accountId: gstConfig.inputCGSTAccountId,
                debit: totalCGST, credit: 0,
                narration: `Input CGST - Bill ${bill.number}`,
            });
        }
        if (totalSGST > 0 && gstConfig.inputSGSTAccountId) {
            jeItems.push({
                accountId: gstConfig.inputSGSTAccountId,
                debit: totalSGST, credit: 0,
                narration: `Input SGST - Bill ${bill.number}`,
            });
        }
        if (totalIGST > 0 && gstConfig.inputIGSTAccountId) {
            jeItems.push({
                accountId: gstConfig.inputIGSTAccountId,
                debit: totalIGST, credit: 0,
                narration: `Input IGST - Bill ${bill.number}`,
            });
        }
    }
    else if (bill.taxTotal > 0 && itcAccount) {
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
export async function getUnpaidBills(companyId, contactId) {
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
//# sourceMappingURL=bill.service.js.map