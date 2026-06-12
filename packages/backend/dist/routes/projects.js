// ============================================================
// ERPEX — Project & Timesheet Routes
// ============================================================
import { Router } from 'express';
import * as projectService from '../services/project.service.js';
export const projectRoutes = Router();
export const timesheetRoutes = Router();
// ─── Projects ───────────────────────────────────────────────
projectRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await projectService.listProjects(req.query)) });
    }
    catch (e) {
        next(e);
    }
});
projectRoutes.get('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await projectService.getProject(req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
projectRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await projectService.createProject(req.body) });
    }
    catch (e) {
        next(e);
    }
});
projectRoutes.put('/:id', async (req, res, next) => {
    try {
        res.json({ success: true, data: await projectService.updateProject(req.params.id, req.body) });
    }
    catch (e) {
        next(e);
    }
});
projectRoutes.post('/:id/tasks', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await projectService.addTask(req.params.id, req.body) });
    }
    catch (e) {
        next(e);
    }
});
projectRoutes.put('/tasks/:taskId', async (req, res, next) => {
    try {
        res.json({ success: true, data: await projectService.updateTask(req.params.taskId, req.body) });
    }
    catch (e) {
        next(e);
    }
});
// ─── Timesheets ─────────────────────────────────────────────
timesheetRoutes.get('/', async (req, res, next) => {
    try {
        res.json({ success: true, ...(await projectService.listTimesheets(req.query)) });
    }
    catch (e) {
        next(e);
    }
});
timesheetRoutes.post('/', async (req, res, next) => {
    try {
        res.status(201).json({ success: true, data: await projectService.createTimesheet(req.body) });
    }
    catch (e) {
        next(e);
    }
});
timesheetRoutes.patch('/:id/approve', async (req, res, next) => {
    try {
        res.json({ success: true, data: await projectService.approveTimesheet(req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
timesheetRoutes.patch('/:id/reject', async (req, res, next) => {
    try {
        res.json({ success: true, data: await projectService.rejectTimesheet(req.params.id) });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=projects.js.map