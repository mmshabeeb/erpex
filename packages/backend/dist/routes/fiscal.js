// ============================================================
// ERPEX — Fiscal Year Routes
// ============================================================
import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createFiscalYearSchema } from '@erpex/shared';
import * as fiscalService from '../services/fiscal.service.js';
export const fiscalRoutes = Router();
// GET /api/fiscal/years — List fiscal years
fiscalRoutes.get('/years', async (req, res, next) => {
    try {
        const years = await fiscalService.listFiscalYears(req.companyId);
        res.json({ success: true, data: years });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/fiscal/years — Create fiscal year
fiscalRoutes.post('/years', validateBody(createFiscalYearSchema), async (req, res, next) => {
    try {
        const year = await fiscalService.createFiscalYear(req.companyId, req.body);
        res.status(201).json({ success: true, data: year });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/fiscal/periods/:id/lock — Lock a period
fiscalRoutes.patch('/periods/:id/lock', async (req, res, next) => {
    try {
        const period = await fiscalService.togglePeriodLock(req.companyId, req.params.id, true);
        res.json({ success: true, data: period });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/fiscal/periods/:id/unlock — Unlock a period
fiscalRoutes.patch('/periods/:id/unlock', async (req, res, next) => {
    try {
        const period = await fiscalService.togglePeriodLock(req.companyId, req.params.id, false);
        res.json({ success: true, data: period });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/fiscal/years/:id/close — Close fiscal year
fiscalRoutes.post('/years/:id/close', async (req, res, next) => {
    try {
        const year = await fiscalService.closeFiscalYear(req.companyId, req.params.id);
        res.json({ success: true, data: year });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=fiscal.js.map