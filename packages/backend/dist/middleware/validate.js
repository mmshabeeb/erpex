// ============================================================
// ERPEX — Zod Validation Middleware
// ============================================================
/**
 * Creates middleware that validates request body against a Zod schema.
 */
export function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(result.error);
            return;
        }
        req.body = result.data;
        next();
    };
}
/**
 * Creates middleware that validates request query params against a Zod schema.
 */
export function validateQuery(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(result.error);
            return;
        }
        req.query = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map