// ============================================================
// ERPEX — Purchase Order Service
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
const poInclude = {
    contact: { select: { id: true, name: true, companyName: true } },
    lines: {
        include: { item: { select: { id: true, name: true, sku: true } } },
        orderBy: { sortOrder: 'asc' },
    },
};
export async function listPurchaseOrders(companyId, filters) {
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
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where, include: poInclude, orderBy: { date: 'desc' },
            skip: (page - 1) * pageSize, take: pageSize,
        }),
        prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page, pageSize };
}
export async function getPurchaseOrder(companyId, id) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, companyId }, include: poInclude });
    if (!po)
        throw new AppError('Purchase order not found', 404);
    return po;
}
export async function createPurchaseOrder(companyId, data) {
    const number = await generateDocNumber(companyId, 'PURCHASE_ORDER', 'purchaseOrder');
    const { lines, discount, ...header } = data;
    const lineData = lines.map((l, idx) => ({
        ...l, amount: l.qty * l.rate + (l.taxAmount || 0), sortOrder: l.sortOrder ?? idx, receivedQty: 0,
    }));
    const subtotal = lineData.reduce((s, l) => s + (l.qty * l.rate), 0);
    const taxTotal = lineData.reduce((s, l) => s + (l.taxAmount || 0), 0);
    const total = subtotal + taxTotal - (discount || 0);
    return prisma.purchaseOrder.create({
        data: {
            ...header, companyId, number, discount: discount || 0, subtotal, taxTotal, total,
            date: new Date(header.date),
            expectedDelivery: header.expectedDelivery ? new Date(header.expectedDelivery) : null,
            lines: { create: lineData },
        },
        include: poInclude,
    });
}
export async function updatePurchaseOrderStatus(companyId, id, status) {
    // Verify ownership first
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, companyId } });
    if (!existing)
        throw new AppError('Purchase order not found', 404);
    return prisma.purchaseOrder.update({ where: { id }, data: { status }, include: poInclude });
}
/**
 * Convert PO to Bill — transfers all lines
 */
export async function convertToBill(companyId, poId) {
    const po = await prisma.purchaseOrder.findFirst({
        where: { id: poId, companyId }, include: { lines: true, contact: true },
    });
    if (!po)
        throw new AppError('Purchase order not found', 404);
    const { generateDocNumber: genBill } = await import('../utils/docNumber.js');
    const billNumber = await genBill(companyId, 'BILL', 'bill');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (po.contact?.creditTermDays || 30));
    const bill = await prisma.bill.create({
        data: {
            companyId,
            number: billNumber, contactId: po.contactId, purchaseOrderId: po.id,
            date: new Date(), dueDate,
            subtotal: po.subtotal, taxTotal: po.taxTotal, discount: po.discount,
            total: po.total, amountDue: po.total,
            lines: {
                create: po.lines.map((l) => ({
                    itemId: l.itemId, description: l.description, qty: l.qty,
                    rate: l.rate, taxConfigId: l.taxConfigId, taxAmount: l.taxAmount,
                    amount: l.amount, sortOrder: l.sortOrder,
                })),
            },
        },
    });
    await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: 'RECEIVED' } });
    return bill;
}
//# sourceMappingURL=purchaseOrder.service.js.map