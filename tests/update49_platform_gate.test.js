'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let done=0;
const check=(name,run)=>{try{const result=run();console.log('PASS',name,JSON.stringify(result));done++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}};
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);};
const make=(seed='u49',more={})=>E.createGame({era:25,origin:'games',seed,startingCapital:'funded',aiCount:3,regionCount:2,...more});
const release=(s,title='Service',mechanic='strategy')=>{
 const p=E.createProject(s,{sector:'games',route:'original',title,size:.55});E.gameDesign(s,p.id,{mechanic,platform:'pc',scope:'focused'});
 for(let i=0;i<96&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released','Legally funded team should release');return p;
};
check('19 platform emergence: zero installs before debut, regional installed audience and independent adoption rates',()=>{
 const early=E.createGame({era:10,origin:'games',seed:'year10-base',regionCount:2});
 A.equal(E.gamePlatformMarket49(early,'mobile','North Coast').installed,0);
 A.equal(E.gamePlatformMarket49(early,'console','North Coast').installed,0);
 A(E.gamePlatformMarket49(early,'pc','North Coast').installed>0);
 const slow=E.createGame({era:25,origin:'games',seed:'pace-check',adoptionPace:'slow'}),fast=E.createGame({era:25,origin:'games',seed:'pace-check',adoptionPace:'fast'});
 const a=E.gamePlatformMarket49(slow,'mobile','North Coast'),b=E.gamePlatformMarket49(fast,'mobile','North Coast');
 A(b.installed>a.installed,'Faster adoption must create wider installed base');
 A(E.gamePlatformMarket49(fast,'pc','North Coast',fast.week,1).installed>0,'Old generation preserves a niche');
 A(E.gamePlatformMarket49(fast,'pc','North Coast',fast.week,3).installed>0,'New generation has market');
 A.throws(()=>E.gamePlatformMarket49(early,'pc','North Coast',early.week,2),/generation not commercially/i);
 audit(early);return {earlyPC:E.gamePlatformMarket49(early,'pc','North Coast').installed,slowMobile:a.installed,fastMobile:b.installed};
});
check('19 released games can only sell installed-generation units from finite regional wallets, with no console creation',()=>{
 const s=E.createGame({era:10,origin:'games',seed:'u49-small-market',startingCapital:'funded',aiCount:3,regionCount:2,populationScale:.5});
 const p=release(s,'Low installed generation');let observed=0,maxSold=0;
 for(let i=0;i<35;i++){
  E.advance(s,1);const market=E.gamePlatformMarket49(s,p.videoGame.platform,'North Coast',s.week,p.videoGame.generation);
  const units=p.videoGame.salesUnits['North Coast']||0;
  A(units<=market.installed,'Cannot cumulatively sell more unique copies than installed console/PC users');
  maxSold=Math.max(maxSold,units);observed=Math.max(observed,p.videoGame.regionalGross['North Coast']||0);
 }
 A(observed>0);audit(s);return {market:E.gamePlatformMarket49(s,'pc','North Coast').installed,units:maxSold,gross:observed};
});
check('19 ongoing esports hosting is real monthly expense; pause, restore and reload preserve claims',()=>{
 const s=make('u49-service');const p=release(s);
 const cash=E.player(s).finance.cash;
 const live=E.gameLiveService49(s,p.id,'start');A.equal(live.status,'active');A.equal(live.totalPaid,1250);A.equal(E.player(s).finance.cash,cash-1250);
 for(let i=0;i<12;i++)E.advance(s,1);
 const bill=p.videoGame.liveService49;A(bill.billed>=2,'Calendar month should bill ongoing operations');A.equal(bill.totalPaid,1250*bill.billed);
 E.gameLiveService49(s,p.id,'pause');for(let i=0;i<8;i++)E.advance(s,1);
 A.equal(p.videoGame.liveService49.status,'paused');A.equal(p.videoGame.liveService49.totalPaid,1250*bill.billed);
 const beforeResume=E.player(s).finance.cash;E.gameLiveService49(s,p.id,'resume');A.equal(E.player(s).finance.cash,beforeResume-1250);
 const v=E.loadState(JSON.stringify(s));A.equal(v.projects.find(x=>x.id===p.id).videoGame.liveService49.status,'active');
 E.gameLiveService49(s,p.id,'stop');A.throws(()=>E.gameLiveService49(s,p.id,'resume'),/Only paused/i);audit(s);audit(v);
 return {payments:p.videoGame.liveService49.billed,paid:p.videoGame.liveService49.totalPaid,history:p.videoGame.liveService49.history.length};
});
check('19 service suspends automatically when business cannot fund it; unaffordable events cannot go into debt',()=>{
 const s=make('u49-strained');const p=release(s);
 E.gameLiveService49(s,p.id,'start');const c=E.player(s);
 // Spend remaining liquidity only via already audited company-funded research.
 for(let i=0;i<14&&c.finance.cash>3650;i++){
  const amount=Math.min(25000,Math.max(2500,Math.floor((c.finance.cash-1100)*100)/100));
  try{E.investResearch(s,'games',amount);}catch(e){break;}
 }
 for(let i=0;i<12&&p.videoGame.liveService49.status==='active';i++)E.advance(s,1);
 A.equal(p.videoGame.liveService49.status,'paused','Service must automatically suspend after funding loss');
 const paid=p.videoGame.liveService49.totalPaid;
 for(let i=0;i<8;i++)E.advance(s,1);
 A.equal(p.videoGame.liveService49.totalPaid,paid,'Unfunded service must not create debt or keep charging');
 audit(s);return {cash:c.finance.cash,paid,status:p.videoGame.liveService49.status};
});
console.log(`UPDATE49 PLATFORM ${done}/4`);if(done!==4)process.exitCode=1;
