// ============================================================
// ERPEX — Item Service
// Product catalog management with account mappings
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const itemInclude = {
  group: { select: { id: true, name: true } },
  purchaseAccount: { select: { id: true, code: true, name: true } },
  salesAccount: { select: { id: true, code: true, name: true } },
  cogsAccount: { select: { id: true, code: true, name: true } },
  inventoryAccount: { select: { id: true, code: true, name: true } },
};

export async function listItems(companyId: string, filters: {
  type?: string; groupId?: string; search?: string; page?: number; pageSize?: number;
}) {
  const where: any = { companyId };
  if (filters.type) where.type = filters.type;
  if (filters.groupId) where.groupId = filters.groupId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { sku: { contains: filters.search } },
      { barcode: { contains: filters.search } },
    ];
  }

  const page = parseInt(String(filters.page || '1'), 10) || 1;
  const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;

  const [data, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  // Enrich with stock data for products
  const enriched = await Promise.all(data.map(async (item) => {
    if (item.type !== 'PRODUCT') {
      return { ...item, stockOnHand: 0, committedStock: 0, availableStock: 0 };
    }
    const movements = await prisma.inventoryMovement.findMany({
      where: { companyId, itemId: item.id },
      select: { type: true, qty: true },
    });
    const totalIn = movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.qty, 0);
    const totalOut = movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.qty, 0);
    const totalAdj = movements.filter(m => m.type === 'ADJUST').reduce((s, m) => s + m.qty, 0);
    const stockOnHand = totalIn - totalOut + totalAdj;

    // Committed = confirmed SO lines not yet fulfilled
    const committed = await prisma.salesOrderLine.aggregate({
      where: { itemId: item.id, salesOrder: { companyId, status: 'CONFIRMED' } },
      _sum: { qty: true },
    });
    const committedStock = committed._sum.qty || 0;

    return { ...item, stockOnHand, committedStock, availableStock: stockOnHand - committedStock };
  }));

  return { data: enriched, total, page, pageSize };
}

export async function getItem(companyId: string, id: string) {
  const item = await prisma.item.findFirst({ where: { id, companyId }, include: itemInclude });
  if (!item) throw new AppError('Item not found', 404);
  return item;
}

export async function createItem(companyId: string, data: any) {
  const existing = await prisma.item.findFirst({ where: { companyId, sku: data.sku } });
  if (existing) throw new AppError(`SKU ${data.sku} already exists`, 400);
  return prisma.item.create({ data: { ...data, companyId }, include: itemInclude });
}

export async function updateItem(companyId: string, id: string, data: any) {
  // Verify ownership
  const existing = await prisma.item.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Item not found', 404);

  return prisma.item.update({ where: { id }, data, include: itemInclude });
}

// ─── Item Groups ────────────────────────────────────────────

export async function listItemGroups(companyId: string) {
  return prisma.itemGroup.findMany({
    include: { children: true },
    where: { companyId, parentId: null },
    orderBy: { name: 'asc' },
  });
}

export async function createItemGroup(companyId: string, data: { name: string; description?: string; parentId?: string }) {
  return prisma.itemGroup.create({ data: { ...data, companyId } });
}

// ─── Price Lists ────────────────────────────────────────────

export async function listPriceLists(companyId: string) {
  return prisma.priceList.findMany({
    where: { companyId },
    include: { items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
    orderBy: { name: 'asc' },
  });
}

export async function createPriceList(companyId: string, data: any) {
  const { items, ...plData } = data;
  return prisma.priceList.create({
    data: { ...plData, companyId, items: items ? { create: items } : undefined },
    include: { items: true },
  });
}

export async function updatePriceList(companyId: string, id: string, data: any) {
  const existing = await prisma.priceList.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Price list not found', 404);

  const { items, ...plData } = data;
  if (items) {
    await prisma.priceListItem.deleteMany({ where: { priceListId: id } });
    await prisma.priceListItem.createMany({
      data: items.map((i: any) => ({ ...i, priceListId: id })),
    });
  }
  return prisma.priceList.update({
    where: { id },
    data: plData,
    include: { items: { include: { item: { select: { id: true, name: true, sku: true } } } } },
  });
}
