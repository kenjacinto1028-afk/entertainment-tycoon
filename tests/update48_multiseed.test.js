'use strict';
// Focused Update48 longitudinal regression. NOT a whole-game 100-year acceptance.
const E=require('../dist/engine.js'),A=require('node:assert/strict'),fs=require('node:fs');
const plans=[{seed:'u48-origin-year1',era:1,origin:'publisher',aiCount:4,regionCount:2},{seed:'u48-games-era25',era:25,origin:'games',aiCount:6,regionCount:3}];
const rows=[];let audits=0,reloads=0;
for(const plan of plans){const s=E.createGame({...plan,startingCapital:'funded'});let playerLaunches=0,maxRatio=0;
 for(let yr=0;yr<8;yr++){
  const c=E.player(s);if(s.runStatus!=='ended'&&c.finance.cash>24000&&!s.projects.some(p=>p.companyId===c.id&&p.status==='active'))try{E.createProject(s,{sector:c.sector,route:'original',title:plan.seed+'-'+yr,size:.55});playerLaunches++;}catch(e){if(!/cash|slots|capacity|company|control|solven/i.test(String(e)))throw e;}
  for(let quarter=0;quarter<4;quarter++){
   for(let wk=0;wk<13;wk++){
    E.advance(s,1);const budget=E.activeRegions(s).reduce((sum,r)=>sum+Object.keys(E.SECTORS).reduce((n,sec)=>n+E.worldMarketBudget(s,sec,r.name),0),0);const share=s.weeklyConsumerSpend/Math.max(1,budget);A(share<=1.001,plan.seed+' overspent at week '+s.week);maxRatio=Math.max(share,maxRatio);
   }
   A.deepEqual(E.audit(s),[],plan.seed+' year '+yr+' quarter '+quarter);A(Math.abs(E.consolidatedStatements(s).balance.difference)<.032);audits++;
  }
  if(yr%2===1){A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);reloads++;}
 }
 A(s.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year));
 rows.push({seed:plan.seed,era:plan.era,endYear:E.yearAt(s.week),projects:playerLaunches,companies:s.companies.length,bankrupt:s.companies.filter(c=>c.bankrupt).length,consumerPeak:+maxRatio.toFixed(3),saveMB:+(Buffer.byteLength(JSON.stringify(s))/1e6).toFixed(2)});
 console.log('PASS',plan.seed,'8 years / 32 quarterly audits, 4 reloads',JSON.stringify(rows.at(-1)));
}
const result={worlds:2,yearsPerWorld:8,quarterlyAudits:audits,reloads,rows};fs.writeFileSync('reports/UPDATE_48_MULTISEED.json',JSON.stringify(result,null,2));
console.log('UPDATE48 MULTISEED 2/2',audits,'audits',reloads,'save/reloads');
