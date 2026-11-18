'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let passed=0;
function test(name,fn){try{let x=fn();console.log('PASS',name,JSON.stringify(x||{}));passed++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032)};
const make=seed=>E.createGame({era:25,origin:'games',seed,startingCapital:'funded',aiCount:10,regionCount:2});
const release=(s,companyId,title)=>{const p=E.createProject(s,{companyId,sector:'games',route:'original',title,size:.6});for(let i=0;i<90&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');return p};
test('21: first-party own game earns actual customer receipts without external store commission',()=>{
 const s=make('update48-own-store'),p=release(s,undefined,'First Party');const st=E.openGameStore(s,{name:'Consolidated Store'});E.gameListStore(s,st.id,p.id);E.gameSelectStore(s,p.id,st.id);
 const oldFee=p.videoGame.platformFees;const oldGross=p.stats.totalSales;E.advance(s,1);
 A(p.stats.totalSales>oldGross);A.equal(p.videoGame.platformFees,oldFee,'a company cannot pay itself an external channel commission');
 A.equal(s.ledger.filter(t=>t.kind==='game-store-commission'&&t.projectId===p.id).length,0);audit(s);return {weekReceipts:p.stats.totalSales-oldGross};
});
test('21: independent paid game catalog listing routes external store commission and respects fixed license',()=>{
 const s=make('update48-rival-store');const rival=s.companies.find(c=>!c.isPlayer&&c.capabilities.games&&c.finance.cash>15000&&s.projects.filter(p=>p.companyId===c.id&&p.status==='active').length<c.capacity);A(rival);
 const p=release(s,rival.id,'Rival Game');const st=E.openGameStore(s,{name:'Partner Store'});const offer=E.gameStoreOffer(s,st.id,p.id,10000);A.equal(offer.status,'accepted');
 const beforeOwner=rival.finance.cash;const booked=E.gameListStore(s,st.id,p.id,offer.id);A(booked.fee>0);A(rival.finance.cash>beforeOwner);
 A.equal(p.videoGame.storeId,st.id,'a contracted independent title must be routed to that store when listed');
 let before=p.stats.totalSales;for(let i=0;i<4;i++)E.advance(s,1);A(p.stats.totalSales>before);
 const paid=s.ledger.filter(t=>t.kind==='game-store-commission'&&t.companyId===s.playerId&&t.projectId===p.id);A(paid.length>0,'store must receive an actual outside publisher commission');
 A(p.videoGame.platformFees>0);audit(s);const saved=E.loadState(JSON.stringify(s));audit(saved);
 return {licenseFee:booked.fee,storeReceipts:paid.length,windowEnd:booked.endWeek};
});
test('21: game subscriptions reserve one consumer wallet and expire with catalog windows',()=>{
 const s=make('update48-sub-store'),p=release(s,undefined,'Subscriber Game');const store=E.openGameStore(s,{name:'Subscription Store'});const win=E.gameListStore(s,store.id,p.id);E.gameSelectStore(s,p.id,store.id);E.gameSubscribeStore(s,store.id,true);
 let positive=0;for(let i=0;i<15;i++){
  E.advance(s,1);const subs=Object.values(store.regionSubs);const spent=subs.reduce((n,x)=>n+x.gross,0);A(Math.abs(spent-store.subscriptionGross)<.02);
  for(const r of E.activeRegions(s))A((s.gameMarketReserved[r.name]||0)<=E.worldMarketBudget(s,'games',r.name)*.18+.1);
  if((s.gameMarketReserved['North Coast']||0)>0)positive++;
 }A(positive>0);const total=store.subscriptionGross;while(s.week<=win.endWeek+18)E.advance(s,1);
 A.equal(E.gameWindows(s,store.id).length,0);A(store.subscriptionGross>=total);audit(s);
 return {subscriptionGross:store.subscriptionGross,windowExpired:true};
});
console.log(`UPDATE48 STORE ${passed}/3`);if(passed!==3)process.exitCode=1;
