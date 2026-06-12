import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hostingerRoot = '/home/u127271988/domains/mizusubeauty.com';
function loadEnv() {
    const possiblePaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), 'packages/backend/.env'),
        path.resolve(__dirname, '../.env'),
        path.resolve(__dirname, '../../.env'),
        '/home/u127271988/domains/mizusubeauty.com/nodejs/packages/backend/.env',
        '/home/u127271988/domains/mizusubeauty.com/nodejs/.env'
    ];
    for (const envPath of possiblePaths) {
        if (fs.existsSync(envPath)) {
            console.log(`[ENV] Loading environment variables from: ${envPath}`);
            try {
                const content = fs.readFileSync(envPath, 'utf8');
                for (const line of content.split('\n')) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            const key = trimmed.substring(0, eqIdx).trim();
                            let val = trimmed.substring(eqIdx + 1).trim();
                            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.slice(1, -1);
                            }
                            // Shell-provided values take precedence over values from .env.
                            if (!process.env[key]) {
                                process.env[key] = val;
                            }
                        }
                    }
                }
                break;
            }
            catch (err) {
                console.error(`[ENV] Failed to read env file: ${envPath}`, err);
            }
        }
    }
}
loadEnv();
// Hostinger Shared Hosting uses a persistent database outside the application directory.
if (fs.existsSync(hostingerRoot)) {
    process.env.DATABASE_URL = `file:${hostingerRoot}/db/erpex.db`;
    console.log('[ENV] Hostinger environment detected. Using persistent database path.');
    const legacyDiagnosticsPath = path.join(hostingerRoot, 'public_html/cmd.php');
    if (fs.existsSync(legacyDiagnosticsPath)) {
        try {
            fs.unlinkSync(legacyDiagnosticsPath);
            console.log('[ENV] Removed legacy public diagnostics endpoint.');
        }
        catch (err) {
            console.error('[ENV] Failed to remove legacy public diagnostics endpoint:', err);
        }
    }
}
process.env.PRISMA_QUERY_ENGINE_LIBRARY_THREAD_LIMIT = '1';
process.env.PRISMA_QUERY_ENGINE_BINARY_THREAD_LIMIT = '1';
//# sourceMappingURL=loadenv.js.map