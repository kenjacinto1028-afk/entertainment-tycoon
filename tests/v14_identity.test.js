'use strict';
const A=require('node:assert/strict');
const E=require('../dist/engine.js');
let passed=0;
function check(label,run){try{run();passed++;console.log('PASS',label);}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
check('new studio has an emerging identity without invented success',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'v14-identity-new'});
 const original=JSON.stringify(s);
 const data=E.studioIdentity14(s,s.playerId);
 A.equal(data.releaseCount,0);A.equal(data.honors,0);
 A.equal(data.classification,'Emerging studio');
 A.equal(JSON.stringify(s),original);
 A.deepEqual(E.audit(s),[]);
});
check('identity reflects actual movies, story choices and team culture',()=>{
 const s=E.createGame({era:25,origin:'film',seed:'v14-identity-films',startingCapital:'funded',regionCount:2,aiCount:5});
 const p=E.createProject(s,{sector:'movie',route:'original',title:'Rift of Dawn',genre:'Fantasy',size:.6,theme:'Found family'});
 for(let n=0;n<120&&p.status==='active';n++)E.advance(s,1);
 A.equal(p.status,'released');
 const result=E.studioIdentity14(s,s.playerId);
 A.equal(result.filmCount,1);A.equal(result.leadingGenre,'Fantasy');A.equal(result.storyTheme,'Found family');
 A.equal(E.studioBrandMultiplier14(s,p),1);
 A.deepEqual(E.audit(s),[]);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
});
console.log('V14 STUDIO IDENTITY '+passed+'/2');
if(passed!==2)process.exitCode=1;
