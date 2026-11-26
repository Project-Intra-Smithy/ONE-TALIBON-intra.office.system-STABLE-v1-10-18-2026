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
    if (file.endsWith('.css')) {
        for (const match of read(file).matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
            const target = normalize(path.join(path.dirname(file), match[1]));
            if (fs.existsSync(target)) result.push(target);
        }
        return result;
    }
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
        const routeDeclarations = routes.split(/\r?\n/).filter(line => line.includes(`${controller}::class`) && (method === '__invoke' || new RegExp(`['"]${method}['"]`).test(line))).map(line => line.trim());
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
const originalReachabilityPath = '.forge/evidence/ot-tcds-phase-a/convergence/donor-reachability.json';
const originalReachability = fs.existsSync(originalReachabilityPath) ? JSON.parse(read(originalReachabilityPath)) : [];
const entrypointGraph = graph('resources/js/app.tsx');
const digest = files => crypto.createHash('sha256').update(files.sort().map(file => `${file}\0${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}`).join('\n')).digest('hex');
const files = donor.files.map(entry => {
    const canonical = entry.donor;
    const preview = entry.preview;
    const consumers = [...pageGraphs].filter(([, closure]) => closure.has(canonical)).map(([page]) => ({ page }));
    const previewConsumers = [...previewGraphs].filter(([, closure]) => preview && closure.has(preview)).map(([page]) => ({ page: `preview/${page}` }));
    const directCanonicalImportFromPreview = preview && fs.existsSync(preview) ? imports(preview).filter(file => !file.startsWith('preview/')) : [];
    const original = originalReachability.find(row => row.donor === canonical);
    const disposition = consumers.length ? 'CANONICAL PAGE IMPORT CLOSURE' : entrypointGraph.has(canonical) ? 'CANONICAL ENTRYPOINT / SHARED SHELL' : canonical.startsWith('public/') ? 'PRESERVED STATIC ASSET: not a JavaScript module; official GIS authority is not inferred' : directCanonicalImportFromPreview.length ? 'ISOLATED RUNTIME ADAPTER: shared presentation imports listed explicitly' : /planning(?:Governance|Maps)\.ts$/.test(canonical) ? 'SYNTHETIC AUTHORITY / SAMPLE DATA: intentionally excluded from production' : /(?:types\.ts|\.d\.ts)$/.test(canonical) ? 'COMPILE-TIME DECLARATION: not runtime presentation' : canonical==='resources/js/components/portal/StatusBadge.tsx' ? 'REPLACED BY canonical components/ui/StatusBadge.tsx and toneForWorkState; unknown status remains neutral' : canonical==='resources/views/app.blade.php' ? 'CANONICAL SERVER INERTIA/VITE ENTRY: protected backend template retained' : original && original.originalConsumers.length===0 ? 'UNREFERENCED IN FROZEN DONOR: preserved source; no active donor composition omitted' : 'UNVERIFIED SOURCE DISPOSITION';
    return { donor: canonical, donorBlob: entry.donor_blob, canonicalExists: fs.existsSync(canonical), canonicalConsumers: consumers, previewConsumers, directCanonicalImportFromPreview, entrypointConsumed:entrypointGraph.has(canonical), disposition, originalDonorReachability:original??null,kind: canonical.startsWith('public/') ? 'static asset; served by path, not a JavaScript import' : /\.css$/.test(canonical) ? 'stylesheet' : /\.tsx$/.test(canonical) ? 'presentation or runtime adapter' : 'data/type/configuration; inspect runtime consumers', sourceHash: fs.existsSync(canonical) ? digest([canonical]) : null, canonicalFileSha256:fs.existsSync(canonical)?crypto.createHash('sha256').update(fs.readFileSync(canonical)).digest('hex'):null };
});
const runtimePaths = process.env.PHASE_A_RUNTIME_RECEIPTS ? JSON.parse(process.env.PHASE_A_RUNTIME_RECEIPTS) : ['storage/app/qa/phase-a-canonical/results.json'];
assert.ok(Array.isArray(runtimePaths) && runtimePaths.every(file => typeof file === 'string'));
const receipts = runtimePaths.filter(file => fs.existsSync(file)).map(file => ({file, ...JSON.parse(read(file))}));
const runtime = receipts[0] ?? null;
const currentSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const observations = receipts.flatMap(receipt => (receipt.results ?? receipt.observations ?? []).map(result => ({...result,receipt:receipt.file,sourceSha:receipt.sourceSha,completed:receipt.completed,receiptPassed:receipt.passed,sourceWorktreeDirty:receipt.sourceWorktreeDirty})));
const interactions = receipts.flatMap(receipt => (receipt.interactions ?? []).map(result => ({...result,receipt:receipt.file,sourceSha:receipt.sourceSha})));
const coverage = pages.filter(page => fs.existsSync(`preview/${page}`)).map(page => {
    const pageProducers = producers.get(page) ?? [];
    const observed = observations.filter(result => `resources/js/pages/${result.renderedComponent}.tsx` === page);
    const held = page.includes('/Messages/');
    const routed = pageProducers.some(producer => producer.routeDeclarations.length);
    const qualified = observed.some(result=>result.sourceSha===currentSha&&result.completed&&result.receiptPassed!==false&&result.sourceWorktreeDirty===false&&result.status===200&&!result.overflow&&!(result.errors?.length)&&!(result.violations?.length));
    return {page,qualifiedAtReportSha:qualified,producers:pageProducers,preview:`preview/${page}`,sharedCanonicalModules:[...(previewGraphs.get(page) ?? [])].filter(file => !file.startsWith('preview/') && pageGraphs.get(page).has(file)),canonicalRouteEvidence:observed,canonicalInteractions:interactions.filter(result => {const module=page.split('/').at(-2);if(result.renderedComponent===page.replace('resources/js/pages/','').replace(/\.tsx$/,''))return true;return module==='Plans'?/plan-|staff/.test(result.label):module==='PPAs'?/ppa-/.test(result.label):module==='PlanningMaps'?/map-/.test(result.label):module==='Tasks'?/task/.test(result.label):module==='Transactions'?/work-request/.test(result.label):false;}),disposition:page.includes('/Errors/')&&observed.length?'CANONICAL ERROR RESPONSE OBSERVED: inspect actual error status/route receipts':held?'HELD #191: canonical middleware denies execution; synthetic presentation only':!routed?'NO ACTIVE ROUTE: source/archive presentation only; runtime NOT VERIFIED':observed.some(result=>result.status===200)?'CANONICAL RUNTIME OBSERVED: inspect exact receipts for assertions and limitations':'ACTIVE ROUTE / RUNTIME NOT VERIFIED',adapter:/(?:Plans|PPAs|PlanningMaps)\/Index/.test(page)?'Separate authorized server and synthetic orchestration, shared presentation components':'Canonical page consumed directly by isolated preview',contractRequirements:/(?:Plans|PPAs|PlanningMaps)\/Index/.test(page)?'convergence/CORRECTIVE-CHECKPOINT.md#outstanding-contract-requirements':null};
});
const report = { sourceSha: currentSha, dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), executableDigest: digest([...new Set([...walk('resources/js'), ...walk('resources/css'), ...walk('preview/resources/js'), ...walk('preview/standalone')])]), donorSha: donor.donor_sha, canonicalRuntimeSourceSha: runtime?.sourceSha ?? null, canonicalRuntimeCompleted: runtime?.completed ?? false, canonicalBuildManifestSha256: runtime?.buildManifestSha256 ?? null, files, pages: coverage };
report.qualificationRule = 'Only completed, non-failed, clean receipts at sourceSha with a successful actual canonical response qualify. This is author evidence, not independent acceptance. executableDigest covers canonical/preview JS and canonical CSS; the manifest and Git SHA identify the actual build.';
report.runtimeReceipts = receipts.map(({file,sourceSha,sourceWorktreeDirty,completed,passed,buildManifestSha256})=>({file,sourceSha,sourceWorktreeDirty,completed,passed,buildManifestSha256}));
assert.equal(files.length, 262, 'Every frozen donor path must remain accounted for');
assert.equal(coverage.length, 65, 'Every frozen donor page must remain accounted for');
const evidenceOutput = process.env.PHASE_A_CROSSWALK_OUTPUT || '.forge/evidence/ot-tcds-phase-a';
fs.mkdirSync(path.join(evidenceOutput,'convergence'), { recursive: true });
fs.writeFileSync(path.join(evidenceOutput,'convergence/source-crosswalk.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(evidenceOutput,'page-coverage.json'), JSON.stringify(coverage, null, 2));
fs.writeFileSync(path.join(evidenceOutput,'donor-disposition.json'), JSON.stringify({...donor, files: donor.files.map(entry => {
    const {status, ...provenance} = entry;
    const evidence = files.find(file => file.donor === entry.donor);
    return {...provenance, consumption: {canonicalConsumers:evidence.canonicalConsumers.map(consumer=>consumer.page), directCanonicalImports:evidence.directCanonicalImportFromPreview, sourceHash:evidence.sourceHash, disposition:evidence.disposition, detailedEvidence:'convergence/source-crosswalk.json', heldBoundary:entry.donor.includes('/Messages/')?'Messaging execution remains held under Hub #191':null}};
})}, null, 2));
console.log(JSON.stringify({ donorFiles: files.length, pages: coverage.length, directlySharedPages: coverage.filter(page => page.sharedCanonicalModules.includes(page.page)).length, executableDigest: report.executableDigest }));
