// ============================================================
// ERPEX — Branch Service (Scoped)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listBranches(companyId: string) {
  return prisma.branch.findMany({
    where: { companyId },
    orderBy: { code: 'asc' },
  });
}

export async function getBranch(companyId: string, id: string) {
  const branch = await prisma.branch.findFirst({
    where: { id, companyId },
  });
  if (!branch) throw new AppError('Branch not found', 404);
  return branch;
}

export async function createBranch(
  companyId: string,
  data: { name: string; code: string; address?: string; phone?: string }
) {
  const existing = await prisma.branch.findFirst({
    where: { companyId, code: data.code },
  });
  if (existing) throw new AppError(`Branch code "${data.code}" already exists in this company`, 409);

  return prisma.branch.create({
    data: {
      ...data,
      companyId,
    },
  });
}

export async function updateBranch(
  companyId: string,
  id: string,
  data: Partial<{ name: string; address: string; phone: string; isActive: boolean }>
) {
  const existing = await prisma.branch.findFirst({
    where: { id, companyId },
  });
  if (!existing) throw new AppError('Branch not found', 404);

  return prisma.branch.update({
    where: { id },
    data,
  });
}
