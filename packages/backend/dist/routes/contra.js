// ============================================================
// ERPEX — Contra Routes
// ============================================================
import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createContraSchema } from '@erpex/shared';
import * as contraService from '../services/contra.service.js';
export const contraRoutes = Router();
// GET /api/contra — List contra transactions
contraRoutes.get('/', async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const entries = await contraService.listContraTransactions(req.companyId, startDate, endDate);
        res.json({ success: true, data: entries });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/contra — Create contra transaction
contraRoutes.post('/', validateBody(createContraSchema), async (req, res, next) => {
    try {
        const entry = await contraService.createContraTransaction(req.companyId, req.body);
        res.status(201).json({ success: true, data: entry });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=contra.js.map