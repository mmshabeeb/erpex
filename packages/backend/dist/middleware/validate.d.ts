import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Creates middleware that validates request body against a Zod schema.
 */
export declare function validateBody(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Creates middleware that validates request query params against a Zod schema.
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map