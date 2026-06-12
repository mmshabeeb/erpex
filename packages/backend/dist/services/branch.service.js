// ============================================================
// ERPEX — Branch Service (Scoped)
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
export async function listBranches(companyId) {
    return prisma.branch.findMany({
        where: { companyId },
        orderBy: { code: 'asc' },
    });
}
export async function getBranch(companyId, id) {
    const branch = await prisma.branch.findFirst({
        where: { id, companyId },
    });
    if (!branch)
        throw new AppError('Branch not found', 404);
    return branch;
}
export async function createBranch(companyId, data) {
    const existing = await prisma.branch.findFirst({
        where: { companyId, code: data.code },
    });
    if (existing)
        throw new AppError(`Branch code "${data.code}" already exists in this company`, 409);
    return prisma.branch.create({
        data: {
            ...data,
            companyId,
        },
    });
}
export async function updateBranch(companyId, id, data) {
    const existing = await prisma.branch.findFirst({
        where: { id, companyId },
    });
    if (!existing)
        throw new AppError('Branch not found', 404);
    return prisma.branch.update({
        where: { id },
        data,
    });
}
//# sourceMappingURL=branch.service.js.map