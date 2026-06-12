// ============================================================
// ERPEX — Server Entry Point
// Bootstraps super admin & default plans on startup
// ============================================================

import app from './app.js';
import { authService } from './services/auth.service.js';
import { subscriptionService } from './services/subscription.service.js';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  console.log('🚀 ERPEX Server starting...\n');

  // Auto-bootstrap super admin if none exists
  await authService.bootstrapSuperAdmin();

  // Auto-seed default subscription plans
  await subscriptionService.seedDefaultPlans();

  app.listen(PORT, () => {
    console.log(`\n✅ ERPEX API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Auth:   http://localhost:${PORT}/api/auth/login`);
    console.log(`   Admin:  http://localhost:${PORT}/api/super-admin/companies\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
