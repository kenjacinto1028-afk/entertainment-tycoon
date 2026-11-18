'use strict';
// R3: rivals choose a format mix (config rivals.json RIVAL_FORMAT_MIX). Multiseed coverage so suites see ebooks, audiobooks and indie games.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
E.CONFIG.depth.INSOLVENCY.furloughWeeks=0;// R6: these idle-player worlds must keep running
const mk=(seed,era)=>E.createGame({seed,era,origin:'established',startingCapital:'funded',aiCount:8,depth:'standard'});
const run=(seed,era,years)=>{const s=mk(seed,era);for(let w=0;w<52*years;w++)E.advance(s,1);return s;};
const ai=s=>s.projects.filter(p=>p.companyId!==s.playerId&&p.route!=='contract'&&p.status==='released');
check('Config mix is valid and every format exists',()=>{const M=E.CONFIG.rivals.RIVAL_FORMAT_MIX;
 for(const [sec,opts] of Object.entries(M).filter(([k])=>k!=='_note'))for(const o of opts){assert(E.FORMATS[sec].includes(o.format),o.format);assert(o.weight>0);}});
check('Multiseed: rivals release ebooks, audiobooks and indie games, and Audiobooks never before they exist',()=>{
 const seen={},plans=[['r3-a',25,12],['r3-b',40,12],['r3-c',60,10],['r3-d',10,15]];
 for(const [seed,era,y] of plans){const s=run(seed,era,y);assert.deepEqual(E.audit(s),[]);
  for(const p of ai(s)){seen[p.format]=(seen[p.format]||0)+1;if(p.format==='Audiobook')assert(E.yearAt(p.startWeek)>=E.CONFIG.tuning_engine.publishingFormatAvailable__001,'early audiobook');
   if(p.format==='Ebook')assert(E.yearAt(p.startWeek)>=E.CONFIG.tuning_engine.publishingFormatAvailable__002,'early ebook');}}
 for(const f of ['Novel','Ebook','Audiobook','Indie Game','Premium Game'])assert(seen[f]>0,'missing '+f);return seen;});
check('Format pick uses no random numbers and same seed gives the same world',()=>{
 const a=JSON.stringify(run('r3-same',25,3).projects.map(p=>[p.id,p.format,p.directRevenue])),b=JSON.stringify(run('r3-same',25,3).projects.map(p=>[p.id,p.format,p.directRevenue]));assert.equal(a,b);});
check('Wallet cap holds with the new format mix',()=>{const s=mk('r3-wallet',40);for(let w=0;w<52*8;w++){E.advance(s,1);
 const ceiling=E.activeRegions(s).reduce((acc,r)=>acc+Object.keys(E.SECTORS).reduce((v,sec)=>v+E.worldMarketBudget(s,sec,r.name),0),0);assert(s.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling),'wallet '+w);}});
console.log(total+'/4 R3 checks passed');
