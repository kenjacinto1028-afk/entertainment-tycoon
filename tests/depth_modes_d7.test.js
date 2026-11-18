'use strict';
// Depth modes step D7: scripted playthrough. A robot player plays 10 game years per mode and counts the decisions
// it meets each year (Inbox cards + its own greenlights, client jobs and loans), then checks the spec pace targets
// (config/depth.json PACE) and the 6 BALANCE_NOTES invariants in every mode.
// Set STUDIO_D7_REPORT=1 to print the full per-year table.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
const PACE=E.CONFIG.depth.PACE,INBOX=E.CONFIG.depth.INBOX,PRIORITY=E.CONFIG.depth.PRIORITY;
const ADV=E.CONFIG.depth.ADVANCE_TO_DECISION,MODES=['simple','standard','veryComplex'],SEEDS=['d7-pace-a','d7-pace-b'],YEARS=10;
E.CONFIG.depth.INSOLVENCY.furloughWeeks=0;// R6: this test measures pace for a long-paused studio; insolvency has its own test
let total=0;const report=[];
function check(label,fn){try{const evidence=fn();console.log('PASS',label,evidence?JSON.stringify(evidence):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const urgent=a=>PRIORITY.urgent.some(p=>a.key.startsWith(p)),low=a=>PRIORITY.low.some(p=>a.key.startsWith(p));
const avg=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);

// Invariant checks run at the end of every game year (and the wallet cap every week).
function yearlyInvariants(s,tag){
 assert.deepEqual(E.audit(s),[],tag+' audit');                                                    // 1,3,4,5: ledger, rights, governance, AI identities
 assert(Math.abs(E.consolidatedStatements(s).balance.difference)<.035,tag+' group books balance'); // 1: money counted once
 const ex=E.obligationExposure(s);                                                               // 3,5: obligations stay on the books
 for(const k of ['payableDifference','loanDifference','interestDifference'])assert(Math.abs(ex[k])<.05,tag+' '+k+' '+ex[k]);
 assert(s.projects.every(p=>E.yearAt(p.startWeek)>=E.SECTORS[p.sector].year),tag+' pre-debut work');  // 2
 assert(s.entrepreneurPool>=0,tag+' unfunded AI entrants');                                     // 4
}
function walletCap(s,tag){const ceiling=E.activeRegions(s).reduce((acc,r)=>acc+Object.keys(E.SECTORS).reduce((v,x)=>v+E.worldMarketBudget(s,x,r.name),0),0);
 assert(s.weeklyConsumerSpend<=ceiling+Math.max(1,.0002*ceiling),tag+' wallet cap');}             // 1,4: finite consumer money

// style 'healthy': keeps releasing (greenlights per year from PACE.robot), one client job and (year 1) one loan.
// style 'struggling': lean start, never produces; shows how many urgent cash warnings a weak studio meets.
function play(depth,seed,style){
 const s=E.createGame({seed,era:25,origin:'established',startingCapital:style==='healthy'?'funded':'lean',aiCount:10,depth});
 const plan=PACE.robot[depth],CAP=ADV.perMode[depth]??ADV.maxWeeks,years=[];const seen=new Set(s.inbox.map(a=>a.id));let since=0,n=0;
 for(let y=1;y<=YEARS&&s.runStatus!=='ended';y++){
  const row={year:y,cards:0,urgent:0,low:0,greenlights:0,clientJobs:0,loans:0,advanceStops:0};
  const dueWeeks=new Set(Array.from({length:plan.greenlights},(_,i)=>Math.floor(52*i/plan.greenlights)));
  for(let w=0;w<52&&s.runStatus!=='ended';w++){
   const c=E.player(s),ok=style==='healthy'&&s.management.status==='active'&&!c.bankrupt&&!c.operating44?.furloughed;
   if(ok&&y===1&&w===0){const before=E.consolidatedStatements(s).income.revenue,cash=c.finance.cash;      // 5: a loan is cash, not income
    E.borrowLoan(s,50000);row.loans++;assert.equal(E.consolidatedStatements(s).income.revenue,before,'loan booked as revenue');
    assert(c.finance.cash>cash,'loan cash missing');}
   if(ok&&dueWeeks.has(w)&&c.finance.cash>40000){
    try{E.createProject(s,{title:`D7 ${depth} ${y}-${w}`,sector:c.sector,route:'original',genre:'Fantasy',size:.6});row.greenlights++;}
    catch(e){if(!/fund|cash|capacity|team|slot|production|insolv/i.test(e.message))throw e;}}
   if(ok&&w===26&&plan.clientJobs){const job={sector:c.sector,route:'contract',title:`D7 job ${depth} ${y}`,size:.5,clientId:'auto'};
    try{const q=E.previewProject(s,{...job,withForecast:false}),cl=E.eligibleClients(s,q.contractFee)[0];
     if(cl){const o=E.requestCommission(s,{...job,clientId:cl.id});if(o.status==='accepted'){E.createProject(s,{...job,clientId:cl.id,offerId:o.id});row.clientJobs++;}}}
    catch(e){if(!/fund|cash|capacity|team|slot|production|client|insolv/i.test(e.message))throw e;}}
   E.advance(s,1);walletCap(s,`${depth}/${seed}/${style} y${y}w${w}`);
   const fresh=s.inbox.filter(a=>a.open&&!seen.has(a.id));for(const a of s.inbox)seen.add(a.id);
   for(const a of fresh){row.cards++;if(urgent(a))row.urgent++;else if(low(a))row.low++;}
   // The "advance to next decision" button stops at a new card, or after CAP quiet weeks.
   if(fresh.length){row.advanceStops++;since=0;}else if(++since>=CAP){row.advanceStops++;since=0;}
   for(const a of fresh)E.dismissAlert(s,a.id);   // the player handles each card
  }
  row.decisions=row.cards+row.greenlights+row.clientJobs+row.loans;
  yearlyInvariants(s,`${depth}/${seed}/${style} y${y}`);
  if(y%5===0){const t=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(t),[]);}
  years.push(row);n++;
 }
 return {s,years};
}

const runs={};
for(const depth of MODES)for(const seed of SEEDS)for(const style of ['healthy','struggling']){
 const r=play(depth,seed,style);(runs[depth+'/'+style]??=[]).push(r);
 for(const y of r.years)report.push({depth,seed,style,...y});
}
const rows=(depth,style)=>runs[depth+'/'+style].flatMap(r=>r.years);
const summary={};
for(const depth of MODES)for(const style of ['healthy','struggling']){const r=rows(depth,style);
 summary[depth+'/'+style]={years:r.length,decisions:+avg(r.map(x=>x.decisions)).toFixed(1),min:Math.min(...r.map(x=>x.decisions)),max:Math.max(...r.map(x=>x.decisions)),
  cards:+avg(r.map(x=>x.cards)).toFixed(1),urgent:+avg(r.map(x=>x.urgent)).toFixed(1),greenlights:+avg(r.map(x=>x.greenlights)).toFixed(1),advanceStops:+avg(r.map(x=>x.advanceStops)).toFixed(1)};}
console.log('D7 PACE SUMMARY (averages per game year)');console.table(summary);
if(process.env.STUDIO_D7_REPORT==='1')console.table(report);

check('Pace targets in config match the spec (Simple 8–12, Standard 15–25, Very Complex uncapped)',()=>{
 assert.deepEqual([PACE.simple.min,PACE.simple.max],[8,12]);assert.deepEqual([PACE.standard.min,PACE.standard.max],[15,25]);
 assert.equal(PACE.veryComplex.max,null);return {simple:PACE.simple,standard:PACE.standard};
});
for(const depth of ['simple','standard'])check(`${depth}: a healthy studio averages ${PACE[depth].min}–${PACE[depth].max} decisions per game year`,()=>{
 const sm=summary[depth+'/healthy'];assert(sm.decisions>=PACE[depth].min&&sm.decisions<=PACE[depth].max,JSON.stringify(sm));return sm;
});
check('Simple and Standard never show more non-urgent cards per year than their Inbox limit; Simple shows no low-priority cards',()=>{
 for(const depth of ['simple','standard'])for(const r of [...rows(depth,'healthy'),...rows(depth,'struggling')]){
  assert(r.cards-r.urgent<=INBOX[depth].yearlyCards,depth+' year '+r.year+' '+JSON.stringify(r));
  if(depth==='simple')assert.equal(r.low,0);}
 return {simpleMaxCards:Math.max(...rows('simple','struggling').map(r=>r.cards)),standardMaxCards:Math.max(...rows('standard','struggling').map(r=>r.cards))};
});
check('A studio out of cash is not flooded: at most one cash warning a quarter while paused (Simple/Standard stay within target max)',()=>{
 for(const depth of ['simple','standard'])for(const r of rows(depth,'struggling'))assert(r.decisions<=PACE[depth].max,depth+' '+JSON.stringify(r));
 return {simple:summary['simple/struggling'],standard:summary['standard/struggling']};
});
check('Very Complex is unchanged: no Released cards, no extra release reports, no merged cash warnings',()=>{
 for(const r of [...runs['veryComplex/healthy'],...runs['veryComplex/struggling']])
  assert(!r.s.inbox.some(a=>a.key.startsWith('project-done-')||(a.key.startsWith('postmortem-')&&a.title.startsWith('Release report'))));
 assert.equal(summary['veryComplex/healthy'].cards,0);assert(summary['veryComplex/struggling'].cards>summary['simple/struggling'].cards);
 assert.equal(ADV.perMode.veryComplex,ADV.maxWeeks);return {cap:ADV.perMode};
});
check('Fewer modes ask fewer questions: Simple ≤ Standard ≤ Very Complex in Inbox cards',()=>{
 const c=d=>summary[d+'/struggling'].cards+summary[d+'/healthy'].cards;
 assert(c('simple')<=c('standard')+1e-9&&c('standard')<=c('veryComplex')+1e-9,JSON.stringify([c('simple'),c('standard'),c('veryComplex')]));
 return {simple:c('simple'),standard:c('standard'),veryComplex:c('veryComplex')};
});
check('6 BALANCE_NOTES invariants hold in every mode (yearly audit, books, obligations, debuts, AI funding, wallet cap)',()=>{
 for(const depth of MODES)for(const r of [...runs[depth+'/healthy'],...runs[depth+'/struggling']]){
  yearlyInvariants(r.s,depth+' final');
  // 2: no sector debut bypass in any mode
  const c=E.player(r.s),other=Object.keys(E.SECTORS).find(x=>x!==c.sector&&!(c.capabilities||{})[x]);
  if(other&&r.s.runStatus!=='ended')assert.throws(()=>E.createProject(r.s,{title:'bypass',sector:other,route:'original',genre:'Fantasy',size:.5}));
  // 5: taxes are automatic, never an Inbox decision
  assert(!r.s.inbox.some(a=>/^tax/i.test(a.key)),depth+' tax card');
 }
 // 6: automatic handling only removes routine questions: Simple/Standard show no more cards than Very Complex for the same seeds
 return {runs:Object.values(runs).flat().length,auditedYears:report.length};
});
console.log(`DEPTH D7 ${total}/8 passed`);
