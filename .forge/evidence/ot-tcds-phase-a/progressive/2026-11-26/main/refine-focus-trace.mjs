import fs from 'node:fs';
const file='tests/Browser/phase-a-qualification.mjs';let s=fs.readFileSync(file,'utf8');
const old="const r=document.activeElement.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;";
const next="const n=document.activeElement,r=n.getClientRects()[0]??n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(r.height,44)/2);return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&(hit===n||n.contains(hit));";
if(!s.includes(old))throw Error('Expected keyboard readiness block');s=s.replace(old,next);
const before='const node=document.activeElement,rect=node.getBoundingClientRect(),styles=getComputedStyle(node),hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);';
const after='const node=document.activeElement,rect=node.getClientRects()[0]??node.getBoundingClientRect(),styles=getComputedStyle(node),hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+Math.min(rect.height,44)/2);';
if(!s.includes(before))throw Error('Expected keyboard paint block');s=s.replace(before,after);fs.writeFileSync(file,s);
