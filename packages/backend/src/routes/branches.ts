// ============================================================
// ERPEX — Branch Routes
// ============================================================
import { Router } from 'express';
import * as branchService from '../services/branch.service.js';

export const branchRoutes = Router();

branchRoutes.get('/', async (_req, res, next) => {
  try { res.json({ success: true, data: await branchService.listBranches() }); } catch (e) { next(e); }
});

branchRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await branchService.getBranch(req.params.id) }); } catch (e) { next(e); }
});

branchRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await branchService.createBranch(req.body) }); } catch (e) { next(e); }
});

branchRoutes.put('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await branchService.updateBranch(req.params.id, req.body) }); } catch (e) { next(e); }
});
