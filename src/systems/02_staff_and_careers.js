
function adoptTechnologyForRival(s,c,sector){
 const b=businessTechnology(s,c.id,sector);if(!b.canUpgrade)return null;
 expense(s,c,b.upgradeCost,'licensed-technology','Rival-funded tool upgrade');
 if(!c.techLicenses)c.techLicenses={};c.techLicenses[sector]={wave:b.globalWave,cost:b.upgradeCost,week:s.week};
 return c.techLicenses[sector];
}
function worldMarketBudget(s,sector,regionName,week=s.week){
  if(!SECTORS[sector]||!available(sector,week))return 0;
  const r=activeRegions(s).find(x=>x.name===regionName);if(!r)return 0;
  const maturity=clamp(CFG.tuning_engine.maturity__001+(yearAt(week)-SECTORS[sector].year)*CFG.tuning_engine.maturity__002,CFG.tuning_engine.maturity__003,CFG.tuning_engine.maturity__004);
  const tech=technologyReport(s)[sector];
  const regional=s.regionalEconomy?.[r.name]||{};
  const confidence=regional.confidence||1,fxRate=regional.fxRate||r.baseFx,employment=regional.employment||1;
  return money(r.cash*({publishing:1,movie:CFG.tuning_engine.worldMarketBudget__001,tv:CFG.tuning_engine.worldMarketBudget__002,games:CFG.tuning_engine.worldMarketBudget__003}[sector])*maturity*s.macroeconomy*
    (s.settings.populationScale||1)*confidence*fxRate*clamp(employment,CFG.tuning_engine.worldMarketBudget__004,CFG.tuning_engine.worldMarketBudget__005)*(1+CFG.tuning_engine.worldMarketBudget__006*tech.adoption));
}
function worldSetupWarnings(s){
  const warnings=[];
  if(s.settings.aiCount>CFG.tuning_engine.worldSetupWarnings__001&&s.settings.worldScale===CFG.tuning_engine.worldSetupWarnings__002)warnings.push('Many detailed and background firms increase simulation and save workload.');
  if(s.settings.startingCapital==='lean'&&s.settings.populationScale===CFG.tuning_engine.worldSetupWarnings__003)warnings.push('Low company cash and a small customer market increase insolvency risk.');
  if(s.settings.regionCount<=CFG.tuning_engine.worldSetupWarnings__004)warnings.push('Fewer reachable regions reduce sales opportunities for every company.');
  return warnings;
}
function updateRegionalEconomy(s){
  // One regional cycle per quarter, with bounded inflation, employment and
  // confidence. No consumer money is posted as a corporate asset here.
  if(s.week%CFG.tuning_engine.updateRegionalEconomy__001!==0)return;
  for(const r of REGIONS){const v=s.regionalEconomy[r.name];
    v.confidence=money(clamp(v.confidence+(rand(s)-CFG.tuning_engine.updateRegionalEconomy__002)*CFG.tuning_engine.updateRegionalEconomy__003-(v.confidence-1)*CFG.tuning_engine.updateRegionalEconomy__004,CFG.tuning_engine.updateRegionalEconomy__005,CFG.tuning_engine.updateRegionalEconomy__006));
    v.inflation=money(clamp(v.inflation+(rand(s)-CFG.tuning_engine.updateRegionalEconomy__007)*CFG.tuning_engine.updateRegionalEconomy__008-(v.inflation-CFG.tuning_engine.updateRegionalEconomy__009)*CFG.tuning_engine.updateRegionalEconomy__010,-CFG.tuning_engine.updateRegionalEconomy__011,CFG.tuning_engine.updateRegionalEconomy__012));
    v.employment=money(clamp(v.employment+(rand(s)-CFG.tuning_engine.updateRegionalEconomy__013)*CFG.tuning_engine.updateRegionalEconomy__014-(v.employment-1)*CFG.tuning_engine.updateRegionalEconomy__015,CFG.tuning_engine.updateRegionalEconomy__016,CFG.tuning_engine.updateRegionalEconomy__017));
    v.fxRate=money(clamp((v.fxRate||r.baseFx)+(rand(s)-CFG.tuning_engine.updateRegionalEconomy__018)*CFG.tuning_engine.updateRegionalEconomy__019-(v.fxRate-r.baseFx)*CFG.tuning_engine.updateRegionalEconomy__020,r.baseFx*CFG.tuning_engine.updateRegionalEconomy__021,r.baseFx*CFG.tuning_engine.updateRegionalEconomy__022));
    v.wageIndex=money(clamp((v.wageIndex||1)+v.inflation*CFG.tuning_engine.updateRegionalEconomy__023+(v.employment-1)*CFG.tuning_engine.updateRegionalEconomy__024-(v.wageIndex-1)*CFG.tuning_engine.updateRegionalEconomy__025,CFG.tuning_engine.updateRegionalEconomy__026,CFG.tuning_engine.updateRegionalEconomy__027));
    v.interestIndex=money(clamp(1+(v.inflation-CFG.tuning_engine.updateRegionalEconomy__028)*CFG.tuning_engine.updateRegionalEconomy__029+(1-s.macroeconomy)*CFG.tuning_engine.updateRegionalEconomy__030,CFG.tuning_engine.updateRegionalEconomy__031,CFG.tuning_engine.updateRegionalEconomy__032));
    // Episodic, region-specific disruptions; never create new company cash.
    if(activeRegions(s).some(x=>x.name===r.name)&&rand(s)<CFG.tuning_engine.updateRegionalEconomy__033)applyEconomicShock(s,r.name,rand(s)<CFG.tuning_engine.updateRegionalEconomy__034?'supply':'confidence');
  }
}
function taxRegion(c){return REGIONS.find(r=>r.name===(c.homeRegion||c.productionRegion))||REGIONS[0];}
function companyTaxRate(c){return taxRegion(c).profitTaxRate;}
function player(s) {return company(s,s.playerId);}
function transactionsFor(s, companyId) {return s.ledger.filter(x=>x.companyId===companyId);}
// Exact monthly opening position is retained independently of the bounded journal.
// The snapshot is position-only; previous amounts are never fabricated on migration.
function statementPosition(f){return {cash:money(f.cash),prepaid:money(f.prepaid||0),receivable:money(f.receivable||0),investment:money(f.investment||0),inventory:money(f.inventory||0),deferred:money(f.deferred||0),payable:money(f.payable||0),loanBalance:money(f.loanBalance||0),revenue:money(f.revenue||0),expense:money(f.expense||0)};}
const DUTY_KINDS=Object.freeze(CFG.finance.DUTY_KINDS);
function emptyDutyFlows(){return {tax:{expense:0,cashPaid:0,payableChange:0},royalty:{expense:0,cashPaid:0,payableChange:0},interest:{expense:0,cashPaid:0,payableChange:0}};}
function resetPeriodBridge(f,openingDuties={tax:0,royalty:0,interest:0}){
  f.periodOpening=statementPosition(f);f.periodHistoryComplete=true;
  f.periodOperatingCash=0;f.periodFinancingCash=0;f.periodInvestingCash=0;
  f.periodDuty=emptyDutyFlows();f.periodDutyOpening={...openingDuties};f.periodDutyComplete=true;
}
function financeStart(cash){const f={cash,prepaid:0,receivable:0,equity:cash,revenue:0,expense:0,deferred:0,payable:0,periodRevenue:0,periodExpense:0,periodCashIn:0,periodCashOut:0,creditCarry:0,periodCreditEarned:0,taxPayable:0,loanBalance:0,interestPayable:0,overheadBooked:0,overheadAttributed:0,investment:0,inventory:0,internalRevenue:0,internalExpense:0};resetPeriodBridge(f);return f;}
// A real, compact staff layer: one named leader per team, with the rest of each
// crew abstracted. Named wages REPLACE an embedded base-pay component, rather
// than adding a second payroll expense. Historical talent stays identifiable.
const STAFF_FIRST=CFG.starting.STAFF_FIRST;
const STAFF_LAST=CFG.starting.STAFF_LAST;
const STAFF_TRAITS=CFG.starting.STAFF_TRAITS;
const CULTURES=CFG.starting.CULTURES;
const FOUNDER_BACKGROUNDS=CFG.starting.FOUNDER_BACKGROUNDS;
const FOUNDER_FOCUSES=CFG.starting.FOUNDER_FOCUSES;
function newStaffPerson(s,team=null,c=null,partialHistory=false){
 const staffId=id(s,'employee'),n=hash(s.seed+':'+staffId),first=STAFF_FIRST[n%STAFF_FIRST.length],last=STAFF_LAST[Math.floor(n/CFG.tuning_engine.last__001)%STAFF_LAST.length];
 const salary=CFG.tuning_engine.salary__001+Math.floor(n%CFG.tuning_engine.salary__002);
 const e={id:staffId,name:first+' '+last,role:'Team lead',specialty:team?.specialty||GENRES[n%GENRES.length],trait:STAFF_TRAITS[n%STAFF_TRAITS.length],
    skill:CFG.tuning_engine.e__001+n%CFG.tuning_engine.e__002,age:CFG.tuning_engine.e__003+n%CFG.tuning_engine.e__004,ageAtEntry:CFG.tuning_engine.e__005+n%CFG.tuning_engine.e__006,enteredWeek:s.week,
    status:c?'employed':'candidate',employerId:c?.id||null,teamId:team?.id||null,
    weeklySalary:salary,contractEndWeek:c?s.week+CFG.tuning_engine.e__007:null,hiredWeek:c?s.week:null,leftWeek:null,
    morale:CFG.tuning_engine.e__008+n%CFG.tuning_engine.e__009,completed:0,historyComplete:!partialHistory,
    history:c?[{week:s.week,kind:'hired',companyId:c.id,teamId:team.id,weeklySalary:salary,generated:!!partialHistory}]:[]};
 return e;
}
function assignInitialLeader(s,c,t,partialHistory=false){
 if(!Array.isArray(s.employees))s.employees=[];
 const leader=newStaffPerson(s,t,c,partialHistory);s.employees.push(leader);t.leaderId=leader.id;
 return leader;
}
function seedCandidates(s,target=CFG.tuning_engine.seedCandidates__001){
 if(!Array.isArray(s.candidates))s.candidates=[];
 const needed=Math.min(CFG.tuning_engine.needed__001,Math.max(0,target-s.candidates.length));
 for(let i=0;i<needed;i++)s.candidates.push(newStaffPerson(s));
}
function candidatePool(s){return (s.candidates||[]).filter(p=>p.status==='candidate').sort((a,b)=>b.skill-a.skill||a.id.localeCompare(b.id)).map(p=>({...p,history:p.history.slice()}));}
function employeeRoster(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company personnel register.');
 return {companyId:c.id,culture:c.culture||'balanced',weeklyPayroll:estimateWeeklyPayroll(s,c.id),
   active:s.employees.filter(x=>x.employerId===c.id&&x.status==='employed').map(e=>({...e,history:e.history.slice(-CFG.tuning_engine.employeeRoster__001)})),
   vacancies:c.teams.filter(t=>!t.leaderId).map(t=>({teamId:t.id,name:t.name,specialty:t.specialty})),
   careers:s.employees.filter(x=>x.history?.some(h=>h.companyId===c.id)&&x.status!=='employed').slice(-CFG.tuning_engine.employeeRoster__002).map(x=>({id:x.id,name:x.name,status:x.status,leftWeek:x.leftWeek,completed:x.completed})),
   note:'One named decision-maker per production team. Other employees remain abstracted; no mandatory individual task scheduling.'};
}
function hireCandidate(s,candidateId,teamId){requireExecutiveControl(s);return staffHire(s,candidateId,teamId,false);}
function staffHire(s,candidateId,teamId,forAI=false){
 const c=s.companies.find(c=>c.teams?.some(t=>t.id===teamId));
 if(c&&!controlledCompanies(s).some(x=>x.id===c.id)&&!forAI)throw new Error('Only owned companies may recruit directly.');
 if(!c||c.bankrupt)throw new Error('Only a solvent, owned production team may recruit.');
 const t=c.teams.find(t=>t.id===teamId);
 if(t.leaderId)throw new Error('Team leader position is occupied.');
 const idx=s.candidates.findIndex(e=>e.id===candidateId&&e.status==='candidate');if(idx<0)throw new Error('Candidate is unavailable or already employed.');
 const e=s.candidates[idx],fee=money(e.weeklySalary*CFG.tuning_engine.fee__001);
 if(c.finance.cash<fee+weeklyOverhead(c,s)*CFG.tuning_engine.staffHire__001+CFG.tuning_engine.staffHire__002)throw new Error('Insufficient cash and payroll reserve to fund recruitment.');
 expense(s,c,fee,'staff-recruitment','Recruit '+e.name+' to '+t.name);
 s.candidates.splice(idx,1);e.status='employed';e.employerId=c.id;e.teamId=t.id;e.hiredWeek=s.week;e.contractEndWeek=s.week+CFG.tuning_engine.staffHire__003;e.leftWeek=null;
 e.history.push({week:s.week,kind:'hired',companyId:c.id,teamId:t.id,weeklySalary:e.weeklySalary});
 s.employees.push(e);t.leaderId=e.id;
 if(c.isPlayer)news(s,'Team leader hired: '+e.name,'Hired for '+t.name+' at '+shortMoney(e.weeklySalary)+'/week; recruitment fee '+shortMoney(fee)+'.','company');
 return {...e};
}
function renewEmployee(s,employeeId,weeklySalary){
 const e=s.employees.find(e=>e.id===employeeId&&e.status==='employed');
 if(!e||!controlledCompanies(s).some(c=>c.id===e.employerId))throw new Error('Only current controlled employees can renew contracts.');
 const salary=Number(weeklySalary),floor=e.morale<CFG.tuning_engine.floor__001?money(e.weeklySalary*CFG.tuning_engine.floor__002):e.weeklySalary;
 if(!Number.isFinite(salary)||salary<CFG.tuning_engine.renewEmployee__001||salary>CFG.tuning_engine.renewEmployee__002)throw new Error('Invalid weekly salary terms.');
 if(salary+EPS<floor)throw new Error('Employee will not accept the offered salary.');
 const c=company(s,e.employerId),increase=money(salary-e.weeklySalary);
 if(increase>0&&c.finance.cash<Math.max(0,increase*CFG.tuning_engine.renewEmployee__003)+CFG.tuning_engine.renewEmployee__004)throw new Error('Cash buffer too low for higher wages.');
 e.weeklySalary=money(salary);e.contractEndWeek=s.week+CFG.tuning_engine.renewEmployee__005;e.morale=Math.min(CFG.tuning_engine.renewEmployee__006,e.morale+CFG.tuning_engine.renewEmployee__007);
 e.history.push({week:s.week,kind:'renewed',companyId:c.id,teamId:e.teamId,weeklySalary:e.weeklySalary});
 return {...e};
}