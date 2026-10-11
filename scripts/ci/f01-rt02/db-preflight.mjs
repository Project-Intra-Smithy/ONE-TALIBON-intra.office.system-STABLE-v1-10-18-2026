// RT02-001 destructive-operation preflight. Never run migrate:fresh unless this succeeds.
// This checks a GitHub-hosted disposable VM and an exclusive PostgreSQL service instance.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function hold(reason) { throw new Error('RT02 DB SAFETY HOLD: ' + reason); }
const backend = path.resolve(process.argv[2] || '');
const required = {
  GITHUB_REPOSITORY: 'Project-Intra-Smithy/Talibon-Sales-Prototype',
  RUNNER_ENVIRONMENT: 'github-hosted',
  RUNNER_OS: 'Linux',
  DB_CONNECTION: 'pgsql',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_DATABASE: 'talibon_portal_test',
  DB_USERNAME: 'postgres',
};
for (const [key, value] of Object.entries(required)) {
  if (process.env[key] !== value) hold('expected ' + key + '=' + value);
}
if (process.env.APP_ENV !== 'local') hold('browser environment must be local to enforce CSRF (PHPUnit overrides to testing)');
if (!process.env.DB_PASSWORD || !process.env.PROTOTYPE_DEMO_PASSWORD) hold('ephemeral DB and demo credentials required');
const xml = fs.readFileSync(path.join(backend, 'phpunit.xml'), 'utf8');
for (const [name, value] of Object.entries({
  DB_CONNECTION: 'pgsql', DB_HOST: '127.0.0.1', DB_PORT: '5432',
  DB_DATABASE: 'talibon_portal_test', DB_USERNAME: 'postgres',
})) {
  // This test fixture must have the exact frozen forced PHPUnit target.
  const expected = '<env name="' + name + '" value="' + value + '" force="true"/>';
  if (!xml.includes(expected)) hold('unexpected forced PHPUnit database target: ' + name);
}
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const all = docker('ps', '--format', '{{json .}}').split('\n').filter(Boolean).map(v => JSON.parse(v));
const pg = all.filter(x => x.Image === 'public.ecr.aws/docker/library/postgres:16' && x.Ports.includes('5432'));
if (pg.length !== 1 || all.some(x => /postgres/i.test(x.Image) && x !== pg[0])) hold('expected one owned PostgreSQL 16 service container');
const container = pg[0];
if (!container.Ports.includes('127.0.0.1:5432->5432/tcp')) hold('PostgreSQL must bind runner loopback ONLY');
const mounts = JSON.parse(docker('inspect', '--format', '{{json .Mounts}}', container.ID));
if (mounts.some(m => m.Type === 'bind')) hold('PostgreSQL container binds a host path');
const psql = (...args) => execFileSync('psql', [
  '-X', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', '5432', '-U', 'postgres', ...args
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }).trim();
const identity = psql('-d', 'talibon_portal_test', '-tA', '-c', 'SELECT current_database() || chr(124) || current_user');
if (identity !== 'talibon_portal_test|postgres') hold('database endpoint identity changed');
const relations = psql('-d', 'talibon_portal_test', '-tA', '-c', "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public'");
if (relations !== '0') hold('database is NOT empty; refusing destructive migrate:fresh');
console.log('RT02 DB ownership check PASS: one hosted per-job ECR Public official PostgreSQL 16 container; forced PHPUnit DB matches and is initially empty');
