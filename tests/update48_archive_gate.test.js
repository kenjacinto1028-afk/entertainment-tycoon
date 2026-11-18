'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function check(name,fn){try{let r=fn();console.log('PASS',name,JSON.stringify(r||{}));n++}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1}}
const audit=s=>A.deepEqual(E.audit(s),[]);
check('27: award/press/financial and audience records come from actual releases and known-v-estimated data',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'update48-news',startingCapital:'funded',aiCount:7,regionCount:2}),p=E.createProject(s,{sector:'publishing',route:'original',title:'The Archive Promise',size:.65});
 for(let i=0;i<75&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 for(let i=0;i<75;i++)E.advance(s,1);
 const honors=E.creativeAwards(s,{sector:'publishing'});A(honors.length>0);for(const award of honors){const winner=s.projects.find(x=>x.id===award.projectId);A(winner&&winner.status==='released'&&E.yearAt(winner.releaseWeek)===award.year);A(award.awardedWeek>winner.releaseWeek);}
 const news=E.searchNewsArchive(s,{query:'The Archive Promise'});A(news.some(x=>x.kind==='release'));const finance=E.portfolioRankings(s,{type:'finance',metric:'cash'});
 A(finance.some(r=>r.id===s.playerId&&r.source==='actual'));A(finance.some(r=>r.id!==s.playerId&&r.source==='estimated'));
 const ranking=E.portfolioRankings(s,{type:'audience',sector:'publishing',year:E.yearAt(p.releaseWeek)});A(ranking.some(r=>r.id===p.id&&r.source==='actual'));
 const record=E.portfolioRecords(s,{sector:'publishing'});A(record.releasedCount>=1);A(E.worldHistory(s).some(x=>x.projectId===p.id&&x.source==='played'));
 const saved=E.loadState(JSON.stringify(s));audit(saved);return {awards:E.creativeAwards(s,{sector:'publishing'}).length,news:news.length,rankRows:ranking.length};
});
check('27: history snapshots remain legal-entity scoped over 12 years; saved player title remains searchable',()=>{
 const s=E.createGame({era:25,origin:'established',seed:'update48-history-long',startingCapital:'funded',aiCount:6,regionCount:2}),p=E.createProject(s,{sector:'publishing',route:'original',title:'Permanent Archive',size:.6});
 for(let i=0;i<70&&p.status==='active';i++)E.advance(s,1);A.equal(p.status,'released');
 for(let i=0;i<12*52;i++){E.advance(s,1);if(i%52===0)audit(s);}
 const hist=E.historicalCompanyFinances(s,s.playerId);A(hist.length>=10);A(hist.every(x=>x.companyId===s.playerId&&x.source==='booked-entity-close'));
 const archive=E.searchNewsArchive(s,{query:'Permanent Archive'});A(archive.length>0,'old event should be searchable despite recent news compaction');A(s.archivedNews.some(x=>(x.title+' '+x.body).includes('Permanent Archive')),'event must be retained in archived storage after active-news compaction');
 const ranked=E.portfolioRankings(s,{type:'finance',metric:'annualProfit',year:25});A(ranked.some(x=>x.id===s.playerId&&x.source==='actual'));
 const saved=E.loadState(JSON.stringify(s));audit(saved);A(E.searchNewsArchive(saved,{query:'Permanent Archive'}).length>0);
 return {snapshots:hist.length,news:archive.length,activeNews:s.news.length,archivedNews:s.archivedNews.length};
});
console.log(`UPDATE48 ARCHIVE ${n}/2`);if(n!==2)process.exitCode=1;
