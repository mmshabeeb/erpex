// ============================================================
// ERPEX — Payment Received Service
// Customer payment processing with multi-invoice allocation
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDocNumber } from '../utils/docNumber.js';
import { generateVoucherNo } from '../utils/voucherNumber.js';
import { createAuditLog } from '../middleware/auditLogger.js';
export async function listPaymentsReceived(companyId, filters) {
    const where = { companyId };
    if (filters.contactId)
        where.contactId = filters.contactId;
    if (filters.search) {
        where.OR = [
            { number: { contains: filters.search } },
            { referenceNo: { contains: filters.search } },
        ];
    }
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
        prisma.paymentReceived.findMany({
            where,
            include: {
                contact: { select: { id: true, name: true } },
                allocations: {
                    include: { invoice: { select: { id: true, number: true, total: true } } },
                },
            },
            orderBy: { date: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.paymentReceived.count({ where }),
    ]);
    return { data, total, page, pageSize };
}
export async function createPaymentReceived(companyId, data) {
    const { allocations, ...paymentData } = data;
    const number = await generateDocNumber(companyId, 'PAYMENT_RECEIVED', 'paymentReceived');
    // Validate allocation amounts
    const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
    if (Math.abs(totalAllocated - data.amount) > 0.01) {
        throw new AppError('Allocation total must match payment amount', 400);
    }
    // Validate each invoice has sufficient balance
    for (const alloc of allocations) {
        const invoice = await prisma.invoice.findFirst({ where: { id: alloc.invoiceId, companyId } });
        if (!invoice)
            throw new AppError(`Invoice ${alloc.invoiceId} not found`, 404);
        if (alloc.amount > invoice.amountDue + 0.01) {
            throw new AppError(`Allocation ${alloc.amount} exceeds invoice ${invoice.number} balance ${invoice.amountDue}`, 400);
        }
    }
    // Create payment
    const payment = await prisma.paymentReceived.create({
        data: {
            ...paymentData,
            companyId,
            number,
            date: new Date(paymentData.date),
            allocations: { create: allocations },
        },
        include: {
            contact: { select: { id: true, name: true } },
            allocations: true,
        },
    });
    // Update invoice balances and statuses
    for (const alloc of allocations) {
        const invoice = await prisma.invoice.findFirst({ where: { id: alloc.invoiceId, companyId } });
        if (!invoice)
            continue;
        const newPaid = invoice.amountPaid + alloc.amount;
        const newDue = invoice.total - newPaid;
        const newStatus = newDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.invoice.update({
            where: { id: alloc.invoiceId },
            data: { amountPaid: newPaid, amountDue: Math.max(0, newDue), status: newStatus },
        });
    }
    // Generate journal entry: Dr Bank, Cr Accounts Receivable
    const bankAccount = data.bankAccountId
        ? await prisma.account.findFirst({ where: { id: data.bankAccountId, companyId } })
        : await prisma.account.findFirst({ where: { code: '11103', companyId } }); // HDFC Bank default
    const arAccount = await prisma.account.findFirst({ where: { code: '11200', companyId } });
    if (bankAccount && arAccount) {
        const voucherNo = await generateVoucherNo(companyId, 'RECEIPT');
        const je = await prisma.journalEntry.create({
            data: {
                companyId,
                voucherNo,
                date: new Date(data.date),
                type: 'RECEIPT',
                status: 'POSTED',
                narration: `Payment received ${number} from ${payment.contact?.name}`,
                items: {
                    create: [
                        { accountId: bankAccount.id, debit: data.amount, credit: 0, narration: `Receipt ${number}` },
                        { accountId: arAccount.id, debit: 0, credit: data.amount, narration: `Receipt ${number}` },
                    ],
                },
            },
        });
        await prisma.paymentReceived.update({
            where: { id: payment.id, companyId },
            data: { journalEntryId: je.id },
        });
    }
    await createAuditLog({
        companyId,
        entityType: 'PaymentReceived',
        entityId: payment.id,
        action: 'CREATED',
        newValue: { number, amount: data.amount, allocations: allocations.length },
    });
    return payment;
}
//# sourceMappingURL=paymentReceived.service.js.map