// ============================================================
// ERPEX — User Service
// Company-scoped user management with role assignment
// ============================================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const VALID_ROLES = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'VIEWER'];
async function listUsers(companyId) {
    return prisma.user.findMany({
        where: { companyId },
        select: {
            id: true, name: true, email: true, role: true, phone: true,
            isActive: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function createUser(companyId, data) {
    if (!VALID_ROLES.includes(data.role)) {
        throw new Error(`Invalid role: ${data.role}. Must be one of: ${VALID_ROLES.join(', ')}`);
    }
    // Check email uniqueness within company
    const existing = await prisma.user.findUnique({
        where: { companyId_email: { companyId, email: data.email } },
    });
    if (existing)
        throw new Error('A user with this email already exists in this company');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
        data: {
            companyId,
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            phone: data.phone,
        },
        select: {
            id: true, name: true, email: true, role: true, phone: true,
            isActive: true, createdAt: true,
        },
    });
}
async function updateUser(userId, data) {
    if (data.role && !VALID_ROLES.includes(data.role)) {
        throw new Error(`Invalid role: ${data.role}`);
    }
    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true, name: true, email: true, role: true, phone: true,
            isActive: true, createdAt: true,
        },
    });
}
async function toggleUserStatus(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    if (user.role === 'OWNER')
        throw new Error('Cannot deactivate the company owner');
    return prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
    });
}
async function resetUserPassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
    return { message: 'Password reset successfully' };
}
export const userService = {
    listUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    resetUserPassword,
    VALID_ROLES,
};
//# sourceMappingURL=user.service.js.map