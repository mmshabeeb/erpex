// ============================================================
// ERPEX — Day Book Routes
// ============================================================

import { Router } from 'express';
import * as daybookService from '../services/daybook.service.js';

export const daybookRoutes = Router();

daybookRoutes.get('/', async (req, res, next) => {
  try {
    const entries = await daybookService.getDayBook(req.query as any);
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
});
