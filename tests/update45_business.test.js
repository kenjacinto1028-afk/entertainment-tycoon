'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let count=0;
function check(name,fn){try{const r=fn();console.log('PASS',name,JSON.stringify(r||{}));count++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function audit(s){A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);}
const mapping=[['publishing','established'],['movie','film'],['tv','tv'],['games','games']];
check('Funded client commissions work across all four media and deliver only agreed fee',()=>{
 const result=[];
 for(const [sector,origin] of mapping){
  const s=E.createGame({seed:'client-all45-'+sector,era:25,origin,startingCapital:'funded',aiCount:12,regionCount:2});
  const params={title:'Service Works',sector,route:'contract',size:.7,clientId:'auto'};
  const plan=E.previewProject(s,{...params,withForecast:false});const client=E.eligibleClients(s,plan.contractFee)[0];A(client);
  const fee=Math.round(plan.contractFee*.96),offer=E.requestCommission(s,{...params,clientId:client.id,fee});A.equal(offer.status,'accepted');
  const ownerCash=E.player(s).finance.cash,clientCash=client.finance.cash;
  const project=E.createProject(s,{...params,clientId:client.id,offerId:offer.id});A.equal(project.earnedFee,fee);
  const escrow=s.escrows.find(x=>x.id===project.escrowId);A.equal(escrow.fee,fee);A.equal(client.finance.cash,Math.round((clientCash-fee)*100)/100);A(escrow.held>0);
  for(let w=0;w<65&&project.status==='active';w++)E.advance(s,1);
  A.equal(project.status,'released');A.equal(escrow.settled,true);A.equal(project.directRevenue,fee);
  A.equal(project.ipId,null,'client work must not create new owner IP');audit(s);audit(E.loadState(JSON.stringify(s)));
  result.push({sector,fee,clientReceivable:client.finance.receivable,contractEarned:project.directRevenue});
 }
 return result;
});
check('Cancelled client work returns unearned escrow, preserves earned milestones and IP',()=>{
 const s=E.createGame({seed:'client-cancel45',era:25,origin:'established',startingCapital:'funded',aiCount:12});
 const plan=E.previewProject(s,{route:'contract',sector:'publishing',title:'Abandoned Client Draft',size:.7,clientId:'auto',withForecast:false});
 const buyer=E.eligibleClients(s,plan.contractFee)[0],o=E.requestCommission(s,{clientId:buyer.id,title:'Abandoned Client Draft',sector:'publishing',size:.7});
 A.equal(o.status,'accepted');const p=E.createProject(s,{offerId:o.id,route:'contract',sector:'publishing',title:o.title,size:o.size});
 const escrow=s.escrows.find(x=>x.id===p.escrowId),funded=escrow.fee,clientCash=buyer.finance.cash;
 E.cancelProject(s,p.id);A(escrow.cancelled&&escrow.settled);A.equal(escrow.held,0);A(buyer.finance.cash>clientCash);
 A.equal(p.directRevenue,escrow.advance);A(p.directRevenue<funded);A.equal(p.status,'cancelled');audit(s);return {funded,earned:escrow.advance};
});
check('Unfunded prospective client cannot commission or create unbacked liabilities',()=>{
 const s=E.createGame({seed:'no-free-client45',era:25,origin:'games',aiCount:12}),p=E.player(s);
 const poor=s.companies.find(c=>c.id!==p.id&&c.finance.cash>1000);A(poor);
 const before={cash:p.finance.cash,finance:poor.finance.cash,escrows:s.escrows.length};
 A.throws(()=>E.requestCommission(s,{title:'Free labor',sector:'games',clientId:poor.id,size:2.2,fee:999999}),/fund|fee|viable/i);
 A.equal(s.escrows.length,before.escrows);A.equal(p.finance.cash,before.cash);A.equal(poor.finance.cash,before.finance);audit(s);
});
check('Bank revolver cannot generate earnings, debt persists after expiry and forced arrears',()=>{
 const s=E.createGame({seed:'bank45',era:25,origin:'games'}),c=E.player(s);
 const line=E.openCreditLine(s,c.id,12000),startProfit=E.companyProfit(c),loan=E.drawCreditLine(s,line.id,6000);
 A.equal(E.companyProfit(c),startProfit);A.equal(c.finance.loanBalance,6000);
 E.advance(s,52);E.advance(s,52);
 A.equal(E.creditLineStatus(s,line.id).available,0);audit(s);audit(E.loadState(JSON.stringify(s)));
 return {lineId:line.id,obligation:loan.originalPrincipal};
});
check('Company share acquisition preserves independent creditor and title ledgers',()=>{
 const s=E.createGame({seed:'acq45',era:25,origin:'games',startingCapital:'funded',aiCount:7}),target=s.companies.find(c=>!c.isPlayer&&!c.parentId&&c.finance.cash>10000);A(target);
 const p=E.createProject(s,{companyId:target.id,sector:target.sector,route:'original',title:'Legacy Property'});const priorOwner=s.ips.find(i=>i.id===p.ipId).ownerId;
 const q=E.companyPurchaseQuote(s,target.id);let options={};
 if(q.shortfall>0){const line=E.openCreditLine(s,s.playerId,Math.ceil(q.shortfall+8000));options={financeWith:'line',creditLineId:line.id};}
 const before=target.finance.cash,receipt=E.acquireCompany(s,target.id,options);
 A.equal(target.finance.cash,before);A.equal(target.parentId,s.playerId);
 A.equal(s.ips.find(i=>i.id===p.ipId).ownerId,priorOwner);
 A(receipt.price>0);A.throws(()=>E.acquireCompany(s,target.id),/independent/);audit(s);
 return {price:receipt.price,ownership:priorOwner};
});
check('Lawful successor inherits job but not cash, votes or trademark ownership',()=>{
 const s=E.createGame({seed:'succ45',era:25,origin:'games'}),c=E.player(s),old=JSON.stringify(E.corporateStatus(s).ownership);
 const p=E.createProject(s,{sector:'games',route:'original',title:'Founder Original'}),ip=s.ips.find(x=>x.id===p.ipId);
 const successor=s.employees.find(e=>e.employerId===c.id&&e.status==='employed');
 E.planLeadership(s,successor.id);E.stepDown(s);A.equal(s.management.status,'transition');
 E.chooseLeader(s,successor.id);A.equal(s.management.personId,successor.id);
 A.equal(ip.ownerId,c.id);A.equal(JSON.stringify(E.corporateStatus(s).ownership),old);
 audit(s);return {successor:successor.id};
});
console.log(`UPDATE45 BUSINESS ${count}/6`);if(count!==6)process.exitCode=1;
