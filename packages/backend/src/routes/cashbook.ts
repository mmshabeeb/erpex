// ============================================================
// ERPEX — Cash Book Routes
// ============================================================

import { Router } from 'express';
import * as cashbookService from '../services/cashbook.service.js';

export const cashbookRoutes = Router();

cashbookRoutes.get('/', async (req, res, next) => {
  try {
    const entries = await cashbookService.getCashBook(req.query as any);
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
});
