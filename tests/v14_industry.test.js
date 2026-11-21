'use strict';
const A=require('node:assert/strict');
const E=require('../dist/engine.js');
let passed=0;
function check(label,fn){try{fn();passed++;console.log('PASS',label);}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
check('industry signals deterministic, bounded and read-only',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'v14-seasonal-taste',aiCount:5});
 const original=JSON.stringify(s),rng=s.rng,pulse=E.industryPulse14(s,'movie');
 A.equal(pulse.genres.length,E.GENRES.length);
 A(pulse.genres.every(x=>x.multiplier>=.91&&x.multiplier<=1.075));
 A.deepEqual(pulse,E.industryPulse14(s,'movie'));
 A.equal(s.rng,rng);A.equal(JSON.stringify(s),original);
});
check('rival genre choice is valid and requires no unearned funds',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'v14-competitor',aiCount:5});
 const rival=s.companies.find(c=>!c.isPlayer&&c.sector==='movie');
 A(rival);
 const prior=rival.finance.cash,genre=E.rivalGenrePick14(s,rival,'Fantasy');
 A(E.GENRES.includes(genre));A.equal(rival.finance.cash,prior);
 A(Array.isArray(E.rivalWatch14(s,'movie').active));
});
check('film campaign runs through cycles with balanced books and valid save',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'v14-30months',startingCapital:'funded',aiCount:6,regionCount:2});
 const p=E.createProject(s,{sector:'movie',title:'Orbit of Shadows',route:'original',size:.6,genre:'Mystery'});
 E.advance(s,104);
 A.equal(p.status,'released');
 A.deepEqual(E.audit(s),[]);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 A(E.industryPulse14(s,'movie').quarter>0);
});
console.log('V14 INDUSTRY '+passed+'/3');if(passed!==3)process.exitCode=1;
