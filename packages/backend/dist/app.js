// ============================================================
// ERPEX — Express Application Setup (Multi-Tenant ERP)
// ============================================================
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, requireSuperAdmin, injectCompanyScope } from './middleware/auth.middleware.js';
// Auth & Platform
import { authRoutes } from './routes/auth.js';
import { superAdminRoutes } from './routes/superadmin.js';
// Core Accounting
import { accountRoutes } from './routes/accounts.js';
import { journalRoutes } from './routes/journals.js';
import { contraRoutes } from './routes/contra.js';
import { cashbookRoutes } from './routes/cashbook.js';
import { daybookRoutes } from './routes/daybook.js';
import { bankingRoutes } from './routes/banking.js';
import { taxationRoutes } from './routes/taxation.js';
import { reportRoutes } from './routes/reports.js';
import { fiscalRoutes } from './routes/fiscal.js';
// Core Upgrades
import { branchRoutes } from './routes/branches.js';
import { budgetRoutes } from './routes/budgets.js';
// Contacts, Items, Inventory
import { contactRoutes } from './routes/contacts.js';
import { itemRoutes, inventoryRoutes } from './routes/items.js';
// Sales & AR
import { estimateRoutes, invoiceRoutes, paymentReceivedRoutes, creditNoteRoutes } from './routes/sales.js';
// Purchases & AP
import { purchaseOrderRoutes, billRoutes, expenseRoutes, paymentMadeRoutes, vendorCreditRoutes } from './routes/purchases.js';
// Projects & Timesheets
import { projectRoutes, timesheetRoutes } from './routes/projects.js';
const app = express();
// ─── Middleware ──────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://mizusubeauty.com', 'https://www.mizusubeauty.com', 'https://elevatexnow.com', 'https://www.elevatexnow.com']
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. same-origin, server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(null, true); // Allow all in development-like scenarios
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// ─── Health Check ───────────────────────────────────────────
app.get(['/api/health', '/erpex/api/health'], (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'erpex-api' });
});
// ─── Public Routes (No Auth Required) ───────────────────────
app.use('/api/auth', authRoutes);
app.use('/erpex/api/auth', authRoutes);
// ─── Super Admin Routes (Super Admin Auth Required) ─────────
app.use('/api/super-admin', requireSuperAdmin, superAdminRoutes);
app.use('/erpex/api/super-admin', requireSuperAdmin, superAdminRoutes);
// ─── Company-Scoped Routes (Auth + Company Scope) ───────────
// All routes below require authentication and company context
const companyRouter = express.Router();
companyRouter.use(requireAuth, injectCompanyScope);
// Core Accounting
companyRouter.use('/accounts', accountRoutes);
companyRouter.use('/journals', journalRoutes);
companyRouter.use('/contra', contraRoutes);
companyRouter.use('/cashbook', cashbookRoutes);
companyRouter.use('/daybook', daybookRoutes);
companyRouter.use('/banking', bankingRoutes);
companyRouter.use('/tax', taxationRoutes);
companyRouter.use('/reports', reportRoutes);
companyRouter.use('/fiscal', fiscalRoutes);
// Core Upgrades
companyRouter.use('/branches', branchRoutes);
companyRouter.use('/budgets', budgetRoutes);
// Items & Inventory
companyRouter.use('/contacts', contactRoutes);
companyRouter.use('/items', itemRoutes);
companyRouter.use('/inventory', inventoryRoutes);
// Sales & AR
companyRouter.use('/estimates', estimateRoutes);
companyRouter.use('/invoices', invoiceRoutes);
companyRouter.use('/payments-received', paymentReceivedRoutes);
companyRouter.use('/credit-notes', creditNoteRoutes);
// Purchases & AP
companyRouter.use('/purchase-orders', purchaseOrderRoutes);
companyRouter.use('/bills', billRoutes);
companyRouter.use('/expenses', expenseRoutes);
companyRouter.use('/payments-made', paymentMadeRoutes);
companyRouter.use('/vendor-credits', vendorCreditRoutes);
// Projects & Timesheets
companyRouter.use('/projects', projectRoutes);
companyRouter.use('/timesheets', timesheetRoutes);
app.use('/api', companyRouter);
app.use('/erpex/api', companyRouter);
// ─── Serve Frontend Static Files (Production/Hostinger fallback) ─────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const possiblePaths = [
    path.resolve(__dirname, '../../../packages/frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(process.cwd(), 'packages/frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
];
let frontendDistPath = possiblePaths[0];
for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'index.html'))) {
        frontendDistPath = p;
        break;
    }
}
// Serve static assets for /erpex
app.use('/erpex', express.static(frontendDistPath));
// SPA Routing fallback: any request to /erpex/* that doesn't match a static file serves index.html
app.get(/^\/erpex\/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});
// Redirect / to /erpex/
app.get('/', (req, res) => {
    res.redirect('/erpex/');
});
// ─── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map