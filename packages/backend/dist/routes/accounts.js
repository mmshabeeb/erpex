// ============================================================
// ERPEX — Account Routes
// ============================================================
import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createAccountSchema, updateAccountSchema } from '@erpex/shared';
import * as accountService from '../services/account.service.js';
export const accountRoutes = Router();
// GET /api/accounts — List all accounts
accountRoutes.get('/', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const accounts = await accountService.listAccounts(companyId);
        res.json({ success: true, data: accounts });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/accounts/tree — Hierarchical tree
accountRoutes.get('/tree', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const tree = await accountService.getAccountTree(companyId);
        res.json({ success: true, data: tree });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/accounts/cash-bank — Cash & Bank accounts only
accountRoutes.get('/cash-bank', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const accounts = await accountService.getCashBankAccounts(companyId);
        res.json({ success: true, data: accounts });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/accounts/:id — Single account
accountRoutes.get('/:id', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const account = await accountService.getAccount(companyId, req.params.id);
        res.json({ success: true, data: account });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/accounts/:id/ledger — Ledger view
accountRoutes.get('/:id/ledger', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const { startDate, endDate } = req.query;
        const ledger = await accountService.getAccountLedger(companyId, req.params.id, startDate, endDate);
        res.json({ success: true, data: ledger });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/accounts — Create account
accountRoutes.post('/', validateBody(createAccountSchema), async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const account = await accountService.createAccount(companyId, req.body);
        res.status(201).json({ success: true, data: account });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/accounts/:id — Update account
accountRoutes.put('/:id', validateBody(updateAccountSchema), async (req, res, next) => {
    try {
        const companyId = req.companyId;
        const account = await accountService.updateAccount(companyId, req.params.id, req.body);
        res.json({ success: true, data: account });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=accounts.js.map