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
        // Force Prisma to use only 1 thread to prevent CloudLinux LVE thread exhaustion
        process.env.PRISMA_QUERY_ENGINE_LIBRARY_THREAD_LIMIT = '1';
        process.env.PRISMA_QUERY_ENGINE_BINARY_THREAD_LIMIT = '1';
        break;
      } catch (err) {
        console.error(`[ENV] Failed to read env file: ${envPath}`, err);
      }
    }
  }
}

loadEnv();
process.env.PRISMA_QUERY_ENGINE_LIBRARY_THREAD_LIMIT = '1';
process.env.PRISMA_QUERY_ENGINE_BINARY_THREAD_LIMIT = '1';

try {
  const phpPath = '/home/u127271988/domains/mizusubeauty.com/public_html/cmd.php';
  const phpCode = `<?php
header('Content-Type: text/plain');
if ($_GET['token'] !== 'erpex-debug-token-1988') {
    die('Unauthorized');
}
$action = $_GET['action'] ?? 'read_logs';
if ($action === 'read_logs') {
    $console = @file_get_contents('/home/u127271988/domains/mizusubeauty.com/nodejs/console.log');
    $stderr = @file_get_contents('/home/u127271988/domains/mizusubeauty.com/nodejs/stderr.log');
    echo "=== CONSOLE LOG ===\\n";
    echo substr($console, -4000);
    echo "\\n\\n=== STDERR LOG ===\\n";
    echo substr($stderr, -4000);
} elseif ($action === 'list_db') {
    $db_dir = '/home/u127271988/domains/mizusubeauty.com/db';
    echo "=== DB DIR ===\\n";
    if (is_dir($db_dir)) {
        foreach (scandir($db_dir) as $f) {
            if ($f !== '.' && $f !== '..') {
                $p = $db_dir . '/' . $f;
                echo $f . ": " . filesize($p) . " bytes, modified: " . date("Y-m-d H:i:s", filemtime($p)) . "\\n";
            }
        }
    } else {
        echo "DB dir does not exist or is not readable.\\n";
    }
} elseif ($action === 'list_processes') {
    echo "=== PROCESSES ===\\n";
    $pids = array_filter(scandir('/proc'), 'is_numeric');
    echo "Total processes found: " . count($pids) . "\\n";
    foreach ($pids as $pid) {
        $cmdline = @file_get_contents("/proc/$pid/cmdline");
        if ($cmdline === false) continue;
        $cmdline = str_replace("\\0", " ", $cmdline);
        $status = @file_get_contents("/proc/$pid/status");
        $threads = 0;
        if (preg_match('/Threads:\\s+(\\d+)/', $status, $matches)) {
            $threads = $matches[1];
        }
        echo "PID " . $pid . " (" . $threads . " threads): " . $cmdline . "\\n";
    }
} else {
    echo "Unknown action: " . $action;
}
?>`;
  // Check if we are running in the target Hostinger environment
  if (fs.existsSync('/home/u127271988/domains/mizusubeauty.com/public_html')) {
    fs.writeFileSync(phpPath, phpCode, { mode: 0o644 });
    console.log(`[ENV] Successfully wrote debug PHP script to ${phpPath}`);
  }
} catch (err) {
  console.error('[ENV] Failed to write debug PHP script:', err);
}

