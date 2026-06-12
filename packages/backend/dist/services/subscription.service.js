// ============================================================
// ERPEX — Subscription Service
// Plan management (Free, Professional, Enterprise)
// ============================================================
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// ─── Seed Default Plans ─────────────────────────────────────
async function seedDefaultPlans() {
    const existing = await prisma.subscriptionPlan.findFirst();
    if (existing)
        return;
    const plans = [
        {
            name: 'FREE',
            displayName: 'Free Starter',
            maxUsers: 2,
            maxBranches: 1,
            maxItems: 50,
            monthlyPrice: 0,
            yearlyPrice: 0,
            features: JSON.stringify({
                invoicing: true, billing: true, expenses: true, reports: true,
                projects: false, banking: false, automation: false, multiCurrency: false,
            }),
        },
        {
            name: 'PROFESSIONAL',
            displayName: 'Professional',
            maxUsers: 10,
            maxBranches: 3,
            maxItems: 5000,
            monthlyPrice: 999,
            yearlyPrice: 9990,
            features: JSON.stringify({
                invoicing: true, billing: true, expenses: true, reports: true,
                projects: true, banking: true, automation: false, multiCurrency: true,
            }),
        },
        {
            name: 'ENTERPRISE',
            displayName: 'Enterprise',
            maxUsers: 100,
            maxBranches: 50,
            maxItems: 999999,
            monthlyPrice: 4999,
            yearlyPrice: 49990,
            features: JSON.stringify({
                invoicing: true, billing: true, expenses: true, reports: true,
                projects: true, banking: true, automation: true, multiCurrency: true,
            }),
        },
    ];
    for (const plan of plans) {
        await prisma.subscriptionPlan.create({ data: plan });
    }
    console.log('📦 Default subscription plans seeded');
}
// ─── CRUD ───────────────────────────────────────────────────
async function listPlans() {
    return prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { monthlyPrice: 'asc' },
    });
}
async function assignPlan(companyId, planId) {
    // Deactivate existing subscriptions
    await prisma.companySubscription.updateMany({
        where: { companyId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
    });
    return prisma.companySubscription.create({
        data: {
            companyId,
            planId,
            startDate: new Date(),
            status: 'ACTIVE',
        },
        include: { plan: true },
    });
}
async function getCompanySubscription(companyId) {
    return prisma.companySubscription.findFirst({
        where: { companyId, status: 'ACTIVE' },
        include: { plan: true },
    });
}
export const subscriptionService = {
    seedDefaultPlans,
    listPlans,
    assignPlan,
    getCompanySubscription,
};
//# sourceMappingURL=subscription.service.js.map