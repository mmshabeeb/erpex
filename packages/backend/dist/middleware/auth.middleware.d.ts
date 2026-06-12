import { Request, Response, NextFunction } from 'express';
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
/**
 * Require any authenticated user (super admin or company user)
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Require super admin access
 */
export declare function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void;
/**
 * Require specific role(s). Must be used after requireAuth.
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Inject companyId into request for data scoping.
 * Must be used after requireAuth.
 */
export declare function injectCompanyScope(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map