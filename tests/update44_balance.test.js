'use strict';
// Repeatable economic observations. This is NOT a proof that passive campaigns
// remain profitable, or that all player strategies and maximum worlds are balanced.
const E=require('../dist/engine.js'),assert=require('node:assert/strict'),fs=require('node:fs');
const plans=[
 ['chron-casual',1,'publisher','casual',2],['chron-standard',1,'publisher','standard',3],['chron-challenge',1,'publisher','challenging',4],
 ['film-casual',4,'film','casual',2],['film-standard',4,'film','standard',3],['film-challenge',4,'film','challenging',4],
 ['mature-casual',25,'games','casual',2],['mature-standard',25,'games','standard',3],['mature-challenge',25,'games','challenging',4]
];
const rows=[];let audits=0;
for(const [seed,era,origin,difficulty,worldScale] of plans){
 const s=E.createGame({seed:'balance44-'+seed,era,origin,difficulty,worldScale,aiCount:5,regionCount:3,startingCapital:'standard'});
 const entry=E.player(s).finance.cash;let playerProjects=0,failedLaunches=0,monthsWithNoCash=0;
 const launch=()=>{
  const c=E.player(s);if(c.finance.cash<=0||c.operating44.furloughed||s.management.status!=='active'||c.bankrupt)return;
  if(s.projects.some(p=>p.companyId===c.id&&p.status==='active'))return;
  try{E.createProject(s,{sector:c.sector,route:'original',genre:'Fantasy',title:seed+' Original '+(playerProjects+1),size:.70,marketing:.13});playerProjects++;}
  catch(_){failedLaunches++;}
 };
 for(let y=1;y<=12;y++){
  launch();
  for(let w=1;w<=52;w++){
   E.advance(s,1);if(s.week%13===0){const bad=E.audit(s);assert.deepEqual(bad,[],seed+' '+y+' '+w+' '+bad.slice(0,4));audits++;}
   if(w%4===0 && E.player(s).finance.cash===0)monthsWithNoCash++;
  }
 }
 const player=E.player(s),riv=s.companies.filter(c=>!c.isPlayer&&!c.parentId),bankrupt=riv.filter(c=>c.bankrupt).length,
  allCustomerGross=s.projects.reduce((n,p)=>n+(p.stats?.totalSales||0),0),
  released=s.projects.filter(p=>p.status==='released').length,
  noMoneyFirms=s.companies.filter(c=>c.finance.cash===0).length;
 assert.equal(s.week,(era-1+12)*52);assert(s.entrepreneurPool>=0);
 assert(s.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year));
 assert(s.debutFundings44.every(f=>E.yearAt(f.week)>=E.SECTORS[f.sector].year));
 assert.equal(E.consolidatedStatements(s).balance.difference,0);
 rows.push({seed,era,origin,difficulty,worldScale,startCash:entry,playerCash:player.finance.cash,
  playerPayable:player.finance.payable,playerLoan:player.finance.loanBalance,playerProjects,failedLaunches,
  monthsWithNoCash,playerFurloughed:player.operating44.furloughed,playerStatus:s.management.status,
  detailedRivals:riv.length,bankruptRivals:bankrupt,cashlessCompanies:noMoneyFirms,
  totalProjects:s.projects.length,released,consumerGross:Math.round(allCustomerGross),
  founderCapitalLeft:s.entrepreneurPool,industryEntrants:s.debutFundings44.length,
  auditCount:48,serializedSaveBytes:Buffer.byteLength(JSON.stringify(s))});
 console.log('PASS',seed,'audits 48','rivals',riv.length,'closed',bankrupt,'released',released,'playerCash',player.finance.cash,'playerFurlough',player.operating44.furloughed);
}
fs.writeFileSync('reports/UPDATE_44_BALANCE.json',JSON.stringify({date:'2026-11-17',durationYears:12,audits,rows},null,2));
console.log('UPDATE44 balance',rows.length,'seeded worlds',audits,'quarterly audits');
