'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function world(seed,years=7){const s=E.createGame({era:25,origin:'established',seed,aiCount:12,worldScale:2,regionCount:4,startingCapital:'funded'});
 for(let i=0;i<years*52;i++)E.advance(s,1);A.deepEqual(E.audit(s),[]);return s;}
test('autonomous competitors sign real co-production agreements backed by sponsor cash, not player cash',()=>{
 const s=world('rival-47-real',8),deals=s.coProductions.filter(d=>d.producerId!==s.playerId);A(deals.length>0);
 for(const d of deals){A(d.sponsorId!==s.playerId);A(d.producerId!==s.playerId);A(d.sponsorId!==d.producerId);
  A(d.commitment>0);A(d.spent>=0&&d.refunded>=0&&d.held>=0);
  A(Math.abs(d.commitment-d.spent-d.refunded-d.held)<.032);
  const p=s.projects.find(p=>p.id===d.projectId);A(p&&p.companyId===d.producerId);A(s.ips.find(x=>x.id===p.ipId)?.ownerId===d.producerId);
 }
 A.equal(E.player(s).finance.internalRevenue,0);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {rivalDeals:deals.length,committed:Math.round(deals.reduce((v,d)=>v+d.commitment,0))};
});
test('rivals make bounded multi-year plans and execute cash-funded capacity or vendor improvements',()=>{
 const s=world('rival-47-planning',7),rivals=s.companies.filter(c=>c.aiIdentity&&!c.isPlayer);
 A(rivals.length>4);A(rivals.some(c=>c.aiPlan.reviewWeek>s.week-52));
 for(const c of rivals){A(c.aiPlan.budgetCeiling>=0);A(c.aiPlan.source==='private-company-plan');A(c.aiPlan.endWeek>=c.aiPlan.issuedWeek+104);
  A(c.finance.cash>=-.05||c.finance.payable>0);
 }
 const actual=s.rivalEvents.filter(x=>x.kind==='expansion'||x.kind==='tech-investment'||x.kind==='funded-industry-debut'||x.kind==='founder-funded-entry');
 A(actual.length>0);A(actual.every(x=>x.week<=s.week));
 return {rivals:rivals.length,executedActions:actual.length};
});
test('reconstructed public industry intelligence never leaks private cash or exact competitor forecasts',()=>{
 const s=world('rival-47-intel',5),rival=s.companies.find(c=>c.aiIdentity&&!c.isPlayer);
 const before=JSON.stringify(s),intel=E.rivalIntelligence(s,rival.id);
 A.equal(JSON.stringify(s),before);A.equal(intel.publicFacts.source,'known');A.equal(intel.strategy.source,'estimated');
 A(['unknown','estimated'].includes(intel.financialEstimate.source));
 A.equal(intel.strategy.cash,undefined);A(!JSON.stringify(intel).includes('principalOutstanding'));
 const leaderboard=E.rivalMarketConcentration(s,rival.sector);A(leaderboard.topThreeShare>=0&&leaderboard.topThreeShare<=1.01);
 return {name:itelName(intel),privateEstimates:intel.financialEstimate.source};
 function itelName(v){return v.publicFacts.name;}
});
test('yearly autonomous entry comes from finite founders and insolvencies preserve historical rival identities',()=>{
 const s=E.createGame({era:1,origin:'publisher',seed:'rival-47-entry',aiCount:5,worldScale:2});
 const opening=s.entrepreneurPool;for(let k=0;k<12*52;k++)E.advance(s,1);
 const debuts=s.debutFundings44||[],pop=s.rivalEvents.filter(x=>x.kind==='founder-funded-entry');
 A(debuts.length>0);A(s.entrepreneurPool<=opening+1);A(s.entrepreneurPool>=0);
 A(pop.every(x=>E.company(s,x.companyId)?.foundedYear===E.yearAt(x.week)));
 A(s.companies.every(x=>!!x.id));A.deepEqual(E.audit(s),[]);
 return {debutEntrants:debuts.length,newEntrants:pop.length,companyCount:s.companies.length};
});
console.log('Update47 rivals '+n+'/4');if(n!==4)process.exitCode=1;
