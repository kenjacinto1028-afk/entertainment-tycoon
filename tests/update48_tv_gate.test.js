'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');let passed=0;
function test(name,fn){try{let x=fn();console.log('PASS',name,JSON.stringify(x||{}));passed++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>{A.deepEqual(E.audit(s),[]);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032)};
function world(seed){return E.createGame({era:25,origin:'tv',seed,startingCapital:'funded',aiCount:6,regionCount:2})}
test('16 TV: production teams, writer room, episode decisions and talent exclusivity',()=>{
 const s=world('update48-tv-production');E.enterSector(s,'movie','internal');const p=E.createProject(s,{sector:'tv',route:'original',title:'No Cast Overlap',size:.65}),q=E.createProject(s,{sector:'tv',route:'original',title:'Second Set',size:.65});
 const a=E.filmActorPool(s).find(x=>x.available),cash=E.player(s).finance.cash;E.tvPlanSeason(s,p.id,10);E.tvWritersRoom(s,p.id,'character');E.tvEditEpisode(s,p.id,2,'technical');E.tvCast(s,p.id,a.id);
 A.throws(()=>E.tvCast(s,q.id,a.id),/unavailable/i);
 E.buildFilmBacklot(s);E.tvUseBacklot(s,p.id);A.throws(()=>E.tvUseBacklot(s,q.id),/occupied/i);A(p.television.writerRoom?.showrunnerId);A(p.television.episodeEdits.length===1);A(E.player(s).finance.cash<cash);audit(s);
 for(let i=0;i<90&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');A.equal(s.filmActors.find(x=>x.id===a.id).busyProjectId,null);
 const next=E.tvRenewSeason(s,p.id,{episodes:8,castAgain:true});A.equal(next.ipId,p.ipId);A.equal(next.television.seasonNumber,2);A.equal(next.television.previousSeasonId,p.id);A(next.television.castFee>p.television.castFee);
 A.throws(()=>E.tvRenewSeason(s,p.id,{episodes:8}),/released, continuing/i);audit(s);return {season2:next.id,castFee:next.television.castFee};
});
test('17 TV: multiple network shows share finite advertising wallet and legal syndication window',()=>{
 const s=world('update48-tv-ads'),p=E.createProject(s,{sector:'tv',route:'original',title:'Prime Window',size:.65}),q=E.createProject(s,{sector:'tv',route:'original',title:'Day Window',size:.65});
 E.tvSchedule(s,p.id,'commercial','prime');E.tvSchedule(s,q.id,'public','daytime');
 for(let i=0;i<90&&(p.status==='active'||q.status==='active');i++)E.advance(s,1);
 A.equal(p.status,'released');A.equal(q.status,'released');
 for(let i=0;i<26;i++){
  E.advance(s,1);let all=0;
  for(const t of s.projects.filter(t=>t.sector==='tv'&&t.status==='released'))all+=t.television.weeklyRatings.filter(w=>w.week===s.week).reduce((n,w)=>n+w.gross,0);
  const available=E.activeRegions(s).reduce((n,r)=>n+E.worldMarketBudget(s,'tv',r.name),0);
  A(all<=available+.1,`TV paid receipts ${all} > shared TV wallet ${available}`);
 }
 const r=E.tvRatings(s,p.id);A(r.channels['first-run']>0);A(r.channels.syndication>0);A(r.totalAdGross>0);A(r.regionalAdGross['North Coast']>0);
 A(r.estimatedViewers['North Coast']>0);A.equal(typeof r.classification,'string');A(!s.news.some(n=>n.week>s.week));audit(s);
 E.tvEndSeries(s,p.id);A.throws(()=>E.tvRenewSeason(s,p.id,{}),/continuing/i);audit(s);return {totalAdGross:r.totalAdGross,syndication:r.channels.syndication};
});
test('17 TV: age classification remains separate from critic, audience and awards',()=>{
 const s=world('update48-tv-awards'),p=E.createProject(s,{sector:'tv',route:'original',title:'Boundary Awards',size:.5,targetAudience:'mature'});E.tvSchedule(s,p.id,'premium','late');
 for(let i=0;i<80&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');A.equal(p.television.classification,'M');A(p.criticScore!==null&&p.audienceScore!==null);
 for(let i=0;i<125&&!s.tvHonors.some(a=>a.projectId===p.id);i++)E.advance(s,1);
 const award=s.tvHonors.find(a=>a.projectId===p.id);A(award?.projectId===p.id);A.equal(award.source,'observed');A(award.week>p.releaseWeek);audit(s);return {classification:p.television.classification,award:award.name};
});
test('17 TV: syndication rights expire by territory and stop unauthorized receipts',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'update48-tv-rights',startingCapital:'funded',aiCount:9,regionCount:2}),book=E.createProject(s,{sector:'publishing',route:'original',title:'Station Story',size:.6});
 const broadcaster=s.companies.find(c=>!c.isPlayer&&c.capabilities.tv&&c.finance.cash>18000);A(broadcaster);
 const grant=E.grantRightsPackage43(s,{ipId:book.ipId,holderId:broadcaster.id,media:'tv',territories:['North Coast'],fee:2500,weeks:70,exclusive:true,continuationWeeks:0});
 const season=E.createProject(s,{companyId:broadcaster.id,sector:'tv',route:'adaptation',title:'Station Story on Air',ipId:book.ipId,size:.6,releaseTerritories:['North Coast']});
 for(let i=0;i<90&&season.status==='active';i++)E.advance(s,1);A.equal(season.status,'released');
 while(s.week<grant.endWeek)E.advance(s,1);const gross=season.stats.totalSales;for(let i=0;i<12;i++)E.advance(s,1);
 A.equal(season.stats.totalSales,gross,'expired TV distribution may not collect additional syndication receipts');
 A.equal(E.canDistribute43(s,season,'North Coast'),false);audit(s);return {grossAtExpiry:gross,expiry:grant.endWeek};
});
console.log(`UPDATE48 TV ${passed}/4`);if(passed!==4)process.exitCode=1;
