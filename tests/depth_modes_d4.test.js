'use strict';
// Depth modes step D4: "Advance to next decision" (engine side).
const E=require('../dist/engine.js'),assert=require('node:assert/strict');
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const CAP=E.CONFIG.depth.ADVANCE_TO_DECISION;
const game=(depth)=>E.createGame({seed:'d4',era:25,origin:'established',startingCapital:'funded',aiCount:10,depth});
const closeAll=s=>s.inbox.forEach(a=>{a.open=false;});
check('Cap is in config (52 weeks; D7: Simple 13, Standard 8) and a quiet stretch stops at the cap',()=>{
 assert.equal(CAP.maxWeeks,52);assert.deepEqual(CAP.perMode,{simple:13,standard:8,veryComplex:52});
 for(const d of ['simple','standard','veryComplex']){const s=game(d),w=s.week,r=E.advanceToDecision(s),cap=CAP.perMode[d];
 assert.equal(r.weeks,cap);assert.equal(r.capped,true);assert.equal(r.found,false);assert.equal(s.week,w+cap);}
 const s=game('simple'),r=E.advanceToDecision(s);assert.match(r.reason,/No decisions/);return r;});
check('Stops as soon as a new Inbox card opens, in every mode',()=>{
 for(const d of ['simple','standard','veryComplex']){const s=game(d);let hit=null;
  for(let i=0;i<60&&!hit;i++){const r=E.advanceToDecision(s);if(r.found)hit=r;else assert(r.capped);}
  assert(hit,d+': no card in 60 calls');assert(hit.weeks>=1&&hit.weeks<=CAP.perMode[d]);
  assert(s.inbox.some(a=>a.open&&a.week===s.week),d+': card opened in the stop week');assert.deepEqual(E.audit(s),[]);}});
check('Does not move while a critical decision is already waiting',()=>{
 const s=game('simple');s.inbox.unshift({id:'t1',key:'test-critical',title:'T',body:'B',kind:'critical',week:s.week,open:true});
 const w=s.week,r=E.advanceToDecision(s);assert.equal(r.weeks,0);assert.equal(s.week,w);assert.match(r.reason,/already waiting/);
 s.inbox[0].open=false;assert(E.advanceToDecision(s).weeks>0);});
check('A card that was already open (advisory) does not stop the next advance',()=>{
 const s=game('simple');s.inbox.unshift({id:'t2',key:'test-advisory',title:'T',body:'B',kind:'advisory',week:s.week,open:true});
 const r=E.advanceToDecision(s);assert(r.weeks>1);});
check('Changing the cap in config changes how far it goes',()=>{
 const s=game('simple'),old=CAP.perMode.simple;CAP.perMode.simple=5;try{const r=E.advanceToDecision(s);assert.equal(r.weeks,5);assert(r.capped);}finally{CAP.perMode.simple=old;}});
check('Same seed gives the same result (no new randomness; save stays v36)',()=>{
 const a=game('standard'),b=game('standard');E.advanceToDecision(a);E.advanceToDecision(b);assert.equal(a.week,b.week);assert.equal(JSON.stringify(a.inbox),JSON.stringify(b.inbox));assert.equal(a.version,E.SAVE_VERSION);});
