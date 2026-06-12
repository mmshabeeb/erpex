// ============================================================
// ERPEX — Taxation Routes
// ============================================================

import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createTaxConfigSchema, updateTaxConfigSchema } from '@erpex/shared';
import * as taxService from '../services/tax.service.js';

export const taxationRoutes = Router();

// GET /api/tax/configs — List tax configurations
taxationRoutes.get('/configs', async (req, res, next) => {
  try {
    const configs = await taxService.listTaxConfigs((req as any).companyId);
    res.json({ success: true, data: configs });
  } catch (err) { next(err); }
});

// POST /api/tax/configs — Create tax config
taxationRoutes.post('/configs', validateBody(createTaxConfigSchema), async (req, res, next) => {
  try {
    const config = await taxService.createTaxConfig((req as any).companyId, req.body);
    res.status(201).json({ success: true, data: config });
  } catch (err) { next(err); }
});

// PUT /api/tax/configs/:id — Update tax config
taxationRoutes.put('/configs/:id', validateBody(updateTaxConfigSchema), async (req, res, next) => {
  try {
    const config = await taxService.updateTaxConfig((req as any).companyId, req.params.id as string, req.body);
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

// GET /api/tax/report — Tax summary report
taxationRoutes.get('/report', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }
    const report = await taxService.getTaxReport((req as any).companyId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
});

// GET /api/tax/gstr1 — GSTR-1 return report (India GST)
taxationRoutes.get('/gstr1', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }
    const { generateGSTR1Data } = await import('../services/gst.service.js');
    const data = await generateGSTR1Data((req as any).companyId, new Date(startDate), new Date(endDate));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
