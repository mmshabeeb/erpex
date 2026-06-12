// ============================================================
// ERPEX — Budget Routes
// ============================================================
import { Router } from 'express';
import * as budgetService from '../services/budget.service.js';
export const budgetRoutes = Router();
budgetRoutes.get('/', async (req, res, next) => {
    try {
        const { fiscalYearId } = req.query;
        res.json({ success: true, data: await budgetService.listBudgets(req.companyId, fiscalYearId) });
    }
    catch (e) {
        next(e);
    }
});
budgetRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await budgetService.upsertBudget(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
budgetRoutes.post('/bulk', async (req, res, next) => {
    try {
        res.json({ success: true, data: await budgetService.bulkUpsertBudgets(req.companyId, req.body.items) });
    }
    catch (e) {
        next(e);
    }
});
budgetRoutes.get('/variance/:fiscalYearId', async (req, res, next) => {
    try {
        res.json({ success: true, data: await budgetService.getBudgetVsActual(req.companyId, req.params.fiscalYearId) });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=budgets.js.map