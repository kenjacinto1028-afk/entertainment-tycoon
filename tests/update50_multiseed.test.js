'use strict';
// Update50: cross-era, cross-difficulty breadth to complement two Update49 player-managed centuries.
// No imaginary funds, rights, AI rescues or skipped sector debuts.
const E=require('../dist/engine.js'),A=require('node:assert/strict'),fs=require('node:fs');
const plans=[
 {seed:'u50-y1-labor-recession',era:1,origin:'publisher',difficulty:'challenging',regionCount:4,worldScale:3,aiCount:10,startingCapital:'standard',adoptionPace:'slow',discoveryPace:'slow',years:14},
 {seed:'u50-y4-small-film',era:4,origin:'film',difficulty:'standard',regionCount:2,worldScale:1,aiCount:3,startingCapital:'funded',adoptionPace:'fast',discoveryPace:'standard',years:18},
 {seed:'u50-y7-television',era:7,origin:'tv',difficulty:'challenging',regionCount:3,worldScale:2,aiCount:7,startingCapital:'funded',adoptionPace:'standard',discoveryPace:'fast',years:16},
 {seed:'u50-y10-game-growth',era:10,origin:'games',difficulty:'casual',regionCount:3,worldScale:2,aiCount:8,startingCapital:'funded',adoptionPace:'slow',discoveryPace:'fast',years:18},
 {seed:'u50-y25-mature-broad',era:25,origin:'games',difficulty:'challenging',regionCount:4,worldScale:3,aiCount:12,startingCapital:'funded',adoptionPace:'fast',discoveryPace:'slow',years:16},
 {seed:'u50-y25-small-publisher',era:25,origin:'publisher',difficulty:'casual',regionCount:2,worldScale:1,aiCount:3,startingCapital:'standard',adoptionPace:'standard',discoveryPace:'standard',years:20}
];
const index=Number(process.env.STUDIO50_INDEX||0);
const selected=index?[plans[index-1]]:plans;
if(selected.some(x=>!x))throw new Error('Unknown index, expected 1..6');
const rows=[];let audits=0,reloads=0,totWeeks=0;
for(const plan of selected){
 const checkpointFile='reports/UPDATE_50_'+plan.seed+'.checkpoint.json';
 const old=fs.existsSync(checkpointFile)?JSON.parse(fs.readFileSync(checkpointFile,'utf8')):null;
 let s=old?E.loadState(old.serialized):E.createGame(plan),launches=old?.launches||0,peakWallet=old?.peakWallet||0,maxBytes=old?.maxBytes||0,failed=0,debuts=new Set(old?.debuts||[]);
 for(let yr=(old?.lastYear||0)+1;yr<=plan.years;yr++){
  const player=E.player(s);
  if(s.management.status==='active'&&!player.bankrupt&&!player.operating44?.furloughed&&player.finance.cash>26000&&
    !s.projects.some(p=>p.companyId===player.id&&p.status==='active')){
   try{E.createProject(s,{sector:player.sector,title:`Multi-sector ${plan.seed} ${yr}`,route:'original',genre:'Fantasy',size:.62});launches++;}
   catch(err){if(!/rights|fund|cash|production|capacity|license|sector|insolv|control|company|slots|team/i.test(err.message))throw err;}
  }
  for(let w=0;w<52;w++){
   E.advance(s,1);totWeeks++;
   const ceiling=E.activeRegions(s).reduce((acc,region)=>acc+Object.keys(E.SECTORS).reduce((v,sector)=>v+E.worldMarketBudget(s,sector,region.name),0),0);
   A(s.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling),'Wallet cap violated '+plan.seed+' year '+yr+' week '+w);
   peakWallet=Math.max(peakWallet,s.weeklyConsumerSpend/Math.max(1,ceiling));
   A(s.entrepreneurPool>=0,'Unfunded AI entrants');
  }
  const errors=E.audit(s);A.deepEqual(errors,[],plan.seed+' year '+yr+' '+JSON.stringify(errors.slice(0,4)));
  const bridge=E.consolidatedStatements(s).balance;A(Math.abs(bridge.difference)<.035,'Unreconciled group: '+plan.seed);
  A(s.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year),'Pre-debut work');
  for(const p of s.projects.filter(p=>p.status==='released'))debuts.add(p.sector);
  audits++;
  if(yr%4===0){const payload=JSON.stringify(s);maxBytes=Math.max(maxBytes,Buffer.byteLength(payload));s=E.loadState(payload);A.deepEqual(E.audit(s),[]);reloads++;}
  // Crash-resumable checkpoint after each successful annual audit, never every week.
  const state={lastYear:yr,serialized:JSON.stringify(s),launches,peakWallet,maxBytes,debuts:[...debuts]};
  fs.writeFileSync(checkpointFile+'.tmp',JSON.stringify(state));fs.renameSync(checkpointFile+'.tmp',checkpointFile);
  console.log('CHECKPOINT',plan.seed,yr+'/'+plan.years);
 }
 failed=s.companies.filter(c=>c.bankrupt).length;
 const row={seed:plan.seed,era:plan.era,origin:plan.origin,difficulty:plan.difficulty,years:plan.years,projects:launches,releaseSectors:[...debuts].sort(),companies:s.companies.length,organicBankruptcies:failed,walletPeak:Number(peakWallet.toFixed(5)),maxSaveMB:Number((maxBytes/1e6).toFixed(2)),playerCash:E.player(s).finance.cash,liveManagement:s.management.status};
 fs.writeFileSync('reports/UPDATE_50_'+plan.seed+'.summary.json',JSON.stringify(row,null,2));
 rows.push(row);console.log('PASS',plan.seed,row.years+' years', 'wallet peak',row.walletPeak,'releases',row.releaseSectors.join('/'),'bankrupt',failed,'save',row.maxSaveMB+' MB');
}
if(!index)fs.writeFileSync('reports/UPDATE_50_MULTISEED.json',JSON.stringify({audits,reloads,totWeeks,rows},null,2));
console.log(`UPDATE50 MULTISEED ${rows.length}/${plans.length}, ${audits} annual audits, ${reloads} reloads, ${totWeeks} weekly wallet checks`);
