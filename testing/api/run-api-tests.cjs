const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const HEALTH_PATH = '/';
const WAIT_TIMEOUT_MS = Number(process.env.TEST_BOOT_TIMEOUT_MS || 20000);
const WAIT_INTERVAL_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerUp() {
  try {
    const res = await fetch(`${BASE_URL}${HEALTH_PATH}`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await sleep(WAIT_INTERVAL_MS);
  }
  return false;
}

function runNode(args, onExit) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
  });
  child.on('exit', onExit);
  return child;
}

function collectApiTestFiles() {
  const apiDir = path.resolve(process.cwd(), 'testing', 'api');
  if (!fs.existsSync(apiDir)) return [];

  return fs
    .readdirSync(apiDir)
    .filter((name) => name.endsWith('.test.cjs'))
    .sort()
    .map((name) => path.join('testing', 'api', name));
}

async function main() {
  let serverProc = null;
  let startedByScript = false;

  if (!(await isServerUp())) {
    startedByScript = true;
    console.log('[test:api] Backend not running. Starting backend/server.js...');
    serverProc = runNode(['backend/server.js'], () => {});
  } else {
    console.log('[test:api] Reusing already running backend server.');
  }

  const ready = await waitForServer(WAIT_TIMEOUT_MS);
  if (!ready) {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    console.error(
      `[test:api] Server did not become ready at ${BASE_URL}${HEALTH_PATH}. Check MongoDB and backend logs.`
    );
    process.exit(1);
    return;
  }

  console.log('[test:api] Server is ready. Running API tests...');
  const testFiles = collectApiTestFiles();
  if (testFiles.length === 0) {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    console.error('[test:api] No API test files found in testing/api (*.test.cjs).');
    process.exit(1);
    return;
  }

  const testProc = runNode(['--test', ...testFiles], (code) => {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    process.exit(code || 0);
  });

  testProc.on('error', (err) => {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    console.error('[test:api] Failed to run tests:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('[test:api] Unexpected error:', err.message);
  process.exit(1);
});
