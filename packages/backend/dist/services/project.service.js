// ============================================================
// ERPEX — Project & Timesheet Service
// ============================================================
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
const projectInclude = {
    contact: { select: { id: true, name: true, companyName: true } },
    tasks: { orderBy: { sortOrder: 'asc' } },
};
export async function listProjects(filters) {
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.contactId)
        where.contactId = filters.contactId;
    if (filters.search) {
        where.OR = [{ name: { contains: filters.search } }];
    }
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '20'), 10) || 20;
    const [data, total] = await Promise.all([
        prisma.project.findMany({
            where, include: projectInclude, orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize, take: pageSize,
        }),
        prisma.project.count({ where }),
    ]);
    // Enrich with hour totals
    const enriched = await Promise.all(data.map(async (p) => {
        const timesheets = await prisma.timesheet.findMany({
            where: { projectId: p.id, approvalStatus: 'APPROVED' },
            select: { hours: true, isBillable: true, totalAmount: true },
        });
        const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
        const billableHours = timesheets.filter(t => t.isBillable).reduce((s, t) => s + t.hours, 0);
        const totalCost = timesheets.reduce((s, t) => s + t.totalAmount, 0);
        const profitMargin = p.budget > 0 ? ((p.budget - totalCost) / p.budget) * 100 : 0;
        return { ...p, totalHours, billableHours, profitMargin: Math.round(profitMargin * 100) / 100 };
    }));
    return { data: enriched, total, page, pageSize };
}
export async function getProject(id) {
    const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
    if (!project)
        throw new AppError('Project not found', 404);
    return project;
}
export async function createProject(data) {
    const { tasks, ...projectData } = data;
    return prisma.project.create({
        data: {
            ...projectData,
            startDate: projectData.startDate ? new Date(projectData.startDate) : null,
            endDate: projectData.endDate ? new Date(projectData.endDate) : null,
            tasks: tasks ? { create: tasks.map((t, i) => ({ ...t, sortOrder: t.sortOrder ?? i })) } : undefined,
        },
        include: projectInclude,
    });
}
export async function updateProject(id, data) {
    return prisma.project.update({ where: { id }, data, include: projectInclude });
}
export async function addTask(projectId, data) {
    return prisma.projectTask.create({ data: { ...data, projectId } });
}
export async function updateTask(taskId, data) {
    return prisma.projectTask.update({ where: { id: taskId }, data });
}
// ─── Timesheets ─────────────────────────────────────────────
export async function listTimesheets(filters) {
    const where = {};
    if (filters.projectId)
        where.projectId = filters.projectId;
    if (filters.userId)
        where.userId = filters.userId;
    if (filters.approvalStatus)
        where.approvalStatus = filters.approvalStatus;
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate)
            where.date.gte = new Date(filters.startDate);
        if (filters.endDate)
            where.date.lte = new Date(filters.endDate);
    }
    const page = parseInt(String(filters.page || '1'), 10) || 1;
    const pageSize = parseInt(String(filters.pageSize || '50'), 10) || 50;
    const [data, total] = await Promise.all([
        prisma.timesheet.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' },
            skip: (page - 1) * pageSize, take: pageSize,
        }),
        prisma.timesheet.count({ where }),
    ]);
    return { data, total, page, pageSize };
}
export async function createTimesheet(data) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project)
        throw new AppError('Project not found', 404);
    let hourlyRate = data.hourlyRate || 0;
    if (!hourlyRate && data.taskId) {
        const task = await prisma.projectTask.findUnique({ where: { id: data.taskId } });
        if (task)
            hourlyRate = task.hourlyRate;
    }
    const totalAmount = data.hours * hourlyRate;
    const ts = await prisma.timesheet.create({
        data: {
            ...data,
            date: new Date(data.date),
            hourlyRate,
            totalAmount,
            isBillable: data.isBillable ?? true,
        },
    });
    // Update task logged hours
    if (data.taskId) {
        await prisma.projectTask.update({
            where: { id: data.taskId },
            data: { loggedHours: { increment: data.hours } },
        });
    }
    return ts;
}
export async function approveTimesheet(id) {
    return prisma.timesheet.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
}
export async function rejectTimesheet(id) {
    return prisma.timesheet.update({ where: { id }, data: { approvalStatus: 'REJECTED' } });
}
//# sourceMappingURL=project.service.js.map