// ============================================================
// ERPEX — Account Routes
// ============================================================

import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { createAccountSchema, updateAccountSchema } from '@erpex/shared';
import * as accountService from '../services/account.service.js';

export const accountRoutes = Router();

// GET /api/accounts — List all accounts
accountRoutes.get('/', async (_req, res, next) => {
  try {
    const accounts = await accountService.listAccounts();
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
});

// GET /api/accounts/tree — Hierarchical tree
accountRoutes.get('/tree', async (_req, res, next) => {
  try {
    const tree = await accountService.getAccountTree();
    res.json({ success: true, data: tree });
  } catch (err) { next(err); }
});

// GET /api/accounts/cash-bank — Cash & Bank accounts only
accountRoutes.get('/cash-bank', async (_req, res, next) => {
  try {
    const accounts = await accountService.getCashBankAccounts();
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
});

// GET /api/accounts/:id — Single account
accountRoutes.get('/:id', async (req, res, next) => {
  try {
    const account = await accountService.getAccount(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) { next(err); }
});

// GET /api/accounts/:id/ledger — Ledger view
accountRoutes.get('/:id/ledger', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const ledger = await accountService.getAccountLedger(req.params.id, startDate, endDate);
    res.json({ success: true, data: ledger });
  } catch (err) { next(err); }
});

// POST /api/accounts — Create account
accountRoutes.post('/', validateBody(createAccountSchema), async (req, res, next) => {
  try {
    const account = await accountService.createAccount(req.body);
    res.status(201).json({ success: true, data: account });
  } catch (err) { next(err); }
});

// PUT /api/accounts/:id — Update account
accountRoutes.put('/:id', validateBody(updateAccountSchema), async (req, res, next) => {
  try {
    const account = await accountService.updateAccount(req.params.id, req.body);
    res.json({ success: true, data: account });
  } catch (err) { next(err); }
});
