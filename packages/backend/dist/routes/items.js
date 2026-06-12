// ============================================================
// ERPEX — Items & Inventory Routes
// ============================================================
import { Router } from 'express';
import * as itemService from '../services/item.service.js';
import * as inventoryService from '../services/inventory.service.js';
export const itemRoutes = Router();
// Items
itemRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await itemService.listItems(req.companyId, req.query)) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.get('/groups', async (req, res, next) => {
    try {
        res.json({ success: true, data: await itemService.listItemGroups(req.companyId) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.post('/groups', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await itemService.createItemGroup(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.get('/price-lists', async (req, res, next) => {
    try {
        res.json({ success: true, data: await itemService.listPriceLists(req.companyId) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.post('/price-lists', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await itemService.createPriceList(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.put('/price-lists/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await itemService.updatePriceList(req.companyId, req.params.id, req.body) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.get('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await itemService.getItem(req.companyId, req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await itemService.createItem(req.companyId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
itemRoutes.put('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await itemService.updateItem(req.companyId, req.params.id, req.body) });
    }
    catch (e) {
        next(e);
    }
});
// Inventory
export const inventoryRoutes = Router();
inventoryRoutes.get('/stock-summary', async (req, res, next) => {
    try {
        res.json({ success: true, data: await inventoryService.getStockSummary(req.companyId) });
    }
    catch (e) {
        next(e);
    }
});
inventoryRoutes.get('/low-stock', async (req, res, next) => {
    try {
        res.json({ success: true, data: await inventoryService.getLowStockAlerts(req.companyId) });
    }
    catch (e) {
        next(e);
    }
});
inventoryRoutes.get('/movements/:itemId', async (req, res, next) => {
    try {
        res.json({ success: true, data: await inventoryService.getItemMovements(req.companyId, req.params.itemId) });
    }
    catch (e) {
        next(e);
    }
});
inventoryRoutes.post('/adjustment', async (req, res, next) => {
    try {
        const { itemId, date, qty, unitCost, reference } = req.body;
        res.json({ success: true, data: await inventoryService.recordAdjustment(req.companyId, { itemId, date: new Date(date), qty, unitCost, reference }) });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=items.js.map