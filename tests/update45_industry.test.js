'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function check(label,fn){try{const detail=fn();console.log('PASS',label,JSON.stringify(detail||{}));n++;}catch(error){console.error('FAIL',label,error.stack);process.exitCode=1;}}
const audit=s=>A.deepEqual(E.audit(s),[]);
check('Publishing: paid promotion, physical inventory, unit sales, translation, writeoffs',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'publishing45',startingCapital:'funded',aiCount:6,regionCount:3});
 const p=E.createProject(s,{sector:'publishing',title:'Printing Principle',route:'original',format:'Novel',size:.7});
 const interests=E.openPublishingPreorders(s,p.id);A.equal(interests.paidDeposits,0);
 for(let i=0;i<60&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');A(p.printStock&&p.printStock.printed>0);
 for(let i=0;i<8;i++)E.advance(s,1);
 const before=p.stats.totalSales,old=p.printStock.stock;
 E.translatePublishingEdition(s,p.id,'Central Reach');A(p.translations.length===1);
 if(p.printStock.stock>0)E.writeOffPrintStock(s,p.id,Math.min(5,p.printStock.stock));
 A(p.printStock.stock<=old);A(p.stats.totalSales>=before);
 A(Math.abs(E.financialStatements(s).balance.difference)<.032);audit(s);
 return {printed:p.printStock.printed,sold:p.printStock.sold,returned:p.printStock.returned,writtenOff:p.printStock.writtenOff};
});
check('Movies: funded premiere and distribution, actual ticket sales vs content ratings',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'movie45',startingCapital:'funded',aiCount:7});
 const p=E.createProject(s,{sector:'movie',title:'Festival Day',route:'original',size:.7});
 E.filmDistribution(s,p.id,'wide');E.filmPremiere(s,p.id,'North Coast');
 for(let i=0;i<70&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');for(let i=0;i<12;i++)E.advance(s,1);
 const box=E.filmBoxOffice(s,p.id);A(box.totalGross>0);A.equal(typeof box.rating,'string');A(box.regionalGross.every(r=>r.estimatedAdmissions>=0));
 A(box.castPaid>=0);A(p.criticScore!==null&&p.audienceScore!==null);audit(s);
 return {gross:box.totalGross,rating:box.rating,critic:p.criticScore,audience:p.audienceScore};
});
check('Television: season ordering, optional edits, broadcaster schedule and renewal',()=>{
 const s=E.createGame({era:25,origin:'tv',seed:'tv45',startingCapital:'funded',aiCount:7});
 const p=E.createProject(s,{sector:'tv',title:'Renewal Story',route:'original',format:'Series',size:.7});
 E.tvPlanSeason(s,p.id,8);E.tvWritersRoom(s,p.id,'character');E.tvEditEpisode(s,p.id,1,'finale');E.tvSchedule(s,p.id,'commercial','prime');
 for(let i=0;i<75&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');for(let i=0;i<10;i++)E.advance(s,1);
 const r=E.tvRatings(s,p.id);A(r.totalAdGross>0);const next=E.tvRenewSeason(s,p.id,{episodes:6,castAgain:false});
 A.equal(next.ipId,p.ipId);A.equal(next.television.seasonNumber,2);A.equal(next.status,'active');audit(s);
 return {gross:r.totalAdGross,episodes:next.television.episodes,ip:p.ipId};
});
check('Games: prototype, QA, certification, separate critic/player scores, paid patch',()=>{
 const s=E.createGame({era:25,origin:'games',seed:'games45',startingCapital:'funded',aiCount:7});
 const p=E.createProject(s,{sector:'games',title:'Safety Checks',route:'original',size:.7});
 E.gamePrototype(s,p.id,'technical');const qa=E.gameQA(s,p.id,'intensive');A(qa.defectsAfter>=0);
 for(let i=0;i<25&&p.weeksDone<p.weeksTotal*.6;i++)E.advance(s,1);
 A.equal(p.status,'active');E.gameBeta(s,p.id);const cert=E.gameCertify(s,p.id,'North Coast');A.equal(typeof cert.passed,'boolean');
 for(let i=0;i<80&&p.status==='active';i++)E.advance(s,1);
 A.equal(p.status,'released');A(p.criticScore!==null&&p.audienceScore!==null);
 E.gameSupport(s,p.id,'patch');A(p.videoGame.support.some(x=>x.kind==='patch'));audit(s);
 return {bugs:p.videoGame.bugs,certification:cert.passed,critic:p.criticScore,user:p.audienceScore};
});
check('Investment forecasts do not mutate world and postmortems compare actual vs prediction',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'forecast45',startingCapital:'funded'});
 const idea={sector:'publishing',title:'Accounting Example',route:'original',size:.7};
 const before=JSON.stringify(s),report=E.investmentComparison(s,idea);A.equal(JSON.stringify(s),before);
 A.equal(report.choices.length,4);const p=E.createProject(s,idea);
 for(let i=0;i<70;i++)E.advance(s,1);
 A(p.review);A(p.review.drivers.length>0);A(p.review.actualGross<=p.stats.totalSales,"13-week postmortem snapshot cannot include later sales");A(p.review.week>=p.releaseWeek+12);
 A.equal(typeof p.review.assessment,'string');audit(s);
 return {actual:p.review.actualGross,expected:p.review.expectedGross,assessment:p.review.assessment};
});
check('Rival private intelligence is estimated, public facts known, archive records actual releases',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'archive45',aiCount:7,startingCapital:'funded'});
 const rival=s.companies.find(c=>!c.isPlayer);const intel=E.rivalIntelligence(s,rival.id);
 A.equal(intel.publicFacts.source,'known');A.equal(intel.strategy.source,'estimated');
 const p=E.createProject(s,{sector:'publishing',title:'Archival Release',route:'original',size:.7});
 for(let i=0;i<55&&p.status==='active';i++)E.advance(s,1);
 const archive=E.searchNewsArchive(s,'Archival Release');
 A(archive.length>0);A(archive.some(x=>x.title.includes('Archival Release')||x.body?.includes('Archival Release')));
 audit(s);return {archiveRows:archive.length};
});
console.log(`UPDATE45 INDUSTRY ${n}/6`);if(n!==6)process.exitCode=1;
