// ============================================================
// ERPEX — Contact Service (Customers & Vendors)
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
const contactInclude = {
    addresses: true,
    priceList: { select: { id: true, name: true } },
};
export async function listContacts(filters) {
    const where = {};
    if (filters.type)
        where.type = filters.type;
    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { companyName: { contains: filters.search } },
            { email: { contains: filters.search } },
        ];
    }
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
        prisma.contact.findMany({
            where,
            include: contactInclude,
            orderBy: { name: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.contact.count({ where }),
    ]);
    // Compute outstanding balances
    const enriched = await Promise.all(data.map(async (c) => {
        let outstandingBalance = 0;
        let overdueAmount = 0;
        if (c.type === 'CUSTOMER' || c.type === 'BOTH') {
            const invoices = await prisma.invoice.findMany({
                where: { contactId: c.id, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
                select: { amountDue: true, dueDate: true },
            });
            outstandingBalance = invoices.reduce((s, i) => s + i.amountDue, 0);
            overdueAmount = invoices
                .filter(i => new Date(i.dueDate) < new Date())
                .reduce((s, i) => s + i.amountDue, 0);
        }
        if (c.type === 'VENDOR' || c.type === 'BOTH') {
            const bills = await prisma.bill.findMany({
                where: { contactId: c.id, status: { in: ['RECEIVED', 'PARTIALLY_PAID', 'OVERDUE'] } },
                select: { amountDue: true, dueDate: true },
            });
            const billBalance = bills.reduce((s, b) => s + b.amountDue, 0);
            const billOverdue = bills
                .filter(b => new Date(b.dueDate) < new Date())
                .reduce((s, b) => s + b.amountDue, 0);
            outstandingBalance += billBalance;
            overdueAmount += billOverdue;
        }
        return { ...c, outstandingBalance, overdueAmount };
    }));
    return { data: enriched, total, page, pageSize };
}
export async function getContact(id) {
    const contact = await prisma.contact.findUnique({
        where: { id },
        include: contactInclude,
    });
    if (!contact)
        throw new AppError('Contact not found', 404);
    return contact;
}
export async function createContact(data) {
    const { addresses, ...contactData } = data;
    return prisma.contact.create({
        data: {
            ...contactData,
            addresses: addresses ? { create: addresses } : undefined,
        },
        include: contactInclude,
    });
}
export async function updateContact(id, data) {
    const { addresses, ...contactData } = data;
    if (addresses) {
        await prisma.contactAddress.deleteMany({ where: { contactId: id } });
        await prisma.contactAddress.createMany({
            data: addresses.map((a) => ({ ...a, contactId: id })),
        });
    }
    return prisma.contact.update({
        where: { id },
        data: contactData,
        include: contactInclude,
    });
}
export async function getContactStatement(id, startDate, endDate) {
    const contact = await getContact(id);
    const dateFilter = {};
    if (startDate)
        dateFilter.gte = new Date(startDate);
    if (endDate)
        dateFilter.lte = new Date(endDate);
    const dateWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};
    const invoices = await prisma.invoice.findMany({
        where: { contactId: id, ...dateWhere },
        orderBy: { date: 'asc' },
        select: { id: true, number: true, date: true, total: true, amountPaid: true, amountDue: true, status: true },
    });
    const payments = await prisma.paymentReceived.findMany({
        where: { contactId: id, ...dateWhere },
        orderBy: { date: 'asc' },
        select: { id: true, number: true, date: true, amount: true },
    });
    return { contact, invoices, payments };
}
//# sourceMappingURL=contact.service.js.map