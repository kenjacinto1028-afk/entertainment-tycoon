'use strict';const E=require('../dist/engine.js'),A=require('node:assert/strict');let n=0;
function test(name,fn){try{console.log('PASS',name,JSON.stringify(fn()||{}));n++;}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
const make=(seed)=>E.createGame({era:25,origin:'established',seed,startingCapital:'funded',aiCount:6});
test('secured term loan grows cash and debt equally, then accrues real interest with principal repayment',()=>{
 const s=make('loan-46'),c=E.player(s),cash=c.finance.cash,profit=E.companyProfit(c);
 const loan=E.borrowLoan(s,20000);A.equal(c.finance.cash,cash+20000);A.equal(c.finance.loanBalance,20000);A.equal(E.companyProfit(c),profit);
 A.equal(E.loanLimit(s),0);for(let i=0;i<104;i++)E.advance(s,1);
 A(loan.interestCharged>0);A(loan.principalPaid>0);A(loan.principalOutstanding<20000);A.equal(loan.originalPrincipal,loan.principalPaid+loan.principalOutstanding);
 A.deepEqual(E.audit(s),[]);return {interest:loan.interestCharged,principalPaid:loan.principalPaid,status:loan.status};
});
test('revolving credit limits, reserve and expiry are enforced without manufactured revenue',()=>{
 const s=make('revolve-46'),c=E.player(s),line=E.openCreditLine(s,c.id,20000),profit=E.companyProfit(c);
 A.equal(E.creditLineStatus(s,line.id).available,20000);
 const draw=E.drawCreditLine(s,line.id,6000);A.equal(E.creditLineStatus(s,line.id).outstanding,6000);A.equal(E.companyProfit(c),profit);
 A.throws(()=>E.drawCreditLine(s,line.id,16000),/exceeds/);A.throws(()=>E.closeCreditLine(s,line.id),/repay/i);
 E.repayLoan(s,draw.id,6000);A.equal(E.creditLineStatus(s,line.id).outstanding,0);E.closeCreditLine(s,line.id);A(!E.creditLineStatus(s,line.id).open);
 A.deepEqual(E.audit(s),[]);return {bankFee:line.fee,repaid:draw.principalPaid};
});
test('valuation is a forecast, not realizable company cash; equity funds have a finite pool',()=>{
 const s=make('valuation-46'),c=E.player(s);const raw=JSON.stringify(s);const v=E.corporateValuation(s);
 A(v.conservative<v.expected&&v.expected<v.optimistic);A(v.tangibleAssets>=0);A.equal(JSON.stringify(s),raw);
 const startup=E.corporateStatus(s);A.equal(startup.stage,'founder');A.throws(()=>E.raiseEquity(s,10000),/incorporat|corporation/i);
 A(E.corporateReadiness(s).eligible);E.incorporateStudio(s);
 const pool=s.investorPool,cash=c.finance.cash,preProfit=E.companyProfit(c),preShare=E.corporateStatus(s).ownership.founderShare;
 E.raiseEquity(s,12000);A.equal(c.finance.cash,cash+12000);A.equal(E.companyProfit(c),preProfit);A.equal(s.investorPool,pool-12000);
 A(E.corporateStatus(s).ownership.founderShare<preShare);A.equal(E.corporateValuation(s).founderShare,E.corporateStatus(s).ownership.founderShare);
 A.deepEqual(E.audit(s),[]);A.deepEqual(E.audit(E.loadState(JSON.stringify(s))),[]);return {preShare,postShare:E.corporateStatus(s).ownership.founderShare};
});
console.log(`Update46 finance ${n}/3`);if(n!==3)process.exitCode=1;
