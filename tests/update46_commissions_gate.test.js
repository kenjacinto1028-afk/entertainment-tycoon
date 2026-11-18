'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let pass=0;
function test(name,fn){try{let result=fn();console.log('PASS',name,JSON.stringify(result||{}));pass++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function valid(s){A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);}
function start(seed,sector='publishing'){
 const origin={publishing:'established',movie:'film',tv:'tv',games:'games'}[sector];const s=E.createGame({era:25,origin,seed,startingCapital:'funded',aiCount:12});
 const data={sector,route:'contract',title:'Client manuscript '+sector,size:.6};const q=E.previewProject(s,{...data,clientId:'auto',withForecast:false});const client=E.eligibleClients(s,q.contractFee)[0];A(client);const o=E.requestCommission(s,{...data,clientId:client.id});A.equal(o.status,'accepted');const p=E.createProject(s,{...data,clientId:client.id,offerId:o.id});return {s,p,o,client};
}
test('client escrow survives insolvency of buyer after funding in all media',()=>{
 const rows=[];for(const sec of ['publishing','movie','tv','games']){
  const {s,p,client}=start('default46-'+sec,sec);const fee=p.earnedFee;
  client.bankrupt=true;const initial=client.finance.cash;
  for(let i=0;i<105&&p.status==='active';i++)E.advance(s,1);
  A.equal(p.status,'released');const escrow=s.escrows.find(x=>x.id===p.escrowId);A(escrow.settled);A.equal(p.directRevenue,fee);A.equal(client.finance.cash,initial,'escrow was funded before default; no new buyer cash spent');
  A.equal(s.commissionHistory.find(h=>h.projectId===p.id).outcome,'delivered');valid(s);rows.push({sec,fee});
 }return rows;
});
test('earned milestone kept and only unearned escrow refunded after cancellation',()=>{
 const {s,p,client}=start('refund46');const e=s.escrows.find(x=>x.id===p.escrowId);
 for(let i=0;i<30&& !e.milestoneDone;i++)E.advance(s,1);
 A(e.milestoneDone);const buyerBefore=client.finance.cash,earned=e.advance+e.milestonePaid,held=e.held;
 E.cancelProject(s,p.id);A.equal(client.finance.cash,Math.round((buyerBefore+held)*100)/100);A.equal(e.held,0);A(e.settled&&e.cancelled);A.equal(p.directRevenue,earned);valid(s);
 return {earned,refunded:held};
});
test('a booked commission offer cannot be executed twice or exceed client cash',()=>{
 const {s,p,o}=start('replay46');A.equal(o.status,'booked');A.throws(()=>E.createProject(s,{sector:p.sector,route:'contract',title:p.title,size:p.size,clientId:p.clientId,offerId:o.id}),/booked|offer|available|team/i);
 A.equal(s.escrows.length,1);valid(s);
});
test('unfunded new commission refused even when paid client previously commissioned',()=>{
 const {s,client}=start('no-extra46');const before=s.escrows.length;
 const row=E.requestCommission(s,{sector:'publishing',route:'contract',title:'Unfunded refund',size:.5,clientId:client.id,fee:999999});
 A.equal(row.status,'counter');A.equal(s.escrows.length,before);
 A.throws(()=>E.createProject(s,{sector:'publishing',route:'contract',title:row.title,size:.5,clientId:client.id,offerId:row.id}),/offer|accepted/i);
 A.equal(s.escrows.length,before);valid(s);
});
test('co-producer reserve refunded on cancellation; never transferred underlying IP',()=>{
 const s=E.createGame({seed:'co-default46',era:25,origin:'established',startingCapital:'funded',aiCount:12});
 const data={sector:'publishing',route:'original',title:'Funded partner test',genre:'Fantasy',size:.6,capitalFraction:.3};
 const q=E.coProductionQuote(s,data);A(q.partners.length>0);const partner=q.partners[0];
 const p=E.startCoProduction(s,{...data,partnerId:partner.id});const d=s.coProductions.find(x=>x.projectId===p.id),buyer=E.company(s,partner.id);
 A(d.held>0);const oldId=p.ipId;A.equal(s.ips.find(i=>i.id===oldId).ownerId,s.playerId);const before=buyer.finance.cash;
 E.cancelProject(s,p.id);A.equal(d.held,0);A.equal(d.status,'cancelled');A.equal(buyer.finance.cash,before+d.refunded);A.equal(s.ips.find(i=>i.id===oldId).ownerId,s.playerId);valid(s);
 return {reserve:d.commitment,refunded:d.refunded,spent:d.spent};
});
console.log(`Update46 contracts ${pass}/5`);if(pass!==5)process.exitCode=1;
