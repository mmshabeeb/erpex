// ============================================================
// ERPEX — Auth Middleware
// JWT verification, role checking, company scoping
// ============================================================
import { authService } from '../services/auth.service.js';
function extractToken(req) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.substring(7);
    }
    return null;
}
/**
 * Require any authenticated user (super admin or company user)
 */
export function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const payload = authService.verifyToken(token);
        req.auth = payload;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
/**
 * Require super admin access
 */
export function requireSuperAdmin(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const payload = authService.verifyToken(token);
        if (payload.type !== 'super_admin') {
            res.status(403).json({ error: 'Super admin access required' });
            return;
        }
        req.auth = payload;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
/**
 * Require specific role(s). Must be used after requireAuth.
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.auth) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (req.auth.type === 'super_admin') {
            next(); // Super admins pass all role checks
            return;
        }
        if (!req.auth.role || !roles.includes(req.auth.role)) {
            res.status(403).json({ error: `Insufficient permissions. Required: ${roles.join(' or ')}` });
            return;
        }
        next();
    };
}
/**
 * Inject companyId into request for data scoping.
 * Must be used after requireAuth.
 */
export function injectCompanyScope(req, res, next) {
    if (!req.auth) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (req.auth.type === 'user' && req.auth.companyId) {
        // Inject companyId into query and body for convenience
        req.companyId = req.auth.companyId;
        next();
    }
    else if (req.auth.type === 'super_admin') {
        // Super admin can pass companyId as query param
        req.companyId = req.query.companyId || req.params.companyId;
        next();
    }
    else {
        res.status(403).json({ error: 'No company context' });
    }
}
//# sourceMappingURL=auth.middleware.js.map