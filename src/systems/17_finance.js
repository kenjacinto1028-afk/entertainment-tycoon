
function reviewReleases(s) {
  // The release week counts as week 1 of the sales window.
  for(const p of s.projects)if(p.companyId===s.playerId&&p.status==='released'&&!p.review&&s.week-p.releaseWeek>=CFG.tuning_engine.reviewReleases__001) {
    const expected=p.forecast?.scenario?.expected?.directContribution??null;
    const actual=currentProjectProfit(p);
    const variance=expected===null?null:money(actual-expected);
    const assessment=expected===null?'Historical forecast unavailable':variance>=0?'Ahead of the estimate':'Behind the estimate';
    const drivers=[];
    if(p.creativeHistoryComplete&&p.pitch){drivers.push('Creative direction: '+p.pitch.direction+'; targeted '+p.pitch.targetAudience+' audiences with '+p.pitch.positioning+' positioning.');
      drivers.push('Creative / technical execution: '+p.creativeQuality+' / '+p.technicalQuality+'; critic / audience reception '+p.criticScore+' / '+p.audienceScore+'.');}
    drivers.push('Known project spending '+shortMoney(p.directCost)+' versus approved '+shortMoney(p.plannedTotal)+'.');
    drivers.push('Changing audience wallets, rival launches and release timing may explain demand differences; this is not proven attribution.');
    p.review={week:s.week,horizonWeeks:CFG.tuning_engine.reviewReleases__002,drivers,actualDirect:actual,expectedDirect:expected,variance,actualGross:money(p.stats.totalSales),expectedGross:p.forecast?.scenario?.expected?.gross??null,actualCosts:money(p.directCost-(p.partnerSpend||0)),wholeProductionCosts:money(p.directCost),partnerFunded:money(p.partnerSpend||0),partnerShareCost:money(p.partnerShareCost||0),actualRoyalties:money(p.royaltyCost),releaseQuality:p.quality,estimatedQuality:p.forecast?.estimatedQuality??null,assessment};
    if(p.major)alert(s,'postmortem-'+p.id,'Release postmortem: '+p.title,
      assessment+' after the first 13 sales weeks. Direct contribution '+shortMoney(actual)+(expected===null?' (no original forecast)':' versus '+shortMoney(expected)+' expected')+'. Open Productions for details.','advisory');
  }
}
function launchAI(s,c) {
  if(c.bankrupt||!available(c.sector,s.week)||s.projects.some(p=>p.companyId===c.id&&p.status==='active'))return;
  if(c.finance.cash<SECTORS[c.sector].cost*CFG.tuning_engine.launchAI__001+CFG.tuning_engine.launchAI__002)return;
  const titlesA=CFG.rivals.RIVAL_RELEASE_TITLES;
  const title=pick(s,titlesA)+' '+(Math.floor(rand(s)*CFG.tuning_engine.title__003)+1);
  const idea={companyId:c.id,title,sector:c.sector,route:'original',genre:pick(s,GENRES),size:CFG.tuning_engine.idea__001+rand(s)*CFG.tuning_engine.idea__002,marketing:CFG.tuning_engine.idea__003+rand(s)*CFG.tuning_engine.idea__004};
  try{
    // Rivals occasionally pool real labor and funds on the same terms as the
    // player. They cannot conscript the player's company as a financier.
    if(rand(s)<CFG.tuning_engine.launchAI__003){const q=coProductionQuote(s,{...idea,capitalFraction:CFG.tuning_engine.q__001});
      if(q.partners.length){startCoProduction(s,{...idea,partnerId:q.partners[Math.floor(rand(s)*Math.min(q.partners.length,CFG.tuning_engine.launchAI__004))].id,capitalFraction:CFG.tuning_engine.launchAI__005});return;}}
    createProject(s,idea);
  }catch(e){/* Rival waits for real financing, rights or capacity. */}
}
function newEntrants(s,year) {
  const idx=CFG.world.INDUSTRY_ENTRANTS[year]||[];
  for(const sec of idx) {
    const index=s.companies.filter(c=>c.sector===sec).length;
    const name=(AI_NAMES.filter((n)=>!s.companies.some(c=>c.name===n))[0]||'Independent '+SECTORS[sec].name+' Studio '+index);
    industryDebutFirm44(s,sec,year,name);
  }
  for(const sector of [...new Set(idx)])addBackgroundFirms(s,sector,year);
}
function ensureAlerts(s) {
  const c=player(s),weeklyRunway=CFG.tuning_engine.weeklyRunway__001+Math.max(0,c.teamLevel-1)*CFG.tuning_engine.weeklyRunway__002;
  if(c.finance.cash<weeklyRunway*CFG.tuning_engine.ensureAlerts__001)alert(s,'liquidity-'+yearAt(s.week)+'-'+periodAt(s.week),CFG.events.messages.ensureAlerts__001,CFG.events.messages.ensureAlerts__002,'critical');
  const stress=liquidityForecast(s,c.id,CFG.tuning_engine.stress__001);
  if(stress.firstShortfallWeek!==null){
    const acute=stress.firstShortfallWeek<=CFG.tuning_engine.acute__001&&c.finance.cash<stress.weeklyOverhead*CFG.tuning_engine.acute__002;
    alert(s,'cash-stress-'+yearAt(s.week)+'-'+periodAt(s.week),
      acute?'Immediate cash commitments at risk':'Projected cash runway risk',
      'Under a conservative no-new-sales case, current commitments exceed available cash in '+stress.firstShortfallWeek+' weeks. '+
      'Known receipts and scheduled loan payments are included. Review Financials; new sales may change this forecast.',
      acute?'critical':'advisory');
  }
  delegateRightsRenewals(s);
  for(const g of s.grants)if(g.grantorId===c.id&&g.endWeek>s.week&&g.endWeek-s.week<=CFG.tuning_engine.ensureAlerts__002)alert(s,'expiry-'+g.id,CFG.events.messages.ensureAlerts__003,'The '+SECTORS[g.media].name+' '+g.type+' for '+(s.ips.find(i=>i.id===g.ipId)?.name||'an IP')+' ends in '+(g.endWeek-s.week)+' weeks. Any renewal requires both parties.','critical');
}
// Economic briefings are snapshots of the simulated wallet, NOT company
// receivables. Scenario ranges are uncertain estimates, not foreknowledge.
function recordMarketBrief(s,closingWeek){
  const sector=player(s).sector;
  const regions=activeRegions(s).map(r=>{
    const ec=s.regionalEconomy?.[r.name]||{confidence:1,inflation:CFG.tuning_engine.ec__001,employment:1};
    const wallet=worldMarketBudget(s,sector,r.name,closingWeek);
    return {name:r.name,currency:r.currency,fxRate:ec.fxRate||r.baseFx,wageIndex:ec.wageIndex||1,interestIndex:ec.interestIndex||1,
      confidence:ec.confidence,inflation:ec.inflation,employment:ec.employment,
      walletSource:'observed',cohorts:audienceCohorts(s,r.name).map(c=>({name:c.name,share:c.share})),weeklyAudienceBudget:wallet};
  });
  const total=money(regions.reduce((v,r)=>v+r.weeklyAudienceBudget,0));
  const period=periodAt(closingWeek),year=yearAt(closingWeek);
  const item={id:id(s,'marketbrief'),week:closingWeek,year,period,
    summary: s.macroeconomy<CFG.tuning_engine.item__001?'Soft consumer conditions':s.macroeconomy>CFG.tuning_engine.item__002?'Strong consumer conditions':'Steady consumer conditions',
    globalIndex:money(s.macroeconomy),sector,knownRegions:regions,
    forecast:{type:'estimate',horizonWeeks:CFG.tuning_engine.item__003,conservative:money(total*CFG.tuning_engine.item__004),expected:total,optimistic:money(total*CFG.tuning_engine.item__005),
      explanation:'Scenario ranges assume current wallets and technology; actual future competition, inflation and regional confidence are uncertain.'}};
  s.marketBriefs.unshift(item);if(s.marketBriefs.length>CFG.tuning_engine.recordMarketBrief__001)s.marketBriefs.length=CFG.tuning_engine.recordMarketBrief__002;
  if([CFG.tuning_engine.recordMarketBrief__003,CFG.tuning_engine.recordMarketBrief__004,CFG.tuning_engine.recordMarketBrief__005,CFG.tuning_engine.recordMarketBrief__006].includes(period)){
    const previous=s.quarterlyMarketReports?.[0]||null;
    const earlier=previous?.regionalIndicators||[];
    const walletChange=previous?money(total-earlier.reduce((n,r)=>n+r.weeklyAudienceBudget,0)):null;
    const strongest=regions.slice().sort((a,b)=>b.confidence-a.confidence)[0];
    const shocks=(s.economicShocks||[]).filter(x=>x.week>=closingWeek-CFG.tuning_engine.shocks__001&&x.week<=closingWeek);
    const analysis=(walletChange===null?'First observed quarterly baseline.':
      'Reachable weekly audience wallet '+(walletChange>=0?'grew by ':'fell by ')+shortMoney(Math.abs(walletChange))+' since the previous quarterly close.')+
      ' '+strongest.name+' currently has the strongest consumer confidence. '+
      (shocks.length?shocks.length+' regional disruption(s) occurred; recovery is uncertain.':'No material recorded regional disruptions this quarter.')+
      ' Wage, interest and exchange-rate movements affect operating costs or market reach; forecast ranges are estimates, not guaranteed revenue.';
    const q={id:id(s,'quarterlybrief'),week:closingWeek,year,quarter:Math.floor(period/CFG.tuning_engine.q__002)+1,
      summary:item.summary,analysis,weekWalletChange:walletChange,shocks:shocks.map(x=>({...x})),
      regionalIndicators:regions.map(r=>({...r})),sectorTechnology:technologyReport(s),
      companyCash:player(s).finance.cash,companyCashSource:'observed',
      consumerForecast:{...item.forecast}};
    s.quarterlyMarketReports.unshift(q);if(s.quarterlyMarketReports.length>CFG.tuning_engine.recordMarketBrief__007)s.quarterlyMarketReports.length=CFG.tuning_engine.recordMarketBrief__008;
  }
}
function economicBrief(s){return s.marketBriefs?.[0]||null;}
function quarterlyMarketHistory(s){return s.quarterlyMarketReports||[];}
function closePeriod(s,closingWeek) {
  const year=yearAt(closingWeek),period=periodAt(closingWeek);
  for(const c of s.companies)if(c.filmBacklot&&c.filmBacklot.builtWeek<=closingWeek&&!c.bankrupt){
    const cost=c.filmBacklot.monthlyCost;expense(s,c,cost,'film-studio-operations','Owned film studio maintenance and staffing');
    c.filmBacklot.totalUpkeep=money(c.filmBacklot.totalUpkeep+cost);}
  for(const service of s.streamingServices||[])if(service.active){const c=company(s,service.companyId);if(c&&!c.bankrupt){expense(s,c,service.monthlyCost,'streaming-operations','Hosted streaming service and subscriber support');service.runningCost=money(service.runningCost+service.monthlyCost);}}
  if(s.publishingOutlet?.active&&s.publishingOutlet.createdWeek<=closingWeek){
    const c=company(s,s.publishingOutlet.companyId),cost=s.publishingOutlet.monthlyCost;
    if(c&&!c.bankrupt){expense(s,c,cost,'publishing-outlet-operations','First-party bookstore operating costs');s.publishingOutlet.operatingSpent=money(s.publishingOutlet.operatingSpent+cost);}
  }
  settleInsurance(s);
  for(const c of s.companies)settleRoyaltyObligations(s,c);
  serviceLoans(s,closingWeek); // Interest accrues BEFORE this period's profit tax; principal never reduces profit.
  // Tax remittances are paid explicitly to the abstract tax authority, before
  // settling ordinary payables. Never silently delete an identifiable debt.
  for(const c of [...s.companies,...s.backgroundFirms]){
    const paid=money(Math.min(c.finance.taxPayable||0,Math.max(0,c.finance.cash),Math.max(0,c.finance.payable)));
    if(paid>0){
      transact(s,c,'settle-tax',{cash:-paid,payable:-paid},'Outstanding tax settled');
      c.finance.taxPayable=money(c.finance.taxPayable-paid);
    }
  }
  for(const c of [...s.companies,...s.backgroundFirms]) {
    const f=c.finance;const before=money(f.periodRevenue-f.periodExpense);
    const taxBeforeCredits=money(Math.max(0,before)*companyTaxRate(c));
    const eligibleCredits=money((f.creditCarry||0)+(f.periodCreditEarned||0));
    const taxCreditUsed=money(Math.min(taxBeforeCredits,eligibleCredits));
    const tax=money(taxBeforeCredits-taxCreditUsed);
    f.creditCarry=money(eligibleCredits-taxCreditUsed);
    // Unused qualifying tax relief expires at year-end; no cash refund.
    const expiredCredit=period===CFG.tuning_engine.expiredCredit__001?f.creditCarry:0;
    if(period===CFG.tuning_engine.closePeriod__001)f.creditCarry=0;
    if(tax>0)expense(s,c,tax,'automatic-tax','Fictional company tax after automatic regional credit');
    // Pay any remaining tax as a distinct statutory payable, not a generic expense.
    if(f.taxPayable>0&&f.cash>0){const amount=money(Math.min(f.taxPayable,f.cash));
      transact(s,c,'settle-tax',{cash:-amount,payable:-amount},'Current tax balance paid');f.taxPayable=money(f.taxPayable-amount);
    }
    if(f.payable>0&&f.cash>0){
      // Royalties are owed to an identifiable rights holder. Never clear that
      // liability as a generic payroll/vendor payment without paying them.
      const partnerDues=money((s.coProductions||[]).filter(d=>d.producerId===c.id).reduce((n,d)=>n+d.shareAccrued-d.sharePaid,0));
      const reserved=money(outstandingRoyaltyDebt(s,c.id)+partnerDues+(f.taxPayable||0)+(f.interestPayable||0));
      const paid=money(Math.min(Math.max(0,f.payable-reserved),f.cash));
      if(paid>0)transact(s,c,'settle-payables',{cash:-paid,payable:-paid},'Automatic settlement of non-royalty accrued payables');
    }
    const opening=f.periodOpening||statementPosition(f);
    const ending=statementPosition(f);
    const operating=money(f.periodOperatingCash||0),financing=money(f.periodFinancingCash||0),investing=money(f.periodInvestingCash||0);
    const net=money(f.periodRevenue-f.periodExpense);
    const indirectOperating=money(net+(ending.deferred-opening.deferred)+(ending.payable-opening.payable)
      -(ending.prepaid-opening.prepaid)-(ending.receivable-opening.receivable)-(ending.inventory-opening.inventory));
    const flowExpected=money(opening.cash+operating+financing+investing);
    const reportCashFlow={openingCash:opening.cash,operating,financing,investing,
      endingCash:ending.cash,expectedEndingCash:flowExpected,difference:money(ending.cash-flowExpected),
      indirectOperating,indirectDifference:money(operating-indirectOperating),
      cashIn:f.periodCashIn,cashOut:f.periodCashOut};
    const balanceAssets=money(ending.cash+ending.prepaid+ending.receivable+ending.investment+ending.inventory);
    const balanceLiabilities=money(ending.deferred+ending.payable+ending.loanBalance);
    const balanceEquity=money(f.equity+f.revenue-f.expense);
    const reportBalance={...ending,assets:balanceAssets,liabilities:balanceLiabilities,equity:balanceEquity,
      difference:money(balanceAssets-balanceLiabilities-balanceEquity)};
    // Current-period counters do not depend on the compacted journal window.
    // Migrated mid-period saves are explicitly uncertified for their first close.
    const journalStart=closingWeek-MONTH_WEEKS[period];
    const closeSettlements={};
    for(const key of Object.keys(DUTY_KINDS))closeSettlements[key]={...f.periodDuty[key]};
    const closingOutstanding={tax:money(f.taxPayable||0),royalty:outstandingRoyaltyDebt(s,c.id),interest:money(f.interestPayable||0)};
    const settlementSnapshot={...closeSettlements,openingWeek:journalStart,endingWeek:closingWeek,
      source:'exact-period-counters',complete:f.periodHistoryComplete===true&&f.periodDutyComplete===true,
      openingOutstanding:{...f.periodDutyOpening},closingOutstanding};
    const closedBudget=closeProjectBudgets(s,c);
    const closing={id:id(s,'report'),week:closingWeek,year,period,name:MONTHS[period],companyId:c.id,revenue:f.periodRevenue,expense:f.periodExpense,net:money(f.periodRevenue-f.periodExpense),cash:f.cash,payable:f.payable,deferred:f.deferred,cashIn:f.periodCashIn,cashOut:f.periodCashOut,tax,taxRate:companyTaxRate(c),homeRegion:taxRegion(c).name,taxBeforeCredits,taxCreditUsed,expiredCredit,loanBalance:f.loanBalance||0,interestPayable:f.interestPayable||0,historyComplete:f.periodHistoryComplete===true,settlements:settlementSnapshot,budget:closedBudget,cashFlow:reportCashFlow,balance:reportBalance};
    if(c.isPlayer){const risk=liquidityForecast(s,c.id,CFG.tuning_engine.risk__001);closing.cashRunwayWeeks=risk.runwayWeeks;closing.forecastCash13=risk.endingCash;closing.forecastAssumption='no-new-sales';}
    if(c.isPlayer||c.parentId===s.playerId)s.reports.push(closing);
    if(c.isPlayer){news(s,MONTHS[period]+' financial close','Revenue '+shortMoney(closing.revenue)+' · expenses '+shortMoney(closing.expense)+' · cash '+shortMoney(closing.cash)+'.','finance');}
    f.periodRevenue=0;f.periodExpense=0;f.periodCashIn=0;f.periodCashOut=0;f.periodCreditEarned=0;resetPeriodBridge(f,closingOutstanding);
    // Reset only after the period snapshot, never before the audit evidence.
    for(const p of s.projects)if(p.companyId===c.id){
      p.periodProductionSpend=0;p.lastClosedPlannedSpend=plannedProjectSpend(p)||0;p.budgetCloseComplete=true;
    }
  }
  // Newest group member closes together; keep parent first for legacy readers.
  s.reports.sort((a,b)=>b.week-a.week || (a.companyId===s.playerId?-1:b.companyId===s.playerId?1:0));
  if(s.reports.length>CFG.tuning_engine.closePeriod__002)s.reports.length=CFG.tuning_engine.closePeriod__003;
  recordMarketBrief(s,closingWeek);
  if(period===CFG.tuning_engine.closePeriod__004||period===CFG.tuning_engine.closePeriod__005||period===CFG.tuning_engine.closePeriod__006||period===CFG.tuning_engine.closePeriod__007){news(s,CFG.events.messages.closePeriod__001,'The market is '+(s.macroeconomy<CFG.tuning_engine.closePeriod__008?'soft':'steady')+'. Rival studios remain sensitive to real budgets and production costs.','world');}
}