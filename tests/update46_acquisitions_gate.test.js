'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{const r=fn();console.log('PASS',name,JSON.stringify(r||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const init=(seed)=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:10});
function audit(s){A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);}
test('paid diligence, share acquisition and group reporting preserve pre-deal owners and obligations',()=>{
 const s=init('due-diligence46'),buyer=E.player(s),target=s.companies.find(c=>!c.isPlayer&&!c.parentId&&c.sector==='publishing');A(target);
 const original=E.createProject(s,{companyId:target.id,sector:'publishing',route:'original',title:'Founding Archive 46',size:.65}),ip=s.ips.find(x=>x.id===original.ipId);
 const pubBefore=E.acquisitionDiligence(s,{id:target.id});A.equal(pubBefore.conditions.debt,null);
 const privateView=E.acquisitionDiligence(s,{id:target.id},true);A(privateView.inspected);A.equal(privateView.conditions.cash,target.finance.cash);
 const q=E.companyPurchaseQuote(s,target.id),cash=target.finance.cash,debt=target.finance.loanBalance;
 if(q.shortfall>0){const credit=E.openCreditLine(s,buyer.id,Math.max(5000,Math.ceil(q.shortfall+1500)));E.acquireCompany(s,target.id,{financeWith:'line',creditLineId:credit.id});}else E.acquireCompany(s,target.id);
 A.equal(ip.ownerId,target.id);A.equal(target.finance.cash,cash);A.equal(target.finance.loanBalance,debt);A.equal(target.parentId,buyer.id);
 A(E.groupFinanceReport(s).entities.length>=2);audit(s);audit(E.loadState(JSON.stringify(s)));
 return {targetId:target.id,ipOwner:ip.ownerId,preRevenueExcluded:E.consolidatedStatements(s).income.preacquisitionRevenueExcluded};
});
test('purchasing a finished work transfers no underlying adaptation IP',()=>{
 const s=init('finished-work46'),target=s.companies.find(c=>!c.isPlayer&&c.capabilities.publishing);A(target);
 const p=E.createProject(s,{companyId:target.id,sector:'publishing',route:'original',title:'Finished Rights 46',size:.65});
 for(let i=0;i<55&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 const work=s.works.find(w=>w.projectId===p.id);A(work);const oldIP=s.ips.find(x=>x.id===p.ipId),owner=oldIP.ownerId;
 const quote=E.assetPurchaseQuote(s,{type:'work',id:work.id});A(quote.allowed);A(!quote.includesUnderlyingIP);
 const receipt=E.acquireAsset(s,{kind:'work',id:work.id});A.equal(work.ownerId,s.playerId);A.equal(oldIP.ownerId,owner);A.equal(receipt.underlyingIpTransferred,false);
 A.equal(p.companyId,target.id);A(!E.canUseIp(s,E.player(s),p.ipId,'movie').ok);
 audit(s);return {work:work.id,oldUnderlyingOwner:owner,newWorkOwner:work.ownerId,price:receipt.price};
});
test('restructuring transfers exactly capital without deleting contracts, group cash or sale history',()=>{
 const s=init('restructure46'),parent=E.player(s);const sub=E.foundSubsidiary(s,{name:'Supported Imprint 46',sector:'publishing',capital:30000});
 const p=E.createProject(s,{companyId:sub.id,sector:'publishing',route:'original',title:'Subsidiary Owned Right',size:.65}),ip=s.ips.find(i=>i.id===p.ipId);
 const before=E.consolidatedStatements(s).balance.cash,revBefore=parent.finance.revenue+sub.finance.revenue;
 const result=E.integrateAcquisition(s,sub.id,{choice:'recapitalize',capital:8000});A.equal(result.capital,8000);A.equal(E.consolidatedStatements(s).balance.cash,before);
 A.equal(parent.finance.revenue+sub.finance.revenue,revBefore);A.equal(ip.ownerId,sub.id);A.equal(sub.parentId,parent.id);
 const saved=E.loadState(JSON.stringify(s));A.equal(saved.ips.find(i=>i.id===ip.id).ownerId,sub.id);audit(s);audit(saved);
 return {capital:result.capital,groupCash:before,legalRightOwner:ip.ownerId};
});
console.log(`Update46 acquisitions ${n}/3`);if(n!==3)process.exitCode=1;
