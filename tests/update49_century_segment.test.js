'use strict';
// Resumable, seed-specific whole-game centuries. Run e.g.:
// STUDIO_SEED=publishing STUDIO_YEARS_PER_SEGMENT=10 node tests/update49_century_segment.test.js
const E=require('../dist/engine.js'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const profiles={publishing:{seed:'u49-publishing-century',era:1,origin:'publisher'},games:{seed:'u49-games-century',era:25,origin:'games'}};
const key=process.env.STUDIO_SEED||'publishing',profile=profiles[key];if(!profile)throw Error('Unknown century seed');
const tag=process.env.STUDIO_CENTURY_FINAL==='1'?'final':'pre';
const checkpoint=path.resolve('reports/UPDATE_49_CENTURY_'+key+'_'+tag+'.checkpoint.json');
const prior=fs.existsSync(checkpoint)?JSON.parse(fs.readFileSync(checkpoint,'utf8')):null;
let s=prior?E.loadState(prior.state):E.createGame({...profile,aiCount:3,regionCount:2,startingCapital:'funded'});
const start=Date.now(),from=prior?.years||0,yearsPer=Math.min(20,Math.max(1,Number(process.env.STUDIO_YEARS_PER_SEGMENT||10)));
const target=Math.min(100,from+yearsPer),rootId=prior?.rootId||s.playerId,founderShares=prior?.founderShares??E.corporateStatus(s).ownership.founder;
let launches=prior?.launches||0,appointments=prior?.appointments||0,transitionWeeks=prior?.transitionWeeks||0,
 maxSave=prior?.maxSave||0,peakWallet=prior?.peakWallet||0,activeWeeks=prior?.activeWeeks||0,yearlyAudits=prior?.yearlyAudits||0,reloads=prior?.reloads||0;
for(let year=from+1;year<=target;year++){
 let c=E.player(s);
 if(s.management.status==='active'&&!c.bankrupt&&!c.operating44?.furloughed&&c.finance.cash>25000&&
  !s.projects.some(p=>p.companyId===c.id&&p.status==='active')){
  try{E.createProject(s,{title:'Century '+key+' '+year,sector:c.sector,route:'original',genre:'Fantasy',size:.67});launches++;}
  catch(e){if(!/rights|fund|cash|production|capacity|license|sector|insolv|control|company|slots|team/i.test(e.message))throw e;}
 }
 if(s.management.status==='active'&&s.founder.age>=69&&s.management.personId===s.founder.id){
  const possible=s.employees.filter(e=>e.employerId===c.id&&e.status==='employed'&&e.age<65&&e.skill>=45&&c.teams.some(t=>t.leaderId===e.id));
  if(possible.length&&!s.management.plannedSuccessorId)try{E.planLeadership(s,possible[0].id);}catch(e){}
 }
 for(let w=0;w<52;w++){
  E.advance(s,1);
  if(s.management.status==='transition'){
   transitionWeeks++;c=E.player(s);
   const leaders=s.employees.filter(e=>e.employerId===c.id&&e.status==='employed'&&e.skill>=45&&e.age<75&&c.teams.some(t=>t.leaderId===e.id));
   if(leaders.length){try{E.chooseLeader(s,leaders.sort((a,b)=>a.age-b.age)[0].id);appointments++;}catch(e){}}
  }
  if(s.management.status==='active')activeWeeks++;
  const total=E.activeRegions(s).reduce((sum,r)=>sum+Object.keys(E.SECTORS).reduce((n,k)=>n+E.worldMarketBudget(s,k,r.name),0),0);
  A(s.weeklyConsumerSpend<=total+Math.max(1,total*.0002),'Consumer wallets cannot be overspent');
  peakWallet=Math.max(peakWallet,s.weeklyConsumerSpend/Math.max(1,total));
 }
 console.log('ANNUAL',key,year,'projects',s.projects.length,'companies',s.companies.length,'elapsedS',Math.round((Date.now()-start)/1000));
 const issues=E.audit(s);A.deepEqual(issues,[],key+' year '+year+' audit');yearlyAudits++;
 A.equal(s.playerId,rootId,'Company remains legally same after management succession');
 A.equal(E.corporateStatus(s).ownership.founder,founderShares,'Shares cannot transfer upon executive appointment');
 A(s.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year),'Never pre-debut production');
 if(year%10===0){const raw=JSON.stringify(s);const loaded=E.loadState(raw);A.deepEqual(E.audit(loaded),[],'Decade reload audit');s=loaded;reloads++;maxSave=Math.max(maxSave,Buffer.byteLength(raw));A(maxSave<=80e6,'Current save must remain <=80 MB');}
}
const serialized=JSON.stringify(s);const result={key,era:profile.era,years:target,done:target===100,launches,appointments,transitionWeeks,activeWeeks,yearlyAudits,reloads,maxSave,peakWallet:Number(peakWallet.toFixed(4)),rootId,founderShares};
fs.writeFileSync(checkpoint,JSON.stringify({...result,state:serialized}));
fs.writeFileSync(path.resolve('reports/UPDATE_49_CENTURY_'+key+'_'+tag+'.summary.json'),JSON.stringify(result,null,2));
console.log('CHECKPOINT',JSON.stringify({...result,lastSegmentSec:Math.round((Date.now()-start)/1000)}));
if(target===100){A.equal(yearlyAudits,100);A.equal(reloads,10);console.log('PASS',key,'100 years, annual audit, decadal reload, ownership and finite demand');}
