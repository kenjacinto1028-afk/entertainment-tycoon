'use strict';
const assert=require('node:assert/strict'),E=require('../dist/engine.js');
const plans=[{seed:'long-publisher-42',era:1,years:20},{seed:'long-mature-42',era:25,years:20}];
let successes=0;
for(const plan of plans){const s=E.createGame({...plan,aiCount:9}),start=Date.now(),initial=s.week;
 if(plan.era===25){const sub=E.foundSubsidiary(s,{name:'Dawn Studios',sector:'publishing',capital:30000});const p=E.createProject(s,{route:'original',sector:'publishing',title:'Dawn Story',size:.7});
  E.groupInternalLicense(s,p.ipId,sub.id,'publishing',700,52);}
 for(let y=0;y<plan.years;y++){
  for(let q=0;q<4;q++){for(let w=0;w<13;w++)E.advance(s,1);
   const err=E.audit(s);if(err.length)throw Error(`${plan.seed} year ${y+1} Q${q+1}: ${JSON.stringify(err.slice(0,4))}`);
   assert.equal(E.consolidatedStatements(s).balance.difference,0);
  }
  if((y+1)%5===0){const restored=E.loadState(JSON.stringify(s));assert.deepEqual(E.audit(restored),[]);}
 }
 assert.equal(s.week,initial+plan.years*52);
 const group=E.consolidatedStatements(s),size=Buffer.byteLength(JSON.stringify(s));
 assert(size<25e6,`save ballooned: ${size}`);
 console.log('PASS',plan.seed,'20 years; 80 quarter audits, 4 save reloads; companies',s.companies.length,'group assets',group.balance.assets,'save MB',(size/1e6).toFixed(2),'time ms',Date.now()-start);successes++;
}
console.log(`UPDATE42 longer stress ${successes}/${plans.length}`);
