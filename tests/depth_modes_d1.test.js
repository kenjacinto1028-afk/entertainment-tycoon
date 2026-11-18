'use strict';
// Depth modes step D1: depth setting, policy presets, save v35.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const evidence=fn();console.log('PASS',label,evidence?JSON.stringify(evidence):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const MODES=E.CONFIG.depth.MODES;
function switches(s){return {staffAutoFill:E.player(s).staffPolicy.autoFill,talentAutoBook:s.talentPolicy.autoBook,
 rightsAutoRenew:s.rightsPolicy.autoRenew,commissionAutoCounter:s.commissionPolicy.autoCounter,stopForAdvisory:s.pausePolicy.stopForAdvisory};}

check('New games default to Standard with its preset',()=>{
 const s=E.createGame({seed:'depth-d1'});
 assert.equal(E.SAVE_VERSION,35);assert.equal(s.version,35);
 assert.equal(s.settings.depth,'standard');assert.deepEqual(switches(s),MODES.standard);
 assert.deepEqual(E.audit(s),[]);return {depth:s.settings.depth};
});
check('Every mode can be chosen at start and applies its preset',()=>{
 for(const m of E.DEPTH_MODES){const s=E.createGame({seed:'depth-d1-'+m,depth:m});
  assert.equal(s.settings.depth,m);assert.deepEqual(switches(s),MODES[m]);assert.deepEqual(E.audit(s),[]);}
 return E.DEPTH_MODES;
});
check('Depth can be switched mid-game without touching RNG or money',()=>{
 const a=E.createGame({seed:'depth-switch'}),b=E.createGame({seed:'depth-switch'});
 E.advance(a,8);E.advance(b,8);
 const rng=a.rng,seq=a.sequence,cash=E.player(a).finance.cash;
 E.setDepth(a,'veryComplex');assert.deepEqual(switches(a),MODES.veryComplex);
 E.setDepth(a,'simple');assert.deepEqual(switches(a),MODES.simple);
 E.setDepth(a,'standard');
 assert.equal(a.rng,rng);assert.equal(a.sequence,seq);assert.equal(E.player(a).finance.cash,cash);
 E.advance(a,8);E.advance(b,8);
 assert.equal(E.player(a).finance.cash,E.player(b).finance.cash);assert.equal(a.rng,b.rng);
 assert.deepEqual(E.audit(a),[]);return {week:a.week};
});
check('Invalid depth is rejected and audit catches a corrupted depth',()=>{
 const s=E.createGame({seed:'depth-bad'});
 assert.throws(()=>E.setDepth(s,'extreme'),/Invalid depth mode/);assert.equal(s.settings.depth,'standard');
 s.settings.depth='nonsense';assert(E.audit(s).includes('Invalid depth mode'));
});
check('Depth survives save and load',()=>{
 const s=E.createGame({seed:'depth-save',depth:'simple'});E.advance(s,4);
 const t=E.loadState(JSON.stringify(s));
 assert.equal(t.settings.depth,'simple');assert.deepEqual(switches(t),MODES.simple);assert.deepEqual(E.audit(t),[]);
});
check('Pre-v35 saves load as Standard',()=>{
 const s=E.createGame({seed:'depth-old',depth:'veryComplex'});E.advance(s,4);
 const old=JSON.parse(JSON.stringify(s));old.version=34;delete old.settings.depth;
 const t=E.loadState(old);
 assert.equal(t.version,35);assert.equal(t.settings.depth,'standard');assert.deepEqual(switches(t),MODES.standard);
 assert.deepEqual(E.audit(t),[]);
});
console.log(`DEPTH D1 ${total}/6 passed`);
