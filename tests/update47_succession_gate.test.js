'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const make=x=>E.createGame({seed:x,era:25,origin:'established',startingCapital:'funded',aiCount:6});
test('elected lawful employee receives management authority but no founder shares or source-IP',()=>{
 const s=make('succession-47-a'),c=E.player(s),old=c.corporate.shares.founder;
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'Prior owner franchise',size:.55});
 const appointed=s.employees.find(e=>e.employerId===c.id&&e.status==='employed');E.planLeadership(s,appointed.id);E.stepDown(s);
 const role=E.chooseLeader(s,appointed.id);A.equal(role.personId,appointed.id);A.equal(role.status,'active');
 A.equal(c.corporate.shares.founder,old);A.equal(s.ips.find(x=>x.id===p.ipId).ownerId,c.id);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {employee:appointed.id,shares:old};
});
test('shareholder loss of control permits only personally funded new studio; legacy company retains assets and debts',()=>{
 const s=make('succession-47-b'),old=E.player(s);
 const p=E.createProject(s,{sector:'publishing',route:'original',title:'The original company property',size:.55});
 A(E.corporateReadiness(s).eligible);E.incorporateStudio(s);
 const sale=E.sellFounderShares(s,600);A(sale.proceeds>25000);
 A.equal(s.management.status,'removed');const before=s.founderFunds,oldEquity=old.finance.equity,oldCash=old.finance.cash,owner=old.id;
 const independent=E.startFreshCompany(s,{name:'New Independent Edition',sector:'publishing',capital:27000}); // 2026-11-18 retune: publishing reserve is now 15000*1.75=26250
 A.equal(s.playerId,independent.id);A.equal(independent.parentId,null);A.equal(old.isPlayer,false);
 A.equal(s.ips.find(x=>x.id===p.ipId).ownerId,owner);A.equal(old.finance.equity,oldEquity);A.equal(old.finance.cash,oldCash);
 A.equal(s.founderFunds,before-27000);A.equal(independent.finance.cash,27000);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {oldCompany:owner,newCompany:independent.id,founderPersonalCash:s.founderFunds};
});
test('new entity cannot be conjured before loss of lawful executive role or from zero founder funds',()=>{
 const s=make('succession-47-c');A.throws(()=>E.startFreshCompany(s,{name:'Unlawful transfer',sector:'publishing',capital:25000}),/lawful exit/i);
 E.stepDown(s);A.throws(()=>E.startFreshCompany(s,{name:'Unfunded future',sector:'publishing',capital:25000}),/founder funds/i);
 A.deepEqual(E.audit(s),[]);return {control:s.management.status};
});
test('ending a run preserves historical campaign and disallows future financial transactions',()=>{
 const s=make('succession-47-d');const companyId=s.playerId,history=E.careerHistory(s);
 E.stepDown(s);E.endRun(s);A.equal(s.runStatus,'ended');A.equal(E.advance(s,4).weeks,0);
 A.equal(E.careerHistory(s).runStatus,'ended');A.equal(companyId,s.playerId);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {endStatus:s.runStatus,started:history.runStatus};
});
console.log('Update47 succession '+n+'/4');if(n!==4)process.exitCode=1;
