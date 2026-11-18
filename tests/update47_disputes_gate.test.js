'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function check(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function build(seed='dispute-47',sector='publishing'){
 const s=E.createGame({seed,era:25,origin:{publishing:'established',movie:'film',tv:'tv',games:'games'}[sector],startingCapital:'funded',aiCount:10,depth:'veryComplex'});// manual dispute flow (D3 auto-settles disputes in Simple/Standard)
 const data={sector,route:'contract',title:'Independent funded job',size:.6,clientId:'auto'};
 const quote=E.previewProject(s,{...data,withForecast:false});const client=E.eligibleClients(s,quote.contractFee)[0];A(client);
 const offer=E.requestCommission(s,{...data,clientId:client.id});A.equal(offer.status,'accepted');
 const p=E.createProject(s,{...data,clientId:client.id,offerId:offer.id});
 for(let i=0;i<100&&p.weeksDone<p.weeksTotal*.4;i++)E.advance(s,1);
 A.equal(p.status,'active');const review=E.commissionInspection47(s,p.id);
 return {s,p,client,review,e:s.escrows.find(e=>e.projectId===p.id)};
}
function challenged(prefix,sec='publishing'){for(let i=0;i<30;i++){let r=build(prefix+'-'+i,sec);if(r.review.status==='open')return r;}throw Error('No reproducible challenged funded job');}
function audit(s){A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);}
check('client disputes pause active work and protected cash through save/load',()=>{
 const {s,p,e}=challenged('hold');const old=e.held,oldWork=p.weeksDone;const restored=E.loadState(JSON.stringify(s));E.advance(restored,6);
 const again=restored.projects.find(x=>x.id===p.id);A.equal(again.weeksDone,oldWork);A.equal(restored.escrows.find(x=>x.id===e.id).held,old);audit(restored);return {held:old,pausedWeeks:6};
});
check('funded remedy costs real cash, extends project and releases full reserved escrow only on delivery',()=>{
 const {s,p,e}=challenged('rework');const cash=E.player(s).finance.cash,original=p.weeksTotal;
 const result=E.commissionResolve47(s,p.id,'rework');A(result.cost>0);A.equal(E.player(s).finance.cash,cash-result.cost);A.equal(p.weeksTotal,original+2);
 for(let i=0;i<110&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');A(e.settled);A.equal(e.held,0);A.equal(p.directRevenue,p.earnedFee);audit(E.loadState(JSON.stringify(s)));
 return {cost:result.cost,fee:p.earnedFee};
});
check('arbitration splits previously funded reserve, preserves earned milestones and client prepayment accounting',()=>{
 const {s,p,e,client}=challenged('arbitration','movie');const balance=client.finance.cash,seller=E.player(s),before=seller.finance.cash;
 const held=e.held,earned=e.advance+e.milestonePaid,ans=E.commissionResolve47(s,p.id,'arbitrate');
 A.equal(Math.round((ans.refunded+ans.sellerAward)*100)/100,held);A(Math.abs(client.finance.cash-(balance+ans.refunded))<.011);A(Math.abs(seller.finance.cash-(before+ans.sellerAward))<.011);
 A.equal(p.directRevenue,Math.round((earned+ans.sellerAward)*100)/100);A.equal(p.status,'cancelled');A(e.settled);
 A.throws(()=>E.commissionResolve47(s,p.id,'arbitrate'),/outstanding/i);audit(E.loadState(JSON.stringify(s)));
 return {protected:held,refunded:ans.refunded,award:ans.sellerAward};
});
check('disputed canceled job refunds unearned funds without duplicating outcome',()=>{
 const {s,p,e,client}=challenged('cancel','games');const cash=client.finance.cash,held=e.held;
 E.commissionResolve47(s,p.id,'cancel');A.equal(client.finance.cash,cash+held);A.equal(e.review47.status,'cancelled');
 A.equal(s.commissionHistory.filter(x=>x.projectId===p.id).length,1);audit(s);
 return {refund:held};
});
console.log(`Update47 disputes ${n}/4`);if(n!==4)process.exitCode=1;
