import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'vite';

test('operational bundler rejects synthetic preview even when explicitly selected as its entry', async () => {
    await assert.rejects(build({
        configFile: 'vite.config.ts',
        logLevel: 'silent',
        build: {
            write: false,
            rollupOptions: { input: 'preview/standalone/networkBoundary.ts' },
        },
    }), /Synthetic preview module cannot enter the operational build/);
});
