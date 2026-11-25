import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const normalize = value => value.replaceAll('\\', '/');
const read = file => fs.readFileSync(file, 'utf8');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [normalize(path.join(directory, entry.name))]);
const resolve = (source, specifier) => {
    const target = specifier.startsWith('.') ? normalize(path.join(path.dirname(source), specifier)) : specifier.startsWith('@/') ? `resources/js/${specifier.slice(2)}` : null;
    return target && [target, `${target}.tsx`, `${target}.ts`, `${target}/index.tsx`, `${target}/index.ts`].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
};
const cache = new Map();
function imports(file) {
    if (cache.has(file)) return cache.get(file);
    const result = [];
    cache.set(file, result);
    if (!/\.[cm]?[jt]sx?$/.test(file)) return result;
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    for (const node of source.statements) {
        if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
        if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly || ts.isExportDeclaration(node) && node.isTypeOnly) continue;
        const target = resolve(file, node.moduleSpecifier.text);
        if (target) result.push(target);
    }
    return result;
}
function graph(file, visited = new Set()) {
    if (visited.has(file)) return visited;
    visited.add(file);
    for (const target of imports(file)) graph(target, visited);
    return visited;
}
const pages = walk('resources/js/pages').filter(file => file.endsWith('.tsx'));
const pageGraphs = new Map(pages.map(file => [file, graph(file)]));
const previewGraphs = new Map(pages.filter(file => fs.existsSync(`preview/${file}`)).map(file => [file, graph(`preview/${file}`)]));
const routes = read('routes/web.php');
const producers = new Map();
for (const file of walk('app/Http/Controllers').filter(file => file.endsWith('.php'))) {
    const text = read(file);
    for (const match of text.matchAll(/Inertia::render\(\s*['"]([^'"]+)['"]/g)) {
        const prefix = text.slice(0, match.index);
        const method = [...prefix.matchAll(/function\s+(\w+)\s*\(/g)].at(-1)?.[1];
        const controller = path.basename(file, '.php');
        const routeDeclarations = routes.split(/\r?\n/).filter(line => line.includes(`${controller}::class`) && new RegExp(`['"]${method}['"]`).test(line)).map(line => line.trim());
        const page = `resources/js/pages/${match[1]}.tsx`;
        producers.set(page, [...(producers.get(page) ?? []), { file, method, routeDeclarations }]);
    }
}
for (const line of routes.split(/\r?\n/)) {
    const match = line.match(/Inertia::render\(['"]([^'"]+)['"]/);
    if (match) {
        const page = `resources/js/pages/${match[1]}.tsx`;
        producers.set(page, [...(producers.get(page) ?? []), { file: 'routes/web.php', routeDeclarations: [line.trim()] }]);
    }
}
const donor = JSON.parse(read('.forge/evidence/ot-tcds-phase-a/donor-disposition.json'));
const digest = files => crypto.createHash('sha256').update(files.sort().map(file => `${file}\0${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}`).join('\n')).digest('hex');
const files = donor.files.map(entry => {
    const canonical = entry.donor;
    const preview = entry.preview;
    const consumers = [...pageGraphs].filter(([, closure]) => closure.has(canonical)).map(([page]) => ({ page }));
    const previewConsumers = [...previewGraphs].filter(([, closure]) => preview && closure.has(preview)).map(([page]) => ({ page: `preview/${page}` }));
    return { donor: canonical, donorBlob: entry.donor_blob, canonicalExists: fs.existsSync(canonical), canonicalConsumers: consumers, previewConsumers, directCanonicalImportFromPreview: preview && fs.existsSync(preview) ? imports(preview).filter(file => !file.startsWith('preview/')) : [], kind: canonical.startsWith('public/') ? 'static asset; served by path, not a JavaScript import' : /\.css$/.test(canonical) ? 'stylesheet' : /\.tsx$/.test(canonical) ? 'presentation or runtime adapter' : 'data/type/configuration; inspect runtime consumers', sourceHash: fs.existsSync(canonical) ? digest([canonical]) : null };
});
const runtimePath = 'storage/app/qa/phase-a-canonical/results.json';
const runtime = fs.existsSync(runtimePath) ? JSON.parse(read(runtimePath)) : null;
const coverage = pages.filter(page => fs.existsSync(`preview/${page}`)).map(page => ({ page, producers: producers.get(page) ?? [], preview: `preview/${page}`, sharedCanonicalModules: [...(previewGraphs.get(page) ?? [])].filter(file => !file.startsWith('preview/') && pageGraphs.get(page).has(file)), canonicalRouteEvidence: (runtime?.results ?? []).filter(result => `resources/js/pages/${result.renderedComponent}.tsx` === page), canonicalInteractions: (runtime?.interactions ?? []).filter(result => { const module = page.split('/').at(-2); return module === 'Plans' ? /plan-|staff/.test(result.label) : module === 'PPAs' ? /ppa-/.test(result.label) : module === 'PlanningMaps' ? /map-/.test(result.label) : module === 'Tasks' ? /task/.test(result.label) : module === 'Transactions' ? /work-request/.test(result.label) : false; }) }));
const report = { sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), executableDigest: digest([...new Set([...walk('resources/js'), ...walk('preview/resources/js'), ...walk('preview/standalone')])]), donorSha: donor.donor_sha, canonicalRuntimeSourceSha: runtime?.sourceSha ?? null, files, pages: coverage };
assert.equal(files.length, 262, 'Every frozen donor path must remain accounted for');
assert.equal(coverage.length, 65, 'Every frozen donor page must remain accounted for');
fs.mkdirSync('.forge/evidence/ot-tcds-phase-a/convergence', { recursive: true });
fs.writeFileSync('.forge/evidence/ot-tcds-phase-a/convergence/source-crosswalk.json', JSON.stringify(report, null, 2));
fs.writeFileSync('.forge/evidence/ot-tcds-phase-a/page-coverage.json', JSON.stringify(coverage, null, 2));
fs.writeFileSync('.forge/evidence/ot-tcds-phase-a/donor-disposition.json', JSON.stringify({...donor, files: donor.files.map(entry => {
    const {status, ...provenance} = entry;
    const evidence = files.find(file => file.donor === entry.donor);
    return {...provenance, consumption: {canonicalConsumers:evidence.canonicalConsumers.map(consumer=>consumer.page), directCanonicalImports:evidence.directCanonicalImportFromPreview, sourceHash:evidence.sourceHash, detailedEvidence:'convergence/source-crosswalk.json', heldBoundary:entry.donor.includes('/Messages/')?'Messaging execution remains held under Hub #191':null}};
})}, null, 2));
console.log(JSON.stringify({ donorFiles: files.length, pages: coverage.length, directlySharedPages: coverage.filter(page => page.sharedCanonicalModules.includes(page.page)).length, executableDigest: report.executableDigest }));
