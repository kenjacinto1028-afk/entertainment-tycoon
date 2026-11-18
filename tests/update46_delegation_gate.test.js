'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const init=seed=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:10});
const audit=s=>A.deepEqual(E.audit(s),[]);
test('dashboard layout is persisted in versioned save without changing world',()=>{
 const s=init('layout46'),cash=E.player(s).finance.cash,world=JSON.stringify(s.companies);
 for(const mode of ['franchise','finance','operations']){
  E.setDashboardFocus(s,mode);const restored=E.loadState(JSON.stringify(s));A.equal(restored.dashboardFocus,mode);A.equal(E.player(s).finance.cash,cash);
 }
 A.throws(()=>E.setDashboardFocus(s,'secret'),/layout/);A.equal(JSON.stringify(s.companies),world);audit(s);
 return {focus:s.dashboardFocus,slots:3};
});
test('batch can accept two distinct counteroffer terms without booking real cash or productions',()=>{
 const s=init('batch-mixed46'),c=E.player(s),data={sector:'publishing',route:'contract',title:'Editorial Buyer',size:.65};
 const q=E.previewProject(s,{...data,clientId:'auto',withForecast:false});const client=E.eligibleClients(s,q.contractFee)[0];A(client);
 const offer=E.requestCommission(s,{...data,clientId:client.id,fee:q.contractFee*1.55});A.equal(offer.status,'counter');
 const partnerData={sector:'publishing',route:'original',title:'Shared Film Option',size:.65,capitalFraction:.2,participationShare:.05};
 const coQuote=E.coProductionQuote(s,partnerData),partner=coQuote.partners[0];A(partner);
 const coOffer=E.proposeCoProduction(s,{...partnerData,partnerId:partner.id});A.equal(coOffer.status,'counter');
 E.configureCommissionAuthority(s,{autoCounter:true,maxFee:30000,minMargin:.05});E.configureCoProductionAuthority(s,{autoCounter:true,maxCommitment:25000,maxShare:.35});
 A.equal(E.routineCounterQueue(s).length,2);const cash=c.finance.cash,sc=s.projects.length,held=s.escrows.length,deals=s.coProductions.length;
 const approved=E.batchApproveRoutineCounters(s,2);A.equal(approved.approved.length,2);A.equal(approved.deferred.length,0);
 A.equal(offer.status,'accepted');A.equal(coOffer.status,'accepted');A.equal(c.finance.cash,cash);A.equal(s.projects.length,sc);A.equal(s.escrows.length,held);A.equal(s.coProductions.length,deals);
 A.equal(E.routineCounterQueue(s).length,0);audit(s);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {approved:approved.approved.map(x=>x.kind),cash,projects:s.projects.length};
});
test('mixed batch safely defers insolvent counterparty and cannot impersonate approvals',()=>{
 const s=init('batch-deny46'),data={sector:'publishing',route:'contract',title:'Unfunded Buyer',size:.65};
 const q=E.previewProject(s,{...data,clientId:'auto',withForecast:false});const client=E.eligibleClients(s,q.contractFee)[0];A(client);
 const o=E.requestCommission(s,{...data,clientId:client.id,fee:q.contractFee*1.55});A.equal(o.status,'counter');
 E.configureCommissionAuthority(s,{autoCounter:true,maxFee:30000,minMargin:0});A(E.routineCounterQueue(s).length>=1);
 client.bankrupt=true;const num=s.projects.length;const cash=E.player(s).finance.cash;
 const batch=E.batchApproveRoutineCounters(s,10);A.equal(batch.approved.length,0);A.equal(batch.deferred.length,1);A.equal(o.status,'counter');
 A.equal(s.projects.length,num);A.equal(E.player(s).finance.cash,cash);
 A.throws(()=>E.batchApproveRoutineCounters(s,11),/1–10/);audit(s);return {deferred:batch.deferred[0].reason};
});
console.log(`Update46 delegation ${n}/3`);if(n!==3)process.exitCode=1;
