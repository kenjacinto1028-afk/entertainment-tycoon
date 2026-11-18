'use strict';
// Update 45 repeatable heterogeneous 12-year campaigns; evidence is specific
// to conservation and continuity, not proof of universally balanced difficulty.
const E=require('../dist/engine.js'),A=require('node:assert/strict'),fs=require('node:fs');
const plans=[
 {seed:'u45-publishing-low',era:1,origin:'publisher',difficulty:'standard',worldScale:2,aiCount:7,regionCount:3,discoveryPace:'slow',adoptionPace:'fast'},
 {seed:'u45-cinema-growth',era:4,origin:'film',difficulty:'challenging',worldScale:3,aiCount:9,regionCount:4,discoveryPace:'fast',adoptionPace:'slow'},
 {seed:'u45-tv-growth',era:7,origin:'tv',difficulty:'casual',worldScale:2,aiCount:5,regionCount:2,discoveryPace:'standard',adoptionPace:'slow'},
 {seed:'u45-games-mature',era:25,origin:'games',difficulty:'standard',worldScale:3,aiCount:12,regionCount:4,discoveryPace:'standard',adoptionPace:'fast'}
];
const rows=[];let totalAudits=0,reloads=0;
for(const plan of plans){
 const world=E.createGame({...plan,startingCapital:'standard'}),start=world.week;
 const first=E.player(world),openingCash=first.finance.cash;
 let maxRatio=0,sectorLaunches=0;
 for(let yr=1;yr<=12;yr++){
  // Avoid automation that adds fictional funds; test organically funded actors.
  if(world.management?.status==='active'&&!first.bankrupt&&first.finance.cash>10000&&!world.projects.some(p=>p.companyId===first.id&&p.status==='active')){
   try{E.createProject(world,{sector:first.sector,route:'original',title:`${plan.seed} ${yr}`,size:.7});sectorLaunches++;}catch(err){if(!/fund|cash|slots|team|capab|solven/i.test(String(err)))throw err;}
  }
  for(let q=0;q<4;q++){
   for(let w=0;w<13;w++){
    E.advance(world,1);
    const budgets=E.activeRegions(world).reduce((sum,r)=>sum+Object.keys(E.SECTORS).reduce((acc,sec)=>acc+E.worldMarketBudget(world,sec,r.name),0),0);
    const ratio=world.weeklyConsumerSpend/Math.max(1,budgets);maxRatio=Math.max(maxRatio,ratio);
    A(ratio<=1.001,`${plan.seed} world weekly consumption over cap week ${world.week}: ${ratio}`);
    A(world.entrepreneurPool>=0,'entrants spent more capital than existed');
   }
   const bad=E.audit(world);A.deepEqual(bad,[],`${plan.seed}: year ${yr} Q${q+1} ${JSON.stringify(bad.slice(0,5))}`);
   A(Math.abs(E.consolidatedStatements(world).balance.difference)<.031);
   totalAudits++;
  }
  if(yr%3===0){const copy=E.loadState(JSON.stringify(world));A.deepEqual(E.audit(copy),[]);reloads++;}
 }
 A.equal(world.week,start+12*52);
 A(world.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year));
 const size=Buffer.byteLength(JSON.stringify(world));A(size<22e6,`12-year save exceeds 22MB: ${size}`);
 rows.push({seed:plan.seed,era:plan.era,origin:plan.origin,difficulty:plan.difficulty,companyCount:world.companies.length,companyFailures:world.companies.filter(c=>c.bankrupt).length,
   openingCash,endingCash:E.player(world).finance.cash,playerProjects:sectorLaunches,released:world.projects.filter(p=>p.status==='released').length,
   maxConsumerWalletShare:+maxRatio.toFixed(4),saveMB:+(size/1e6).toFixed(2),quarterAudits:48});
 console.log(`PASS ${plan.seed}: 12 years, 48 quarter audits, 4 saved reloads, wallet peak ${maxRatio.toFixed(3)}, companies ${world.companies.length}, releases ${rows.at(-1).released}`);
}
fs.writeFileSync('reports/UPDATE_45_MULTISEED.json',JSON.stringify({runDate:'2026-11-17',quarterAudits:totalAudits,saveReloads:reloads,rows},null,2));
console.log(`UPDATE45 MULTISEED ${rows.length}/${plans.length} worlds, ${totalAudits} quarterly audits, ${reloads} save reloads`);
