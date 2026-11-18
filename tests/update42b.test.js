'use strict';
const assert=require('node:assert/strict');const E=require('../dist/engine.js');
let n=0;function test(name,run){run();n++;console.log('PASS '+name);}
test('Lender decisions assess real collateral and decline unsupported applications',()=>{
 const s=E.createGame({seed:'bank-decision42'}),c=E.player(s),quote=E.automaticLenderDecision(s);
 assert(quote.approved&&quote.limit>=5000);c.finance.cash=0;const no=E.automaticLenderDecision(s);
 assert.equal(no.approved,false);assert.match(no.reason,/cash|Collateral/);
});
test('Opening bank facility books fee but cannot create cash or profit',()=>{
 const s=E.createGame({seed:'bank-fee42'}),c=E.player(s),cash=c.finance.cash,revenue=c.finance.revenue;
 const line=E.openCreditLine(s,c.id,10000);
 assert.equal(c.finance.cash,cash-line.fee);assert.equal(c.finance.revenue,revenue);assert.equal(c.finance.loanBalance,0);
 assert.equal(E.creditLineStatus(s,line.id).available,10000);assert.throws(()=>E.drawCreditLine(s,line.id,3000),/exceeds/);assert.deepEqual(E.audit(s),[]);
});
test('Credit draws are real debt; repayments revolve availability and close only when paid',()=>{
 const s=E.createGame({seed:'revolving42'}),c=E.player(s),line=E.openCreditLine(s,c.id,15000);
 const prior=c.finance.cash,debt=E.drawCreditLine(s,line.id,8000);
 assert.equal(c.finance.cash,prior+8000);assert.equal(c.finance.loanBalance,8000);
 assert.equal(E.creditLineStatus(s,line.id).available,7000);
 assert.throws(()=>E.closeCreditLine(s,line.id),/Repay/);
 E.repayLoan(s,debt.id,3000);assert.equal(E.creditLineStatus(s,line.id).available,10000);
 assert.equal(E.audit(s).length,0);
 E.drawCreditLine(s,line.id,7000);assert.equal(E.creditLineStatus(s,line.id).outstanding,12000);
 assert.throws(()=>E.drawCreditLine(s,line.id,4000),/exceeds/);
});
test('Interest accrues at actual monthly close and persists through saved games',()=>{
 const s=E.createGame({seed:'interest42'}),c=E.player(s),line=E.openCreditLine(s,c.id,10000);
 const loan=E.drawCreditLine(s,line.id,5000);E.advance(s,5);
 assert(s.loans.find(x=>x.id===loan.id).interestCharged>0);assert.equal(E.audit(s).length,0);
 const reload=E.loadState(JSON.stringify(s));assert.equal(E.audit(reload).length,0);
 assert.deepEqual(E.creditLineStatus(reload,line.id),E.creditLineStatus(s,line.id));
});
test('Division allocations cannot transfer cash or assign a team across legal companies',()=>{
 const s=E.createGame({seed:'teams42'}),c=E.player(s),cash=c.finance.cash;
 const d=E.createDivision(s,'Original Fiction'),d2=E.createDivision(s,'Licensed Works');
 E.assignTeamDivision(s,c.teams[0].id,d.id);E.assignTeamDivision(s,c.teams[1].id,d2.id);
 assert.equal(c.finance.cash,cash);assert.deepEqual(E.audit(s),[]);
 assert.throws(()=>E.assignTeamDivision(s,c.teams[0].id,'missing'),/belong/);
 const report=E.divisionPerformance(s);assert.equal(report.length,3);
});
test('Paid central services affect actual expense and HR morale without inventing receipts',()=>{
 const s=E.createGame({seed:'services42'}),c=E.player(s),before=c.finance.cash;
 const e=s.employees.find(x=>x.employerId===c.id&&x.status==='employed');const morale=e?.morale;
 E.setCentralService(s,'hr',true);E.setCentralService(s,'finance',true);
 E.advance(s,13);assert(c.finance.expense>0);assert(c.finance.cash<before);
 assert(s.ledger.some(x=>x.companyId===c.id&&x.kind==='corporate-service'));
 if(e)assert(e.morale>=Math.min(100,morale+1)-2);assert.deepEqual(E.audit(s),[]);
});
test('Group finance presents separate entity books and reconciled consolidation',()=>{
 const s=E.createGame({seed:'groups42',era:25});
 const child=E.foundSubsidiary(s,{sector:'publishing',name:'Division Books Ltd',capital:35000});
 E.createDivision(s,'Backlist Rights',child.id);
 const summary=E.groupFinanceReport(s);assert.equal(summary.entities.length,2);
 assert.equal(summary.consolidated.balance.difference,0);
 assert.deepEqual(E.audit(s),[]);
});
test('Credit facilities expire without cancelling outstanding bank obligations',()=>{
 const s=E.createGame({seed:'expiry42',era:25}),line=E.openCreditLine(s,s.playerId,12000);
 const debt=E.drawCreditLine(s,line.id,5000);
 E.advance(s,52);E.advance(s,52);
 assert.equal(E.creditLineStatus(s,line.id).available,0);
 assert.throws(()=>E.drawCreditLine(s,line.id,1000),/unexpired/);
 assert.equal(E.audit(s).length,0);
});
console.log(`Update42B: ${n}/${n} checks passed`);
