'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict');
let periods=0,entities=0,reloads=0,groups=0;
for(const [era,origin,seed] of [[1,'publisher','finance-year1-44'],[25,'games','finance-games-44'],[25,'established','finance-group-44']]){
 const s=E.createGame({era,origin,seed,startingCapital:'funded',aiCount:6,regionCount:2});
 if(seed==='finance-group-44'){
  const p=E.createProject(s,{title:'Consolidated Origin',sector:'publishing',route:'original',size:.7});
  const sub=E.foundSubsidiary(s,{name:'Division Test',sector:'publishing',capital:50000});
  E.groupInternalLicense(s,p.ipId,sub.id,'publishing',800,52);
 }
 for(let year=0;year<8;year++){
  for(let m=0;m<13;m++){
   for(let w=0;w<4;w++)E.advance(s,1);
   const bad=E.audit(s);A.deepEqual(bad,[],`${seed}: ${JSON.stringify(bad.slice(0,5))}`);
   for(const c of s.companies){
    if(!c.finance)continue;
    const f=E.financialStatements(s,c.id);
    A(Math.abs(f.balance.difference)<.032,`unbalanced ${c.name} ${year} month ${m}`);
    A(Math.abs(f.cashFlow.difference)<.032,`cash differs ${c.name} ${year} month ${m}`);
    A(c.finance.payable>=0 && c.finance.loanBalance>=0,`negative obligations ${c.name}`);
    entities++;
   }
   const consolidated=E.consolidatedStatements(s);
   A(Math.abs(consolidated.balance.difference)<.032,`unbalanced consolidated ${seed}`);
   groups++;periods++;
  }
  if((year+1)%2===0){const restored=E.loadState(JSON.stringify(s));A.deepEqual(E.audit(restored),[]);reloads++;}
 }
 console.log('PASS',seed,'8 years 104 monthly settlements, reconciliation and obligation checks');
}
console.log(`UPDATE44 FINANCE GATE PASS periods=${periods} entityStatements=${entities} groupStatements=${groups} saveReloads=${reloads}`);
