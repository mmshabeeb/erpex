// ============================================================
// ERPEX — Branch Routes (Scoped)
// ============================================================
import { Router } from 'express';
import * as branchService from '../services/branch.service.js';
export const branchRoutes = Router();
branchRoutes.get('/', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        res.json({ success: true, data: await branchService.listBranches(companyId) });
    }
    catch (e) {
        next(e);
    }
});
branchRoutes.get('/:id', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        res.json({ success: true, data: await branchService.getBranch(companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
branchRoutes.post('/', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        res.status(201).json({ success: true, data: await branchService.createBranch(companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
branchRoutes.put('/:id', async (req, res, next) => {
    try {
        const companyId = req.companyId;
        res.json({ success: true, data: await branchService.updateBranch(companyId, req.params.id, req.body) });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=branches.js.map