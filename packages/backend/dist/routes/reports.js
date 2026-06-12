// ============================================================
// ERPEX — Report Routes
// ============================================================
import { Router } from 'express';
import * as reportService from '../services/report.service.js';
export const reportRoutes = Router();
// GET /api/reports/trial-balance
reportRoutes.get('/trial-balance', async (req, res, next) => {
    try {
        const { asOfDate, startDate } = req.query;
        const date = asOfDate || new Date().toISOString().split('T')[0];
        const report = await reportService.getTrialBalance(date, startDate);
        res.json({ success: true, data: report });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/reports/profit-loss
reportRoutes.get('/profit-loss', async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ success: false, message: 'startDate and endDate are required' });
            return;
        }
        const report = await reportService.getProfitLoss(startDate, endDate);
        res.json({ success: true, data: report });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/reports/balance-sheet
reportRoutes.get('/balance-sheet', async (req, res, next) => {
    try {
        const { asOfDate } = req.query;
        const date = asOfDate || new Date().toISOString().split('T')[0];
        const report = await reportService.getBalanceSheet(date);
        res.json({ success: true, data: report });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=reports.js.map