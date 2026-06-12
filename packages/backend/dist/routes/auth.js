// ============================================================
// ERPEX — Auth Routes
// Login, refresh, profile endpoints
// ============================================================
import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
// POST /api/auth/super-admin/login
router.post('/super-admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = await authService.superAdminLogin(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
// POST /api/auth/login (company user)
router.post('/login', async (req, res) => {
    try {
        const { email, password, companySlug } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = await authService.companyUserLogin(email, password, companySlug);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }
        const result = await authService.refreshAccessToken(refreshToken);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
});
// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        if (req.auth.type === 'super_admin') {
            res.json({
                id: req.auth.id,
                email: req.auth.email,
                type: 'super_admin',
                name: 'Super Administrator',
            });
            return;
        }
        const profile = await authService.getProfile(req.auth.id);
        res.json(profile);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current and new passwords are required' });
            return;
        }
        const result = await authService.changeUserPassword(req.auth.id, currentPassword, newPassword);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
export const authRoutes = router;
//# sourceMappingURL=auth.js.map