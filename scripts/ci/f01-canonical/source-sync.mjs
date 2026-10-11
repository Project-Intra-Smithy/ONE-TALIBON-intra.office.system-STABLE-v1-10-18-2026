// A01-F01 immutable source attestation: strict premerge vs durable canonical main.
// No private frontend fetch, cross-repository credential, or production data.
// --verify selects its trust mode from the GitHub push ref (or local branch).
// --verify-candidate / --verify-main are LOCAL fixture/developer modes only.
// --restore works offline from the existing Git objects, never in hosted CI.
// --self-test runs isolated real Git-commit regression fixtures.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';

const root=process.cwd();
const manifestPath='scripts/ci/f01-canonical/source-manifest.json';
const doc=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const base='3b429c5fe95467a223542a832677060c947e9384';
const frontend='e6f5947ab330802f4b860b28baddc910ca32e13e';
const tree='a7cced7c276e7a62292f08c04606f4376450aac1';
const branch='forge/jane-a01-f01-canonical-integration-001';
const repository='Project-Intra-Smithy/Talibon-Sales-Prototype';
// These constants, unlike mutable manifest declarations, are independent pins.
// Changing any of them requires a new, reviewed source-provenance decision.
const acceptedManifestBlob='6aed7b8da821f9cfacb62981cba3ea9d175b57b2';
const dependencyPins=Object.freeze({
 'package.json':'18f9fd437db36c8ec68da6f05c3e5a3ccaf0712b',
 'package-lock.json':'8c0a9d093854d7d3471700412dbcd2e1ae9c0287',
 'vite.config.ts':'0bcbc24b6ea7b48c0488317a83c1bf28752ad644'
});
const supportPaths=[
 '.github/workflows/a01-f01-canonical-integration.yml',
 'scripts/ci/f01-canonical/source-manifest.json',
 'scripts/ci/f01-canonical/source-sync.mjs',
 'scripts/ci/f01-canonical/db-preflight.mjs',
 'scripts/ci/f01-canonical/run-native.sh',
 'tests/integration/f01/browser.mjs',
 'tests/integration/f01/fixture.php'
];

function must(ok,reason){if(!ok)throw Error('F01 CANONICAL HOLD: '+reason)}
function git(...a){return execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:33554432}).trim()}
const action=process.argv[2]||'--verify';
must(process.argv.length<=3&&['--verify','--restore','--verify-candidate','--verify-main','--self-test'].includes(action),'invalid command');
const hosted=process.env.GITHUB_ACTIONS==='true';
const head=git('rev-parse','HEAD');
if(hosted){
 must(process.env.GITHUB_REPOSITORY===repository&&process.env.RUNNER_ENVIRONMENT==='github-hosted','hosted repository/runner boundary');
 must(process.env.GITHUB_EVENT_NAME==='push','only push events may attest F01');
 must(process.env.GITHUB_SHA===head,'checkout not the exact pushed SHA');
 must([ 'refs/heads/'+branch,'refs/heads/main' ].includes(process.env.GITHUB_REF),'untrusted CI branch');
 must(action==='--verify'||action==='--self-test','hosted mode must be inferred from immutable push ref');
}
const branchRef=(()=>{try{return git('symbolic-ref','--quiet','--short','HEAD')}catch{return ''}})();
const mode=hosted
 ? (process.env.GITHUB_REF==='refs/heads/main'?'main':'candidate')
 : (action==='--verify-main'?'main':action==='--verify-candidate'?'candidate':branchRef==='main'?'main':'candidate');
const restore=action==='--restore';
const selfTest=action==='--self-test';
must(!hosted||!restore,'hosted restore prohibited');

// Immutable provenance is checked in BOTH modes; the accepted manifest itself
// cannot silently re-pin a different frontend file or build dependency.
must(doc.schemaVersion===2
 &&doc.source.backendRepository===repository
 &&doc.source.backendCommit===base
 &&doc.source.frontendRepository==='Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE'
 &&doc.source.frontendCommit===frontend
 &&doc.source.frontendAcceptedTree===tree
 &&doc.source.integrationBranch===branch,'source tuple');
must(git('hash-object','--',manifestPath)===acceptedManifestBlob,'immutable source manifest drift');
must(git('merge-base',base,'HEAD')===base,'canonical backend-base ancestry');
if(mode==='candidate'){
 must(git('rev-list','--min-parents=2',base+'..HEAD')==='','unexpected candidate merge commit');
}
must(doc.files.length===37&&new Set(doc.files.map(x=>x.path)).size===37,'37 unique presentation blobs');
must(doc.integration.supportPaths.length===7
 &&new Set(doc.integration.supportPaths).size===7
 &&supportPaths.every(p=>doc.integration.supportPaths.includes(p)),'support manifest drift');
must(doc.dependencies.backendPackageJson===dependencyPins['package.json']
 &&doc.dependencies.backendPackageLock===dependencyPins['package-lock.json']
 &&doc.dependencies.backendViteConfig===dependencyPins['vite.config.ts']
 &&doc.dependencies.changed===false,'immutable build-input provenance drift');

function verifySnapshot(){
 const allowed=new Set(supportPaths);
 const hashes=[];
 for(const x of doc.files){
  must(x.selection==='imported'&&/^(resources\/js\/|resources\/css\/)[\w./-]+$/.test(x.path)&&!x.path.includes('..'),'unapproved import path');
  must(/^[a-f0-9]{40}$/.test(x.sourceGitBlob),'invalid source blob');
  const old=git('ls-tree',base,'--',x.path);
  const oldSha=old?old.split(/\s+/)[2]:null;
  must(oldSha===x.targetGitBlob,'frozen old-target mismatch: '+x.path);
  const full=path.resolve(root,x.path);
  must(full.startsWith(root+path.sep),'path escape');
  let seg=root;
  for(const part of x.path.split('/')){
   seg=path.join(seg,part);
   if(fs.existsSync(seg))must(!fs.lstatSync(seg).isSymbolicLink(),'symlink path '+x.path);
  }
  const bytes=execFileSync('git',['cat-file','blob',x.sourceGitBlob],{cwd:root,maxBuffer:33554432});
  const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  must(blob===x.sourceGitBlob,'pinned Git object missing or corrupt: '+x.path);
  if(restore){fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,bytes,{mode:0o644})}
  must(fs.existsSync(full)&&fs.statSync(full).isFile(),'missing imported source: '+x.path);
  must(fs.readFileSync(full).equals(bytes)&&git('hash-object','--',x.path)===blob,'modified imported source: '+x.path);
  must(git('ls-files','--stage','--',x.path).split(/\s+/)[0]==='100644','invalid imported file mode');
  allowed.add(x.path);
  hashes.push({path:x.path,gitBlob:blob,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 for(const [p,sha] of Object.entries(dependencyPins)){
  must(fs.existsSync(p)&&fs.statSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink(),'invalid build-input path: '+p);
  must(git('ls-files','--stage','--',p).split(/\s+/)[0]==='100644','build-input mode drift: '+p);
  must(git('hash-object','--',p)===sha,'build dependency drift: '+p);
 }
 must(allowed.size===44,'incomplete 44-path candidate allowlist');
 let changedCount=null;
 if(mode==='candidate'){
  const changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
  must(changed.length===44&&new Set(changed).size===44
   &&changed.every(p=>allowed.has(p))
   &&[...allowed].every(p=>changed.includes(p)),'candidate changed paths outside exact 44-path inventory');
  changedCount=changed.length;
 }
 // On canonical main, unrelated changes/merge parents are permissible, but the
 // 37 imported blobs and all pinned build inputs remain bit-for-bit immutable.
 if(hosted)must(git('status','--porcelain')==='','dirty hosted checkout');
 return {verified:true,mode,backend:base,frontend,frontendTree:tree,
  commit:head,fileCount:hashes.length,changedCount,dependenciesChanged:false,
  manifestBlob:acceptedManifestBlob,blobs:hashes};
}

function report(name,payload){
 if(!hosted)return;
 const dest=process.env.RTCI_REPORT_DIR;
 must(Boolean(dest&&process.env.RUNNER_TEMP
  &&path.resolve(dest).startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep)),'unsafe report path');
 fs.mkdirSync(dest,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(dest,name),JSON.stringify(payload,null,2)+'\n',{mode:0o600});
}

function runRegressions(){
 // Real temporary commits, including an actual two-parent synthetic merge.
 // Never writes the repository or branch under review.
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'f01-canonical-reg-'));
 const cases=[];
 const fixtureEnv={...process.env,GITHUB_ACTIONS:'false',GITHUB_REF:'',
  GITHUB_REPOSITORY:'',GITHUB_SHA:'',GITHUB_EVENT_NAME:'',
  GIT_AUTHOR_NAME:'F01 Test Fixture',GIT_COMMITTER_NAME:'F01 Test Fixture',
  GIT_AUTHOR_EMAIL:'f01-fixture@example.invalid',GIT_COMMITTER_EMAIL:'f01-fixture@example.invalid'};
 function cmd(dir,...args){return execFileSync('git',args,{cwd:dir,env:fixtureEnv,encoding:'utf8',maxBuffer:33554432}).trim()}
 function clone(name){
  const dest=path.join(scratch,name);
  execFileSync('git',['clone','-q','--shared','--no-checkout',root,dest],{cwd:root,env:fixtureEnv,maxBuffer:33554432});
  cmd(dest,'checkout','-q','--detach',head);
  return dest;
 }
 function check(dir,flag,expectPass,label){
  const proc=spawnSync(process.execPath,[manifestPath.replace('source-manifest.json','source-sync.mjs'),flag],
   {cwd:dir,env:fixtureEnv,encoding:'utf8',maxBuffer:33554432});
  const passed=proc.status===0;
  cases.push({case:label,expected:expectPass?'PASS':'REJECT',observed:passed?'PASS':'REJECT',passed:passed===expectPass});
  must(passed===expectPass,'regression '+label+' unexpectedly '+(passed?'passed':'failed')+': '+(proc.stderr||'').slice(0,300));
 }
 function addCommit(dir,file,textContent,message){
  const filePath=path.join(dir,file);
  fs.mkdirSync(path.dirname(filePath),{recursive:true});
  fs.appendFileSync(filePath,textContent);
  cmd(dir,'add','--',file);
  cmd(dir,'commit','-q','-m',message);
 }
 function restoreCommit(dir,file){
  cmd(dir,'checkout','HEAD~1','--',file);
  cmd(dir,'commit','-q','-m','restore fixture input');
 }
 try{
  if(mode==='candidate'){
   const candidate=clone('candidate');
   check(candidate,'--verify-candidate',true,'premerge approved 44 paths');
   addCommit(candidate,'docs/f01-unapproved-fixture.txt','unapproved\n','candidate invalid 45th path');
   check(candidate,'--verify-candidate',false,'candidate rejects unauthorized 45th path');
  }
  const main=clone('synthetic-main');
  cmd(main,'checkout','-q','-b','f01-regression-main',base);
  cmd(main,'merge','-q','--no-ff','-m','synthetic reviewed integration merge',head);
  must(cmd(main,'rev-list','--parents','-n','1','HEAD').split(/\s+/).length===3,'fixture not a real two-parent merge');
  check(main,'--verify-main',true,'two-parent postmerge main');
  addCommit(main,'docs/f01-unrelated-backend-fixture.txt','unrelated backend change\n','unrelated later backend commit');
  check(main,'--verify-main',true,'unrelated backend change remains allowed');
  addCommit(main,doc.files.find(x=>x.path==='resources/js/pages/Dashboard.tsx').path,
   '\n// unauthorized imported presentation edit\n','tampered F01 pinned blob');
  check(main,'--verify-main',false,'modified pinned presentation blob rejected');
  restoreCommit(main,'resources/js/pages/Dashboard.tsx');
  check(main,'--verify-main',true,'restored pinned presentation blob');
  addCommit(main,'package-lock.json','\n','tampered pinned dependency lock');
  check(main,'--verify-main',false,'modified dependency input rejected');
  restoreCommit(main,'package-lock.json');
  addCommit(main,manifestPath,'\n','tampered source provenance manifest');
  check(main,'--verify-main',false,'modified source manifest rejected');
  must(cases.every(x=>x.passed),'one or more regressions failed');
  const result={verified:true,sourceHead:head,mode,cases,fixture:'local disposable Git clones; no main or PR merge'};
  report('source-regression.json',result);
  console.log('F01 CANONICAL REGRESSION: '+cases.length+' actual Git-fixture cases PASS');
 }finally{fs.rmSync(scratch,{recursive:true,force:true})}
}

if(selfTest){runRegressions()}
else{
 const receipt=verifySnapshot();
 report('source-attestation.json',receipt);
 console.log('F01 CANONICAL '+mode.toUpperCase()+': 37 immutable imported blobs and build-input pins VERIFIED'+
  (mode==='candidate'?', 44 exact candidate changed paths':' (merge ancestry/unrelated backend changes permitted)'));
}
