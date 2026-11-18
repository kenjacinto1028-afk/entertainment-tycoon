'use strict';
// Depth modes step 2 B1: Board Reputation meter, yearly review, Hit/Flop effects, save v37 migration.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const B=E.CONFIG.depth.BOARD;
const game=(seed='board-b1',depth='standard')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8,depth});
const rep=s=>E.player(s).corporate.boardRep;

check('Config values exist; no meter before incorporation; starts at START on incorporation',()=>{
 assert.equal(B.START,50);assert.equal(B.MIN,0);assert.equal(B.MAX,100);assert(E.SAVE_VERSION>=37);
 const s=game();assert.equal(s.version,E.SAVE_VERSION);assert.equal(rep(s)??null,null);assert.equal(E.corporateStatus(s).boardRep,null);
 assert.deepEqual(s.studioMilestones,{});assert.deepEqual(s.legends,[]);
 E.incorporateStudio(s);assert.equal(rep(s).value,50);assert.equal(E.corporateStatus(s).boardRep.value,50);
 assert.deepEqual(E.audit(s),[]);return {start:rep(s).value};
});
check('Yearly review: profit year with target met adds, loss year with missed target subtracts',()=>{
 for(const [good,seed] of [[true,'b1-good'],[false,'b1-bad']]){
  const s=game(seed);E.incorporateStudio(s);const c=E.player(s),r=rep(s);
  // Force the closing year's books: the review reads the annual snapshot, so set the baseline.
  const y=Math.floor(s.week/52)+1;
  r.target={year:y,minRevenue:good?0:1e12};
  const weeksToNewYear=y*52-s.week;E.advance(s,weeksToNewYear-1);
  const snapBase=c.annualBaseline;c.annualBaseline={revenue:c.finance.revenue-(good?500000:0),expense:c.finance.expense-(good?100000:500000)};
  r.history.length=0;r.value=50;E.advance(s,1);
  const deltas=r.history.map(h=>h.delta);
  if(good)assert.deepEqual(deltas.slice(0,2),[B.TARGET_HIT,B.PROFIT_YEAR]);else assert.deepEqual(deltas.slice(0,2),[B.TARGET_MISS,B.LOSS_YEAR]);
  assert.equal(r.target.year,y+1);assert(r.value>=B.MIN&&r.value<=B.MAX);assert.deepEqual(E.audit(s),[]);
 }
});
check('Meter is clamped to 0..100',()=>{
 const s=game('b1-clamp');E.incorporateStudio(s);const c=E.player(s),r=rep(s);
 r.value=99;E.advance(s,1);r.value=99;r.history.length=0;
 const p=E.createProject(s,{title:'Clamp test',sector:'publishing',route:'original',size:.6});
 p.status='released';p.releaseWeek=s.week;p.directCost=1000;p.directRevenue=1e6;E.advance(s,1);
 assert.equal(rep(s).value,100);
 const q=E.createProject(s,{title:'Clamp 2',sector:'publishing',route:'original',size:.6});
 r.value=1;r.sinceWeek=0;q.status='released';q.releaseWeek=s.week-60;q.directCost=1e6;q.directRevenue=0;E.advance(s,1);
 assert.equal(rep(s).value,0);assert.deepEqual(E.audit(s),[]);
});
check('Hit and flop effects apply once per player title; contract jobs and pre-incorporation titles are ignored',()=>{
 const s=game('b1-release');const early=E.createProject(s,{title:'Before board',sector:'publishing',route:'original',size:.6});
 early.status='released';early.releaseWeek=s.week-100;early.directCost=1000;early.directRevenue=1e6;
 E.advance(s,2);E.incorporateStudio(s);const r=rep(s);E.advance(s,2);assert.equal(r.value,50);
 const hit=E.createProject(s,{title:'Board hit',sector:'publishing',route:'original',size:.6});
 hit.status='released';hit.releaseWeek=s.week;hit.directCost=1000;hit.directRevenue=1000*B.HIT_MULTIPLE+5000;
 E.advance(s,1);assert.equal(r.value,50+B.RELEASE_HIT);E.advance(s,3);assert.equal(r.value,50+B.RELEASE_HIT);
 const flop=E.createProject(s,{title:'Board flop',sector:'publishing',route:'original',size:.6});
 flop.status='released';flop.releaseWeek=s.week-B.FLOP_AGE_WEEKS;flop.directCost=1e6;flop.directRevenue=1e6*B.FLOP_FRACTION-10000;
 r.sinceWeek=flop.releaseWeek;const v=r.value;E.advance(s,1);assert.equal(r.value,v+B.RELEASE_FLOP);E.advance(s,3);assert.equal(r.value,v+B.RELEASE_FLOP);
 const job=E.createProject(s,{title:'Job',sector:'publishing',route:'contract',size:.6,clientId:'auto'});
 job.status='released';job.releaseWeek=s.week-60;job.directCost=1000;job.directRevenue=0;const w=r.value;E.advance(s,1);assert.equal(r.value,w);
 return {value:r.value};
});
check('Save v37: round trip keeps the meter; v36 saves migrate (incorporated start at 50, others none)',()=>{
 const s=game('b1-save');E.incorporateStudio(s);rep(s).value=63;
 const t=E.loadState(JSON.stringify(s));assert.equal(rep(t).value,63);assert.deepEqual(E.audit(t),[]);
 const old=JSON.parse(JSON.stringify(s));old.version=36;delete E_(old).boardRep;delete old.studioMilestones;delete old.legends;for(const p of old.projects)delete p.repMilestones;
 const u=E.loadState(old);assert.equal(u.version,E.SAVE_VERSION);assert.equal(rep(u).value,50);assert.deepEqual(u.legends,[]);assert.deepEqual(u.studioMilestones,{});
 assert(u.projects.every(p=>p.repMilestones&&typeof p.repMilestones==='object'));assert.deepEqual(E.audit(u),[]);E.advance(u,3);
 const f=game('b1-founder');const o=JSON.parse(JSON.stringify(f));o.version=36;delete E_(o).boardRep;const g=E.loadState(o);assert.equal(rep(g)??null,null);
 rep(t).value=500;assert(E.audit(t).includes('Invalid Board Reputation'));
 function E_(x){return x.companies.find(c=>c.id===x.playerId).corporate;}
});
check('Same seed gives same meter (no new random rolls); Simple/Very Complex also track it',()=>{
 const run=d=>{const s=game('b1-det',d);E.incorporateStudio(s);E.advance(s,110);return [rep(s).value,s.rng,JSON.stringify(rep(s).history)];};
 assert.deepEqual(run('standard'),run('standard'));
 for(const d of ['simple','veryComplex']){const s=game('b1-det',d);E.incorporateStudio(s);E.advance(s,60);assert(rep(s).value>=0&&rep(s).value<=100);assert.deepEqual(E.audit(s),[]);}
});
console.log(`DEPTH B1 ${total}/6 passed`);
