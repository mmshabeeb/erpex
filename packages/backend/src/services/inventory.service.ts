// ============================================================
// ERPEX — Inventory Service (FIFO Valuation Engine)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Record an inventory IN movement (purchase, return, adjustment)
 */
export async function recordInMovement(companyId: string, data: {
  itemId: string; date: Date; qty: number; unitCost: number;
  reference?: string; sourceType?: string; sourceId?: string;
}) {
  const item = await prisma.item.findFirst({ where: { id: data.itemId, companyId } });
  if (!item || item.type !== 'PRODUCT') throw new AppError('Item is not a stockable product', 400);

  return prisma.inventoryMovement.create({
    data: {
      companyId,
      itemId: data.itemId,
      date: data.date,
      type: 'IN',
      qty: data.qty,
      unitCost: data.unitCost,
      totalCost: data.qty * data.unitCost,
      reference: data.reference,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      remainingQty: data.qty, // Full qty available for FIFO consumption
    },
  });
}

/**
 * Record an inventory OUT movement using FIFO costing.
 * Consumes oldest lots first and returns the weighted COGS.
 */
export async function recordOutMovement(companyId: string, data: {
  itemId: string; date: Date; qty: number;
  reference?: string; sourceType?: string; sourceId?: string;
}): Promise<{ movement: any; cogs: number }> {
  const item = await prisma.item.findFirst({ where: { id: data.itemId, companyId } });
  if (!item || item.type !== 'PRODUCT') throw new AppError('Item is not a stockable product', 400);

  // Get available FIFO lots ordered by date (oldest first)
  const lots = await prisma.inventoryMovement.findMany({
    where: { companyId, itemId: data.itemId, type: 'IN', remainingQty: { gt: 0 } },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const totalAvailable = lots.reduce((s, l) => s + l.remainingQty, 0);
  if (totalAvailable < data.qty) {
    throw new AppError(`Insufficient stock: available ${totalAvailable}, requested ${data.qty}`, 400);
  }

  // Consume from oldest lots
  let remaining = data.qty;
  let cogs = 0;

  for (const lot of lots) {
    if (remaining <= 0) break;
    const consume = Math.min(lot.remainingQty, remaining);
    cogs += consume * lot.unitCost;
    remaining -= consume;

    await prisma.inventoryMovement.update({
      where: { id: lot.id, companyId },
      data: { remainingQty: lot.remainingQty - consume },
    });
  }

  const avgCost = cogs / data.qty;
  const movement = await prisma.inventoryMovement.create({
    data: {
      companyId,
      itemId: data.itemId,
      date: data.date,
      type: 'OUT',
      qty: data.qty,
      unitCost: avgCost,
      totalCost: cogs,
      reference: data.reference,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      remainingQty: 0,
    },
  });

  return { movement, cogs };
}

/**
 * Record an inventory adjustment (positive or negative)
 */
export async function recordAdjustment(companyId: string, data: {
  itemId: string; date: Date; qty: number; unitCost: number;
  reference?: string;
}) {
  const item = await prisma.item.findFirst({ where: { id: data.itemId, companyId } });
  if (!item || item.type !== 'PRODUCT') throw new AppError('Item is not a stockable product', 400);

  return prisma.inventoryMovement.create({
    data: {
      companyId,
      itemId: data.itemId,
      date: data.date,
      type: 'ADJUST',
      qty: data.qty,
      unitCost: data.unitCost,
      totalCost: data.qty * data.unitCost,
      reference: data.reference,
      sourceType: 'ADJUSTMENT',
      remainingQty: data.qty > 0 ? data.qty : 0,
    },
  });
}

/**
 * Get stock summary for all products
 */
export async function getStockSummary(companyId: string) {
  const items = await prisma.item.findMany({
    where: { companyId, type: 'PRODUCT', isActive: true },
    select: { id: true, name: true, sku: true, reorderLevel: true, sellingPrice: true },
  });

  const summaries = await Promise.all(items.map(async (item) => {
    const movements = await prisma.inventoryMovement.findMany({
      where: { companyId, itemId: item.id },
      select: { type: true, qty: true, unitCost: true, totalCost: true },
    });

    const totalIn = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.qty, 0);
    const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.qty, 0);
    const totalAdj = movements.filter(m => m.type === 'ADJUST').reduce((s, m) => s + m.qty, 0);
    const stockOnHand = totalIn - totalOut + totalAdj;

    // FIFO valuation: sum of remaining lots
    const activeLots = await prisma.inventoryMovement.findMany({
      where: { companyId, itemId: item.id, type: 'IN', remainingQty: { gt: 0 } },
      select: { remainingQty: true, unitCost: true },
    });
    const totalValue = activeLots.reduce((s, l) => s + (l.remainingQty * l.unitCost), 0);
    const avgCost = stockOnHand > 0 ? totalValue / stockOnHand : 0;

    // Committed stock from confirmed SOs
    const committed = await prisma.salesOrderLine.aggregate({
      where: { itemId: item.id, salesOrder: { companyId, status: 'CONFIRMED' } },
      _sum: { qty: true },
    });
    const committedStock = committed._sum.qty || 0;

    return {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      stockOnHand,
      committedStock,
      availableStock: stockOnHand - committedStock,
      avgCost: Math.round(avgCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      reorderLevel: item.reorderLevel,
      isLowStock: stockOnHand <= item.reorderLevel,
    };
  }));

  return summaries;
}

/**
 * Get movement history for a specific item
 */
export async function getItemMovements(companyId: string, itemId: string) {
  // Verify ownership
  const item = await prisma.item.findFirst({ where: { id: itemId, companyId } });
  if (!item) throw new AppError('Item not found', 404);

  return prisma.inventoryMovement.findMany({
    where: { companyId, itemId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Get items that are at or below reorder level
 */
export async function getLowStockAlerts(companyId: string) {
  const summaries = await getStockSummary(companyId);
  return summaries.filter(s => s.isLowStock);
}
