// ============================================================
// ERPEX — Branch Service
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listBranches() {
  return prisma.branch.findMany({ orderBy: { code: 'asc' } });
}

export async function getBranch(id: string) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new AppError('Branch not found', 404);
  return branch;
}

export async function createBranch(data: { name: string; code: string; address?: string; phone?: string }) {
  return prisma.branch.create({ data });
}

export async function updateBranch(id: string, data: Partial<{ name: string; address: string; phone: string; isActive: boolean }>) {
  return prisma.branch.update({ where: { id }, data });
}
