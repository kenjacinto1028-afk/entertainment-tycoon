
function setRiskPolicy(s,input={}){requireExecutiveControl(s);const c=rootGoverned(s),weeks=Number(input.minCashWeeks),limit=Number(input.reviewLimit),ratio=Number(input.maxDebtRatio);
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.setRiskPolicy__001||weeks>CFG.tuning_engine.setRiskPolicy__002||!Number.isInteger(limit)||limit<CFG.tuning_engine.setRiskPolicy__003||limit>CFG.tuning_engine.setRiskPolicy__004||!Number.isFinite(ratio)||ratio<CFG.tuning_engine.setRiskPolicy__005||ratio>1)
 throw new Error('Invalid company risk settings.');
 c.corporate.policy={minCashWeeks:weeks,reviewLimit:limit,maxDebtRatio:ratio};governanceEvent(s,c,'risk-policy',{weeks,limit,ratio});return corporateRisk(s);}

// Real, optional supply-disruption coverage. No customer wallet, tax pool or
// rival firm receives imaginary income. Insurer reserve is finite; premiums
// are paid from company cash and claims need actual covered payroll evidence.
function setInsurance(s,active){requireExecutiveControl(s);const c=rootGoverned(s);if(s.runStatus==='ended')throw new Error('The campaign is concluded.');
 if(typeof active!=='boolean')throw new Error('Insurance policy must be explicitly enabled or disabled.');
 const i=c.corporate.insurance||(c.corporate.insurance={active:false,startWeek:-1,premium:CFG.tuning_engine.i__001,coveredCost:0,weeklyEvidence:[],premiumsPaid:0,claimsPaid:0});
 if(active&&!i.active&&c.finance.cash<i.premium+weeklyOverhead(c,s)*CFG.tuning_engine.setInsurance__001)throw new Error('Cannot begin insurance without operating cash.');
 if(i.active!==active){i.active=active;i.startWeek=s.week;governanceEvent(s,c,active?'insurance-started':'insurance-cancelled',{monthlyPremium:i.premium});}
 return insuranceStatus(s);
}
function insuranceStatus(s){const c=rootGoverned(s),i=c.corporate.insurance;
 return {active:!!i?.active,monthlyPremium:i?.premium||CFG.tuning_engine.insuranceStatus__001,coveredCost:i?.coveredCost||0,
  lifetimePremium:i?.premiumsPaid||0,lifetimeClaims:i?.claimsPaid||0,insurerReserve:s.insurancePool,
  note:'Supply-shock payroll coverage only: 50 deductible, 60% reimbursement, capped at 2,500 per month and limited by funded insurer reserves. No sales booked.'};}
function accumulateInsurancePayroll(s,c,overhead){const i=c.corporate?.insurance;if(!i?.active||s.week<=i.startWeek)return;
 const region=taxRegion(c).name,index=s.regionalEconomy?.[region]?.wageIndex||1;
 const shock=(s.economicShocks||[]).find(q=>q.region===region&&q.kind==='supply'&&s.week-q.week<=CFG.tuning_engine.shock__001&&q.week<=s.week);
 if(!shock||index<=1)return;
 const extra=money(overhead*(1-1/index));if(extra<=0)return;
 i.coveredCost=money(i.coveredCost+extra);
 i.weeklyEvidence.push({week:s.week,region,shockId:shock.id,wageIndex:index,overhead,extra});
}
function settleInsurance(s){for(const c of s.companies){const i=c.corporate?.insurance;
 if(!i)continue;
 if(i.active&&!c.bankrupt&&c.finance.cash>=i.premium){
  expense(s,c,i.premium,'insurance-premium','Optional limited supply disruption protection');
  s.insurancePool=money(s.insurancePool+i.premium);i.premiumsPaid=money(i.premiumsPaid+i.premium);
  s.insuranceFlows.push({week:s.week,companyId:c.id,kind:'premium',amount:i.premium});
  const basis=money(Math.max(0,i.coveredCost-CFG.tuning_engine.basis__001)),claim=money(Math.min(CFG.tuning_engine.claim__001,s.insurancePool,basis*CFG.tuning_engine.claim__002));
  if(claim>0){s.insurancePool=money(s.insurancePool-claim);i.claimsPaid=money(i.claimsPaid+claim);
   revenue(s,c,claim,'insurance-recovery','Insurer reimbursed documented supply-shock payroll expense');
   s.insuranceFlows.push({week:s.week,companyId:c.id,kind:'claim',amount:claim,exposure:i.coveredCost,
    shockIds:[...new Set(i.weeklyEvidence.map(e=>e.shockId))]});
  }
 }else if(i.active){i.active=false;governanceEvent(s,c,'insurance-lapsed',{reason:'Insufficient cash for policy premium'});}
 i.coveredCost=0;i.weeklyEvidence=[];
}}
function groupInvestmentReview(s){const c=rootGoverned(s),rows=controlledCompanies(s).map(unit=>{
 const weekly=weeklyOverhead(unit,s),f=unit.finance,
  outstanding=s.projects.filter(p=>p.companyId===unit.id&&p.status==='active').reduce((sum,p)=>sum+Math.max(0,(p.budget||0)-(p.spent||0)),0);
 const available=money(f.cash-Math.max(0,f.payable)-weekly*CFG.tuning_engine.available__001-outstanding);
 return {companyId:unit.id,name:unit.name,sector:unit.sector,observedCash:f.cash,
  companyProfit:companyProfit(unit),committedProduction:money(outstanding),weeklyPayroll:weekly,
  availableAfterRisks:available,decision:available>=CFG.tuning_engine.rows__003?'Within cash limits':'Defer discretionary funding'};
 });
 return {rootCompanyId:c.id,units:rows.sort((a,b)=>b.availableAfterRisks-a.availableAfterRisks),
  note:'Advisory portfolio comparison from known controlled legal entities; no automatic funds moved, no intragroup sales created.'};
}
function renameCompany(s,name){requireExecutiveControl(s);const c=rootGoverned(s),next=String(name||'').trim().slice(0,CFG.tuning_engine.next__010);
 if(s.runStatus==='ended'||s.management.status!=='active')throw new Error('No executive authority to rename this company.');
 if(next.length<CFG.tuning_engine.renameCompany__001||next.toLowerCase()===c.name.toLowerCase()||s.companies.some(x=>x.id!==c.id&&x.name.toLowerCase()===next.toLowerCase()))throw new Error('Choose a distinct legal company name.');
 if(c.finance.cash<CFG.tuning_engine.renameCompany__002+weeklyOverhead(c,s)*CFG.tuning_engine.renameCompany__003)throw new Error('Company needs 600 registration cost and cash buffer.');
 const old=c.name;expense(s,c,CFG.tuning_engine.renameCompany__004,'legal-name-change','Company registration of legal business name');c.name=next;
 governanceEvent(s,c,'company-renamed',{oldName:old,newName:next,fee:CFG.tuning_engine.renameCompany__005});
 news(s,'Company renamed: '+next,old+' continues as '+next+' with unchanged legal IP titles, staff, debts and licenses.','company');
 return {oldName:old,newName:next,fee:CFG.tuning_engine.renameCompany__006};
}
function investmentCommittee(s,data={}){const c=rootGoverned(s),kind=String(data.kind||''),amount=money(Number(data.amount)),risk=corporateRisk(s);
 if(!['expansion','financing','acquisition','major-release','technology'].includes(kind)||!Number.isFinite(Number(data.amount))||amount<=0)
 throw new Error('Unknown investment case or invalid amount.');
 const cashAfter=money(c.finance.cash-amount),approved=cashAfter>=risk.cashBuffer&&risk.loanToValue<=c.corporate.policy.maxDebtRatio;
 const out={kind,amount,approved,availableCash:c.finance.cash,downsideCash:money(risk.scenarios.conservative-amount),
  warning:approved?'Within current real cash and authority limits.':'Escalate: downside cash or debt exposure exceeds policy.',
  financeBasis:'Observed legal-company cash, liabilities and payroll only; no projected customer sale was booked.'};
 // Committee review is advisory: no debit, no equity transfer, no rights transfer.
 governanceEvent(s,c,'committee-reviewed',{kind,amount,approved});return out;}
function boardVote(s,kind,amount=0){if(kind!=='succession')requireExecutiveControl(s);const c=corporationOnly(s),v=Number(amount),policy=c.corporate.policy;
 if(!['expansion','financing','succession','ipo','investment','restructuring'].includes(kind)||!Number.isFinite(v)||v<0||v>CFG.tuning_engine.boardVote__001)
 throw new Error('Invalid corporation resolution.');
 const risk=corporateRisk(s),independentSupport=kind==='succession'||kind==='ipo'||v<=Math.max(0,c.finance.cash-risk.cashBuffer)&&risk.loanToValue<=policy.maxDebtRatio;
 const votes=c.corporate.board.map((m,i)=>({directorId:m.id,vote:i===0?'yes':independentSupport?'yes':'no'}));
 const approved=votes.filter(x=>x.vote==='yes').length>=CFG.tuning_engine.approved__001;
 const row={id:id(s,'resolution'),kind,amount:money(v),week:s.week,expiresWeek:s.week+CFG.tuning_engine.row__011,votes,approved,used:false};
 c.corporate.resolutions.push(row);
 governanceEvent(s,c,'board-resolution',{resolutionId:row.id,kind,approved});
 return {...row};}
function boardMandate(s,kind,amount,use=false){const c=rootGoverned(s),g=c.corporate;if(g.stage==='founder'||amount<g.policy.reviewLimit)return null;
 const r=g.resolutions.findLast(r=>r.kind===kind&&r.approved&&!r.used&&r.week<=s.week&&r.expiresWeek>=s.week&&r.amount>=amount);
 if(!r)throw new Error('Board authorization required for material '+kind+' commitments.');
 if(use)r.used=true;return r;}
function issueShares(s,amount,kind){const c=corporationOnly(s),q=money(Number(amount));
 if(s.runStatus!=='active')throw new Error('Resolve executive control before issuing equity.');
 if(!Number.isFinite(Number(amount))||q<CFG.tuning_engine.issueShares__001||q>CFG.tuning_engine.issueShares__002||q>s.investorPool)throw new Error('Investor capital offer exceeds the finite funded market pool or permitted range.');
 const valuation=corporateValuation(s).expected,total=c.corporate.shares.founder+c.corporate.shares.investor+c.corporate.shares.public;
 const shares=Math.max(1,Math.ceil(total*q/valuation));if(shares>total*CFG.tuning_engine.issueShares__003)throw new Error('Issuance is too dilutive for one funding round.');
 // External investors pay company treasury; this is paid-in equity, NOT sales.
 transact(s,c,'outside-equity-contribution',{cash:q,equity:q},'External shareholder capital received (not revenue)');
 c.corporate.shares[kind]=c.corporate.shares[kind]+shares;
 s.investorPool=money(s.investorPool-q);
 c.corporate.fundings.push({week:s.week,amount:q,shares,kind});
 governanceEvent(s,c,'equity-raised',{amount:q,shares,kind});
 if(corporateStatus(s).ownership.founderShare<CFG.tuning_engine.issueShares__004&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {amount:q,shares,stage:c.corporate.stage,founderVoteShare:corporateStatus(s).ownership.founderShare};}
function raiseEquity(s,amount){requireExecutiveControl(s);const c=corporationOnly(s);if(c.corporate.stage!=='private-corporation')throw new Error('Private equity is available only before public listing.');return issueShares(s,amount,'investor');}