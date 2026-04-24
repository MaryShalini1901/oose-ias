const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const TOTAL_REQUESTS = Number(process.env.LOAD_REQUESTS || 60);
const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY || 10);

async function hitHealth() {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/`);
    const ms = Date.now() - start;
    return { ok: res.ok, status: res.status, ms };
  } catch (err) {
    const ms = Date.now() - start;
    return { ok: false, status: 0, ms, error: String(err.message || err) };
  }
}

async function runLoad() {
  const jobs = [];
  for (let i = 0; i < TOTAL_REQUESTS; i += 1) {
    jobs.push(hitHealth());
  }

  const results = [];
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const slice = jobs.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(slice);
    results.push(...settled);
  }

  const total = results.length;
  const pass = results.filter((r) => r.ok).length;
  const fail = total - pass;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || 0;

  console.log('=== Basic Load Report ===');
  console.log(`Target          : ${BASE_URL}/`);
  console.log(`Requests        : ${total}`);
  console.log(`Concurrency     : ${CONCURRENCY}`);
  console.log(`Pass            : ${pass}`);
  console.log(`Fail            : ${fail}`);
  console.log(`Latency p50(ms) : ${p50}`);
  console.log(`Latency p95(ms) : ${p95}`);

  if (fail > 0) {
    const firstFail = results.find((r) => !r.ok);
    console.log('Sample failure  :', firstFail);
    process.exitCode = 1;
  }
}

runLoad();
