// ============================================================
// ERPEX — Contact Routes
// ============================================================
import { Router } from 'express';
import * as contactService from '../services/contact.service.js';

export const contactRoutes = Router();

contactRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await contactService.listContacts(req.query as any)) }); } catch (e) { next(e); }
});

contactRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await contactService.getContact(req.params.id) }); } catch (e) { next(e); }
});

contactRoutes.get('/:id/statement', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as any;
    res.json({ success: true, data: await contactService.getContactStatement(req.params.id, startDate, endDate) });
  } catch (e) { next(e); }
});

contactRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await contactService.createContact(req.body) }); } catch (e) { next(e); }
});

contactRoutes.put('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await contactService.updateContact(req.params.id, req.body) }); } catch (e) { next(e); }
});
