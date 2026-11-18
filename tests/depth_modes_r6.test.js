'use strict';
// R6: formal insolvency after a long furlough. Config depth.json INSOLVENCY. No save field, no RNG.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;const N=5;
function check(label,fn){try{fn();console.log('PASS',label);total++;}catch(e){console.error('FAIL',label,e.stack);process.exit(1);}}
const R=E.CONFIG.depth.INSOLVENCY;
const fresh=()=>E.createGame({seed:'r6-world',era:25,origin:'established',startingCapital:'funded',aiCount:8,depth:'standard'});
// Put a company into a hopeless furlough that began `ago` weeks back.
const broke=(s,c,ago)=>{c.finance.cash=1;c.finance.payable=Math.max(c.finance.payable,1e6);c.operating44={unfundedWeeks:3,furloughed:true,startWeek:s.week-ago,resumptions:0};};
check('Config: 52 weeks, warnings before the end',()=>{assert.equal(R.furloughWeeks,52);assert(R.warnWeeks.every(w=>w>0&&w<R.furloughWeeks));});
check('Rival paused 51 weeks is still open; at 52 it closes',()=>{
 const s=fresh(),c=s.companies.find(x=>!x.isPlayer&&!x.parentId&&!x.bankrupt);broke(s,c,R.furloughWeeks-3);
 E.advance(s,1);assert(!c.bankrupt,'closed too early');
 broke(s,c,R.furloughWeeks);E.advance(s,1);assert(c.bankrupt,'did not close');
 assert(s.news.some(n=>n.title&&n.title.includes(c.name)),'no news');
});
check('Rival that can restart never goes insolvent',()=>{
 const s=fresh(),c=s.companies.find(x=>!x.isPlayer&&!x.parentId&&!x.bankrupt);broke(s,c,R.furloughWeeks+10);c.finance.cash=1e9;c.finance.payable=0;
 E.advance(s,1);assert(!c.bankrupt);
});
check('Player: warning appears, then run ends with the old company closed',()=>{
 const s=fresh(),p=E.player(s);broke(s,p,R.furloughWeeks-R.warnWeeks[0]-1);
 E.advance(s,1);assert(s.inbox.some(a=>a.key&&a.key.startsWith('insolvency-warning-')),'no warning');assert.notEqual(s.runStatus,'ended');
 broke(s,p,R.furloughWeeks);E.advance(s,1);
 assert.equal(s.runStatus,'ended');assert(p.bankrupt);
});
check('Switched off (furloughWeeks 0): nothing closes',()=>{
 const old=R.furloughWeeks;R.furloughWeeks=0;try{const s=fresh(),c=s.companies.find(x=>!x.isPlayer&&!x.parentId&&!x.bankrupt);broke(s,c,500);E.advance(s,1);assert(!c.bankrupt);}finally{R.furloughWeeks=old;}
});
assert.equal(total,N);console.log('R6 tests',total+'/'+N);
