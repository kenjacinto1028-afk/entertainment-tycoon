
// Read-only three-statement bridge. All values come from one booked company
// ledger, never a second revenue calculation from projects or channel sales.
// Borrowing and principal repayment are financing cash flows, not earned profit.
// Management disclosure only: liabilities stay in the original ledgers and are
// never rebooked merely to render this view.
function obligationExposure(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c)throw new Error('Unknown company for obligation report.');
  const f=c.finance;
  const royalties=money(s.obligations.filter(o=>o.debtorId===companyId&&o.kind==='royalty').reduce((n,o)=>n+o.amount,0));
  const taxes=money(f.taxPayable||0),interest=money(f.interestPayable||0);
  const vendor=money(f.payable-royalties-taxes-interest);
  const loans=s.loans.filter(l=>l.debtorId===companyId&&l.status!=='paid');
  const principal=money(loans.reduce((n,l)=>n+l.principalOutstanding,0));
  const overduePrincipal=money(loans.reduce((n,l)=>n+l.principalArrears,0));
  const overdueInterest=money(loans.reduce((n,l)=>n+l.interestArrears,0));
  return {companyId,royalties,taxes,interest,vendor,principal,overduePrincipal,overdueInterest,
    deferredRevenue:money(f.deferred),totalPayable:money(f.payable),totalExternalDebt:money(f.payable+principal),
    payableDifference:money(f.payable-royalties-taxes-interest-vendor),
    loanDifference:money((f.loanBalance||0)-principal),
    interestDifference:money(interest-overdueInterest)};
}
// Management-only group exposure: external liabilities are summed by legal debtor;
// no subsidiary cash is silently transferred to service another entity's debts.
// The live register stores legally enforceable amounts once, with counterparty
// and source identity. A future production budget is NOT a payable, nor is an
// option/rights expiry a cash debt. A signed option remains binding until expiry.
function rightsCalendar(s,{companyId=s.playerId,horizonWeeks=CFG.tuning_engine.rightsCalendar__001,includeExpired=false}={}){
  if(!company(s,companyId))throw new Error('Unknown company for rights calendar.');
  const horizon=clamp(Number(horizonWeeks)||CFG.tuning_engine.horizon__001,1,CFG.tuning_engine.horizon__002);
  return s.grants.filter(g=>(g.grantorId===companyId||g.holderId===companyId)&&
    (includeExpired||g.endWeek>s.week&&g.endWeek<=s.week+horizon))
    .map(g=>({grantId:g.id,ipId:g.ipId,sourceTitle:s.ips.find(ip=>ip.id===g.ipId)?.name||'Unknown source',
      media:g.media,kind:g.type,grantorId:g.grantorId,holderId:g.holderId,
      startWeek:g.startWeek,endWeek:g.endWeek,remainingWeeks:g.endWeek-s.week,
      continuationWeeks:g.continuationWeeks||0,
      productionAllowed:g.type==='license'&&!!g.allowsProduction&&available(g.media,s.week)&&g.startWeek<=s.week&&g.endWeek>s.week,
      status:g.endWeek<=s.week?'expired':g.startWeek>s.week?'upcoming':'active',
      requiresConsent:true}))
    .sort((a,b)=>a.endWeek-b.endWeek||a.grantId.localeCompare(b.grantId));
}
function activeObligationRegister(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c)throw new Error('Unknown company for obligation register.');
  const f=c.finance,debts=[];
  const add=(kind,amount,creditorId,sourceId=null)=>{const due=money(amount);if(due>0)debts.push({kind,amount:due,debtorId:c.id,creditorId,sourceId});};
  add('tax-payable',f.taxPayable,'fictional-tax-authority');
  add('bank-interest',f.interestPayable,'fictional-bank');
  for(const l of s.loans.filter(l=>l.debtorId===c.id&&l.principalOutstanding>0))add('loan-principal',l.principalOutstanding,'fictional-bank',l.id);
  for(const o of s.obligations.filter(o=>o.debtorId===c.id))add('royalty',o.amount,o.creditorId,o.id);
  const royalties=money(debts.filter(d=>d.kind==='royalty').reduce((n,d)=>n+d.amount,0));
  const trade=money(f.payable-(f.taxPayable||0)-(f.interestPayable||0)-royalties);
  add('trade-payable',trade,'outside-vendors');
  const deferred=money(f.deferred||0);add('unearned-client-advance',deferred,'commissioning-clients');
  const payoff=money(debts.filter(d=>['tax-payable','bank-interest','royalty','trade-payable'].includes(d.kind)).reduce((n,d)=>n+d.amount,0));
  const principal=money(debts.filter(d=>d.kind==='loan-principal').reduce((n,d)=>n+d.amount,0));
  const escrows=s.escrows.filter(e=>!e.settled&&(e.buyerId===c.id||e.sellerId===c.id))
    .map(e=>({id:e.id,buyerId:e.buyerId,sellerId:e.sellerId,projectId:e.projectId,committedFee:e.fee,held:e.held,advance:e.advance}));
  return {companyId:c.id,debts,rights:rightsCalendar(s,{companyId,horizonWeeks:CFG.tuning_engine.activeObligationRegister__001,includeExpired:true}),escrows,
    totals:{payable:payoff,principal,deferredRevenue:deferred,allLiabilities:money(payoff+principal+deferred)},
    reconciliation:{payableDifference:money(f.payable-payoff),loanDifference:money((f.loanBalance||0)-principal),
      difference:money(Math.abs(f.payable-payoff)+Math.abs((f.loanBalance||0)-principal))},
    note:'Project budgets and rights deadlines are commitments, not booked payables; subsidiary obligations remain with each legal company.'};
}
// Full legal-entity balance presentation. Self-created story IP was expensed on
// creation; inventing a resale price here would violate the accounting identity.
// The underlying rights ledger is disclosed separately at zero booked value.
function balanceSheetDetails(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c)throw new Error('Unknown company for balance sheet.');
  const b=financialStatements(s,companyId).balance;
  const register=activeObligationRegister(s,companyId);
  const assets={cash:b.cash,receivable:b.receivable,prepaid:b.prepaid,inventory:b.inventory,
    investment:b.investment,recognizedIP:0,total:b.assets};
  const liabilities={tax:b.taxPayable,royalty:b.royaltyPayable,interest:b.interestPayable,
    trade:b.otherPayables,deferred:b.deferred,principal:b.loanBalance,total:b.liabilities};
  const ips=s.ips.filter(ip=>ip.ownerId===companyId);
  const details={companyId,companyName:c.name,assets,liabilities,
    equity:{contributed:b.contributedEquity,retainedEarnings:b.retainedEarnings,total:b.equity},
    intellectualProperty:{ownedCount:ips.length,ownedIds:ips.map(ip=>ip.id),recognizedBookValue:0,
      note:'Internally developed source IP has no invented balance-sheet valuation; contractual rights remain in the separate rights ledger.'},
    externallyLicensedCount:s.grants.filter(g=>g.holderId===c.id&&g.type==='license'&&g.endWeek>s.week).length,
    deferredClientCommitments:register.escrows.filter(e=>e.sellerId===c.id).length,
    difference:b.difference};
  if(!c.parentId){const members=controlledCompanies(s,companyId),g=consolidatedStatements(s,companyId);
    details.group={members:members.map(m=>{const x=financialStatements(s,m.id).balance;
      return {companyId:m.id,name:m.name,assets:{cash:x.cash,receivable:x.receivable,prepaid:x.prepaid,inventory:x.inventory,investment:x.investment,total:x.assets},
        liabilities:x.liabilities,equity:x.equity,difference:x.difference};}),
      eliminatedInvestment:g.balance.investmentEliminated,
      eliminatedSubsidiaryCapital:g.balance.subsidiaryCapitalEliminated,
      consolidatedAssets:g.balance.assets,consolidatedLiabilities:g.balance.liabilities,
      consolidatedEquity:g.balance.equity,difference:g.balance.difference};}
  return details;
}

function groupObligationIntegrity(s,rootId=s.playerId){
  const members=controlledCompanies(s,rootId);
  const rows=members.map(c=>{
    const o=obligationExposure(s,c.id),plan=liquidityForecast(s,c.id,CFG.tuning_engine.plan__002);
    const currentLoans=(s.loans||[]).filter(l=>l.debtorId===c.id&&l.status!=='paid');
    return {companyId:c.id,name:c.name,cash:c.finance.cash,royalties:o.royalties,taxes:o.taxes,
      interest:o.interest,trade:o.vendor,principal:o.principal,overduePrincipal:o.overduePrincipal,
      overdueInterest:o.overdueInterest,payable:o.totalPayable,
      atRisk:plan.firstShortfallWeek!==null||currentLoans.some(l=>l.status==='delinquent'),
      firstShortfallWeek:plan.firstShortfallWeek,
      reconciliation:money(o.loanDifference+o.payableDifference+o.interestDifference)};
  });
  const sum=k=>money(rows.reduce((n,r)=>n+r[k],0));
  const group=consolidatedStatements(s,rootId);
  return {rootId,rows,companyCount:rows.length,cash:sum('cash'),royalties:sum('royalties'),
    taxes:sum('taxes'),interest:sum('interest'),trade:sum('trade'),principal:sum('principal'),
    overduePrincipal:sum('overduePrincipal'),overdueInterest:sum('overdueInterest'),
    payable:sum('payable'),atRiskCount:rows.filter(r=>r.atRisk).length,
    payableDifference:money(sum('royalties')+sum('taxes')+sum('interest')+sum('trade')-sum('payable')),
    loanDifference:money(sum('principal')-group.balance.loanBalance),
    cashDifference:money(sum('cash')-group.balance.cash),
    balanceDifference:group.balance.difference};
}
function plannedProjectSpend(p){
  if(!Number.isFinite(p.productionSpend))return null;
  return money(p.budget*(p.weeksTotal?Math.min(1,p.weeksDone/p.weeksTotal):0)+(p.weeksDone>0?p.marketingBudget:0));
}
function closeProjectBudgets(s,c){
  const relevant=s.projects.filter(p=>p.companyId===c.id&&(p.status==='active'||(p.periodProductionSpend||0)>0));
  const rows=relevant.map(p=>{
    const plannedToDate=plannedProjectSpend(p),spentPeriod=money(p.periodProductionSpend||0),
      actualToDate=Number.isFinite(p.productionSpend)?money(p.productionSpend):null,
      plannedPeriod=plannedToDate===null?null:money(Math.max(0,plannedToDate-(p.lastClosedPlannedSpend||0))),
      estimated=projectBudget(s,p.id),approved=estimated.plannedTotal;
    return {projectId:p.id,title:p.title,status:p.status,approvedBudget:approved,
      plannedToDate,actualToDate,varianceToDate:actualToDate===null||plannedToDate===null?null:money(actualToDate-plannedToDate),
      plannedPeriod,spentPeriod,variancePeriod:plannedPeriod===null?null:money(spentPeriod-plannedPeriod),
      estimatedRemaining:p.status==='active'?estimated.remainingEstimate:0,
      projectedVariance:estimated.projectedVariance,historyComplete:p.budgetCloseComplete===true&&estimated.historyComplete===true};
  });
  const sum=key=>money(rows.reduce((n,r)=>n+(r[key]||0),0));
  const historyComplete=rows.every(r=>r.historyComplete);
  return {rows,projectCount:rows.length,historyComplete,approvedTotal:sum('approvedBudget'),
    plannedToDate:sum('plannedToDate'),actualToDate:sum('actualToDate'),
    varianceToDate:sum('varianceToDate'),plannedPeriod:sum('plannedPeriod'),
    spentPeriod:sum('spentPeriod'),variancePeriod:sum('variancePeriod'),
    estimatedRemaining:sum('estimatedRemaining')};
}