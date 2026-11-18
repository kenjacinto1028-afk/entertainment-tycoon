
function portfolioBudget(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for budget report.');
  const rows=s.projects.filter(p=>p.companyId===companyId&&p.status==='active').map(p=>({
    projectId:p.id,title:p.title,...projectBudget(s,p.id)}));
  const known=rows.filter(r=>r.estimatedTotal!==null);
  const totalPlanned=money(rows.reduce((n,r)=>n+r.plannedTotal,0));
  const totalEstimated=money(known.reduce((n,r)=>n+r.estimatedTotal,0));
  const knownPlanned=money(known.reduce((n,r)=>n+r.plannedTotal,0));
  return {companyId,activeCount:rows.length,knownCount:known.length,totalPlanned,
    knownPlanned,totalEstimated,projectedVariance:money(totalEstimated-knownPlanned),
    remainingEstimate:money(known.reduce((n,r)=>n+r.remainingEstimate,0)),rows};
}

// Read-only, journal-backed settlement evidence. Never infer historical payments
// from outstanding balances; compacted journal windows are explicitly partial.
function settlementEvidence(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for settlement evidence.');
  const kinds={tax:['automatic-tax','automatic-sales-tax','automatic-payroll-levy','settle-tax'],royalty:['royalty','settle-royalty'],interest:['loan-interest','loan-overdue-interest','bank-early-interest','bank-interest-payment']};
  const entries=s.ledger.filter(x=>x.companyId===companyId);
  const latest=s.reports.find(r=>r.companyId===companyId);
  const previous=latest?s.reports.find(r=>r.companyId===companyId&&r.week<latest.week):null;
  const start=latest?(previous?previous.week+1:Math.max(0,latest.week-CFG.tuning_engine.start__001)):Math.max(0,s.week-CFG.tuning_engine.start__002);
  const end=latest?latest.week:s.week;
  const rows=entries.filter(x=>x.week>=start&&x.week<=end);
  const totals={};
  for(const [key,types] of Object.entries(kinds)){
    const selected=rows.filter(x=>types.includes(x.kind));
    totals[key]={expense:money(selected.reduce((n,x)=>n+(x.delta?.expense||0),0)),
      cashPaid:money(-selected.reduce((n,x)=>n+Math.min(0,x.delta?.cash||0),0)),
      payableChange:money(selected.reduce((n,x)=>n+(x.delta?.payable||0),0)),entries:selected.length};
  }
  const f=company(s,companyId).finance;
  const outstanding={tax:money(f.taxPayable||0),royalty:outstandingRoyaltyDebt(s,companyId),interest:money(f.interestPayable||0)};
  const complete=entries.length>0&&entries[0].week<=start&&(!latest||!!previous);
  return {companyId,startWeek:start,endWeek:end,closed:!!latest,historyComplete:complete,
    totals,outstanding,liabilityDifference:money(f.payable-outstanding.tax-outstanding.royalty-outstanding.interest),
    note:complete?'Journal evidence for selected period':'Partial retained journal: no historical amounts reconstructed'};
}


// Cross-entity settlement rollup: never net separate legal obligations or
// present journal-compacted periods as complete evidence.
function groupSettlementEvidence(s,rootId=s.playerId){
  if(!company(s,rootId))throw new Error('Unknown company for group settlement evidence.');
  const ids=controlledCompanies(s,rootId).map(c=>c.id);
  const rows=ids.map(id=>settlementEvidence(s,id));
  const sum=(get)=>money(rows.reduce((n,r)=>n+get(r),0));
  const categories=['tax','royalty','interest'];
  const totals={};
  for(const kind of categories){
    totals[kind]={expense:sum(r=>r.totals[kind].expense),cashPaid:sum(r=>r.totals[kind].cashPaid),
      payableChange:sum(r=>r.totals[kind].payableChange),entries:rows.reduce((n,r)=>n+r.totals[kind].entries,0),
      outstanding:sum(r=>r.outstanding[kind])};
  }
  const group=groupObligationIntegrity(s,rootId);
  return {rootId,companyCount:rows.length,rows,totals,
    historyComplete:rows.every(r=>r.historyComplete),
    samePeriod:rows.every(r=>r.startWeek===rows[0].startWeek&&r.endWeek===rows[0].endWeek),
    otherPayables:sum(r=>r.liabilityDifference),
    payableDifference:group.payableDifference,loanDifference:group.loanDifference,
    cashDifference:group.cashDifference,balanceDifference:group.balanceDifference,
    note:rows.every(r=>r.historyComplete)?'Retained journals cover all companies':'Partial retained journals; historical payments are not reconstructed'};
}

// Closed-period controls operate on preserved snapshots, not compacted journals.
// This deliberately does not certify old saves lacking complete evidence.
function closedSettlementAudit(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for settlement audit.');
  const problems=[];
  for(const r of s.reports.filter(r=>r.companyId===companyId)){
    const snap=r.settlements;
    if(!snap||!snap.complete||r.historyComplete!==true)continue;
    if(!Number.isInteger(snap.openingWeek)||!Number.isInteger(snap.endingWeek)||snap.endingWeek!==r.week||snap.openingWeek>=snap.endingWeek){problems.push(r.id+': invalid settlement period');continue;}
    for(const kind of ['tax','royalty','interest']){
      const v=snap[kind];
      if(!v||!['expense','cashPaid','payableChange'].every(k=>Number.isFinite(v[k]))||v.cashPaid<-CFG.tuning_engine.closedSettlementAudit__001)
        problems.push(r.id+': invalid '+kind+' settlement amounts');
    }
    const outstanding=snap.closingOutstanding;
    if(!outstanding||!['tax','royalty','interest'].every(k=>Number.isFinite(outstanding[k])&&outstanding[k]>=-CFG.tuning_engine.closedSettlementAudit__002))
      problems.push(r.id+': invalid closing settlement obligations');
    if(snap.source==='exact-period-counters'&&snap.complete){
      const opening=snap.openingOutstanding;
      if(!opening||!['tax','royalty','interest'].every(k=>Number.isFinite(opening[k])&&opening[k]>=-CFG.tuning_engine.closedSettlementAudit__003))
        problems.push(r.id+': invalid settlement opening liabilities');
      else for(const k of ['tax','royalty','interest']){
        const v=snap[k];if(!v||!Number.isFinite(v.expense)||!Number.isFinite(v.cashPaid)||!Number.isFinite(v.payableChange))continue;
        if(Math.abs(money(v.expense-v.cashPaid-v.payableChange))>CFG.tuning_engine.closedSettlementAudit__004||
          Math.abs(money(opening[k]+v.payableChange-outstanding[k]))>CFG.tuning_engine.closedSettlementAudit__005)
          problems.push(r.id+': settlement liability bridge mismatch for '+k);
      }
    }
    if(r.cashFlow&&Math.abs(r.cashFlow.difference||0)>CFG.tuning_engine.closedSettlementAudit__006)problems.push(r.id+': historical cash bridge mismatch');
    if(r.balance&&Math.abs(r.balance.difference||0)>CFG.tuning_engine.closedSettlementAudit__007)problems.push(r.id+': historical balance bridge mismatch');
  }
  return problems;
}

// Immutable snapshots survive journal compaction. Older saves remain explicitly unverified.
function closedSettlementHistory(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for closed settlements.');
  return s.reports.filter(r=>r.companyId===companyId).slice(0,CFG.tuning_engine.closedSettlementHistory__001).map(r=>({
    reportId:r.id,week:r.week,period:r.name,year:r.year,
    verified:!!(r.historyComplete&&r.settlements?.complete&&r.settlements.source==='exact-period-counters'),
    tax:r.settlements?.tax?{...r.settlements.tax}:null,royalty:r.settlements?.royalty?{...r.settlements.royalty}:null,interest:r.settlements?.interest?{...r.settlements.interest}:null,
    closingOutstanding:r.settlements?.closingOutstanding?{...r.settlements.closingOutstanding}:null
  }));
}

function financialStatements(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c)throw new Error('Unknown company for financial report.');
  const f=c.finance,net=companyProfit(c);
  const assets=money(f.cash+(f.prepaid||0)+(f.receivable||0)+(f.investment||0)+(f.inventory||0));
  const royaltyPayable=outstandingRoyaltyDebt(s,c.id);
  const taxPayable=f.taxPayable||0;
  const projectedTaxBeforeCredit=money(Math.max(0,f.periodRevenue-f.periodExpense)*companyTaxRate(c));
  const estimatedPeriodTax=money(Math.max(0,projectedTaxBeforeCredit-(f.creditCarry||0)-(f.periodCreditEarned||0)));
  const liabilities=money(f.deferred+f.payable+(f.loanBalance||0));
  const equity=money(f.equity+net);
  const workingCapital=money(f.deferred+f.payable-(f.prepaid||0)-(f.receivable||0)-(f.inventory||0));
  const operatingCash=money(net+workingCapital);
  const investmentCashOutflow=f.investment||0;
  const financingCash=money(f.loanBalance||0); // net proceeds less principal paid since funding
  return {
    income:{revenue:f.revenue,expenses:f.expense,net,taxRate:companyTaxRate(c),homeRegion:taxRegion(c).name,estimatedPeriodTax,unusedEligibleCredit:money((f.creditCarry||0)+(f.periodCreditEarned||0))},
    balance:{cash:f.cash,prepaid:f.prepaid||0,receivable:f.receivable||0,investment:f.investment||0,inventory:f.inventory||0,assets,deferred:f.deferred,payable:f.payable,royaltyPayable,taxPayable,otherPayables:money(f.payable-royaltyPayable-taxPayable-(f.interestPayable||0)),interestPayable:f.interestPayable||0,loanBalance:f.loanBalance||0,liabilities,contributedEquity:f.equity,retainedEarnings:net,equity,liabilitiesAndEquity:money(liabilities+equity),difference:money(assets-liabilities-equity)},
    overhead:{trackedTotal:f.overheadBooked||0,attributedToProductions:f.overheadAttributed||0,unallocated:money((f.overheadBooked||0)-(f.overheadAttributed||0))},
    cashFlow:{netEarnings:net,workingCapital,operatingCash,initialEquity:f.equity,financingCash,investingCashOutflow:investmentCashOutflow,endingCash:money(f.equity+operatingCash+financingCash-investmentCashOutflow),difference:money(f.cash-f.equity-operatingCash-financingCash+investmentCashOutflow),periodCashIn:f.periodCashIn,periodCashOut:f.periodCashOut}
  };
}