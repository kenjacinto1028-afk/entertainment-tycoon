'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');
const s=E.createGame({era:25,origin:'games',seed:'u49-service-economy',startingCapital:'funded',regionCount:2,aiCount:3});
const p=E.createProject(s,{sector:'games',route:'original',title:'Competitive Season',size:.55});
E.gameDesign(s,p.id,{mechanic:'strategy',platform:'pc',scope:'focused'});
for(let i=0;i<90&&p.status==='active';i++)E.advance(s,1);
A.equal(p.status,'released');
const baseline=E.loadState(JSON.stringify(s)),b=baseline.projects.find(x=>x.id===p.id),before=E.player(s).finance.cash;
E.gameLiveService49(s,p.id,'start');A.equal(E.player(s).finance.cash,before-1250);
for(let i=0;i<16;i++){E.advance(s,1);E.advance(baseline,1);}
A(p.stats.totalSales>b.stats.totalSales,'Paid ongoing community work must improve real title interest inside the consumer wallet');
const incremental=+(p.stats.totalSales-b.stats.totalSales).toFixed(2);
for(let i=0;i<156;i++)E.advance(s,1);
const live=p.videoGame.liveService49;
A(live.billed>=2);A.equal(live.totalPaid,live.billed*1250);
A.deepEqual(E.audit(s),[]);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);
console.log('PASS 19: three-year paid community operations',JSON.stringify({billings:live.billed,paid:live.totalPaid,status:live.status,incremental16WeekGross:incremental,lateYear:E.yearAt(s.week),history:live.history.length}));
