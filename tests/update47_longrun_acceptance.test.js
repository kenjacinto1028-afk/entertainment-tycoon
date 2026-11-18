'use strict';
const E=require('../dist/engine.js'),A=require('node:assert/strict'),fs=require('node:fs');
let pass=0;function check(label,fn){try{let r=fn();console.log('PASS',label,JSON.stringify(r));pass++;}catch(e){console.error('FAIL',label,e.stack);process.exitCode=1;}}
check('30-year organic staff cohort ages, departs, remains ledger consistent, and is stable on reload',()=>{
 const s=E.createGame({seed:'update47-staff-30yr',era:1,origin:'publisher',startingCapital:'funded',aiCount:5,age:24});
 const original=s.employees.map(e=>({id:e.id,age:e.age}));const originalIds=new Set(original.map(x=>x.id));let yearAudits=0,departed=0;
 for(let year=1;year<=30;year++){
  for(let w=0;w<52;w++)E.advance(s,1);
  A.deepEqual(E.audit(s),[],`audit Year ${year}`);yearAudits++;
  if(year%5===0){const snap=E.loadState(JSON.stringify(s));A.deepEqual(E.audit(snap),[]);}
 }
 A.equal(E.yearAt(s.week),31);A(s.employees.length>0);
 for(const e of s.employees){A(e.id);A(e.age>=18);A(e.history.every(h=>h.week<=s.week));}
 departed=s.employees.filter(e=>e.status!=='employed').length;
 A(departed>0,'some workers must end careers or depart over three decades');
 A(s.employees.filter(e=>originalIds.has(e.id)).every(e=>e.age>=original.find(o=>o.id===e.id).age));
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {years:30,annualAudits:yearAudits,departed,employeeRecords:s.employees.length,sourceIdsKept:originalIds.size};
});
check('genuine lender workout does not destroy claims in later monthly closes or creditor failure',()=>{
 const s=E.createGame({seed:'update47-long-debt',era:25,origin:'established',startingCapital:'funded',aiCount:5}),c=E.player(s),loan=E.borrowLoan(s,20000);
 while(c.finance.cash>28000)E.investResearch(s,'publishing',25000);
 for(let i=0;i<100&&loan.status!=='delinquent'&&!c.bankrupt;i++)E.advance(s,1);
 A.equal(loan.status,'delinquent');const pre=loan.principalOutstanding;
 E.restructureLoan47(s,loan.id);const interest=loan.interestArrears;
 for(let i=0;i<104;i++){E.advance(s,1);if(i%13===0)A.deepEqual(E.audit(s),[]);}
 A(loan.principalOutstanding<=pre);A(loan.principalOutstanding>=0);A(loan.interestArrears>=0);
 A(Math.abs(loan.originalPrincipal-(loan.principalPaid+loan.principalOutstanding))<.031);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {monthsAfterWorkout:24,principalBefore:pre,principalAfter:loan.principalOutstanding,interestAtWorkout:interest,interestAfter:loan.interestArrears,borrowerBankrupt:c.bankrupt};
});
console.log(`UPDATE47 long-run acceptance ${pass}/2`);if(pass!==2)process.exitCode=1;
