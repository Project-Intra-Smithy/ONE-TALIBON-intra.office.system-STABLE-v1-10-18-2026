import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

const baseUrl = new URL(readArg('--url', 'http://127.0.0.1:18000'));
const clients = Number(readArg('--clients', '30'));
const timeoutMs = Number(readArg('--timeout-ms', '10000'));
const cookie = readArg('--cookie', '');
if (!Number.isInteger(clients) || clients < 1 || clients > 500) throw new Error('Invalid --clients value.');

const transport = baseUrl.protocol === 'https:' ? https : http;
const metrics = [];
const runtimeStatePath = new URL('../storage/framework/showcase-runtime.json', import.meta.url);

function percentile(values, fraction) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

function readRuntimeState() {
  try {
    return JSON.parse(fs.readFileSync(runtimeStatePath, 'utf8'));
  } catch (error) {
    throw new Error(`Showcase runtime state is required before load testing: ${error.message}`);
  }
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function issue(agent, path, clientId) {
  return new Promise((resolve) => {
    const started = performance.now();
    let timedOut = false;
    const headers = { 'user-agent': `one-talibon-showcase-load/client-${clientId}`, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' };
    if (cookie) headers.cookie = cookie;
    const request = transport.request({
      protocol: baseUrl.protocol,
      hostname: baseUrl.hostname,
      port: baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
      method: 'GET',
      path,
      agent,
      headers,
    }, (response) => {
      response.resume();
      response.on('end', () => {
        const latency = performance.now() - started;
        metrics.push({ path, status: response.statusCode || 0, latency, timeout: false, networkError: false });
        resolve();
      });
    });
    request.setTimeout(timeoutMs, () => {
      timedOut = true;
      request.destroy(new Error('request timeout'));
    });
    request.on('error', () => {
      const latency = performance.now() - started;
      metrics.push({ path, status: 0, latency, timeout: timedOut, networkError: !timedOut });
      resolve();
    });
    request.end();
  });
}

function probeLocalPort(port, timeout = 2000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = http.request({ host: '127.0.0.1', port, method: 'GET', path: '/up', headers: { connection: 'close' } }, (response) => {
      response.resume();
      response.on('end', () => finish(response.statusCode >= 200 && response.statusCode < 400));
    });
    request.setTimeout(timeout, () => request.destroy(new Error('probe timeout')));
    request.on('error', () => finish(false));
    request.end();
  });
}

const runtime = readRuntimeState();
const proxyPid = Number(runtime.proxyPid);
const workerRecords = Array.isArray(runtime.workers) ? runtime.workers.map((worker) => ({ pid: Number(worker.pid), port: Number(worker.port) })) : [];
if (!processAlive(proxyPid) || workerRecords.length === 0 || workerRecords.some((worker) => !processAlive(worker.pid))) {
  throw new Error('Recorded showcase proxy/workers are not all alive before load testing.');
}

const agents = Array.from({ length: clients }, () => new transport.Agent({ keepAlive: true, maxSockets: 2 }));

// Synchronized burst: every virtual client hits health and login concurrently.
await Promise.all(agents.flatMap((agent, index) => [issue(agent, '/up', index + 1), issue(agent, '/login', index + 1)]));

// Independent light-user flows. Auth-protected routes may redirect to /login.
const followOnPaths = ['/', '/dashboard', '/transactions/create'];
await Promise.all(agents.map(async (agent, index) => {
  for (const path of followOnPaths) await issue(agent, path, index + 1);
}));

for (const agent of agents) agent.destroy();

const workerHealth = await Promise.all(workerRecords.map(async (worker) => ({
  ...worker,
  alive: processAlive(worker.pid),
  healthy: await probeLocalPort(worker.port),
})));
const proxyAlive = processAlive(proxyPid);
const proxyHealthy = await probeLocalPort(Number(runtime.proxyPort));
const workerCrashes = workerHealth.filter((worker) => !worker.alive || !worker.healthy).length;
const proxyCrashes = !proxyAlive || !proxyHealthy ? 1 : 0;

const latencies = metrics.filter((item) => !item.timeout && !item.networkError).map((item) => item.latency);
const total = metrics.length;
const successes = metrics.filter((item) => item.status >= 200 && item.status < 400).length;
const fourxx = metrics.filter((item) => item.status >= 400 && item.status < 500).length;
const fivexx = metrics.filter((item) => item.status >= 500 && item.status < 600).length;
const timeouts = metrics.filter((item) => item.timeout).length;
const networkErrors = metrics.filter((item) => item.networkError).length;
const result = {
  url: baseUrl.origin,
  clients,
  requests: total,
  successes,
  '4xx': fourxx,
  '5xx': fivexx,
  timeouts,
  networkErrors,
  workerCrashes,
  proxyCrashes,
  p50Ms: Number(percentile(latencies, 0.50).toFixed(1)),
  p95Ms: Number(percentile(latencies, 0.95).toFixed(1)),
  maxMs: Number((latencies.length ? Math.max(...latencies) : 0).toFixed(1)),
};
result.preferredP95Pass = result.p95Ms < 1500;
result.hardP95Pass = result.p95Ms < 3000;

console.log(JSON.stringify(result, null, 2));
const hardFailure = fivexx > 0 || timeouts > 0 || networkErrors > 0 || workerCrashes > 0 || proxyCrashes > 0;
if (hardFailure || !result.hardP95Pass) process.exitCode = 1;
