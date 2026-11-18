'use strict';
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const evidence=fn();console.log('PASS',label,evidence?JSON.stringify(evidence):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
function audited(s){const bad=E.audit(s);assert.deepEqual(bad,[],JSON.stringify(bad.slice(0,4)));assert(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);}
check('Four media produce distinct legal releases and reconciled customer ledgers',()=>{
 const results=[];for(const [sector,origin] of [['publishing','established'],['movie','film'],['tv','tv'],['games','games']]){
  const s=E.createGame({seed:'intermedia44-'+sector,era:25,origin,startingCapital:'funded',aiCount:4,regionCount:2});
  const startCash=E.player(s).finance.cash;
  const p=E.createProject(s,{title:'Integrated '+sector,sector,genre:'Fantasy',route:'original',size:.7});
  for(let k=0;k<66&&p.status==='active';k++)E.advance(s,1);
  assert.equal(p.status,'released',sector+' must deliver its funded release');assert(p.releaseWeek>=p.startWeek);
  assert(p.directCost>0);assert(p.quality>0);assert(p.ipId&&s.ips.some(x=>x.id===p.ipId&&x.ownerId===s.playerId));
  for(let k=0;k<8;k++)E.advance(s,1);
  assert(p.stats.totalSales>=0);audited(s);
  const statements=E.financialStatements(s);assert.equal(statements.balance.difference,0);
  results.push({sector,cashBefore:startCash,cashAfter:E.player(s).finance.cash,earnedGross:p.stats.totalSales,age:E.yearAt(s.week)});
 }
 return results;
});
check('Territory and media licenses bind independent film production and expire',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'expiry-movie44',aiCount:12,regionCount:2,depth:'veryComplex'});
 const book=E.createProject(s,{title:'Ledger Dragon',sector:'publishing',route:'original',size:.7,genre:'Fantasy'});
 const filmFirm=s.companies.find(c=>c.id!==s.playerId&&c.capabilities.movie&&c.finance.cash>50000);
 assert(filmFirm,'Need solvent film counterparty');const beforeOwnerCash=E.player(s).finance.cash;
 const grant=E.grantRightsPackage43(s,{ipId:book.ipId,holderId:filmFirm.id,media:'movie',territories:['North Coast'],fee:2500,weeks:52,exclusive:true,continuationWeeks:0});
 assert.equal(E.player(s).finance.cash,beforeOwnerCash+2500);
 assert.equal(E.canUseIp(s,filmFirm,book.ipId,'movie',s.week,'North Coast').ok,true);
 assert.equal(E.canUseIp(s,filmFirm,book.ipId,'movie',s.week,'Central Reach').ok,false);
 const film=E.createProject(s,{companyId:filmFirm.id,sector:'movie',route:'adaptation',ipId:book.ipId,title:'Ledger Dragon: Film',size:.7,genre:'Fantasy',releaseTerritories:['North Coast']});
 assert.equal(film.grantId,grant.id);
 for(let k=0;k<53;k++)E.advance(s,1);
 assert.equal(s.week>=grant.endWeek,true);assert.equal(E.canDistribute43(s,film,'North Coast'),false);
 assert.equal(E.canUseIp(s,filmFirm,book.ipId,'movie',s.week,'North Coast').ok,false);
 const gross=film.stats.totalSales;for(let i=0;i<10;i++)E.advance(s,1);
 assert.equal(film.stats.totalSales,gross,'No uncontracted post-expiry rights revenue');
 assert.equal(s.ips.find(x=>x.id===book.ipId).ownerId,s.playerId);audited(s);
 return {filmReleased:film.status==='released',grossAtExpiry:gross,royaltyLiabilities:s.obligations.length};
});
check('Pre-debut options bind future rights without permitting premature production',()=>{
 const s=E.createGame({seed:'predebut-integrated44',era:1,aiCount:5,regionCount:2}),p=E.createProject(s,{title:'Future Cinema',sector:'publishing',route:'original'});
 const counterparty=s.companies.find(c=>c.id!==s.playerId&&c.finance.cash>10000);assert(counterparty);
 const opt=E.createOption(s,p.ipId,'movie',counterparty.id,{fee:1500});
 assert(opt.endWeek>s.week);assert.throws(()=>E.createProject(s,{companyId:counterparty.id,sector:'movie',route:'adaptation',ipId:p.ipId}),/debuted/);
 assert.equal(E.canUseIp(s,counterparty,p.ipId,'movie',s.week).ok,false);audited(s);return {grants:s.grants.length};
});
check('Investment comparisons are read-only and distinguish viable strategy outcomes',()=>{
 const s=E.createGame({seed:'forecasts44',era:25,origin:'games',aiCount:8});
 const params={sector:'games',route:'original',title:'Free Horizon',size:1,genre:'Fantasy'},before=JSON.stringify(s);
 const decision=E.investmentComparison(s,params);
 assert.deepEqual(JSON.stringify(s),before);assert(Array.isArray(decision.choices)&&decision.choices.length===4);assert.deepEqual(decision.choices.map(x=>x.id),['produce','license','co-produce','wait']);
 audited(s);
 return {keys:Object.keys(decision)};
});
check('Acquired group preserves old obligations and eliminates internal artificial revenue',()=>{
 const s=E.createGame({seed:'consolidation44',era:25,aiCount:7,startingCapital:'funded'});
 const acquired=s.companies.find(c=>!c.isPlayer&&!c.parentId&&c.finance.cash>10000);assert(acquired);
 const quote=E.companyPurchaseQuote(s,acquired.id);
 if(quote.shortfall>0){const facility=E.openCreditLine(s,s.playerId,Math.max(5000,Math.ceil(quote.shortfall+5000)));E.acquireCompany(s,acquired.id,{financeWith:'line',creditLineId:facility.id});}
 else E.acquireCompany(s,acquired.id);
 const after=E.consolidatedStatements(s);assert.equal(after.balance.difference,0);
 const p=E.createProject(s,{route:'original',sector:'publishing',title:'Joint Chronicle',size:.7});
 const c=s.ips.find(x=>x.id===p.ipId);
 const first=E.consolidatedStatements(s).income.revenue;
 E.groupInternalLicense(s,c.id,acquired.id,'publishing',700,52);
 assert.equal(E.consolidatedStatements(s).income.revenue,first);
 assert.equal(acquired.parentId,s.playerId);audited(s);
 return {subsidiary:acquired.id};
});
check('Real publisher advances settle and survive load across production and sales',()=>{
 const s=E.createGame({seed:'game-publisher-integrated44',era:25,origin:'games',aiCount:12,startingCapital:'funded',regionCount:2});
 const p=E.createProject(s,{sector:'games',route:'original',title:'Silver Current',size:.7});
 const pub=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&E.gamePublisherQuote43(s,p.id,c.id).willAccept);
 assert(pub,'A real externally funded publisher must be available');const deal=E.signGamePublisher43(s,p.id,pub.id),owner=s.playerId;
 for(let n=0;n<70;n++)E.advance(s,1);
 assert.equal(deal.status,'delivered');assert(s.ips.some(i=>i.id===p.ipId&&i.ownerId===owner));
 assert(deal.royaltyAccrued>=deal.royaltyPaid);audited(s);audited(E.loadState(JSON.stringify(s)));
 return {advance:deal.advance,royalties:deal.royaltyAccrued};
});
console.log(`UPDATE44 cross-system ${total}/6 passed`);if(total!==6)process.exitCode=1;
