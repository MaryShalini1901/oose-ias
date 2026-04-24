const { spawn } = require('node:child_process');

const API_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const UI_BASE_URL = process.env.UI_BASE_URL || 'http://localhost:5500';
const WAIT_TIMEOUT_MS = Number(process.env.TEST_BOOT_TIMEOUT_MS || 30000);
const WAIT_INTERVAL_MS = 500;

const HEADLESS = String(process.env.UI_HEADLESS || 'false').toLowerCase() === 'true';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isUp(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitFor(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return true;
    await sleep(WAIT_INTERVAL_MS);
  }
  return false;
}

function runNode(args, onExit) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });
  child.on('exit', onExit);
  return child;
}

function killIfRunning(proc) {
  if (proc && !proc.killed) proc.kill();
}

async function main() {
  let backendProc = null;
  let frontendProc = null;
  let startedBackend = false;

  if (!(await isUp(`${API_BASE_URL}/`))) {
    startedBackend = true;
    console.log('[test:ui] Backend not running. Starting backend/server.js...');
    backendProc = runNode(['backend/server.js'], () => {});
  } else {
    console.log('[test:ui] Reusing already running backend server.');
  }

  console.log('[test:ui] Starting frontend static server...');
  frontendProc = runNode(['testing/ui/static-server.cjs'], () => {});

  const backendReady = await waitFor(`${API_BASE_URL}/`, WAIT_TIMEOUT_MS);
  const frontendReady = await waitFor(`${UI_BASE_URL}/`, WAIT_TIMEOUT_MS);

  if (!backendReady || !frontendReady) {
    killIfRunning(frontendProc);
    if (startedBackend) killIfRunning(backendProc);
    console.error('[test:ui] Server startup failed. Check backend/frontend logs.');
    process.exit(1);
    return;
  }

  console.log(`[test:ui] Running browser flow (${HEADLESS ? 'headless' : 'headed'})...`);
  const env = {
    ...process.env,
    UI_BASE_URL,
    UI_HEADLESS: HEADLESS ? 'true' : 'false',
  };

  const testProc = spawn(process.execPath, ['--test', 'testing/ui/*.test.cjs'], {
    stdio: 'inherit',
    shell: false,
    env,
  });

  testProc.on('exit', (code) => {
    killIfRunning(frontendProc);
    if (startedBackend) killIfRunning(backendProc);
    process.exit(code || 0);
  });

  testProc.on('error', (err) => {
    killIfRunning(frontendProc);
    if (startedBackend) killIfRunning(backendProc);
    console.error('[test:ui] Failed to run UI test:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('[test:ui] Unexpected error:', err.message);
  process.exit(1);
});
