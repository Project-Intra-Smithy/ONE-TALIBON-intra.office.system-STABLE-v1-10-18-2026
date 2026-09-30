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

function percentile(values, fraction) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
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

const agents = Array.from({ length: clients }, () => new transport.Agent({ keepAlive: true, maxSockets: 2 }));

// Synchronized burst: every virtual client hits /up and /login concurrently.
await Promise.all(agents.flatMap((agent, index) => [issue(agent, '/up', index + 1), issue(agent, '/login', index + 1)]));

// Independent read-heavy flows. Auth-protected routes are intentionally allowed to redirect to /login.
const followOnPaths = ['/', '/dashboard', '/municipal-systems'];
await Promise.all(agents.map(async (agent, index) => {
  for (const path of followOnPaths) await issue(agent, path, index + 1);
}));

for (const agent of agents) agent.destroy();

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
  p50Ms: Number(percentile(latencies, 0.50).toFixed(1)),
  p95Ms: Number(percentile(latencies, 0.95).toFixed(1)),
  maxMs: Number((latencies.length ? Math.max(...latencies) : 0).toFixed(1)),
};

console.log(JSON.stringify(result, null, 2));
const hardFailure = fivexx > 0 || timeouts > 0 || networkErrors > 0;
const latencyFailure = result.p95Ms >= 3000;
if (hardFailure || latencyFailure) process.exitCode = 1;
