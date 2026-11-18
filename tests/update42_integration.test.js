'use strict';
const assert=require('node:assert/strict'),E=require('../dist/engine.js');
const seeds=[['chronological-one',1],['chronological-two',1],['mature-living-world',25]];
let passed=0;const start=Date.now();
for(const [seed,era] of seeds){
 const s=E.createGame({seed,era,aiCount:8}),firstYear=E.yearAt(s.week),startWeek=s.week;
 if(era===25){
  const p=E.createProject(s,{route:'original',sector:'publishing',title:'Project X',genre:'Fantasy',size:.7});
  const child=E.foundSubsidiary(s,{name:'New Acquired Imprint',sector:'publishing',capital:30000});
  const ip=s.ips.find(i=>i.id===p.ipId);
  E.groupInternalLicense(s,ip.id,child.id,'publishing',700,52);
  E.setCentralService(s,'finance',true);E.setCentralService(s,'legal',true);
  const decision=E.automaticLenderDecision(s,s.playerId,'revolver');
  if(decision.approved){const line=E.openCreditLine(s,s.playerId,Math.min(12000,decision.limit));E.drawCreditLine(s,line.id,5000);}
 }
 let violations=0,updates=0;
 for(let y=0;y<8;y++){
  for(let q=0;q<4;q++){
   // Engine-focused 1-week steps preserve each world settlement; multiweek UX still pauses.
   for(let week=0;week<13;week++)E.advance(s,1);
   const bad=E.audit(s);if(bad.length){console.error('FAIL',seed,era,y,q,bad.slice(0,7));violations+=bad.length;break;}
   assert.equal(E.consolidatedStatements(s).balance.difference,0);
   updates++;
  }
  if(violations)break;
  const copy=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(copy),[]);assert.equal(E.consolidatedStatements(copy).balance.difference,0);
  if(era===1 && y===0)assert.equal(E.yearAt(s.week)>=1,true);
 }
 assert.equal(violations,0);assert(updates===32);assert.equal(s.week,startWeek+8*52);
 const size=Buffer.byteLength(JSON.stringify(s));
 console.log(`PASS ${seed}: era${era} weeks=${s.week} companies=${s.companies.length} audit=${updates} save=${size}B elapsed=${Date.now()-start}ms`);passed++;
}
console.log(`UPDATE42 integration ${passed}/${seeds.length} seeds; ${Date.now()-start}ms`);
