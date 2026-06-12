// ============================================================
// ERPEX — Sales Routes (Estimates, Invoices, Payments, Credits)
// ============================================================
import { Router } from 'express';
import * as estimateService from '../services/estimate.service.js';
import * as invoiceService from '../services/invoice.service.js';
import * as paymentReceivedService from '../services/paymentReceived.service.js';

export const estimateRoutes = Router();
export const invoiceRoutes = Router();
export const paymentReceivedRoutes = Router();
export const creditNoteRoutes = Router();

// ─── Estimates ──────────────────────────────────────────────

estimateRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await estimateService.listEstimates(req.query as any)) }); } catch (e) { next(e); }
});
estimateRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await estimateService.getEstimate(req.params.id) }); } catch (e) { next(e); }
});
estimateRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await estimateService.createEstimate(req.body) }); } catch (e) { next(e); }
});
estimateRoutes.patch('/:id/status', async (req, res, next) => {
  try { res.json({ success: true, data: await estimateService.updateEstimateStatus(req.params.id, req.body.status) }); } catch (e) { next(e); }
});
estimateRoutes.post('/:id/convert-invoice', async (req, res, next) => {
  try { res.json({ success: true, data: await estimateService.convertToInvoice(req.params.id) }); } catch (e) { next(e); }
});

// ─── Invoices ───────────────────────────────────────────────

invoiceRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await invoiceService.listInvoices(req.query as any)) }); } catch (e) { next(e); }
});
invoiceRoutes.get('/unpaid/:contactId', async (req, res, next) => {
  try { res.json({ success: true, data: await invoiceService.getUnpaidInvoices(req.params.contactId) }); } catch (e) { next(e); }
});
invoiceRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await invoiceService.getInvoice(req.params.id) }); } catch (e) { next(e); }
});
invoiceRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await invoiceService.createInvoice(req.body) }); } catch (e) { next(e); }
});
invoiceRoutes.post('/:id/post', async (req, res, next) => {
  try { res.json({ success: true, data: await invoiceService.postInvoice(req.params.id) }); } catch (e) { next(e); }
});
invoiceRoutes.post('/:id/void', async (req, res, next) => {
  try { res.json({ success: true, data: await invoiceService.voidInvoice(req.params.id) }); } catch (e) { next(e); }
});

// ─── Payments Received ──────────────────────────────────────

paymentReceivedRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await paymentReceivedService.listPaymentsReceived(req.query as any)) }); } catch (e) { next(e); }
});
paymentReceivedRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await paymentReceivedService.createPaymentReceived(req.body) }); } catch (e) { next(e); }
});

// ─── Credit Notes (CRUD stub) ──────────────────────────────

import prisma from '../lib/prisma.js';
import { generateDocNumber } from '../utils/docNumber.js';

creditNoteRoutes.get('/', async (req, res, next) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const pageSize = parseInt(String(req.query.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
      prisma.creditNote.findMany({
        include: { contact: { select: { id: true, name: true } }, lines: true },
        orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.creditNote.count(),
    ]);
    res.json({ success: true, data, total, page, pageSize });
  } catch (e) { next(e); }
});
creditNoteRoutes.post('/', async (req, res, next) => {
  try {
    const number = await generateDocNumber('CREDIT_NOTE', 'creditNote');
    const { lines, ...header } = req.body;
    const lineData = lines.map((l: any, idx: number) => ({
      ...l, amount: l.qty * l.rate + (l.taxAmount || 0), sortOrder: idx,
    }));
    const subtotal = lineData.reduce((s: number, l: any) => s + l.qty * l.rate, 0);
    const taxTotal = lineData.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
    const total = subtotal + taxTotal;
    const cn = await prisma.creditNote.create({
      data: { ...header, number, date: new Date(header.date), subtotal, taxTotal, total, balanceRemaining: total, lines: { create: lineData } },
      include: { contact: { select: { id: true, name: true } }, lines: true },
    });
    res.status(201).json({ success: true, data: cn });
  } catch (e) { next(e); }
});
