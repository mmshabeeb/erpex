// ============================================================
// ERPEX — Purchase Routes (PO, Bills, Expenses, Payments Made, Vendor Credits)
// ============================================================
import { Router } from 'express';
import * as poService from '../services/purchaseOrder.service.js';
import * as billService from '../services/bill.service.js';
import * as expenseService from '../services/expense.service.js';
import * as paymentMadeService from '../services/paymentMade.service.js';
import prisma from '../lib/prisma.js';
import { generateDocNumber } from '../utils/docNumber.js';

export const purchaseOrderRoutes = Router();
export const billRoutes = Router();
export const expenseRoutes = Router();
export const paymentMadeRoutes = Router();
export const vendorCreditRoutes = Router();

// ─── Purchase Orders ────────────────────────────────────────

purchaseOrderRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await poService.listPurchaseOrders((req as any).companyId, req.query as any)) }); } catch (e) { next(e); }
});
purchaseOrderRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await poService.getPurchaseOrder((req as any).companyId, req.params.id) }); } catch (e) { next(e); }
});
purchaseOrderRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await poService.createPurchaseOrder((req as any).companyId, req.body) }); } catch (e) { next(e); }
});
purchaseOrderRoutes.patch('/:id/status', async (req, res, next) => {
  try { res.json({ success: true, data: await poService.updatePurchaseOrderStatus((req as any).companyId, req.params.id, req.body.status) }); } catch (e) { next(e); }
});
purchaseOrderRoutes.post('/:id/convert-bill', async (req, res, next) => {
  try { res.json({ success: true, data: await poService.convertToBill((req as any).companyId, req.params.id) }); } catch (e) { next(e); }
});

// ─── Bills ──────────────────────────────────────────────────

billRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await billService.listBills((req as any).companyId, req.query as any)) }); } catch (e) { next(e); }
});
billRoutes.get('/unpaid/:contactId', async (req, res, next) => {
  try { res.json({ success: true, data: await billService.getUnpaidBills((req as any).companyId, req.params.contactId) }); } catch (e) { next(e); }
});
billRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await billService.getBill((req as any).companyId, req.params.id) }); } catch (e) { next(e); }
});
billRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await billService.createBill((req as any).companyId, req.body) }); } catch (e) { next(e); }
});
billRoutes.post('/:id/post', async (req, res, next) => {
  try { res.json({ success: true, data: await billService.postBill((req as any).companyId, req.params.id) }); } catch (e) { next(e); }
});

// ─── Expenses ───────────────────────────────────────────────

expenseRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await expenseService.listExpenses((req as any).companyId, req.query as any)) }); } catch (e) { next(e); }
});
expenseRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await expenseService.createExpense((req as any).companyId, req.body) }); } catch (e) { next(e); }
});

// ─── Payments Made ──────────────────────────────────────────

paymentMadeRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await paymentMadeService.listPaymentsMade((req as any).companyId, req.query as any)) }); } catch (e) { next(e); }
});
paymentMadeRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await paymentMadeService.createPaymentMade((req as any).companyId, req.body) }); } catch (e) { next(e); }
});

// ─── Vendor Credits ─────────────────────────────────────────

vendorCreditRoutes.get('/', async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const pageSize = parseInt(String(req.query.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
      prisma.vendorCredit.findMany({
        where: { companyId },
        include: { contact: { select: { id: true, name: true } }, lines: true },
        orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.vendorCredit.count({ where: { companyId } }),
    ]);
    res.json({ success: true, data, total, page, pageSize });
  } catch (e) { next(e); }
});
vendorCreditRoutes.post('/', async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const number = await generateDocNumber(companyId, 'VENDOR_CREDIT', 'vendorCredit');
    const { lines, ...header } = req.body;
    const lineData = lines.map((l: any, idx: number) => ({
      ...l, amount: l.qty * l.rate + (l.taxAmount || 0),
    }));
    const subtotal = lineData.reduce((s: number, l: any) => s + l.qty * l.rate, 0);
    const taxTotal = lineData.reduce((s: number, l: any) => s + (l.taxAmount || 0), 0);
    const total = subtotal + taxTotal;
    const vc = await prisma.vendorCredit.create({
      data: { ...header, companyId, number, date: new Date(header.date), subtotal, taxTotal, total, balanceRemaining: total, lines: { create: lineData } },
      include: { contact: { select: { id: true, name: true } }, lines: true },
    });
    res.status(201).json({ success: true, data: vc });
  } catch (e) { next(e); }
});
