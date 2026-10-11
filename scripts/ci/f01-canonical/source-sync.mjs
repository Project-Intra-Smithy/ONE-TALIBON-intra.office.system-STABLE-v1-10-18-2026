// Canonical F01 source attestation and local deterministic re-sync.
// Pinned Git objects are included in this backend commit. No private frontend access or token.
// Run: node scripts/ci/f01-canonical/source-sync.mjs --verify
// Or:  node scripts/ci/f01-canonical/source-sync.mjs --restore
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const doc=JSON.parse(fs.readFileSync('scripts/ci/f01-canonical/source-manifest.json','utf8'));
const base='3b429c5fe95467a223542a832677060c947e9384', frontend='e6f5947ab330802f4b860b28baddc910ca32e13e', tree='a7cced7c276e7a62292f08c04606f4376450aac1', branch='forge/jane-a01-f01-canonical-integration-001';
const args=process.argv.slice(2);
const restore=args.length===1&&args[0]==='--restore';
const verify=args.length===0||(args.length===1&&args[0]==='--verify');
function must(ok,reason){if(!ok)throw Error('F01 CANONICAL HOLD: '+reason)}
must(restore||verify,'invalid mode');
function git(...a){return execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:33554432}).trim()}
const hosted=process.env.GITHUB_ACTIONS==='true';
if(hosted){
 must(process.env.GITHUB_REPOSITORY==='Project-Intra-Smithy/Talibon-Sales-Prototype'&&process.env.RUNNER_ENVIRONMENT==='github-hosted','CI trust boundary');
 must(process.env.GITHUB_REF==='refs/heads/'+branch&&!restore,'CI branch/mode boundary');
}
must(doc.schemaVersion===2&&doc.source.backendCommit===base&&doc.source.frontendCommit===frontend&&doc.source.frontendAcceptedTree===tree&&doc.source.integrationBranch===branch,'source tuple');
must(git('merge-base',base,'HEAD')===base,'base ancestry');
must(git('rev-list','--min-parents=2',base+'..HEAD')==='','merge commit introduced');
must(doc.files.length===37&&new Set(doc.files.map(x=>x.path)).size===37,'37 unique presentation blobs');
must(doc.integration.supportPaths.length===7&&new Set(doc.integration.supportPaths).size===7,'support manifest');
const allowed=new Set(doc.integration.supportPaths);
const hashes=[];
for(const x of doc.files){
 must(x.selection==='imported'&&/^(resources\/js\/|resources\/css\/)[\w./-]+$/.test(x.path)&&!x.path.includes('..'),'unapproved path');
 must(/^[a-f0-9]{40}$/.test(x.sourceGitBlob),'source hash shape');
 const old=git('ls-tree',base,'--',x.path);
 const oldSha=old?old.split(/\s+/)[2]:null;
 must(oldSha===x.targetGitBlob,'old target mismatch: '+x.path);
 const full=path.resolve(root,x.path);
 must(full.startsWith(root+path.sep),'path escape');
 let dir=root;
 for(const segment of x.path.split('/')){
  dir=path.join(dir,segment);
  if(fs.existsSync(dir))must(!fs.lstatSync(dir).isSymbolicLink(),'symlink path '+x.path);
 }
 const bytes=execFileSync('git',['cat-file','blob',x.sourceGitBlob],{cwd:root,maxBuffer:33554432});
 const gitSha=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 must(gitSha===x.sourceGitBlob,'pinned blob unavailable');
 if(restore){fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes,{mode:0o644})}
 must(fs.existsSync(full)&&fs.statSync(full).isFile(),'source missing '+x.path);
 const actual=fs.readFileSync(full);
 must(actual.equals(bytes)&&git('hash-object','--',x.path)===gitSha,'source changed '+x.path);
 must(git('ls-files','--stage','--',x.path).split(/\s+/)[0]==='100644','file mode');
 allowed.add(x.path);
 hashes.push({path:x.path,gitBlob:gitSha,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const [p,sha] of Object.entries({'package.json':doc.dependencies.backendPackageJson,'package-lock.json':doc.dependencies.backendPackageLock,'vite.config.ts':doc.dependencies.backendViteConfig})){
 must(git('hash-object','--',p)===sha,'build dependency drift: '+p);
}
must(allowed.size===44,'invalid allowlist');
const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
must(changed.length===44&&new Set(changed).size===44&&changed.every(p=>allowed.has(p))&&[...allowed].every(p=>changed.includes(p)),'changed paths outside approved inventory');
if(hosted)must(git('status','--porcelain')==='','dirty hosted checkout');
const receipt={verified:true,backend:base,frontend,frontendTree:tree,commit:git('rev-parse','HEAD'),fileCount:37,changedCount:44,dependenciesChanged:false,blobs:hashes};
if(hosted){
 const dest=process.env.RTCI_REPORT_DIR;
 must(Boolean(dest&&process.env.RUNNER_TEMP&&path.resolve(dest).startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep)),'report location');
 fs.mkdirSync(dest,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(dest,'source-attestation.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
}
console.log('F01 CANONICAL: 37 immutable frontend blobs, 44 exact changed paths and build inputs VERIFIED');
