// ============================================================
// ERPEX — Prisma Client Singleton
// ============================================================

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

if (process.env.NODE_ENV === 'production') {
  const dbDir = "/home/u127271988/domains/mizusubeauty.com/db";
  const dbFile = path.join(dbDir, "erpex.db");
  
  process.env.DATABASE_URL = `file:${dbFile}`;
  
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      fs.chmodSync(dbDir, 0o755);
      console.log(`📁 Created persistent DB directory: ${dbDir}`);
    }
    
    let dbExists = false;
    if (fs.existsSync(dbFile)) {
      const stats = fs.statSync(dbFile);
      if (stats.size > 0) {
        dbExists = true;
      }
    }
    
    if (!dbExists) {
      console.log("⚙️ SQLite database file is missing or empty. Initializing...");
      
      try {
        execSync("chmod -R +x node_modules/@prisma/engines node_modules/.bin");
        console.log("🔓 Restored execute permissions to Prisma engines.");
      } catch (chmodErr) {
        console.warn("⚠️ Failed to chmod engines:", chmodErr);
      }
      
      const prismaCli = path.join(process.cwd(), "node_modules/prisma/build/index.js");
      const schema = path.join(process.cwd(), "packages/backend/prisma/schema.prisma");
      
      console.log(`Running db push using schema: ${schema}`);
      execSync(`node "${prismaCli}" db push --schema="${schema}"`, {
        env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
        stdio: 'inherit'
      });
      console.log("✅ Database initialized successfully via auto-bootstrap!");
    }
  } catch (err) {
    console.error("❌ Error during database auto-bootstrap:", err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
