
function capabilityCost(sector,mode){return mode==='partner'?({movie:CFG.tuning_engine.capabilityCost__001,tv:CFG.tuning_engine.capabilityCost__002,games:CFG.tuning_engine.capabilityCost__003}[sector]||CFG.tuning_engine.capabilityCost__004):({movie:CFG.tuning_engine.capabilityCost__005,tv:CFG.tuning_engine.capabilityCost__006,games:CFG.tuning_engine.capabilityCost__007}[sector]||CFG.tuning_engine.capabilityCost__008);}
function enterSector(s,sector,mode='partner') {
  requireExecutiveControl(s);const c=player(s);if(!SECTORS[sector])throw new Error('Unknown industry.');
  if(!available(sector,s.week))throw new Error('Worldwide '+SECTORS[sector].name+' production opens in Year '+SECTORS[sector].year+'.');
  if(c.capabilities[sector])throw new Error('This company already has access to that industry.');
  if(!['internal','partner'].includes(mode))throw new Error('Invalid entry method.');
  const price=money(capabilityCost(sector,mode)*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);if(c.finance.cash<price+CFG.tuning_engine.enterSector__001)throw new Error('Insufficient cash and operating buffer to enter this industry.');
  expense(s,c,price,'capability','Build '+mode+' '+sector+' capability');c.capabilities[sector]=mode;
  news(s,'Entered '+SECTORS[sector].name,c.name+' now has '+(mode==='partner'?'outsourced/partner':'in-house')+' production capacity.','company');
  return price;
}
// A limited external-bank facility makes financing consequential but requires no
// manual banking paperwork. Credit is a REAL debt, not new profit: outstanding
// principal appears separately from earned revenue and from trade payables.
// Read-only treasury stress test. Only CONTRACTED distributor remittances are
// treated as incoming cash; future audience sales/loans/tax refunds are excluded.
// Future operating costs are estimates, not booked expenses or liabilities.
function liquidityForecast(s,companyId=s.playerId,horizon=CFG.tuning_engine.liquidityForecast__001){
  const c=company(s,companyId);
  if(!c)throw new Error('Unknown company for cash planning.');
  const weeks=clamp(Math.round(Number(horizon)||CFG.tuning_engine.weeks__006),1,CFG.tuning_engine.weeks__007);
  const f=c.finance;
  const receipts=new Map();
  for(const r of s.remittances)if(r.companyId===c.id&&r.dueWeek>s.week&&r.dueWeek<=s.week+weeks)
    receipts.set(r.dueWeek,money((receipts.get(r.dueWeek)||0)+r.amount));
  const production=new Map();
  for(const p of s.projects)if(p.companyId===c.id&&p.status==='active'){
    const b=projectBudget(s,p.id);
    const grossRemaining=money(Math.max(0,b.remainingEstimate??b.plannedTotal-(p.productionSpend||0)));
    const d=p.coProductionId?(s.coProductions||[]).find(d=>d.id===p.coProductionId):null;
    // Sponsor capital is already reserved, not future producer cash. Never
    // charge both firms for the same planned expenditure in the runway view.
    const sponsorFuture=d?.status==='active'?Math.min(d.held,money(grossRemaining*d.capitalFraction)):0;
    const remaining=money(grossRemaining-sponsorFuture);
    const schedule=Math.max(1,Math.ceil((p.weeksTotal-p.weeksDone)/CFG.tuning_engine.schedule__001));
    let allocated=0;
    for(let i=1;i<=Math.min(schedule,weeks);i++){
      const spend=i===schedule?money(remaining-allocated):money(remaining/schedule);
      production.set(s.week+i,money((production.get(s.week+i)||0)+spend));allocated=money(allocated+spend);
    }
  }
  const openBills={
    tax:money(f.taxPayable||0),royalties:outstandingRoyaltyDebt(s,c.id),
    bankInterest:money(f.interestPayable||0),
    vendor:money(Math.max(0,f.payable-(f.taxPayable||0)-outstandingRoyaltyDebt(s,c.id)-(f.interestPayable||0)))
  };
  const loans=(s.loans||[]).filter(l=>l.debtorId===c.id&&l.status!=='paid').map(l=>({...l}));
  const overhead=weeklyOverhead(c,s);
  const timeline=[];let cash=money(f.cash),firstShortfallWeek=null,lowestCash=cash;
  let totalKnownReceipts=0,totalProduction=0,totalLoanService=0,totalScheduledBills=0;
  for(let i=1;i<=weeks;i++){
    const w=s.week+i,knownReceipts=money(receipts.get(w)||0),productionSpend=money(production.get(w)||0);
    let taxAndBills=0,loanService=0;
    // Financial close occurs after the first week of the NEXT period in the
    // engine, and is therefore projected on this exact same world week.
    if(periodAt(w)!==periodAt(w-1)){
      if(openBills){taxAndBills=money(openBills.tax+openBills.royalties+openBills.vendor);openBills.tax=0;openBills.royalties=0;openBills.vendor=0;}
      const closeMonth=periodAt(w-1),accruedWeeks=MONTH_WEEKS[closeMonth];
      for(const loan of loans){
        const interest=money(loan.principalOutstanding*loan.interestRate*accruedWeeks/CFG.tuning_engine.interest__001);
        loan.installmentsDue=Math.min(CFG.tuning_engine.liquidityForecast__002,loan.installmentsDue+1);
        const scheduled=loan.installmentsDue===CFG.tuning_engine.scheduled__001?loan.originalPrincipal:loan.workout47?money(loan.workout47.principalPaidAtStart+loan.workout47.principalAtStart*loan.installmentsDue/CFG.tuning_engine.scheduled__002):money(loan.originalPrincipal*loan.installmentsDue/CFG.tuning_engine.scheduled__003);
        const principal=money(Math.min(loan.principalOutstanding,Math.max(0,scheduled-loan.principalPaid)));
        loanService=money(loanService+interest+principal+loan.interestArrears);
        loan.principalOutstanding=money(loan.principalOutstanding-principal);
        loan.principalPaid=money(loan.principalPaid+principal);
        loan.interestArrears=0;
      }
    }
    const outflows=money(overhead+productionSpend+taxAndBills+loanService);
    cash=money(cash+knownReceipts-outflows);
    if(firstShortfallWeek===null&&cash<0)firstShortfallWeek=i;
    lowestCash=Math.min(lowestCash,cash);
    totalKnownReceipts=money(totalKnownReceipts+knownReceipts);
    totalProduction=money(totalProduction+productionSpend);
    totalLoanService=money(totalLoanService+loanService);
    totalScheduledBills=money(totalScheduledBills+taxAndBills);
    timeline.push({week:w,knownReceipts,overhead,productionSpend,taxAndBills,loanService,outflows,endingCash:cash});
  }
  return {companyId:c.id,startingCash:money(f.cash),horizon:weeks,runwayWeeks:firstShortfallWeek===null?null:firstShortfallWeek-1,
    firstShortfallWeek,lowestCash:money(lowestCash),cashAt4:timeline[Math.min(weeks,CFG.tuning_engine.liquidityForecast__003)-1].endingCash,
    endingCash:cash,weeklyOverhead:overhead,totalKnownReceipts,totalProduction,totalLoanService,totalScheduledBills,
    status:firstShortfallWeek===null?'covered':firstShortfallWeek<=CFG.tuning_engine.liquidityForecast__004?'critical':'watch',
    assumesNoNewSales:true,assumesNoNewCredit:true,timeline};
}

function loanLimit(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c||c.bankrupt)return 0;
  if(s.loans.some(l=>l.debtorId===c.id&&(l.principalOutstanding>0||l.interestArrears>0)))return 0;
  if(c.finance.cash<weeklyOverhead(c,s)*CFG.tuning_engine.loanLimit__001)return 0;
  const backing=Math.max(0,c.finance.cash)*CFG.tuning_engine.backing__001+Math.max(0,c.finance.revenue)*CFG.tuning_engine.backing__002;
  return money(Math.min(CFG.tuning_engine.loanLimit__002,Math.max(CFG.tuning_engine.loanLimit__003,Math.floor(backing/CFG.tuning_engine.loanLimit__004)*CFG.tuning_engine.loanLimit__005)));
}
function borrowLoan(s,amount,companyId=s.playerId){
  requireExecutiveControl(s);const c=company(s,companyId),limit=loanLimit(s,companyId),principal=money(Number(amount));
  if(!c||!Number.isFinite(Number(amount))||!Number.isFinite(principal)||principal<CFG.tuning_engine.borrowLoan__001||principal>limit)
    throw new Error('Loan amount exceeds available secured credit or is below minimum funding.');
  if(!controlledCompanies(s).some(v=>v.id===companyId))
    throw new Error('Cannot fund a company outside the managed group.');
  if(c.id===s.playerId)boardMandate(s,'financing',principal);
  const rate=marketLoanRate(s,c.id);
  const loan={id:id(s,'loan'),debtorId:c.id,originalPrincipal:principal,principalOutstanding:principal,
    principalPaid:0,interestRate:rate,interestCharged:0,interestPaid:0,interestArrears:0,
    principalArrears:0,installmentsDue:0,createdWeek:s.week,missedPeriods:0,status:'current'};
  transact(s,c,'bank-loan-draw',{cash:principal,loan:principal},'Secured fixed-rate external loan');
  s.loans.push(loan);
  if(c.id===s.playerId)boardMandate(s,'financing',principal,true);
  news(s,c.name+' secures working capital',c.name+' borrowed '+shortMoney(principal)+' at '+Math.round(rate*CFG.tuning_engine.borrowLoan__002)+'% annual interest, repayable across 24 monthly closes.','company');
  return loan;
}
function serviceLoans(s,closingWeek){
  const period=periodAt(closingWeek),weeks=MONTH_WEEKS[period];
  for(const loan of s.loans){
    if(loan.status==='paid')continue;
    const c=company(s,loan.debtorId);if(!c)throw new Error('Loan borrower does not exist.');
    const f=c.finance;
    // Repay already-accrued unpaid interest specifically, never as vendor bills.
    const priorInterest=money(Math.min(loan.interestArrears,Math.max(0,f.cash)));
    if(priorInterest>0){
      transact(s,c,'loan-overdue-interest',{cash:-priorInterest,payable:-priorInterest},'Pay previously accrued bank interest');
      loan.interestArrears=money(loan.interestArrears-priorInterest);
      f.interestPayable=money(f.interestPayable-priorInterest);
      loan.interestPaid=money(loan.interestPaid+priorInterest);
    }
    const interest=money(loan.principalOutstanding*loan.interestRate*weeks/CFG.tuning_engine.interest__002);
    if(interest>0){
      const paid=money(Math.min(interest,Math.max(0,f.cash)));
      expense(s,c,interest,'loan-interest','Monthly external loan interest');
      const unpaid=money(interest-paid);
      loan.interestCharged=money(loan.interestCharged+interest);
      loan.interestPaid=money(loan.interestPaid+paid);
      loan.interestArrears=money(loan.interestArrears+unpaid);
      f.interestPayable=money(f.interestPayable+unpaid);
    }
    loan.installmentsDue=Math.min(CFG.tuning_engine.serviceLoans__001,loan.installmentsDue+1);
    // Cumulative scheduled principal prevents rounding drift; unpaid installments
    // remain part of loan principal and cannot be written off automatically.
    const scheduled=loan.installmentsDue===CFG.tuning_engine.scheduled__004?loan.originalPrincipal:
      loan.workout47?money(loan.workout47.principalPaidAtStart+loan.workout47.principalAtStart*loan.installmentsDue/CFG.tuning_engine.scheduled__005):money(loan.originalPrincipal*loan.installmentsDue/CFG.tuning_engine.scheduled__006);
    const due=money(Math.min(loan.principalOutstanding,Math.max(0,scheduled-loan.principalPaid)));
    const principalPaid=money(Math.min(due,Math.max(0,f.cash)));
    if(principalPaid>0){
      transact(s,c,'bank-loan-principal',{cash:-principalPaid,loan:-principalPaid},'Scheduled bank principal repayment');
      loan.principalOutstanding=money(loan.principalOutstanding-principalPaid);
      loan.principalPaid=money(loan.principalPaid+principalPaid);
    }
    loan.principalArrears=money(Math.max(0,due-principalPaid));
    if(loan.principalOutstanding===0&&loan.interestArrears===0){loan.status='paid';loan.missedPeriods=0;}
    else if(loan.principalArrears>0||loan.interestArrears>0){
      loan.status='delinquent';loan.missedPeriods++;
      if(loan.missedPeriods>=CFG.tuning_engine.serviceLoans__002&&c.id===s.playerId)alert(s,'overdue-bank-'+loan.id,CFG.events.messages.serviceLoans__001,
        CFG.events.messages.serviceLoans__002,'critical');
    }else{loan.status='current';loan.missedPeriods=0;}
  }
}
// Optional early principal repayment. Routine bank servicing stays automatic.
// Accrued interest is settled with the specific bank first; payment of already
// booked interest and principal is NEVER new expense or an earnings deduction.
function repayLoan(s,loanId,amount){
  const loan=s.loans.find(l=>l.id===loanId);
  if(!loan||loan.status==='paid')throw new Error('No outstanding bank debt for this contract.');
  const c=company(s,loan.debtorId);
  if(!c||!controlledCompanies(s).some(group=>group.id===c.id))throw new Error('Cannot repay another company\'s bank debt.');
  const payment=money(Number(amount));
  if(!Number.isFinite(Number(amount))||!Number.isFinite(payment)||payment<=0)
    throw new Error('Enter a valid positive repayment amount.');
  const owed=money(loan.principalOutstanding+loan.interestArrears);
  if(payment>owed)throw new Error('Repayment exceeds remaining bank obligations.');
  // Do not allow a voluntary payment to consume the minimum payroll cushion.
  if(payment>money(Math.max(0,c.finance.cash-weeklyOverhead(c,s)*CFG.tuning_engine.repayLoan__001)))
    throw new Error('Repayment would breach the two-week operating cash buffer.');
  const interest=money(Math.min(payment,loan.interestArrears)),principal=money(payment-interest);
  if(interest){
    transact(s,c,'bank-early-interest',{cash:-interest,payable:-interest},'Voluntary settlement of already accrued bank interest');
    c.finance.interestPayable=money(c.finance.interestPayable-interest);
    loan.interestArrears=money(loan.interestArrears-interest);
    loan.interestPaid=money(loan.interestPaid+interest);
  }
  if(principal){
    transact(s,c,'bank-early-principal',{cash:-principal,loan:-principal},'Voluntary early bank principal repayment');
    loan.principalOutstanding=money(loan.principalOutstanding-principal);
    loan.principalPaid=money(loan.principalPaid+principal);
  }
  const scheduled=loan.installmentsDue===CFG.tuning_engine.scheduled__007?loan.originalPrincipal:loan.workout47?money(loan.workout47.principalPaidAtStart+loan.workout47.principalAtStart*loan.installmentsDue/CFG.tuning_engine.scheduled__008):money(loan.originalPrincipal*loan.installmentsDue/CFG.tuning_engine.scheduled__009);
  loan.principalArrears=money(Math.max(0,scheduled-loan.principalPaid));
  if(loan.principalOutstanding===0&&loan.interestArrears===0)loan.status='paid';
  else loan.status=loan.principalArrears||loan.interestArrears?'delinquent':'current';
  if(loan.status!=='delinquent')loan.missedPeriods=0;
  if(c.isPlayer)news(s,CFG.events.messages.repayLoan__001,shortMoney(payment)+' paid against '+c.name+' bank debt. Principal and old interest settled without reducing earnings again.','finance');
  return {loanId:loan.id,interestPaid:interest,principalPaid:principal,remainingPrincipal:loan.principalOutstanding,status:loan.status};
}