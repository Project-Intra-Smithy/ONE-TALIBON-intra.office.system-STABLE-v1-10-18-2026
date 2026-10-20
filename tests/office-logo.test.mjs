import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { jsx, jsxs } from 'react/jsx-runtime';
import { resolveOfficeLogo, officeLogoMap } from '../resources/js/lib/office-logo-map.ts';

test('only exact codes with identity and usage evidence resolve', () => {
    const verified = { src: '/logos/test.png', identityEvidence: 'test identity', usageApproval: 'test approval' };
    const map = { TEST: verified, PENDING: { ...verified, usageApproval: '' } };
    assert.equal(resolveOfficeLogo('TEST', map), verified);
    for (const code of [null, '', 'test', ' TEST', 'TEST OFFICE', 'constructor', 'PENDING']) {
        assert.equal(resolveOfficeLogo(code, map), null);
    }
});

test('authorized assets match canonical identities without confusing similar offices', () => {
    const expected = {
        MPDO: ['FOCAL-001', 'MPDO.png'], ACCOUNTING: ['FOCAL-009', 'MAccO.png'],
        TREASURY: ['FOCAL-010', 'MTO.png'], MSWDO: ['FOCAL-016', 'MSWDO.jpg'],
        AGRI: ['FOCAL-018', 'MAO.jpg'], PESO: ['FOCAL-022', 'MPESO.jpg'],
        LEDIPO: ['FOCAL-024', 'MEDIPO.png'], MARKET: ['FOCAL-035', 'MMAO.png'],
        'FOCAL-036': ['FOCAL-036', 'MO-TTMO (1).png'],
    };
    assert.deepEqual(Object.keys(officeLogoMap), Object.keys(expected));
    for (const [code, [key, file]] of Object.entries(expected)) {
        const logo = resolveOfficeLogo(code, undefined, key);
        assert.equal(logo.src, `/logos/${file}`);
        assert.equal(resolveOfficeLogo(null, undefined, key), logo);
        assert.ok(readFileSync(`public${logo.src}`).length > 0);
        assert.match(logo.usageApproval, /AJ frontend integration/);
    }
    for (const code of ['ADMIN', 'TOURISM', 'TRANSPORT', 'IAU', 'MEDIPO', 'MSWDO ', 'mswdo']) {
        assert.equal(resolveOfficeLogo(code), null);
    }
    assert.equal(resolveOfficeLogo('MSWDO', undefined, 'FOCAL-009'), null);
    assert.equal(resolveOfficeLogo('UNKNOWN', undefined, 'FOCAL-016'), null);
    assert.equal(resolveOfficeLogo(null, undefined, 'FOCAL-039'), null);
});

test('actual logo component retains size and accessible fallback after image failure', () => {
    let failed = false;
    let mapped = { src: '/logos/test.png' };
    const module = { exports: {} };
    const source = readFileSync('resources/js/components/offices/OfficeLogo.tsx', 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'exports', code)(name => {
        if (name === 'react') return { useState: () => [failed, value => { failed = value; }] };
        if (name === 'react/jsx-runtime') return { jsx, jsxs };
        if (name === 'lucide-react') return { Building2: () => null };
        if (name.includes('office-logo-map')) return { resolveOfficeLogo: () => mapped };
        throw new Error(name);
    }, module.exports);
    const render = () => {
        const outer = module.exports.default({ officeCode: 'TEST', officeName: 'Test office' });
        return outer.type(outer.props);
    };
    const image = render();
    assert.deepEqual(image.props.style, { width: 48, height: 48 });
    assert.equal(image.props.children.props.alt, 'Test office logo');
    assert.match(image.props.children.props.className, /object-contain/);
    image.props.children.props.onError();
    const fallback = render();
    assert.deepEqual(fallback.props.style, image.props.style);
    assert.equal(fallback.props.children.props['aria-label'], 'Test office: logo unavailable');
    mapped = null;
    assert.equal(render().props.children.type, 'span');
});
