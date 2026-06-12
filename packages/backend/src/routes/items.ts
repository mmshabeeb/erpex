// ============================================================
// ERPEX — Items & Inventory Routes
// ============================================================
import { Router } from 'express';
import * as itemService from '../services/item.service.js';
import * as inventoryService from '../services/inventory.service.js';

export const itemRoutes = Router();

// Items
itemRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await itemService.listItems((req as any).companyId, req.query as any)) }); } catch (e) { next(e); }
});
itemRoutes.get('/groups', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.listItemGroups((req as any).companyId) }); } catch (e) { next(e); }
});
itemRoutes.post('/groups', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createItemGroup((req as any).companyId, req.body) }); } catch (e) { next(e); }
});
itemRoutes.get('/price-lists', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.listPriceLists((req as any).companyId) }); } catch (e) { next(e); }
});
itemRoutes.post('/price-lists', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createPriceList((req as any).companyId, req.body) }); } catch (e) { next(e); }
});
itemRoutes.put('/price-lists/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.updatePriceList((req as any).companyId, req.params.id, req.body) }); } catch (e) { next(e); }
});
itemRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.getItem((req as any).companyId, req.params.id) }); } catch (e) { next(e); }
});
itemRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createItem((req as any).companyId, req.body) }); } catch (e) { next(e); }
});
itemRoutes.put('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.updateItem((req as any).companyId, req.params.id, req.body) }); } catch (e) { next(e); }
});

// Inventory
export const inventoryRoutes = Router();

inventoryRoutes.get('/stock-summary', async (req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getStockSummary((req as any).companyId) }); } catch (e) { next(e); }
});
inventoryRoutes.get('/low-stock', async (req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getLowStockAlerts((req as any).companyId) }); } catch (e) { next(e); }
});
inventoryRoutes.get('/movements/:itemId', async (req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getItemMovements((req as any).companyId, req.params.itemId) }); } catch (e) { next(e); }
});
inventoryRoutes.post('/adjustment', async (req, res, next) => {
  try {
    const { itemId, date, qty, unitCost, reference } = req.body;
    res.json({ success: true, data: await inventoryService.recordAdjustment((req as any).companyId, { itemId, date: new Date(date), qty, unitCost, reference }) });
  } catch (e) { next(e); }
});
