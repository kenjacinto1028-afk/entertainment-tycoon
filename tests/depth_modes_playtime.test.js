'use strict';
// Playtime counter: save v39 field s.playtimeSec (real seconds played on this save). Not part of the simulation.
const E=require('../dist/engine.js'),assert=require('node:assert/strict');let total=0;
function check(label,fn){try{const ev=fn();console.log('PASS',label,ev?JSON.stringify(ev):'');total++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
const game=(seed='playtime')=>E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:8});
check('New game starts at 0 and addPlaytime adds seconds, ignoring bad input',()=>{
 const s=game();assert.equal(E.SAVE_VERSION,39);assert.equal(s.version,39);assert.equal(s.playtimeSec,0);
 assert.equal(E.addPlaytime(s,1.04),1);assert.equal(E.addPlaytime(s,59),60);
 for(const bad of [-5,0,NaN,Infinity,'x',undefined])E.addPlaytime(s,bad);assert.equal(s.playtimeSec,60);assert.deepEqual(E.audit(s),[]);
});
check('Playtime does not touch RNG, money or the week',()=>{
 const a=game('pt-rng'),b=game('pt-rng');E.addPlaytime(b,3600);E.advance(a,30);E.advance(b,30);
 assert.equal(a.rng,b.rng);assert.equal(a.sequence,b.sequence);assert.equal(E.player(a).finance.cash,E.player(b).finance.cash);assert.equal(b.playtimeSec,3600);
});
check('Save round trip keeps playtime; v38 saves migrate to 0; audit rejects bad values',()=>{
 const s=game('pt-save');E.addPlaytime(s,4321.5);E.advance(s,10);
 const t=E.loadState(JSON.stringify(s));assert.equal(t.playtimeSec,4321.5);assert.deepEqual(E.audit(t),[]);
 const old=JSON.parse(JSON.stringify(s));old.version=38;delete old.playtimeSec;
 const u=E.loadState(old);assert.equal(u.version,39);assert.equal(u.playtimeSec,0);assert.deepEqual(E.audit(u),[]);E.advance(u,2);assert.deepEqual(E.audit(u),[]);
 for(const bad of [-1,NaN,'5',null]){t.playtimeSec=bad;assert(E.audit(t).includes('Invalid playtime'),String(bad));}
});
console.log(`Playtime: ${total}/3 PASS`);
