// ============================================================
// ERPEX — Items & Inventory Routes
// ============================================================
import { Router } from 'express';
import * as itemService from '../services/item.service.js';
import * as inventoryService from '../services/inventory.service.js';

export const itemRoutes = Router();

// Items
itemRoutes.get('/', async (req, res, next) => {
  try { res.json({ success: true, ...(await itemService.listItems(req.query as any)) }); } catch (e) { next(e); }
});
itemRoutes.get('/groups', async (_req, res, next) => {
  try { res.json({ success: true, data: await itemService.listItemGroups() }); } catch (e) { next(e); }
});
itemRoutes.post('/groups', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createItemGroup(req.body) }); } catch (e) { next(e); }
});
itemRoutes.get('/price-lists', async (_req, res, next) => {
  try { res.json({ success: true, data: await itemService.listPriceLists() }); } catch (e) { next(e); }
});
itemRoutes.post('/price-lists', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createPriceList(req.body) }); } catch (e) { next(e); }
});
itemRoutes.put('/price-lists/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.updatePriceList(req.params.id, req.body) }); } catch (e) { next(e); }
});
itemRoutes.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.getItem(req.params.id) }); } catch (e) { next(e); }
});
itemRoutes.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await itemService.createItem(req.body) }); } catch (e) { next(e); }
});
itemRoutes.put('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await itemService.updateItem(req.params.id, req.body) }); } catch (e) { next(e); }
});

// Inventory
export const inventoryRoutes = Router();

inventoryRoutes.get('/stock-summary', async (_req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getStockSummary() }); } catch (e) { next(e); }
});
inventoryRoutes.get('/low-stock', async (_req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getLowStockAlerts() }); } catch (e) { next(e); }
});
inventoryRoutes.get('/movements/:itemId', async (req, res, next) => {
  try { res.json({ success: true, data: await inventoryService.getItemMovements(req.params.itemId) }); } catch (e) { next(e); }
});
inventoryRoutes.post('/adjustment', async (req, res, next) => {
  try {
    const { itemId, date, qty, unitCost, reference } = req.body;
    res.json({ success: true, data: await inventoryService.recordAdjustment({ itemId, date: new Date(date), qty, unitCost, reference }) });
  } catch (e) { next(e); }
});
