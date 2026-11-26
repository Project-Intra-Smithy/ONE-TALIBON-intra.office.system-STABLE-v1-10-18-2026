import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
const root='C:/dev/TAL/ot-tcds-donor-pinned';
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'7afabade1fd651c2950f70006b8213ae8b7c61da');
const original=JSON.parse(fs.readFileSync('.forge/evidence/ot-tcds-phase-a/donor-disposition.json'));
const report=JSON.parse(fs.readFileSync('.forge/evidence/ot-tcds-phase-a/convergence/source-crosswalk.json'));
const walk=dir=>fs.readdirSync(root+'/'+dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);
const cache=new Map();
function imports(file){if(cache.has(file))return cache.get(file);const result=[];cache.set(file,result);if(!/\.[jt]sx?$/.test(file))return result;const tree=ts.createSourceFile(file,fs.readFileSync(root+'/'+file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);for(const node of tree.statements){if(!ts.isImportDeclaration(node)&&!ts.isExportDeclaration(node))continue;if(!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;const value=node.moduleSpecifier.text;const base=value.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),value)):value.startsWith('@/')?'resources/js/'+value.slice(2):null;if(!base)continue;const resolved=[base,base+'.tsx',base+'.ts',base+'/index.tsx',base+'/index.ts'].find(p=>fs.existsSync(root+'/'+p)&&fs.statSync(root+'/'+p).isFile());if(resolved)result.push({file:resolved,typeOnly:Boolean(node.importClause?.isTypeOnly||node.isTypeOnly)});}return result;}
function graph(file,seen=new Set()){if(seen.has(file))return seen;seen.add(file);for(const next of imports(file))graph(next.file,seen);return seen;}
const entries=['resources/js/app.tsx',...walk('resources/js/pages').filter(f=>f.endsWith('.tsx'))];
const graphs=entries.map(entry=>({entry,closure:graph(entry)}));
const rows=report.files.filter(f=>!f.canonicalConsumers.length).map(file=>{const record=original.files.find(r=>r.donor===file.donor);const bytes=execFileSync('git',['-C',root,'show','HEAD:'+file.donor],{maxBuffer:10*1024*1024});assert.equal(crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'),record.donor_blob);return {donor:file.donor,donorBlob:record.donor_blob,originalConsumers:graphs.filter(g=>g.closure.has(file.donor)).map(g=>g.entry),canonicalExists:file.canonicalExists,previewConsumers:file.previewConsumers,directCanonicalImports:file.directCanonicalImportFromPreview};});
fs.writeFileSync('storage/app/qa/donor-unconsumed-analysis.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify(rows.filter(r=>!r.donor.startsWith('public/')).map(r=>({donor:r.donor,originalConsumers:r.originalConsumers.length,directCanonicalImports:r.directCanonicalImports})),null,2));
