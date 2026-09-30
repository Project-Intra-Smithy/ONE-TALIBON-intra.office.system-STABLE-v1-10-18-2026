import http from 'node:http';

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback;
}

const host = readArg('--host', '0.0.0.0');
const port = Number(readArg('--port', '18000'));
const workerPorts = String(readArg('--workers', '18101,18102,18103,18104'))
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0 && value <= 65535);
const upstreamTimeoutMs = Number(readArg('--timeout-ms', '15000'));
const probeIntervalMs = Number(readArg('--probe-ms', '3000'));
const probeTimeoutMs = Number(readArg('--probe-timeout-ms', '1500'));

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port.');
if (workerPorts.length === 0) throw new Error('At least one worker port is required.');

const workers = workerPorts.map((workerPort) => ({ port: workerPort, healthy: true, failures: 0 }));
let roundRobinCursor = 0;
let shuttingDown = false;
const sockets = new Set();

function log(message) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

function stripHopByHopHeaders(headers) {
  const result = { ...headers };
  for (const name of [
    'connection',
    'proxy-connection',
    'keep-alive',
    'transfer-encoding',
    'upgrade',
    'te',
    'trailer',
    'proxy-authenticate',
    'proxy-authorization',
  ]) delete result[name];
  return result;
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== 'string') return '';
  return value.split(',', 1)[0].trim();
}

function forwardedProtocol(request) {
  const supplied = firstHeaderValue(request.headers['x-forwarded-proto']).toLowerCase();
  if (supplied === 'http' || supplied === 'https') return supplied;
  return request.socket.encrypted ? 'https' : 'http';
}

function healthyWorkers() {
  return workers.filter((worker) => worker.healthy);
}

function chooseWorker() {
  const healthy = healthyWorkers();
  if (healthy.length === 0) return null;
  const worker = healthy[roundRobinCursor % healthy.length];
  roundRobinCursor = (roundRobinCursor + 1) % Number.MAX_SAFE_INTEGER;
  return worker;
}

function markWorker(worker, healthy, reason = '') {
  if (worker.healthy === healthy) return;
  worker.healthy = healthy;
  if (!healthy) worker.failures += 1;
  log(`worker ${worker.port} ${healthy ? 'recovered' : 'failed'}${reason ? `: ${reason}` : ''}`);
}

function probeWorker(worker) {
  return new Promise((resolve) => {
    const request = http.request({
      host: '127.0.0.1',
      port: worker.port,
      method: 'GET',
      path: '/up',
      headers: { host: `127.0.0.1:${worker.port}`, connection: 'close' },
    }, (response) => {
      response.resume();
      const ok = response.statusCode >= 200 && response.statusCode < 400;
      markWorker(worker, ok, ok ? '' : `health status ${response.statusCode}`);
      resolve(ok);
    });
    request.setTimeout(probeTimeoutMs, () => request.destroy(new Error('health timeout')));
    request.on('error', (error) => {
      markWorker(worker, false, error.message);
      resolve(false);
    });
    request.end();
  });
}

async function probeAll() {
  await Promise.all(workers.map((worker) => probeWorker(worker)));
}

function sendText(response, statusCode, message) {
  if (response.headersSent) return;
  response.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  response.end(`${message}\n`);
}

const server = http.createServer((request, response) => {
  const worker = chooseWorker();
  if (!worker) {
    sendText(response, 502, 'No healthy showcase worker is available.');
    return;
  }

  const headers = stripHopByHopHeaders(request.headers);
  const remoteAddress = request.socket.remoteAddress || '';
  const rawForwardedFor = request.headers['x-forwarded-for'];
  const priorForwardedFor = Array.isArray(rawForwardedFor) ? rawForwardedFor.join(', ') : (typeof rawForwardedFor === 'string' ? rawForwardedFor.trim() : '');
  const protocol = forwardedProtocol(request);
  const priorForwardedHost = firstHeaderValue(request.headers['x-forwarded-host']);
  const requestHost = firstHeaderValue(request.headers.host) || `${host}:${port}`;
  headers['x-forwarded-for'] = priorForwardedFor ? `${priorForwardedFor}, ${remoteAddress}` : remoteAddress;
  headers['x-forwarded-proto'] = protocol;
  headers['x-forwarded-host'] = priorForwardedHost || requestHost;
  if (!headers['x-forwarded-port']) headers['x-forwarded-port'] = protocol === 'https' ? '443' : String(port);
  headers.host = requestHost;

  let timedOut = false;
  const upstream = http.request({
    host: '127.0.0.1',
    port: worker.port,
    method: request.method,
    path: request.url,
    headers,
  }, (upstreamResponse) => {
    markWorker(worker, true);
    const responseHeaders = stripHopByHopHeaders(upstreamResponse.headers);
    response.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
    upstreamResponse.pipe(response);
  });

  upstream.setTimeout(upstreamTimeoutMs, () => {
    timedOut = true;
    upstream.destroy(new Error('upstream request timeout'));
  });

  upstream.on('error', (error) => {
    markWorker(worker, false, error.message);
    void probeWorker(worker);
    if (!response.headersSent) {
      if (timedOut) sendText(response, 504, 'Showcase worker timed out.');
      else if (healthyWorkers().length === 0) sendText(response, 502, 'No healthy showcase worker is available.');
      else sendText(response, 503, 'Selected showcase worker became unavailable.');
    } else {
      response.destroy(error);
    }
  });

  request.on('aborted', () => upstream.destroy());
  request.on('error', () => upstream.destroy());
  request.pipe(upstream);
});

server.requestTimeout = Math.max(upstreamTimeoutMs + 5000, 20000);
server.headersTimeout = Math.max(server.requestTimeout + 5000, 25000);
server.keepAliveTimeout = 5000;
server.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});
server.on('clientError', (error, socket) => {
  log(`client error: ${error.message}`);
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
});

const probeTimer = setInterval(() => { void probeAll(); }, probeIntervalMs);
probeTimer.unref();

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`received ${signal}; shutting down`);
  clearInterval(probeTimer);
  server.close(() => process.exit(0));
  setTimeout(() => {
    for (const socket of sockets) socket.destroy();
    process.exit(0);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  log(`uncaught exception: ${error.stack || error.message}`);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  log(`unhandled rejection: ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`);
});

await probeAll();
server.listen(port, host, () => {
  log(`showcase proxy listening on http://${host}:${port}; workers=${workerPorts.join(',')}`);
});
