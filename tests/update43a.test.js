'use strict';
const assert=require('node:assert/strict'),E=require('../dist/engine.js');let count=0;
function check(name,fn){fn();console.log('PASS',name);count++}
check('Year1 has 8 years literary-only generated history with no fabricated cash',()=>{
 const s=E.createGame({era:1,seed:'Y1A'}),h=s.prehistoryWorks;assert.equal(h.length,9);
 assert(h.every(x=>x.sector==='publishing'&&x.year<=0&&x.financials==='not reconstructed'));
 assert.equal(E.audit(s).length,0);
});
check('Year25 has deterministic era-valid archives and independent company age',()=>{
 const a=E.createGame({era:25,seed:'Y25A'}),b=E.createGame({era:25,seed:'Y25A'});
 assert.deepEqual(a.prehistoryWorks,b.prehistoryWorks);
 assert(a.prehistoryWorks.some(x=>x.sector==='games'&&x.year>=10));
 assert(!a.prehistoryWorks.some(x=>x.year>0&&x.year<E.SECTORS[x.sector].year));
 assert.equal(E.eraOverview43(a).companyAge,0);assert.equal(E.audit(a).length,0);
});
check('Configurable staff profile spends real cash and adds finite capacity',()=>{
 const a=E.createGame({era:1,seed:'staff'}),b=E.createGame({era:1,seed:'staff',startupProfile:'team'});
 assert.equal(E.player(b).capacity,E.player(a).capacity+1);
 assert(E.player(b).finance.cash<E.player(a).finance.cash);
 assert.equal(E.audit(b).length,0);
});
check('Partner-ready paid startup in mature world but prohibited before global debut',()=>{
 assert.throws(()=>E.createGame({era:1,startupProfile:'partner'}),/No separate production sector/);
 const s=E.createGame({era:25,origin:'publisher',seed:'partner',startupProfile:'partner'});
 assert.equal(E.player(s).capabilities.movie,'partner');assert(E.player(s).startupProfileCost>0);
 assert.equal(E.audit(s).length,0);
});
check('Readiness separates global access, real company capability, finite work slots',()=>{
 const s=E.createGame({era:1,seed:'ready'});
 assert.equal(E.capabilityReadiness43(s,'movie').globallyAvailable,false);
 assert.equal(E.capabilityReadiness43(s,'movie').canProduce,false);
 assert.equal(E.capabilityReadiness43(s,'publishing').canProduce,true);
 assert.equal(E.productionPath43(s,'games').phases.includes('certification'),true);
});
check('Management mode is granular, optional, and persists without changing ownership',()=>{
 const s=E.createGame({seed:'delegate',era:1});let c=E.player(s),cash=c.finance.cash;
 E.setManagement43(s,{mode:'delegated',scope:'corporate',spendLimit:3500});
 E.setManagement43(s,{mode:'delegated',scope:'team',id:c.teams[0].id,spendLimit:3500});
 assert.equal(E.managementStatus43(s).teamModes[c.teams[0].id],'delegated');
 assert.equal(E.player(s).finance.cash,cash);assert.equal(s.rightsPolicy.autoRenew,true);
 assert.equal(E.audit(E.loadState(JSON.stringify(s))).length,0);
});
check('Delegation spends on authorized idle team, not free skill or rights waiver',()=>{
 const s=E.createGame({seed:'training',era:1});const t=E.player(s).teams[0];
 E.setManagement43(s,{scope:'corporate',mode:'delegated',spendLimit:3500});
 E.setManagement43(s,{scope:'team',id:t.id,mode:'delegated'});
 const original=t.skill;for(let i=0;i<13;i++)E.advance(s,1);
 assert(t.skill>=original);assert(E.managementStatus43(s).actions.some(a=>a.kind==='team-mentorship'));
 assert.equal(E.audit(s).length,0);
});
check('v31 save converts to v32 without fictional backfill',()=>{
 const old=JSON.stringify(require('../dist/engine.js').createGame({era:10,seed:'migrateA'}));
 const clone=JSON.parse(old);clone.version=31;delete clone.eraArchive;delete clone.prehistoryWorks;delete clone.managementDepth43;
 const a=E.loadState(clone);assert.equal(a.version,E.SAVE_VERSION);assert.equal(a.eraArchive.generated,false);
 assert.equal(a.prehistoryWorks.length,0);assert.equal(E.audit(a).length,0);
});
console.log(`UPDATE43A ${count}/${count}`);
