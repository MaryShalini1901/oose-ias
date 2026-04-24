const { spawn } = require('node:child_process');

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

async function main() {
  let serverProc = null;
  let startedByScript = false;

  if (!(await isServerUp())) {
    startedByScript = true;
    console.log('[test:load] Backend not running. Starting backend/server.js...');
    serverProc = runNode(['backend/server.js'], () => {});
  } else {
    console.log('[test:load] Reusing already running backend server.');
  }

  const ready = await waitForServer(WAIT_TIMEOUT_MS);
  if (!ready) {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    console.error(
      `[test:load] Server did not become ready at ${BASE_URL}${HEALTH_PATH}. Check MongoDB and backend logs.`
    );
    process.exit(1);
    return;
  }

  console.log('[test:load] Server is ready. Running load test...');
  const loadProc = runNode(['testing/load/basic-load.cjs'], (code) => {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    process.exit(code || 0);
  });

  loadProc.on('error', (err) => {
    if (startedByScript && serverProc && !serverProc.killed) {
      serverProc.kill();
    }
    console.error('[test:load] Failed to run load test:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('[test:load] Unexpected error:', err.message);
  process.exit(1);
});
