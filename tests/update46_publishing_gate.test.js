'use strict'; const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{const x=fn();console.log('PASS',name,JSON.stringify(x||{}));n++;}catch(e){console.log('FAIL',name,e.stack);process.exitCode=1;}}
const init=(seed)=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',regionCount:4,aiCount:6});
const verify=(s)=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.financialStatements(s).balance.difference)<.032);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);};
test('print run stock and revenue reconcile through returns, manual reprint and disposal',()=>{
 const s=init('print-gate46'),p=E.createProject(s,{title:'Reprint Rights',sector:'publishing',format:'Novel',route:'original',size:.8});
 for(let i=0;i<35&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 for(let i=0;i<8;i++)E.advance(s,1);
 const b=p.printStock;A(b.printed>0);A(b.sold>0);A.equal(b.printed,b.stock+b.sold-b.returned+b.writtenOff);
 const ordered=E.orderPrintRun(s,p.id,100);A.equal(ordered.copies,100);
 E.setPrintPolicy(s,p.id,true);E.writeOffPrintStock(s,p.id,Math.min(4,b.stock));A.equal(b.printed,b.stock+b.sold-b.returned+b.writtenOff);
 const sold=p.stats.totalSales;A(E.publishingSalesReport(s,p.id).totalUnits>0);A(E.publishingSalesReport(s,p.id).unitsHistoryComplete);A(sold>0);verify(s);
 return {printed:b.printed,sold:b.sold,returned:b.returned,writtenOff:b.writtenOff,cogs:b.cogs};
});
test('ebook and audiobook use distinct paid finishing treatments but no physical stock',()=>{
 const s=init('digital-audio46');const rows=[];
 for(const [format,focus] of [['Ebook','conversion'],['Audiobook','narration']]){
  const p=E.createProject(s,{title:'Digital '+format,sector:'publishing',format,route:'original',size:.65});const cash=E.player(s).finance.cash;
  const fx=E.publishingFormatTreatment(s,p.id,focus);A(fx.cost>0);A(E.player(s).finance.cash<cash);
  A.throws(()=>E.publishingFormatTreatment(s,p.id,focus),/already/);
  for(let i=0;i<50&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');A.equal(p.printStock,null);
  for(let i=0;i<7;i++)E.advance(s,1);
  A(p.stats.totalSales>0);A.equal(E.publishingSalesReport(s,p.id).unitPrice,E.PUBLISHING_PRICES[format]);rows.push({format,gross:p.directRevenue,grossSales:p.stats.totalSales});
 }verify(s);return rows;
});
test('translator payment, preorders without cash, owned outlet and imprint do not double-book sales',()=>{
 const s=init('translation-outlet46'),c=E.player(s),p=E.createProject(s,{title:'A Manuscript World',sector:'publishing',format:'Novel',route:'original',size:.7});
 const before=c.finance.revenue;const pre=E.openPublishingPreorders(s,p.id);A.equal(pre.paidDeposits,0);A.equal(c.finance.revenue,before);
 const imprint=E.createPublishingImprint(s,{name:'Northern Classics',genre:'Fantasy'});E.assignPublishingImprint(s,p.id,imprint.id);
 const outlet=E.openPublishingOutlet(s);E.listPublishingOutlet(s,p.id);E.setPublishingChannel(s,p.id,'owned');
 for(let i=0;i<40&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 for(let i=0;i<8;i++)E.advance(s,1);
 const prior=p.directCost;const t=E.translatePublishingEdition(s,p.id,'Central Reach');A.equal(p.directCost,prior+t.cost);A.throws(()=>E.translatePublishingEdition(s,p.id,'Central Reach'),/already/);
 A(E.publishingOutletReport(s).customerGross>=0);A(E.publishingImprintReport(s,imprint.id).directRevenue===p.directRevenue);E.closePublishingOutlet(s);verify(s);
 return {preRegistrations:pre.registrations,outletGross:outlet.customerGross,editionGross:p.directRevenue};
});
test('manuscript advances recoup once and recurring sales royalties settle to original owner',()=>{
 const s=init('manuscript-royalty46'),m=E.manuscriptMarket(s)[0];A(m);
 const offer=E.negotiateManuscript(s,m.id);const grant=E.answerManuscript(s,offer.id,true);
 A.equal(grant.holderId,s.playerId);A.equal(grant.recoupableAdvance,m.advance);
 const p=E.createProject(s,{sector:'publishing',route:'adaptation',ipId:m.ipId,format:'Novel',title:'Licensed Manuscript Edition',genre:m.genre,size:.75});
 for(let i=0;i<50&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');for(let i=0;i<14;i++)E.advance(s,1);
 const royalty=E.royaltyStatements(s),receiving=E.royaltyStatements(s,grant.grantorId);
 A(royalty.accounts.length>0);A(royalty.totals.accrued>=royalty.totals.paid);A(royalty.totals.recouped<=grant.recoupableAdvance);
 A.equal(royalty.reconciliation.difference,0);A.equal(receiving.creditorTotals.paid,royalty.totals.paid);A.equal(s.ips.find(x=>x.id===m.ipId).ownerId,grant.grantorId);
 verify(s);return {gross:p.directRevenue,royalties:royalty.totals,ownerPaid:receiving.creditorTotals.paid};
});
console.log(`Update46 publishing ${n}/4`);if(n!==4)process.exitCode=1;
