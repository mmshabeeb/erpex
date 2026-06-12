// ============================================================
// ERPEX — Sales Routes (Estimates, Invoices, Payments, Credits)
// ============================================================
import { Router } from 'express';
import * as estimateService from '../services/estimate.service.js';
import * as invoiceService from '../services/invoice.service.js';
import * as paymentReceivedService from '../services/paymentReceived.service.js';
import prisma from '../lib/prisma.js';
import { generateDocNumber } from '../utils/docNumber.js';
export const estimateRoutes = Router();
export const invoiceRoutes = Router();
export const paymentReceivedRoutes = Router();
export const creditNoteRoutes = Router();
// ─── Estimates ──────────────────────────────────────────────
estimateRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await estimateService.listEstimates(req.companyId, req.query)) });
    }
    catch (e) {
        next(e);
    }
});
estimateRoutes.get('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await estimateService.getEstimate(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
estimateRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await estimateService.createEstimate(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
estimateRoutes.patch('/:id/status', async (req, res, next) => {
    try {
        res.json({ success: true, data: await estimateService.updateEstimateStatus(req.companyId, req.params.id, req.body.status) });
    }
    catch (e) {
        next(e);
    }
});
estimateRoutes.post('/:id/convert-invoice', async (req, res, next) => {
    try {
        res.json({ success: true, data: await estimateService.convertToInvoice(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
// ─── Invoices ───────────────────────────────────────────────
invoiceRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await invoiceService.listInvoices(req.companyId, req.query)) });
    }
    catch (e) {
        next(e);
    }
});
invoiceRoutes.get('/unpaid/:contactId', async (req, res, next) => {
    try {
        res.json({ success: true, data: await invoiceService.getUnpaidInvoices(req.companyId, req.params.contactId) });
    }
    catch (e) {
        next(e);
    }
});
invoiceRoutes.get('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await invoiceService.getInvoice(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
invoiceRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await invoiceService.createInvoice(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
invoiceRoutes.post('/:id/post', async (req, res, next) => {
    try {
        res.json({ success: true, data: await invoiceService.postInvoice(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
invoiceRoutes.post('/:id/void', async (req, res, next) => {
    try {
        res.json({ success: true, data: await invoiceService.voidInvoice(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
// ─── Payments Received ──────────────────────────────────────
paymentReceivedRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await paymentReceivedService.listPaymentsReceived(req.companyId, req.query)) });
    }
    catch (e) {
        next(e);
    }
});
paymentReceivedRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await paymentReceivedService.createPaymentReceived(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
// ─── Credit Notes (CRUD stub) ──────────────────────────────
creditNoteRoutes.get('/', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const page = parseInt(String(req.query.page || '1'), 10) || 1;
        const pageSize = parseInt(String(req.query.pageSize || '20'), 10) || 20;
        const [data, total] = await Promise.all([
            prisma.creditNote.findMany({
                where: { companyId },
                include: { contact: { select: { id: true, name: true } }, lines: true },
                orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
            }),
            prisma.creditNote.count({ where: { companyId } }),
        ]);
        res.json({ success: true, data, total, page, pageSize });
    }
    catch (e) {
        next(e);
    }
});
creditNoteRoutes.post('/', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const number = await generateDocNumber(companyId, 'CREDIT_NOTE', 'creditNote');
        const { lines, ...header } = req.body;
        const lineData = lines.map((l, idx) => ({
            ...l, amount: l.qty * l.rate + (l.taxAmount || 0), sortOrder: idx,
        }));
        const subtotal = lineData.reduce((s, l) => s + l.qty * l.rate, 0);
        const taxTotal = lineData.reduce((s, l) => s + (l.taxAmount || 0), 0);
        const total = subtotal + taxTotal;
        const cn = await prisma.creditNote.create({
            data: { ...header, companyId, number, date: new Date(header.date), subtotal, taxTotal, total, balanceRemaining: total, lines: { create: lineData } },
            include: { contact: { select: { id: true, name: true } }, lines: true },
        });
        res.status(201).json({ success: true, data: cn });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=sales.js.map