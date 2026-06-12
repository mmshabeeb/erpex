// ============================================================
// ERPEX — Auth Middleware
// JWT verification, role checking, company scoping
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: {
        type: 'super_admin' | 'user';
        id: string;
        email: string;
        companyId?: string;
        companySlug?: string;
        role?: string;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return null;
}

/**
 * Require any authenticated user (super admin or company user)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    req.auth = payload as any;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require super admin access
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
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
    req.auth = payload as any;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require specific role(s). Must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
export function injectCompanyScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.auth.type === 'user' && req.auth.companyId) {
    // Inject companyId into query and body for convenience
    (req as any).companyId = req.auth.companyId;
    next();
  } else if (req.auth.type === 'super_admin') {
    // Super admin can pass companyId as query param
    (req as any).companyId = req.query.companyId || req.params.companyId;
    next();
  } else {
    res.status(403).json({ error: 'No company context' });
  }
}
