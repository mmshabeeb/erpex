// ============================================================
// ERPEX — Super Admin Routes
// Company management, user management, subscription management
// ============================================================

import { Router, Request, Response } from 'express';
import { companyService } from '../services/company.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { userService } from '../services/user.service.js';
import { authService } from '../services/auth.service.js';

const router = Router();

// ─── Companies ──────────────────────────────────────────────

// GET /api/super-admin/companies
router.get('/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await companyService.listCompanies();
    res.json(companies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/super-admin/companies
router.post('/companies', async (req: Request, res: Response) => {
  try {
    const result = await companyService.createCompany(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/super-admin/companies/:id
router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await companyService.getCompany(req.params.id as string);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/super-admin/companies/:id/impersonate
router.post('/companies/:id/impersonate', async (req: Request, res: Response) => {
  try {
    const result = await authService.impersonateCompany(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/super-admin/companies/:id
router.patch('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await companyService.updateCompany(req.params.id as string, req.body);
    res.json(company);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/super-admin/companies/:id/toggle-status
router.patch('/companies/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const company = await companyService.toggleCompanyStatus(req.params.id as string);
    res.json(company);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Company Users ──────────────────────────────────────────

// GET /api/super-admin/companies/:id/users
router.get('/companies/:id/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.listUsers(req.params.id as string);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/super-admin/companies/:id/users
router.post('/companies/:id/users', async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.params.id as string, req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/super-admin/users/:userId
router.patch('/users/:userId', async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.userId as string, req.body);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/super-admin/users/:userId/toggle-status
router.patch('/users/:userId/toggle-status', async (req: Request, res: Response) => {
  try {
    const user = await userService.toggleUserStatus(req.params.userId as string);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/super-admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      res.status(400).json({ error: 'New password is required' });
      return;
    }
    const result = await userService.resetUserPassword(req.params.userId as string, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Subscription Plans ─────────────────────────────────────

// GET /api/super-admin/plans
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.listPlans();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/super-admin/companies/:id/subscription
router.post('/companies/:id/subscription', async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      res.status(400).json({ error: 'Plan ID is required' });
      return;
    }
    const sub = await subscriptionService.assignPlan(req.params.id as string, planId);
    res.json(sub);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Dashboard Stats ────────────────────────────────────────

// GET /api/super-admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [companies, users, plans] = await Promise.all([
      (await companyService.listCompanies()),
      (await import('@prisma/client').then(m => new m.PrismaClient().user.count())),
      (await subscriptionService.listPlans()),
    ]);

    res.json({
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.isActive).length,
      totalUsers: users,
      totalPlans: plans.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GSTIN Validation ───────────────────────────────────────

// POST /api/super-admin/validate-gstin
router.post('/validate-gstin', (req: Request, res: Response) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      res.status(400).json({ error: 'GSTIN is required' });
      return;
    }
    const result = companyService.validateGSTIN(gstin);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export const superAdminRoutes = router;
