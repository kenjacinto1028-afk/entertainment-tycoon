
function news(s, title, body, kind='world') {
  s.news.unshift({id:id(s,'news'),week:s.week,year:yearAt(s.week),title,body,kind});
  // Preserve meaningful releases, rights deals, company closures and sector
  // debuts when routine newsletters roll off the current-news screen.
  // Older monthly-close chatter is deliberately not archived indefinitely.
  if(s.news.length>CFG.tuning_engine.news__001){
    const departed=s.news.pop();
    if(['breakthrough','deal','release','award'].includes(departed.kind)||departed.title.endsWith('closes its doors')){
      if(!Array.isArray(s.archivedNews))s.archivedNews=[];
      s.archivedNews.unshift(departed);
      if(s.archivedNews.length>CFG.tuning_engine.news__002)s.archivedNews.length=CFG.tuning_engine.news__003;
    }
  }
}
function alert(s, key, title, body, kind='critical') {if (s.inbox.some(a=>a.key===key))return; s.inbox.unshift({id:id(s,'alert'),key,title,body,kind,week:s.week,open:true});if(s.inbox.length>CFG.tuning_engine.alert__001)s.inbox.length=CFG.tuning_engine.alert__002;}
function transact(s,c, kind, delta={}, memo='', projectId=null) {
  if(s.runStatus==='ended')throw new Error('A concluded campaign cannot post new business transactions.');
  const f=c.finance;
  const d={equity:money(delta.equity||0),cash:money(delta.cash||0),prepaid:money(delta.prepaid||0),receivable:money(delta.receivable||0),investment:money(delta.investment||0),inventory:money(delta.inventory||0),revenue:money(delta.revenue||0),expense:money(delta.expense||0),deferred:money(delta.deferred||0),payable:money(delta.payable||0),loan:money(delta.loan||0)};
  if(Math.abs(d.cash+d.prepaid+d.receivable+d.investment+d.inventory-(d.revenue-d.expense+d.deferred+d.payable+d.loan+d.equity))>EPS)throw new Error('Unbalanced transaction: '+kind);
  f.equity=money(f.equity+d.equity);f.cash=money(f.cash+d.cash);f.prepaid=money((f.prepaid||0)+d.prepaid);f.receivable=money((f.receivable||0)+d.receivable);f.investment=money((f.investment||0)+d.investment);f.inventory=money((f.inventory||0)+d.inventory);f.revenue=money(f.revenue+d.revenue);f.expense=money(f.expense+d.expense);
  f.deferred=money(f.deferred+d.deferred);f.payable=money(f.payable+d.payable);f.loanBalance=money((f.loanBalance||0)+d.loan);
  f.periodRevenue=money(f.periodRevenue+d.revenue);f.periodExpense=money(f.periodExpense+d.expense);
  if(d.cash>0)f.periodCashIn=money(f.periodCashIn+d.cash);if(d.cash<0)f.periodCashOut=money(f.periodCashOut-d.cash);
  // Classify every actual cash transaction exactly once; noncash receivable,
  // payable and revenue events carry zero direct cash and reconcile indirectly.
  f.periodFinancingCash=money((f.periodFinancingCash||0)+d.loan+d.equity);
  f.periodInvestingCash=money((f.periodInvestingCash||0)-d.investment);
  f.periodOperatingCash=money((f.periodOperatingCash||0)+d.cash-d.loan-d.equity+d.investment);
  // Exact live duty movements survive bounded-journal pruning.  Neither
  // collections nor accrued obligations are reconstructed after the fact.
  for(const [duty,kinds] of Object.entries(DUTY_KINDS))if(kinds.includes(kind)){
    const row=f.periodDuty?.[duty];if(row){
      row.expense=money(row.expense+d.expense);
      row.cashPaid=money(row.cashPaid-Math.min(0,d.cash));
      row.payableChange=money(row.payableChange+d.payable);
    }
  }
  s.ledger.push({id:id(s,'journal'),week:s.week,companyId:c.id,kind,amount:money(Math.max(Math.abs(d.revenue),Math.abs(d.expense),Math.abs(d.cash),Math.abs(d.receivable),Math.abs(d.investment),Math.abs(d.inventory),Math.abs(d.loan),Math.abs(d.equity))),delta:d,projectId,memo});
  if(s.ledger.length>LEDGER_TRIM_AT)s.ledger.splice(0,s.ledger.length-LEDGER_RETAIN);
  return d;
}
// Sales revenue is earned when audiences buy; cash arrives after a short
// distribution remittance delay. Customer spending is counted ONCE at sale.
function bookConsumerReceipt(s,c,amount,kind,memo,projectId) {
  amount=money(amount);if(amount<=0)return;
  transact(s,c,kind,{receivable:amount,revenue:amount},memo,projectId);
  const dueWeek=s.week+CFG.tuning_engine.dueWeek__001;
  let item=s.remittances.find(r=>r.companyId===c.id&&r.dueWeek===dueWeek);
  if(!item){item={id:id(s,'remit'),companyId:c.id,dueWeek,amount:0};s.remittances.push(item);}
  item.amount=money(item.amount+amount);
}
function collectRemittances(s) {
  // The external distributor releases cash already spent by consumers; not
  // a second sale. Active receivables remain exact through save compaction.
  for(const item of s.remittances)if(item.dueWeek<=s.week){
    const c=company(s,item.companyId)||s.backgroundFirms.find(b=>b.id===item.companyId);
    if(!c)throw new Error('Distributor remittance has no company.');
    transact(s,c,'collect-receivable',{cash:item.amount,receivable:-item.amount},'Distributor paid outstanding sales receipts');
  }
  s.remittances=s.remittances.filter(item=>item.dueWeek>s.week);
}
function revenue(s,c,amount,kind='sales',memo='',projectId=null){amount=money(amount);if(amount>0)transact(s,c,kind,{cash:amount,revenue:amount},memo,projectId);}
function expense(s,c,amount,kind='cost',memo='',projectId=null){
  amount=money(amount);if(amount<=0)return;
  const paid=money(Math.min(amount,Math.max(0,c.finance.cash)));
  transact(s,c,kind,{cash:-paid,expense:amount,payable:money(amount-paid)},memo,projectId);
  if(kind==='payroll-overhead'||kind==='minor-overhead'||kind==='automatic-payroll-levy')c.finance.overheadBooked=money((c.finance.overheadBooked||0)+amount);
  if(['automatic-tax','automatic-sales-tax','automatic-payroll-levy'].includes(kind))c.finance.taxPayable=money((c.finance.taxPayable||0)+amount-paid);
  if(kind==='development'||kind==='minor-development') {
    const p=kind==='development'?s.projects.find(x=>x.id===projectId):null;
    const region=REGIONS.find(r=>r.name===(p?.productionRegion||c.productionRegion||REGIONS[0].name))||REGIONS[0];
    // The incentive is a nonrefundable TAX OFFSET, never a cash grant.
    // Qualifying spend can offset tax through the current year only.
    c.finance.periodCreditEarned=money((c.finance.periodCreditEarned||0)+amount*region.incentiveRate);
  }
}
function receiveAdvance(s,c,amount,projectId){amount=money(amount);if(amount>0)transact(s,c,'contract-advance',{cash:amount,deferred:amount},'Client advance (unearned)',projectId);}
function finalizeContract(s,c,fee,advance,projectId){fee=money(fee);advance=money(advance);transact(s,c,'contract-delivery',{cash:money(fee-advance),revenue:fee,deferred:-advance},'Client delivery and remaining fee',projectId);}
function reserveClientFee(s,buyer,seller,fee,project) {
  const advance=money(fee*CFG.tuning_engine.advance__001),remaining=money(fee-advance);
  if(buyer.finance.cash<fee+CFG.tuning_engine.reserveClientFee__001)throw new Error('Client no longer has sufficient committed funding.');
  // A funded contract transfers real cash into supplier advance + protected delivery escrow.
  // The customer holds a prepaid service asset until actual delivery.
  transact(s,buyer,'client-escrow',{cash:-fee,prepaid:fee},'Committed editorial service commission',project.id);
  receiveAdvance(s,seller,advance,project.id);
  const escrow={id:id(s,'escrow'),buyerId:buyer.id,sellerId:seller.id,projectId:project.id,fee,advance,held:remaining,settled:false,
    milestoneAt:Math.ceil(project.weeksTotal*CFG.tuning_engine.escrow__001),milestonePaid:0,milestoneDone:false};
  s.escrows.push(escrow);project.clientId=buyer.id;project.escrowId=escrow.id;project.advance=advance;
}
// An actual 50% completed-work milestone unlocks a protected 30% tranche.
// Funds were reserved by the buyer at contract signing; this is not a new sale.
function releaseClientMilestone(s,project){
  const e=s.escrows.find(x=>x.id===project.escrowId);
  if(!e||e.settled||e.milestoneDone||!e.milestoneAt||project.weeksDone<e.milestoneAt)return;
  const tranche=money(e.fee*CFG.tuning_engine.tranche__001),seller=company(s,e.sellerId);
  if(tranche>e.held||!seller)throw new Error('Contracted client milestone is unfunded.');
  transact(s,seller,'contract-milestone',{cash:tranche,deferred:tranche},'Protected client milestone released',project.id);
  e.held=money(e.held-tranche);e.milestonePaid=tranche;e.milestoneDone=true;
}
function deliverClientFee(s,project) {
  const escrow=s.escrows.find(e=>e.id===project.escrowId);
  if(!escrow||escrow.settled||escrow.projectId!==project.id)throw new Error('Funded client escrow is missing or settled.');
  const seller=company(s,escrow.sellerId),buyer=company(s,escrow.buyerId);
  if(!seller||!buyer||seller.id!==project.companyId)throw new Error('Client escrow parties are invalid.');
  transact(s,buyer,'client-delivery',{prepaid:-escrow.fee,expense:escrow.fee},'Commission received: '+project.title,project.id);
  finalizeContract(s,seller,escrow.fee,money(escrow.advance+(escrow.milestonePaid||0)),project.id);
  escrow.held=0;escrow.settled=true;
  recordCommissionOutcome(s,project,'delivered');
}
// Compact, auditable records of client delivery/cancellation improve a real
// counterparty's willingness to sign future offers; no invented revenue.
function recordCommissionOutcome(s,project,outcome){
  if(!project.clientId||!['delivered','cancelled'].includes(outcome))return;
  if(s.commissionHistory.some(h=>h.projectId===project.id))throw new Error('Commission outcome already recorded.');
  s.commissionHistory.push({id:id(s,'clienthistory'),projectId:project.id,
    producerId:project.companyId,clientId:project.clientId,outcome,week:s.week});
}
function counterpartyTrust(s,clientId,producerId=s.playerId){
  if(!company(s,clientId)||!company(s,producerId))throw new Error('Unknown contract party.');
  const rows=s.commissionHistory.filter(h=>h.clientId===clientId&&h.producerId===producerId);
  const delivered=rows.filter(h=>h.outcome==='delivered').length,cancelled=rows.filter(h=>h.outcome==='cancelled').length;
  return {clientId,producerId,delivered,cancelled,confidence:clamp(1+delivered*CFG.tuning_engine.counterpartyTrust__001-cancelled*CFG.tuning_engine.counterpartyTrust__002,CFG.tuning_engine.counterpartyTrust__003,CFG.tuning_engine.counterpartyTrust__004)};
}