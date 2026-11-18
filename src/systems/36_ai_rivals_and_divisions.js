
function rivalMarketConcentration(s,sector='publishing'){
 if(!SECTORS[sector])throw new Error('Unknown rivalry sector.');
 const firms=s.companies.filter(c=>c.sector===sector),rows=firms.map(c=>{
  const latest=s.snapshots.filter(x=>x.companyId===c.id&&x.annualRevenue!==null).at(-1);
  return {companyId:c.id,name:c.name,revenue:money(latest?.annualRevenue||0),bankrupt:c.bankrupt};
 }).sort((a,b)=>b.revenue-a.revenue);
 const total=money(rows.reduce((n,r)=>n+r.revenue,0));
 return {sector,source:'actual prior-year books for detailed firms only',total,leaders:rows.map(x=>({...x,share:total>0?money(x.revenue/total):0})),topThreeShare:total>0?money(rows.slice(0,CFG.tuning_engine.rivalMarketConcentration__001).reduce((n,r)=>n+r.revenue,0)/total):0,
  caveat:'Background firms contribute separately to finite audience competition; no rubber-band market-share redistribution.'};
}
function rivalIntelligence(s,companyId){
 const c=company(s,companyId);if(!c||c.id===s.playerId)throw new Error('Choose a competitor.');
 const publicFacts={name:c.name,sector:c.sector,foundedYear:c.foundedYear,reputation:c.reputation,
  releases:s.projects.filter(x=>x.companyId===c.id&&x.status==='released').length,bankrupt:!!c.bankrupt,source:'known'};
 const observed=s.snapshots.filter(x=>x.companyId===c.id&&x.annualRevenue!==null).at(-1);
 const estimate=observed?{annualSalesBand:[money(observed.annualRevenue*CFG.tuning_engine.estimate__006),money(observed.annualRevenue*CFG.tuning_engine.estimate__007)],source:'estimated',asOfYear:observed.year}:
  {annualSalesBand:null,source:'unknown',asOfYear:null};
 const strategy={style:c.aiIdentity?.style||'unknown',likelyFocus:c.aiIdentity?.style==='expansionist'?'capacity':c.aiIdentity?.style==='deal-maker'?'partnerships':'specialization',source:'estimated',
  note:'Private forecasts and exact cash, liabilities and management plans are not exposed.'};
 return {companyId,publicFacts,financialEstimate:estimate,strategy};
}
function institutionsReport(s){ensure42A(s);return {names:{...s.institutions},
  lending:'External loans are underwritten from cash, revenues, debt and regional interest rates.',
  talent:'Named agents and guilds enforce existing negotiated salaries, appointments and creative approvals.',
  regulation:'Globally fixed debut years and valid content/rights permissions cannot be bypassed.',
  paperwork:'Automated except for material financing, talent and rights decisions.'};}
const _createGame41=createGame;
createGame=function(input){const s=_createGame41(input);ensure42A(s);return s;};
// Team leaders recruited midyear must never drift past contractual expiry
// while waiting for the base game's annual staff-review cadence.
function maintainMidyearStaffContracts(s){
 for(const person of s.employees||[]){
  if(person.status!=='employed'||person.contractEndWeek>s.week)continue;
  const employer=company(s,person.employerId);
  if(!employer||employer.bankrupt||person.morale<CFG.tuning_engine.maintainMidyearStaffContracts__001){departLeader(s,person,'departed');continue;}
  person.contractEndWeek=s.week+CFG.tuning_engine.maintainMidyearStaffContracts__002;
  person.history.push({week:s.week,kind:'renewed',companyId:person.employerId,teamId:person.teamId,weeklySalary:person.weeklySalary});
  if(person.history.length>CFG.tuning_engine.maintainMidyearStaffContracts__003)person.history=person.history.slice(-CFG.tuning_engine.maintainMidyearStaffContracts__004);
 }
}
const _singleWeek41=singleWeek;
singleWeek=function(s){_singleWeek41(s);rivalQuarterly(s);rivalYearlyPopulation(s);maintainMidyearStaffContracts(s);};
const _loadState41=loadState;
loadState=function(raw){const s=_loadState41(raw);ensure42A(s);return s;};

// UPDATE 42B — cash-backed revolving bank facility, automatic underwriting,
// voluntary organizational divisions and paid shared corporate services.
const CENTRAL_SERVICES=CFG.finance.CENTRAL_SERVICES;
function ensure42B(s){
 if(!Array.isArray(s.creditLines))s.creditLines=[];
 for(const c of s.companies){if(!Array.isArray(c.divisions))c.divisions=[];
  if(!c.sharedServices)c.sharedServices={finance:false,hr:false,legal:false};
  for(const t of c.teams)if(t.divisionId===undefined)t.divisionId=null;}
}
function automaticLenderDecision(s,companyId=s.playerId,product='term'){
 const c=company(s,companyId);if(!c)throw new Error('Unknown loan applicant.');
 const f=c.finance,active=(s.creditLines||[]).find(x=>x.companyId===c.id&&x.expiresWeek>s.week),
  interest=money(Math.max(CFG.tuning_engine.interest__003,marketLoanRate(s,c.id)+(product==='revolver'?CFG.tuning_engine.interest__004:0)-(c.sharedServices?.finance?CFG.tuning_engine.interest__005:0)));
 const leverage=money((f.loanBalance||0)/Math.max(1,f.cash+f.receivable+f.inventory));
 const delinquent=(s.loans||[]).some(l=>l.debtorId===c.id&&l.status==='delinquent');
 const limit=loanLimit(s,c.id),cashReserve=money(estimateWeeklyPayroll(s,c.id)*CFG.tuning_engine.cashReserve__001);
 let reason='Approved based on existing assets, observed receipts and operating cash.';
 if(c.bankrupt)reason='Applicant is insolvent.';
 else if(delinquent)reason='Unpaid overdue bank obligations.';
 else if(leverage>CFG.tuning_engine.automaticLenderDecision__001)reason='Too much debt relative to liquid assets.';
 else if(product==='revolver'&&active)reason='Existing live revolving facility must be used or expire first.';
 else if(f.cash<cashReserve)reason='Less than four weeks of operating cash.';
 else if(limit<CFG.tuning_engine.automaticLenderDecision__002)reason='Collateral-backed borrowing capacity is insufficient.';
 if(!['term','revolver'].includes(product))throw new Error('Unknown lending product.');
 return {companyId:c.id,product,approved:reason.startsWith('Approved'),limit:reason.startsWith('Approved')?limit:0,
  annualRate:interest,weeklyOperatingReserve:cashReserve,leverage,reason,source:'underwritten bank decision (not earned revenue)'};
}
function openCreditLine(s,companyId=s.playerId,requestedLimit){
 requireExecutiveControl(s);ensure42B(s);
 if(!controlledCompanies(s).some(c=>c.id===companyId))throw new Error('Only managed firms can apply to the bank.');
 const decision=automaticLenderDecision(s,companyId,'revolver'),limit=money(Number(requestedLimit??decision.limit));
 if(!decision.approved||!Number.isFinite(limit)||limit<CFG.tuning_engine.openCreditLine__001||limit>decision.limit)throw new Error(decision.approved?'Requested credit exceeds underwriting limit.':decision.reason);
 const c=company(s,companyId),fee=money(limit*CFG.tuning_engine.fee__015);
 if(c.finance.cash<fee+estimateWeeklyPayroll(s,companyId)*CFG.tuning_engine.openCreditLine__002)throw new Error('Bank origination fee would breach the operating buffer.');
 if(c.id===s.playerId)boardMandate(s,'financing',limit);
 expense(s,c,fee,'bank-facility-fee','External bank commitment fee; no draw or revenue');
 const line={id:id(s,'credit'),companyId:c.id,limit,interestRate:decision.annualRate,openingWeek:s.week,
  expiresWeek:s.week+CFG.tuning_engine.line__001,fee,closed:false,underwriting:{cash:c.finance.cash,leverage:decision.leverage}};
 s.creditLines.push(line);if(c.id===s.playerId)boardMandate(s,'financing',limit,true);
 if(c.isPlayer)news(s,CFG.events.messages.openCreditLine__001,c.name+' secured a '+shortMoney(limit)+' facility. Only a future draw increases cash and debt; '+shortMoney(fee)+' arrangement cost was paid.','finance');
 return {...line};
}
function creditLineStatus(s,lineId){
 const l=(s.creditLines||[]).find(x=>x.id===lineId);if(!l)throw new Error('Unknown credit line.');
 const outstanding=money(s.loans.filter(x=>x.facilityId===lineId).reduce((n,x)=>n+x.principalOutstanding,0));
 return {id:l.id,companyId:l.companyId,limit:l.limit,outstanding,available:!l.closed&&s.week<l.expiresWeek?money(Math.max(0,l.limit-outstanding)):0,
  expiresWeek:l.expiresWeek,annualRate:l.interestRate,open:!l.closed&&s.week<l.expiresWeek};
}
function drawCreditLine(s,lineId,amount){
 requireExecutiveControl(s);const line=s.creditLines?.find(x=>x.id===lineId),status=line&&creditLineStatus(s,lineId),amountValue=money(Number(amount));
 if(!line||!controlledCompanies(s).some(c=>c.id===line.companyId)||!status.open||!Number.isFinite(Number(amount))||amountValue<CFG.tuning_engine.drawCreditLine__001||amountValue>status.available)
   throw new Error('Credit draw exceeds a valid, unexpired facility commitment.');
 const c=company(s,line.companyId);
 if(c.bankrupt||s.loans.some(l=>l.debtorId===c.id&&l.status==='delinquent'))throw new Error('Bank refused additional funding during insolvency or arrears.');
 if(c.id===s.playerId)boardMandate(s,'financing',amountValue);
 const loan={id:id(s,'loan'),facilityId:line.id,debtorId:c.id,originalPrincipal:amountValue,principalOutstanding:amountValue,
  principalPaid:0,interestRate:line.interestRate,interestCharged:0,interestPaid:0,interestArrears:0,principalArrears:0,installmentsDue:0,createdWeek:s.week,missedPeriods:0,status:'current',type:'revolving-draw'};
 transact(s,c,'bank-revolver-draw',{cash:amountValue,loan:amountValue},'Actual bank revolver draw against committed credit');
 s.loans.push(loan);if(c.id===s.playerId)boardMandate(s,'financing',amountValue,true);
 if(c.isPlayer)news(s,CFG.events.messages.drawCreditLine__001,'Borrowed '+shortMoney(amountValue)+'. Outstanding principal, monthly interest and required amortization are separate from studio profit.','finance');
 return {...loan};
}
function closeCreditLine(s,lineId){
 requireExecutiveControl(s);const l=s.creditLines.find(x=>x.id===lineId),status=l&&creditLineStatus(s,lineId);
 if(!l||!controlledCompanies(s).some(c=>c.id===l.companyId)||!status.open)throw new Error('No controllable live bank facility.');
 if(status.outstanding>0)throw new Error('Repay actual outstanding draws before closing the facility.');
 l.closed=true;l.closedWeek=s.week;return {...l};
}
function createDivision(s,name,companyId=s.playerId){
 requireExecutiveControl(s);ensure42B(s);const c=controlledCompanies(s).find(c=>c.id===companyId);
 name=String(name??'').trim().slice(0,CFG.tuning_engine.createDivision__001);
 if(!c||c.bankrupt||name.length<CFG.tuning_engine.createDivision__002||c.divisions.length>=CFG.tuning_engine.createDivision__003||c.divisions.some(d=>d.name.toLowerCase()===name.toLowerCase()))
  throw new Error('Choose a viable studio and a distinct division name (limit six).');
 const d={id:id(s,'division'),companyId:c.id,name,createdWeek:s.week,active:true};c.divisions.push(d);return {...d};
}