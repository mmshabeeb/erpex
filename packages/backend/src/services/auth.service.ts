// ============================================================
// ERPEX — Auth Service
// JWT authentication for Super Admin and Company Users
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'erpx-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

// ─── Token Types ────────────────────────────────────────────

interface SuperAdminTokenPayload {
  type: 'super_admin';
  id: string;
  email: string;
}

interface UserTokenPayload {
  type: 'user';
  id: string;
  email: string;
  companyId: string;
  companySlug: string;
  role: string;
}

type TokenPayload = SuperAdminTokenPayload | UserTokenPayload;

// ─── Helpers ────────────────────────────────────────────────

function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

function generateRefreshToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Super Admin Bootstrap ──────────────────────────────────

async function bootstrapSuperAdmin() {
  const existing = await prisma.superAdmin.findFirst();
  if (existing) return;

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.superAdmin.create({
    data: {
      name: 'Super Administrator',
      email: 'admin@erpx.com',
      passwordHash,
    },
  });
  console.log('🔐 Super Admin bootstrapped: admin@erpx.com / Admin@123');
}

// ─── Super Admin Login ──────────────────────────────────────

async function superAdminLogin(email: string, password: string) {
  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) throw new Error('Invalid credentials');
  if (!admin.isActive) throw new Error('Account is deactivated');

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  const token = generateToken({ type: 'super_admin', id: admin.id, email: admin.email });

  return {
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      type: 'super_admin' as const,
    },
  };
}

// ─── Company User Login ─────────────────────────────────────

async function companyUserLogin(email: string, password: string, companySlug?: string) {
  // Find users matching this email
  const whereClause: any = { email, isActive: true };
  if (companySlug) {
    whereClause.company = { slug: companySlug, isActive: true };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: { company: true },
  });

  if (users.length === 0) throw new Error('Invalid credentials');

  // If multiple companies, require slug
  if (users.length > 1 && !companySlug) {
    return {
      requireCompanySelection: true,
      companies: users.map(u => ({
        slug: u.company.slug,
        name: u.company.name,
      })),
    };
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({
    type: 'user',
    id: user.id,
    email: user.email,
    companyId: user.companyId,
    companySlug: user.company.slug,
    role: user.role,
  });

  // Create refresh token session
  const refreshToken = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: 'user' as const,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        currency: user.company.currency,
        currencySymbol: user.company.currencySymbol,
        country: user.company.country,
      },
    },
  };
}

// ─── Refresh Token ──────────────────────────────────────────

async function refreshAccessToken(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: { include: { company: true } } },
  });

  if (!session) throw new Error('Invalid refresh token');
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new Error('Refresh token expired');
  }

  const user = session.user;
  const token = generateToken({
    type: 'user',
    id: user.id,
    email: user.email,
    companyId: user.companyId,
    companySlug: user.company.slug,
    role: user.role,
  });

  return { token };
}

// ─── Change Password ────────────────────────────────────────

async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: 'Password changed successfully' };
}

async function changeSuperAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
  const admin = await prisma.superAdmin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error('Super admin not found');

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) throw new Error('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.superAdmin.update({ where: { id: adminId }, data: { passwordHash } });

  return { message: 'Password changed successfully' };
}

// ─── Get Current User Profile ───────────────────────────────

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  });
  if (!user) throw new Error('User not found');

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    type: 'user' as const,
    company: {
      id: user.company.id,
      name: user.company.name,
      slug: user.company.slug,
      currency: user.company.currency,
      currencySymbol: user.company.currencySymbol,
      country: user.company.country,
      gstin: user.company.gstin,
    },
  };
}

async function impersonateCompany(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId, isActive: true },
    include: { users: { where: { isActive: true }, orderBy: { role: 'asc' } } }
  });
  if (!company) throw new Error('Company not found or inactive');
  
  // Find first active user (prefer role ADMIN)
  const user = company.users.find(u => u.role === 'ADMIN') || company.users[0];
  if (!user) throw new Error('No active users found for this company');

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({
    type: 'user',
    id: user.id,
    email: user.email,
    companyId: user.companyId,
    companySlug: company.slug,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: 'user' as const,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
    },
  };
}

export const authService = {
  bootstrapSuperAdmin,
  superAdminLogin,
  companyUserLogin,
  refreshAccessToken,
  changeUserPassword,
  changeSuperAdminPassword,
  getProfile,
  verifyToken,
  impersonateCompany,
};
