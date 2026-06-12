// ============================================================
// ERPEX — Journal Routes
// ============================================================

import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createJournalSchema } from '@erpex/shared';
import * as journalService from '../services/journal.service.js';

export const journalRoutes = Router();

// GET /api/journals — List (paginated, filtered)
journalRoutes.get('/', async (req, res, next) => {
  try {
    const result = await journalService.listJournals((req as any).companyId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/journals/:id — Get single journal
journalRoutes.get('/:id', async (req, res, next) => {
  try {
    const journal = await journalService.getJournal((req as any).companyId, req.params.id);
    res.json({ success: true, data: journal });
  } catch (err) { next(err); }
});

// POST /api/journals — Create journal entry
journalRoutes.post('/', validateBody(createJournalSchema), async (req, res, next) => {
  try {
    const journal = await journalService.createJournal((req as any).companyId, req.body);
    res.status(201).json({ success: true, data: journal });
  } catch (err) { next(err); }
});

// PATCH /api/journals/:id/post — Post a draft journal
journalRoutes.patch('/:id/post', async (req, res, next) => {
  try {
    const journal = await journalService.postJournal((req as any).companyId, req.params.id);
    res.json({ success: true, data: journal });
  } catch (err) { next(err); }
});

// POST /api/journals/:id/rectify — Create rectification entry
journalRoutes.post('/:id/rectify', async (req, res, next) => {
  try {
    const rectification = await journalService.createRectification(
      (req as any).companyId,
      req.params.id,
      req.body.narration
    );
    res.status(201).json({ success: true, data: rectification });
  } catch (err) { next(err); }
});
