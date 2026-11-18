'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let count=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));count++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function distressed(seed){const s=E.createGame({seed,era:25,origin:'established',startingCapital:'funded',aiCount:6}),c=E.player(s);
 const l=E.borrowLoan(s,20000);
 // Risky but legitimate repeated R&D, not a test-only balance mutation.
 while(c.finance.cash>28000){E.investResearch(s,'publishing',25000);}
 for(let k=0;k<95&&l.status!=='delinquent'&&!c.bankrupt;k++)E.advance(s,1);
 A.equal(l.status,'delinquent','real expenditure should produce missed loan service');
 A.deepEqual(E.audit(s),[]);return {s,c,l};}
test('a real R&D funded cash crisis creates unpaid principal and lender refusal of further borrowing',()=>{
 const {s,c,l}=distressed('financial-47-A');const q=E.loanWorkoutQuote47(s,l.id);
 A(q.overduePrincipal+q.overdueInterest>0);A(l.principalOutstanding>0);
 A.equal(E.loanLimit(s),0);A(!c.bankrupt);return {missed:l.missedPeriods,cash:c.finance.cash,arrears:q.overduePrincipal+q.overdueInterest};
});
test('lender restructures remaining debt only once without issuing money or erasing interest',()=>{
 const {s,c,l}=distressed('financial-47-B');const cash=c.finance.cash,interest=l.interestArrears,principal=l.principalOutstanding,oldRate=l.interestRate;
 const q=E.loanWorkoutQuote47(s,l.id);A(q.approved,q.reason);const result=E.restructureLoan47(s,l.id);
 A.equal(c.finance.cash,cash);A.equal(l.principalOutstanding,principal);A.equal(l.interestArrears,interest);
 A(l.interestRate>oldRate);A.equal(l.installmentsDue,0);A.equal(result.principalAtStart,principal);
 A.throws(()=>E.restructureLoan47(s,l.id),/only one/i);
 A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);
 return {principal,interest,oldRate,newRate:l.interestRate};
});
test('rescheduled future monthly principal follows remaining claim, not original draw; audits pass',()=>{
 const {s,l}=distressed('financial-47-C');E.restructureLoan47(s,l.id);
 const baseline=l.principalOutstanding;const week=s.week;
 for(let i=0;i<7;i++)E.advance(s,1);
 A.equal(l.workout47.principalAtStart,baseline);A(l.originalPrincipal>=l.principalOutstanding);
 A(l.installmentsDue>=1);A.deepEqual(E.audit(s),[]);
 return {weekStart:week,weeks:7,loanStatus:l.status,due:l.principalArrears,interest:l.interestArrears};
});
test('bankruptcy never cancels lender balance and disallows fresh workouts',()=>{
 const {s,c,l}=distressed('financial-47-D');const original=l.principalOutstanding;
 c.bankrupt=true;A(!E.loanWorkoutQuote47(s,l.id).approved);A.throws(()=>E.restructureLoan47(s,l.id),/bankrupt/i);
 A.equal(l.principalOutstanding,original);A.deepEqual(E.audit(s),[]);return {outstanding:original};
});
console.log('Update47 lenders '+count+'/4');if(count!==4)process.exitCode=1;
