
/* Studio Syndicate — initial prototype simulation engine. No external dependencies. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudioEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
'use strict';
const SAVE_VERSION = 30;
const SECTORS = Object.freeze({ publishing: {name:'Publishing', year:1, cost:11500, weeks:12, icon:'book-open'}, movie:{name:'Movies', year:4, cost:52000, weeks:25, icon:'clapperboard'}, tv:{name:'Television', year:7, cost:34500, weeks:21, icon:'tv'}, games:{name:'Video Games', year:10, cost:44000, weeks:29, icon:'gamepad-2'} });
const MONTHS = ['Ember','Thaw','Bloom','Rainfall','Solstice','Harvest','Goldleaf','Amber','Frostfall','Longnight','Deepwinter','Dawn'];
const MONTH_WEEKS = [4,4,5,4,4,5,4,4,5,4,4,5];
const GENRES = ['Fantasy','Mystery','Romance','Science Fiction','Adventure','Drama'];
const THEMES=Object.freeze(['Found family','Survival','Discovery','Power and responsibility']);
const TARGET_AUDIENCES=Object.freeze(['all','young','family','mature']);
const CREATIVE_DIRECTIONS=Object.freeze(['balanced','experimental','polished']);
const MARKET_POSITIONINGS=Object.freeze(['broad','niche','prestige']);
const FRANCHISE_BRANCHES=Object.freeze(['main','alternate','spinoff']);
function pitchFrom(data){return {theme:THEMES.includes(data.theme)?data.theme:'Found family',
  targetAudience:TARGET_AUDIENCES.includes(data.targetAudience)?data.targetAudience:'all',
  direction:CREATIVE_DIRECTIONS.includes(data.direction)?data.direction:'balanced',
  positioning:MARKET_POSITIONINGS.includes(data.positioning)?data.positioning:'broad'};}
function audienceAffinity(p,cohort){
  const pitch=p.pitch;if(!pitch)return 1;
  const target=pitch.targetAudience==='young'?'Young explorers':pitch.targetAudience==='family'?'Family readers':pitch.targetAudience==='mature'?'Mature audiences':null;
  const match=!target||cohort.name===target;
  let reach=target?(match?1.21:.82):1;
  if(pitch.positioning==='niche')reach*=match?1.20:.81;
  if(pitch.positioning==='prestige')reach*=cohort.name==='Mature audiences'?1.20:.91;
  return reach;
}
const FORMATS = {publishing:['Novel','Nonfiction','Comic / Manga','Web Serial','Ebook','Audiobook'], movie:['Feature Film','Animated Film'],tv:['Series','Miniseries'],games:['Premium Game','Indie Game']};
const REGIONS = [
  {name:'North Coast',currency:'Crown',baseFx:1,cash:17000,productionCost:1,incentiveRate:.02,profitTaxRate:.12,salesTaxRate:.02,payrollLevyRate:.005, tastes:{Fantasy:1.30,Mystery:1.05,Romance:.83,'Science Fiction':1.12,Adventure:1,Drama:.85}},
  {name:'Central Reach',currency:'Mark',baseFx:0.91,cash:12500,productionCost:1.08,incentiveRate:.045,profitTaxRate:.11,salesTaxRate:.025,payrollLevyRate:.007, tastes:{Fantasy:.9,Mystery:1.22,Romance:1.15,'Science Fiction':.85,Adventure:1,Drama:1.08}},
  {name:'Southern Isles',currency:'Shell',baseFx:1.08,cash:11800,productionCost:1.10,incentiveRate:.05,profitTaxRate:.10,salesTaxRate:.03,payrollLevyRate:.006, tastes:{Fantasy:.92,Mystery:.82,Romance:1.36,'Science Fiction':.9,Adventure:1.05,Drama:1.17}},
  {name:'Eastern Vale',currency:'Florin',baseFx:0.96,cash:13000,productionCost:.96,incentiveRate:.025,profitTaxRate:.13,salesTaxRate:.015,payrollLevyRate:.004, tastes:{Fantasy:1.08,Mystery:.9,Romance:.9,'Science Fiction':1.3,Adventure:1.2,Drama:.95}}
];
const ORIGINS = {
  publisher:{name:'Independent Publisher',sector:'publishing',cash:82000,reputation:29,teamGenres:['Fantasy','Mystery'],weeklyCommitment:0,preferredFormat:'Novel'},
  comics:{name:'Comic / Manga Studio',sector:'publishing',cash:71000,reputation:34,teamGenres:['Adventure','Fantasy'],weeklyCommitment:90,preferredFormat:'Comic / Manga'},
  contract:{name:'Contract Editorial Studio',sector:'publishing',cash:65000,reputation:26,teamGenres:['Mystery','Drama'],weeklyCommitment:45,preferredFormat:'Novel'},
  established:{name:'Established Publishing House',sector:'publishing',cash:148000,reputation:48,teamGenres:['Romance','Drama','Fantasy'],weeklyCommitment:170,preferredFormat:'Novel'},
  film:{name:'New Film Studio',sector:'movie',cash:195000,reputation:26},
  tv:{name:'New TV Studio',sector:'tv',cash:172000,reputation:26},
  games:{name:'New Game Studio',sector:'games',cash:160000,reputation:26}
};
const AI_NAMES = ['Copper Lantern Press','Northstar Stories','Ink & Orbit','Glassbird House','Velvet Orchard','Starlight Pictures','Mosaic Screenworks','Foxglove Studio','Cedar Arc Games','Bluehour Interactive','Ivory Kite Media','Hearthside Editions','Wildcurrent Works','Skyline Frame'];
const EPS = .031;
// Background companies are small financially constrained firms whose original
// releases compete for the SAME regional wallets as detailed studio titles.
const WORLD_SCALES = Object.freeze({1:{label:'Focused',perSector:2},2:{label:'Broad',perSector:4},3:{label:'Large',perSector:7}});
const BACKGROUND_LEDGER_LIMIT = 5000;
const CAPITAL_PRESETS=Object.freeze({lean:.72,standard:1,funded:1.45});
const WORLD_MATURITY=Object.freeze({emerging:.72,standard:1,developed:1.3});
const TECH_PACES=Object.freeze({slow:1.5,standard:1,fast:.65});
const ADOPTION_PACES=Object.freeze({slow:.42,standard:1,fast:1.7});
const CAPABILITY_PACES=Object.freeze({deliberate:1.22,standard:1,accelerated:.82});
const POPULATION_SCALES=Object.freeze([.5,1,1.75]);
const DEFAULT_RIVAL_COUNTS=Object.freeze({1:3,4:5,7:7,10:9,25:9});
 // all firms share the normal bounded journal

// Keep an exact recent ledger window while trimming in batches: shifting 4,500
// array elements after every sale dominated century-long simulation time.
// Archived older transactions are already represented in financial balances and reports.
const LEDGER_RETAIN = 4500;
const LEDGER_TRIM_AT = 5000;
const money = n => (Math.round((Number(n)||0)*100)/100)||0;
const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
function hash(input) {let h=2166136261; for (const c of String(input)) {h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)||17171717;}
function rand(s) {let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return (s.rng>>>0)/4294967296;}
function pick(s, xs) {return xs[Math.floor(rand(s)*xs.length)];}
function id(s, prefix) {s.sequence++;return prefix+'_'+String(s.sequence).padStart(5,'0');}
function yearAt(week) {return Math.floor(week/52)+1;}
function yearWeek(week) {return week%52+1;}
function periodAt(week) {let index=week%52, used=0;for (let i=0;i<12;i++){used+=MONTH_WEEKS[i];if (index<used) return i;}return 11;}
function periodLabel(week) {return MONTHS[periodAt(week)]+' · Y'+yearAt(week);}
function available(sector, week) {return !!SECTORS[sector] && yearAt(week)>=SECTORS[sector].year;}
function company(s, idValue) {return s.companies.find(c=>c.id===idValue);}
// Market-potential changes consumers' spending pool, never existing company cash.
// Separate settings control world maturity, geographic reach and competition.
function activeRegions(s){return REGIONS.slice(0,s.settings.regionCount||4);}
function regionalEconomyReport(s){return Object.fromEntries(REGIONS.map(r=>[r.name,{currency:r.currency,...(s.regionalEconomy?.[r.name]||{confidence:1,inflation:.02,employment:1,fxRate:r.baseFx,wageIndex:1,interestIndex:1})}]));}
// Three broad spending cohorts are deliberately aggregated. Each regional wallet
// remains finite, even when a niche genre becomes especially popular.
const COHORT_TASTES=Object.freeze([
 {name:'Young explorers',tastes:{Fantasy:1.38,Mystery:.83,Romance:.78,'Science Fiction':1.34,Adventure:1.34,Drama:.68}},
 {name:'Family readers',tastes:{Fantasy:1.18,Mystery:1.08,Romance:1.08,'Science Fiction':.94,Adventure:1.15,Drama:1.04}},
 {name:'Mature audiences',tastes:{Fantasy:.78,Mystery:1.25,Romance:1.22,'Science Fiction':.93,Adventure:.82,Drama:1.36}}
]);
function audienceCohorts(s,regionName){
 const r=activeRegions(s).find(x=>x.name===regionName);if(!r)return [];
 const index=REGIONS.findIndex(x=>x.name===r.name);
 const young=[.38,.31,.29,.36][index],family=[.34,.36,.39,.33][index];
 return COHORT_TASTES.map((c,i)=>({name:c.name,share:[young,family,1-young-family][i],tastes:{...c.tastes}}));
}
function estimateWeeklyPayroll(s,companyId=s.playerId){const c=company(s,companyId);if(!c)throw new Error('Unknown payroll company.');return weeklyOverhead(c,s);}
function marketLoanRate(s,companyId=s.playerId){const c=company(s,companyId);if(!c)throw new Error('Unknown borrower.');const base=s.settings.difficulty==='challenging'?.13:s.settings.difficulty==='casual'?.08:.10;return money(clamp(base*(s.regionalEconomy?.[taxRegion(c).name]?.interestIndex||1),.035,.22));}
function applyEconomicShock(s,regionName,kind='supply'){
 const r=activeRegions(s).find(r=>r.name===regionName);if(!r)throw new Error('Unknown or unavailable market for disruption.');
 if(!['supply','confidence'].includes(kind))throw new Error('Unknown economic disruption.');
 const v=s.regionalEconomy[r.name];
 v.confidence=money(clamp(v.confidence-(kind==='supply'?.09:.07),.7,1.3));
 if(kind==='supply')v.wageIndex=money(clamp(v.wageIndex+.04,.75,1.6));
 const item={id:id(s,'shock'),week:s.week,region:r.name,kind,impact:kind==='supply'?'Manufacturing delays and higher labor pressure':'Temporary entertainment demand slowdown'};
 s.economicShocks.unshift(item);if(s.economicShocks.length>48)s.economicShocks.length=48;
 news(s,r.name+' economic disruption',item.impact+' temporarily changes real audience wallets and business costs.','world');
 return item;
}
function technologyReport(s){
  const discovery=TECH_PACES[s.settings.discoveryPace]||1, adoption=ADOPTION_PACES[s.settings.adoptionPace]||1;
  const result={};
  for(const [sector,info] of Object.entries(SECTORS)){
    const debut=(info.year-1)*52,first=debut+Math.max(52,Math.round(104*discovery));
    const wave=Math.max(0,Math.floor((s.week-first)/(260)));
    const discover=first+wave*260;
    const discovered=s.week>=first&&available(sector,s.week);
    const adoptionLevel=discovered?clamp((s.week-discover)*adoption/(3*52),0,1):0;
    result[sector]={industryDebutWeek:debut,discoveryWeek:discover,discovered,adoption:money(adoptionLevel),wave:discovered?wave+1:0};
  }
  return result;
}
// Player and rival firms can spend real operating cash on research and vendor
// technology. The global sector clock and industry discovery are still absolute.
function businessTechnology(s,companyId=s.playerId,sector=company(s,companyId)?.sector){
 const c=company(s,companyId);if(!c||!SECTORS[sector])throw new Error('Unknown company or technology industry.');
 const now=technologyReport(s)[sector],research=c.research?.[sector]||null,license=c.techLicenses?.[sector]||null;
 const adoptedWave=license?.wave||0;
 const lag=adoptedWave>0&&now.wave>adoptedWave?now.wave-adoptedWave:0;
 const effectiveness=now.discovered&&adoptedWave>0?money(lag===0?.09:lag===1?.038:.018):0;
 const researchBonus=money((research?.level||0)*.018*(research?.wave>0&&now.wave>research.wave?.6:1));
 const upgradeCost=money(2500+SECTORS[sector].cost*.055);
 return {companyId:c.id,sector,globalWave:now.wave,discovered:now.discovered,adoptedWave,obsolete:lag>0,
   effectiveness,researchBonus,researchSpend:research?.spent||0,researchLevel:research?.level||0,
   upgradeCost,canUpgrade:now.discovered&&!!c.capabilities?.[sector]&&now.wave>adoptedWave&&c.finance.cash>=upgradeCost+1000};
}
function investResearch(s,sector,amount=3000,companyId=s.playerId){
 requireExecutiveControl(s);const c=company(s,companyId),cost=money(Number(amount));
 if(!c||!controlledCompanies(s).some(x=>x.id===companyId))throw new Error('Cannot fund unrelated research.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('Research sector unavailable before its global debut.');
 if(!c.capabilities?.[sector])throw new Error('The company needs legitimate sector capability before research.');
 if(!Number.isFinite(Number(amount))||cost<2500||cost>25000)throw new Error('Research requires a funded budget of 2,500–25,000.');
 if(c.finance.cash<cost+1000)throw new Error('Insufficient cash and payroll buffer for research.');
 const tech=technologyReport(s)[sector],old=c.research?.[sector],same=old&&old.wave===tech.wave;
 const spent=money((same?old.spent:0)+cost),level=Math.min(5,Math.floor(spent/3000));
 expense(s,c,cost,'research-development','Company-funded '+SECTORS[sector].name+' research');
 if(!c.research)c.research={};c.research[sector]={spent,level,wave:tech.wave,updatedWeek:s.week};
 if(c.isPlayer)news(s,c.name+' funds industry research','Spent '+shortMoney(cost)+' on '+SECTORS[sector].name+' expertise. Breakthrough timing still follows worldwide discovery.','company');
 return {...c.research[sector]};
}
function adoptTechnology(s,sector,companyId=s.playerId){
 requireExecutiveControl(s);const c=company(s,companyId);if(!c||!controlledCompanies(s).some(x=>x.id===companyId))throw new Error('Cannot upgrade an unrelated company.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('Technology unavailable before global industry debut.');
 if(!c.capabilities?.[sector])throw new Error('Acquire legitimate studio capability before adopting its technology.');
 const b=businessTechnology(s,c.id,sector);
 if(!b.discovered)throw new Error('Worldwide production innovation has not been discovered yet.');
 if(b.globalWave<=b.adoptedWave)throw new Error('The latest available tool wave is already adopted.');
 if(c.finance.cash<b.upgradeCost+1000)throw new Error('Insufficient cash for vendor technology and payroll buffer.');
 expense(s,c,b.upgradeCost,'licensed-technology','Third-party '+SECTORS[sector].name+' tool licenses');
 if(!c.techLicenses)c.techLicenses={};c.techLicenses[sector]={wave:b.globalWave,cost:b.upgradeCost,week:s.week};
 if(c.isPlayer)news(s,c.name+' upgrades production tools','Paid '+shortMoney(b.upgradeCost)+' to adopt a supported '+SECTORS[sector].name+' toolkit. Future waves may gradually make it obsolete.','company');
 return {...c.techLicenses[sector]};
}
function adoptTechnologyForRival(s,c,sector){
 const b=businessTechnology(s,c.id,sector);if(!b.canUpgrade)return null;
 expense(s,c,b.upgradeCost,'licensed-technology','Rival-funded tool upgrade');
 if(!c.techLicenses)c.techLicenses={};c.techLicenses[sector]={wave:b.globalWave,cost:b.upgradeCost,week:s.week};
 return c.techLicenses[sector];
}
function worldMarketBudget(s,sector,regionName,week=s.week){
  if(!SECTORS[sector]||!available(sector,week))return 0;
  const r=activeRegions(s).find(x=>x.name===regionName);if(!r)return 0;
  const maturity=clamp(.48+(yearAt(week)-SECTORS[sector].year)*.17,.48,1.42);
  const tech=technologyReport(s)[sector];
  const regional=s.regionalEconomy?.[r.name]||{};
  const confidence=regional.confidence||1,fxRate=regional.fxRate||r.baseFx,employment=regional.employment||1;
  return money(r.cash*({publishing:1,movie:1.26,tv:1.03,games:1.17}[sector])*maturity*s.macroeconomy*
    (s.settings.populationScale||1)*confidence*fxRate*clamp(employment,.75,1.15)*(1+.12*tech.adoption));
}
function worldSetupWarnings(s){
  const warnings=[];
  if(s.settings.aiCount>9&&s.settings.worldScale===3)warnings.push('Many detailed and background firms increase simulation and save workload.');
  if(s.settings.startingCapital==='lean'&&s.settings.populationScale===.5)warnings.push('Low company cash and a small customer market increase insolvency risk.');
  if(s.settings.regionCount<=2)warnings.push('Fewer reachable regions reduce sales opportunities for every company.');
  return warnings;
}
function updateRegionalEconomy(s){
  // One regional cycle per quarter, with bounded inflation, employment and
  // confidence. No consumer money is posted as a corporate asset here.
  if(s.week%13!==0)return;
  for(const r of REGIONS){const v=s.regionalEconomy[r.name];
    v.confidence=money(clamp(v.confidence+(rand(s)-.5)*.055-(v.confidence-1)*.08,.7,1.3));
    v.inflation=money(clamp(v.inflation+(rand(s)-.5)*.009-(v.inflation-.02)*.12,-.01,.10));
    v.employment=money(clamp(v.employment+(rand(s)-.5)*.024-(v.employment-1)*.1,.75,1.15));
    v.fxRate=money(clamp((v.fxRate||r.baseFx)+(rand(s)-.5)*.018-(v.fxRate-r.baseFx)*.055,r.baseFx*.72,r.baseFx*1.28));
    v.wageIndex=money(clamp((v.wageIndex||1)+v.inflation*.11+(v.employment-1)*.02-(v.wageIndex-1)*.07,.75,1.6));
    v.interestIndex=money(clamp(1+(v.inflation-.02)*2.2+(1-s.macroeconomy)*.35,.65,1.6));
    // Episodic, region-specific disruptions; never create new company cash.
    if(activeRegions(s).some(x=>x.name===r.name)&&rand(s)<.0035)applyEconomicShock(s,r.name,rand(s)<.5?'supply':'confidence');
  }
}
function taxRegion(c){return REGIONS.find(r=>r.name===(c.homeRegion||c.productionRegion))||REGIONS[0];}
function companyTaxRate(c){return taxRegion(c).profitTaxRate;}
function player(s) {return company(s,s.playerId);}
function transactionsFor(s, companyId) {return s.ledger.filter(x=>x.companyId===companyId);}
// Exact monthly opening position is retained independently of the bounded journal.
// The snapshot is position-only; previous amounts are never fabricated on migration.
function statementPosition(f){return {cash:money(f.cash),prepaid:money(f.prepaid||0),receivable:money(f.receivable||0),investment:money(f.investment||0),inventory:money(f.inventory||0),deferred:money(f.deferred||0),payable:money(f.payable||0),loanBalance:money(f.loanBalance||0),revenue:money(f.revenue||0),expense:money(f.expense||0)};}
const DUTY_KINDS=Object.freeze({
  tax:['automatic-tax','automatic-sales-tax','automatic-payroll-levy','settle-tax'],
  royalty:['royalty','settle-royalty'],
  interest:['loan-interest','loan-overdue-interest','bank-early-interest','bank-interest-payment']
});
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
const STAFF_FIRST=['Amara','Ivo','Celine','Rohan','Marin','Noel','Eva','Tariq','Jules','Kiran','Luz','Tessa','Elian','Mina','Theo','Arden'];
const STAFF_LAST=['Vale','Fenn','Mercer','Briar','Rowan','Quill','Sato','Keene','Hale','North','Wren','Glass','Reed','Aster'];
const STAFF_TRAITS=['collaborative','ambitious','meticulous','inventive','steady'];
const CULTURES=['balanced','supportive','lean'];
const FOUNDER_BACKGROUNDS=['editorial','finance','production'];
const FOUNDER_FOCUSES=['creative','commercial','people'];
function newStaffPerson(s,team=null,c=null,partialHistory=false){
 const staffId=id(s,'employee'),n=hash(s.seed+':'+staffId),first=STAFF_FIRST[n%STAFF_FIRST.length],last=STAFF_LAST[Math.floor(n/17)%STAFF_LAST.length];
 const salary=80+Math.floor(n%85);
 const e={id:staffId,name:first+' '+last,role:'Team lead',specialty:team?.specialty||GENRES[n%GENRES.length],trait:STAFF_TRAITS[n%STAFF_TRAITS.length],
    skill:50+n%29,age:25+n%23,ageAtEntry:25+n%23,enteredWeek:s.week,
    status:c?'employed':'candidate',employerId:c?.id||null,teamId:team?.id||null,
    weeklySalary:salary,contractEndWeek:c?s.week+156:null,hiredWeek:c?s.week:null,leftWeek:null,
    morale:65+n%19,completed:0,historyComplete:!partialHistory,
    history:c?[{week:s.week,kind:'hired',companyId:c.id,teamId:team.id,weeklySalary:salary,generated:!!partialHistory}]:[]};
 return e;
}
function assignInitialLeader(s,c,t,partialHistory=false){
 if(!Array.isArray(s.employees))s.employees=[];
 const leader=newStaffPerson(s,t,c,partialHistory);s.employees.push(leader);t.leaderId=leader.id;
 return leader;
}
function seedCandidates(s,target=14){
 if(!Array.isArray(s.candidates))s.candidates=[];
 const needed=Math.min(18,Math.max(0,target-s.candidates.length));
 for(let i=0;i<needed;i++)s.candidates.push(newStaffPerson(s));
}
function candidatePool(s){return (s.candidates||[]).filter(p=>p.status==='candidate').sort((a,b)=>b.skill-a.skill||a.id.localeCompare(b.id)).map(p=>({...p,history:p.history.slice()}));}
function employeeRoster(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company personnel register.');
 return {companyId:c.id,culture:c.culture||'balanced',weeklyPayroll:estimateWeeklyPayroll(s,c.id),
   active:s.employees.filter(x=>x.employerId===c.id&&x.status==='employed').map(e=>({...e,history:e.history.slice(-8)})),
   vacancies:c.teams.filter(t=>!t.leaderId).map(t=>({teamId:t.id,name:t.name,specialty:t.specialty})),
   careers:s.employees.filter(x=>x.history?.some(h=>h.companyId===c.id)&&x.status!=='employed').slice(-24).map(x=>({id:x.id,name:x.name,status:x.status,leftWeek:x.leftWeek,completed:x.completed})),
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
 const e=s.candidates[idx],fee=money(e.weeklySalary*3);
 if(c.finance.cash<fee+weeklyOverhead(c,s)*4+3000)throw new Error('Insufficient cash and payroll reserve to fund recruitment.');
 expense(s,c,fee,'staff-recruitment','Recruit '+e.name+' to '+t.name);
 s.candidates.splice(idx,1);e.status='employed';e.employerId=c.id;e.teamId=t.id;e.hiredWeek=s.week;e.contractEndWeek=s.week+156;e.leftWeek=null;
 e.history.push({week:s.week,kind:'hired',companyId:c.id,teamId:t.id,weeklySalary:e.weeklySalary});
 s.employees.push(e);t.leaderId=e.id;
 if(c.isPlayer)news(s,'Team leader hired: '+e.name,'Hired for '+t.name+' at '+shortMoney(e.weeklySalary)+'/week; recruitment fee '+shortMoney(fee)+'.','company');
 return {...e};
}
function renewEmployee(s,employeeId,weeklySalary){
 const e=s.employees.find(e=>e.id===employeeId&&e.status==='employed');
 if(!e||!controlledCompanies(s).some(c=>c.id===e.employerId))throw new Error('Only current controlled employees can renew contracts.');
 const salary=Number(weeklySalary),floor=e.morale<45?money(e.weeklySalary*1.10):e.weeklySalary;
 if(!Number.isFinite(salary)||salary<60||salary>400)throw new Error('Invalid weekly salary terms.');
 if(salary+EPS<floor)throw new Error('Employee will not accept the offered salary.');
 const c=company(s,e.employerId),increase=money(salary-e.weeklySalary);
 if(increase>0&&c.finance.cash<Math.max(0,increase*26)+3500)throw new Error('Cash buffer too low for higher wages.');
 e.weeklySalary=money(salary);e.contractEndWeek=s.week+156;e.morale=Math.min(100,e.morale+4);
 e.history.push({week:s.week,kind:'renewed',companyId:c.id,teamId:e.teamId,weeklySalary:e.weeklySalary});
 return {...e};
}
function departLeader(s,e,kind='departed',severance=false){
 const c=company(s,e.employerId),t=c?.teams.find(t=>t.id===e.teamId);
 if(severance){const due=money(e.weeklySalary*2);if(c.finance.cash<due+2500)throw new Error('Insufficient cash for contractual severance.');expense(s,c,due,'severance','Team lead departure: '+e.name);}
 if(t&&t.leaderId===e.id)t.leaderId=null;
 e.history.push({week:s.week,kind,companyId:e.employerId,teamId:e.teamId,weeklySalary:e.weeklySalary});
 if(e.history.length>40)e.history=e.history.slice(-40);
 e.status=kind;e.leftWeek=s.week;e.teamId=null;e.employerId=null;
 if(c?.isPlayer)news(s,'Staff change: '+e.name,e.name+' '+(kind==='retired'?'retired':'left')+'. The team remains usable with reduced leader effectiveness; an affordable replacement may be hired.','company');
}
function releaseEmployee(s,employeeId){
 const e=s.employees.find(x=>x.id===employeeId&&x.status==='employed');
 if(!e||!controlledCompanies(s).some(c=>c.id===e.employerId))throw new Error('Employee is not on a controlled company payroll.');
 if(teamBusy(s,e.teamId))throw new Error('Busy teams cannot dismiss their leader mid-production.');
 departLeader(s,e,'departed',true);return {id:e.id,status:e.status};
}
function setCompanyCulture(s,culture){
 if(!CULTURES.includes(culture))throw new Error('Invalid company culture policy.');
 const c=player(s);if(c.bankrupt)throw new Error('Insolvent companies cannot make new culture commitments.');
 c.culture=culture;
 news(s,'Studio culture policy',c.name+' chooses '+culture+' staff support. Morale and weekly cash costs respond over time.','company');
 return culture;
}
function annualCareers(s){
 const founder=s.founder;if(founder){founder.age=founder.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(founder.enteredWeek));founder.experience=founder.experience||0;
   if(founder.age>=70&&!founder.retirementNoted){founder.retirementNoted=true;alert(s,'founder-retirement',"Founder's long-term leadership",
     'Your founder is approaching succession. Company ownership and IP remain legally separate; no automatic transfer of control occurs.','advisory');}}
 for(const e of s.employees||[]){if(e.status!=='employed')continue;
   const c=company(s,e.employerId);if(!c||c.bankrupt)continue;
   e.age=e.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(e.enteredWeek));
   const culture=c.culture||'balanced';e.morale=clamp(e.morale+(culture==='supportive'?6:culture==='lean'?-6:1)+(e.trait==='collaborative'&&culture==='supportive'?2:0),12,100);
   if(e.age>=70+(hash(e.id)%3)){departLeader(s,e,'retired');continue;}
   if(s.week>=e.contractEndWeek){
     if(e.morale>=42){e.contractEndWeek=s.week+104;e.history.push({week:s.week,kind:'renewed',companyId:e.employerId,teamId:e.teamId,weeklySalary:e.weeklySalary});}
     else {departLeader(s,e,'departed');continue;}
   }
 }
 // Candidates age too; retired and stale external applicants rotate out without
 // fabricating a career record for someone who never worked here.
 s.candidates=s.candidates.filter(e=>{e.age=e.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(e.enteredWeek));return e.age<60&&s.week-e.enteredWeek<520;});
 // Background and rival personnel obey the same candidate, cash and team-capacity rules.
 seedCandidates(s,14);
}
function recruitVacancies(s){
 for(const c of s.companies){if(c.bankrupt)continue;
   const policy=c.staffPolicy||{autoFill:true,maxSalary:180};if(!policy.autoFill)continue;
   for(const t of c.teams)if(!t.leaderId&&!teamBusy(s,t.id)){
     const options=s.candidates.filter(e=>e.status==='candidate'&&e.weeklySalary<=policy.maxSalary).sort((a,b)=>
      (b.specialty===t.specialty?20:0)+b.skill-((a.specialty===t.specialty?20:0)+a.skill));
     if(!options.length)continue;
     // Same funded transaction for player and AI; quiet if no affordable hire.
     if(c.finance.cash<options[0].weeklySalary*3+weeklyOverhead(c,s)*4+3000)continue;
     try{staffHire(s,options[0].id,t.id,true);}catch(err){/* A failed offer never mints a worker or money. */}
   }
 }
}
function configureStaffDelegation(s,{autoFill,maxSalary}){
 if(typeof autoFill!=='boolean'||!Number.isFinite(Number(maxSalary))||maxSalary<80||maxSalary>250)throw new Error('Staff delegation requires opt-in and a weekly wage cap.');
 const c=player(s);c.staffPolicy={autoFill,maxSalary:money(maxSalary)};return {...c.staffPolicy};
}
// Teams are delegated workgroups, not extra project slots invented at launch.
function newTeam(s,c,index,specialty) {
  const genre=GENRES.includes(specialty)?specialty:GENRES[(index*2+s.companies.length)%GENRES.length];
  const t={id:id(s,'team'),name:['Story Desk','Creative Unit','Production Crew','Development Team','Specialist Unit'][index%5]+' '+(index+1),specialty:genre,skill:48+(hash(c.name+':'+index)%15),workWeeks:0,completed:0,trainingHistory:[],performanceHistory:[],leaderId:null};
  assignInitialLeader(s,c,t);return t;
}
function teamBusy(s,teamId){return s.projects.some(p=>p.status==='active'&&p.teamId===teamId)||(s.coProductions||[]).some(d=>d.status==='active'&&d.partnerTeamId===teamId);}
function selectTeam(s,c,requestedId,genre){
  if(requestedId&&requestedId!=='auto'){
    const team=c.teams.find(t=>t.id===requestedId);
    if(!team)throw new Error('Team does not belong to your company.');
    if(teamBusy(s,team.id))throw new Error('This team is already committed to another project.');
    return team;
  }
  return c.teams.filter(t=>!teamBusy(s,t.id)).sort((a,b)=>(b.specialty===genre?100:0)+b.skill-((a.specialty===genre?100:0)+a.skill))[0]||null;
}
function eligibleClients(s,fee,producerId=s.playerId){
  // No intragroup escrow until the separate-entity restricted-cash model is complete.
  return s.companies.filter(c=>c.id!==producerId&&!c.parentId&&!c.bankrupt&&c.finance.cash>=fee+3000).sort((a,b)=>b.finance.cash-a.finance.cash);
}

function createBackgroundFirm(s,sector,index,era) {
  if(!available(sector,s.week))throw new Error('Minor firm cannot precede world industry debut.');
  const base=SECTORS[sector].cost;
  const opening=money(base*(2.6+rand(s)*2.5));
  const genre=pick(s,GENRES);
  const firm={id:id(s,'minor'),name:['Pine','Silver','Bramble','Golden','River','Hollow','Morning','Amber','Little','Quiet'][index%10]+' '+['House','Works','Collective','Press','Studio'][Math.floor(index/10)%5]+' '+sector,
    sector,foundedYear:Math.max(SECTORS[sector].year,era-Math.floor(rand(s)*7)),genre,productionRegion:REGIONS[index%REGIONS.length].name,quality:42+Math.floor(rand(s)*29),
    finance:financeStart(opening),bankrupt:false,active:null,releases:[],releasedTotal:0};
  s.backgroundFirms.push(firm);return firm;
}
function addBackgroundFirms(s,sector,era) {
  for(let i=0;i<WORLD_SCALES[s.settings.worldScale].perSector;i++)createBackgroundFirm(s,sector,i,era);
}
function backgroundOverhead(firm){return money(55+SECTORS[firm.sector].cost*.002);}
function backgroundProgress(s) {
  for(const b of s.backgroundFirms) {
    if(b.bankrupt)continue;
    const wages=money(backgroundOverhead(b)*(s.regionalEconomy?.[taxRegion(b).name]?.wageIndex||1));
    expense(s,b,wages,'minor-overhead','Background studio payroll');
    expense(s,b,money(wages*taxRegion(b).payrollLevyRate),'automatic-payroll-levy','Automatic regional employer levy');
    if(b.active){
      const p=b.active;
      const due=money(p.cost/p.weeks*(Math.min(p.weeks,p.done+1)-p.done));
      expense(s,b,due,'minor-development','Original production: '+p.title);
      p.done++;
      if(p.done>=p.weeks){
        b.releases.push({id:id(s,'minorwork'),releaseWeek:s.week,genre:p.genre,quality:p.quality,marketingRatio:p.marketingRatio});
        b.releasedTotal++;b.active=null;
      }
    } else if(s.week%13===Math.floor(hash(b.id)%13)&&b.finance.cash>SECTORS[b.sector].cost*.65+4500) {
      const weeks=Math.max(7,Math.round(SECTORS[b.sector].weeks*.75));
      const cost=money(SECTORS[b.sector].cost*(.28+rand(s)*.12));
      b.active={id:id(s,'minorjob'),title:b.name+' original '+(b.releasedTotal+1),genre:rand(s)<.67?b.genre:pick(s,GENRES),quality:clamp(b.quality+Math.floor((rand(s)-.5)*22),18,90),marketingRatio:.08+rand(s)*.20,weeks,done:0,cost};
    }
    // A release is commercially active only for its finite 85-week lifecycle.
    b.releases=b.releases.filter(p=>s.week-p.releaseWeek<85);
    if(b.finance.cash<=0&&b.finance.payable>SECTORS[b.sector].cost*.28){b.bankrupt=true;b.active=null;}
  }
}
function backgroundWeights(s,sector,region) {
  const results=[];
  for(const b of s.backgroundFirms){
    if(b.sector!==sector)continue;
    // A bankrupt owner may still have residual rights and sell its catalog,
    // but cannot spend additional production money or restart by fiat.
    for(const p of b.releases){
      const age=s.week-p.releaseWeek;if(age<0||age>=85)continue;
      const weight=((p.quality/58)**2)*region.tastes[p.genre]*(1+.52*p.marketingRatio)*Math.exp(-age/(sector==='publishing'?22:32));
      results.push({firm:b,genre:p.genre,weight});
    }
  }
  return results;
}
function createCompany(s, props) {
  const c={id:id(s,'company'),name:props.name,sector:props.sector,origin:props.origin||'Independent Studio',foundedYear:props.foundedYear||yearAt(s.week),reputation:props.reputation||28,capacity:props.capacity||2,homeRegion:REGIONS.some(r=>r.name===props.homeRegion)?props.homeRegion:REGIONS[0].name,teamLevel:1,capabilities:{[props.sector]:'internal'},finance:financeStart(money(props.cash)),research:{},techLicenses:{},isPlayer:!!props.isPlayer,annualBaseline:{revenue:0,expense:0},bankrupt:false,parentId:props.parentId||null,investedCapital:props.parentId?money(props.cash):0,culture:'balanced',filmBacklot:null,staffPolicy:{autoFill:true,maxSalary:180},imprints:[],teams:[]};
  for(let i=0;i<c.capacity;i++)c.teams.push(newTeam(s,c,i));
  s.companies.push(c);return c;
}
function news(s, title, body, kind='world') {
  s.news.unshift({id:id(s,'news'),week:s.week,year:yearAt(s.week),title,body,kind});
  // Preserve meaningful releases, rights deals, company closures and sector
  // debuts when routine newsletters roll off the current-news screen.
  // Older monthly-close chatter is deliberately not archived indefinitely.
  if(s.news.length>210){
    const departed=s.news.pop();
    if(['breakthrough','deal','release','award'].includes(departed.kind)||departed.title.endsWith('closes its doors')){
      if(!Array.isArray(s.archivedNews))s.archivedNews=[];
      s.archivedNews.unshift(departed);
      if(s.archivedNews.length>900)s.archivedNews.length=900;
    }
  }
}
function alert(s, key, title, body, kind='critical') {if (s.inbox.some(a=>a.key===key))return; s.inbox.unshift({id:id(s,'alert'),key,title,body,kind,week:s.week,open:true});if(s.inbox.length>90)s.inbox.length=90;}
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
  const dueWeek=s.week+2;
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
  const advance=money(fee*.3),remaining=money(fee-advance);
  if(buyer.finance.cash<fee+3000)throw new Error('Client no longer has sufficient committed funding.');
  // A funded contract transfers real cash into supplier advance + protected delivery escrow.
  // The customer holds a prepaid service asset until actual delivery.
  transact(s,buyer,'client-escrow',{cash:-fee,prepaid:fee},'Committed editorial service commission',project.id);
  receiveAdvance(s,seller,advance,project.id);
  const escrow={id:id(s,'escrow'),buyerId:buyer.id,sellerId:seller.id,projectId:project.id,fee,advance,held:remaining,settled:false,
    milestoneAt:Math.ceil(project.weeksTotal*.50),milestonePaid:0,milestoneDone:false};
  s.escrows.push(escrow);project.clientId=buyer.id;project.escrowId=escrow.id;project.advance=advance;
}
// An actual 50% completed-work milestone unlocks a protected 30% tranche.
// Funds were reserved by the buyer at contract signing; this is not a new sale.
function releaseClientMilestone(s,project){
  const e=s.escrows.find(x=>x.id===project.escrowId);
  if(!e||e.settled||e.milestoneDone||!e.milestoneAt||project.weeksDone<e.milestoneAt)return;
  const tranche=money(e.fee*.30),seller=company(s,e.sellerId);
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
  return {clientId,producerId,delivered,cancelled,confidence:clamp(1+delivered*.025-cancelled*.055,.7,1.15)};
}
function configureCommissionAuthority(s,policy={}){
  const maxFee=money(Number(policy.maxFee??s.commissionPolicy.maxFee));
  const minMargin=Number(policy.minMargin??s.commissionPolicy.minMargin);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(maxFee)||maxFee<500||maxFee>50000||
     !Number.isFinite(minMargin)||minMargin<0||minMargin>.50)
    throw new Error('Delegation requires an opt-in, bounded authority and minimum margin.');
  s.commissionPolicy={autoCounter:policy.autoCounter,maxFee,minMargin};return s.commissionPolicy;
}
// Partner co-financing is a legally distinct agreement from a paid client job.
// Sponsors reserve REAL cash as a prepaid asset. Work consumes this asset as
// project cost, not as fictitious producer income. The originating company
// retains its underlying IP; the counterparty buys participation only.
function coProductionQuote(s,data={}){
  const c=data.companyId?company(s,data.companyId):player(s),sector=data.sector||c?.sector,route=data.route||'original';
  if(!c||c.bankrupt||!SECTORS[sector]||!available(sector,s.week))throw new Error('Industry debut or capability unavailable for co-production.');
  if(!c.teams?.some(t=>!teamBusy(s,t.id)))throw new Error('Producer has no available qualified team to collaborate.');
  if(route==='adaptation'&&!canUseIp(s,c,data.ipId,sector).ok)throw new Error('Partner funding cannot bypass underlying adaptation rights.');
  if(!['original','adaptation'].includes(route))throw new Error('Client contracts cannot be converted to jointly owned IP.');
  const fraction=Number(data.capitalFraction??.3);
  if(![.2,.3,.4].includes(fraction))throw new Error('Choose a supported 20%, 30% or 40% cash-financing share.');
  const plan=previewProject(s,{...data,route,withForecast:false});
  const commitment=money(plan.grandTotal*fraction),revenueShare=money(fraction*.70);
  const partners=s.companies.filter(b=>b.id!==c.id&&!b.bankrupt&&!b.parentId&&!c.parentId&&b.capabilities[sector]&&(c.isPlayer||!b.isPlayer)&&b.teams?.some(t=>!teamBusy(s,t.id))&&b.finance.cash>=commitment+5000)
    .sort((a,b)=>b.finance.cash-a.finance.cash).map(b=>({id:b.id,name:b.name,cash:b.finance.cash}));
  return {sector,route,capitalFraction:fraction,commitment,revenueShare,plannedTotal:plan.grandTotal,partners,
    ownership:'Producer keeps underlying IP and work; partner receives only contracted sales participation.'};
}
// A sponsor does not give up cash merely because a producer requests terms.
// Counteroffers are nonbinding until a matching offer is explicitly booked.
function configureCoProductionAuthority(s,policy={}){
  const amount=money(Number(policy.maxCommitment)),share=Number(policy.maxShare);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(amount)||amount<1000||amount>25000||
     !Number.isFinite(share)||share<.10||share>.35)throw new Error('Delegation needs bounded commitment and participation limits.');
  s.coProductionPolicy={autoCounter:policy.autoCounter,maxCommitment:amount,maxShare:share};
  return s.coProductionPolicy;
}
function proposeCoProduction(s,data={}){
  if(!data.companyId||data.companyId===s.playerId)requireExecutiveControl(s);
  const c=data.companyId?company(s,data.companyId):player(s),quote=coProductionQuote(s,data);
  const sponsor=quote.partners.find(x=>x.id===data.partnerId);
  if(!sponsor)throw new Error('A solvent independent co-producer with available team must be selected.');
  if(s.coProductionOffers.filter(x=>x.producerId===c.id&&x.status==='counter'&&s.week-x.createdWeek<=12).length>=3)
    throw new Error('Review earlier open financing counteroffers first.');
  const proposed=money(Number(data.participationShare??quote.revenueShare));
  if(!Number.isFinite(Number(data.participationShare??quote.revenueShare))||proposed<.05||proposed>.50)
    throw new Error('Co-production participation must be between 5% and 50%.');
  const partner=company(s,sponsor.id),plan=previewProject(s,{...data,route:quote.route,withForecast:false});
  // Terms depend on observable capital risk and partner reputation, not secret future sales.
  const minimum=money(clamp(quote.capitalFraction*.67+Math.max(0,65-partner.reputation)*.00035,.05,.48));
  const counter=proposed<minimum?minimum:null;
  const policy=s.coProductionPolicy;
  const delegated=counter!==null&&c.isPlayer&&policy.autoCounter&&quote.commitment<=policy.maxCommitment&&counter<=policy.maxShare;
  const accepted=counter===null||delegated;
  const row={id:id(s,'cooffer'),createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+12,
    producerId:c.id,sponsorId:partner.id,sector:quote.sector,route:quote.route,
    title:String(data.title||'Untitled Project').trim().slice(0,62)||'Untitled Project',
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||.2),productionRegion:plan.productionRegion,
    teamId:data.teamId||'auto',flagship:data.flagship||'no',
    ...pitchFrom(data),creativeTermsComplete:true,
    capitalFraction:quote.capitalFraction,commitment:quote.commitment,proposedShare:proposed,
    counterShare:counter,acceptedShare:accepted?(counter??proposed):null,
    status:accepted?'accepted':'counter',delegated,projectId:null};
  s.coProductionOffers.push(row);
  if(row.status==='counter'&&c.isPlayer)alert(s,'co-offer-'+row.id,'Partner financing counteroffer',
    partner.name+' requests '+Math.round(counter*100)+'% gross-sales participation to fund '+row.title+'. No money has moved.','advisory');
  return row;
}
function answerCoProductionOffer(s,offerId,accept){
  const row=s.coProductionOffers.find(x=>x.id===offerId);
  if(!row||row.producerId!==s.playerId||row.status!=='counter'||typeof accept!=='boolean'||s.week>row.expiresWeek)
    throw new Error('Only pending unexpired partner counteroffers can be accepted or declined.');
  if(accept){const q=coProductionQuote(s,{...row,companyId:row.producerId});
    if(!q.partners.some(x=>x.id===row.sponsorId))throw new Error('Partner cash or production team is no longer available.');
    row.status='accepted';row.acceptedShare=row.counterShare;
  }else row.status='declined';
  row.updatedWeek=s.week;const warning=s.inbox.find(a=>a.key==='co-offer-'+row.id);if(warning)warning.open=false;
  return row;
}
function startCoProduction(s,data={}){
  const quote=coProductionQuote(s,data),producer=data.companyId?company(s,data.companyId):player(s);
  const offer=data.offerId?s.coProductionOffers.find(o=>o.id===data.offerId):null;
  if(data.offerId){
    const plan=previewProject(s,{...data,route:quote.route,withForecast:false});
    if(!offer||offer.status!=='accepted'||s.week>offer.expiresWeek||offer.producerId!==producer.id||
      offer.sponsorId!==data.partnerId||offer.sector!==quote.sector||offer.route!==quote.route||
      offer.title!==(String(data.title||'').trim().slice(0,62)||'Untitled Project')||
      offer.genre!==(GENRES.includes(data.genre)?data.genre:'Fantasy')||offer.format!==plan.format||
      offer.size!==plan.size||offer.marketing!==money(Number(data.marketing)||.2)||
      offer.productionRegion!==plan.productionRegion||offer.capitalFraction!==quote.capitalFraction||
      offer.commitment!==quote.commitment||offer.teamId!==(data.teamId||'auto')||
      (offer.creativeTermsComplete&&Object.entries(pitchFrom(offer)).some(([k,v])=>pitchFrom(data)[k]!==v)))
      throw new Error('Accepted partner offer is expired or does not match approved project terms.');
  }
  const sponsor=quote.partners.find(x=>x.id===data.partnerId);
  if(!sponsor)throw new Error('An independent, solvent, funded partner must agree to the project.');
  // Validate required rights, team, cash and proposal before placing sponsor
  // funds at risk. createProject is the only authorized production gateway.
  const plan=previewProject(s,{...data,route:quote.route,withForecast:false});
  if(producer.finance.cash<money(plan.grandTotal*.30)+2500)throw new Error('Producer lacks the required project launch reserve.');
  const {offerId:_financeOfferId,...projectData}=data;
  // A real independent specialist partner can supply a missing capability for
  // this one project, not permanently unlock an entire sector or global debut.
  const entryThroughPartner=!producer.capabilities[quote.sector];
  let p;
  if(entryThroughPartner)producer.capabilities[quote.sector]='internal';
  try{p=createProject(s,{...projectData,companyId:producer.id,route:quote.route});}
  finally{if(entryThroughPartner)delete producer.capabilities[quote.sector];}
  if(entryThroughPartner){p.sponsoredSectorEntry=true;p.sectorEntrySponsorId=sponsor.id;}
  const investor=company(s,sponsor.id),partnerTeam=selectTeam(s,investor,'auto',p.genre);
  if(!partnerTeam)throw new Error('Co-producer has no available real production team.');
  transact(s,investor,'cofinance-reserve',{cash:-quote.commitment,prepaid:quote.commitment},'Reserved production capital: '+p.title,p.id);
  const agreement={id:id(s,'cofinance'),projectId:p.id,producerId:producer.id,sponsorId:investor.id,
    signedWeek:s.week,sector:p.sector,partnerTeamId:partnerTeam.id,commitment:quote.commitment,capitalFraction:quote.capitalFraction,
    revenueShare:offer?offer.acceptedShare:quote.revenueShare,offerId:offer?.id||null,held:quote.commitment,spent:0,refunded:0,shareAccrued:0,sharePaid:0,
    status:'active',closedWeek:null};
  s.coProductions.push(agreement);p.coProductionId=agreement.id;p.partnerSpend=0;p.partnerShareCost=0;
  if(offer){offer.status='booked';offer.projectId=p.id;offer.updatedWeek=s.week;}
  p.quality=Math.min(96,p.quality+(partnerTeam.specialty===p.genre?3:1));
  news(s,'Co-production greenlit: '+p.title,investor.name+' reserved '+shortMoney(quote.commitment)+' in actual production funding for contractual gross-sales participation. Underlying rights remain unchanged.','deal');
  return p;
}
function refundPartnerReserve(s,p,status){
  if(!p.coProductionId)return;
  const d=s.coProductions.find(d=>d.id===p.coProductionId),b=d&&company(s,d.sponsorId);
  if(!d||!b||d.status!=='active')throw new Error('Co-production agreement is missing or already closed.');
  if(d.held>0){transact(s,b,'cofinance-unused-refund',{cash:d.held,prepaid:-d.held},'Unspent sponsor capital returned: '+p.title,p.id);d.refunded=money(d.refunded+d.held);d.held=0;}
  d.status=status;d.closedWeek=s.week;
}
function settlePartnerShare(s,p,gross){
  if(!p.coProductionId||gross<=0)return;
  const d=s.coProductions.find(d=>d.id===p.coProductionId),c=company(s,p.companyId);
  if(!d||d.producerId!==p.companyId||!c)throw new Error('Invalid co-production revenue claim.');
  const owed=money(gross*d.revenueShare);
  if(owed<=0)return;
  transact(s,c,'cofinance-participation-accrued',{payable:owed,expense:owed},'Contractual partner share of actual sales: '+p.title,p.id);
  d.shareAccrued=money(d.shareAccrued+owed);p.partnerShareCost=money((p.partnerShareCost||0)+owed);
}
function settlePartnerReceipts(s){
  for(const d of s.coProductions||[]){
    const producer=company(s,d.producerId),sponsor=company(s,d.sponsorId);
    if(!producer||!sponsor)continue;
    const owed=money(d.shareAccrued-d.sharePaid),cash=Math.max(0,producer.finance.cash);
    const paid=money(Math.min(owed,cash,producer.finance.payable));
    if(paid<=0)continue;
    transact(s,producer,'cofinance-participation-payment',{cash:-paid,payable:-paid},'Partner sales participation settled',d.projectId);
    revenue(s,sponsor,paid,'cofinance-participation-receipt','Partner sales participation received',d.projectId);
    d.sharePaid=money(d.sharePaid+paid);
  }
}
function coProductionStatement(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company.');
  const deals=(s.coProductions||[]).filter(d=>d.producerId===companyId||d.sponsorId===companyId).map(d=>{
    const p=s.projects.find(p=>p.id===d.projectId);
    return {...d,title:p?.title||'Unidentified production',role:d.producerId===companyId?'producer':'sponsor',
      partnerName:company(s,d.producerId===companyId?d.sponsorId:d.producerId)?.name||'Unknown',
      agreementType:d.offerId?'negotiated':'standard',
      unpaid:money(d.shareAccrued-d.sharePaid)};
  });
  return {companyId,deals,committed:money(deals.reduce((v,d)=>v+d.commitment,0)),
    spent:money(deals.reduce((v,d)=>v+d.spent,0)),reserved:money(deals.reduce((v,d)=>v+d.held,0)),
    unpaid:money(deals.reduce((v,d)=>v+d.unpaid,0))};
}
// An optional read-only strategic comparison. A license scenario is an
// *indicative* third-party deal, not a guaranteed offer, asset transfer, or sale.
function investmentComparison(s,data={}){
  const c=data.companyId?company(s,data.companyId):player(s),sector=data.sector||c?.sector;
  if(!c||!SECTORS[sector])throw new Error('Unknown company or sector for investment comparison.');
  const legal=available(sector,s.week),access=legal&&!!c.capabilities[sector];
  const full={sector,route:data.route==='adaptation'?'adaptation':'original',...data,companyId:c.id};
  const rights=full.route!=='adaptation'||canUseIp(s,c,full.ipId,sector).ok;
  const valid=legal&&rights;
  const plan=valid?previewProject(s,full):null;
  const fore=plan?.forecast||null;
  const noSales=money(c.finance.cash);
  function caseOut(id,label,allowed,scenarios,cashRisk,note,extra={}){
    return {id,label,available:!!allowed,scenario:scenarios||{},noSalesCashFloor:cashRisk??noSales,
      downsideWarning:cashRisk!==null&&cashRisk<0?'Potential cash shortfall before new receipts.':null,
      note,...extra};
  }
  const solo=caseOut('produce','Produce internally',access&&rights,fore?.scenario,
    fore?.noSalesCashFloor??null,access?'Keep sales upside but fund production and staff.':'Requires effective rights, sector debut and company production capability.');
  let partner=null;
  if(valid){try{const q=coProductionQuote(s,full);if(q.partners.length)partner=q;}catch(e){/* no qualified sponsor */}}
  const quote=partner;
  const coCases={};
  if(quote&&fore)for(const key of ['conservative','expected','optimistic']){
    const f=fore.scenario[key];
    coCases[key]={gross:f.gross,revenue:money(f.revenue-f.gross*quote.revenueShare),
      directContribution:money(f.directContribution+quote.commitment-f.gross*quote.revenueShare)};
  }
  // Neither the royalty rate nor the fee below grants a right or moves cash.
  const ip=s.ips.find(x=>x.id===full.ipId),canLicense=valid&&full.route==='adaptation'&&ip&&ip.ownerId===c.id&&s.companies.some(x=>x.id!==c.id&&!x.bankrupt&&x.capabilities[sector]);
  const hypotheticalFee=plan?money(plan.grandTotal*.12):0;
  const licensing={};
  if(canLicense&&fore)for(const [key,ratio] of [['conservative',.65],['expected',1],['optimistic',1.32]]){
    const f=fore.scenario[key];const revenue=money(hypotheticalFee*ratio+f.gross*.08*ratio);
    licensing[key]={gross:0,revenue,directContribution:revenue};
  }
  const lis=caseOut('license','License rights to another studio',canLicense,licensing,noSales,
    canLicense?'Indicative fee and royalty ranges only: a funded buyer must independently consent.':'Requires an existing owned IP, free applicable rights and a legally eligible funded licensee.',
    {indicativeFee:hypotheticalFee});
  const cop=caseOut('co-produce','Partner-funded co-production',!!quote,coCases,
    quote&&fore?money(fore.noSalesCashFloor+quote.commitment):null,
    quote?'Sponsor supplies real money and a team but receives a share of actual gross sales.':'No independent solvent and staffed co-producer presently available.',
    {funding:quote?.commitment||0,participationShare:quote?.revenueShare||0,partners:quote?.partners.length||0});
  const wait=caseOut('wait','Wait and preserve liquidity',true,{},noSales,
    'No immediate investment, return, guaranteed future opportunity, or rights transfer.');
  return {sector,estimatedWeek:s.week,basis:'Imperfect 13-week illustration, not guaranteed prices, bids, or outcomes. Scenarios share one finite audience wallet.',
    choices:[solo,lis,cop,wait]};
}

// An independent firm offers a true price, or an unfunded/overpriced proposal
// gets a counter. Merely signing reserves no cash; the signed job draws real
// prepayment and escrow ONLY at greenlight, once a team is available.
function requestCommission(s,data={}){
  requireExecutiveControl(s);const c=player(s),sector=data.sector||c.sector;
  if(!SECTORS[sector]||!available(sector,s.week)||!c.capabilities[sector])throw new Error('Industry capability or worldwide debut unavailable.');
  const title=String(data.title||'').trim().slice(0,62);
  if(!title)throw new Error('Commission title is required.');
  const plan=previewProject(s,{...data,sector,route:'contract',clientId:'auto',withForecast:false});
  const client=company(s,data.clientId);
  if(!client||client.id===c.id||client.bankrupt||client.parentId||c.parentId||
     !eligibleClients(s,plan.contractFee,c.id).some(x=>x.id===client.id))throw new Error('No sufficiently funded independent client is available.');
  const fee=money(Number(data.fee??plan.contractFee));
  if(!Number.isFinite(Number(data.fee??plan.contractFee))||fee<500||fee>1000000)throw new Error('Invalid service fee proposal.');
  const trust=counterpartyTrust(s,client.id,c.id);
  const willingness=money(Math.min(client.finance.cash-3000,plan.contractFee*1.18*trust.confidence));
  const agreed=fee<=willingness;
  const counter=agreed?null:money(Math.min(client.finance.cash-3000,plan.contractFee*1.08*trust.confidence));
  if(!agreed&&counter<plan.grandTotal*1.05)throw new Error('Client cannot support an economically viable fee.');
  const delegated=!agreed&&s.commissionPolicy.autoCounter&&fee<=s.commissionPolicy.maxFee&&counter<=s.commissionPolicy.maxFee&&counter>=plan.grandTotal*(1+s.commissionPolicy.minMargin);
  const row={id:id(s,'clientoffer'),clientId:client.id,producerId:c.id,sector,title,
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||.2),productionRegion:plan.productionRegion,
    proposedFee:fee,baseCost:plan.grandTotal,counterFee:counter,
    acceptedFee:agreed?fee:delegated?counter:null,
    status:agreed||delegated?'accepted':'counter',createdWeek:s.week,updatedWeek:s.week,projectId:null,
    delegated:!!delegated};
  s.commissionOffers.push(row);
  if(row.status==='counter')alert(s,'commission-counter-'+row.id,'Client commission counteroffer',
    client.name+' countered the proposed '+sector+' service fee. Review the Productions hub; no funds have moved.','advisory');
  return row;
}
function answerCommissionOffer(s,offerId,accept){
  const row=s.commissionOffers.find(o=>o.id===offerId);
  if(!row||row.producerId!==s.playerId||row.status!=='counter'||typeof accept!=='boolean')throw new Error('Only pending client counteroffers can be accepted or declined.');
  if(accept){const client=company(s,row.clientId);if(!client||client.bankrupt||client.finance.cash<row.counterFee+3000)throw new Error('Client lacks funds for this counteroffer.');
    row.status='accepted';row.acceptedFee=row.counterFee;
  }else row.status='declined';
  row.updatedWeek=s.week;const warning=s.inbox.find(a=>a.key==='commission-counter-'+row.id);if(warning)warning.open=false;
  return row;
}
function cancelProject(s,projectId){
  const p=s.projects.find(x=>x.id===projectId);
  if(!p||p.companyId!==s.playerId||p.status!=='active')throw new Error('Only an active, player-controlled project may be cancelled.');
  if(p.coProductionId)refundPartnerReserve(s,p,'cancelled');
  if(p.route==='contract'){
    const e=s.escrows.find(x=>x.id===p.escrowId),buyer=e&&company(s,e.buyerId),seller=company(s,p.companyId);
    if(!e||e.settled||!buyer||!seller)throw new Error('Funded commission agreement is missing.');
    // Nonrefundable 30% advance compensates actual work begun. Remaining 70%
    // stays outside studio cash and returns to the client without creating cash.
    const earned=money(e.advance+(e.milestonePaid||0));
    transact(s,buyer,'client-cancellation',{cash:e.held,prepaid:-e.fee,expense:earned},'Protected client funds returned; earned milestones retained',p.id);
    transact(s,seller,'service-cancellation',{deferred:-earned,revenue:earned},'Earned advance and completed service milestone',p.id);
    p.directRevenue=money(p.directRevenue+earned);
    e.held=0;e.settled=true;e.cancelled=true;e.closedWeek=s.week;
    recordCommissionOutcome(s,p,'cancelled');
  }
  releaseProjectSpecialist(s,p);
  if((p.sector==='movie'&&p.cinema?.castActorId)||(p.sector==='tv'&&p.television?.castActorId)){const actor=(s.filmActors||[]).find(a=>a.id===(p.cinema?.castActorId||p.television?.castActorId));if(actor?.busyProjectId===p.id)actor.busyProjectId=null;}
  p.status='cancelled';p.cancelledWeek=s.week;
  news(s,'Project cancelled: '+p.title,'Previously incurred project spending remains a real expense; no new IP or consumer income was created.','production');
  return p;
}

function createGame(input={}) {
  const era=[1,4,7,10,25].includes(Number(input.era))?Number(input.era):1;
  let origin=ORIGINS[input.origin]?input.origin:'publisher';
  if(SECTORS[ORIGINS[origin].sector].year>era)origin='publisher';
  const seed=String(input.seed||'STUDIO-114');const s={version:SAVE_VERSION,seed,rng:hash(seed),sequence:0,week:(era-1)*52,startedYear:era,playerId:null,settings:{difficulty:['casual','standard','challenging'].includes(input.difficulty)?input.difficulty:'standard',era,origin,
    worldScale:WORLD_SCALES[Number(input.worldScale)]?Number(input.worldScale):1,
    startingCapital:CAPITAL_PRESETS[input.startingCapital]?input.startingCapital:'standard',
    worldMaturity:WORLD_MATURITY[input.worldMaturity]?input.worldMaturity:'standard',
    aiCount:Number.isInteger(Number(input.aiCount))&&input.aiCount!==undefined&&String(input.aiCount)!==''?clamp(Number(input.aiCount),1,12):DEFAULT_RIVAL_COUNTS[era],
    populationScale:POPULATION_SCALES.includes(Number(input.populationScale))?Number(input.populationScale):1,
    regionCount:[2,3,4].includes(Number(input.regionCount))?Number(input.regionCount):4,
    discoveryPace:TECH_PACES[input.discoveryPace]?input.discoveryPace:'standard',
    adoptionPace:ADOPTION_PACES[input.adoptionPace]?input.adoptionPace:'standard',
    capabilityPace:CAPABILITY_PACES[input.capabilityPace]?input.capabilityPace:'standard'},
    regionalEconomy:Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:.02,employment:1,fxRate:r.baseFx,wageIndex:1,interestIndex:1}])),economicShocks:[],technology:{historyComplete:true},marketBriefs:[],quarterlyMarketReports:[],companies:[],backgroundFirms:[],employees:[],candidates:[],specialists:[],creativeAwards:[],creatorRelations:[],creatorScouting:[],creatorHistoryComplete:true,filmActors:[],filmHonors:[],gameStores:[],gameStoreOffers:[],gameStoreWindows:[],gameMarketReserved:{},gameCommunityHistory:[],gameExclusiveOffers:[],tvHonors:[],tvCastRelations:[],streamingServices:[],streamingWindows:[],streamingOffers:[],streamingWeeklyReserved:{},streamingWeeklyTotal:0,talentPolicy:{autoBook:false,maxFee:2100},remittances:[],loans:[],projects:[],manuscripts:[],manuscriptOffers:[],ips:[],franchiseNotes:{},grants:[],rightsOffers:[],creativeApprovals:[],rightsPolicy:{autoRenew:false,maxFee:1500,extensionWeeks:52},commissionPolicy:{autoCounter:false,maxFee:15000,minMargin:.12},commissionOffers:[],commissionHistory:[],coProductions:[],coProductionOffers:[],coProductionPolicy:{autoCounter:false,maxCommitment:15000,maxShare:.35},works:[],obligations:[],royaltyAccounts:[],escrows:[],news:[],archivedNews:[],inbox:[],ledger:[],reports:[],snapshots:[],dashboardFocus:'operations',pausePolicy:{stopForAdvisory:false},macroeconomy:1,weeklyConsumerSpend:0,founder:{id:'founder_0',name:(String(input.founder||'Alex Morgan').trim().slice(0,40)||'Alex Morgan'),age:clamp(Number(input.age)||31,18,75),ageAtEntry:clamp(Number(input.age)||31,18,75),enteredWeek:(era-1)*52,background:FOUNDER_BACKGROUNDS.includes(input.background)?input.background:'editorial',focus:FOUNDER_FOCUSES.includes(input.founderFocus)?input.founderFocus:'creative',experience:0,retirementNoted:false},worldStory:[]};
  const config=ORIGINS[origin],cash=money(config.cash * CAPITAL_PRESETS[s.settings.startingCapital] * (s.settings.difficulty==='casual'?1.35:s.settings.difficulty==='challenging'?.75:1));
  const c=createCompany(s,{name:String(input.companyName||'Syndicate Works').trim().slice(0,42)||'Syndicate Works',sector:config.sector,origin:config.name,cash,reputation:config.reputation,capacity:origin==='established'?3:2,foundedYear:era,homeRegion:input.homeRegion,isPlayer:true});s.playerId=c.id;
  // The four publishing origins change early staffing, payroll commitments and
  // creative focus without inheriting another company's property or rights.
  c.originWeeklyCommitment=config.weeklyCommitment||0;
  c.preferredFormat=config.preferredFormat||FORMATS[config.sector][0];
  if(config.teamGenres)for(let i=0;i<c.teams.length;i++){
    c.teams[i].specialty=config.teamGenres[i%config.teamGenres.length];
    c.teams[i].skill=Math.min(88,c.teams[i].skill+(origin==='comics'||origin==='contract'?3:0));
  }
  s.founder.id=id(s,'person');
  initialGovernance(s);
  seedRivals(s,era);
  for(const sec of Object.keys(SECTORS))if(available(sec,s.week))addBackgroundFirms(s,sec,era);
  if(era>1){
    for(const [sector,info] of Object.entries(SECTORS)) if(info.year<=era) {
      const label='Y'+info.year+': '+info.name+' emerged';s.worldStory.push({year:info.year,text:label,source:'Generated prehistory'});
    }
    s.worldStory.push({year:era,text:c.name+' founded independently in '+config.sector,source:'Played history'});
  }
  news(s,'Welcome to '+c.name,era===1?'A small literary firm opens its doors in a publishing-first world. Make your mark, one release at a time.':'A new studio launches into an established Year '+era+' entertainment market. It has no inherited rival assets.','company');
  if(era===1)news(s,'The age of publishing','Literature and comics dominate the cultural market. Movies emerge globally in World Year 4.','world');
  seedSpecialists(s);
  seedCandidates(s,14);
  return s;
}
function seedRivals(s,era) {
  const categories=['publishing','publishing','publishing','movie','movie','tv','tv','games','games'];
  const availableCategories=categories.filter(sector=>SECTORS[sector].year<=era);
  const limit=s.settings.aiCount||DEFAULT_RIVAL_COUNTS[era];
  for(let i=0;i<limit;i++) {
    const sector=availableCategories[i%availableCategories.length],start=SECTORS[sector].year,originYear=Math.max(start,era-Math.floor(rand(s)*6));
    const cash=money((62000+rand(s)*(sector==='publishing'?65000:175000))*WORLD_MATURITY[s.settings.worldMaturity]);
    const c=createCompany(s,{name:AI_NAMES[i]||('Fictional Studio '+(i+1)),sector,foundedYear:originYear,cash,reputation:clamp(Math.round((25+rand(s)*34)*WORLD_MATURITY[s.settings.worldMaturity])+(s.settings.difficulty==='challenging'?5:s.settings.difficulty==='casual'?-3:0),15,90),capacity:1+Math.floor(rand(s)*2),homeRegion:REGIONS[i%REGIONS.length].name});
    if(era>1)s.worldStory.push({year:originYear,text:c.name+' founded ('+SECTORS[sector].name+')',source:'Generated prehistory'});
  }
}
function sectorCost(sector,size=1,format='') {
  const factor=format==='Web Serial'?.73:format==='Comic / Manga'?1.24:format==='Nonfiction'?1.08:format==='Ebook'?.78:format==='Audiobook'?1.36:format==='Animated Film'?1.1:format==='Miniseries'?.85:format==='Indie Game'?.75:1;
  return Math.round(SECTORS[sector].cost*factor*size/100)*100;
}
function canUseIp(s,c,ipId,sector,week=s.week) {
  if(!available(sector,week))return {ok:false,reason:'This industry has not debuted globally.'};
  const ip=s.ips.find(x=>x.id===ipId);if(!ip)return {ok:false,reason:'Source IP not found.'};
  const blocking=s.grants.find(g=>g.ipId===ipId&&g.media===sector&&g.exclusive&&g.holderId!==c.id&&g.startWeek<=week&&g.endWeek>week&&['option','license'].includes(g.type));
  if(ip.ownerId===c.id)return blocking?{ok:false,reason:'Exclusive '+sector+' rights are reserved for another company.'}:{ok:true};
  const right=s.grants.find(g=>g.ipId===ipId&&g.holderId===c.id&&g.media===sector&&g.type==='license'&&g.startWeek<=week&&g.endWeek>week&&g.allowsProduction);
  return right?{ok:true,grantId:right.id}:{ok:false,reason:'No effective adaptation license for this medium.'};
}
function weeklyOverhead(c,s) {const base=(c.isPlayer?510:350)+(c.teamLevel-1)*320+(c.capacity-2)*130+(c.originWeeklyCommitment||0);
 const leaders=(c.teams||[]).map(t=>(s.employees||[]).find(e=>e.id===t.leaderId&&e.status==='employed')).filter(Boolean);
 const namedWages=leaders.reduce((sum,e)=>sum+e.weeklySalary,0);
 const culture=(c.culture||'balanced')==='supportive'?30*(c.teams||[]).length:(c.culture||'balanced')==='lean'?-15*(c.teams||[]).length:0;
 return money(Math.max(120,base-110*(c.teams||[]).length+namedWages+culture)*(s?.regionalEconomy?.[taxRegion(c).name]?.wageIndex||1));}
// A read-only, imperfect forecast from published releases and known market spending.
// It does not inspect secret rival pipelines, draw randomness, or guarantee sales.
function forecastProject(s,data,plan,c) {
  const route=['original','adaptation','contract'].includes(data.route)?data.route:'original';
  const horizonWeeks=13;
  const candidate={sector:plan.sector,genre:GENRES.includes(data.genre)?data.genre:'Fantasy',quality:clamp(47+c.reputation*.31+plan.size*4,25,96),budget:plan.budget,marketingBudget:plan.marketing,pitch:pitchFrom(data)};
  const stocked=plan.initialPrintCash>0;
  const printMarginal=plan.format==='Comic / Manga'?1.6/13:2.2/20;
  const distRate=stocked?.60*.29+.40*(.17+printMarginal):(plan.sector==='publishing'?.27:.32);
  let royaltyRate=0;
  if(route==='adaptation') {
    const permission=canUseIp(s,c,data.ipId,plan.sector);
    if(permission.grantId)royaltyRate=s.grants.find(g=>g.id===permission.grantId)?.royaltyRate||0;
  }
  const observations=projectEvidence(s,{companyId:c.id,sector:plan.sector,genre:candidate.genre,limit:8});
  // Previous 13-week launches inform market-fit uncertainty, not future
  // prophecy. Blend toward neutral when sample is small; cap correction.
  const comparable=observations.rows.filter(r=>r.expectedGross>0&&r.actualGross>=0);
  const averageRatio=comparable.length?comparable.reduce((n,r)=>n+clamp(r.actualGross/r.expectedGross,.5,1.5),0)/comparable.length:1;
  const marketCalibration=money(clamp(1+(averageRatio-1)*comparable.length/(comparable.length+4),.90,1.10));
  const revenueByScenario={};
  for(const [scenario,qualityShift,marketShift] of [['conservative',-17,.69],['expected',0,1],['optimistic',14,1.24]]) {
    let gross=0;
    if(route!=='contract')for(let i=0;i<horizonWeeks;i++) {
      const futureWeek=s.week+plan.weeks+i;
      for(const region of activeRegions(s)) {
        const budget=worldMarketBudget(s,plan.sector,region.name,futureWeek)*marketShift;
        const decay=Math.exp(-i/(plan.sector==='publishing'?22:32));
        const reach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(candidate,k),0);
        const weight=((clamp(candidate.quality+qualityShift,10,100)/58)**2)*region.tastes[candidate.genre]*(1+.52*(candidate.marketingBudget/Math.max(candidate.budget,1)))*decay*reach;
        const knownCompetition=s.projects.filter(p=>p.sector===plan.sector&&p.status==='released'&&p.releaseWeek<=futureWeek&&futureWeek-p.releaseWeek<85&&p.route!=='contract'&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=futureWeek&&g.endWeek+g.continuationWeeks>futureWeek))).reduce((sum,p)=>{
          const competingAge=futureWeek-p.releaseWeek;
          const rivalReach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(p,k),0);
          return sum+((p.quality/58)**2)*region.tastes[p.genre]*(1+.52*(p.marketingBudget/Math.max(p.budget,1)))*Math.exp(-competingAge/(p.sector==='publishing'?22:32))*rivalReach;
        },0);
        gross+=budget*weight/(5.2+weight+knownCompetition);
      }
    }
    gross=money(gross*(route==='contract'?1:marketCalibration));
    const receipts=route==='contract'?plan.contractFee:gross;
    revenueByScenario[scenario]={gross:money(gross),revenue:money(receipts),directContribution:money(receipts-gross*(distRate+royaltyRate)-plan.grandTotal)};
  }
  const committed=s.projects.filter(p=>p.companyId===c.id&&p.status==='active').reduce((sum,p)=>sum+Math.max(0,p.budget*(1-p.weeksDone/p.weeksTotal)),0);
  const advance=route==='contract'?plan.contractFee*.30:0;
  // Stress-case liquidity before any new consumer sales, not an accounting profit forecast.
  const noSalesCashFloor=money(c.finance.cash+advance-plan.grandTotal-(plan.initialPrintCash||0)-committed-weeklyOverhead(c,s)*plan.weeks-c.finance.payable);
  return {horizonWeeks,estimatedAtWeek:s.week,estimatedQuality:money(candidate.quality),evidenceSampleSize:comparable.length,marketCalibration,scenario:revenueByScenario,royaltyRate,initialPrintCash:plan.initialPrintCash||0,noSalesCashFloor,
downsideWarning:noSalesCashFloor<0?'Possible cash shortfall before release. Other income or financing may be needed.':noSalesCashFloor<weeklyOverhead(c,s)*5?'Thin pre-release cash buffer: leave room for operating expenses.':null,
    basis:route==='contract'?'Fixed client delivery fee, subject to completing the work.':stocked?'Estimated first 13 sales weeks; includes expected print COGS/wholesale fees, but retailer returns and stockouts can change results.':'Estimated first 13 sales weeks; future rivals, changing taste and economic shocks are uncertain.'};
}
// Manuscript rights are held by named independent publisher agencies. The author
// is credited in the catalog but no author's personal IP transfers by implication.
// Bids are nonbinding until a funded grant is signed by both companies.
const MANUSCRIPT_NAMES=['The River Behind Glass','Moonlit Fire Letters','Twelve Forgotten Maps','The Last Blue Orchard','The Quiet Observatory','The House of Comets'];
function previewManuscripts(s){
 const owners=s.companies.filter(c=>!c.isPlayer&&c.sector==='publishing'&&!c.bankrupt);
 if(!owners.length)return [];
 return Array.from({length:Math.min(6,owners.length+3)},(_,i)=>{
  const owner=owners[i%owners.length],key=hash(s.seed+':manuscript-id:'+i).toString(36);
  return {id:'manuscript_market_'+key,ipId:'ip_market_'+key,ownerId:owner.id,title:MANUSCRIPT_NAMES[i],
    genre:GENRES[hash(s.seed+':manuscript:'+i)%GENRES.length],
    authorName:['Maren Ash','Ivo Wren','Sera Vale','Cassian North','Ada Finch','Liora Stone'][i],
    advance:money(1400+(hash(s.seed+':advance:'+i)%9)*180),royaltyRate:money(.10+(i%4)*.01),
    termWeeks:260,agencyRate:.10,creatorApprovalRequired:false,createdWeek:s.week,status:'available',licenseId:null};
 });
}
function seedManuscripts(s){
 if(s.manuscripts?.length)return;
 // Prospective manuscripts appear in the read-only market first. Their legal
 // registry entries are created ONLY after the player requests negotiation.
 for(const item of previewManuscripts(s)){
  s.ips.push({id:item.ipId,name:item.title,ownerId:item.ownerId,createdWeek:s.week,sourceSector:'publishing',
   description:'Unpublished manuscript represented by '+company(s,item.ownerId).name,
   works:[],rightsIncome:0,rightsHistoryComplete:true});
  s.manuscripts.push(item);
 }
}
function manuscriptMarket(s){
 const rows=s.manuscripts?.length?s.manuscripts:previewManuscripts(s);
 return rows.filter(m=>m.status==='available'&&!company(s,m.ownerId)?.bankrupt).map(m=>({...m}));
}
function negotiateManuscript(s,manuscriptId,input={}){
 if(!s.manuscripts?.length) {
   if(!previewManuscripts(s).some(x=>x.id===manuscriptId))throw new Error('Manuscript unavailable.');
   seedManuscripts(s);
 }
 const m=s.manuscripts?.find(x=>x.id===manuscriptId),owner=m&&company(s,m.ownerId),buyer=player(s);
 if(!m||m.status!=='available'||!owner||owner.bankrupt||m.ownerId===buyer.id||!buyer.capabilities.publishing)
  throw new Error('Manuscript unavailable or already licensed.');
 if(s.grants.some(g=>g.ipId===m.ipId&&g.media==='publishing'&&g.exclusive&&g.endWeek>s.week))
  throw new Error('Manuscript exclusive publishing rights are unavailable.');
 const advance=money(Number(input.advance??m.advance)),royaltyRate=Number(input.royaltyRate??m.royaltyRate);
 const agencyRate=Number(input.agencyRate??m.agencyRate??0),approvalRequired=input.approvalRequired===true||input.approvalRequired==='true'||m.creatorApprovalRequired===true;
 if(!Number.isFinite(advance)||advance<250||advance>250000||!Number.isFinite(royaltyRate)||royaltyRate<.04||royaltyRate>.35||!Number.isFinite(agencyRate)||agencyRate<0||agencyRate>.20)
  throw new Error('Advance, agent share or royalty terms are invalid.');
 const agreed=advance>=m.advance&&royaltyRate>=m.royaltyRate&&agencyRate>=(m.agencyRate||0)&&(!m.creatorApprovalRequired||approvalRequired);
 const offer={id:id(s,'manuscriptoffer'),manuscriptId:m.id,ownerId:owner.id,buyerId:buyer.id,
  createdWeek:s.week,expiresWeek:s.week+12,status:agreed?'agreed':'counter',
  proposal:{advance,royaltyRate,agencyRate,approvalRequired},counter:agreed?null:{advance:m.advance,royaltyRate:m.royaltyRate,agencyRate:m.agencyRate||0,approvalRequired:m.creatorApprovalRequired===true||approvalRequired},grantId:null};
 s.manuscriptOffers.push(offer);return offer;
}
function answerManuscript(s,offerId,approve){
 const offer=s.manuscriptOffers?.find(x=>x.id===offerId),m=offer&&s.manuscripts.find(x=>x.id===offer.manuscriptId);
 if(!offer||!m||offer.buyerId!==s.playerId||!['agreed','counter'].includes(offer.status)||!['available'].includes(m.status)||s.week>offer.expiresWeek)
  throw new Error('Manuscript offer is unavailable or expired.');
 if(approve!==true){offer.status='declined';return offer;}
 const owner=company(s,offer.ownerId),buyer=player(s),ip=s.ips.find(x=>x.id===m.ipId);
 if(!owner||owner.bankrupt||!ip||ip.ownerId!==owner.id||owner.id!==m.ownerId||
     s.grants.some(g=>g.ipId===m.ipId&&g.media==='publishing'&&g.exclusive&&g.endWeek>s.week))
  throw new Error('Manuscript title or exclusive rights are unavailable.');
 const terms=offer.counter||offer.proposal,fee=money(terms.advance);
 if(buyer.finance.cash<fee+5000)throw new Error('Insufficient cash for manuscript advance and operating reserve.');
 expense(s,buyer,fee,'manuscript-advance','Exclusive manuscript license: '+ip.name);
 revenue(s,owner,fee,'manuscript-advance','Manuscript advance received: '+ip.name);
 ip.rightsIncome=money((ip.rightsIncome||0)+fee);
 const grant={id:id(s,'grant'),ipId:m.ipId,grantorId:owner.id,holderId:buyer.id,media:'publishing',territory:'Worldwide',
  type:'license',startWeek:s.week,endWeek:s.week+m.termWeeks,optionExpiresWeek:null,exercisedWeek:null,
  exerciseFee:0,exerciseFeePaid:0,renewalHistory:[],approvalRequired:terms.approvalRequired===true,agentRate:terms.agencyRate||0,agentFeesPaid:0,
  exclusive:true,allowsProduction:true,fee,royaltyRate:terms.royaltyRate,recoupableAdvance:fee,
  royaltyHistoryComplete:true,continuationWeeks:0,manuscriptId:m.id};
 s.grants.push(grant);m.status='licensed';m.licenseId=grant.id;
 offer.status='signed';offer.grantId=grant.id;offer.signedWeek=s.week;
 news(s,'Publishing manuscript licensed: '+ip.name,buyer.name+' acquired time-limited publishing rights from '+owner.name+'; creator approvals and agent share follow the signed terms.','deal');
 return grant;
}
// The independent author/rights owner decides a proposed publishing pitch.
// Matching the manuscript's originally contracted genre grants approval;
// changes outside that scope are vetoed, without player impersonation.
function requestManuscriptApproval(s,grantId,{title,genre}={}){
 const g=s.grants.find(x=>x.id===grantId),m=s.manuscripts?.find(x=>x.id===g?.manuscriptId);
 if(!g||!m||g.holderId!==s.playerId||g.grantorId===s.playerId||!g.approvalRequired)
  throw new Error('No independent contracted creator approval is available.');
 const req=requestCreativeApproval(s,grantId,{title,genre});
 req.status=req.genre===m.genre?'approved':'rejected';req.decidedBy=g.grantorId;req.decidedWeek=s.week;
 return req;
}
function publishingInterest(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='publishing'||p.status!=='active'||!c)throw new Error('Publishing interest is available before release only.');
 const expectedGross=money(p.forecast?.scenario?.expected?.gross??0);
 const volume=money(expectedGross/Math.max(1,p.weeksTotal));
 return {projectId:p.id,kind:'estimate',sampleWeek:s.week,expectedGross,weeklyInterestEstimate:volume,
  confidence:p.forecast?.evidenceSampleSize?'calibrated':'uncertain',disclaimer:'Interest only, not collected preorder cash. Future buyers may change.'};
}
// Optional single high-level production treatments. Fictional outside vendors
// are paid like other abstract suppliers; none acquires underlying rights.
const PUBLISHING_TREATMENTS=Object.freeze({
 research:{format:'Nonfiction',cost:1150,creative:4,technical:1,weeks:1},
 illustration:{format:'Comic / Manga',cost:1450,creative:2,technical:5,weeks:2},
 narration:{format:'Audiobook',cost:1650,creative:2,technical:5,weeks:2},
 conversion:{format:'Ebook',cost:750,creative:0,technical:4,weeks:0}
});
function publishingFormatTreatment(s,projectId,focus){
 const p=s.projects.find(p=>p.id===projectId),t=PUBLISHING_TREATMENTS[focus],c=p&&company(s,p.companyId);
 if(!p||!t||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!==t.format||
    p.status!=='active'||p.weeksDone>=p.weeksTotal*.8||p.route==='contract')
  throw new Error('Choose an eligible active publishing title for this format treatment.');
 if(p.publishingFormatHistory.some(h=>h.focus===focus))throw new Error('This format treatment was already completed.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Binding creative veto requires the rights owner to approve substantive changes.');
 if(c.finance.cash<t.cost+2500)throw new Error('Insufficient cash for the format treatment and payroll buffer.');
 expense(s,c,t.cost,'publishing-format','Optional '+focus+' services: '+p.title,p.id);
 p.directCost=money(p.directCost+t.cost);p.productionSpend=money((p.productionSpend||0)+t.cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+t.cost);
 p.weeksTotal+=t.weeks;p.creativeQuality=Math.round(clamp(p.creativeQuality+t.creative,1,99));
 p.technicalQuality=Math.round(clamp(p.technicalQuality+t.technical,1,99));
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 const item={focus,week:s.week,cost:t.cost,quality:p.quality};p.publishingFormatHistory.push(item);return item;
}
function translatePublishingEdition(s,projectId,regionName){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),r=activeRegions(s).find(r=>r.name===regionName);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||p.status!=='released'||!r)
  throw new Error('Only a released publishing edition can be translated into an available region.');
 if(!printRightsActive(s,p))throw new Error('Publishing rights no longer authorize this edition.');
 if(p.translations.some(t=>t.region===r.name))throw new Error('Translation already funded for this region.');
 const cost=1150;if(c.finance.cash<cost+3000)throw new Error('Insufficient cash for translation and operating reserve.');
 expense(s,c,cost,'publishing-translation','Regional translation: '+p.title+' / '+r.name,p.id);
 p.directCost=money(p.directCost+cost);
 const item={region:r.name,week:s.week,cost};p.translations.push(item);return item;
}
function createPublishingImprint(s,data={}){
 const c=player(s),name=String(data.name||'').trim().slice(0,42),genre=data.genre;
 if(!c.capabilities.publishing||name.length<3||!GENRES.includes(genre))throw new Error('Choose an imprint name and publishing genre.');
 if(c.imprints.length>=5||c.imprints.some(i=>i.name.toLowerCase()===name.toLowerCase()))throw new Error('Imprint roster full or name already used.');
 const fee=2000;if(c.finance.cash<fee+4000)throw new Error('Insufficient cash for imprint branding.');
 expense(s,c,fee,'imprint-branding','Create publishing imprint '+name);
 const imprint={id:id(s,'imprint'),companyId:c.id,name,genre,createdWeek:s.week,startFee:fee};c.imprints.push(imprint);return imprint;
}
function assignPublishingImprint(s,projectId,imprintId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),i=c?.imprints?.find(i=>i.id===imprintId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.status!=='active'||p.route==='contract'||!i)
  throw new Error('Imprints can only brand controlled unreleased publishing titles.');
 p.imprintId=i.id;return {projectId:p.id,imprintId:i.id};
}
function publishingImprintReport(s,imprintId){
 const c=player(s),imprint=c.imprints?.find(i=>i.id===imprintId);
 if(!imprint)throw new Error('Unknown imprint.');
 const books=s.projects.filter(p=>p.imprintId===imprintId&&p.companyId===c.id);
 return {name:imprint.name,genre:imprint.genre,companyId:c.id,projects:books.length,
  released:books.filter(p=>p.status==='released').length,
  directRevenue:money(books.reduce((n,p)=>n+p.directRevenue,0)),
  directCosts:money(books.reduce((n,p)=>n+p.directCost,0)),
  sharedOverheadDisclosedSeparately:true};
}
// A promotional signup campaign provides uncertain interest, never early
// consumer-sale revenue or a second wallet. Only actual released sales book cash.
function openPublishingPreorders(s,projectId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.status!=='active'||p.route==='contract'||p.preorderCampaign)
  throw new Error('A single prelaunch interest campaign is available for an active owned title.');
 const cost=900;if(c.finance.cash<cost+2500)throw new Error('Insufficient cash for the preorder marketing campaign.');
 const expected=p.forecast?.scenario?.expected?.gross||0;
 const registrations=Math.round(Math.max(0,expected)*.06/(p.format==='Comic / Manga'?13:20));
 expense(s,c,cost,'prelaunch-interest','Reader signup campaign for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.preorderCampaign={week:s.week,cost,registrations,kind:'nonbinding-reader-interest',paidDeposits:0};
 return {...p.preorderCampaign};
}
// Later publishing technologies require a world that has developed the
// supporting recording and digital infrastructure. No sector is opened early.
function publishingFormatAvailable(s,format){
 if(format==='Audiobook')return yearAt(s.week)>=4;
 if(format==='Ebook')return yearAt(s.week)>=10;
 return FORMATS.publishing.includes(format);
}
const PUBLISHING_PRICES=Object.freeze({'Novel':20,'Nonfiction':24,'Comic / Manga':13,'Web Serial':4,'Ebook':9,'Audiobook':16});
function publishingUnitPrice(p){return p.printStock?.price||PUBLISHING_PRICES[p.format]||12;}
// Audience categories are modeled estimates, NOT individually observed buyers.
// Apportion the actual whole units already sold, never increment receipts.
function estimatePublishingAudienceUnits(s,regionName,p,units){
 const cohorts=audienceCohorts(s,regionName);
 if(!cohorts.length||units<=0)return {};
 const factors=cohorts.map(k=>Math.max(0,k.share*(k.tastes[p.genre]||1)*audienceAffinity(p,k)));
 const total=factors.reduce((a,b)=>a+b,0)||1;
 const exact=factors.map(v=>units*v/total),whole=exact.map(Math.floor);
 const remainder=units-whole.reduce((a,b)=>a+b,0);
 const priorities=exact.map((v,i)=>({i,part:v-Math.floor(v)})).sort((a,b)=>b.part-a.part||a.i-b.i);
 for(let j=0;j<remainder;j++)whole[priorities[j%priorities.length].i]++;
 return Object.fromEntries(cohorts.map((k,i)=>[k.name,whole[i]]));
}
function openPublishingOutlet(s){
 requireExecutiveControl(s);const c=player(s);
 if(!c.capabilities.publishing||c.bankrupt||s.publishingOutlet?.active)throw new Error('Publishing outlet already active or unavailable.');
 const startup=7000;if(c.finance.cash<startup+weeklyOverhead(c,s)*6)throw new Error('Insufficient cash to launch and staff an owned publishing outlet.');
 expense(s,c,startup,'publishing-outlet-setup','Open first-party publishing outlet');
 if(s.publishingOutlet){s.publishingOutlet.active=true;s.publishingOutlet.startupSpent=money(s.publishingOutlet.startupSpent+startup);}
 else s.publishingOutlet={id:id(s,'publishingoutlet'),companyId:c.id,active:true,createdWeek:s.week,startupSpent:startup,operatingSpent:0,catalog:[],customerGross:0,distributionFees:0,monthlyCost:500};
 return s.publishingOutlet;
}
function listPublishingOutlet(s,projectId){
 const o=s.publishingOutlet,p=s.projects.find(p=>p.id===projectId);
 if(!o?.active||!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||!['active','released'].includes(p.status))throw new Error('A controlled publishing title and active outlet are required.');
 if(p.grantId&&!s.grants.some(g=>g.id===p.grantId&&g.holderId===p.companyId&&g.type==='license'&&g.allowsProduction&&g.startWeek<=s.week&&g.endWeek>s.week))throw new Error('Distribution rights are unavailable or expired.');
 if(o.catalog.some(x=>x.projectId===p.id))throw new Error('This edition is already listed.');
 const rec={projectId:p.id,listedWeek:s.week};o.catalog.push(rec);return rec;
}
function closePublishingOutlet(s){
 const o=s.publishingOutlet;if(!o?.active)throw new Error('No active publishing outlet to close.');
 o.active=false;for(const p of s.projects)if(p.companyId===s.playerId&&p.publishingChannel==='owned')p.publishingChannel=isPrintEdition(p)?'mixed':'digital';
 return o;
}
function publishingOutletReport(s){
 const o=s.publishingOutlet;
 if(!o)return {active:false,listed:0,startupSpent:0,operatingSpent:0,customerGross:0,distributionFees:0};
 return {active:o.active,listed:o.catalog.length,startupSpent:o.startupSpent,operatingSpent:o.operatingSpent,customerGross:o.customerGross,distributionFees:o.distributionFees,monthlyCost:o.monthlyCost};
}
const PUBLISHING_CHANNELS=['mixed','direct','wholesale','digital','owned'];
function setPublishingChannel(s,projectId,channel){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||!['active','released'].includes(p.status))
  throw new Error('No eligible owned publishing edition.');
 if(!PUBLISHING_CHANNELS.includes(channel)||(channel==='digital'&&isPrintEdition(p)))throw new Error('Invalid publishing channel for edition.');
 if(channel==='owned'&&(!s.publishingOutlet?.active||!s.publishingOutlet.catalog.some(x=>x.projectId===p.id)))throw new Error('First-party publishing outlet must be active and list the licensed edition.');
 if(p.status==='released'&&!printRightsActive(s,p))throw new Error('Publishing distribution license has expired.');
 p.publishingChannel=channel;return channel;
}
function setSerialCadence(s,projectId,cadence){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!=='Web Serial'||p.status!=='active'||p.weeksDone>0||p.route==='contract')
  throw new Error('Serial pacing is set before the first scheduled production week.');
 if(!['steady','fast','polished'].includes(cadence))throw new Error('Invalid serial cadence.');
 if(p.serialCadence!=='steady')throw new Error('Serial cadence may be selected only once.');
 p.serialCadence=cadence;
 if(cadence==='fast'){p.weeksTotal=Math.max(6,Math.floor(p.weeksTotal*.8));p.creativeQuality=Math.max(1,p.creativeQuality-3);}
 if(cadence==='polished'){p.weeksTotal+=3;p.creativeQuality=Math.min(99,p.creativeQuality+3);}
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 return {cadence,weeks:p.weeksTotal,quality:p.quality};
}
// One optional arc-level decision, never a compulsory chapter/task queue.
function reviewSerialArc(s,projectId,choice){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!=='Web Serial'||
    p.status!=='active'||p.weeksDone<=0||p.weeksDone>=p.weeksTotal*.85||p.serialArcDecisions.length)
   throw new Error('An active mid-production serial arc is required; the team handles other arcs.');
 if(!['tighten','expand'].includes(choice))throw new Error('Unknown serial arc direction.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Creator veto restricts editing this licensed serial.');
 const cost=choice==='expand'?900:650;
 if(c.finance.cash<cost+2500)throw new Error('Insufficient cash for serialized editorial work.');
 expense(s,c,cost,'serial-arc','Optional '+choice+' arc planning: '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 if(choice==='expand'){p.weeksTotal+=2;p.creativeQuality=Math.min(99,p.creativeQuality+4);}
 else {p.weeksTotal=Math.max(p.weeksDone+1,p.weeksTotal-1);p.technicalQuality=Math.min(99,p.technicalQuality+2);}
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 const rec={week:s.week,choice,cost};p.serialArcDecisions.push(rec);return rec;
}
function publishingSalesReport(s,projectId){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.sector!=='publishing')throw new Error('Unknown publishing title.');
 const b=p.salesByRegion||{},channels=p.salesByChannel||{},u=p.salesUnitsByRegion||{},v=p.salesUnitsByChannel||{},cohorts=p.salesUnitsByAudience||{};
 return {projectId:p.id,totalGross:money(Object.values(b).reduce((x,y)=>x+y,0)),
  unitPrice:publishingUnitPrice(p),totalUnits:Object.values(u).reduce((n,x)=>n+x,0),unitsHistoryComplete:p.publishingUnitHistoryComplete===true,
  audienceMixEstimated:true,audienceHistoryComplete:p.audienceUnitHistoryComplete===true,
  byAudience:Object.entries(cohorts).map(([name,units])=>({name,units,provenance:'estimated'})),
  recentWeeks:(p.publishingUnitHistory||[]).map(x=>({...x})),
  regions:Object.entries(b).map(([name,gross])=>({name,gross:money(gross),units:u[name]||0})),
  byChannel:Object.entries(channels).map(([name,gross])=>({name,gross:money(gross),units:v[name]||0})),
  observedSinceVersion:25,historyComplete:p.publishingSalesHistoryComplete===true,
  netProjectReceipts:p.directRevenue,printStock:p.printStock?.stock??null,weeklyGross:p.stats.weeklySales};
}
function previewProject(s,data={}) {
  const c=data.companyId?company(s,data.companyId):player(s);
  const sector=data.sector||c.sector;
  const size=clamp(Number(data.size)||1,.65,2.2);const format=FORMATS[sector]?.includes(data.format)?data.format:FORMATS[sector]?.[0];
  if(sector==='publishing'&&!publishingFormatAvailable(s,format))throw new Error('This publishing format needs later world technology adoption.');
  const productionRegion=REGIONS.find(r=>r.name===data.productionRegion)||REGIONS[0];
  const base=sectorCost(sector,size,format)*productionRegion.productionCost;
  const outsource=c.capabilities[sector]==='partner';
  const budget=Math.round(base*(outsource?1.20:1)/100)*100;
  const weeks=Math.max(6,Math.round(SECTORS[sector].weeks*(.78+size*.23)));
  const marketing=money(Math.round(budget*(Number(data.marketing)||.2)*100)/100);
  const printPhysical=sector==='publishing'&&data.route!=='contract'&&['Novel','Nonfiction','Comic / Manga'].includes(format);
  const initialPrintCash=printPhysical?money(Math.round(350*size)*(format==='Comic / Manga'?1.6:2.2)):0;
  const plan={sector,format,size,productionRegion:productionRegion.name,budget,weeks,marketing,grandTotal:money(budget+marketing),initialPrintCash,contractFee:money((budget+marketing)*1.43)};
  if(data.route==='contract'){
    const signed=data.offerId?s.commissionOffers.find(o=>o.id===data.offerId):null;
    if(data.offerId&&(!signed||signed.status!=='accepted'||signed.producerId!==c.id||signed.sector!==sector))throw new Error('No accepted client offer for this project.');
    if(signed)plan.contractFee=signed.acceptedFee;
    const clients=eligibleClients(s,plan.contractFee,c.id);
    plan.clientId=signed?signed.clientId:(clients.find(x=>x.id===data.clientId)?.id||(!data.clientId||data.clientId==='auto'?clients[0]?.id:null));
    plan.fundedClientCount=clients.length;
  }
  plan.forecast=data.withForecast===false?null:forecastProject(s,data,plan,c);
  return plan;
}

// Evidence is from the player's own completed releases only. A review reports
// a fixed 13-week observation, so lifetime catalogue receipts are never
// mistaken for the originally forecast horizon.
function projectEvidence(s,{companyId=s.playerId,sector='publishing',genre=null,limit=8}={}){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company for evidence.');
 if(!SECTORS[sector])throw new Error('Unknown industry for evidence.');
 const rows=s.projects.filter(p=>p.companyId===c.id&&p.sector===sector&&(!genre||p.genre===genre)&&p.status==='released'&&p.review&&
   Number.isFinite(p.review.actualDirect)&&Number.isFinite(p.review.expectedDirect)&&p.creativeHistoryComplete!==false)
  .sort((a,b)=>b.releaseWeek-a.releaseWeek).slice(0,clamp(Math.round(limit)||8,1,20))
  .map(p=>({projectId:p.id,title:p.title,genre:p.genre,releaseWeek:p.releaseWeek,year:yearAt(p.releaseWeek),
    actualDirect:money(p.review.actualDirect),expectedDirect:money(p.review.expectedDirect),actualGross:Number.isFinite(p.review.actualGross)?money(p.review.actualGross):null,expectedGross:Number.isFinite(p.review.expectedGross)?money(p.review.expectedGross):null,
    variance:money(p.review.actualDirect-p.review.expectedDirect),source:'observed 13-week postmortem',historyComplete:true}));
 return {companyId:c.id,sector,genre,sampleSize:rows.length,rows,
   averageVariance:rows.length?money(rows.reduce((n,r)=>n+r.variance,0)/rows.length):null,
   basis:rows.length?'Your own observed 13-week release results; not a guarantee of future sales.':'No comparable completed 13-week release reviews. Do not infer a performance history.'};
}
function projectHistory(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company for project history.');
 const releases=s.projects.filter(p=>p.companyId===companyId&&p.status==='released').map(p=>({
   projectId:p.id,title:p.title,sector:p.sector,genre:p.genre,releaseWeek:p.releaseWeek,year:yearAt(p.releaseWeek),
   actualDirect:currentProjectProfit(p),reviewDirect:Number.isFinite(p.review?.actualDirect)?money(p.review.actualDirect):null,expectedDirect:Number.isFinite(p.review?.expectedDirect)?money(p.review.expectedDirect):null,
   comparisonComplete:!!(p.review&&Number.isFinite(p.review.expectedDirect)&&p.creativeHistoryComplete!==false),
   overheadAllocated:p.overheadAttributed||0,overheadComplete:p.overheadHistoryComplete===true
 })).sort((a,b)=>b.releaseWeek-a.releaseWeek);
 const years=Array.from(new Set(releases.map(x=>x.year))).sort((a,b)=>b-a).map(year=>{
  const rows=releases.filter(r=>r.year===year);
  return {year,releaseCount:rows.length,realizedDirectContribution:money(rows.reduce((n,r)=>n+r.actualDirect,0)),
   comparableReviews:rows.filter(r=>r.comparisonComplete).length,
   comparisonVariance:money(rows.filter(r=>r.comparisonComplete).reduce((n,r)=>n+r.reviewDirect-r.expectedDirect,0)),
   note:'Realized direct result includes later catalogue income; 13-week comparisons require their separate postmortems.'};
 });
 return {companyId,releases,years};
}

// Team management is opt-in: no employee-by-employee chore. Every actual work
// assignment still occupies a finite real team; sponsor teams stay separate.
function changeProjectTeam(s,projectId,targetTeamId){
 const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||!controlledCompanies(s).some(x=>x.id===c.id))throw new Error('Unknown or unrelated project.');
 if(p.status!=='active')throw new Error('Only an active project can be reassigned.');
 const to=c.teams?.find(t=>t.id===targetTeamId);
 if(!to)throw new Error('Choose a real team from this production company.');
 if(targetTeamId===p.teamId)throw new Error('That team is already assigned to this production.');
 if(teamBusy(s,targetTeamId))throw new Error('Target team is busy or committed to another production.');
 const fromTeamId=p.teamId;
 p.teamId=to.id;
 const change={week:s.week,fromTeamId,toTeamId:to.id};
 if(!p.teamChanges)p.teamChanges=[];p.teamChanges.push(change);
 if(c.isPlayer)news(s,'Production team reassigned',p.title+' moved to '+to.name+' without resetting completed work or changing underlying rights.','production');
 return change;
}
function interveneProduction(s,projectId,kind){
 const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||!controlledCompanies(s).some(x=>x.id===c.id))throw new Error('Unknown or unrelated project.');
 if(!['revision','polish','scope'].includes(kind))throw new Error('Unknown production intervention.');
 if(p.status!=='active')throw new Error('Only active productions can be revised.');
 if(p.route==='contract')throw new Error('Client contracts cannot be changed without agreement.');
 if(p.route==='adaptation'&&kind==='revision'&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Binding creator approval required before changing a licensed creative plan.');
 if((p.interventions||[]).some(x=>x.kind===kind))throw new Error('Each intervention may be used only once.');
 if(p.weeksDone/p.weeksTotal>=.8)throw new Error('Production is too close to release for this major intervention.');
 const initialBudget=p.budget;let spend=0;
 if(kind==='revision'||kind==='polish'){
   spend=money(p.budget*(kind==='revision'?.08:.10));
   if(c.finance.cash<spend+weeklyOverhead(c,s)*4)throw new Error('Insufficient cash and operating buffer for this intervention.');
   expense(s,c,spend,'production-intervention',(kind==='revision'?'Creative revision':'Technical polish')+': '+p.title,p.id);
   p.directCost=money(p.directCost+spend);
   p.productionSpend=money((p.productionSpend??0)+spend);
   p.periodProductionSpend=money((p.periodProductionSpend||0)+spend);
   p.weeksTotal=money(p.weeksTotal+2);
   if(kind==='revision'){p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)+6,1,100));p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)-1,1,100));}
   else {p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)+7,1,100));p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)-1,1,100));}
 }else {
   const remain=clamp(1-p.weeksDone/p.weeksTotal,0,1);
   p.budget=money(p.budget*(1-.16*remain));
   p.weeksTotal=money(Math.max(p.weeksDone+1,p.weeksTotal-2));
   p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)-5,1,100));
   p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)-4,1,100));
 }
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,100));
 const rec={week:s.week,kind,spend,originalBudget:initialBudget,newBudget:p.budget,weeksTotal:p.weeksTotal,
   creativeQuality:p.creativeQuality,technicalQuality:p.technicalQuality};
 if(!p.interventions)p.interventions=[];p.interventions.push(rec);
 if(c.isPlayer)news(s,'Production decision: '+p.title,kind==='scope'?'Trimmed unfinished scope to protect cash, at a quality cost.':
   'Authorized '+(kind==='revision'?'editorial revisions':'technical polish')+' with real spending and a later completion.','production');
 return rec;
}

// Opt-in editorial desk: uncertainty is explained, not hidden in a compulsory
// chapter-by-chapter workflow. Changes cost actual cash and do not affect IP.
const EDITORIAL_ACTIONS=Object.freeze({development:{label:'Development edit',fraction:.065,minimum:650,creative:5,technical:0,weeks:2},
  copyedit:{label:'Copyedit and proofreading',fraction:.040,minimum:440,creative:0,technical:5,weeks:1},
  cover:{label:'Cover and presentation design',fraction:.035,minimum:480,creative:1,technical:4,weeks:1}});
function editorialAssessment(s,projectId){
 const p=s.projects.find(p=>p.id===projectId);
 if(!p||p.sector!=='publishing')throw new Error('Editorial desk assesses publishing projects only.');
 const team=company(s,p.companyId)?.teams.find(t=>t.id===p.teamId);
 const risks=[];
 if(p.creativeQuality<67)risks.push('Story and audience response may benefit from a development edit.');
 if(p.technicalQuality<70)risks.push('Copyediting and presentation are a potential weakness.');
 if(team&&team.specialty!==p.genre)risks.push('Assigned team lacks matching genre specialization.');
 if(!risks.length)risks.push('No obvious weakness; additional edits can still consume scarce cash and time.');
 return {projectId:p.id,title:p.title,creative:p.creativeQuality,technical:p.technicalQuality,risks,
   choices:Object.entries(EDITORIAL_ACTIONS).map(([kind,a])=>({kind,label:a.label,estimatedFee:money(Math.max(a.minimum,p.budget*a.fraction)),weeks:a.weeks,alreadyDone:(p.editorialHistory||[]).some(x=>x.kind===kind)})),
   source:'Current project assessment, not a guaranteed sales forecast',historyComplete:p.editorialHistoryComplete!==false};
}
function editorialDecision(s,projectId,kind){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),action=EDITORIAL_ACTIONS[kind];
 if(!p||!c||!controlledCompanies(s).some(x=>x.id===c.id))throw new Error('Only your production company can authorize editorial work.');
 if(p.sector!=='publishing')throw new Error('Editorial decisions apply only to publishing.');
 if(!action)throw new Error('Unknown editorial decision.');
 if(p.status!=='active')throw new Error('Editorial work requires an active, unreleased project.');
 if(p.route==='contract')throw new Error('Client-controlled editorial scope needs a negotiated contract change.');
 if(p.route==='adaptation'&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)throw new Error('Binding creator approval is needed before changing this adaptation.');
 if((p.editorialHistory||[]).some(x=>x.kind===kind))throw new Error('This editorial pass has already been completed.');
 if(p.weeksDone/p.weeksTotal>=.80)throw new Error('Too late in production for this editorial pass.');
 const cost=money(Math.max(action.minimum,p.budget*action.fraction));
 if(c.finance.cash<cost+weeklyOverhead(c,s)*4)throw new Error('Insufficient cash and payroll reserve to fund editorial work.');
 expense(s,c,cost,'editorial-development',action.label+' for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.creativeQuality=Math.round(clamp((p.creativeQuality??p.quality)+action.creative,1,99));
 p.technicalQuality=Math.round(clamp((p.technicalQuality??p.quality)+action.technical,1,99));
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,99));
 p.weeksTotal=money(p.weeksTotal+action.weeks);
 if(!Array.isArray(p.editorialHistory))p.editorialHistory=[];
 const rec={week:s.week,kind,cost,creativeQuality:p.creativeQuality,technicalQuality:p.technicalQuality,weeksTotal:p.weeksTotal};
 p.editorialHistory.push(rec);
 if(c.isPlayer)news(s,'Editorial milestone: '+p.title,action.label+' authorized for '+shortMoney(cost)+'. Time and creative outcomes were updated; ownership is unchanged.','production');
 return {...rec};
}
// Career credits are written at actual release, never backfilled by a migration.
// Named talent and legally distinct companies retain separate identities.
function recordCreatorCredit(s,p,c,team){
 const leader=s.employees.find(e=>e.id===team?.leaderId&&e.status==='employed');
 const specialist=s.specialists?.find(x=>x.id===p.specialistId);
 const credited=[];
 if(leader)credited.push({personId:leader.id,role:'team lead'});
 if(specialist)credited.push({personId:specialist.id,role:specialist.discipline+' specialist'});
 p.creatorCredits=credited;
 if(leader&&specialist){
  let bond=s.creatorRelations.find(r=>r.leaderId===leader.id&&r.specialistId===specialist.id);
  if(!bond){bond={leaderId:leader.id,specialistId:specialist.id,projects:0,projectIds:[],lastWeek:s.week};s.creatorRelations.push(bond);}
  if(!bond.projectIds.includes(p.id)) {bond.projects++;bond.projectIds.push(p.id);bond.lastWeek=s.week;}
  leader.morale=clamp(leader.morale+(leader.trait==='collaborative'?2:1),10,100);
 }
}
function creatorCareer(s,personId){
 const person=[...s.employees,...s.specialists].find(e=>e.id===personId);
 if(!person)throw new Error('Unknown creator identity.');
 const credits=s.projects.filter(p=>p.status==='released'&&p.creatorCredits?.some(x=>x.personId===personId))
  .map(p=>({projectId:p.id,title:p.title,sector:p.sector,year:yearAt(p.releaseWeek),quality:p.quality,role:p.creatorCredits.find(x=>x.personId===personId).role}));
 const awards=(s.creativeAwards||[]).filter(a=>a.creatorIds.includes(personId)).map(a=>({...a,creatorIds:[...a.creatorIds]}));
 const collaborations=(s.creatorRelations||[]).filter(x=>x.leaderId===personId||x.specialistId===personId)
  .map(x=>({personId:x.leaderId===personId?x.specialistId:x.leaderId,projects:x.projects,lastWeek:x.lastWeek}));
 return {id:person.id,name:person.name,credits,awards,collaborations,historyComplete:person.historyComplete!==false&&s.creatorHistoryComplete!==false};
}
function creativeAwards(s,{year=null,sector='all'}={}){
 return (s.creativeAwards||[]).filter(a=>(year===null||a.year===Number(year))&&(sector==='all'||a.sector===sector))
  .map(a=>({...a,creatorIds:[...a.creatorIds]})).sort((a,b)=>b.year-a.year||a.sector.localeCompare(b.sector));
}
function worldHistory(s){
 // Imported world prehistory is tagged generated; decisions/releases from the
 // player's simulated weeks are tagged played. Neither is retconned into a
 // completed game event by a save migration.
 const entries=(s.worldStory||[]).map(x=>({year:x.year,title:x.text,
   source:x.source==='Generated prehistory'?'generated':'played',projectId:null}));
 if(!entries.some(x=>x.source==='played'&&x.title.includes(player(s)?.name+' founded')))
  entries.push({year:player(s)?.foundedYear||s.startedYear,title:player(s)?.name+' founded as a new company',source:'played',projectId:null});
 for(const p of s.projects||[])if(p.status==='released'&&p.releaseWeek!==null)
  entries.push({year:yearAt(p.releaseWeek),title:p.title+' released ('+SECTORS[p.sector].name+')',source:'played',projectId:p.id});
 for(const a of s.creativeAwards||[]){const p=s.projects.find(p=>p.id===a.projectId);
  if(p)entries.push({year:a.year+1,title:SECTORS[a.sector].name+' creative honor: '+p.title,source:'played',projectId:p.id});}
 return entries.sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title)).slice(0,120);
}
function recognizeCreativeAwards(s,completedYear){
 for(const sector of Object.keys(SECTORS)){
  const eligible=s.projects.filter(p=>p.sector===sector&&p.status==='released'&&p.releaseWeek!==null&&yearAt(p.releaseWeek)===completedYear);
  if(!eligible.length||(s.creativeAwards||[]).some(a=>a.year===completedYear&&a.sector===sector))continue;
  eligible.sort((a,b)=>(b.criticScore??b.quality)-(a.criticScore??a.quality)||a.id.localeCompare(b.id));
  const winner=eligible[0],creators=(winner.creatorCredits||[]).map(x=>x.personId),c=company(s,winner.companyId);
  const a={year:completedYear,sector,projectId:winner.id,companyId:winner.companyId,
   creatorIds:creators,score:winner.criticScore??winner.quality,awardedWeek:s.week,generated:false};
  s.creativeAwards.push(a);
  if(c){c.reputation=Math.round(clamp(c.reputation+1,4,98));
   for(const pid of creators){const e=s.employees.find(x=>x.id===pid&&x.status==='employed');if(e)e.morale=clamp(e.morale+2,0,100);}}
  news(s,'Annual '+SECTORS[sector].name+' creative honor: '+winner.title,
   'Year '+completedYear+' award for an actual released work by '+c?.name+'. Critics and audience sales remain separate.','award');
 }
 if(s.creativeAwards.length>1500)s.creativeAwards.splice(0,s.creativeAwards.length-1500);
}
// Emerging writer/artist discovery is optional and financed; scouting makes
// a genuine outside creator available, never an employee or rights owner.
function scoutEmergingCreator(s,role){
 if(!['writer','artist'].includes(role))throw new Error('Choose a writer or artist to scout.');
 const c=player(s),year=yearAt(s.week),fee=1250;
 if((s.creatorScouting||[]).filter(x=>yearAt(x.week)===year).length>=2)throw new Error('Creative scouting limit reached for this year.');
 if(s.specialists.length>=35)throw new Error('External creative roster is already at its simulation limit.');
 if(c.bankrupt||c.finance.cash<fee+weeklyOverhead(c,s)*4)throw new Error('Insufficient cash and operating reserves for scouting.');
 const seq=s.sequence+1,n=hash(s.seed+':emerging:'+seq+':'+role);
 const candidate={id:id(s,'talent'),name:STAFF_FIRST[n%STAFF_FIRST.length]+' '+STAFF_LAST[Math.floor(n/11)%STAFF_LAST.length],
  creatorRole:role,discipline:'editorial',skill:54+n%23,fee:money(750+(n%23)*33),assignedProjectId:null,completed:0,
  enteredWeek:s.week,mentorshipHistory:[],historyComplete:true};
 expense(s,c,fee,'creative-scout','Scout an emerging '+role+': '+candidate.name);
 s.specialists.push(candidate);s.creatorScouting.push({week:s.week,personId:candidate.id,fee});
 news(s,'Emerging '+role+' discovered',candidate.name+' joins the independent creator market following paid scouting. No underlying IP rights change.','talent');
 return {...candidate,scoutingFee:fee};
}
function developEmergingCreator(s,personId){
 const talent=s.specialists.find(t=>t.id===personId&&['writer','artist'].includes(t.creatorRole));
 if(!talent)throw new Error('No eligible emerging writer or artist.');
 if(talent.assignedProjectId)throw new Error('Creator is booked and cannot attend a fellowship.');
 if(talent.mentorshipHistory?.some(h=>yearAt(h.week)===yearAt(s.week)))throw new Error('Only one funded fellowship per creator each year.');
 const c=player(s),cost=1800;if(c.bankrupt||c.finance.cash<cost+weeklyOverhead(c,s)*4)throw new Error('Insufficient cash and payroll reserves for this fellowship.');
 if(talent.skill>=96)throw new Error('Creator has reached the current skill ceiling.');
 expense(s,c,cost,'creative-fellowship','Independent creator fellowship: '+talent.name);
 const before=talent.skill;talent.skill=Math.min(96,talent.skill+4);talent.fee=money(talent.fee+100);
 talent.mentorshipHistory.push({week:s.week,cost,oldSkill:before,newSkill:talent.skill});
 news(s,'Creative fellowship: '+talent.name,'Funded development improves a freelance '+talent.creatorRole+'; no employment, IP or forced exclusive contract is created.','talent');
 return {id:talent.id,skill:talent.skill,cost};
}
// Recorded actual releases only: the chart never predicts preorders or
// combines incomparable inventory copies with distribution gross.
function publishingCharts(s,{metric='gross',year='all',limit=15}={}){
 if(!['gross','critic','audience'].includes(metric))throw new Error('Unknown publishing chart metric.');
 if(year!=='all'&&(!Number.isInteger(Number(year))||Number(year)<1||Number(year)>yearAt(s.week)))throw new Error('Invalid publishing chart year.');
 const rows=s.projects.filter(p=>p.sector==='publishing'&&p.status==='released'&&p.route!=='contract'&&
  p.releaseWeek!==null&&(year==='all'||yearAt(p.releaseWeek)===Number(year))).map(p=>({projectId:p.id,title:p.title,
  companyId:p.companyId,year:yearAt(p.releaseWeek),format:p.format,criticScore:p.criticScore??p.quality,
  audienceScore:p.audienceScore??p.quality,gross:money(p.stats?.totalSales||0),
  source:'actual',historyComplete:p.creativeHistoryComplete!==false}));
 return rows.sort((a,b)=>(metric==='gross'?b.gross-a.gross:metric==='critic'?b.criticScore-a.criticScore:b.audienceScore-a.audienceScore)||a.title.localeCompare(b.title)).slice(0,clamp(Number(limit)||15,1,30));
}
function createProject(s,data={}) {
  if(s.runStatus==='ended')throw new Error('This campaign has concluded; existing rights and finances are preserved.');
  const c=data.companyId?company(s,data.companyId):player(s);
  if(c?.id===s.playerId)requireExecutiveControl(s);
  if(!c||c.bankrupt)throw new Error('Company unavailable.');
  const sector=data.sector||c.sector;
  if(!SECTORS[sector]||!available(sector,s.week))throw new Error('This industry has not debuted.');
  if(!c.capabilities[sector])throw new Error('Company lacks the '+SECTORS[sector].name+' capability. Enter the industry or work with a partner first.');
  if(s.projects.filter(p=>p.companyId===c.id&&p.status==='active').length>=c.capacity)throw new Error('All team slots are currently occupied.');
  const isAI=!c.isPlayer;
  const route=['original','adaptation','contract'].includes(data.route)?data.route:'original';
  // Commissioned delivery uses a funded client agreement in every debuted sector.
  // It does not originate or transfer underlying IP by implication.
  let approvedPitch=null;
  if(route==='adaptation') {
    const test=canUseIp(s,c,data.ipId,sector);if(!test.ok)throw new Error(test.reason);
    if(test.grantId){const grant=s.grants.find(g=>g.id===test.grantId);
      if(grant?.approvalRequired){const pitch=s.creativeApprovals.find(a=>a.id===data.approvalId&&a.grantId===grant.id&&a.holderId===c.id&&a.status==='approved'&&
        a.title===String(data.title||'Untitled Project').trim().slice(0,62)&&a.genre===(GENRES.includes(data.genre)?data.genre:'Fantasy')&&!a.launched);
        if(!pitch)throw new Error('Binding creator approval required before this adaptation can start.');
        approvedPitch=pitch;
      }
    }
  }
  const signed=data.offerId?s.commissionOffers.find(o=>o.id===data.offerId):null;
  if(data.offerId){
    if(route!=='contract'||!signed||signed.status!=='accepted'||signed.producerId!==c.id||
       signed.title!==String(data.title||'').trim().slice(0,62)||signed.sector!==sector||
       signed.size!==clamp(Number(data.size)||1,.65,2.2))throw new Error('Only a matching accepted commission may be booked.');
    data={...data,clientId:signed.clientId,genre:signed.genre,format:signed.format,
      marketing:signed.marketing,productionRegion:signed.productionRegion};
  }
  const estimate=previewProject(s,{...data,sector,companyId:c.id,withForecast:!isAI});
  const cost=money(estimate.grandTotal),reserve=money(cost*.30);
  if(route==='contract'&&!estimate.clientId)throw new Error('No funded client currently offers this commission. Pick a different project or wait for buyer funds.');
  if(route==='contract'&&!eligibleClients(s,estimate.contractFee,c.id).some(b=>b.id===estimate.clientId))
    throw new Error('Client lacks committed cash for this commission.');
  const team=selectTeam(s,c,data.teamId,data.genre||'Fantasy');
  if(!team)throw new Error('No available production team. Hire another team or wait for completion.');
  if(c.finance.cash < reserve+2500)throw new Error('Not enough available cash. A project requires a 30% initial liquidity reserve plus operating buffer.');
  const title=(String(data.title||'Untitled Project').trim().slice(0,62)||'Untitled Project');
  const genre=GENRES.includes(data.genre)?data.genre:pick(s,GENRES);
  const pitch=pitchFrom(data);
  const leader=(s.employees||[]).find(e=>e.id===team.leaderId&&e.status==='employed');
  const leadershipQuality=leader?clamp((leader.skill-60)*.08+(leader.morale-65)*.05+(leader.trait==='inventive'?2:leader.trait==='meticulous'?1:0),-4,5):-4;
  // Founder aptitudes change an actual project's outcome; neither founder
  // reputation nor company shares/IP ownership changes without an event.
  const founderBonus=c.isPlayer?(s.founder?.background==='editorial'&&estimate.sector==='publishing'?3:s.founder?.background==='production'?2:s.founder?.background==='finance'?1:0)+(s.founder?.focus==='creative'?2:s.founder?.focus==='people'?1:0):0;
  const baseQuality=Math.round(clamp(35+c.reputation*.31+rand(s)*24+estimate.size*4+(team.specialty===genre?4:0)+(team.skill-50)*.15+leadershipQuality+founderBonus,25,96));
  const creativeQuality=Math.round(clamp(baseQuality+(pitch.direction==='experimental'?8:pitch.direction==='polished'?-3:0)+(pitch.theme==='Survival'?2:0),20,99));
  const technicalQuality=Math.round(clamp(baseQuality+(pitch.direction==='polished'?8:pitch.direction==='experimental'?-7:0)+(team.skill-50)*.05,15,99));
  const releaseQuality=Math.round(clamp(creativeQuality*.55+technicalQuality*.45,15,98));
  let ipId=route==='adaptation'?data.ipId:null;
  if(route==='original') {const ip={id:id(s,'ip'),name:title,ownerId:c.id,createdWeek:s.week,sourceSector:sector,description:genre+' original',works:[],rightsIncome:0,rightsHistoryComplete:true};s.ips.push(ip);ipId=ip.id;}
  const project={id:id(s,'project'),title,companyId:c.id,sector,genre,format:estimate.format,productionRegion:estimate.productionRegion,route,ipId,grantId:null,teamId:team.id,clientId:null,escrowId:null,status:'active',printStock:null,startWeek:s.week,releaseWeek:null,overheadAttributed:0,overheadHistoryComplete:true,weeksTotal:estimate.weeks,weeksDone:0,budget:estimate.budget,marketingBudget:estimate.marketing,directCost:0,directRevenue:0,royaltyCost:0,earnedFee:route==='contract'?estimate.contractFee:0,advance:0,quality:releaseQuality,creativeQuality,technicalQuality,pitch,creativeHistoryComplete:true,phase:'concept',phaseHistory:[{week:s.week,phase:'concept'}],franchiseBranch:route==='contract'?null:FRANCHISE_BRANCHES.includes(data.franchiseBranch)?data.franchiseBranch:'main',franchiseHistoryComplete:true,holdUntilWeek:null,releasePlanHistory:[],specialistId:null,specialistAppointments:[],leadCharacter:typeof data.leadCharacter==='string'?data.leadCharacter.trim().slice(0,60):'',editorialHistory:[],editorialHistoryComplete:true,creatorCredits:[],interventions:[],teamChanges:[],criticScore:null,audienceScore:null,audience:0,size:estimate.size,ai:isAI,major:estimate.grandTotal>c.finance.equity*.18||estimate.size>=1.5||(estimate.forecast?.scenario.expected.gross||0)>c.finance.equity*1.25||data.flagship===true||data.flagship==='yes',stats:{weeklySales:0,totalSales:0},serialReaderMomentum:1,serialEngagementHistory:[],serialArcDecisions:[],publishingFormatHistory:[],translations:[],preorderCampaign:null,imprintId:null,publishingChannel:sector==='publishing'?(isPrintEdition({sector,format:estimate.format,route})?'mixed':'digital'):null,serialCadence:sector==='publishing'&&estimate.format==='Web Serial'?'steady':null,salesByRegion:{},salesByChannel:{},salesUnitsByRegion:{},salesUnitsByChannel:{},salesUnitsByAudience:{},audienceUnitHistoryComplete:true,publishingUnitHistory:[],publishingUnitHistoryComplete:true,publishingSalesHistoryComplete:true,forecast:estimate.forecast,review:null,plannedTotal:estimate.grandTotal,
    // Risk is hidden at greenlight; published EAC uses observed spend, never secret future certainty.
    budgetMultiplier:money(1+(((hash(s.seed+':cost:'+s.sequence)%2001)/1000)-1)*(team.specialty===genre?.07:.12)),budgetAlerted:false,productionSpend:0,periodProductionSpend:0,lastClosedPlannedSpend:0,budgetCloseComplete:true,budgetHistoryComplete:true};
  if(sector==='movie')project.cinema=filmDefault(project);
  if(sector==='tv')project.television=tvDefault(project);
  if(sector==='games')project.videoGame=gameDefault(project,s.week);
  if(route==='adaptation') {const check=canUseIp(s,c,ipId,sector);project.grantId=check.grantId||null;}
  s.projects.push(project);
  if(approvedPitch){approvedPitch.launched=project.id;project.approvalId=approvedPitch.id;}
  if(route==='contract'){
    reserveClientFee(s,company(s,estimate.clientId),c,project.earnedFee,project);
    if(signed){signed.status='booked';signed.projectId=project.id;signed.updatedWeek=s.week;}
  }
  if(c.isPlayer){news(s,'Production greenlit: '+title,SECTORS[sector].name+' • '+genre+' • '+estimate.weeks+' weeks planned.','production');}
  return project;
}
// Inventoried print editions are physical units. Digital/serial rights are not
// silently invented; older releases migrated from v8 retain their old sales model.
function isPrintEdition(p){return p.sector==='publishing'&&p.route!=='contract'&&['Novel','Nonfiction','Comic / Manga'].includes(p.format);}
function initPrintEdition(s,p){
  if(!isPrintEdition(p)||p.printStock)return;
  const comic=p.format==='Comic / Manga';
  p.printStock={stock:0,printed:0,sold:0,returned:0,writtenOff:0,unitCost:comic?1.6:2.2,price:comic?13:20,
    printSpend:0,cogs:0,returnsCost:0,writeOffCost:0,lastOrderWeek:-1,autoReprint:true,returnQueue:[],returnFraction:0,demandEwma:0,closed:false,historyComplete:true};
  const c=company(s,p.companyId),ideal=Math.round(350*p.size);
  const affordable=Math.floor(Math.max(0,c.finance.cash-weeklyOverhead(c,s)*4)/p.printStock.unitCost);
  const quantity=Math.max(0,Math.min(ideal,affordable));
  if(quantity>=50)buyPrintRun(s,p,quantity,true);
  else if(c.isPlayer)alert(s,'initial-print-'+p.id,'Print funding needed',p.title+' has no initial print stock. Budget for copies in Productions before expecting sales.','advisory');
}
function buyPrintRun(s,p,quantity,initial=false){
  if(!p.printStock||p.status!=='released'||p.printStock.closed||s.week-p.releaseWeek>=85||!printRightsActive(s,p))throw new Error('This edition is not currently eligible for printing.');
  const q=Number(quantity),c=company(s,p.companyId),book=p.printStock;
  if(!Number.isInteger(q)||q<50||q>10000)throw new Error('Choose 50 to 10,000 physical copies.');
  const cost=money(q*book.unitCost),buffer=weeklyOverhead(c,s)*4;
  if(c.bankrupt||c.finance.cash<cost+buffer)throw new Error('Print order would use cash reserved for four weeks of studio overhead.');
  transact(s,c,'print-inventory-purchase',{cash:-cost,inventory:cost},(initial?'Opening print run: ':'Additional print run: ')+p.title,p.id);
  book.stock+=q;book.printed+=q;book.printSpend=money(book.printSpend+cost);book.lastOrderWeek=s.week;
  return {copies:q,cost,stock:book.stock};
}
function printRightsActive(s,p){
  if(!p.grantId)return true;
  return s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=s.week&&g.endWeek+(g.continuationWeeks||0)>s.week);
}
function orderPrintRun(s,projectId,quantity){
  const p=s.projects.find(p=>p.id===projectId);
  if(!p||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('You cannot fund an unrelated publisher.');
  if(!printRightsActive(s,p))throw new Error('Distribution license does not allow this print order.');
  return buyPrintRun(s,p,quantity);
}
function setPrintPolicy(s,projectId,enabled){
  const p=s.projects.find(p=>p.id===projectId);
  if(!p||!p.printStock||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('Printed edition is not managed by this company.');
  p.printStock.autoReprint=enabled===true;
  return p.printStock.autoReprint;
}
function autoReplenishPrint(s){
  for(const p of s.projects) {
    const b=p.printStock;if(!b||!b.autoReprint||b.closed||p.status!=='released')continue;
    const age=s.week-p.releaseWeek;
    if(age<0||age>=70||!printRightsActive(s,p))continue;
    // Replenish against OBSERVED reader demand, not an arbitrary perpetual
    // fixed stock target. Slow backlist works must not trap cash in reprints.
    const observed=b.demandEwma||0;
    if(observed<3||b.lastOrderWeek>=s.week)continue;
    const target=Math.min(1200,Math.max(100,Math.ceil(observed*4)));
    if(b.stock>=target*.55)continue;
    const c=company(s,p.companyId);if(!c||c.bankrupt)continue;
    const qty=Math.min(1000,Math.ceil(Math.max(100,target-b.stock)/50)*50);
    const affordable=Math.floor((c.finance.cash-weeklyOverhead(c,s)*4)/b.unitCost/50)*50;
    if(affordable<50){
      if(c.isPlayer&&b.stock===0&&age<20)alert(s,'print-stock-'+p.id,'Print edition out of stock',p.title+' cannot meet more orders until there is cash for another print run. Reprinting is delegated when affordable.','advisory');
      continue;
    }
    buyPrintRun(s,p,Math.min(10000,qty,affordable));
  }
}
function disposePrintStock(s,p,quantity){
  const b=p.printStock,c=company(s,p.companyId),q=Number(quantity);
  if(!b||!Number.isInteger(q)||q<1||q>b.stock)throw new Error('Cannot write off more copies than are in stock.');
  const value=money(q*b.unitCost);
  transact(s,c,'print-stock-writeoff',{inventory:-value,expense:value},'Unsold or damaged stock written off: '+p.title,p.id);
  b.stock-=q;b.writtenOff+=q;b.writeOffCost=money(b.writeOffCost+value);
  p.directCost=money(p.directCost+value);
  return {copies:q,expense:value,stock:b.stock};
}
function writeOffPrintStock(s,projectId,quantity){
  const p=s.projects.find(x=>x.id===projectId);
  if(!p||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('Cannot dispose stock owned by another firm.');
  return disposePrintStock(s,p,quantity);
}
function settlePrintReturns(s,p,units){
  const b=p.printStock,c=company(s,p.companyId),q=Math.min(units,b.sold-b.returned);
  if(q<1)return;
  const refund=money(q*b.price),cost=money(q*b.unitCost);
  const paid=money(Math.min(refund,Math.max(0,c.finance.cash)));
  // Returns reverse the original external sale and restore undamaged stock.
  // Distribution fees and previously paid contractual royalties are not
  // silently clawed back. Unpaid refunds become actual generic payables.
  transact(s,c,'print-retail-return',{cash:-paid,payable:money(refund-paid),inventory:cost,revenue:-refund,expense:-cost},
    q+' retail copies returned: '+p.title,p.id);
  b.stock+=q;b.returned+=q;b.cogs=money(b.cogs-cost);
  b.refunded=money((b.refunded||0)+refund);
  p.directRevenue=money(p.directRevenue-refund);p.directCost=money(p.directCost-cost);
  p.stats.totalSales=money(p.stats.totalSales-refund);p.stats.weeklySales=money(p.stats.weeklySales-refund);
}
function settlePrintLifecycle(s){
  for(const p of s.projects){
    const b=p.printStock;if(!b||p.status!=='released')continue;
    const fresh=p.stats.weeklyPrintUnits||0;
    if(fresh){
      const fractional=fresh*.0275+(b.returnFraction||0);
      const qty=Math.floor(fractional);
      b.returnFraction=fractional-qty;
      if(qty)b.returnQueue.push({dueWeek:s.week+4,units:qty});
      p.stats.weeklyPrintUnits=0;
    }
    const observedDemand=p.stats.weeklyPrintDemand||0;
    b.demandEwma=(b.demandEwma||0)*.65+observedDemand*.35;
    p.stats.weeklyPrintDemand=0;
    const remaining=[];
    for(const due of b.returnQueue){
      if(due.dueWeek<=s.week)settlePrintReturns(s,p,due.units);
      else remaining.push(due);
    }
    b.returnQueue=remaining;
    const age=s.week-p.releaseWeek;
    if(age>=104){
      if(b.stock)disposePrintStock(s,p,b.stock);
      b.closed=true;
    }else if(age>=0&&b.stock>0){
      // Small delegated storage expense, paid or accrued as an obligation.
      const c=company(s,p.companyId);
      const charge=money(b.stock*.012);
      if(charge>0){expense(s,c,charge,'warehouse','Print warehouse service: '+p.title,p.id);p.directCost=money(p.directCost+charge);}
    }
  }
}
function projectWork(s,p) {
  const c=company(s,p.companyId);if(!c||c.bankrupt)return;
  if(p.route==='adaptation'){
    const permission=canUseIp(s,c,p.ipId,p.sector,s.week);
    if(!permission.ok){ if(c.isPlayer)alert(s,'blocked-'+p.id,'Production rights problem',p.title+': '+permission.reason+' Project has been paused.','critical');return;}
  }
  const team=c.teams?.find(t=>t.id===p.teamId);
  // Work is automatically delegated to one finite team. Specialization and accumulated
  // skill shorten elapsed time; the same budget is consumed over units of progress.
  const expertise=businessTechnology(s,c.id,p.sector);
  const partnerDeal=p.coProductionId?s.coProductions.find(d=>d.id===p.coProductionId):null;
  const partnerTeam=partnerDeal?company(s,partnerDeal.sponsorId)?.teams?.find(t=>t.id===partnerDeal.partnerTeamId):null;
  const partnerSpeed=partnerTeam?clamp((partnerTeam.skill-45)*.003,.03,.18):0;
  const specialist=s.specialists?.find(x=>x.id===p.specialistId&&x.assignedProjectId===p.id);
  const specialistSpeed=specialist?.discipline==='production'?clamp((specialist.skill-40)*.003,.035,.13):0;
  const leader=team?(s.employees||[]).find(e=>e.id===team.leaderId&&e.status==='employed'):null;
  const leadershipSpeed=leader?clamp((leader.skill-60)*.001+(leader.morale-65)*.0008,-.055,.07):-.07;
  const speed=team?clamp(1+leadershipSpeed+Math.max(0,team.skill-50)*.004+(team.specialty===p.genre?.12:0)+expertise.effectiveness+expertise.researchBonus+partnerSpeed+specialistSpeed,1,1.68):1;
  const nextProgress=Math.min(p.weeksTotal,money(p.weeksDone+speed));
  const work=money(p.budget*(nextProgress-p.weeksDone)/p.weeksTotal*(p.budgetMultiplier??1)+(p.weeksDone===0?p.marketingBudget:0));
  let sponsorPaid=0;
  if(p.coProductionId){
    const deal=s.coProductions.find(d=>d.id===p.coProductionId),sponsor=deal&&company(s,deal.sponsorId);
    if(!deal||!sponsor||deal.status!=='active')throw new Error('Active co-production capital agreement missing.');
    sponsorPaid=money(Math.min(deal.held,work*deal.capitalFraction));
    if(sponsorPaid>0){transact(s,sponsor,'cofinance-work-spend',{prepaid:-sponsorPaid,expense:sponsorPaid},'Sponsored share of production cost: '+p.title,p.id);
      deal.held=money(deal.held-sponsorPaid);deal.spent=money(deal.spent+sponsorPaid);p.partnerSpend=money((p.partnerSpend||0)+sponsorPaid);}
  }
  expense(s,c,money(work-sponsorPaid),'development','Development & marketing for '+p.title,p.id);p.directCost=money(p.directCost+work);p.productionSpend=money((p.productionSpend??0)+work);p.periodProductionSpend=money((p.periodProductionSpend||0)+work);
  p.weeksDone=nextProgress;
  // Occasional deterministic cinema setbacks cost real funds and time. Routine repairs
  // are delegated; material budget alerts still use the existing threshold checks.
  if(p.sector==='movie'&&p.cinema&&p.weeksDone>=p.weeksTotal*.35&&p.weeksDone<p.weeksTotal*.8&&
    !p.cinema.disruptions?.length&&(hash(s.seed+':film-setback:'+p.id)%8===0)){
    const cost=money(p.budget*.035);expense(s,c,cost,'film-disruption','Unexpected production logistics and recovery: '+p.title,p.id);
    p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
    p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);p.weeksTotal+=2;
    p.cinema.disruptions=[{week:s.week,cost,delay:2,kind:'logistics'}];
    if(c.isPlayer)news(s,'Film setback: '+p.title,'The team automatically handled a two-week logistics delay and paid recovery costs; no mandatory scene management.','production');
  }
  if(p.phaseHistory?.length){const ratio=p.weeksDone/p.weeksTotal;
    const phase=ratio>=1?(p.holdUntilWeek&&s.week<p.holdUntilWeek?'polish':'released'):ratio>=.80?'polish':ratio>=.35?'production':'concept';
    if(p.phase!==phase){p.phase=phase;p.phaseHistory.push({week:s.week,phase});}
  }
  if(p.sector==='games'&&p.videoGame){gameMilestone(s,p);}
  if(p.sector==='movie'&&p.cinema?.delayWeeks>0){
    p.weeksTotal+=p.cinema.delayWeeks;p.cinema.delayWeeks=0;
  }
  if(p.route==='contract' &&p.escrowId)releaseClientMilestone(s,p);
  const costView=projectBudget(s,p.id);
  if(c.isPlayer&&p.major&&!p.budgetAlerted&&p.weeksDone>=p.weeksTotal*.4&&costView.projectedVariance>costView.plannedTotal*.08){
    p.budgetAlerted=true;alert(s,'budget-'+p.id,'Production cost above plan',p.title+' is projected to spend '+shortMoney(costView.projectedVariance)+' above its approved budget. The team will continue within delegated authority; review if liquidity becomes tight.','advisory');
  }
  if(team){team.workWeeks++;team.skill=Math.min(88,team.skill+(team.workWeeks%28===0?1:0));}
  if(partnerTeam){partnerTeam.workWeeks++;partnerTeam.skill=Math.min(88,partnerTeam.skill+(partnerTeam.workWeeks%28===0?1:0));}
  if(p.weeksDone>=p.weeksTotal){
    // A failed certification attempt cannot silently fall back to every region.
    // Keep the live production available for optional funded QA and re-certification.
    if(p.sector==='games'&&p.videoGame?.certification?.failures?.length&&!p.videoGame.certification.regions.length)return;
    if(p.holdUntilWeek!==null&&s.week<p.holdUntilWeek)return; // funded team remains occupied until deliberately chosen launch; no premature consumer sales.
    if(p.phaseHistory?.length&&p.phase!=='released'){p.phase='released';p.phaseHistory.push({week:s.week,phase:'released'});}
    if((p.sector==='movie'&&p.cinema?.castActorId)||(p.sector==='tv'&&p.television?.castActorId)){const actor=(s.filmActors||[]).find(a=>a.id===(p.cinema?.castActorId||p.television?.castActorId));if(actor?.busyProjectId===p.id)actor.busyProjectId=null;}
    recordCreatorCredit(s,p,c,team);
    releaseProjectSpecialist(s,p,true);
    p.status='released';p.releaseWeek=s.week;
    if(p.sector==='games'&&p.videoGame){p.videoGame.launchUserRating=p.videoGame.userRating??null;p.videoGame.launchCriticRating=p.videoGame.criticRating??null;}
    if(Number.isFinite(p.creativeQuality)&&Number.isFinite(p.technicalQuality)){
      p.criticScore=Math.round(clamp(p.creativeQuality*.73+p.technicalQuality*.27+(p.pitch?.direction==='experimental'?4:0),1,100));
      p.audienceScore=Math.round(clamp(p.creativeQuality*.37+p.technicalQuality*.63+(p.pitch?.positioning==='broad'?2:p.pitch?.positioning==='niche'?-3:0),1,100));
      if(p.sector==='games'&&p.videoGame){p.criticScore=p.videoGame.criticRating;p.audienceScore=p.videoGame.userRating;}
    }
    if(p.sector==='games'&&p.videoGame)gameAtRelease(s,p);
    if(p.coProductionId)refundPartnerReserve(s,p,'released');
    if(p.route==='contract') {if(p.escrowId)deliverClientFee(s,p);else finalizeContract(s,c,p.earnedFee,p.advance,p.id);p.directRevenue=money(p.directRevenue+p.earnedFee);}
    else {initPrintEdition(s,p);const work={id:id(s,'work'),title:p.title,ipId:p.ipId,projectId:p.id,sector:p.sector,ownerId:c.id,releaseWeek:s.week};s.works.push(work);const ip=s.ips.find(x=>x.id===p.ipId);if(ip)ip.works.push(work.id);}
    if(team){const leader=s.employees?.find(e=>e.id===team.leaderId&&e.status==='employed');
      if(leader){leader.completed++;leader.morale=clamp(leader.morale+(p.quality>=65?2:-1),10,100);leader.history.push({week:s.week,kind:'release',companyId:c.id,teamId:team.id,projectId:p.id,quality:p.quality});if(leader.history.length>40)leader.history.shift();}
      if(c.isPlayer&&s.founder){s.founder.experience=(s.founder.experience||0)+1;s.founder.lastReleaseWeek=s.week;}
      team.completed++;if(!Array.isArray(team.performanceHistory))team.performanceHistory=[];team.performanceHistory.push({projectId:p.id,week:s.week,quality:p.quality,sector:p.sector,genre:p.genre});if(team.performanceHistory.length>24)team.performanceHistory.shift();}
    c.reputation=Math.round(clamp(c.reputation+(p.quality-55)/20,4,98));
    if(c.isPlayer){news(s,p.title+' released',p.route==='contract'?'Commissioned work delivered; full fee recognized.':p.genre+' '+p.format+' enters the '+SECTORS[p.sector].name+' market.','release'); }
    else if(rand(s)<.2)news(s,c.name+' releases '+p.title,'A competing '+p.genre.toLowerCase()+' '+SECTORS[p.sector].name.toLowerCase()+' title enters the market.','competitor');
  }
}
function capabilityCost(sector,mode){return mode==='partner'?({movie:8500,tv:7500,games:8500}[sector]||3000):({movie:43000,tv:34000,games:38000}[sector]||20000);}
function enterSector(s,sector,mode='partner') {
  requireExecutiveControl(s);const c=player(s);if(!SECTORS[sector])throw new Error('Unknown industry.');
  if(!available(sector,s.week))throw new Error('Worldwide '+SECTORS[sector].name+' production opens in Year '+SECTORS[sector].year+'.');
  if(c.capabilities[sector])throw new Error('This company already has access to that industry.');
  if(!['internal','partner'].includes(mode))throw new Error('Invalid entry method.');
  const price=money(capabilityCost(sector,mode)*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);if(c.finance.cash<price+4000)throw new Error('Insufficient cash and operating buffer to enter this industry.');
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
function liquidityForecast(s,companyId=s.playerId,horizon=13){
  const c=company(s,companyId);
  if(!c)throw new Error('Unknown company for cash planning.');
  const weeks=clamp(Math.round(Number(horizon)||13),1,52);
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
    const schedule=Math.max(1,Math.ceil((p.weeksTotal-p.weeksDone)/1.1));
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
        const interest=money(loan.principalOutstanding*loan.interestRate*accruedWeeks/52);
        loan.installmentsDue=Math.min(24,loan.installmentsDue+1);
        const scheduled=loan.installmentsDue===24?loan.originalPrincipal:money(loan.originalPrincipal*loan.installmentsDue/24);
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
    firstShortfallWeek,lowestCash:money(lowestCash),cashAt4:timeline[Math.min(weeks,4)-1].endingCash,
    endingCash:cash,weeklyOverhead:overhead,totalKnownReceipts,totalProduction,totalLoanService,totalScheduledBills,
    status:firstShortfallWeek===null?'covered':firstShortfallWeek<=4?'critical':'watch',
    assumesNoNewSales:true,assumesNoNewCredit:true,timeline};
}

function loanLimit(s,companyId=s.playerId){
  const c=company(s,companyId);if(!c||c.bankrupt)return 0;
  if(s.loans.some(l=>l.debtorId===c.id&&(l.principalOutstanding>0||l.interestArrears>0)))return 0;
  if(c.finance.cash<weeklyOverhead(c,s)*4)return 0;
  const backing=Math.max(0,c.finance.cash)*.60+Math.max(0,c.finance.revenue)*.16;
  return money(Math.min(180000,Math.max(12000,Math.floor(backing/1000)*1000)));
}
function borrowLoan(s,amount,companyId=s.playerId){
  requireExecutiveControl(s);const c=company(s,companyId),limit=loanLimit(s,companyId),principal=money(Number(amount));
  if(!c||!Number.isFinite(Number(amount))||!Number.isFinite(principal)||principal<5000||principal>limit)
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
  news(s,c.name+' secures working capital',c.name+' borrowed '+shortMoney(principal)+' at '+Math.round(rate*100)+'% annual interest, repayable across 24 monthly closes.','company');
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
    const interest=money(loan.principalOutstanding*loan.interestRate*weeks/52);
    if(interest>0){
      const paid=money(Math.min(interest,Math.max(0,f.cash)));
      expense(s,c,interest,'loan-interest','Monthly external loan interest');
      const unpaid=money(interest-paid);
      loan.interestCharged=money(loan.interestCharged+interest);
      loan.interestPaid=money(loan.interestPaid+paid);
      loan.interestArrears=money(loan.interestArrears+unpaid);
      f.interestPayable=money(f.interestPayable+unpaid);
    }
    loan.installmentsDue=Math.min(24,loan.installmentsDue+1);
    // Cumulative scheduled principal prevents rounding drift; unpaid installments
    // remain part of loan principal and cannot be written off automatically.
    const scheduled=loan.installmentsDue===24?loan.originalPrincipal:
      money(loan.originalPrincipal*loan.installmentsDue/24);
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
      if(loan.missedPeriods>=2&&c.id===s.playerId)alert(s,'overdue-bank-'+loan.id,'Bank debt overdue',
        'Scheduled loan payments remain due. Cash and unpaid interest are shown in Financials; review new spending before committing to projects.','critical');
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
  if(payment>money(Math.max(0,c.finance.cash-weeklyOverhead(c,s)*2)))
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
  const scheduled=loan.installmentsDue===24?loan.originalPrincipal:money(loan.originalPrincipal*loan.installmentsDue/24);
  loan.principalArrears=money(Math.max(0,scheduled-loan.principalPaid));
  if(loan.principalOutstanding===0&&loan.interestArrears===0)loan.status='paid';
  else loan.status=loan.principalArrears||loan.interestArrears?'delinquent':'current';
  if(loan.status!=='delinquent')loan.missedPeriods=0;
  if(c.isPlayer)news(s,'Bank repayment posted',shortMoney(payment)+' paid against '+c.name+' bank debt. Principal and old interest settled without reducing earnings again.','finance');
  return {loanId:loan.id,interestPaid:interest,principalPaid:principal,remainingPrincipal:loan.principalOutstanding,status:loan.status};
}
// Creating a new company is NOT purchasing an old firm's IP, shares or
// liabilities. The founding company legally owns 100% of new subsidiary equity.
// Cash decreases at the parent and increases at the child; the offset is a
// parent investment asset, not a made-up sale or production profit.
function foundSubsidiary(s,data={}){
  requireExecutiveControl(s);const owner=player(s),sector=String(data.sector||'publishing'),capital=money(Number(data.capital));
  if(!SECTORS[sector]||!available(sector,s.week))throw new Error('That industry has not debuted globally.');
  if(s.companies.filter(c=>c.parentId===owner.id).length>=5)throw new Error('Maximum five managed subsidiaries in this prototype.');
  if(!Number.isFinite(capital)||capital<SECTORS[sector].cost*1.75)throw new Error('Startup capital below sector operating requirements.');
  if(owner.finance.cash<capital+18000)throw new Error('Insufficient parent cash after required operating reserve.');
  const name=String(data.name||'').trim().slice(0,42);
  if(name.length<3||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct studio name of at least three characters.');
  boardMandate(s,'expansion',capital);
  const child=createCompany(s,{name,sector,cash:capital,capacity:1,foundYear:yearAt(s.week),foundedYear:yearAt(s.week),parentId:owner.id,reputation:22,homeRegion:owner.homeRegion});
  boardMandate(s,'expansion',capital,true);
  transact(s,owner,'subsidiary-equity-contribution',{cash:-capital,investment:capital},'Capital invested in wholly owned new studio '+name);
  if(owner.corporate)governanceEvent(s,owner,'subsidiary-founded',{subsidiaryId:child.id,capital,sector});
  news(s,'New subsidiary founded: '+name,owner.name+' invested '+shortMoney(capital)+' in a newly established '+SECTORS[sector].name+' studio; existing rival assets and IP remain unchanged.','company');
  return child;
}
// Subsidiaries are separate legal entities. This prototype supports formation
// of wholly owned NEW companies only; acquisitions and outside shareholders
// must wait for their separately validated ownership logic.
function controlledCompanies(s,rootId=s.playerId){
  const root=company(s,rootId);if(!root||root.parentId)throw new Error('Choose a root company you control.');
  return [root,...s.companies.filter(c=>c.parentId===root.id)];
}
// Book a real intra-group charge for shared corporate services that the parent
// has already funded. This cannot be used to mint new money or consumer sales.
function chargeSharedServices(s,childId,amount){
  const child=company(s,childId);if(!child||!child.parentId)throw new Error('Only a wholly-owned subsidiary may receive parent services.');
  const parent=company(s,child.parentId);amount=money(Number(amount));
  if(!parent||child.bankrupt||parent.bankrupt||!Number.isFinite(amount)||amount<=0)throw new Error('Invalid shared-service participants or amount.');
  if(amount>(parent.finance.overheadBooked||0)-(parent.finance.internalRevenue||0)+EPS)throw new Error('Service charge exceeds documented shared costs.');
  if(child.finance.cash<amount+2000)throw new Error('Subsidiary cannot fund this internal charge.');
  transact(s,child,'internal-service-expense',{cash:-amount,expense:amount},'Shared services provided by '+parent.name);
  transact(s,parent,'internal-service-revenue',{cash:amount,revenue:amount},'Shared services provided to '+child.name);
  child.finance.internalExpense=money((child.finance.internalExpense||0)+amount);
  parent.finance.internalRevenue=money((parent.finance.internalRevenue||0)+amount);
  return amount;
}
// Share capital invested in a subsidiary is an ASSET of the parent and equity
// of the subsidiary, but must disappear in a consolidated balance sheet.
// Linked intragroup service charges likewise must cancel out in group revenue
// and costs; only cash received from external customers creates group sales.
function consolidatedStatements(s,rootId=s.playerId){
  const members=controlledCompanies(s,rootId),root=members[0],f=members.map(c=>c.finance);
  const sum=key=>money(f.reduce((v,x)=>v+(x[key]||0),0));
  const internalRevenue=sum('internalRevenue'),internalExpense=sum('internalExpense');
  const consolidatedRevenue=money(sum('revenue')-internalRevenue);
  const consolidatedExpenses=money(sum('expense')-internalExpense);
  const net=money(consolidatedRevenue-consolidatedExpenses);
  const cash=sum('cash'),receivable=sum('receivable'),prepaid=sum('prepaid'),inventory=sum('inventory');
  const liabilities=money(sum('payable')+sum('deferred')+sum('loanBalance'));
  const assets=money(cash+receivable+prepaid+inventory); // eliminate all wholly owned equity investment assets
  const parentCapital=root.finance.equity;
  const equity=money(parentCapital+net);
  return {rootId,members:members.map(c=>({id:c.id,name:c.name,parentId:c.parentId,sector:c.sector,bankrupt:c.bankrupt})),
    income:{revenue:consolidatedRevenue,expenses:consolidatedExpenses,net,internalRevenueEliminated:internalRevenue,internalExpenseEliminated:internalExpense},
    balance:{cash,receivable,prepaid,inventory,loanBalance:sum('loanBalance'),assets,liabilities,parentCapital,retainedEarnings:net,equity,investmentEliminated:sum('investment'),subsidiaryCapitalEliminated:money(members.slice(1).reduce((n,c)=>n+(c.investedCapital||0),0)),difference:money(assets-liabilities-equity)}
  };
}
function hireTeam(s,specialty='Fantasy') {requireExecutiveControl(s);const c=player(s),cost=money(7200*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);if(!GENRES.includes(specialty))throw new Error('Choose a valid team specialization.');if(c.finance.cash<cost+4500)throw new Error('Insufficient funds to hire another project team.');expense(s,c,cost,'recruitment','Expand project team');c.capacity++;c.teamLevel++;const team=newTeam(s,c,c.teams.length,specialty);c.teams.push(team);news(s,'Studio capacity expanded',team.name+' specializes in '+specialty+'. Another project can now run concurrently; recurring weekly payroll rises.','company');return team;}
// Rights agreements: real bilateral funding, with counteroffers before any
// contract or cash movement. An AI's willingness depends on its own liquidity;
// it cannot be forced to accept an expensive option or renewal.
function rightsTerms(input={},medium='movie',week=0){
  if(!Number.isFinite(Number(input.fee??1800))||!Number.isFinite(Number(input.exerciseFee??2400)))throw new Error('Option fees must be finite amounts.');
  const fee=money(Number(input.fee??1800));
  const exerciseFee=money(Number(input.exerciseFee??2400));
  const royaltyRate=Number(input.royaltyRate??.12);
  const optionWeeks=Number(input.optionWeeks??Math.max(104,((SECTORS[medium].year-1)*52-week)+52));
  const continuationWeeks=Number(input.continuationWeeks??0);
  if(!Number.isFinite(fee)||fee<100||fee>1000000||!Number.isFinite(exerciseFee)||exerciseFee<0||exerciseFee>1000000||
    !Number.isFinite(royaltyRate)||royaltyRate<0||royaltyRate>.40||!Number.isInteger(optionWeeks)||optionWeeks<26||optionWeeks>1040||
    !Number.isInteger(continuationWeeks)||continuationWeeks<0||continuationWeeks>104)
    throw new Error('Option terms exceed permitted fees, royalties, or dates.');
  return {fee,exerciseFee,royaltyRate,optionWeeks,continuationWeeks,approvalRequired:input.approvalRequired===true||input.approvalRequired==='true'};
}
function validateOptionParties(s,ipId,medium,licenseeId){
  const owner=player(s),ip=s.ips.find(x=>x.id===ipId),other=company(s,licenseeId);
  if(!ip||ip.ownerId!==owner.id)throw new Error('Only owned underlying IP may be optioned.');
  if(!SECTORS[medium]||medium==='publishing')throw new Error('Choose a film, TV or game medium.');
  if(!other||other.id===owner.id||other.bankrupt||other.parentId===owner.id)throw new Error('Choose a valid independent counterparty.');
  if(s.grants.some(g=>g.ipId===ipId&&g.media===medium&&g.exclusive&&g.endWeek>s.week))throw new Error('Exclusive rights already reserved in this medium.');
  return {owner,ip,other};
}
function createOption(s,ipId,medium,licenseeId,input={}){
  requireExecutiveControl(s);const {owner,ip,other}=validateOptionParties(s,ipId,medium,licenseeId);
  const terms=rightsTerms(input,medium,s.week),fee=terms.fee;
  if(other.finance.cash<fee+6000)throw new Error('Counterparty lacks the funds for this option.');
  // One real outside payment; fee is not deferred or replicated in later sales.
  expense(s,other,fee,'rights-option','Exclusive option fee: '+ip.name);
  revenue(s,owner,fee,'rights-option','Option fee: '+ip.name);
  ip.rightsIncome=money((ip.rightsIncome||0)+fee);
  const right={id:id(s,'grant'),ipId,grantorId:owner.id,holderId:other.id,media:medium,
    territory:'Worldwide',type:'option',startWeek:s.week,endWeek:s.week+terms.optionWeeks,
    optionExpiresWeek:s.week+terms.optionWeeks,exercisedWeek:null,exerciseFee:terms.exerciseFee,
    exerciseFeePaid:0,renewalHistory:[],approvalRequired:terms.approvalRequired,
    exclusive:true,allowsProduction:false,fee,royaltyRate:terms.royaltyRate,recoupableAdvance:0,
    royaltyHistoryComplete:true,continuationWeeks:terms.continuationWeeks};
  s.grants.push(right);
  news(s,'Rights option signed: '+ip.name,other.name+' secured a '+terms.optionWeeks+'-week exclusive '+SECTORS[medium].name+' option. No production before exercise.','deal');
  return right;
}
function optionWillingness(holder,terms){
  return !holder.bankrupt&&holder.finance.cash>=terms.fee+6000&&
    terms.fee<=Math.min(4500,Math.max(2100,money(holder.finance.cash*.015)))&&terms.royaltyRate<=.20;
}
function offerRights(s,ipId,medium,licenseeId,terms={}){
  requireExecutiveControl(s);const {owner,other}=validateOptionParties(s,ipId,medium,licenseeId);
  const proposed=rightsTerms(terms,medium,s.week);
  const accepted=optionWillingness(other,proposed);
  const row={id:id(s,'rightsoffer'),kind:'option',ipId,grantId:null,grantorId:owner.id,
    holderId:other.id,media:medium,createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',
    proposal:proposed,counter:accepted?null:rightsTerms({fee:1800,exerciseFee:proposed.exerciseFee,
      royaltyRate:Math.min(proposed.royaltyRate,.12),optionWeeks:proposed.optionWeeks,
      continuationWeeks:proposed.continuationWeeks,approvalRequired:proposed.approvalRequired},medium,s.week)};
  if(accepted)row.grantId=createOption(s,ipId,medium,licenseeId,proposed).id;
  s.rightsOffers.push(row);
  return row;
}
function fulfillRenewal(s,grant,terms){
  if(grant.endWeek<=s.week)throw new Error('Expired contract must be renegotiated as a new grant.');
  const owner=company(s,grant.grantorId),holder=company(s,grant.holderId),ip=s.ips.find(x=>x.id===grant.ipId);
  if(!owner||!holder||!ip||ip.ownerId!==owner.id||holder.bankrupt||holder.finance.cash<terms.fee+6000)
    throw new Error('Renewal parties or funding are unavailable.');
  const proposedEnd=grant.endWeek+terms.extensionWeeks;
  if(s.grants.some(g=>g.id!==grant.id&&g.ipId===grant.ipId&&g.media===grant.media&&
    (g.exclusive||grant.exclusive)&&grant.startWeek<g.endWeek&&g.startWeek<proposedEnd))
    throw new Error('Renewal would overlap another exclusive contract.');
  expense(s,holder,terms.fee,'rights-renewal','Mutually agreed rights renewal');
  revenue(s,owner,terms.fee,'rights-renewal','Rights renewal income');
  ip.rightsIncome=money((ip.rightsIncome||0)+terms.fee);
  grant.endWeek=proposedEnd;
  if(grant.type==='option')grant.optionExpiresWeek=proposedEnd;
  news(s,'Rights renewed: '+ip.name,owner.name+' and '+holder.name+' agreed to extend '+SECTORS[grant.media].name+' rights.','deal');
}
function renewalTerms(input={}){
  if(!Number.isFinite(Number(input.fee??1300)))throw new Error('Renewal fee must be finite.');
  const fee=money(Number(input.fee??1300)),extensionWeeks=Number(input.extensionWeeks??52);
  if(!Number.isFinite(fee)||fee<100||fee>1000000||!Number.isInteger(extensionWeeks)||extensionWeeks<26||extensionWeeks>208)
    throw new Error('Renewal terms are outside permitted limits.');
  return {fee,extensionWeeks};
}
function offerRenewal(s,grantId,input={}){
  const grant=s.grants.find(g=>g.id===grantId);
  if(!grant||grant.grantorId!==s.playerId||grant.endWeek<=s.week)throw new Error('Only valid, unexpired owned rights may be offered for renewal.');
  const holder=company(s,grant.holderId),proposed=renewalTerms(input);
  if(!holder||holder.bankrupt)throw new Error('Holder is no longer available to consent.');
  const accepted=holder.finance.cash>=proposed.fee+6000&&
    proposed.fee<=Math.min(3500,Math.max(1600,money(holder.finance.cash*.01)));
  const row={id:id(s,'rightsoffer'),kind:'renewal',ipId:grant.ipId,grantId,
    grantorId:grant.grantorId,holderId:grant.holderId,media:grant.media,
    createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',proposal:proposed,
    counter:accepted?null:renewalTerms({fee:1300,extensionWeeks:Math.min(52,proposed.extensionWeeks)})};
  if(accepted){fulfillRenewal(s,grant,proposed);grant.renewalHistory.push(row.id);}
  s.rightsOffers.push(row);return row;
}
function answerRightsOffer(s,offerId,accept){
  const row=s.rightsOffers.find(x=>x.id===offerId);
  if(!row||row.status!=='counter'||row.grantorId!==s.playerId)throw new Error('Only pending owner counteroffers may be decided.');
  if(accept!==true&&accept!==false)throw new Error('Choose to accept or decline.');
  if(!accept){row.status='declined';row.updatedWeek=s.week;return row;}
  if(row.kind==='option'){
    // Re-check rights conflicts and the actual debtor cash at signature time.
    const parties=validateOptionParties(s,row.ipId,row.media,row.holderId);
    if(!optionWillingness(parties.other,row.counter))throw new Error('Counterparty cannot honor these terms.');
    row.grantId=createOption(s,row.ipId,row.media,row.holderId,row.counter).id;
  }else{
    const g=s.grants.find(g=>g.id===row.grantId),holder=company(s,row.holderId);
    if(!g||g.grantorId!==s.playerId||!holder||holder.finance.cash<row.counter.fee+6000)
      throw new Error('Renewal is no longer legally or financially available.');
    fulfillRenewal(s,g,row.counter);g.renewalHistory.push(row.id);
  }
  row.status='accepted';row.updatedWeek=s.week;
  return row;
}
// Delegation is opt-in: small contracts only, and the other company must
// independently accept. Larger, contested or unbudgeted deals escalate.
function configureRightsAuthority(s,policy={}){
  const maxFee=money(Number(policy.maxFee??s.rightsPolicy.maxFee));
  const extensionWeeks=Number(policy.extensionWeeks??s.rightsPolicy.extensionWeeks);
  if(typeof policy.autoRenew!=='boolean'||!Number.isFinite(Number(policy.maxFee??s.rightsPolicy.maxFee))||
     maxFee<100||maxFee>2000||![26,52].includes(extensionWeeks))
    throw new Error('Delegated renewals require a valid opt-in and minor-deal limits.');
  s.rightsPolicy={autoRenew:policy.autoRenew,maxFee,extensionWeeks};
  return s.rightsPolicy;
}
function delegateRightsRenewals(s){
  if(!s.rightsPolicy?.autoRenew)return;
  for(const g of s.grants)if(g.grantorId===s.playerId&&g.endWeek>s.week&&g.endWeek-s.week<=4&&
    g.renewalAutoAttemptedEnd!==g.endWeek){
    const currentEnd=g.endWeek;
    g.renewalAutoAttemptedEnd=currentEnd;
    try{
      const offer=offerRenewal(s,g.id,{fee:s.rightsPolicy.maxFee,extensionWeeks:s.rightsPolicy.extensionWeeks});
      if(offer.status==='counter')alert(s,'rights-counter-'+offer.id,'Rights renewal counteroffer',
        'A licensee countered the routine renewal. Review the Library; the manager cannot force its consent.','critical');
    }catch(e){alert(s,'rights-delegation-'+g.id+'-'+currentEnd,'Rights renewal needs review',
      'An automatic renewal did not complete: '+e.message,'critical');}
  }
}
function exerciseOption(s,g){
  if(g.type!=='option'||g.endWeek<=s.week||!available(g.media,s.week))return false;
  const c=company(s,g.holderId),owner=company(s,g.grantorId),fee=money(g.exerciseFee??2400);
  if(!c||!owner||c.bankrupt||c.finance.cash<fee+1900)return false;
  expense(s,c,fee,'rights-license','Exercise '+g.media+' rights option');
  revenue(s,owner,fee,'rights-license','Option exercised for '+g.media);
  const sourceIp=s.ips.find(i=>i.id===g.ipId);if(sourceIp)sourceIp.rightsIncome=money((sourceIp.rightsIncome||0)+fee);
  g.optionExpiresWeek=g.endWeek;g.exercisedWeek=s.week;g.exerciseFeePaid=fee;
  g.type='license';g.startWeek=s.week;g.endWeek=s.week+156;g.allowsProduction=true;
  news(s,'Adaptation rights exercised',c.name+' licensed '+SECTORS[g.media].name+' production rights in '+(sourceIp?.name||'an IP')+'.','deal');return true;
}
function exerciseLicensedOption(s,grantId){const g=s.grants.find(x=>x.id===grantId);return !!g&&exerciseOption(s,g);}
function requestCreativeApproval(s,grantId,{title='Untitled adaptation',genre='Fantasy'}={}){
  const g=s.grants.find(g=>g.id===grantId);
  if(!g||g.type!=='license'||!g.approvalRequired||g.endWeek<=s.week||!g.allowsProduction)
    throw new Error('This grant has no active binding creative approval clause.');
  title=String(title).trim().slice(0,62);if(!title||!GENRES.includes(genre))throw new Error('Valid title and genre required for approval.');
  const row={id:id(s,'pitchapproval'),grantId:g.id,grantorId:g.grantorId,holderId:g.holderId,
    title,genre,status:'pending',requestedWeek:s.week,decidedWeek:null,decidedBy:null};
  s.creativeApprovals.push(row);
  if(g.grantorId===s.playerId)alert(s,'approval-'+row.id,'Creative approval requested',
    company(s,g.holderId).name+' seeks approval for '+title+' ('+genre+'). Review the Library before production can start.','critical');
  return row;
}
function decideCreativeApproval(s,approvalId,allow){
  const row=s.creativeApprovals.find(x=>x.id===approvalId);
  if(!row||row.status!=='pending'||row.grantorId!==s.playerId||typeof allow!=='boolean')
    throw new Error('Only the contracted rights holder may accept or veto this proposal.');
  row.status=allow?'approved':'rejected';row.decidedBy=s.playerId;row.decidedWeek=s.week;
  const notice=s.inbox.find(a=>a.key==='approval-'+row.id);if(notice)notice.open=false;
  return row;
}
// One account per licensed production; amounts are exact contracted royalties,
// not extra consumer sales. Recoupment may offset only paid, explicitly agreed
// option consideration; by default all royalty rates are nonrecoupable.
function royaltyAccount(s,p,g){
  let account=s.royaltyAccounts.find(a=>a.grantId===g.id&&a.projectId===p.id);
  if(!account){account={id:id(s,'royaltyaccount'),grantId:g.id,projectId:p.id,
    debtorId:p.companyId,creditorId:g.grantorId,createdWeek:s.week,updatedWeek:s.week,
    openingOutstanding:0,salesBase:0,accrued:0,recouped:0,paid:0,outstanding:0,
    historyComplete:g.royaltyHistoryComplete===true};s.royaltyAccounts.push(account);}
  return account;
}
function settleRoyalty(s,p,g,royalty,gross){
  const payer=company(s,p.companyId),recipient=company(s,g.grantorId);
  if(!payer||!recipient||payer.id===recipient.id)return;
  royalty=money(royalty);if(!royalty)return;
  const account=royaltyAccount(s,p,g);
  const available=money(Math.max(0,(g.recoupableAdvance||0)-s.royaltyAccounts.filter(a=>a.grantId===g.id).reduce((n,a)=>n+a.recouped,0)));
  const recouped=money(Math.min(royalty,available)),due=money(royalty-recouped);
  const paid=money(Math.min(due,Math.max(0,payer.finance.cash)));
  // All cash/expense recognition continues through the existing legal-company
  // journal; an offset is not new cash or another income event.
  if(due)expense(s,payer,due,'royalty','Adaptation royalty due',p.id);
  if(paid>0){revenue(s,recipient,paid,'royalty','Adaptation royalty received',p.id);
    const ip=s.ips.find(i=>i.id===p.ipId);if(ip)ip.rightsIncome=money((ip.rightsIncome||0)+paid);
    if(g.agentRate>0){const cut=money(paid*g.agentRate);if(cut){expense(s,recipient,cut,'author-agency','Representing agent commission: '+p.title,p.id);g.agentFeesPaid=money((g.agentFeesPaid||0)+cut);}}}
  account.salesBase=money(account.salesBase+(gross||0));
  account.accrued=money(account.accrued+royalty);
  account.recouped=money(account.recouped+recouped);
  account.paid=money(account.paid+paid);
  account.outstanding=money(account.outstanding+due-paid);
  account.updatedWeek=s.week;
  if(paid<due)s.obligations.push({id:id(s,'obligation'),debtorId:payer.id,creditorId:recipient.id,
    projectId:p.id,grantId:g.id,accountId:account.id,kind:'royalty',amount:money(due-paid),createdWeek:s.week});
  p.royaltyCost=money(p.royaltyCost+due);
}
// Read-only account statements by legal debtor; pre-migration activity is
// marked incomplete instead of reconstructed from compacted cash journals.
function royaltyStatements(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for royalty statements.');
  const accounts=s.royaltyAccounts.filter(a=>a.debtorId===companyId).map(a=>{
    const grant=s.grants.find(g=>g.id===a.grantId),project=s.projects.find(p=>p.id===a.projectId);
    return {...a,grantMedia:grant?.media||null,sourceTitle:s.ips.find(ip=>ip.id===grant?.ipId)?.name||'Unknown source',
      projectTitle:project?.title||'Unknown production',rate:grant?.royaltyRate||0};
  });
  const sum=k=>money(accounts.reduce((n,a)=>n+(a[k]||0),0));
  const due=outstandingRoyaltyDebt(s,companyId),outstanding=sum('outstanding');
  // Receipts due TO a rights owner are external counterparties' claims,
  // not an invented booked asset or the owner's second consumer sale.
  const receivableAccounts=s.royaltyAccounts.filter(a=>a.creditorId===companyId).map(a=>{
    const grant=s.grants.find(g=>g.id===a.grantId),project=s.projects.find(p=>p.id===a.projectId);
    return {...a,sourceTitle:s.ips.find(ip=>ip.id===grant?.ipId)?.name||'Unknown source',
      projectTitle:project?.title||'Unknown production',debtorName:company(s,a.debtorId)?.name||'Unknown licensee'};
  });
  const ownerSum=k=>money(receivableAccounts.reduce((n,a)=>n+(a[k]||0),0));
  return {companyId,accounts,receivableAccounts,
    creditorTotals:{paid:ownerSum('paid'),unpaid:ownerSum('outstanding'),recouped:ownerSum('recouped'),
      historyComplete:receivableAccounts.every(a=>a.historyComplete)},
    totals:{salesBase:sum('salesBase'),accrued:sum('accrued'),recouped:sum('recouped'),paid:sum('paid'),outstanding,
    unverifiedOpening:sum('openingOutstanding')},historyComplete:accounts.every(a=>a.historyComplete),
    reconciliation:{bookedPayable:due,statementPayable:outstanding,difference:money(due-outstanding)}};
}
function outstandingRoyaltyDebt(s,companyId){
  return money(s.obligations.reduce((sum,o)=>sum+(o.debtorId===companyId?o.amount:0),0));
}
function settleRoyaltyObligations(s,c) {
  for(const o of s.obligations) {
    if(o.debtorId!==c.id||o.amount<=0||c.finance.cash<=0)continue;
    const creditor=company(s,o.creditorId),paid=money(Math.min(o.amount,c.finance.cash,c.finance.payable));
    if(paid<=0)continue;
    transact(s,c,'settle-royalty',{cash:-paid,payable:-paid},'Outstanding royalty settled',o.projectId);
    if(creditor){revenue(s,creditor,paid,'royalty-recovery','Outstanding royalty received',o.projectId);const p=s.projects.find(p=>p.id===o.projectId);const ip=s.ips.find(i=>i.id===p?.ipId);if(ip)ip.rightsIncome=money((ip.rightsIncome||0)+paid);
      const g=s.grants.find(g=>g.id===o.grantId);if(g?.agentRate>0){const cut=money(paid*g.agentRate);if(cut){expense(s,creditor,cut,'author-agency','Agency share of recovered royalty',o.projectId);g.agentFeesPaid=money((g.agentFeesPaid||0)+cut);}}}
    if(o.accountId){const account=s.royaltyAccounts.find(a=>a.id===o.accountId);
      if(!account)throw new Error('Royalty recovery has no source account.');
      account.paid=money(account.paid+paid);account.outstanding=money(account.outstanding-paid);account.updatedWeek=s.week;}
    o.amount=money(o.amount-paid);
  }
  s.obligations=s.obligations.filter(o=>o.amount>.001);
}
function weekSales(s) {
  s.weeklyConsumerSpend=money((s.streamingWeeklyTotal||0)+Object.values(s.gameMarketReserved||{}).reduce((a,b)=>a+b,0));
  for(const [sector,info] of Object.entries(SECTORS)) {
    if(!available(sector,s.week))continue;
    const titles=s.projects.filter(p=>p.sector===sector&&p.status==='released'&&p.route!=='contract'&&s.week-p.releaseWeek<85&&s.week>=p.releaseWeek&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=s.week&&g.endWeek+g.continuationWeeks>s.week)));
    if(!titles.length&&!s.backgroundFirms.some(b=>b.sector===sector&&b.releases.length))continue;
    for(const region of activeRegions(s)) {
      const budget=Math.max(0,money(worldMarketBudget(s,sector,region.name)-(sector==='tv'?(s.streamingWeeklyReserved?.[region.name]||0):sector==='games'?(s.gameMarketReserved?.[region.name]||0):0)));
      const background=backgroundWeights(s,sector,region);
      const cohortShares=audienceCohorts(s,region.name);
      const weights=titles.map(()=>0),minorShares=background.map(()=>0);
      for(const cohort of cohortShares){
        const titleWeights=titles.map(p=>{
          const age=s.week-p.releaseWeek,decay=Math.exp(-age/(p.sector==='publishing'?22:32));
          return ((p.quality/58)**2)*region.tastes[p.genre]*cohort.tastes[p.genre]*(1+.52*(p.marketingBudget/Math.max(p.budget,1)))*decay*audienceAffinity(p,cohort)*franchiseMomentum(s,p,s.week)*
           (p.sector==='movie'&&p.cinema?filmDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='tv'&&p.television?tvDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='games'&&p.videoGame?gameDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='publishing'?(p.translations?.some(t=>t.region===region.name)?1.13:1)*
             (company(s,p.companyId)?.imprints?.some(i=>i.id===p.imprintId&&i.genre===p.genre)?1.06:1)*
             (p.preorderCampaign&&age<7?1.06:1)*
             (p.format==='Web Serial'?(p.serialReaderMomentum||1):1):1);
        });
        const minorWeights=background.map(b=>b.weight*cohort.tastes[b.genre]);
        const denominator=5.2+titleWeights.reduce((a,b)=>a+b,0)+minorWeights.reduce((a,b)=>a+b,0);
        for(let i=0;i<weights.length;i++)weights[i]+=cohort.share*titleWeights[i]/denominator;
        for(let i=0;i<minorShares.length;i++)minorShares[i]+=cohort.share*minorWeights[i]/denominator;
      }
      for(let i=0;i<titles.length;i++) {
        const p=titles[i],targetGross=money(budget*weights[i]);
        const c=company(s,p.companyId);let gross=targetGross,fee=money(gross*(p.sector==='publishing'?(p.publishingChannel==='owned'?.08:p.publishingChannel==='direct'?.12:p.publishingChannel==='digital'?.23:.27):.32));
        const price=p.sector==='publishing'?publishingUnitPrice(p):0;let soldUnits=0;
        if(p.printStock){
          const book=p.printStock;
          // Wholesale partners fulfill 60% of a new edition's physical demand
          // without stock entering our warehouse. Their larger fee pays for
          // printing/retailer service; remaining 40% uses our own copies.
          // Both channels compete for the SAME capped consumer budget.
          const wholesaleShare=p.publishingChannel==='direct'?.20:p.publishingChannel==='wholesale'?.85:.60;
          const partnerGross=money(Math.floor(targetGross*wholesaleShare/book.price)*book.price),managedDemand=money(targetGross-partnerGross);
          p.stats.weeklyPrintDemand=(p.stats.weeklyPrintDemand||0)+Math.floor(managedDemand/book.price);
          const units=Math.min(book.stock,Math.floor(managedDemand/book.price));
          const directGross=money(units*book.price);
          gross=money(partnerGross+directGross);soldUnits=Math.floor(partnerGross/book.price)+units;
          fee=money(partnerGross*.29+directGross*(p.publishingChannel==='owned'?.08:.17));
          if(units>0){
            const cogs=money(units*book.unitCost);
            transact(s,c,'printed-copies-sold',{inventory:-cogs,expense:cogs},'Cost of '+units+' printed copies: '+p.title,p.id);
            book.stock-=units;book.sold+=units;book.cogs=money(book.cogs+cogs);p.stats.weeklyPrintUnits=(p.stats.weeklyPrintUnits||0)+units;
            book.partnerGross=money((book.partnerGross||0)+partnerGross);
            book.directGross=money((book.directGross||0)+directGross);
            p.directCost=money(p.directCost+cogs);
          }else book.partnerGross=money((book.partnerGross||0)+partnerGross);
        }
        if(p.sector==='publishing'&&!p.printStock){soldUnits=Math.floor(targetGross/price);gross=money(soldUnits*price);fee=money(gross*(p.publishingChannel==='owned'?.08:p.publishingChannel==='direct'?.12:p.publishingChannel==='digital'?.23:.27));}
        if(gross<.01)continue;
        if(p.sector==='publishing'){
          p.salesByRegion ||= {};p.salesByChannel ||= {};
          p.salesByRegion[region.name]=money((p.salesByRegion[region.name]||0)+gross);
          const channel=p.publishingChannel||'mixed';
          p.salesByChannel[channel]=money((p.salesByChannel[channel]||0)+gross);
          p.salesUnitsByRegion ||= {};p.salesUnitsByChannel ||= {};p.publishingUnitHistory ||= [];
          p.salesUnitsByRegion[region.name]=(p.salesUnitsByRegion[region.name]||0)+soldUnits;
          p.salesUnitsByChannel[channel]=(p.salesUnitsByChannel[channel]||0)+soldUnits;
          p.salesUnitsByAudience ||= {};
          for(const [cohort,units] of Object.entries(estimatePublishingAudienceUnits(s,region.name,p,soldUnits)))
            p.salesUnitsByAudience[cohort]=(p.salesUnitsByAudience[cohort]||0)+units;
          const weekRec=p.publishingUnitHistory.find(x=>x.week===s.week&&x.region===region.name&&x.channel===channel);
          if(weekRec){weekRec.units+=soldUnits;weekRec.gross=money(weekRec.gross+gross);}
          else p.publishingUnitHistory.push({week:s.week,region:region.name,channel,units:soldUnits,gross});
          if(p.publishingUnitHistory.length>96)p.publishingUnitHistory.splice(0,p.publishingUnitHistory.length-96);
          if(channel==='owned'&&s.publishingOutlet?.active){s.publishingOutlet.customerGross=money(s.publishingOutlet.customerGross+gross);s.publishingOutlet.distributionFees=money(s.publishingOutlet.distributionFees+fee);}
        }
        if(p.sector==='tv'&&p.television){
          const t=p.television;const age=s.week-p.releaseWeek,channel=age<20?'first-run':'syndication';
          t.regionalAdGross[region.name]=money((t.regionalAdGross[region.name]||0)+gross);
          t.channelGross[channel]=money((t.channelGross[channel]||0)+gross);
          const viewers=Math.floor(gross/(t.network==='premium'?2.8:1.8));
          t.estimatedViewers[region.name]=(t.estimatedViewers[region.name]||0)+viewers;
          const cohort=audienceCohorts(s,region.name),weights=cohort.map(x=>x.share*x.tastes[p.genre]*audienceAffinity(p,x));
          const all=weights.reduce((n,x)=>n+x,0)||1;let remaining=viewers;
          for(let j=0;j<cohort.length;j++){const count=j===cohort.length-1?remaining:Math.min(remaining,Math.floor(viewers*weights[j]/all));
           t.viewersByCohort[cohort[j].name]=(t.viewersByCohort[cohort[j].name]||0)+count;remaining-=count;}
          t.weeklyRatings.push({week:s.week,region:region.name,gross,estimatedViewers:viewers,channel});
          if(t.weeklyRatings.length>120){t.weeklyRatings.shift();t.ratingsHistoryComplete=false;}
          fee=money(gross*(channel==='syndication'?.23:t.network==='premium'?.17:t.network==='public'?.22:.31));
        }
        if(p.sector==='movie'){
          p.cinema.boxOffice[region.name]=money((p.cinema.boxOffice[region.name]||0)+gross);
          const channel=filmWindowChannel(p,s.week);
          const old=p.cinema.channels[channel]||0;p.cinema.channels[channel]=money(old+gross);
          const tickets=Math.floor(gross/12);p.cinema.admissions[region.name]=(p.cinema.admissions[region.name]||0)+tickets;
          const weekly=p.cinema.weeklyBoxOffice.find(r=>r.week===s.week&&r.region===region.name);
          if(weekly){weekly.gross=money(weekly.gross+gross);weekly.estimatedAdmissions+=tickets;}
          else p.cinema.weeklyBoxOffice.push({week:s.week,region:region.name,channel,gross,estimatedAdmissions:tickets});
          if(p.cinema.weeklyBoxOffice.length>100){p.cinema.weeklyBoxOffice.splice(0,p.cinema.weeklyBoxOffice.length-100);p.cinema.boxOfficeHistoryComplete=false;}
          // Participation is an external talent expense from the producer's real receipts.
          const bonus=money(gross*(p.cinema.castShare||0));
          if(bonus>0){expense(s,c,bonus,'film-cast-backend','Contracted cast backend: '+p.title,p.id);p.directCost=money(p.directCost+bonus);p.cinema.castPaid=money(p.cinema.castPaid+bonus);}
          fee=money(gross*({wide:.37,independent:.32,limited:.24}[p.cinema.distribution]||.32));
        }
        if(p.sector==='games'&&p.videoGame){
          const split=gameMarketSplit(s,p,gross,region.name);
          if(split.fee>0){p.videoGame.platformFees=money(p.videoGame.platformFees+split.fee);p.videoGame.platformGross=money(p.videoGame.platformGross+gross);fee=split.fee;}
          p.videoGame.regionalGross[region.name]=money((p.videoGame.regionalGross[region.name]||0)+gross);
          p.videoGame.salesUnits[region.name]=(p.videoGame.salesUnits[region.name]||0)+Math.floor(gross/(p.videoGame.model==='free-to-play'?6:24));
          p.videoGame.weeklySales.push({week:s.week,region:region.name,gross,channel:split.channel});
          if(p.videoGame.weeklySales.length>96){p.videoGame.weeklySales.shift();p.videoGame.historyComplete=false;}
        }
        bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+(p.sector==='tv'?' broadcast and syndication receipts: ':' earned sales: ')+p.title,p.id);
        if(p.sector==='games'&&p.videoGame&&p.videoGame.lastStoreOwnerId&&p.videoGame.lastStoreOwnerId!==p.companyId){
          const operator=company(s,p.videoGame.lastStoreOwnerId);
          const payable=money(Math.max(0,Math.min(fee, c.finance.cash-500)));
          if(operator&&payable>0){expense(s,c,payable,'game-store-service','Actual store service settlement: '+p.title,p.id);revenue(s,operator,payable,'game-store-commission','Store service fee earned: '+p.title,p.id);}
          const remaining=money(fee-payable);if(remaining>0)expense(s,c,remaining,'distribution','External game distribution balance: '+p.title,p.id);
        }else expense(s,c,fee,'distribution','Distribution fees: '+p.title,p.id);

        const salesDuty=money(gross*region.salesTaxRate);
        expense(s,c,salesDuty,'automatic-sales-tax','Regional sales levy: '+p.title,p.id);
        p.directRevenue=money(p.directRevenue+gross);p.directCost=money(p.directCost+fee+salesDuty);p.audience=money(p.audience+gross);p.stats.weeklySales=money(p.stats.weeklySales+gross);p.stats.totalSales=money(p.stats.totalSales+gross);
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
        if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(g)settleRoyalty(s,p,g,gross*g.royaltyRate,gross);}
        settlePartnerShare(s,p,gross);
      }
      // Aggregate competitor income is sourced from the same finite wallet;
      // it does not multiply world spending or create market-share bailouts.
      for(let j=0;j<background.length;j++){
        const item=background[j];const gross=money(budget*minorShares[j]);if(gross<.01)continue;
        const b=item.firm;bookConsumerReceipt(s,b,gross,'minor-consumer-sales','Regional minor-firm original receipts',null);
        expense(s,b,money(gross*(sector==='publishing'?.27:.32)),'minor-distribution','Background distribution fees');
        expense(s,b,money(gross*region.salesTaxRate),'automatic-sales-tax','Regional background-sales levy');
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
      }
    }
  }
}
function reviewReleases(s) {
  // The release week counts as week 1 of the sales window.
  for(const p of s.projects)if(p.companyId===s.playerId&&p.status==='released'&&!p.review&&s.week-p.releaseWeek>=12) {
    const expected=p.forecast?.scenario?.expected?.directContribution??null;
    const actual=currentProjectProfit(p);
    const variance=expected===null?null:money(actual-expected);
    const assessment=expected===null?'Historical forecast unavailable':variance>=0?'Ahead of the estimate':'Behind the estimate';
    const drivers=[];
    if(p.creativeHistoryComplete&&p.pitch){drivers.push('Creative direction: '+p.pitch.direction+'; targeted '+p.pitch.targetAudience+' audiences with '+p.pitch.positioning+' positioning.');
      drivers.push('Creative / technical execution: '+p.creativeQuality+' / '+p.technicalQuality+'; critic / audience reception '+p.criticScore+' / '+p.audienceScore+'.');}
    drivers.push('Known project spending '+shortMoney(p.directCost)+' versus approved '+shortMoney(p.plannedTotal)+'.');
    drivers.push('Changing audience wallets, rival launches and release timing may explain demand differences; this is not proven attribution.');
    p.review={week:s.week,horizonWeeks:13,drivers,actualDirect:actual,expectedDirect:expected,variance,actualGross:money(p.stats.totalSales),expectedGross:p.forecast?.scenario?.expected?.gross??null,actualCosts:money(p.directCost-(p.partnerSpend||0)),wholeProductionCosts:money(p.directCost),partnerFunded:money(p.partnerSpend||0),partnerShareCost:money(p.partnerShareCost||0),actualRoyalties:money(p.royaltyCost),releaseQuality:p.quality,estimatedQuality:p.forecast?.estimatedQuality??null,assessment};
    if(p.major)alert(s,'postmortem-'+p.id,'Release postmortem: '+p.title,
      assessment+' after the first 13 sales weeks. Direct contribution '+shortMoney(actual)+(expected===null?' (no original forecast)':' versus '+shortMoney(expected)+' expected')+'. Open Productions for details.','advisory');
  }
}
function launchAI(s,c) {
  if(c.bankrupt||!available(c.sector,s.week)||s.projects.some(p=>p.companyId===c.id&&p.status==='active'))return;
  if(c.finance.cash<SECTORS[c.sector].cost*.4+8000)return;
  const titlesA=['Hidden Harbor','Paper Skies','Velvet Meridian','The Last Orchard','Ash & Echo','Bright Atlas','Rift Beyond','A Quiet Storm','Echo Valley','The Long Night'];
  const title=pick(s,titlesA)+' '+(Math.floor(rand(s)*70)+1);
  const idea={companyId:c.id,title,sector:c.sector,route:'original',genre:pick(s,GENRES),size:.75+rand(s)*.60,marketing:.10+rand(s)*.2};
  try{
    // Rivals occasionally pool real labor and funds on the same terms as the
    // player. They cannot conscript the player's company as a financier.
    if(rand(s)<.16){const q=coProductionQuote(s,{...idea,capitalFraction:.2});
      if(q.partners.length){startCoProduction(s,{...idea,partnerId:q.partners[Math.floor(rand(s)*Math.min(q.partners.length,4))].id,capitalFraction:.2});return;}}
    createProject(s,idea);
  }catch(e){/* Rival waits for real financing, rights or capacity. */}
}
function newEntrants(s,year) {
  const idx={4:['movie','movie'],7:['tv','tv'],10:['games','games']}[year]||[];
  for(const sec of idx) {
    const index=s.companies.filter(c=>c.sector===sec).length;
    const name=(AI_NAMES.filter((n)=>!s.companies.some(c=>c.name===n))[0]||'Independent '+SECTORS[sec].name+' Studio '+index);
    createCompany(s,{name,sector:sec,foundedYear:year,cash:money(100000+rand(s)*170000),reputation:26+Math.floor(rand(s)*23)});
  }
  for(const sector of [...new Set(idx)])addBackgroundFirms(s,sector,year);
}
function ensureAlerts(s) {
  const c=player(s),weeklyRunway=650+Math.max(0,c.teamLevel-1)*300;
  if(c.finance.cash<weeklyRunway*5)alert(s,'liquidity-'+yearAt(s.week)+'-'+periodAt(s.week),'Liquidity warning','Cash is below about five weeks of basic overhead. Pause expensive launches and consider contract work.','critical');
  const stress=liquidityForecast(s,c.id,13);
  if(stress.firstShortfallWeek!==null){
    const acute=stress.firstShortfallWeek<=2&&c.finance.cash<stress.weeklyOverhead*2;
    alert(s,'cash-stress-'+yearAt(s.week)+'-'+periodAt(s.week),
      acute?'Immediate cash commitments at risk':'Projected cash runway risk',
      'Under a conservative no-new-sales case, current commitments exceed available cash in '+stress.firstShortfallWeek+' weeks. '+
      'Known receipts and scheduled loan payments are included. Review Financials; new sales may change this forecast.',
      acute?'critical':'advisory');
  }
  delegateRightsRenewals(s);
  for(const g of s.grants)if(g.grantorId===c.id&&g.endWeek>s.week&&g.endWeek-s.week<=4)alert(s,'expiry-'+g.id,'Rights agreement expiring','The '+SECTORS[g.media].name+' '+g.type+' for '+(s.ips.find(i=>i.id===g.ipId)?.name||'an IP')+' ends in '+(g.endWeek-s.week)+' weeks. Any renewal requires both parties.','critical');
}
// Economic briefings are snapshots of the simulated wallet, NOT company
// receivables. Scenario ranges are uncertain estimates, not foreknowledge.
function recordMarketBrief(s,closingWeek){
  const sector=player(s).sector;
  const regions=activeRegions(s).map(r=>{
    const ec=s.regionalEconomy?.[r.name]||{confidence:1,inflation:.02,employment:1};
    const wallet=worldMarketBudget(s,sector,r.name,closingWeek);
    return {name:r.name,currency:r.currency,fxRate:ec.fxRate||r.baseFx,wageIndex:ec.wageIndex||1,interestIndex:ec.interestIndex||1,
      confidence:ec.confidence,inflation:ec.inflation,employment:ec.employment,
      walletSource:'observed',cohorts:audienceCohorts(s,r.name).map(c=>({name:c.name,share:c.share})),weeklyAudienceBudget:wallet};
  });
  const total=money(regions.reduce((v,r)=>v+r.weeklyAudienceBudget,0));
  const period=periodAt(closingWeek),year=yearAt(closingWeek);
  const item={id:id(s,'marketbrief'),week:closingWeek,year,period,
    summary: s.macroeconomy<.94?'Soft consumer conditions':s.macroeconomy>1.055?'Strong consumer conditions':'Steady consumer conditions',
    globalIndex:money(s.macroeconomy),sector,knownRegions:regions,
    forecast:{type:'estimate',horizonWeeks:13,conservative:money(total*.86),expected:total,optimistic:money(total*1.13),
      explanation:'Scenario ranges assume current wallets and technology; actual future competition, inflation and regional confidence are uncertain.'}};
  s.marketBriefs.unshift(item);if(s.marketBriefs.length>72)s.marketBriefs.length=72;
  if([2,5,8,11].includes(period)){
    const previous=s.quarterlyMarketReports?.[0]||null;
    const earlier=previous?.regionalIndicators||[];
    const walletChange=previous?money(total-earlier.reduce((n,r)=>n+r.weeklyAudienceBudget,0)):null;
    const strongest=regions.slice().sort((a,b)=>b.confidence-a.confidence)[0];
    const shocks=(s.economicShocks||[]).filter(x=>x.week>=closingWeek-13&&x.week<=closingWeek);
    const analysis=(walletChange===null?'First observed quarterly baseline.':
      'Reachable weekly audience wallet '+(walletChange>=0?'grew by ':'fell by ')+shortMoney(Math.abs(walletChange))+' since the previous quarterly close.')+
      ' '+strongest.name+' currently has the strongest consumer confidence. '+
      (shocks.length?shocks.length+' regional disruption(s) occurred; recovery is uncertain.':'No material recorded regional disruptions this quarter.')+
      ' Wage, interest and exchange-rate movements affect operating costs or market reach; forecast ranges are estimates, not guaranteed revenue.';
    const q={id:id(s,'quarterlybrief'),week:closingWeek,year,quarter:Math.floor(period/3)+1,
      summary:item.summary,analysis,weekWalletChange:walletChange,shocks:shocks.map(x=>({...x})),
      regionalIndicators:regions.map(r=>({...r})),sectorTechnology:technologyReport(s),
      companyCash:player(s).finance.cash,companyCashSource:'observed',
      consumerForecast:{...item.forecast}};
    s.quarterlyMarketReports.unshift(q);if(s.quarterlyMarketReports.length>28)s.quarterlyMarketReports.length=28;
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
    const expiredCredit=period===11?f.creditCarry:0;
    if(period===11)f.creditCarry=0;
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
    if(c.isPlayer){const risk=liquidityForecast(s,c.id,13);closing.cashRunwayWeeks=risk.runwayWeeks;closing.forecastCash13=risk.endingCash;closing.forecastAssumption='no-new-sales';}
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
  if(s.reports.length>150)s.reports.length=150;
  recordMarketBrief(s,closingWeek);
  if(period===2||period===5||period===8||period===11){news(s,'Quarterly industry review','The market is '+(s.macroeconomy<.97?'soft':'steady')+'. Rival studios remain sensitive to real budgets and production costs.','world');}
}
function shortMoney(n){return '$'+Math.round(n).toLocaleString('en-US');}
function singleWeek(s) {
  const priorWeek=s.week,priorYear=yearAt(priorWeek),priorPeriod=periodAt(priorWeek);
  const nextWeek=priorWeek+1;
  // Close the COMPLETED month before recording the first transaction of the
  // next one. Previously week 5's sales/payroll were included in month 1.
  if(priorPeriod!==periodAt(nextWeek)||priorYear!==yearAt(nextWeek))closePeriod(s,priorWeek);
  s.week++;
  collectRemittances(s);
  settlePartnerReceipts(s);
  const year=yearAt(s.week),period=periodAt(s.week);
  if(year!==priorYear){
    recognizeTvHonors(s,priorYear);
    captureAnnualSnapshots(s,priorYear);
    recognizeCreativeAwards(s,priorYear);
    recognizeFilmHonors(s,priorYear);
    annualCareers(s);
    reviewFounderTransition(s);
    for(const [sec,info] of Object.entries(SECTORS))if(info.year===year&&sec!=='publishing') {news(s,info.name+' industry debuts','A new worldwide entertainment sector is now commercially available. Companies still need staff or partners.','breakthrough');alert(s,'industry-'+sec,'New industry available',info.name+' has globally debuted. You can remain a specialist or invest in an entry capability.','advisory');newEntrants(s,year);}
  }
  for(const [sec,info]of Object.entries(SECTORS))if(info.year>1&&s.week===(info.year-1)*52-26){
    news(s,'Industry outlook: '+info.name+' approaches','Worldwide debut expected in World Year '+info.year+'. Binding future-media options may be negotiated now; production remains prohibited before debut.','breakthrough');
    alert(s,'preview-'+sec,'Prepare for '+info.name,'The global '+info.name+' sector debuts in 26 weeks. Compare optional partners and rights; there is no mandatory expansion.','advisory');
  }
  s.macroeconomy=clamp(s.macroeconomy+(rand(s)-.5)*.022-(s.macroeconomy-1)*.03,.76,1.17);
  updateRegionalEconomy(s);
  if(s.week%13===0)recruitVacancies(s);
  for(const [sector,t] of Object.entries(technologyReport(s)))if(t.discovered&&t.discoveryWeek===s.week){
    news(s,SECTORS[sector].name+' technology breakthrough','A new production and distribution toolkit is being adopted gradually. Discovery does not override world sector debut or company capabilities.','breakthrough');
  }
  // Only the proportion of payroll serving live productions is attributed
  // to projects. Idle-team/company overhead remains a separate unallocated
  // company expense; allocations NEVER cause a second book entry.
  const activeByCompany=new Map();
  for(const p of s.projects)if(p.status==='active'){
    if(!activeByCompany.has(p.companyId))activeByCompany.set(p.companyId,[]);
    activeByCompany.get(p.companyId).push(p);
  }
  for(const c of s.companies){if(c.bankrupt)continue;
    const overhead=weeklyOverhead(c,s);
    expense(s,c,overhead,'payroll-overhead','Weekly team payroll and shared corporate overhead');
    accumulateInsurancePayroll(s,c,overhead);
    expense(s,c,money(overhead*taxRegion(c).payrollLevyRate),'automatic-payroll-levy','Automatic regional employer levy');
    const inFlight=activeByCompany.get(c.id)||[];
    let attributed=0;
    for(const p of inFlight){
      const allocated=money(Math.min(overhead-attributed,overhead/Math.max(1,c.capacity)));
      p.overheadAttributed=money((p.overheadAttributed||0)+allocated);
      attributed=money(attributed+allocated);
    }
    c.finance.overheadAttributed=money((c.finance.overheadAttributed||0)+attributed);
  }
  delegateSpecialists(s);
  for(const p of s.projects)if(p.status==='active')projectWork(s,p);
  backgroundProgress(s);
  for(const p of s.projects)if(p.status==='released')p.stats.weeklySales=0;
  for(const g of s.grants)if(g.type==='option'&&g.endWeek>s.week&&available(g.media,s.week)){
    if(exerciseOption(s,g)) {const c=company(s,g.holderId);if(c&&!c.capabilities[g.media]&&c.finance.cash>=capabilityCost(g.media,'partner')+6500){expense(s,c,capabilityCost(g.media,'partner'),'capability','Partner adaptation production capability');c.capabilities[g.media]='partner';}const ip=s.ips.find(x=>x.id===g.ipId);
      const pitchTitle=(ip?.name||'New Story')+': Adapted';
      if(g.approvalRequired){
        requestCreativeApproval(s,g.id,{title:pitchTitle,genre:GENRES[0]});
      }else try{createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,title:pitchTitle,genre:GENRES[0],size:.85});}catch(e) {/* Counterparty retains rights but may defer production. */}

    }
  }
  for(const approval of s.creativeApprovals||[])if(approval.status==='approved'&&!approval.launched){
    const g=s.grants.find(g=>g.id===approval.grantId),c=company(s,approval.holderId);
    if(!g||g.type!=='license'||g.endWeek<=s.week||!c||c.bankrupt||c.id===s.playerId)continue;
    if(!c.capabilities[g.media])continue;
    try{const production=createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,
      title:approval.title,genre:approval.genre,size:.85,approvalId:approval.id});approval.launched=production.id;}
    catch(e){/* Pending capacity/cash; approved terms remain valid until the actual expiry. */}
  }
  streamingWeek(s);
  gameStoreWeek(s);
  weekSales(s);
  // Serialized reader momentum reacts only to ACTUAL current-week purchases.
  // It reallocates share within the same consumer wallets in following weeks.
  const weeklyPublishingWallet=activeRegions(s).reduce((n,r)=>n+worldMarketBudget(s,'publishing',r.name),0);
  for(const p of s.projects)if(p.sector==='publishing'&&p.format==='Web Serial'&&p.status==='released'){
    const observed=(p.stats.weeklySales||0)/Math.max(1,weeklyPublishingWallet);
    const target=clamp(.90+observed*2.8,.88,1.2);
    p.serialReaderMomentum=money(clamp((p.serialReaderMomentum||1)*.82+target*.18,.85,1.22));
    p.serialEngagementHistory.push({week:s.week,momentum:p.serialReaderMomentum,observedGross:money(p.stats.weeklySales||0)});
    if(p.serialEngagementHistory.length>24)p.serialEngagementHistory.shift();
  }
  settlePrintLifecycle(s);
  autoReplenishPrint(s);
  reviewReleases(s);
  if(s.week%7===0){for(const c of s.companies){if(c.isPlayer||c.bankrupt)continue;if(rand(s)<(s.settings.difficulty==='challenging'?.86:s.settings.difficulty==='casual'?.60:.72))launchAI(s,c);}}
  if(s.week%52===0)for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash>SECTORS[c.sector].cost*1.2){
    const t=businessTechnology(s,c.id,c.sector);
    if(t.canUpgrade&&rand(s)<.30)try{adoptTechnologyForRival(s,c,c.sector);}catch(e){/* A real competitor can defer an upgrade. */}
  }
  for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash<=0&&c.finance.payable>SECTORS[c.sector].cost*.5){c.bankrupt=true;news(s,c.name+' closes its doors','The financially distressed '+SECTORS[c.sector].name+' firm could not meet ongoing obligations.','competitor');}
  ensureAlerts(s);
}
// Year end captures actual legal-entity books after the completed final month,
// before the first transaction in the new year. No double booking or fake
// financial history is generated for imported older campaigns.
function captureAnnualSnapshots(s,year){
  for(const c of s.companies){
    const f=c.finance,base=c.annualBaseline,complete=!!(base&&Number.isFinite(base.revenue)&&Number.isFinite(base.expense));
    s.snapshots.push({year,companyId:c.id,sector:c.sector,region:c.homeRegion||taxRegion(c).name,
      cash:money(f.cash),reputation:c.reputation,completed:s.projects.filter(p=>p.companyId===c.id&&p.status==='released'&&yearAt(p.releaseWeek)===year).length,
      revenue:money(f.revenue),expense:money(f.expense),profit:companyProfit(c),
      annualRevenue:complete?money(f.revenue-base.revenue):null,
      annualExpense:complete?money(f.expense-base.expense):null,
      annualProfit:complete?money((f.revenue-base.revenue)-(f.expense-base.expense)):null,
      receivable:money(f.receivable||0),payable:money(f.payable||0),
      deferred:money(f.deferred||0),debt:money(f.loanBalance||0),
      inventory:money(f.inventory||0),equity:money(f.equity||0),
      historyComplete:complete,source:'booked-entity-close'});
    c.annualBaseline={revenue:money(f.revenue),expense:money(f.expense)};
  }
  if(s.snapshots.length>1600)s.snapshots.splice(0,s.snapshots.length-1600);
}
function historicalCompanyFinances(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for yearly financial history.');
  return s.snapshots.filter(x=>x.companyId===companyId).sort((a,b)=>b.year-a.year).map(x=>({...x}));
}
// Rival financial books are private. Only rough bands, explicitly tagged as
// estimates, may appear in the player's intelligence views; ownership group
// companies and actual public release results are shown accurately.
function portfolioRankings(s,{type='finance',metric=null,sector='all',region='all',year='all',limit=20}={}){
  if(!['finance','audience','prestige'].includes(type))throw new Error('Unknown ranking type.');
  if(sector!=='all'&&!SECTORS[sector])throw new Error('Unknown ranking sector.');
  if(region!=='all'&&!activeRegions(s).some(r=>r.name===region))throw new Error('Unknown ranking region.');
  if(year!=='all'&&(!Number.isInteger(Number(year))||Number(year)<1||Number(year)>yearAt(s.week)))throw new Error('Invalid ranking year.');
  const yearNum=year==='all'?null:Number(year),max=clamp(Number(limit)||20,1,30);
  if(type==='finance'){
    const metrics=['cash','profit','revenue','annualRevenue','annualProfit','debt'];
    metric=metric||'profit';if(!metrics.includes(metric))throw new Error('Unknown financial leaderboard metric.');
    const rows=s.companies.flatMap(c=>{
      if(sector!=='all'&&c.sector!==sector)return [];
      if(region!=='all'&&c.homeRegion!==region)return [];
      const h=yearNum?s.snapshots.find(x=>x.companyId===c.id&&x.year===yearNum):null;
      if(yearNum&&!h)return [];
      const value=yearNum?h[metric]:metric==='annualRevenue'||metric==='annualProfit'?null:metric==='cash'?c.finance.cash:metric==='revenue'?c.finance.revenue:metric==='debt'?c.finance.loanBalance:companyProfit(c);
      if(value===null||!Number.isFinite(value))return [];
      const actual=c.isPlayer||c.parentId===s.playerId;
      const shown=actual?money(value):money(Math.round(value/5000)*5000);
      return [{id:c.id,name:c.name,sector:c.sector,region:c.homeRegion,value:shown,source:actual?'actual':'estimated',year:yearNum,historyComplete:yearNum?!!h.historyComplete:true}];
    });
    return rows.sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,max);
  }
  const rows=s.projects.filter(p=>p.status==='released'&&p.releaseWeek!==null&&
      (sector==='all'||p.sector===sector)&&(yearNum===null||yearAt(p.releaseWeek)===yearNum)&&
      (region==='all'||p.productionRegion===region)).map(p=>({
      id:p.id,name:p.title,sector:p.sector,region:p.productionRegion,
      value:type==='audience'?money(p.stats?.totalSales||0):Number(p.criticScore??p.quality??0),
      source:'actual',year:yearAt(p.releaseWeek),historyComplete:true,companyId:p.companyId}));
  return rows.sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,max);
}
function portfolioRecords(s,{sector='all',year='all'}={}){
  const titles=portfolioRankings(s,{type:'audience',sector,year,limit:30});
  const acclaim=portfolioRankings(s,{type:'prestige',sector,year,limit:30});
  const entries=s.projects.filter(p=>p.status==='released'&&p.releaseWeek!==null&&(sector==='all'||p.sector===sector)&&
    (year==='all'||yearAt(p.releaseWeek)===Number(year)));
  return {topAudience:titles[0]||null,topCritic:acclaim[0]||null,
    releasedCount:entries.length,franchiseCount:new Set(entries.map(p=>p.ipId).filter(Boolean)).size,
    note:'Played releases only; gross audience sales and critic scores are not accounting profit.'};
}
function searchNewsArchive(s,{query='',kind='all',year='all',limit=150}={}){
  const q=String(query||'').toLowerCase().slice(0,100);return [...s.news,...(s.archivedNews||[])]
   .filter(n=>(kind==='all'||n.kind===kind)&&(year==='all'||n.year===Number(year))&&
      (n.title+' '+n.body).toLowerCase().includes(q))
   .sort((a,b)=>b.week-a.week||b.id.localeCompare(a.id)).slice(0,clamp(Number(limit)||150,1,500));
}

// Small real freelance pool: an individual specialist can only serve one active
// production. No compulsory task scheduling or permanent payroll minigame.
const SPECIALIST_NAMES=['Mira Rowan','Niko Vale','Asha Calder','Tomas Finch','Lena Glass','Ari Juniper','Rhea Mercer','Cato Stone','Vera Wren'];
const SPECIALIST_DISCIPLINES=['editorial','technical','production'];
function seedSpecialists(s){
 if(!Array.isArray(s.specialists))s.specialists=[];
 if(s.specialists.length)return;
 for(let i=0;i<SPECIALIST_NAMES.length;i++){
  const skill=55+hash(s.seed+':talent:'+i)%30;
  s.specialists.push({id:id(s,'talent'),name:SPECIALIST_NAMES[i],discipline:SPECIALIST_DISCIPLINES[i%3],skill,
   fee:money(600+(skill-50)*45),assignedProjectId:null,completed:0,enteredWeek:s.week,creatorRole:null,mentorshipHistory:[]});
 }
}
function availableSpecialists(s,projectId){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.status!=='active')throw new Error('No active project for specialist booking.');
 return (s.specialists||[]).filter(x=>!x.assignedProjectId).map(x=>({...x,canAfford:company(s,p.companyId).finance.cash>=x.fee+2500}));
}
function releaseProjectSpecialist(s,p,completed=false){
 if(!p.specialistId)return;
 const t=s.specialists?.find(x=>x.id===p.specialistId);
 if(t&&t.assignedProjectId===p.id){t.assignedProjectId=null;if(completed)t.completed++;}
 p.specialistId=null;
}
function bookSpecialist(s,projectId,specialistId){
 requireExecutiveControl(s);const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||!controlledCompanies(s).some(x=>x.id===c.id)||p.status!=='active'||p.weeksDone>=p.weeksTotal)
  throw new Error('Choose an unfinished production that you control.');
 if(p.specialistId||p.specialistAppointments?.length)throw new Error('Only one optional specialist booking is permitted per production.');
 const talent=s.specialists?.find(x=>x.id===specialistId);
 if(!talent||talent.assignedProjectId)throw new Error('Specialist unavailable or already committed elsewhere.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired&&talent.discipline==='editorial')
  throw new Error('Contracted creator approval protects this adaptation from unilateral story changes.');
 if(c.finance.cash<talent.fee+2500)throw new Error('Specialist fee would breach the protected operating cash buffer.');
 expense(s,c,talent.fee,'specialist-fee','Specialist '+talent.name+' on '+p.title,p.id);
 p.directCost=money(p.directCost+talent.fee);p.productionSpend=money((p.productionSpend||0)+talent.fee);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+talent.fee);
 const leader=s.employees.find(e=>e.id===c.teams.find(t=>t.id===p.teamId)?.leaderId&&e.status==='employed');
 const repeatBond=s.creatorRelations?.find(r=>r.leaderId===leader?.id&&r.specialistId===talent.id);
 const chemistry=repeatBond?Math.min(3,repeatBond.projects):0;
 if(talent.discipline==='editorial')p.creativeQuality=Math.round(clamp(p.creativeQuality+3+(talent.skill-55)/10+chemistry,1,99));
 if(talent.discipline==='technical')p.technicalQuality=Math.round(clamp(p.technicalQuality+3+(talent.skill-55)/10+chemistry,1,99));
 if(talent.discipline!=='production')p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 talent.assignedProjectId=p.id;p.specialistId=talent.id;
 p.specialistAppointments.push({specialistId:talent.id,week:s.week,fee:talent.fee,discipline:talent.discipline});
 if(c.isPlayer)news(s,'Specialist hired for '+p.title,talent.name+' joins the '+talent.discipline+' workstream for a real one-off fee.','production');
 return {projectId:p.id,specialistId:talent.id,fee:talent.fee,discipline:talent.discipline};
}
// No release can be dated outside its effective production grant. Delaying a
// finished title ties up an actual team and continuing payroll rather than
// creating an extra free release slot or bypassing rights expiry.
function setFranchiseReleaseTarget(s,projectId,targetWeek){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.status!=='active'||p.route==='contract'||!controlledCompanies(s).some(c=>c.id===p.companyId))
  throw new Error('Only an owned active non-commissioned production can be coordinated.');
 if(targetWeek===null){p.holdUntilWeek=null;p.releasePlanHistory.push({week:s.week,targetWeek:null});return {projectId,targetWeek:null};}
 if(!Number.isInteger(targetWeek)||targetWeek<s.week||targetWeek>s.week+52)
  throw new Error('Launch target must be a future week within one year.');
 if(!available(p.sector,targetWeek))throw new Error('Industry not globally debuted.');
 if(p.grantId){const grant=s.grants.find(g=>g.id===p.grantId);
  if(!grant||grant.type!=='license'||grant.startWeek>targetWeek||grant.endWeek<=targetWeek)
   throw new Error('Launch target exceeds the effective adaptation grant. Renew with consent before scheduling.');
 }
 p.holdUntilWeek=targetWeek;p.releasePlanHistory.push({week:s.week,targetWeek});
 if(company(s,p.companyId).isPlayer)news(s,'Franchise launch date planned: '+p.title,'Target '+periodLabel(targetWeek)+'; release still requires completed production and effective rights.','production');
 return {projectId,targetWeek};
}
function coordinateFranchiseReleases(s,ipId,spacing=7){
 const ip=s.ips.find(x=>x.id===ipId);
 if(!ip||!controlledCompanies(s).some(c=>c.id===ip.ownerId))throw new Error('Franchise owner approval required.');
 if(!Number.isInteger(spacing)||spacing<4||spacing>12)throw new Error('Use 4–12 weeks between releases.');
 const projects=s.projects.filter(p=>p.ipId===ipId&&p.status==='active'&&p.route!=='contract'&&
  controlledCompanies(s).some(c=>c.id===p.companyId)).sort((a,b)=>(a.holdUntilWeek||s.week+a.weeksTotal-a.weeksDone)-(b.holdUntilWeek||s.week+b.weeksTotal-b.weeksDone));
 const proposed=[];let previous=-Infinity;
 for(const p of projects){
  const natural=s.week+Math.ceil(Math.max(0,p.weeksTotal-p.weeksDone)/1.2),planned=Math.max(natural,p.holdUntilWeek||0);
  const target=Math.max(planned,previous+spacing);
  if(target>s.week+52)throw new Error('Spacing would exceed the one-year planning horizon.');
  if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);
   if(!g||g.endWeek<=target)throw new Error('A licensed adaptation would exceed its grant; no releases were rescheduled.');}
  proposed.push({projectId:p.id,targetWeek:target});previous=target;
 }
 // Validate every proposal before mutation to keep this user action atomic.
 for(const row of proposed)setFranchiseReleaseTarget(s,row.projectId,row.targetWeek);
 return proposed;
}
// This modifier reallocates shares of the SAME finite regional audience wallet:
// successful (or disappointing) works in OTHER media influence relative demand,
// but no IP-owner sales, royalties, licenses or currency are created here.
function franchiseMomentum(s,p,atWeek=s.week){
 if(!p?.ipId||p.route==='contract')return 1;
 const peers=s.projects.filter(x=>x.id!==p.id&&x.ipId===p.ipId&&x.sector!==p.sector&&
   x.status==='released'&&x.releaseWeek<=atWeek&&atWeek-x.releaseWeek<40&&x.route!=='contract');
 let delta=0;
 for(const x of peers){const q=Number.isFinite(x.audienceScore)?x.audienceScore:x.quality;
  const impact=clamp((q-55)/320,-.055,.08)*Math.exp(-(atWeek-x.releaseWeek)/26);
  delta+=impact;
 }
 return money(clamp(1+delta,.90,1.15));
}
function franchiseAudienceSignals(s,ipId){
 const ip=s.ips.find(x=>x.id===ipId);if(!ip)throw new Error('Unknown franchise.');
 return s.projects.filter(p=>p.ipId===ipId&&p.status==='released'&&p.route!=='contract').map(p=>({projectId:p.id,title:p.title,
  sector:p.sector,releaseWeek:p.releaseWeek,multiplier:franchiseMomentum(s,p),
  basis:'Observed released adaptations in other media, applied only inside existing finite audience budgets'}));
}


// A concise, optional team development decision—not a payroll or employee
// schedule minigame. Training costs real cash and reserves no imaginary hours.
function configureTalentAuthority(s,policy){
 if(typeof policy?.autoBook!=='boolean'||!Number.isFinite(Number(policy.maxFee))||policy.maxFee<500||policy.maxFee>5000)
  throw new Error('Specialist delegation needs an explicit opt-in and fee ceiling.');
 s.talentPolicy={autoBook:policy.autoBook,maxFee:money(policy.maxFee)};
 return {...s.talentPolicy};
}
function delegateSpecialists(s){
 if(!s.talentPolicy?.autoBook||s.week%4!==0)return 0;
 let booked=0;
 for(const p of s.projects.filter(p=>p.companyId===s.playerId&&p.status==='active'&&p.major&&
   !p.specialistId&&!(p.specialistAppointments||[]).length&&p.weeksDone<p.weeksTotal*.4)){
  const c=company(s,p.companyId);if(!c||c.bankrupt)continue;
  const choices=availableSpecialists(s,p.id).filter(t=>t.canAfford&&t.fee<=s.talentPolicy.maxFee&&
    !(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired&&t.discipline==='editorial'));
  // One safe low-cost technical/production specialist, only if already opted in.
  choices.sort((a,b)=>(a.discipline==='technical'?-1:0)-(b.discipline==='technical'?-1:0)||a.fee-b.fee);
  if(choices[0]){try{bookSpecialist(s,p.id,choices[0].id);booked++;}catch(e){/* Don't bypass approvals or the real cash limit. */}}
 }
 return booked;
}
function trainTeam(s,teamId,focus='mentorship',specialty=null){
 requireExecutiveControl(s);const c=controlledCompanies(s).find(c=>c.teams?.some(t=>t.id===teamId));
 if(!c||c.bankrupt)throw new Error('Cannot train staff of an unrelated or insolvent company.');
 const t=c.teams.find(x=>x.id===teamId);
 if(teamBusy(s,t.id))throw new Error('Busy teams must finish their commitments before retraining.');
 if(!['mentorship','specialize'].includes(focus))throw new Error('Unknown team development choice.');
 if(focus==='specialize'&&!GENRES.includes(specialty))throw new Error('Select a valid new genre specialty.');
 if(focus==='specialize'&&specialty===t.specialty)throw new Error('Already specializing in that genre.');
 if((t.trainingHistory||[]).length&&s.week-t.trainingHistory.at(-1).week<13)throw new Error('Team recently trained; wait at least a quarter.');
 const cost=focus==='mentorship'?2500:1800;
 if(c.finance.cash<cost+5000)throw new Error('Insufficient cash for training and normal payroll reserve.');
 if(focus==='mentorship'&&t.skill>=88)throw new Error('Team has reached the current skill ceiling.');
 const oldSkill=t.skill,oldSpecialty=t.specialty;
 expense(s,c,cost,'training','Develop '+t.name+' skills and specialty');
 t.skill=Math.min(88,t.skill+(focus==='mentorship'?3:1));
 if(focus==='specialize')t.specialty=specialty;
 if(!Array.isArray(t.trainingHistory))t.trainingHistory=[];
 t.trainingHistory.push({week:s.week,focus,cost,oldSkill,newSkill:t.skill,oldSpecialty,newSpecialty:t.specialty});
 if(t.trainingHistory.length>24)t.trainingHistory.shift();
 if(c.isPlayer)news(s,'Team development: '+t.name,'Optional '+focus+' cost '+shortMoney(cost)+'; future project matching may improve, but no project result is guaranteed.','company');
 return {teamId,cost,focus,skill:t.skill,specialty:t.specialty};
}
function teamPerformance(s,teamId){
 const c=s.companies.find(c=>c.teams?.some(t=>t.id===teamId));
 if(!c)throw new Error('Unknown production team.');
 const t=c.teams.find(t=>t.id===teamId),rows=t.performanceHistory||[];
 return {teamId:t.id,team:t.name,skill:t.skill,specialty:t.specialty,completed:t.completed,
  trackedProjects:rows.length,averageQuality:rows.length?money(rows.reduce((n,r)=>n+r.quality,0)/rows.length):null,
  recent:rows.slice(-8).map(x=>({...x})),training:(t.trainingHistory||[]).slice(-8).map(x=>({...x})),
  historyComplete:rows.length>0||t.completed===0,
  note:'Ratings reflect observed releases from this build; older campaigns may not include past project evaluations.'};
}

function advance(s,count=1) {
  if(s.runStatus==='ended')return {weeks:0,stopped:true,reason:'Run concluded.'};
  const n=clamp(Math.round(Number(count)||1),1,52);let moved=0,stopped=false;
  const pauses=()=>s.inbox.some(a=>a.open&&(a.kind==='critical'||(s.pausePolicy?.stopForAdvisory&&a.kind==='advisory')));
  if(n>1&&pauses())return {weeks:0,stopped:true,reason:'Review your selected Inbox interruptions before skipping.'};
  for(let i=0;i<n;i++){if(i>0&&pauses()){stopped=true;break;}singleWeek(s);moved++;if(n>1&&pauses()){stopped=true;break;}}
  return {weeks:moved,stopped,reason:stopped?'An important decision or warning needs attention.':''};
}
function dismissAlert(s,alertId){const item=s.inbox.find(a=>a.id===alertId);if(item)item.open=false;}
// Approval queue is limited to TERMS already counteroffered by willing, real
// counterparties. It never books production, commits partner cash or waives a
// creator veto. Every item is revalidated by the existing contract functions.
function routineCounterQueue(s){
  const queue=[];
  if(s.commissionPolicy?.autoCounter)for(const o of s.commissionOffers||[]){
    if(o.producerId===s.playerId&&o.status==='counter'&&o.counterFee<=s.commissionPolicy.maxFee&&
       o.counterFee>=o.baseCost*(1+s.commissionPolicy.minMargin))
      queue.push({kind:'commission',offerId:o.id,title:o.title});
  }
  if(s.coProductionPolicy?.autoCounter)for(const o of s.coProductionOffers||[]){
    if(o.producerId===s.playerId&&o.status==='counter'&&s.week<=o.expiresWeek&&
       o.commitment<=s.coProductionPolicy.maxCommitment&&o.counterShare<=s.coProductionPolicy.maxShare)
      queue.push({kind:'cofinance',offerId:o.id,title:o.title});
  }
  return queue.sort((a,b)=>a.offerId.localeCompare(b.offerId));
}
function batchApproveRoutineCounters(s,limit=5){
  if(!Number.isInteger(limit)||limit<1||limit>10)throw new Error('Routine approval batch must contain 1–10 offers.');
  const approved=[],deferred=[];
  for(const row of routineCounterQueue(s).slice(0,limit)){
    try{
      if(row.kind==='commission')answerCommissionOffer(s,row.offerId,true);
      else answerCoProductionOffer(s,row.offerId,true);
      approved.push(row);
    }catch(error){deferred.push({...row,reason:error.message});}
}
  return {approved,deferred,remaining:routineCounterQueue(s).length,
    note:'Terms only: each production still requires explicit funding and rights approval.'};
}
function dismissRoutineAdvisories(s){let count=0;for(const item of s.inbox)if(item.open&&item.kind==='advisory'){item.open=false;count++;}return count;}
function setPausePolicy(s,stopForAdvisory){if(typeof stopForAdvisory!=='boolean')throw new Error('Invalid skip interruption policy.');s.pausePolicy={stopForAdvisory};return {...s.pausePolicy};}
function setDashboardFocus(s,focus){if(!['operations','finance','franchise'].includes(focus))throw new Error('Unknown dashboard layout.');s.dashboardFocus=focus;return focus;}
function companyProfit(c){return money(c.finance.revenue-c.finance.expense);}
function companyBalance(c){return money(c.finance.equity+companyProfit(c)+c.finance.deferred+c.finance.payable+(c.finance.loanBalance||0)-c.finance.cash-(c.finance.prepaid||0)-(c.finance.receivable||0)-(c.finance.investment||0)-(c.finance.inventory||0));}
function currentProjectProfit(p){return money(p.directRevenue-p.directCost+(p.partnerSpend||0)-p.royaltyCost-(p.partnerShareCost||0));}
// Estimate-at-completion from observed production costs, not the hidden
// realized budget multiplier. Direct cost already includes launch marketing.
function projectBudget(s,projectId){
  const p=s.projects.find(p=>p.id===projectId);if(!p)throw new Error('Unknown project budget.');
  const plannedTotal=money(p.plannedTotal??p.budget+p.marketingBudget),spent=p.productionSpend===null?null:money(p.productionSpend);
  if(spent===null)return {plannedTotal,spent:null,estimatedTotal:null,projectedVariance:null,variancePercent:null,remainingEstimate:null,completed:p.status==='released',historyComplete:false};
  const estimatedTotal=p.weeksDone<=0?plannedTotal:p.status==='released'?spent:
    money(p.marketingBudget+Math.max(0,spent-p.marketingBudget)*p.weeksTotal/p.weeksDone);
  return {plannedTotal,spent,estimatedTotal,projectedVariance:money(estimatedTotal-plannedTotal),
    variancePercent:plannedTotal?money((estimatedTotal-plannedTotal)/plannedTotal*100):0,
    remainingEstimate:money(Math.max(0,estimatedTotal-spent)),completed:p.status==='released',historyComplete:p.budgetHistoryComplete===true};
}
function productionFinancial(s,projectId){
  const p=s.projects.find(p=>p.id===projectId);if(!p)throw new Error('Unknown project.');
  const direct=currentProjectProfit(p),overhead=p.overheadAttributed||0;
  return {projectId,companyId:p.companyId,ipId:p.ipId,sector:p.sector,
    revenue:p.directRevenue,directCosts:money(p.directCost-(p.partnerSpend||0)),wholeProductionCosts:p.directCost,partnerFinancedCost:p.partnerSpend||0,partnerParticipation:p.partnerShareCost||0,royalties:p.royaltyCost,directContribution:direct,
    allocatedOverhead:overhead,afterAllocatedOverhead:money(direct-overhead),
    overheadHistoryComplete:p.overheadHistoryComplete===true};
}
// Scope owner-company profits separately from externally licensed adaptations.
// The latter are world productions, NOT extra consumer money for the IP owner.

// Everything here is read from the SAME IP/works/grants/project source of
// truth, including creator vetoes and contractual release windows. Canon
// annotations are optional story labels, never substitutes for legal grants.
function franchiseBible(s,ipId){
 const ip=s.ips.find(i=>i.id===ipId);if(!ip)throw new Error('Unknown underlying IP.');
 const projects=s.projects.filter(p=>p.ipId===ip.id).sort((a,b)=>a.startWeek-b.startWeek);
 const branches={main:[],alternate:[],spinoff:[],unclassified:[]};
 const rows=projects.map(p=>{
  const branch=p.franchiseHistoryComplete===false?'unclassified':FRANCHISE_BRANCHES.includes(p.franchiseBranch)?p.franchiseBranch:'unclassified';
  const row={projectId:p.id,title:p.title,sector:p.sector,sourceId:ip.id,producerId:p.companyId,
   route:p.route,branch,startWeek:p.startWeek,releaseWeek:p.releaseWeek,status:p.status,
   ownWorkId:s.works.find(w=>w.projectId===p.id)?.id||null,grantId:p.grantId||null};
  branches[branch].push(row);return row;
 });
 const characterMap=new Map();
 for(const p of projects){if(typeof p.leadCharacter!=='string'||!p.leadCharacter.trim())continue;
  const name=p.leadCharacter.trim(),key=name.toLowerCase(),old=characterMap.get(key);
  if(old)old.projectIds.push(p.id);
  else characterMap.set(key,{name,projectIds:[p.id],firstSeenWeek:p.startWeek});
 }
 const characters=[...characterMap.values()].sort((a,b)=>a.firstSeenWeek-b.firstSeenWeek);
 const rights=s.grants.filter(g=>g.ipId===ip.id).map(g=>({grantId:g.id,holderId:g.holderId,
  media:g.media,type:g.type,startWeek:g.startWeek,endWeek:g.endWeek,continuationWeeks:g.continuationWeeks||0,
  approvalRequired:!!g.approvalRequired,status:g.endWeek<=s.week?'expired':g.startWeek>s.week?'upcoming':'active'}));
 const approvals=s.creativeApprovals.filter(a=>rights.some(g=>g.grantId===a.grantId)).map(a=>({approvalId:a.id,grantId:a.grantId,title:a.title,status:a.status,holderId:a.holderId,decidedWeek:a.decidedWeek}));
 const events=[{week:ip.createdWeek,kind:'origin',title:ip.name+' originated',sourceId:ip.id},
  ...projects.map(p=>({week:p.startWeek,kind:'greenlight',title:p.title+' approved',projectId:p.id})),
  ...projects.filter(p=>p.releaseWeek!==null).map(p=>({week:p.releaseWeek,kind:'release',title:p.title+' released',projectId:p.id})),
  ...s.grants.filter(g=>g.ipId===ip.id).map(g=>({week:g.startWeek,kind:'rights',title:g.media+' '+g.type+' started',grantId:g.id}))]
  .sort((a,b)=>a.week-b.week||a.kind.localeCompare(b.kind));
 return {sourceId:ip.id,title:s.franchiseNotes?.[ip.id]?.displayTitle||ip.name,legalTitle:ip.name,characters,sourceSector:ip.sourceSector,underlyingOwnerId:ip.ownerId,description:ip.description,
  editorialNotes:s.franchiseNotes?.[ip.id]||{summary:'',continuity:'flexible',displayTitle:''},projects:rows,branches,rights,approvals,events,
  note:'Auto-generated from actual projects, releases and legal rights; annotations never grant permission or new ownership.'};
}
function editFranchiseBible(s,ipId,details={},actingCompanyId=s.playerId){
 const ip=s.ips.find(i=>i.id===ipId);
 if(!ip||ip.ownerId!==actingCompanyId||!controlledCompanies(s).some(c=>c.id===actingCompanyId))
  throw new Error('Only an authorized source IP owner may edit its Franchise Bible.');
 if(details.displayTitle!==undefined&&(typeof details.displayTitle!=='string'||details.displayTitle.length>80))throw new Error('Invalid editorial display name.');
 if(details.continuity!==undefined&&!['strict','flexible'].includes(details.continuity))throw new Error('Unknown continuity policy.');
 if(details.summary!==undefined&&(typeof details.summary!=='string'||details.summary.length>600))throw new Error('Franchise summary must contain no more than 600 characters.');
 const old=s.franchiseNotes?.[ipId]||{summary:'',continuity:'flexible',displayTitle:''};
 const next={displayTitle:details.displayTitle!==undefined?details.displayTitle.trim().slice(0,80):(old.displayTitle||''),
  summary:details.summary!==undefined?details.summary.trim().slice(0,600):old.summary,
  continuity:details.continuity!==undefined?details.continuity:old.continuity};
 if(!s.franchiseNotes)s.franchiseNotes={};s.franchiseNotes[ipId]=next;
 return {...next};
}
function editFranchiseBranch(s,ipId,projectId,branch,actingCompanyId=s.playerId){
 const ip=s.ips.find(x=>x.id===ipId),p=s.projects.find(x=>x.id===projectId);
 if(!ip||!p||p.ipId!==ipId)throw new Error('Unknown franchise project.');
 if(!FRANCHISE_BRANCHES.includes(branch))throw new Error('Unknown canon branch.');
 if(ip.ownerId!==actingCompanyId||p.companyId!==actingCompanyId||!controlledCompanies(s).some(c=>c.id===actingCompanyId))
  throw new Error('Cannot reclassify unrelated or externally produced works.');
 if(p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
  throw new Error('Creator approval may be binding; do not override creative veto by changing canon.');
 p.franchiseBranch=branch;p.franchiseHistoryComplete=true;p.franchiseBranchEditedWeek=s.week;
 return {projectId,branch,editedWeek:s.week};
}
function franchiseSchedule(s,ipId){
 const b=franchiseBible(s,ipId),rows=b.projects.map(p=>{
  const project=s.projects.find(x=>x.id===p.projectId),remaining=project.status==='active'?
    Math.ceil(Math.max(0,project.weeksTotal-project.weeksDone)/1.1):0;
  const plannedWeek=project.releaseWeek??(project.status==='active'?Math.max(s.week+remaining,project.holdUntilWeek||0):null);
  const grant=project.grantId?s.grants.find(g=>g.id===project.grantId):null;
  return {...p,plannedWeek,rightsRisk:!!(grant&&plannedWeek!==null&&grant.endWeek<=plannedWeek&&grant.endWeek>s.week)};
 });
 const warnings=[];
 const upcoming=rows.filter(r=>r.plannedWeek!==null&&r.plannedWeek>=s.week).sort((a,b)=>a.plannedWeek-b.plannedWeek);
 for(let i=1;i<upcoming.length;i++)if(upcoming[i].plannedWeek-upcoming[i-1].plannedWeek<=6)
   warnings.push({kind:'release-crowding',projectIds:[upcoming[i-1].projectId,upcoming[i].projectId],note:'Linked productions may compete for the same audience attention; consider release spacing.'});
 for(const r of rows)if(r.rightsRisk)warnings.push({kind:'rights-expiry',projectIds:[r.projectId],note:'Check rights authorization before release. A manager cannot override contractual expiry.'});
 return {sourceId:ipId,productions:rows,warnings,historyComplete:rows.every(r=>s.projects.find(p=>p.id===r.projectId).franchiseHistoryComplete!==false)};
}
function franchiseOverview(s,ipId,companyId=s.playerId){
 const f=franchiseFinancial(s,ipId,companyId),linked=s.projects.filter(p=>p.ipId===ipId&&p.companyId===companyId);
 const byMedia={};
 for(const p of linked){if(!byMedia[p.sector])byMedia[p.sector]={projects:0,directContribution:0,realizedRevenue:0};
  const v=byMedia[p.sector];v.projects++;v.directContribution=money(v.directContribution+currentProjectProfit(p));
  v.realizedRevenue=money(v.realizedRevenue+p.directRevenue);
 }
 return {sourceId:ipId,ownerId:f.ownerId,companyId,directContribution:f.directContribution,
  licensingIncome:f.recognizedOwnerLicensingIncome,afterSharedOverhead:f.afterAllocatedOverhead,
  byMedia,linkedProductionCount:linked.length,externalProductionCount:f.externalProjectCount,
  complete:f.isComplete,notes:'External producer sales are not owner revenue. Only recognized contract fees and royalties are added to owner results.'};
}
function franchiseFinancial(s,ipId,companyId=s.playerId){
  const ip=s.ips.find(i=>i.id===ipId);if(!ip)throw new Error('Unknown source IP.');
  const works=s.projects.filter(p=>p.ipId===ipId),owned=works.filter(p=>p.companyId===companyId);
  const directRevenue=money(owned.reduce((n,p)=>n+p.directRevenue,0));
  const directCosts=money(owned.reduce((n,p)=>n+p.directCost-(p.partnerSpend||0)+(p.partnerShareCost||0)+p.royaltyCost,0));
  const allocatedOverhead=money(owned.reduce((n,p)=>n+(p.overheadAttributed||0),0));
  const rightsIncome=ip.ownerId===companyId?(ip.rightsIncome||0):0;
  const directContribution=money(directRevenue-directCosts+rightsIncome);
  return {ipId,companyId,ownerId:ip.ownerId,ownedProjectCount:owned.length,
    externalProjectCount:works.length-owned.length,directProductionRevenue:directRevenue,
    productionCosts:directCosts,recognizedOwnerLicensingIncome:rightsIncome,
    directContribution,allocatedOverhead,afterAllocatedOverhead:money(directContribution-allocatedOverhead),
    isComplete:ip.rightsHistoryComplete===true&&owned.every(p=>p.overheadHistoryComplete===true)};
}
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
function rightsCalendar(s,{companyId=s.playerId,horizonWeeks=52,includeExpired=false}={}){
  if(!company(s,companyId))throw new Error('Unknown company for rights calendar.');
  const horizon=clamp(Number(horizonWeeks)||52,1,5200);
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
  return {companyId:c.id,debts,rights:rightsCalendar(s,{companyId,horizonWeeks:5200,includeExpired:true}),escrows,
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
    const o=obligationExposure(s,c.id),plan=liquidityForecast(s,c.id,13);
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
  const start=latest?(previous?previous.week+1:Math.max(0,latest.week-5)):Math.max(0,s.week-5);
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
      if(!v||!['expense','cashPaid','payableChange'].every(k=>Number.isFinite(v[k]))||v.cashPaid<-.01)
        problems.push(r.id+': invalid '+kind+' settlement amounts');
    }
    const outstanding=snap.closingOutstanding;
    if(!outstanding||!['tax','royalty','interest'].every(k=>Number.isFinite(outstanding[k])&&outstanding[k]>=-.01))
      problems.push(r.id+': invalid closing settlement obligations');
    if(snap.source==='exact-period-counters'&&snap.complete){
      const opening=snap.openingOutstanding;
      if(!opening||!['tax','royalty','interest'].every(k=>Number.isFinite(opening[k])&&opening[k]>=-.01))
        problems.push(r.id+': invalid settlement opening liabilities');
      else for(const k of ['tax','royalty','interest']){
        const v=snap[k];if(!v||!Number.isFinite(v.expense)||!Number.isFinite(v.cashPaid)||!Number.isFinite(v.payableChange))continue;
        if(Math.abs(money(v.expense-v.cashPaid-v.payableChange))>.031||
          Math.abs(money(opening[k]+v.payableChange-outstanding[k]))>.031)
          problems.push(r.id+': settlement liability bridge mismatch for '+k);
      }
    }
    if(r.cashFlow&&Math.abs(r.cashFlow.difference||0)>.031)problems.push(r.id+': historical cash bridge mismatch');
    if(r.balance&&Math.abs(r.balance.difference||0)>.031)problems.push(r.id+': historical balance bridge mismatch');
  }
  return problems;
}

// Immutable snapshots survive journal compaction. Older saves remain explicitly unverified.
function closedSettlementHistory(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for closed settlements.');
  return s.reports.filter(r=>r.companyId===companyId).slice(0,12).map(r=>({
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

// IDs and authority must survive century compaction and portable save/load.
// Inspect live records (not historical cash journals) to reject silent identity
// collisions or orphaned titles/contracts before a corrupt save can be played.
function auditIdentities(s,problems){
  const ids=new Set();let highest=0;
  const record=(object,label)=>{
    if(!object||typeof object.id!=='string'||!object.id) {problems.push(label+': missing stable ID');return;}
    if(ids.has(object.id))problems.push(label+': duplicate ID '+object.id);
    ids.add(object.id);
    const match=object.id.match(/_(\d+)$/);
    if(match)highest=Math.max(highest,Number(match[1]));
  };
  const companyIds=new Set(s.companies.map(c=>c.id));
  const ipIds=new Set(s.ips.map(ip=>ip.id));
  const projectIds=new Set(s.projects.map(p=>p.id));
  const grantIds=new Set(s.grants.map(g=>g.id));
  const workIds=new Set(s.works.map(w=>w.id));
  const escrowIds=new Set(s.escrows.map(e=>e.id));
  record(s.founder,'founder');
  if(!FOUNDER_BACKGROUNDS.includes(s.founder.background)||!FOUNDER_FOCUSES.includes(s.founder.focus)||!Number.isFinite(s.founder.age)||s.founder.age<18||s.founder.age>180)problems.push('Invalid founder career profile');
  if(!Array.isArray(s.employees)||!Array.isArray(s.candidates))problems.push('Missing staff personnel registers');
  for(const e of [...(s.employees||[]),...(s.candidates||[])]){
    record(e,'employee');
    if(!STAFF_TRAITS.includes(e.trait)||!GENRES.includes(e.specialty)||!Number.isFinite(e.skill)||e.skill<50||e.skill>78||!Number.isFinite(e.weeklySalary)||e.weeklySalary<60||e.weeklySalary>400||!Number.isInteger(e.age)||e.age<18||e.age>160||!Number.isInteger(e.enteredWeek)||e.enteredWeek>s.week||!Number.isFinite(e.morale)||e.morale<0||e.morale>100||!Array.isArray(e.history)||e.history.some(h=>h.week>s.week))problems.push(e.id+': invalid employee identity, compensation or history');
    if(e.status==='employed'){const owner=company(s,e.employerId),t=owner?.teams.find(t=>t.id===e.teamId);
      if(!owner||!t||t.leaderId!==e.id||e.contractEndWeek<=s.week||!Number.isInteger(e.hiredWeek))problems.push(e.id+': invalid employee active team or contract');}
    else if(e.employerId||e.teamId)problems.push(e.id+': employee without job still owns a team');
  }
  for(const c of s.companies){
    if(!Array.isArray(c.imprints)||c.imprints.some((i,j)=>i.companyId!==c.id||!GENRES.includes(i.genre)||
      typeof i.name!=='string'||i.name.length<3||i.createdWeek>s.week||i.startFee!==2000||
      c.imprints.slice(0,j).some(x=>x.name===i.name)))problems.push(c.id+': invalid publishing imprint');
  }
  for(const c of s.companies)if(!CULTURES.includes(c.culture)||!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean'||!Number.isFinite(c.staffPolicy.maxSalary)||c.staffPolicy.maxSalary<80||c.staffPolicy.maxSalary>250)problems.push(c.id+': invalid culture or delegated payroll policy');
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee)||s.talentPolicy.maxFee<500||s.talentPolicy.maxFee>5000)problems.push('Invalid freelance delegation authority');
  if(!Array.isArray(s.creatorScouting)||s.creatorScouting.some(x=>!Number.isInteger(x.week)||x.week>s.week||
     !s.specialists.some(t=>t.id===x.personId&&['writer','artist'].includes(t.creatorRole))||x.fee!==1250)||
     new Set(s.creatorScouting.map(x=>x.personId)).size!==s.creatorScouting.length)problems.push('Invalid emerging creator scouting provenance');
  for(const t of s.specialists||[]){
   if(![null,'writer','artist'].includes(t.creatorRole)||!Array.isArray(t.mentorshipHistory)||
      t.mentorshipHistory.some((h,i)=>!Number.isInteger(h.week)||h.week<t.enteredWeek||h.week>s.week||h.cost!==1800||
        !Number.isFinite(h.oldSkill)||!Number.isFinite(h.newSkill)||h.newSkill!==Math.min(96,h.oldSkill+4)||
        t.mentorshipHistory.slice(0,i).some(x=>yearAt(x.week)===yearAt(h.week))))problems.push('Invalid emerging creator fellowship history');
  }
  for(const t of s.specialists||[]){record(t,'external specialist');if(!SPECIALIST_DISCIPLINES.includes(t.discipline)||!Number.isFinite(t.skill)||t.skill<50||t.skill>100||!Number.isFinite(t.fee)||t.fee<=0||!Number.isInteger(t.enteredWeek)||t.enteredWeek>s.week||t.enteredWeek<0||!Number.isInteger(t.completed)||t.completed<0)problems.push(t.id+': invalid specialist identity/fee/history');
   if(t.assignedProjectId){const p=s.projects.find(p=>p.id===t.assignedProjectId);if(!p||p.status!=='active'||p.specialistId!==t.id)problems.push(t.id+': invalid active specialist assignment');}}
  for(const c of s.companies){record(c,'company');for(const t of c.teams||[]){record(t,'team');
   if(t.leaderId&&!s.employees?.some(e=>e.id===t.leaderId&&e.employerId===c.id&&e.teamId===t.id&&e.status==='employed'))problems.push(t.id+': orphaned team employee');
   if(!GENRES.includes(t.specialty)||!Number.isFinite(t.skill)||t.skill<45||t.skill>88||!Array.isArray(t.trainingHistory)||!Array.isArray(t.performanceHistory)||
      t.trainingHistory.some(h=>!Number.isInteger(h.week)||h.week<0||h.week>s.week||!['mentorship','specialize'].includes(h.focus)||!Number.isFinite(h.cost)||h.cost<=0||!GENRES.includes(h.newSpecialty)||!Number.isFinite(h.newSkill)||h.newSkill>88)||
      t.performanceHistory.some(h=>!projectIds.has(h.projectId)||!Number.isInteger(h.week)||h.week> s.week||!SECTORS[h.sector]||!GENRES.includes(h.genre)||h.quality<1||h.quality>100))problems.push(t.id+': invalid training or performance record');
  }}
  for(const b of s.backgroundFirms){
    record(b,'background company');
    if(!SECTORS[b.sector]||b.foundedYear<SECTORS[b.sector].year)problems.push(b.id+': background founding predates medium');
    if(b.active){record(b.active,'background active job');if(!available(b.sector,s.week))problems.push(b.id+': premature minor production');}
    for(const work of b.releases){record(work,'background original');if(work.releaseWeek<(SECTORS[b.sector].year-1)*52)problems.push(work.id+': premature minor release');}
  }
  for(const ip of s.ips){
    record(ip,'IP');
    if(!companyIds.has(ip.ownerId))problems.push(ip.id+': missing legal IP owner');
    for(const workId of ip.works||[])if(!workIds.has(workId))problems.push(ip.id+': missing catalog work '+workId);
  }
  for(const m of s.manuscripts||[]){
    record(m,'manuscript');const ip=s.ips.find(ip=>ip.id===m.ipId);
    if(!ip||ip.ownerId!==m.ownerId||!company(s,m.ownerId)||!Number.isInteger(m.createdWeek)||m.createdWeek>s.week||
      !['available','licensed'].includes(m.status)||!Number.isFinite(m.advance)||m.advance<=0||
      !Number.isFinite(m.royaltyRate)||m.royaltyRate<=0||m.royaltyRate>.35||
      !Number.isFinite(m.agencyRate)||m.agencyRate<0||m.agencyRate>.20||typeof m.creatorApprovalRequired!=='boolean'||
      (m.status==='licensed'&&!s.grants.some(g=>g.id===m.licenseId&&g.ipId===m.ipId&&g.holderId===s.playerId)))
      problems.push(m.id+': invalid manuscript rights provenance');
  }
  for(const o of s.manuscriptOffers||[]){
    record(o,'manuscript offer');const m=s.manuscripts?.find(m=>m.id===o.manuscriptId);
    if(!m||o.ownerId!==m.ownerId||o.buyerId!==s.playerId||
      !['agreed','counter','signed','declined'].includes(o.status)||o.createdWeek>s.week||o.expiresWeek<o.createdWeek||
      [o.proposal,o.counter].filter(Boolean).some(t=>!Number.isFinite(t.agencyRate)||t.agencyRate<0||t.agencyRate>.20||typeof t.approvalRequired!=='boolean')||
      o.status==='signed'&&!s.grants.some(g=>g.id===o.grantId&&g.manuscriptId===m.id))
      problems.push(o.id+': invalid manuscript offer provenance');
  }
  if(s.publishingOutlet){
    const o=s.publishingOutlet;record(o,'publishing outlet');
    if(o.companyId!==s.playerId||typeof o.active!=='boolean'||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Array.isArray(o.catalog)||o.monthlyCost!==500||![o.startupSpent,o.operatingSpent,o.customerGross,o.distributionFees].every(x=>Number.isFinite(x)&&x>=0)||
       o.distributionFees>o.customerGross+.02||
       o.catalog.some((x,i)=>!s.projects.some(p=>p.id===x.projectId&&p.sector==='publishing'&&p.companyId===o.companyId&&p.route!=='contract')||
          !Number.isInteger(x.listedWeek)||x.listedWeek> s.week||o.catalog.slice(0,i).some(y=>y.projectId===x.projectId))||
       o.customerGross>money(s.projects.filter(p=>p.companyId===o.companyId).reduce((n,p)=>n+(p.salesByChannel?.owned||0),0))+.05)
      problems.push('Invalid owned publishing outlet cash, fees or catalog rights');
  }
  for(const p of s.projects){
    record(p,'project');
    if(!companyIds.has(p.companyId))problems.push(p.id+': missing production company');
    if(p.ipId&&!ipIds.has(p.ipId))problems.push(p.id+': missing source IP');
    if(p.grantId&&!grantIds.has(p.grantId))problems.push(p.id+': missing underlying rights grant');
    if(p.escrowId&&!escrowIds.has(p.escrowId))problems.push(p.id+': missing funded commission escrow');
    if(p.sector==='publishing'&&(!Number.isFinite(p.serialReaderMomentum)||p.serialReaderMomentum<.85||p.serialReaderMomentum>1.22||
      !Array.isArray(p.serialEngagementHistory)||p.serialEngagementHistory.some(h=>h.week>s.week||h.momentum<.85||h.momentum>1.22||h.observedGross<0)||
      !Array.isArray(p.serialArcDecisions)||p.serialArcDecisions.some((h,i)=>!['tighten','expand'].includes(h.choice)||h.week<p.startWeek||h.week>s.week||h.cost!==(h.choice==='expand'?900:650)||i>0)||
      !Array.isArray(p.publishingFormatHistory)||!Array.isArray(p.translations)||
      p.publishingFormatHistory.some((h,i)=>!PUBLISHING_TREATMENTS[h.focus]||PUBLISHING_TREATMENTS[h.focus].format!==p.format||
        !Number.isFinite(h.cost)||h.cost!==PUBLISHING_TREATMENTS[h.focus].cost||h.week<p.startWeek||h.week>s.week||
        p.publishingFormatHistory.slice(0,i).some(x=>x.focus===h.focus))||
      p.translations.some((t,i)=>!activeRegions(s).some(r=>r.name===t.region)||!Number.isInteger(t.week)||t.week> s.week||t.cost!==1150||
        p.translations.slice(0,i).some(x=>x.region===t.region))||
      (p.preorderCampaign&&(!Number.isInteger(p.preorderCampaign.week)||p.preorderCampaign.week<p.startWeek||p.preorderCampaign.week>s.week||
        p.preorderCampaign.cost!==900||p.preorderCampaign.paidDeposits!==0||p.preorderCampaign.kind!=='nonbinding-reader-interest'))||
      (p.imprintId&&!company(s,p.companyId)?.imprints?.some(i=>i.id===p.imprintId))||
      !PUBLISHING_CHANNELS.includes(p.publishingChannel)||!['steady','fast','polished',null].includes(p.serialCadence)||
      !p.salesByRegion||!p.salesByChannel||Object.values(p.salesByRegion).some(x=>!Number.isFinite(x)||x<0)||Object.values(p.salesByChannel).some(x=>!Number.isFinite(x)||x<0)||
      !p.salesUnitsByRegion||!p.salesUnitsByChannel||!p.salesUnitsByAudience||!Array.isArray(p.publishingUnitHistory)||typeof p.publishingUnitHistoryComplete!=='boolean'||typeof p.audienceUnitHistoryComplete!=='boolean'||
      [...Object.values(p.salesUnitsByRegion),...Object.values(p.salesUnitsByChannel),...Object.values(p.salesUnitsByAudience)].some(x=>!Number.isInteger(x)||x<0)||
      (p.audienceUnitHistoryComplete?Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0)!==Object.values(p.salesUnitsByAudience).reduce((a,b)=>a+b,0):Object.values(p.salesUnitsByAudience).reduce((a,b)=>a+b,0)>Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0))||
      Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0)!==Object.values(p.salesUnitsByChannel).reduce((a,b)=>a+b,0)||
      p.publishingUnitHistory.some(h=>!Number.isInteger(h.week)||h.week> s.week||!Number.isInteger(h.units)||h.units<0||!Number.isFinite(h.gross)||h.gross<0||!activeRegions(s).some(r=>r.name===h.region)||!PUBLISHING_CHANNELS.includes(h.channel))||
      (p.publishingChannel==='owned'&&(!s.publishingOutlet?.active||!s.publishingOutlet.catalog.some(x=>x.projectId===p.id)))))problems.push(p.id+': invalid publishing channel or sales provenance');
    if(p.clientId&&!companyIds.has(p.clientId))problems.push(p.id+': missing contract client');
    if(p.holdUntilWeek!==null&&(!Number.isInteger(p.holdUntilWeek)||p.holdUntilWeek<p.startWeek||p.holdUntilWeek>s.week+52||(p.status==='released'&&p.releaseWeek<p.holdUntilWeek)||p.route==='contract'))problems.push(p.id+': invalid launch hold');
    if(p.specialistId&&!s.specialists?.some(t=>t.id===p.specialistId&&t.assignedProjectId===p.id))problems.push(p.id+': invalid specialist assignment');
    if(p.specialistAppointments?.length>1||p.specialistAppointments?.some(a=>!s.specialists?.some(t=>t.id===a.specialistId)||!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||!Number.isFinite(a.fee)||a.fee<=0||!SPECIALIST_DISCIPLINES.includes(a.discipline)))problems.push(p.id+': invalid specialist contract history');
    if(!Array.isArray(p.editorialHistory)||typeof p.editorialHistoryComplete!=='boolean'||
      p.editorialHistory.some((h,i)=>!EDITORIAL_ACTIONS[h.kind]||!Number.isInteger(h.week)||h.week<p.startWeek||h.week>s.week||
        h.cost<=0||!Number.isFinite(h.cost)||!Number.isFinite(h.creativeQuality)||!Number.isFinite(h.technicalQuality)||
        h.creativeQuality<1||h.creativeQuality>99||h.technicalQuality<1||h.technicalQuality>99||
        p.editorialHistory.slice(0,i).some(r=>r.kind===h.kind)||p.sector!=='publishing'))
      problems.push(p.id+': invalid editorial activity history');
    if(!Array.isArray(p.creatorCredits)||p.creatorCredits.some(x=>!['team lead','editorial specialist','technical specialist','production specialist'].includes(x.role)||
       ![...s.employees,...(s.specialists||[])].some(e=>e.id===x.personId))||
       (p.status!=='released'&&p.creatorCredits.length>0))problems.push(p.id+': forged creator release credits');
    if(p.releasePlanHistory?.some(a=>!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||(a.targetWeek!==null&&(!Number.isInteger(a.targetWeek)||a.targetWeek<a.week||a.targetWeek>a.week+52))))problems.push(p.id+': invalid release planning history');
  }

  for(const p of s.projects){
    const c=company(s,p.companyId),used=new Set();
    if(p.status==='active'&&p.teamId&&c?.teams&&!c.teams.some(t=>t.id===p.teamId))problems.push(p.id+': active project has no owned team');
    for(const e of p.interventions||[]){
      if(!['revision','polish','scope'].includes(e.kind)||used.has(e.kind)||!Number.isInteger(e.week)||e.week<p.startWeek||e.week>s.week||
        !Number.isFinite(e.spend)||e.spend<0||!Number.isFinite(e.originalBudget)||e.originalBudget<=0||
        !Number.isFinite(e.newBudget)||e.newBudget<=0||!Number.isFinite(e.weeksTotal)||e.weeksTotal<=0||
        !Number.isFinite(e.creativeQuality)||e.creativeQuality<1||e.creativeQuality>100||
        !Number.isFinite(e.technicalQuality)||e.technicalQuality<1||e.technicalQuality>100||
        (e.kind==='scope'&&e.spend!==0)||(e.kind!=='scope'&&e.spend<=0))problems.push(p.id+': invalid intervention history');
      used.add(e.kind);
    }
    for(const t of p.teamChanges||[])if(!Number.isInteger(t.week)||t.week<p.startWeek||t.week>s.week||
      !c?.teams?.some(x=>x.id===t.fromTeamId)||!c.teams.some(x=>x.id===t.toTeamId)||t.fromTeamId===t.toTeamId)
      problems.push(p.id+': invalid team assignment history');
    if(p.teamChanges?.length&&p.status==='active'&&p.teamChanges.at(-1).toTeamId!==p.teamId)
      problems.push(p.id+': latest team assignment disagrees with active project');
  }

  for(const [ipId,note] of Object.entries(s.franchiseNotes||{})){
    const ip=s.ips.find(x=>x.id===ipId);
    if(!ip||!note||typeof note.summary!=='string'||note.summary.length>600||!['strict','flexible'].includes(note.continuity)||(note.displayTitle!==undefined&&(typeof note.displayTitle!=='string'||note.displayTitle.length>80)))
      problems.push(ipId+': invalid optional Franchise Bible note');
  }
  for(const p of s.projects){
    if(p.leadCharacter!==undefined&&(typeof p.leadCharacter!=='string'||p.leadCharacter.length>60))problems.push(p.id+': invalid character history');
    if(p.franchiseBranchEditedWeek!==undefined&&(!Number.isInteger(p.franchiseBranchEditedWeek)||p.franchiseBranchEditedWeek<p.startWeek||p.franchiseBranchEditedWeek>s.week))problems.push(p.id+': invalid canon edit timestamp');
    if(p.franchiseHistoryComplete===true&&p.route!=='contract'&&!FRANCHISE_BRANCHES.includes(p.franchiseBranch))
      problems.push(p.id+': invalid franchise branch');
    if(p.franchiseHistoryComplete===false&&p.franchiseBranch!==null)
      problems.push(p.id+': fabricated legacy canon branch');
  }
  for(const work of s.works){
    record(work,'released work');
    if(!projectIds.has(work.projectId)||!ipIds.has(work.ipId)||!companyIds.has(work.ownerId))problems.push(work.id+': invalid work ownership or source');
  }
  for(const g of s.grants){
    record(g,'rights grant');
    if(!ipIds.has(g.ipId)||!companyIds.has(g.grantorId)||!companyIds.has(g.holderId))problems.push(g.id+': invalid rights owner or holder');
  }
  for(const r of s.remittances){record(r,'distributor remittance');if(!(companyIds.has(r.companyId)||s.backgroundFirms.some(b=>b.id===r.companyId)))problems.push(r.id+': invalid remittance company');}
  for(const e of s.escrows){record(e,'escrow');if(!projectIds.has(e.projectId))problems.push(e.id+': missing commission project');}
  for(const d of s.coProductions||[])record(d,'co-production');
  for(const x of s.coProductionOffers||[])record(x,'negotiated co-production offer');
  for(const o of s.obligations){record(o,'obligation');if(o.projectId&&!projectIds.has(o.projectId))problems.push(o.id+': missing obligation project');}
  for(const a of s.royaltyAccounts||[])record(a,'royalty account');
  for(const o of s.rightsOffers||[])record(o,'negotiated rights offer');
  for(const o of s.commissionOffers||[])record(o,'client commission offer');
  for(const h of s.commissionHistory||[])record(h,'client commission history');
  for(const a of s.creativeApprovals||[])record(a,'creative approval');
  for(const l of s.loans||[]){record(l,'external loan');if(!companyIds.has(l.debtorId))problems.push(l.id+': loan borrower missing');}
  for(const n of s.news)record(n,'news');
  for(const n of s.archivedNews||[])record(n,'archived news');
  for(const a of s.inbox)record(a,'inbox');
  for(const r of s.reports)record(r,'report');
  for(const j of s.ledger)record(j,'journal');
  if(!Number.isInteger(s.sequence)||s.sequence<highest)problems.push('Global ID sequence is behind live records');
}
function audit(s){const problems=[];auditIdentities(s,problems);auditGovernance(s,problems);
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))problems.push('Invalid saved dashboard layout');
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')problems.push('Invalid skip interruption settings');
  for(const x of s.snapshots||[])if(x.historyComplete===true&&(!s.companies.some(c=>c.id===x.companyId)||!Number.isFinite(x.cash)||!Number.isFinite(x.revenue)||!Number.isFinite(x.expense)||!Number.isFinite(x.profit)||!Number.isFinite(x.annualRevenue)||!Number.isFinite(x.annualExpense)||!Number.isFinite(x.annualProfit)||Math.abs(money(x.annualRevenue-x.annualExpense-x.annualProfit))>EPS))problems.push('Invalid historical entity close snapshot');
  for(const r of REGIONS){const v=s.regionalEconomy?.[r.name];if(!v||!Number.isFinite(v.fxRate)||v.fxRate<r.baseFx*.7||v.fxRate>r.baseFx*1.3||!Number.isFinite(v.wageIndex)||v.wageIndex<.7||v.wageIndex>1.65||!Number.isFinite(v.interestIndex)||v.interestIndex<.6||v.interestIndex>1.65)problems.push(r.name+': invalid regional macro indicators');}
  for(const x of s.economicShocks||[])if(!REGIONS.some(r=>r.name===x.region)||!['supply','confidence'].includes(x.kind)||x.week>s.week)problems.push('Invalid historical economic disruption');
  if(!Array.isArray(s.creativeAwards)||!Array.isArray(s.creatorRelations))problems.push('Missing creator history ledger');
  const awardPairs=new Set();
  for(const a of s.creativeAwards||[]){
   const p=s.projects.find(p=>p.id===a.projectId),key=a.year+':'+a.sector;
   if(!p||p.status!=='released'||!Number.isInteger(a.year)||a.year!==yearAt(p.releaseWeek)||
      !SECTORS[a.sector]||p.sector!==a.sector||a.companyId!==p.companyId||
      !Number.isInteger(a.awardedWeek)||a.awardedWeek>s.week||a.awardedWeek<=p.releaseWeek||
      yearAt(a.awardedWeek)!==a.year+1||a.generated!==false||!Number.isFinite(a.score)||
      !Array.isArray(a.creatorIds)||a.creatorIds.some(x=>!p.creatorCredits?.some(c=>c.personId===x))||awardPairs.has(key))
      problems.push('Invalid creative award provenance');
   awardPairs.add(key);
  }
  const knownRelationships=new Set();
  for(const r of s.creatorRelations||[]){
   const key=r.leaderId+':'+r.specialistId;
   if(!s.employees.some(e=>e.id===r.leaderId)||!s.specialists.some(e=>e.id===r.specialistId)||
      !Array.isArray(r.projectIds)||r.projects!==r.projectIds.length||r.projects<1||
      r.projectIds.some(id=>!s.projects.some(p=>p.id===id&&p.status==='released'&&p.creatorCredits?.some(c=>c.personId===r.leaderId)&&p.creatorCredits?.some(c=>c.personId===r.specialistId)))||
      !Number.isInteger(r.lastWeek)||r.lastWeek>s.week||knownRelationships.has(key))problems.push('Invalid creator collaboration lineage');
   knownRelationships.add(key);
  }
  if(!s.coProductionPolicy||typeof s.coProductionPolicy.autoCounter!=='boolean'||
    !Number.isFinite(s.coProductionPolicy.maxCommitment)||s.coProductionPolicy.maxCommitment<1000||s.coProductionPolicy.maxCommitment>25000||
    !Number.isFinite(s.coProductionPolicy.maxShare)||s.coProductionPolicy.maxShare<.10||s.coProductionPolicy.maxShare>.35)
    problems.push('Invalid delegated partner-financing authority');
  for(const o of s.coProductionOffers||[]){
    const p=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    const d=o.projectId?s.coProductions.find(d=>d.projectId===o.projectId):null;
    if(!company(s,o.producerId)||!company(s,o.sponsorId)||o.producerId===o.sponsorId||
      !SECTORS[o.sector]||!['original','adaptation'].includes(o.route)||
      !['counter','accepted','declined','booked'].includes(o.status)||
      !Number.isFinite(o.proposedShare)||o.proposedShare<.05||o.proposedShare>.5||
      !Number.isFinite(o.commitment)||o.commitment<=0||![.2,.3,.4].includes(o.capitalFraction)||
      !Number.isInteger(o.createdWeek)||!Number.isInteger(o.expiresWeek)||o.expiresWeek!==o.createdWeek+12||
      o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
      (o.status==='counter'&&(!Number.isFinite(o.counterShare)||o.counterShare<=o.proposedShare))||
      (['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedShare)||o.acceptedShare<.05||o.acceptedShare>.5))||
      (o.creativeTermsComplete&&(!THEMES.includes(o.theme)||!TARGET_AUDIENCES.includes(o.targetAudience)||
       !CREATIVE_DIRECTIONS.includes(o.direction)||!MARKET_POSITIONINGS.includes(o.positioning)||
       (o.status==='booked'&&p?.creativeHistoryComplete&&Object.entries(pitchFrom(o)).some(([k,v])=>p.pitch?.[k]!==v))))||
      (o.status==='booked'&&(!p||!d||d.offerId!==o.id||o.updatedWeek>o.expiresWeek))||
      (o.status!=='booked'&&!!o.projectId))problems.push(o.id+': invalid negotiated co-production offer');
  }
  if(!s.commissionPolicy||typeof s.commissionPolicy.autoCounter!=='boolean'||
    !Number.isFinite(s.commissionPolicy.maxFee)||s.commissionPolicy.maxFee<500||s.commissionPolicy.maxFee>50000||
    !Number.isFinite(s.commissionPolicy.minMargin)||s.commissionPolicy.minMargin<0||s.commissionPolicy.minMargin>.5)
    problems.push('Invalid delegated commission authority');
  for(const o of s.commissionOffers||[]){
    const linked=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    if(!company(s,o.clientId)||!company(s,o.producerId)||o.clientId===o.producerId||!SECTORS[o.sector]||
       !['counter','accepted','declined','booked'].includes(o.status)||!Number.isFinite(o.proposedFee)||o.proposedFee<500||
       !Number.isFinite(o.baseCost)||o.baseCost<=0||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Number.isFinite(o.size)||o.size<.65||o.size>2.2||typeof o.title!=='string'||!o.title||
       (o.status==='booked'&&(!linked||linked.escrowId===null||linked.companyId!==o.producerId||linked.clientId!==o.clientId||linked.earnedFee!==o.acceptedFee))||
       !Number.isInteger(o.updatedWeek)||o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
       (o.status==='counter'&&o.acceptedFee!==null)||
       (['accepted','booked'].includes(o.status)&&o.acceptedFee!==o.proposedFee&&o.acceptedFee!==o.counterFee)||
       (o.status!=='booked'&&o.projectId)||(['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedFee)||o.acceptedFee<500)))
      problems.push(o.id+': invalid client commission agreement');
  }
  for(const h of s.commissionHistory||[]){const p=s.projects.find(p=>p.id===h.projectId);
    if(!p||h.clientId!==p.clientId||h.producerId!==p.companyId||h.outcome!==(p.status==='cancelled'?'cancelled':'delivered')||
       !['released','cancelled'].includes(p.status)||h.week> s.week)problems.push(h.id+': invalid commission delivery history');
  }
  if(!s.rightsPolicy||typeof s.rightsPolicy.autoRenew!=='boolean' ||!Number.isFinite(s.rightsPolicy.maxFee)||s.rightsPolicy.maxFee<100||s.rightsPolicy.maxFee>2000||![26,52].includes(s.rightsPolicy.extensionWeeks))problems.push('Invalid delegated rights authority');for(const c of [...s.companies,...s.backgroundFirms]){if(Math.abs(companyBalance(c))>EPS)problems.push(c.name+': balance discrepancy '+companyBalance(c));if(c.finance.deferred<-.01||c.finance.payable<-.01||(c.finance.prepaid||0)<-.01||(c.finance.receivable||0)<-.01)problems.push(c.name+': negative obligations or prepaid assets');if(c.teams&&c.teams.length!==c.capacity)problems.push(c.name+': team capacity mismatch');}
  for(const c of s.companies){
    for(const [sector,r] of Object.entries(c.research||{}))if(!SECTORS[sector]||!Number.isFinite(r.spent)||r.spent<2500||r.level!==Math.min(5,Math.floor(r.spent/3000))||r.wave<0||r.updatedWeek>s.week)problems.push(c.id+': invalid research portfolio');
    for(const [sector,r] of Object.entries(c.techLicenses||{}))if(!SECTORS[sector]||r.week>s.week||!Number.isInteger(r.wave)||r.wave<1||r.cost<2500||!available(sector,r.week))problems.push(c.id+': invalid tool license');
  }
  // Group-accounting integrity; founders never inherit rival assets.
  for(const c of s.companies){
    if(c.parentId&&(!company(s,c.parentId)||c.parentId===c.id||company(s,c.parentId).parentId))problems.push(c.name+': illegal or missing parent company');
    const expected=money(s.companies.filter(child=>child.parentId===c.id).reduce((n,child)=>n+(child.investedCapital||0),0));
    if(Math.abs(expected-(c.finance.investment||0))>.031)problems.push(c.name+': parent equity investment does not match subsidiary capital');
    if((c.finance.internalExpense||0)<-.031||(c.finance.internalRevenue||0)<-.031||(c.finance.internalExpense||0)>c.finance.expense+.031||(c.finance.internalRevenue||0)>c.finance.revenue+.031)problems.push(c.name+': invalid intragroup service totals');
  }
  if(s.companies.some(c=>c.parentId===s.playerId)){
    try{const group=consolidatedStatements(s);
      if(Math.abs(group.income.internalRevenueEliminated-group.income.internalExpenseEliminated)>.031)problems.push('Group: internal service income does not equal internal service expense');
      if(Math.abs(group.balance.investmentEliminated-group.balance.subsidiaryCapitalEliminated)>.031)problems.push('Group: parent share capital elimination does not reconcile');
      if(Math.abs(group.balance.difference)>.031)problems.push('Group: consolidated balance does not reconcile');
    }catch(e){problems.push('Group consolidation error: '+e.message);}
  }
  const physicalByCompany=new Map();
  for(const p of s.projects)if(p.printStock){
    const b=p.printStock;
    const ok=isPrintEdition(p)&&p.status==='released'&&Number.isInteger(b.stock)&&b.stock>=0&&
      Number.isInteger(b.printed)&&Number.isInteger(b.sold)&&Number.isInteger(b.returned)&&Number.isInteger(b.writtenOff)&&
      b.stock===b.printed-b.sold+b.returned-b.writtenOff&&Number.isFinite(b.unitCost)&&b.unitCost>0&&
      Number.isFinite(b.price)&&b.price>b.unitCost&&b.printed>=0&&b.sold>=0&&b.returned>=0&&b.writtenOff>=0&&
      b.sold>=b.returned&&b.lastOrderWeek<=s.week&&
      (b.returnQueue||[]).every(q=>Number.isInteger(q.units)&&q.units>0&&Number.isInteger(q.dueWeek)&&q.dueWeek>s.week)&&
      Number.isFinite(b.returnFraction)&&b.returnFraction>=0&&b.returnFraction<1.0000001&&
      Number.isFinite(b.demandEwma)&&b.demandEwma>=0&&
      Math.abs(money(b.printSpend-b.printed*b.unitCost))<EPS&&
      Math.abs(money(b.cogs-(b.sold-b.returned)*b.unitCost))<EPS&&
      Math.abs(money((b.writeOffCost||0)-b.writtenOff*b.unitCost))<EPS;
    if(!ok)problems.push(p.id+': printed copy register inconsistent');
    physicalByCompany.set(p.companyId,money((physicalByCompany.get(p.companyId)||0)+b.stock*b.unitCost));
  }
  for(const c of s.companies){
    if((c.finance.inventory||0)<-.031||Math.abs(money(c.finance.inventory||0)-(physicalByCompany.get(c.id)||0))>EPS)
      problems.push(c.name+': inventory asset not backed by physical stock');
  }
  for(const r of s.remittances)if(r.amount<=0||!Number.isFinite(r.amount)||!Number.isInteger(r.dueWeek)||r.dueWeek<=s.week)problems.push(r.id+': invalid pending distribution receipt');
  for(const c of [...s.companies,...s.backgroundFirms]){
    const pending=money(s.remittances.reduce((total,r)=>total+(r.companyId===c.id?r.amount:0),0));
    if(Math.abs(pending-(c.finance.receivable||0))>.031)problems.push(c.name+': receivable unsupported by distributor remittance');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.overheadAttributed||0)<-.031||(c.finance.overheadBooked||0)<(c.finance.overheadAttributed||0)-.031)problems.push(c.name+': over-attributed company overhead');
  for(const p of s.projects)if((p.overheadAttributed||0)<-.031)problems.push(p.id+': negative overhead allocation');
  for(const p of s.projects)if(!Number.isFinite(p.budgetMultiplier)||p.budgetMultiplier<.7||p.budgetMultiplier>1.3||Math.abs((p.plannedTotal||0)-money(p.budget+p.marketingBudget+(p.interventions||[]).filter(e=>e.kind==='scope').reduce((n,e)=>n+e.originalBudget-e.newBudget,0)))>.031||(p.productionSpend!==null&&(!Number.isFinite(p.productionSpend)||p.productionSpend<0||p.productionSpend>p.directCost+EPS)))problems.push(p.id+': invalid production budget plan');
  for(const c of s.companies){const allocated=money(s.projects.filter(p=>p.companyId===c.id).reduce((sum,p)=>sum+(p.overheadAttributed||0),0));if(Math.abs(allocated-(c.finance.overheadAttributed||0))>.031)problems.push(c.name+': project overhead does not reconcile');}
  for(const p of s.projects){if(p.startWeek<(SECTORS[p.sector].year-1)*52)problems.push(p.title+': before debut');if(p.status==='active'&&p.weeksDone>p.weeksTotal+.01)problems.push(p.title+': overworked');if(p.status==='active'&&p.teamId&&(!company(s,p.companyId)?.teams||!company(s,p.companyId).teams.some(t=>t.id===p.teamId)))problems.push(p.title+': missing team');}
  const activeTeams=new Set();for(const p of s.projects.filter(p=>p.status==='active'&&p.teamId)){if(activeTeams.has(p.teamId))problems.push(p.title+': team double-booked');activeTeams.add(p.teamId);}
  for(const d of s.coProductions||[])if(d.status==='active'){if(activeTeams.has(d.partnerTeamId))problems.push(d.id+': sponsor team double-booked');activeTeams.add(d.partnerTeamId);}
  for(const e of s.escrows||[]){if(e.fee<0||e.held<0||e.held>e.fee||!company(s,e.buyerId)||!company(s,e.sellerId))problems.push(e.id+': invalid funded escrow');if(e.settled&&e.held!==0)problems.push(e.id+': delivery escrow not cleared');if(!e.settled&&Math.abs(e.held+e.advance+(e.milestonePaid||0)-e.fee)>.02)problems.push(e.id+': escrow funding discrepancy');
    const project=s.projects.find(p=>p.id===e.projectId);
    if(!project||project.companyId!==e.sellerId||project.clientId!==e.buyerId||project.route!=='contract'||
      project.earnedFee!==e.fee||project.escrowId!==e.id||
      (project.status==='active'&&e.settled)||(project.status!=='active'&&!e.settled))
      problems.push(e.id+': escrow does not match contracted production');
    if(!Number.isFinite(e.milestonePaid)||e.milestonePaid<0||!Number.isFinite(e.milestoneAt)||e.milestoneAt<0||
      (e.milestoneDone&&e.milestonePaid<=0)||(!e.milestoneDone&&e.milestonePaid>0))problems.push(e.id+': invalid service milestone history');}
  for(const p of s.projects||[]){
    if(p.pitch!==null&&p.pitch!==undefined&&(!THEMES.includes(p.pitch.theme)||!TARGET_AUDIENCES.includes(p.pitch.targetAudience)||
       !CREATIVE_DIRECTIONS.includes(p.pitch.direction)||!MARKET_POSITIONINGS.includes(p.pitch.positioning)||
       ![p.creativeQuality,p.technicalQuality,p.quality].every(x=>Number.isFinite(x)&&x>=1&&x<=100)))
      problems.push(p.id+': invalid creative project specifications');
    if(p.creativeHistoryComplete&&(!Array.isArray(p.phaseHistory)||!p.phaseHistory.length||
       !['concept','production','polish','released'].includes(p.phase)||
       p.phaseHistory.some(x=>!Number.isInteger(x.week)||x.week<p.startWeek||x.week>s.week||!['concept','production','polish','released'].includes(x.phase))))
      problems.push(p.id+': invalid milestone history');
  }
  for(const d of s.coProductions||[]){
    const p=s.projects.find(p=>p.id===d.projectId),owner=company(s,d.producerId),sponsor=company(s,d.sponsorId);
    const amounts=['commitment','held','spent','refunded','shareAccrued','sharePaid','capitalFraction','revenueShare'];
    if(!p||!owner||!sponsor||p.coProductionId!==d.id||p.companyId!==owner.id||p.clientId||p.route==='contract'||
      d.sector!==p.sector||owner.id===sponsor.id||owner.parentId||sponsor.parentId||!sponsor.capabilities[d.sector]||
      !sponsor.teams?.some(t=>t.id===d.partnerTeamId)||
      !['active','released','cancelled'].includes(d.status)||d.status!==p.status&&!(p.status==='released'&&d.status==='released')||
      !amounts.every(k=>Number.isFinite(d[k])&&d[k]>=0)||
      ![.2,.3,.4].includes(d.capitalFraction)||
      (d.offerId?!s.coProductionOffers.some(o=>o.id===d.offerId&&o.status==='booked'&&o.projectId===p.id&&o.producerId===d.producerId&&o.sponsorId===d.sponsorId&&o.commitment===d.commitment&&o.acceptedShare===d.revenueShare):Math.abs(d.revenueShare-money(d.capitalFraction*.7))>.001)||
      Math.abs(d.commitment-money(p.plannedTotal*d.capitalFraction))>.031||
      Math.abs(d.commitment-money(d.held+d.spent+d.refunded))>.031||
      Math.abs((p.partnerSpend||0)-d.spent)>.031||
      d.sharePaid>d.shareAccrued+.001||Math.abs((p.partnerShareCost||0)-d.shareAccrued)>.031||
      (p.status==='active'&&(d.status!=='active'||d.closedWeek!==null))||
      (p.status!=='active'&&(d.held!==0||d.closedWeek===null)))
      problems.push(d.id+': co-production agreement/ownership/escrow audit failed');
  }
  for(const p of s.projects){
    if(p.coProductionId&&!s.coProductions.some(d=>d.id===p.coProductionId))problems.push(p.id+': missing sponsoring agreement');
    if(p.sponsoredSectorEntry){const d=s.coProductions.find(d=>d.id===p.coProductionId);
      const sponsor=company(s,p.sectorEntrySponsorId);
      if(!d||d.sponsorId!==p.sectorEntrySponsorId||!sponsor||!sponsor.capabilities[p.sector]||
         d.sector!==p.sector||d.signedWeek<((SECTORS[p.sector]?.year||999)-1)*52)
        problems.push(p.id+': missing or unauthorized specialist industry-entry partner');
    }
  }
  for(const c of s.companies){
    const unearned=(s.escrows||[]).filter(e=>e.buyerId===c.id&&!e.settled).reduce((total,e)=>total+e.fee,0);
    const sponsored=(s.coProductions||[]).filter(d=>d.sponsorId===c.id).reduce((total,d)=>total+d.held,0);
    if(Math.abs((c.finance.prepaid||0)-money(unearned+sponsored))>.031)problems.push(c.name+': reserved client/partner capital does not reconcile with prepaid assets');
    const partnerDue=money((s.coProductions||[]).filter(d=>d.producerId===c.id).reduce((n,d)=>n+d.shareAccrued-d.sharePaid,0));
    if(partnerDue>c.finance.payable+.031)problems.push(c.name+': partner profit participation exceeds accrued liabilities');
  }
  // Legal rights checks operate on the single persistent grant register. They
  // validate history too: a stale overlapping exclusive contract is not cured
  // merely because both grants have expired by the audit date.
  const bySourceMedium=new Map();
  for(const g of s.grants){
    const ip=s.ips.find(x=>x.id===g.ipId),grantor=company(s,g.grantorId),holder=company(s,g.holderId);
    const key=g.ipId+':'+g.media;
    if(!ip||!grantor||!holder||ip.ownerId!==g.grantorId||g.grantorId===g.holderId)
      problems.push(g.id+': rights grantor must own source IP and parties must differ');
    if(!SECTORS[g.media]||!['option','license'].includes(g.type)||!Number.isInteger(g.startWeek)||!Number.isInteger(g.endWeek)||g.startWeek<0||g.endWeek<=g.startWeek||
      !Number.isFinite(g.royaltyRate)||g.royaltyRate<0||g.royaltyRate>1||!Number.isFinite(g.recoupableAdvance)||g.recoupableAdvance<0||g.recoupableAdvance>(g.fee||0)+EPS||!Number.isInteger(g.continuationWeeks)||g.continuationWeeks<0)
      problems.push(g.id+': invalid rights interval or contract terms');
    if(g.type==='option'&&g.allowsProduction)problems.push(g.id+': unexercised option cannot authorize production');
    if((g.renewalAutoAttemptedEnd!==undefined&&(!Number.isInteger(g.renewalAutoAttemptedEnd)||g.renewalAutoAttemptedEnd<s.week-10000||g.renewalAutoAttemptedEnd>g.endWeek))||
       !Number.isFinite(g.exerciseFee)||g.exerciseFee<0||g.exerciseFeePaid<0||
       (g.type==='option'&&g.exercisedWeek!==null)||
       (g.type==='option'&&g.optionExpiresWeek!==g.endWeek)||
       (g.type==='license'&&g.exercisedWeek!==null&&(!Number.isInteger(g.exercisedWeek)||g.exercisedWeek<0||g.exercisedWeek>s.week||g.exerciseFeePaid!==g.exerciseFee))||
       typeof g.approvalRequired!=='boolean'||!Array.isArray(g.renewalHistory))
       problems.push(g.id+': invalid grant option exercise history or approval terms');
    if(g.type==='license'&&(!g.allowsProduction||!available(g.media,g.startWeek)))
      problems.push(g.id+': rights license cannot authorize production before global debut');
    const others=bySourceMedium.get(key)||[];
    for(const other of others)if((g.exclusive||other.exclusive)&&g.startWeek<other.endWeek&&other.startWeek<g.endWeek)
      problems.push(g.id+': exclusive rights interval overlap with '+other.id);
    others.push(g);bySourceMedium.set(key,others);
  }
  for(const offer of s.rightsOffers||[]){
    const g=s.grants.find(g=>g.id===offer.grantId),ip=s.ips.find(i=>i.id===offer.ipId);
    if(!['option','renewal'].includes(offer.kind)||!['counter','accepted','declined'].includes(offer.status)||
      !ip||ip.ownerId!==offer.grantorId||!company(s,offer.holderId)||offer.holderId===offer.grantorId||
      !SECTORS[offer.media]||!Number.isInteger(offer.createdWeek)||offer.createdWeek>s.week||
      !offer.proposal||!Number.isFinite(offer.proposal.fee)||offer.proposal.fee<100||
      offer.status==='counter'&&!offer.counter||offer.status==='accepted'&&(!g||g.ipId!==offer.ipId||g.grantorId!==offer.grantorId||g.holderId!==offer.holderId||g.media!==offer.media))
      problems.push(offer.id+': invalid bilateral rights offer record');
  }
  for(const g of s.grants||[])if(g.manuscriptId&&(
    !Number.isFinite(g.agentRate)||g.agentRate<0||g.agentRate>.20||!Number.isFinite(g.agentFeesPaid)||g.agentFeesPaid<0||
    g.agentFeesPaid>money((s.royaltyAccounts||[]).filter(a=>a.grantId===g.id).reduce((n,a)=>n+a.paid,0)*g.agentRate)+.10))
    problems.push(g.id+': invalid author agency cash statement');
  for(const req of s.creativeApprovals||[]){const g=s.grants.find(g=>g.id===req.grantId);
    const linked=req.launched?s.projects.find(p=>p.id===req.launched):null;
    if(!g||!g.approvalRequired||g.grantorId!==req.grantorId||g.holderId!==req.holderId||
      !GENRES.includes(req.genre)||typeof req.title!=='string'||!req.title||
      !['pending','approved','rejected'].includes(req.status)||!Number.isInteger(req.requestedWeek)||req.requestedWeek>s.week||
      (req.launched&&(!linked||linked.approvalId!==req.id||linked.companyId!==req.holderId||linked.grantId!==req.grantId||linked.title!==req.title||linked.genre!==req.genre||req.status!=='approved'))||
      (req.status==='pending'&&(req.decidedWeek!==null||req.decidedBy!==null))||
      (req.status!=='pending'&&(req.decidedBy!==req.grantorId||!Number.isInteger(req.decidedWeek)||req.decidedWeek<req.requestedWeek||req.decidedWeek>s.week)))
      problems.push(req.id+': invalid binding creative decision');
  }
  for(const p of s.projects)if(p.grantId){
    const grant=s.grants.find(g=>g.id===p.grantId);
    if(!grant||p.route!=='adaptation'||grant.ipId!==p.ipId||grant.media!==p.sector||
      grant.holderId!==p.companyId||grant.type!=='license'||!grant.allowsProduction||
      p.startWeek<grant.startWeek||p.startWeek>=grant.endWeek)
      problems.push(p.id+': project rights grant does not authorize its production');
    if(grant?.approvalRequired&&!s.creativeApprovals.some(req=>req.id===p.approvalId&&req.grantId===grant.id&&req.holderId===p.companyId&&req.status==='approved'&&req.launched===p.id&&req.title===p.title&&req.genre===p.genre&&req.decidedWeek<=p.startWeek))
      problems.push(p.id+': unapproved adaptation violates contractual creator veto');
  }
  for(const c of s.companies){
    const register=activeObligationRegister(s,c.id);
    if(Math.abs(register.reconciliation.loanDifference)>EPS)problems.push(c.name+': active bank loan liability register mismatch');
    if(Math.abs(register.reconciliation.payableDifference)>EPS||register.totals.allLiabilities<-.01)problems.push(c.name+': active payable obligation register fails financial reconciliation');
  }

  for(const o of s.obligations||[]){
    const project=s.projects.find(p=>p.id===o.projectId);
    const grant=project?.grantId?s.grants.find(g=>g.id===project.grantId):null;
    if(o.kind!=='royalty'||!Number.isFinite(o.amount)||o.amount<=0||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !company(s,o.debtorId)||!company(s,o.creditorId)||o.debtorId===o.creditorId||
       (o.projectId&&!project)||(project&&project.companyId!==o.debtorId)||(grant&&(grant.grantorId!==o.creditorId||grant.holderId!==o.debtorId))||!grant||o.grantId!==grant.id||!s.royaltyAccounts.some(a=>a.id===o.accountId&&a.grantId===grant.id&&a.projectId===o.projectId))
      problems.push(o.id+': invalid royalty obligation provenance');
  }
  // A royalty contract must have precisely one source account for each
  // production; the legally enforceable unpaid portion must match the claims
  // still owed after old journals have been compacted.
  const byGrant=new Map();
  for(const a of s.royaltyAccounts||[]){
    const p=s.projects.find(p=>p.id===a.projectId),g=s.grants.find(g=>g.id===a.grantId);
    const claims=money(s.obligations.filter(o=>o.accountId===a.id).reduce((n,o)=>n+o.amount,0));
    const numeric=['openingOutstanding','salesBase','accrued','recouped','paid','outstanding'];
    if(!p||!g||p.grantId!==g.id||p.companyId!==a.debtorId||g.grantorId!==a.creditorId||
      !numeric.every(k=>Number.isFinite(a[k])&&a[k]>=-.001)||
      Math.abs(money(a.openingOutstanding+a.accrued-a.recouped-a.paid-a.outstanding))>EPS||
      Math.abs(money(claims-a.outstanding))>EPS||!Number.isInteger(a.createdWeek)||a.createdWeek>s.week||
      !Number.isInteger(a.updatedWeek)||a.updatedWeek>s.week||a.createdWeek>a.updatedWeek)
      problems.push(a.id+': royalty account source/recoupment/recovery reconciliation invalid');
    if(a.historyComplete===true&&Math.abs(money(p.royaltyCost-a.accrued+a.recouped))>EPS)
      problems.push(a.id+': exact project royalty charge differs from contract statement');
    const group=byGrant.get(a.grantId)||[];group.push(a);byGrant.set(a.grantId,group);
  }
  for(const [grantId,accounts] of byGrant){
    const g=s.grants.find(g=>g.id===grantId);
    if(accounts.length!==new Set(accounts.map(a=>a.projectId)).size ||
       money(accounts.reduce((n,a)=>n+a.recouped,0))>(g?.recoupableAdvance||0)+EPS)
      problems.push(grantId+': duplicate royalty account or excessive recoupment');
  }
  for(const loan of s.loans||[]){
    const valid=Number.isFinite(loan.originalPrincipal)&&loan.originalPrincipal>=5000&&Number.isFinite(loan.principalOutstanding)&&loan.principalOutstanding>=0&&Number.isFinite(loan.principalPaid)&&loan.principalPaid>=0&&Math.abs(loan.originalPrincipal-loan.principalOutstanding-loan.principalPaid)<EPS&&Number.isFinite(loan.interestArrears)&&loan.interestArrears>=0&&Number.isFinite(loan.principalArrears)&&loan.principalArrears>=0&&loan.principalArrears<=loan.principalOutstanding+EPS&&Number.isInteger(loan.installmentsDue)&&loan.installmentsDue>=0&&loan.installmentsDue<=24&&loan.createdWeek<=s.week&&Number.isFinite(loan.interestRate)&&loan.interestRate>=0&&loan.interestRate<=.5&&Number.isFinite(loan.interestCharged)&&Number.isFinite(loan.interestPaid)&&loan.interestPaid>=0&&Math.abs(loan.interestCharged-loan.interestPaid-loan.interestArrears)<EPS&&Number.isInteger(loan.missedPeriods)&&loan.missedPeriods>=0&&['current','delinquent','paid'].includes(loan.status)&&((loan.status==='paid'&&loan.principalOutstanding===0&&loan.interestArrears===0)||(loan.status==='delinquent'&&(loan.principalArrears>0||loan.interestArrears>0))||(loan.status==='current'&&loan.principalOutstanding>0&&loan.principalArrears===0&&loan.interestArrears===0));
    if(!valid)problems.push(loan.id+': invalid loan servicing or balance');
  }
  for(const c of s.companies){
    const contracts=(s.loans||[]).filter(l=>l.debtorId===c.id);
    if(Math.abs(contracts.reduce((v,l)=>v+l.principalOutstanding,0)-(c.finance.loanBalance||0))>EPS)problems.push(c.name+': loan liability is not backed by active bank debt');
    if(Math.abs(contracts.reduce((v,l)=>v+l.interestArrears,0)-(c.finance.interestPayable||0))>EPS)problems.push(c.name+': accrued interest does not match bank debt');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.taxPayable||0)<-.01||(c.finance.interestPayable||0)<-.01||(c.finance.loanBalance||0)<-.01||(c.finance.taxPayable||0)+(c.finance.interestPayable||0)+outstandingRoyaltyDebt(s,c.id)>c.finance.payable+.031)problems.push(c.name+': statutory/royalty obligations exceed payable liability');
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.creditCarry||0)<-.01||(c.finance.periodCreditEarned||0)<-.01)problems.push(c.name+': invalid tax credit balance');
  for(const c of s.companies)if(outstandingRoyaltyDebt(s,c.id)>c.finance.payable+.031)problems.push(c.name+': royalty debt exceeds payable liability');
  for(const c of s.companies)problems.push(...closedSettlementAudit(s,c.id));
  for(const p of s.projects)if(p.budgetCloseComplete===true&&(!Number.isFinite(p.periodProductionSpend)||p.periodProductionSpend<-.01||p.periodProductionSpend>p.productionSpend+EPS))
    problems.push(p.id+': invalid live production budget movement');
  // Period accounting remains exact even after old journal transactions are
  // compacted. Check both direct/indirect bridges and stored historic closes.
  for(const c of [...s.companies,...s.backgroundFirms]){
    const f=c.finance;
    if(f.periodHistoryComplete===true){
      const o=f.periodOpening;
      if(!o||!Number.isFinite(o.cash))problems.push(c.name+': missing monthly opening position');
      else if(Math.abs(money(o.cash+(f.periodOperatingCash||0)+(f.periodFinancingCash||0)+(f.periodInvestingCash||0)-f.cash))>EPS)
        problems.push(c.name+': live monthly cash flow does not reconcile');
    }
    if(Math.abs(money((f.periodOperatingCash||0)+(f.periodFinancingCash||0)+(f.periodInvestingCash||0)-(f.periodCashIn||0)+(f.periodCashOut||0)))>EPS&&f.periodHistoryComplete===true)
      problems.push(c.name+': monthly receipts/outflows inconsistent');
  }
  for(const r of s.reports){
    if(r.historyComplete!==true)continue; // legacy snapshots never retro-filled
    const flow=r.cashFlow,b=r.balance;
    if(!flow||!b||!Number.isFinite(flow.endingCash)||!Number.isFinite(b.assets)){
      problems.push(r.id+': missing monthly close bridge');continue;
    }
    if(r.budget&&r.budget.historyComplete===true){
      const budget=r.budget;
      if(!Array.isArray(budget.rows)||budget.rows.length!==budget.projectCount)
        problems.push(r.id+': monthly budget rows missing');
      else {
        const sum=k=>money(budget.rows.reduce((v,row)=>v+(row[k]||0),0));
        for(const k of ['approvedTotal','plannedToDate','actualToDate','varianceToDate','plannedPeriod','spentPeriod','variancePeriod','estimatedRemaining']){
          const field={approvedTotal:'approvedBudget',plannedToDate:'plannedToDate',actualToDate:'actualToDate',varianceToDate:'varianceToDate',plannedPeriod:'plannedPeriod',spentPeriod:'spentPeriod',variancePeriod:'variancePeriod',estimatedRemaining:'estimatedRemaining'}[k];
          if(!Number.isFinite(budget[k])||Math.abs(money(budget[k]-sum(field)))>EPS)problems.push(r.id+': monthly budget '+k+' mismatch');
        }
        if(Math.abs(money(budget.spentPeriod-budget.plannedPeriod-budget.variancePeriod))>EPS||budget.spentPeriod>r.expense+EPS)
          problems.push(r.id+': monthly budget period variance invalid');
        for(const row of budget.rows)if(row.historyComplete){
          if(!Number.isFinite(row.approvedBudget)||!Number.isFinite(row.plannedToDate)||!Number.isFinite(row.actualToDate)||
             row.approvedBudget<0||row.plannedToDate<0||row.actualToDate<0||row.plannedToDate>row.approvedBudget+EPS||
             Math.abs(money(row.actualToDate-row.plannedToDate-row.varianceToDate))>EPS||
             Math.abs(money(row.spentPeriod-row.plannedPeriod-row.variancePeriod))>EPS)
            problems.push(r.id+': monthly budget project variance invalid');
        }
      }
    }
    if(Math.abs(money(r.revenue-r.expense-r.net))>EPS)problems.push(r.id+': monthly income statement does not reconcile');
    if(Math.abs(money(flow.openingCash+flow.operating+flow.financing+flow.investing-r.cash))>EPS ||
      Math.abs(money(flow.operating+flow.financing+flow.investing-r.cashIn+r.cashOut))>EPS ||
      Math.abs(money(flow.indirectOperating-flow.operating))>EPS ||
      Math.abs(money(flow.difference))>EPS || Math.abs(money(flow.indirectDifference))>EPS ||
      Math.abs(money(flow.endingCash-r.cash))>EPS)problems.push(r.id+': monthly cash flow does not reconcile');
    if(Math.abs(money(b.cash+b.prepaid+b.receivable+b.investment+(b.inventory||0)-b.assets))>EPS ||
      Math.abs(money(b.deferred+b.payable+b.loanBalance-b.liabilities))>EPS ||
      Math.abs(money(b.assets-b.liabilities-b.equity))>EPS ||
      Math.abs(money(b.difference))>EPS || Math.abs(money(b.cash-r.cash))>EPS)
      problems.push(r.id+': monthly balance does not reconcile');
  }
  // Film contracts, cast exclusivity, ticket estimates and distributor shares.
  if(!Array.isArray(s.filmActors)||!Array.isArray(s.filmHonors))problems.push('Missing film industry ledger');
  for(const c of s.companies)if(c.filmBacklot){const b=c.filmBacklot;if(!Number.isInteger(b.builtWeek)||b.builtWeek>s.week||b.cost!==18500||b.monthlyCost!==620||!Number.isFinite(b.totalUpkeep)||b.totalUpkeep<0)problems.push(c.id+': invalid in-house film facility');
    if(s.projects.filter(p=>p.status==='active'&&p.companyId===c.id&&p.cinema?.facilities==='owned').length>1)problems.push(c.id+': owned film studio double-booked');}
  const activeCast=new Set();
  for(const p of s.projects.filter(p=>p.sector==='movie')){
    const f=p.cinema;
    if(!f||!FILM_METHODS.includes(f.method)||!['G','T','M'].includes(f.rating)||!FILM_DISTRIBUTION.includes(f.distribution)||
      !Array.isArray(f.actions)||!Array.isArray(f.screenings)||!Array.isArray(f.weeklyBoxOffice)||
      f.weeklyBoxOffice.some(x=>!Number.isInteger(x.week)||x.week<p.releaseWeek&&p.releaseWeek!==null||x.week>s.week||
        !REGIONS.some(r=>r.name===x.region)||!Number.isFinite(x.gross)||x.gross<0||!Number.isInteger(x.estimatedAdmissions)||x.estimatedAdmissions<0)||!Array.isArray(f.auditions)||!Array.isArray(f.disruptions)||
      f.disruptions.some(d=>!Number.isInteger(d.week)||d.week<p.startWeek||d.week>s.week||!Number.isFinite(d.cost)||d.cost<0||d.delay!==2)||!Number.isFinite(f.castPaid)||f.castPaid<0||
      !Number.isFinite(f.castShare)||f.castShare<0||f.castShare>.1||!Number.isFinite(f.castFee)||f.castFee<0||
      Object.values(f.boxOffice||{}).some(n=>!Number.isFinite(n)||n<0)||
      Object.values(f.admissions||{}).some(n=>!Number.isInteger(n)||n<0)||
      Object.values(f.channels||{}).some(n=>!Number.isFinite(n)||n<0)||
      money(Object.values(f.boxOffice||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+.031||
      money(Object.values(f.channels||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+.031)
      problems.push(p.id+': invalid film production/box office records');
    if(f?.facilities==='owned'&&!company(s,p.companyId)?.filmBacklot)problems.push(p.id+': unowned production facility');
    if(f?.premiere&&(!REGIONS.some(r=>r.name===f.premiere.region)||f.premiere.week> s.week||f.premiere.week<p.startWeek||f.premiere.cost!==1400))problems.push(p.id+': invalid film premiere');
    if(f?.castActorId){const a=s.filmActors.find(a=>a.id===f.castActorId);
      if(!a||(p.status==='active'&&a.busyProjectId!==p.id)||p.status!=='active'&&a.busyProjectId===p.id||
        p.status==='active'&&activeCast.has(a.id))problems.push(p.id+': invalid cast exclusivity');
      if(p.status==='active')activeCast.add(f.castActorId);
    }
  }
  for(const a of s.filmActors||[])if(a.busyProjectId&&!s.projects.some(p=>p.id===a.busyProjectId&&p.status==='active'&&(p.sector==='movie'&&p.cinema?.castActorId===a.id||p.sector==='tv'&&p.television?.castActorId===a.id)))problems.push(a.id+': unbacked screen talent exclusivity');
  for(const a of s.filmHonors||[])if(!s.projects.some(p=>p.id===a.projectId&&p.sector==='movie'&&p.status==='released'&&yearAt(p.releaseWeek)===a.year&&p.cinema?.festival?.won)||a.week>s.week)problems.push('Invalid film festival award provenance');
  auditTelevision(s,problems);auditVideoGames(s,problems);
  return problems;}
function loadState(raw){const s=typeof raw==='string'?JSON.parse(raw):raw;
  const oldVersion=s?.version;
  if(s&&oldVersion>=1&&oldVersion<30)initialGovernance(s);
  if([1,2,3,4,5,6,7,8,9,10,11,12].includes(oldVersion)){
    s.rightsOffers=[];s.creativeApprovals=[];s.rightsPolicy={autoRenew:false,maxFee:1500,extensionWeeks:52};
    for(const g of s.grants||[]){
      g.exerciseFee=2400;g.exerciseFeePaid=0;g.optionExpiresWeek=g.type==='option'?g.endWeek:null;
      g.exercisedWeek=null;g.approvalRequired=false;g.renewalHistory=[];
    }
  }
  if([1,2,3,4,5,6,7,8,9,10,11].includes(oldVersion)){
    s.royaltyAccounts=[];
    for(const g of s.grants||[]){g.recoupableAdvance=0;g.royaltyHistoryComplete=false;}
    for(const o of s.obligations||[]){
      const p=(s.projects||[]).find(p=>p.id===o.projectId);
      const g=(s.grants||[]).find(g=>g.id===p?.grantId);
      if(!g)continue; // source/creditor provenance is validated below
      let a=s.royaltyAccounts.find(a=>a.grantId===g.id&&a.projectId===p.id);
      if(!a){a={id:id(s,'royaltyaccount'),grantId:g.id,projectId:p.id,debtorId:o.debtorId,
        creditorId:o.creditorId,createdWeek:s.week,updatedWeek:s.week,openingOutstanding:0,
        salesBase:0,accrued:0,recouped:0,paid:0,outstanding:0,historyComplete:false};s.royaltyAccounts.push(a);}
      a.openingOutstanding=money(a.openingOutstanding+o.amount);
      a.outstanding=money(a.outstanding+o.amount);o.accountId=a.id;o.grantId=g.id;
    }
  }
  if([1,2,3,4,5,6,7,8,9,10].includes(oldVersion)){
    // The old bounded journal cannot prove duty allocation for an in-flight
    // month. No historic amounts or balances are invented during migration.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      c.finance.periodDuty=emptyDutyFlows();c.finance.periodDutyOpening={tax:0,royalty:0,interest:0};
      c.finance.periodDutyComplete=false;
      if(!c.homeRegion)c.homeRegion=REGIONS[0].name;
    }
  }
  if([1,2,3,4,5,6,7,8].includes(oldVersion)){
    // Existing current-month activity predates transaction cash classification.
    // Carry the exact balance, mark ONLY the first closing incomplete, and
// start a complete period from the next monthly boundary.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      resetPeriodBridge(c.finance);c.finance.periodHistoryComplete=false;
    }
  }
  if([1,2,3,4,5,6].includes(oldVersion)){
    s.loans=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.loanBalance=0;c.finance.interestPayable=0;}
  }
  if([1,2,3,4,5].includes(oldVersion)){
    for(const c of s.companies||[]){c.parentId=null;c.investedCapital=0;}
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.investment=0;c.finance.internalRevenue=0;c.finance.internalExpense=0;}
  }
  if([1,2,3,4].includes(oldVersion)){
    // No fabricated retroactive allocations or rights income: earlier records
    // remain complete for their own cash/direct result, not the new breakdown.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.overheadBooked=0;c.finance.overheadAttributed=0;}
    for(const p of s.projects||[]){p.overheadAttributed=0;p.overheadHistoryComplete=false;}
    for(const ip of s.ips||[]){ip.rightsIncome=0;ip.rightsHistoryComplete=false;}
  }
  if([1,2,3].includes(oldVersion)){
    // Legacy sales already arrived in cash, and must NOT be re-invoiced.
    s.remittances=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance)c.finance.receivable=0;
  }
  if([1,2,3,4,5,6,7,8].includes(oldVersion)){
    // Old works had no print register; NEVER create a fictitious asset or
    // retroactively cap sales of a title already published under the old model.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      if(!Number.isFinite(c.finance.inventory))c.finance.inventory=0;
      if(c.finance.periodOpening&&!Number.isFinite(c.finance.periodOpening.inventory))c.finance.periodOpening.inventory=0;
    }
    for(const r of s.reports||[])if(r.balance&&!Number.isFinite(r.balance.inventory))r.balance.inventory=0;
    for(const p of s.projects||[])if(!('printStock' in p))p.printStock=null;
  }
  if([1,2,3,4,5,6,7,8,9].includes(oldVersion))for(const p of s.projects||[])if(p.printStock){
    if(typeof p.printStock.autoReprint!=='boolean')p.printStock.autoReprint=true;
    if(!Array.isArray(p.printStock.returnQueue))p.printStock.returnQueue=[];
    if(!Number.isFinite(p.printStock.returnFraction))p.printStock.returnFraction=0;
    if(typeof p.printStock.closed!=='boolean')p.printStock.closed=false;
    if(!Number.isFinite(p.printStock.demandEwma))p.printStock.demandEwma=0;
  }
  if(!Array.isArray(s.gameExclusiveOffers))s.gameExclusiveOffers=[];
  if(!Array.isArray(s.gameStores))s.gameStores=[];if(!Array.isArray(s.gameStoreOffers))s.gameStoreOffers=[];if(!Array.isArray(s.gameStoreWindows))s.gameStoreWindows=[];if(!Array.isArray(s.gameCommunityHistory))s.gameCommunityHistory=[];
  for(const p of s.projects||[])if(p.sector==='games'&&!p.videoGame){p.videoGame=gameDefault(p,p.startWeek);p.videoGame.historyComplete=false;}
  if(!Array.isArray(s.tvHonors))s.tvHonors=[];
  if(!Array.isArray(s.tvCastRelations))s.tvCastRelations=[];
  if(!Array.isArray(s.streamingServices))s.streamingServices=[];
  if(!Array.isArray(s.streamingWindows))s.streamingWindows=[];
  if(!Array.isArray(s.streamingOffers))s.streamingOffers=[];
  for(const p of s.projects||[])if(p.sector==='tv'){
   if(!p.television){p.television=tvDefault(p);p.television.ratingsHistoryComplete=false;}
   if(!p.television.viewersByCohort){p.television.viewersByCohort={};p.television.audienceCohortHistoryComplete=false;}
 }
  if(s?.projects)for(const p of s.projects){
    if(!Number.isFinite(p.plannedTotal))p.plannedTotal=money(p.budget+p.marketingBudget);
    if(!Number.isFinite(p.budgetMultiplier))p.budgetMultiplier=1;
    if(!('productionSpend' in p)){p.productionSpend=p.status==='active'?p.directCost:null;p.budgetHistoryComplete=p.status==='active';}
    if(typeof p.budgetHistoryComplete!=='boolean')p.budgetHistoryComplete=p.productionSpend!==null;
    if(typeof p.budgetAlerted!=='boolean')p.budgetAlerted=false;
    if(!Number.isFinite(p.periodProductionSpend))p.periodProductionSpend=0;
    if(!Number.isFinite(p.lastClosedPlannedSpend))p.lastClosedPlannedSpend=plannedProjectSpend(p)||0;
    if(typeof p.budgetCloseComplete!=='boolean')p.budgetCloseComplete=false;
  }
  if(s&&!Array.isArray(s.archivedNews))s.archivedNews=[];
  if(s&&!Array.isArray(s.backgroundFirms))s.backgroundFirms=[]; // older v3 worlds remain intact
  if(s?.settings&&!WORLD_SCALES[s.settings.worldScale])s.settings.worldScale=1;
  if(s?.settings){
    if(!CAPITAL_PRESETS[s.settings.startingCapital])s.settings.startingCapital='standard';
    if(!WORLD_MATURITY[s.settings.worldMaturity])s.settings.worldMaturity='standard';
    if(!Number.isInteger(s.settings.aiCount)||s.settings.aiCount<1||s.settings.aiCount>12)s.settings.aiCount=DEFAULT_RIVAL_COUNTS[s.startedYear]||9;
    if(!POPULATION_SCALES.includes(s.settings.populationScale))s.settings.populationScale=1;
    if(![2,3,4].includes(s.settings.regionCount))s.settings.regionCount=4;
    if(!TECH_PACES[s.settings.discoveryPace])s.settings.discoveryPace='standard';
    if(!ADOPTION_PACES[s.settings.adoptionPace])s.settings.adoptionPace='standard';
    if(!CAPABILITY_PACES[s.settings.capabilityPace])s.settings.capabilityPace='standard';
  }
  // v15 and earlier funded jobs keep their original advance/final split.
  // Never fabricate a halfway payment into preexisting balance sheets.
  for(const e of s.escrows||[]){
    if(!Number.isFinite(e.milestonePaid))e.milestonePaid=0;
    if(typeof e.milestoneDone!=='boolean')e.milestoneDone=false;
    if(!Number.isFinite(e.milestoneAt))e.milestoneAt=0;
  }
  if(oldVersion<19&&Array.isArray(s.projects))for(const p of s.projects){
    p.creativeHistoryComplete=false; // legacy project choices were never recorded; do not invent them
    if(!('pitch' in p))p.pitch=null;
    if(!('creativeQuality' in p))p.creativeQuality=null;
    if(!('technicalQuality' in p))p.technicalQuality=null;
    if(!('creativeHistoryComplete' in p))p.creativeHistoryComplete=false;
    if(!('phase' in p))p.phase=null;
    if(!('phaseHistory' in p))p.phaseHistory=[];
    if(!('criticScore' in p))p.criticScore=null;
    if(!('audienceScore' in p))p.audienceScore=null;
  }
  for(const p of s.projects||[]){if(!Array.isArray(p.interventions))p.interventions=[];if(!Array.isArray(p.teamChanges))p.teamChanges=[];}
  if(!Array.isArray(s.specialists))s.specialists=[];
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee))s.talentPolicy={autoBook:false,maxFee:2100};
  seedSpecialists(s);
  for(const x of s.specialists)if(x.assignedProjectId===undefined)x.assignedProjectId=null;
  for(const p of s.projects||[]){if(p.holdUntilWeek===undefined)p.holdUntilWeek=null;if(!Array.isArray(p.releasePlanHistory))p.releasePlanHistory=[];if(p.specialistId===undefined)p.specialistId=null;if(!Array.isArray(p.specialistAppointments))p.specialistAppointments=[];}
  if(!s.franchiseNotes||typeof s.franchiseNotes!=='object')s.franchiseNotes={};
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))s.dashboardFocus='operations';
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')s.pausePolicy={stopForAdvisory:false};
  for(const c of s.companies||[]){if(!('annualBaseline' in c))c.annualBaseline=null;for(const t of c.teams||[]){if(!Array.isArray(t.trainingHistory))t.trainingHistory=[];if(!Array.isArray(t.performanceHistory))t.performanceHistory=[];}}
  // A pre-team v1/v2 save has no existing employee roster. Do not keep
  // orphaned modern leader IDs from a synthetic old-save fixture.
  if(oldVersion<=2&&s.companies.some(c=>!Array.isArray(c.teams)))s.employees=[];
  if(!Array.isArray(s.employees))s.employees=[];if(!Array.isArray(s.candidates))s.candidates=[];
  for(const c of s.companies||[]){
    if(!CULTURES.includes(c.culture))c.culture='balanced';
    if(!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean')c.staffPolicy={autoFill:true,maxSalary:180};
    if(!Array.isArray(c.imprints))c.imprints=[];
    for(const t of c.teams||[])if(!t.leaderId){assignInitialLeader(s,c,t,true);}
  }
  if(oldVersion<23)seedCandidates(s,14);
  if(!FOUNDER_BACKGROUNDS.includes(s.founder.background))s.founder.background='editorial';
  if(!FOUNDER_FOCUSES.includes(s.founder.focus))s.founder.focus='creative';
  if(!Number.isInteger(s.founder.ageAtEntry))s.founder.ageAtEntry=s.founder.age;
  if(!Number.isInteger(s.founder.enteredWeek))s.founder.enteredWeek=s.week;
  if(!Number.isInteger(s.founder.experience))s.founder.experience=0;
  if(typeof s.founder.retirementNoted!=='boolean')s.founder.retirementNoted=false;
  for(const x of s.snapshots||[]){if(!('historyComplete' in x))x.historyComplete=false;if(!('annualRevenue' in x))x.annualRevenue=null;if(!('annualExpense' in x))x.annualExpense=null;if(!('annualProfit' in x))x.annualProfit=null;}

  if(!Array.isArray(s.filmActors))s.filmActors=[];if(!Array.isArray(s.filmHonors))s.filmHonors=[];
  for(const p of s.projects||[])if(p.sector==='movie'&&!p.cinema){p.cinema=filmDefault(p);p.cinema.historyComplete=false;}
  for(const c of s.companies)if(c.filmBacklot===undefined)c.filmBacklot=null;
  for(const p of s.projects||[])if(p.sector==='movie'&&p.cinema&&!Array.isArray(p.cinema.disruptions))p.cinema.disruptions=[];
  for(const p of s.projects||[])if(p.sector==='movie'&&p.cinema){if(!Array.isArray(p.cinema.weeklyBoxOffice)){p.cinema.weeklyBoxOffice=[];p.cinema.boxOfficeHistoryComplete=false;}if(!Array.isArray(p.cinema.auditions))p.cinema.auditions=[];}
  if(!Array.isArray(s.manuscripts))s.manuscripts=[];
  if(!Array.isArray(s.manuscriptOffers))s.manuscriptOffers=[];
  if(oldVersion<26){
    s.publishingOutlet=null;
    for(const m of s.manuscripts){if(!Number.isFinite(m.agencyRate))m.agencyRate=0;if(typeof m.creatorApprovalRequired!=='boolean')m.creatorApprovalRequired=false;}
    for(const offer of s.manuscriptOffers){for(const terms of [offer.proposal,offer.counter])if(terms){if(!Number.isFinite(terms.agencyRate))terms.agencyRate=0;if(typeof terms.approvalRequired!=='boolean')terms.approvalRequired=false;}}
    for(const g of s.grants){if(!Number.isFinite(g.agentRate))g.agentRate=0;if(!Number.isFinite(g.agentFeesPaid))g.agentFeesPaid=0;}
  }
  for(const p of s.projects||[]){
    if(p.publishingChannel===undefined)p.publishingChannel=p.sector==='publishing'?(isPrintEdition(p)?'mixed':'digital'):null;
    if(p.serialCadence===undefined)p.serialCadence=p.sector==='publishing'&&p.format==='Web Serial'?'steady':null;
    if(!p.salesByRegion)p.salesByRegion={};if(!p.salesByChannel)p.salesByChannel={};
    if(!p.salesUnitsByRegion)p.salesUnitsByRegion={};if(!p.salesUnitsByChannel)p.salesUnitsByChannel={};
    if(oldVersion<26){p.salesUnitsByAudience={};p.audienceUnitHistoryComplete=false;}
    else {if(!p.salesUnitsByAudience)p.salesUnitsByAudience={};if(typeof p.audienceUnitHistoryComplete!=='boolean')p.audienceUnitHistoryComplete=false;}
    if(!Array.isArray(p.publishingUnitHistory))p.publishingUnitHistory=[];
    if(typeof p.publishingUnitHistoryComplete!=='boolean')p.publishingUnitHistoryComplete=oldVersion>=26;
    if(!Number.isFinite(p.serialReaderMomentum))p.serialReaderMomentum=1;
    if(!Array.isArray(p.serialEngagementHistory))p.serialEngagementHistory=[];
    if(!Array.isArray(p.serialArcDecisions))p.serialArcDecisions=[];
    if(!Array.isArray(p.publishingFormatHistory))p.publishingFormatHistory=[];if(!Array.isArray(p.translations))p.translations=[];
    if(!('preorderCampaign' in p))p.preorderCampaign=null;if(!('imprintId' in p))p.imprintId=null;
    if(typeof p.publishingSalesHistoryComplete!=='boolean')p.publishingSalesHistoryComplete=oldVersion>=25;
  }
  if(!Array.isArray(s.creatorScouting))s.creatorScouting=[];
  for(const t of s.specialists||[]){if(t.creatorRole===undefined)t.creatorRole=null;if(!Array.isArray(t.mentorshipHistory))t.mentorshipHistory=[];}
  if(!Array.isArray(s.creativeAwards))s.creativeAwards=[];
  if(!Array.isArray(s.creatorRelations))s.creatorRelations=[];
  if(typeof s.creatorHistoryComplete!=='boolean')s.creatorHistoryComplete=oldVersion>=24;
  for(const p of s.projects||[]){
    if(!Array.isArray(p.editorialHistory))p.editorialHistory=[];
    if(typeof p.editorialHistoryComplete!=='boolean')p.editorialHistoryComplete=oldVersion>=24;
    if(!Array.isArray(p.creatorCredits))p.creatorCredits=[];
  }
  if(oldVersion<20)for(const p of s.projects||[]){if(!('franchiseBranch' in p))p.franchiseBranch=null;if(!('franchiseHistoryComplete' in p))p.franchiseHistoryComplete=false;if(!('leadCharacter' in p))p.leadCharacter='';}
  if(!Array.isArray(s.coProductions))s.coProductions=[];
  if(!Array.isArray(s.coProductionOffers))s.coProductionOffers=[];
  if(!s.coProductionPolicy)s.coProductionPolicy={autoCounter:false,maxCommitment:15000,maxShare:.35};
  for(const d of s.coProductions)if(!('offerId' in d))d.offerId=null;
  if(!Array.isArray(s.commissionOffers))s.commissionOffers=[];
  if(!Array.isArray(s.commissionHistory))s.commissionHistory=[];
  if(!s.commissionPolicy)s.commissionPolicy={autoCounter:false,maxFee:15000,minMargin:.12};
  if(!s.regionalEconomy)s.regionalEconomy=Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:.02,employment:1}]));
  for(const r of REGIONS){
    if(!s.regionalEconomy[r.name])s.regionalEconomy[r.name]={confidence:1,inflation:.02,employment:1};
    const v=s.regionalEconomy[r.name];
    if(!Number.isFinite(v.fxRate))v.fxRate=r.baseFx;
    if(!Number.isFinite(v.wageIndex))v.wageIndex=1;
    if(!Number.isFinite(v.interestIndex))v.interestIndex=1;
  }
  if(!Array.isArray(s.economicShocks))s.economicShocks=[];
  if(s?.companies)for(const c of s.companies){
    if(!c.research)c.research={};
    if(!c.techLicenses)c.techLicenses={};
  }

  if(!Array.isArray(s.marketBriefs))s.marketBriefs=[];
  if(!Array.isArray(s.quarterlyMarketReports))s.quarterlyMarketReports=[];
  if(!s.technology)s.technology={historyComplete:false};
  if(s?.companies)for(const c of [...s.companies,...(s.backgroundFirms||[])]) {
    if(!Number.isFinite(c.finance?.taxPayable))c.finance.taxPayable=0;
    if(!Number.isFinite(c.finance?.creditCarry))c.finance.creditCarry=0;
    if(!Number.isFinite(c.finance?.periodCreditEarned))c.finance.periodCreditEarned=0;
  } // compatible additive v3 history
  if(s&&(s.version===1||s.version===2)&&Array.isArray(s.projects)){
    for(const p of s.projects){if(!('forecast' in p))p.forecast=null;if(!('review' in p))p.review=null;if(!('clientId' in p))p.clientId=null;if(!('escrowId' in p))p.escrowId=null;if(!('teamId' in p))p.teamId=null;}
    if(!s.escrows)s.escrows=[];
    for(const c of s.companies){if(!Number.isFinite(c.finance.prepaid))c.finance.prepaid=0;
      if(!Array.isArray(c.teams)){c.teams=[];for(let i=0;i<c.capacity;i++)c.teams.push(newTeam(s,c,i));}
      const active=s.projects.filter(p=>p.companyId===c.id&&p.status==='active');
      for(let i=0;i<active.length;i++)if(!active[i].teamId&&c.teams[i])active[i].teamId=c.teams[i].id;
    }
    // Historical abstract commissions retain their previous cash and deferred balances;
    // migration must not invent a retroactive client transfer or change earned revenue.
    s.version=SAVE_VERSION;
  }
  if(oldVersion>=1&&oldVersion<30)s.version=SAVE_VERSION;
  if(!s||s.version!==SAVE_VERSION||!Array.isArray(s.companies)||!Array.isArray(s.backgroundFirms)||!Array.isArray(s.remittances)||!Array.isArray(s.loans)||!Array.isArray(s.projects)||!Array.isArray(s.ips)||!Array.isArray(s.grants)||!Array.isArray(s.commissionOffers)||!Array.isArray(s.commissionHistory)||!Array.isArray(s.coProductions)||!Array.isArray(s.coProductionOffers)||!Array.isArray(s.rightsOffers)||!Array.isArray(s.creativeApprovals)||!Array.isArray(s.ledger)||!Array.isArray(s.obligations)||!Array.isArray(s.royaltyAccounts)||!Array.isArray(s.escrows)||!Array.isArray(s.news)||!Array.isArray(s.inbox)||!Array.isArray(s.works)||!Array.isArray(s.reports)||!Number.isInteger(s.week)||!s.companies.some(c=>c.id===s.playerId)||![...s.companies,...s.backgroundFirms].every(c=>c.finance&&Number.isFinite(c.finance.cash)&&Number.isFinite(c.finance.prepaid)&&Number.isFinite(c.finance.receivable)&&Number.isFinite(c.finance.equity))||!Number.isInteger(s.rng))throw new Error('This is not a supported Studio Syndicate prototype save.');
  if(audit(s).length)throw new Error('Save integrity check failed: '+audit(s)[0]);return s;}


// UPDATE 38 — Optional cinema management. No scene-by-scene minigame.
// All decisions are paid and rights-preserving; sales share the global finite wallet.
const FILM_DISTRIBUTION=Object.freeze(['independent','wide','limited']);
const FILM_METHODS=Object.freeze(['live-action','animation','hybrid']);
function filmDefault(p){
 const method=p.format==='Animated Film'?'animation':'live-action';
 const rating=p.pitch?.targetAudience==='mature'?'M':p.pitch?.targetAudience==='young'||p.pitch?.targetAudience==='family'?'G':'T';
 return {method,rating,scriptDrafts:0,screenings:[],reshoots:0,location:p.productionRegion,
  facilities:'partner',distribution:'independent',festival:null,premiere:null,disruptions:[],castActorId:null,castShare:0,castFee:0,castPaid:0,
  actions:[],boxOffice:{},weeklyBoxOffice:[],boxOfficeHistoryComplete:true,admissions:{},channels:{},auditions:[],delayWeeks:0,historyComplete:true};
}
function filmActorPool(s){
 if(!available('movie',s.week))return [];
 if(!Array.isArray(s.filmActors))s.filmActors=[];
 if(!s.filmActors.length){const names=['Rae Vale','Kit Arden','Mika North','Jules Solis','Eden Hart','Leo Keene','Nova Pierce','Tali Moon','Ira Stone','Marin Gray','Devin Frost','Ari Quinn'];
  for(let i=0;i<names.length;i++){const skill=54+hash(s.seed+':filmstar:'+i)%41;
   s.filmActors.push({id:id(s,'actor'),name:names[i],skill,genreSpecialty:GENRES[hash(s.seed+':filmactor:genre:'+i)%GENRES.length],fee:money(1100+(skill-48)*110),busyProjectId:null,firstWeek:s.week,credits:[]});}}
 return s.filmActors.map(a=>({...a,available:!a.busyProjectId}));
}
function filmRequire(s,projectId,active=true){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='movie'||!c||!controlledCompanies(s).some(x=>x.id===c.id)||active&&p.status!=='active')throw new Error('Select a controllable active movie production.');
 if(!p.cinema)p.cinema=filmDefault(p);return {p,c};
}
function filmCost(s,p,c,cost,action){
 cost=money(cost);
 if(c.finance.cash<cost+2500)throw new Error('Insufficient cash for film decision and payroll buffer.');
 expense(s,c,cost,'film-'+action,'Cinema decision: '+action+' for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.cinema.actions.push({week:s.week,action,cost});return cost;
}
function filmAudition(s,projectId,actorId){
 const {p,c}=filmRequire(s,projectId);if(p.cinema.castActorId)throw new Error('Lead already contracted; audition window closed.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));
 if(!a||a.busyProjectId)throw new Error('Actor not available for audition.');
 if(p.cinema.auditions.some(x=>x.actorId===a.id)||p.cinema.auditions.length>=4)throw new Error('Actor already evaluated or audition budget limit reached.');
 const cost=filmCost(s,p,c,400,'audition');
 const score=Math.round(clamp(a.skill*.76+(a.genreSpecialty===p.genre?12:0)+(hash(s.seed+':audition:'+p.id+':'+a.id)%19)-9,1,100));
 const row={actorId:a.id,week:s.week,estimate:score,cost};p.cinema.auditions.push(row);return row;
}
function filmChooseCast(s,projectId,actorId){
 const {p,c}=filmRequire(s,projectId);if(p.cinema.castActorId)throw new Error('Film already has a contracted lead actor.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));
 if(!a||a.busyProjectId)throw new Error('Actor unavailable due to an exclusive production schedule.');
 const fee=filmCost(s,p,c,a.fee,'casting');a.busyProjectId=p.id;
 a.credits.push({projectId:p.id,week:s.week});p.cinema.castActorId=a.id;p.cinema.castFee=fee;
 p.cinema.castShare=money(.015+Math.max(0,a.skill-60)*.0008);
 p.creativeQuality=Math.min(99,p.creativeQuality+Math.round((a.skill-52)/9)+(a.genreSpecialty===p.genre?3:0));
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 return {actorId:a.id,fee,backendShare:p.cinema.castShare};
}
function filmDecision(s,projectId,decision){
 const {p,c}=filmRequire(s,projectId);
 if(!['script','screening','reshoot','facilities','festival','hybrid'].includes(decision))throw new Error('Unknown film choice.');
 if(p.route==='contract')throw new Error('Client-funded creative changes require negotiated approval.');
 if(p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired&&['script','reshoot','hybrid'].includes(decision))throw new Error('Binding creator approval prevents this unilateral change.');
 if(p.cinema.actions.some(a=>a.action===decision))throw new Error('This specific film decision has already been made.');
 if(decision==='facilities'&&p.cinema.facilities!=='partner')throw new Error('Facilities are already committed.');
 if(decision==='screening'&&(p.weeksDone<p.weeksTotal*.40||p.weeksDone>=p.weeksTotal*.97))throw new Error('Test screenings require an unfinished, substantially developed film.');
 if(decision==='reshoot'&&p.weeksDone<p.weeksTotal*.35)throw new Error('Reshoots require filmed material.');
 const ratio={script:.055,screening:.024,reshoot:.12,facilities:.068,festival:.037,hybrid:.09}[decision];
 const cost=filmCost(s,p,c,Math.max(650,p.budget*ratio),decision);
 if(decision==='script'){p.weeksTotal+=2;p.creativeQuality=Math.min(99,p.creativeQuality+6);p.cinema.scriptDrafts++;}
 if(decision==='screening'){const estimate=Math.round(clamp(p.creativeQuality*.44+p.technicalQuality*.56+(rand(s)-.5)*18,1,100));p.cinema.screenings.push({week:s.week,estimate,cost});}
 if(decision==='reshoot'){p.weeksTotal+=3;p.creativeQuality=Math.min(99,p.creativeQuality+3);p.technicalQuality=Math.min(99,p.technicalQuality+6);p.cinema.reshoots++;}
 if(decision==='facilities'){p.cinema.facilities='rented';p.technicalQuality=Math.min(99,p.technicalQuality+4);}
 if(decision==='festival'){p.cinema.festival={entryWeek:s.week,cost,eligible:true,won:false};}
 if(decision==='hybrid'){p.cinema.method='hybrid';p.technicalQuality=Math.min(99,p.technicalQuality+3);}
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 return {decision,cost,quality:p.quality,phase:p.phase};
}
// Film backlots are an optional expensed company operational capability with
// real ongoing costs, not a free asset or fictitious subsidiary investment.
function buildFilmBacklot(s){
 const c=player(s);if(!available('movie',s.week)||c.capabilities?.movie!=='internal')throw new Error('Film studio capability required.');
 if(c.filmBacklot)throw new Error('Studio already operates its own film backlot.');
 const cost=18500;
 if(c.finance.cash<cost+8000)throw new Error('Insufficient reserve to establish a staffed film backlot.');
 expense(s,c,cost,'film-studio-fitout','One-time in-house studio fit-out; expensed conservatively');
 c.filmBacklot={builtWeek:s.week,cost,monthlyCost:620,totalUpkeep:0};
 news(s,c.name+' opens in-house film studio','Paid fit-out and ongoing upkeep support a single concurrent in-house production; no fictitious asset valuation.','company');
 return {...c.filmBacklot};
}
function useFilmBacklot(s,projectId){
 const {p,c}=filmRequire(s,projectId);
 if(!c.filmBacklot)throw new Error('Build a funded in-house film studio first.');
 if(p.cinema.facilities!=='partner')throw new Error('Film facility method already committed.');
 if(s.projects.some(x=>x.id!==p.id&&x.status==='active'&&x.companyId===c.id&&(x.cinema?.facilities==='owned'||x.television?.facility==='owned')))throw new Error('In-house studio is currently occupied by another screen production.');
 p.cinema.facilities='owned';p.cinema.actions.push({week:s.week,action:'backlot',cost:0});
 p.technicalQuality=Math.min(99,p.technicalQuality+5);p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));
 return {projectId:p.id,facility:'owned',quality:p.quality};
}
function filmPremiere(s,projectId,region){
 const {p,c}=filmRequire(s,projectId);
 if(!activeRegions(s).some(x=>x.name===region))throw new Error('Premiere must be in an active regional market.');
 if(p.route==='contract'||p.cinema.premiere)throw new Error('Only one owned premiere campaign can be funded.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.endWeek<=s.week+Math.max(1,Math.ceil(p.weeksTotal-p.weeksDone)))throw new Error('Premiere timing requires effective film rights.');}
 const cost=filmCost(s,p,c,1400,'premiere');p.cinema.premiere={region,week:s.week,cost};
 return {...p.cinema.premiere};
}
function filmDistribution(s,projectId,mode){
 const {p,c}=filmRequire(s,projectId);
 if(!FILM_DISTRIBUTION.includes(mode))throw new Error('Unknown cinema release route.');
 if(p.cinema.distribution===mode)return {mode,fee:0};
 if(p.cinema.actions.some(a=>a.action==='distribution'))throw new Error('The film release campaign is already committed.');
 const cost=mode==='wide'?money(p.budget*.09):mode==='limited'?money(p.budget*.02):0;
 if(cost)filmCost(s,p,c,cost,'distribution');
 else p.cinema.actions.push({week:s.week,action:'distribution',cost:0});
 p.cinema.distribution=mode;return {mode,cost};
}
function filmWindowChannel(p,week){const age=week-p.releaseWeek;
 return age<7?'theatrical':age<20?'premium-rental':'catalog';}
function filmDemandMultiplier(p,week,region){
 if(!p.cinema)return 1;
 const age=week-p.releaseWeek,mode=p.cinema.distribution;
 const channel=filmWindowChannel(p,week);
 const theatrical=channel==='theatrical';
 const releaseFactor=theatrical?(mode==='wide'?1.14:mode==='limited'?.66:1):mode==='wide'?.96:mode==='limited'?1.02:1.08;
 const localPremiere=theatrical&&age<5&&p.cinema.premiere?.region===region?1.15:1;
 const ratingFactor=p.cinema.rating==='M'?.81:1;
 return clamp(releaseFactor*ratingFactor*localPremiere*(p.cinema.festival?.won?1.07:1),.45,1.4);
}
function filmBoxOffice(s,projectId){
 const {p}=filmRequire(s,projectId,false);const f=p.cinema;
 return {projectId:p.id,rating:f.rating,method:f.method,distribution:f.distribution,festival:f.festival,
  admissionsEstimated:true,regionalGross:Object.entries(f.boxOffice).map(([region,gross])=>({region,gross,estimatedAdmissions:f.admissions[region]||0})),
  channelGross:{...f.channels},recentWeeks:(f.weeklyBoxOffice||[]).map(r=>({...r})),historyComplete:f.boxOfficeHistoryComplete===true,totalGross:money(Object.values(f.boxOffice).reduce((n,x)=>n+x,0)),
  castPaid:f.castPaid,castShare:f.castShare,screeningEstimates:f.screenings.map(x=>({...x})),
  note:'Audience attendance is estimated at an illustrative $12 ticket price; cash is actual recorded consumer gross, with fees and participation separately expensed.'};
}
function recognizeFilmHonors(s,year){
 if(!Array.isArray(s.filmHonors))s.filmHonors=[];
 if(s.filmHonors.some(a=>a.year===year))return;
 const eligible=s.projects.filter(p=>p.sector==='movie'&&p.status==='released'&&yearAt(p.releaseWeek)===year&&p.cinema?.festival?.eligible);
 if(!eligible.length)return;
 const winner=[...eligible].sort((a,b)=>(b.criticScore||b.quality)-(a.criticScore||a.quality))[0];
  const festivalNames=['Crescent Film Festival','North Coast Screen Awards','Azure Lantern Film Festival'];
  const festivalName=festivalNames[year%festivalNames.length];
 const award={id:id(s,'filmhonor'),year,week:s.week,projectId:winner.id,companyId:winner.companyId,
  score:winner.criticScore||winner.quality,category:'festival-recognition',festivalName,source:'observed'};
 s.filmHonors.push(award);winner.cinema.festival.won=true;
 news(s,festivalName+' recognizes '+winner.title,'A recorded eligible film earned recognition; this is separate from audience rating or content classification.','awards');
}

// UPDATE 39: Television, season scheduling and rights-safe streaming.
// These are optional executive decisions; a production is still a single weekly team job.
const TV_NETWORKS=Object.freeze(['public','commercial','premium']);
const TV_SLOTS=Object.freeze(['daytime','prime','late']);
const STREAM_TIERS=Object.freeze({basic:8,standard:12,premium:17});
function tvDefault(p){return {seasonNumber:1,previousSeasonId:null,episodes:p.format==='Miniseries'?4:8,
  classification:p.pitch?.targetAudience==='mature'?'M':p.pitch?.targetAudience==='young'?'Y7':'PG',
  network:'public',slot:'daytime',scheduleCost:0,castActorId:null,castFee:0,writerRoom:null,
  episodeEdits:[],renewedBy:null,ended:false,chemistry:0,facility:null,actions:[],regionalAdGross:{},
  channelGross:{'first-run':0,syndication:0},estimatedViewers:{},viewersByCohort:{},weeklyRatings:[],ratingsHistoryComplete:true};}
function tvRequire(s,projectId,active=true){const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='tv'||!c||!controlledCompanies(s).some(x=>x.id===c.id)||active&&p.status!=='active')throw new Error('Select a controllable television production.');
 if(!p.television)p.television=tvDefault(p);return {p,c,t:p.television};}
function tvCost(s,p,c,cost,kind){cost=money(cost);if(c.finance.cash<cost+3200)throw new Error('Insufficient operating cash for television decision.');
 expense(s,c,cost,'tv-'+kind,kind+' for '+p.title,p.id);p.directCost=money(p.directCost+cost);
 p.productionSpend=money((p.productionSpend||0)+cost);p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.television.actions.push({week:s.week,kind,cost});return cost;}
function tvPlanSeason(s,projectId,episodes){const {p,t}=tvRequire(s,projectId);
 if(!Number.isInteger(episodes)||episodes<3||episodes>24||p.weeksDone>0||t.seasonNumber>1&&episodes>20)throw new Error('Choose 3–24 episodes before production begins.');
 if(t.actions.some(x=>x.kind==='order'))throw new Error('Season order already committed.');
 const delta=episodes-t.episodes;if(delta>0)tvCost(s,p,company(s,p.companyId),money(delta*p.budget*.018),'order');
 else t.actions.push({week:s.week,kind:'order',cost:0});
 p.weeksTotal=Math.max(8,p.weeksTotal+Math.round(delta*.55));t.episodes=episodes;return {episodes,weeksTotal:p.weeksTotal};}
function tvWritersRoom(s,projectId,approach='balanced'){
 const {p,c,t}=tvRequire(s,projectId);if(p.route==='contract')throw new Error('Commissioned scripts require client approval.');
 if(p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)throw new Error('Creator approval restricts unilateral script changes.');
 if(t.writerRoom||!['balanced','character','spectacle'].includes(approach))throw new Error('Writers room already staffed or approach invalid.');
 const team=c.teams.find(x=>x.id===p.teamId),lead=s.employees.find(x=>x.id===team?.leaderId&&x.status==='employed');
 if(!team||!lead)throw new Error('A contracted team leader is needed to run the writing room.');
 const cost=tvCost(s,p,c,Math.max(900,p.budget*.055),'writers-room');t.writerRoom={showrunnerId:lead.id,approach,week:s.week,cost};
 p.creativeQuality=Math.min(99,p.creativeQuality+(approach==='character'?6:4));
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));return {...t.writerRoom};}
function tvEditEpisode(s,projectId,episode,choice='revision'){
 const {p,c,t}=tvRequire(s,projectId);if(p.route==='contract'||p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)throw new Error('Client or creator approval required for episode changes.');
 if(!Number.isInteger(episode)||episode<1||episode>t.episodes||!['revision','finale','technical'].includes(choice)||t.episodeEdits.some(x=>x.episode===episode))throw new Error('Invalid or previously edited episode.');
 const cost=tvCost(s,p,c,Math.max(450,p.budget*.018),'episode');p.weeksTotal+=1;
 if(choice==='technical')p.technicalQuality=Math.min(99,p.technicalQuality+3);else p.creativeQuality=Math.min(99,p.creativeQuality+(choice==='finale'?4:3));
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));const row={episode,choice,cost,week:s.week};t.episodeEdits.push(row);return row;}
function tvCast(s,projectId,actorId){const {p,c,t}=tvRequire(s,projectId);
 if(t.castActorId)throw new Error('Recurring lead already contracted.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));if(!a||a.busyProjectId)throw new Error('Performer unavailable for a recurring series schedule.');
 const fee=money(a.fee*(1+.11*(t.seasonNumber-1)));tvCost(s,p,c,fee,'cast');a.busyProjectId=p.id;
 a.credits.push({projectId:p.id,week:s.week});t.castActorId=a.id;t.castFee=fee;
 const previous=s.projects.find(x=>x.id===t.previousSeasonId&&x.sector==='tv'&&x.ipId===p.ipId);
 const team=c.teams.find(x=>x.id===p.teamId),leader=team?.leaderId||null;
 if(previous?.television?.castActorId===a.id){
   const repeat=clamp((previous.television.chemistry||0)+3+(previous.television.writerRoom?.showrunnerId===leader?1:0),0,12);
   t.chemistry=repeat;
   s.tvCastRelations.push({projectId:p.id,previousSeasonId:previous.id,ipId:p.ipId,actorId:a.id,leaderId:leader,week:s.week,bonus:repeat});
 }
 p.creativeQuality=Math.min(99,p.creativeQuality+Math.max(1,Math.round((a.skill-55)/10))+t.chemistry);
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));return {actorId:a.id,fee,seasonNumber:t.seasonNumber};}
function tvSchedule(s,projectId,network='public',slot='daytime'){
 const {p,c,t}=tvRequire(s,projectId);if(!TV_NETWORKS.includes(network)||!TV_SLOTS.includes(slot))throw new Error('Choose a valid broadcaster and time slot.');
 if(t.actions.some(x=>x.kind==='schedule'))throw new Error('Broadcast slot already contracted.');
 const cost=money((network==='premium'?2200:network==='commercial'?1100:300)+(slot==='prime'?1600:slot==='late'?350:0));
 tvCost(s,p,c,cost,'schedule');t.network=network;t.slot=slot;t.scheduleCost=cost;return {network,slot,cost};}
function tvUseBacklot(s,projectId){const {p,c,t}=tvRequire(s,projectId);
 if(!c.filmBacklot)throw new Error('Build an owned studio backlot first.');
 if(t.facility||s.projects.some(x=>x.id!==p.id&&x.companyId===c.id&&x.status==='active'&&(x.cinema?.facilities==='owned'||x.television?.facility==='owned')))throw new Error('Shared film and TV soundstage already occupied.');
 tvCost(s,p,c,550,'backlot-turnaround');t.facility='owned';p.technicalQuality=Math.min(99,p.technicalQuality+4);
 p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45,1,98));return {facility:'owned',projectId:p.id};}
function tvDemandMultiplier(p,week,region){const t=p.television;if(!t)return 1;
 const age=week-p.releaseWeek;const slot=t.slot==='prime'?1.18:t.slot==='late'?.83:1;
 const network=t.network==='commercial'?1.08:t.network==='premium'?.87:.94;
 return clamp(slot*network*(t.classification==='M'?.78:1)*(age>=20?.72:1),.32,1.38);}
function tvRatings(s,projectId){const {p,t}=tvRequire(s,projectId,false);return {projectId:p.id,season:t.seasonNumber,episodes:t.episodes,network:t.network,slot:t.slot,classification:t.classification,
  regionalAdGross:{...t.regionalAdGross},channels:{...t.channelGross},estimatedViewers:{...t.estimatedViewers},estimatedViewersByCohort:{...t.viewersByCohort},
  totalAdGross:money(Object.values(t.regionalAdGross).reduce((n,x)=>n+x,0)),recentWeeks:t.weeklyRatings.map(x=>({...x})),historyComplete:t.ratingsHistoryComplete,
  estimateNote:'Viewers are illustrative estimates derived from recorded advertising receipts. Ad money shares the finite regional television wallet; viewership itself does not generate additional revenue.'};}
function tvRenewSeason(s,projectId,{episodes=8,castAgain=true}={}){
 const {p,c,t}=tvRequire(s,projectId,false);if(p.status!=='released'||t.ended||t.renewedBy||p.route==='contract')throw new Error('Only a released, continuing owned series can be renewed.');
 if(p.format==='Miniseries')throw new Error('Limited miniseries do not auto-renew as permanent series.');
 if(!Number.isInteger(episodes)||episodes<3||episodes>24)throw new Error('Choose a valid next-season episode order.');
 if(s.projects.some(x=>x.ipId===p.ipId&&x.sector==='tv'&&x.status==='active'))throw new Error('Another season of this franchise is already filming.');
 // Use the regular project route, cash reserve, independent rights permission,
 // and available team checks. Retain original IP; never mint a second owner.
 const next=createProject(s,{sector:'tv',route:'adaptation',ipId:p.ipId,title:p.title+' · Season '+(t.seasonNumber+1),genre:p.genre,
   format:'Series',size:p.size,theme:p.pitch?.theme,targetAudience:p.pitch?.targetAudience,direction:p.pitch?.direction,positioning:p.pitch?.positioning});
 next.television.seasonNumber=t.seasonNumber+1;next.television.previousSeasonId=p.id;
 const target=next.television.episodes;next.television.episodes=episodes;next.weeksTotal=Math.max(8,next.weeksTotal+Math.round((episodes-target)*.55));
 t.renewedBy=next.id;
 if(castAgain&&t.castActorId){const a=s.filmActors.find(a=>a.id===t.castActorId);
   if(a&&!a.busyProjectId&&c.finance.cash>=a.fee*(1+.11*(next.television.seasonNumber-1))+4000)tvCast(s,next.id,a.id);
   else if(c.isPlayer)alert(s,'tv-cast-'+next.id,'Season renewal: casting review','Your previous lead is unavailable or unaffordable. Season '+next.television.seasonNumber+' continues with an unfilled cast slot.','advisory');}
 if(c.isPlayer)news(s,'Season renewed: '+p.title,'Season '+next.television.seasonNumber+' booked under an actual production budget and current rights.','production');
 return next;}
function tvEndSeries(s,projectId){const {p,t}=tvRequire(s,projectId,false);
 if(p.status!=='released'||t.renewedBy||t.ended)throw new Error('Conclude the most recently completed season instead.');
 t.ended=true;news(s,'Series concluded: '+p.title,'The current season remains available through lawful distribution windows. No next season has been commissioned.','release');return {ended:true};}
function recognizeTvHonors(s,year){if(!Array.isArray(s.tvHonors))s.tvHonors=[];
  if(!Array.isArray(s.tvCastRelations))s.tvCastRelations=[];
 if(s.tvHonors.some(x=>x.year===year))return;
 const eligible=s.projects.filter(p=>p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===year&&p.route!=='contract');
 if(!eligible.length)return;
 const p=[...eligible].sort((a,b)=>(b.criticScore||b.quality)-(a.criticScore||a.quality))[0];
 const award={id:id(s,'tvhonor'),year,week:s.week,projectId:p.id,companyId:p.companyId,
  name:year%2?'Aurora Television Awards':'Northern Screen Honors',category:'series-writing',criticScore:p.criticScore||p.quality,source:'observed'};
 s.tvHonors.push(award);news(s,award.name+' recognizes '+p.title,'Recorded series writing recognition is independent of age/content classification and audience popularity.','awards');}

// Streaming is a TV/film distribution capability, never a fifth industry.
// Subscriber receipts use the SAME capped regional television money pool that
// also funds broadcast advertising, and are never booked as a second sale.
function streamingReady(s){const t=technologyReport(s).tv;
 return available('tv',s.week)&&yearAt(s.week)>=14&&!!t?.discovered;}
function launchStreamingService(s,{name='Syndicate Stream',tier='standard'}={}){
 const c=player(s);if(!streamingReady(s)||!c.capabilities.tv)throw new Error('Streaming service requires mature television distribution technology (World Year 14 or later) and television capability.');
 if(s.streamingServices.some(x=>x.companyId===c.id&&x.active))throw new Error('A company already operates an active streaming service.');
 if(!STREAM_TIERS[tier])throw new Error('Invalid subscription tier.');
 const fee=42000;if(c.finance.cash<fee+12000)throw new Error('Insufficient cash for streaming launch and ongoing expenses.');
 expense(s,c,fee,'streaming-launch','Streaming service infrastructure and subscriber acquisition');
 const service={id:id(s,'service'),companyId:c.id,name:String(name).trim().slice(0,45)||'Syndicate Stream',tier,
  price:STREAM_TIERS[tier],startedWeek:s.week,active:true,monthlyCost:1650,setupCost:fee,runningCost:0,
  regions:Object.fromEntries(activeRegions(s).map(r=>[r.name,{subscribers:0,paidGross:0,churned:0}])),
  grossReceipts:0,history:[],historyComplete:true};s.streamingServices.push(service);return service;}
function setStreamingTier(s,serviceId,tier){const service=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active);
 if(!service||!STREAM_TIERS[tier])throw new Error('Owned streaming service or tier unavailable.');
 if(service.tier===tier)return {...service};service.tier=tier;service.price=STREAM_TIERS[tier];return {...service};}
function streamWindowAuthorized(s,w,week=s.week){const p=s.projects.find(x=>x.id===w.projectId);
 if(!p||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract'||week<w.startWeek||week>=w.endWeek)return false;
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>week||g.endWeek+g.continuationWeeks<=week)return false;}
 return true;}
function requestStreamingLicense(s,serviceId,projectId,weeks=52,bid=2800){
 const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),
   p=s.projects.find(x=>x.id===projectId),owner=p&&company(s,p.companyId);
 if(!svc||!p||p.status!=='released'||p.route==='contract'||!['movie','tv'].includes(p.sector)||!owner||owner.bankrupt||
   owner.id===s.playerId||controlledCompanies(s).some(c=>c.id===owner.id))throw new Error('Choose a released independent studio title for a bilateral streaming offer.');
 if(!Number.isInteger(weeks)||weeks<13||weeks>156||!Number.isFinite(bid)||bid<100||bid>25000)throw new Error('Invalid streaming term or licensed offer.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)
   throw new Error('The source holder cannot grant this long streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('The streaming title is already available under contract.');
 if(s.streamingOffers.some(o=>o.serviceId===svc.id&&o.projectId===p.id&&o.status!=='declined'&&o.status!=='booked'&&o.expiresWeek>s.week))throw new Error('An active streaming rights negotiation already exists.');
 // Independent producers will not accept an arbitrarily low bidder. The
 // reserve is based on visible existing quality and time, not omniscience.
 const ask=money(1400+p.quality*weeks*.55);
 const row={id:id(s,'streamoffer'),serviceId:svc.id,projectId:p.id,ownerId:owner.id,operatorId:svc.companyId,
  createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+12,weeks,
  proposedFee:money(bid),counterFee:ask,acceptedFee:bid>=ask?money(bid):null,
  status:bid>=ask?'accepted':'counter',windowId:null};
 s.streamingOffers.push(row);return {...row};
}
function answerStreamingLicense(s,offerId,accept){const o=s.streamingOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No pending independent rights counteroffer remains.');
 o.status=accept?'accepted':'declined';o.acceptedFee=accept?o.counterFee:null;o.updatedWeek=s.week;return {...o};}
function licenseStreamingTitle(s,serviceId,projectId,weeks=52,offerId=null){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),p=s.projects.find(x=>x.id===projectId);
 const owner=p&&company(s,p.companyId),c=player(s);
 if(!svc||!p||!owner||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract')throw new Error('Choose a completed authorized TV or film title for the service.');
 if(!Number.isInteger(weeks)||weeks<13||weeks>156)throw new Error('Catalog windows last 13–156 weeks.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)throw new Error('Underlying rights do not cover the proposed streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('An active streaming window already covers this title.');
 const offer=owner.id===c.id?null:s.streamingOffers.find(o=>o.id===offerId&&o.status==='accepted'&&o.operatorId===c.id&&o.ownerId===owner.id&&o.serviceId===svc.id&&o.projectId===p.id&&o.weeks===weeks&&s.week<=o.expiresWeek);
 if(owner.id!==c.id&&!offer)throw new Error('A willing external owner must accept the exact streaming contract before payment.');
 const fee=offer?offer.acceptedFee:0;
 if(fee>0){if(c.finance.cash<fee+5000)throw new Error('Insufficient cash for licensed streaming access.');
 expense(s,c,fee,'streaming-rights','Term-limited streaming distribution window: '+p.title,p.id);
 revenue(s,owner,fee,'streaming-rights','License a completed screen title to '+svc.name,p.id);}
 const window={id:id(s,'streamwindow'),serviceId:svc.id,projectId:p.id,ownerId:owner.id,offerId:offer?.id||null,
  startWeek:s.week,endWeek:s.week+weeks,fee,rightsGrantId:p.grantId||null,territory:'Worldwide',exclusive:false};
 s.streamingWindows.push(window);if(offer){offer.status='booked';offer.windowId=window.id;offer.updatedWeek=s.week;}return window;}
function streamingCatalog(s,serviceId,atWeek=s.week){const svc=s.streamingServices.find(x=>x.id===serviceId);if(!svc)throw new Error('Unknown service.');
 return s.streamingWindows.filter(w=>w.serviceId===serviceId&&streamWindowAuthorized(s,w,atWeek)).map(w=>({
  ...w,title:s.projects.find(p=>p.id===w.projectId)?.title||'',expiresIn:w.endWeek-atWeek}));}
function streamingWeek(s){s.streamingWeeklyReserved={};s.streamingWeeklyTotal=0;
 for(const svc of s.streamingServices||[])if(svc.active){const c=company(s,svc.companyId);if(!c||c.bankrupt)continue;
  const catalog=streamingCatalog(s,svc.id),quality=catalog.length?catalog.reduce((sum,x)=>sum+(s.projects.find(p=>p.id===x.projectId)?.quality||50),0)/catalog.length:0;
  for(const region of activeRegions(s)){const r=svc.regions[region.name]||{subscribers:0,paidGross:0,churned:0};svc.regions[region.name]=r;
   const budget=worldMarketBudget(s,'tv',region.name),weeklyRate=svc.price/4.33;
   const ceiling=Math.max(0,Math.floor(budget*.22/weeklyRate));
   const appeal=catalog.length?clamp((.22+.1*catalog.length+quality/350)*(.8+(.2*s.macroeconomy)),.15,.9):0;
   const desired=Math.floor(ceiling*appeal);const old=r.subscribers;
   const newCount=old<desired?Math.min(desired,old+Math.max(3,Math.ceil((desired-old)*.18))):Math.max(desired,old-Math.max(4,Math.ceil((old-desired)*.22)));
   const billable=Math.max(0,Math.min(newCount,ceiling));r.churned+=Math.max(0,old-billable);r.subscribers=billable;
   const gross=money(Math.min(budget*.22,billable*weeklyRate));if(gross<=0)continue;
   bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+' paid streaming subscriptions: '+svc.name);
   r.paidGross=money(r.paidGross+gross);svc.grossReceipts=money(svc.grossReceipts+gross);
   s.streamingWeeklyReserved[region.name]=money((s.streamingWeeklyReserved[region.name]||0)+gross);
   s.streamingWeeklyTotal=money(s.streamingWeeklyTotal+gross);
   svc.history.push({week:s.week,region:region.name,subscribers:billable,gross,activeTitles:catalog.length});
   if(svc.history.length>240){svc.history.shift();svc.historyComplete=false;}
  }
 }
}
function streamingReport(s,serviceId){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId);if(!svc)throw new Error('Not an owned service.');
 return {...svc,regions:Object.fromEntries(Object.entries(svc.regions).map(([k,v])=>[k,{...v}])),
 catalog:streamingCatalog(s,serviceId),history:svc.history.slice(-24).map(x=>({...x})),
 note:'Receipts represent paid subscriptions within the single regional TV spending cap. Expired/unlicensed catalog entries are not available; no historical subscribers or income are invented.'};}
function auditTelevision(s,problems){const busy=new Set();
 for(const p of s.projects.filter(p=>p.sector==='tv')){const t=p.television;if(!t){problems.push(p.id+': missing TV record');continue;}
  if(!Number.isInteger(t.seasonNumber)||t.seasonNumber<1||!Number.isInteger(t.episodes)||t.episodes<3||t.episodes>24||
   !TV_NETWORKS.includes(t.network)||!TV_SLOTS.includes(t.slot)||!['Y7','PG','M'].includes(t.classification)||
   !Array.isArray(t.episodeEdits)||!Array.isArray(t.weeklyRatings)||!t.regionalAdGross||!t.channelGross||!t.viewersByCohort||
   Object.values(t.viewersByCohort).some(x=>!Number.isInteger(x)||x<0)||
   Math.abs(Object.values(t.viewersByCohort).reduce((n,v)=>n+v,0)-Object.values(t.estimatedViewers).reduce((n,v)=>n+v,0))>1||
   t.episodeEdits.some(e=>e.episode<1||e.episode>t.episodes||e.week>s.week||e.cost<0)||
   t.weeklyRatings.some(r=>r.week> s.week||r.week<p.releaseWeek||!REGIONS.some(x=>x.name===r.region)||r.gross<0||r.estimatedViewers<0||!['first-run','syndication'].includes(r.channel))||
   Math.abs(Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)-Object.values(t.channelGross).reduce((n,v)=>n+v,0))>.09||
   Object.values(t.regionalAdGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.channelGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)>p.stats.totalSales+.05||
   t.previousSeasonId&&(!s.projects.some(x=>x.id===t.previousSeasonId&&x.sector==='tv'&&x.ipId===p.ipId&&x.television?.renewedBy===p.id))||
   t.renewedBy&&(!s.projects.some(x=>x.id===t.renewedBy&&x.television?.previousSeasonId===p.id))||
   t.writerRoom&&!s.employees.some(x=>x.id===t.writerRoom.showrunnerId)||
   t.facility==='owned'&&!company(s,p.companyId)?.filmBacklot||
   t.castActorId&&(!s.filmActors.some(a=>a.id===t.castActorId&& (p.status!=='active'||a.busyProjectId===p.id))||p.status==='active'&&busy.has(t.castActorId)))problems.push(p.id+': invalid television season, ratings or cast records');
  if(!Number.isFinite(t.chemistry)||t.chemistry<0||t.chemistry>12)problems.push(p.id+': invalid recurring cast chemistry');
  if(t.castActorId&&p.status==='active')busy.add(t.castActorId);
 }
 for(const r of s.tvCastRelations||[]){const p=s.projects.find(x=>x.id===r.projectId),prior=s.projects.find(x=>x.id===r.previousSeasonId);
  if(!p||!prior||p.sector!=='tv'||prior.sector!=='tv'||p.ipId!==r.ipId||prior.ipId!==r.ipId||
    p.television?.previousSeasonId!==prior.id||p.television?.castActorId!==r.actorId||prior.television?.castActorId!==r.actorId||
    (r.leaderId!==null&&!s.employees.some(x=>x.id===r.leaderId))||
    !Number.isFinite(r.bonus)||r.bonus<3||r.bonus>12||p.television.chemistry!==r.bonus||
    !Number.isInteger(r.week)||r.week>s.week||r.week<p.startWeek)problems.push('Invalid recurring team relationship and cast collaboration');
 }
 for(const a of s.tvHonors||[])if(!s.projects.some(p=>p.id===a.projectId&&p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===a.year)||a.week>s.week||typeof a.name!=='string')problems.push('Invalid television award provenance');
 const used=new Set();
 for(const svc of s.streamingServices||[]){if(!company(s,svc.companyId)||!STREAM_TIERS[svc.tier]||svc.price!==STREAM_TIERS[svc.tier]||
   !Number.isInteger(svc.startedWeek)||svc.startedWeek>s.week||svc.startedWeek<(14-1)*52||
   svc.monthlyCost!==1650||!Number.isFinite(svc.grossReceipts)||svc.grossReceipts<0||
   !svc.regions||Object.entries(svc.regions).some(([k,r])=>!REGIONS.some(z=>z.name===k)||!Number.isInteger(r.subscribers)||r.subscribers<0||r.paidGross<0||r.churned<0)||
   !Array.isArray(svc.history)||svc.history.some(x=>x.week> s.week||x.week<svc.startedWeek||x.gross<0||x.subscribers<0)||
   Math.abs(Object.values(svc.regions).reduce((n,r)=>n+r.paidGross,0)-svc.grossReceipts)>.1||used.has(svc.companyId))problems.push('Invalid streaming service and subscriber cash history');
  used.add(svc.companyId);
 }
 for(const o of s.streamingOffers||[])if(!s.streamingServices.some(x=>x.id===o.serviceId&&x.companyId===o.operatorId)||
   !s.projects.some(x=>x.id===o.projectId&&x.companyId===o.ownerId&&x.status==='released')||
   !['counter','accepted','booked','declined'].includes(o.status)||
   !Number.isInteger(o.createdWeek)||o.createdWeek>s.week||o.expiresWeek!==o.createdWeek+12||
   !Number.isFinite(o.proposedFee)||o.proposedFee<100||o.counterFee<100||
   o.status==='booked'&&!s.streamingWindows.some(w=>w.offerId===o.id&&w.id===o.windowId)||
   (o.status==='accepted'||o.status==='booked')&&(!Number.isFinite(o.acceptedFee)||![o.proposedFee,o.counterFee].includes(o.acceptedFee)))
   problems.push('Invalid bilateral streaming offer provenance');
 for(const w of s.streamingWindows||[]){const p=s.projects.find(x=>x.id===w.projectId),svc=s.streamingServices.find(x=>x.id===w.serviceId);
  const offer=w.offerId?s.streamingOffers.find(o=>o.id===w.offerId):null;
  if(!svc||!p||!['movie','tv'].includes(p.sector)||p.status!=='released'||p.route==='contract'||p.companyId!==w.ownerId||w.startWeek<p.releaseWeek||w.startWeek>s.week||
    (w.ownerId!==svc.companyId&&(!offer||offer.status!=='booked'||offer.windowId!==w.id||offer.acceptedFee!==w.fee))||
    !Number.isInteger(w.endWeek)||w.endWeek<=w.startWeek||w.endWeek-w.startWeek>156||w.endWeek-w.startWeek<13||w.fee<0||
    w.rightsGrantId!==(p.grantId||null)||w.territory!=='Worldwide'||w.exclusive!==false||
    (w.rightsGrantId&&(!s.grants.some(g=>g.id===w.rightsGrantId&&g.endWeek+g.continuationWeeks>=w.endWeek)))||
    s.streamingWindows.some(x=>x!==w&&x.serviceId===w.serviceId&&x.projectId===w.projectId&&x.startWeek<w.endWeek&&w.startWeek<x.endWeek))problems.push('Invalid streaming license and rights window');
 }
}

// UPDATE 40: Video-game creation and lawful digital distribution.
// These services operate inside the FOUR existing industries; platforms are not manufacturers.
// Promotional exclusive is a separate bilateral deal. A store cannot buy exclusivity from itself,
// and the grant is a REAL funded platform marketing transfer, not an industry subsidy.
function gameOfferExclusive(s,storeId,projectId,grant=4200,weeks=26){
 const store=gameStoreById(s,storeId),win=gameWindows(s,storeId).find(x=>x.projectId===projectId),p=s.projects.find(x=>x.id===projectId);
 if(store.companyId!==s.playerId||!win||!p||p.companyId===s.playerId)throw new Error('Only independent licensed games may negotiate a platform exclusive.');
 if(!Number.isFinite(grant)||grant<2500||grant>20000||![13,26,52].includes(weeks)||win.endWeek<s.week+weeks||p.videoGame.exclusiveUntil>s.week)
  throw new Error('Exclusive grant/term must fit the lawful catalog window.');
 if(s.gameStoreWindows.some(w=>w.projectId===p.id&&w.storeId!==store.id&&w.endWeek>s.week))throw new Error('Existing distribution rights prevent exclusivity.');
 const demand=money(Math.max(grant,Math.min(20000,2500+p.quality*46)));
 const o={id:id(s,'gameexclusive'),storeId,projectId,operatorId:store.companyId,ownerId:p.companyId,
 proposedGrant:money(grant),counterGrant:demand,acceptedGrant:grant>=demand?money(grant):null,status:grant>=demand?'accepted':'counter',weeks,
 createdWeek:s.week,expiresWeek:s.week+8,activatedWeek:null};s.gameExclusiveOffers.push(o);return o;
}
function gameAnswerExclusive(s,offerId,accept){const o=s.gameExclusiveOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No pending exclusive counteroffer.');
 o.status=accept?'accepted':'declined';o.acceptedGrant=accept?o.counterGrant:null;return o;}
function gameBookExclusive(s,offerId){const o=s.gameExclusiveOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId),
 p=s.projects.find(x=>x.id===o?.projectId),store=s.gameStores.find(x=>x.id===o?.storeId),operator=store&&company(s,store.companyId),owner=p&&company(s,p.companyId);
 if(!o||o.status!=='accepted'||s.week>o.expiresWeek||!operator||!owner||!p||p.status!=='released'||
 !gameWindows(s,o.storeId).some(w=>w.projectId===p.id&&w.endWeek>=s.week+o.weeks)||
 s.gameStoreWindows.some(w=>w.projectId===p.id&&w.storeId!==o.storeId&&w.endWeek>s.week)||p.videoGame.exclusiveUntil>s.week)
  throw new Error('Agreement no longer permits exclusive distribution.');
 if(operator.finance.cash<o.acceptedGrant+4500)throw new Error('Store cannot fund the agreed marketing grant.');
 expense(s,operator,o.acceptedGrant,'game-exclusive-marketing','Time-limited marketing rights '+p.title,p.id);
 revenue(s,owner,o.acceptedGrant,'game-exclusive-grant','Contracted exclusive marketing support '+p.title,p.id);
 p.videoGame.exclusiveStoreId=o.storeId;p.videoGame.exclusiveUntil=s.week+o.weeks;p.videoGame.storeId=o.storeId;
 o.activatedWeek=s.week;o.status='booked';return {projectId:p.id,storeId:o.storeId,grant:o.acceptedGrant,endWeek:p.videoGame.exclusiveUntil};
}

const GAME_PLATFORMS=Object.freeze({pc:10,console:12,handheld:15,mobile:18});
const GAME_MECHANICS=Object.freeze(['strategy','roleplaying','simulation','action','puzzle']);
const GAME_MODELS=Object.freeze(['premium','subscription','free-to-play']);
const GAME_STAGES=Object.freeze(['concept','prototype','build','alpha','beta','certification','released']);
function gameGeneration(week,platform){return 1+Math.floor((yearAt(week)-GAME_PLATFORMS[platform])/7);}
function gameDefault(p,week){return {mechanic:'strategy',platform:'pc',generation:gameGeneration(Math.max((10-1)*52,week),'pc'),
  scope:'balanced',engine:'licensed',engineFee:0,prototype:null,designHistory:[],stages:[{week,phase:'concept'}],
  bugs:Math.max(0,Math.round(32+(65-p.technicalQuality)*.30)),qaHistory:[],beta:null,certification:null,
  model:'premium',exclusiveUntil:0,exclusivePlatform:null,exclusivePromotion:0,community:0,communityActions:[],
  support:[],dlc:[],esports:[],regionalGross:{},salesUnits:{},platformFees:0,platformGross:0,
  weeklySales:[],historyComplete:true,storeId:null,lastStoreOwnerId:null};}
function gameProject(s,projectId,needsActive=true){const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||p.sector!=='games'||!controlledCompanies(s).some(x=>x.id===c.id)||needsActive&&p.status!=='active'||p.route==='contract')throw new Error('Choose an eligible owned game project.');
 if(!available('games',s.week))throw new Error('Worldwide games debut in Year 10.');
 if(!p.videoGame)p.videoGame=gameDefault(p,p.startWeek);return {p,c,g:p.videoGame};}
function gameSpend(s,p,c,amount,kind){amount=money(amount);if(c.finance.cash<amount+2500)throw new Error('Game decision requires funded cash with operating buffer.');
 expense(s,c,amount,'game-'+kind,kind+' development: '+p.title,p.id);p.directCost=money(p.directCost+amount);
 p.productionSpend=money((p.productionSpend||0)+amount);p.periodProductionSpend=money((p.periodProductionSpend||0)+amount);return amount;}
function gameQuality(p){p.quality=Math.round(clamp(p.creativeQuality*.55+p.technicalQuality*.45-p.videoGame.bugs*.12,5,98));return p.quality;}
function gameDesign(s,projectId,{mechanic='strategy',platform='pc',scope='balanced'}={}){
 const {p,g}=gameProject(s,projectId);if(p.weeksDone>0||g.designHistory.length)throw new Error('Core design locks after development starts.');
 if(!GAME_MECHANICS.includes(mechanic)||!GAME_PLATFORMS[platform]||!['focused','balanced','ambitious'].includes(scope))throw new Error('Invalid game design.');
 if(yearAt(s.week)<GAME_PLATFORMS[platform])throw new Error('That platform ecosystem has not appeared yet.');
 if(p.grantId&&s.grants.some(x=>x.id===p.grantId&&x.approvalRequired))throw new Error('Creator approval restricts changed design.');
 g.mechanic=mechanic;g.platform=platform;g.generation=gameGeneration(s.week,platform);g.scope=scope;
 g.designHistory.push({week:s.week,mechanic,platform,scope});if(scope==='ambitious'){p.weeksTotal+=5;g.bugs+=7;p.creativeQuality=Math.min(99,p.creativeQuality+5);}
 if(scope==='focused'){p.weeksTotal=Math.max(9,p.weeksTotal-3);g.bugs=Math.max(3,g.bugs-5);}gameQuality(p);
 return {mechanic,platform,scope,generation:g.generation,plannedWeeks:p.weeksTotal};}
function gamePrototype(s,projectId,approach='balanced'){
 const {p,c,g}=gameProject(s,projectId);if(g.prototype||p.weeksDone>p.weeksTotal*.35||!['balanced','technical','creative'].includes(approach))throw new Error('Prototype must be commissioned early, once per game.');
 const cost=gameSpend(s,p,c,Math.max(450,p.budget*.035),'prototype');g.prototype={week:s.week,approach,cost,riskEstimate:Math.round(clamp(45+g.bugs-(p.technicalQuality-50)*.30,5,95))};
 if(approach==='technical'){g.bugs=Math.max(1,g.bugs-7);p.technicalQuality=Math.min(99,p.technicalQuality+3);}
 else {p.creativeQuality=Math.min(99,p.creativeQuality+(approach==='creative'?5:3));}
 gameQuality(p);return {...g.prototype};}
function gameBuildEngine(s){const c=player(s);if(!available('games',s.week)||!c.capabilities.games)throw new Error('Game studio technology unavailable.');
 if(c.gameEngine)throw new Error('Company already maintains a proprietary game engine.');
 const cost=19000;if(c.finance.cash<cost+7000)throw new Error('Not enough funds for engine R&D and operating reserve.');
 expense(s,c,cost,'game-engine-rnd','Fund proprietary reusable game engine R&D');
 c.gameEngine={createdWeek:s.week,maintenance:240,version:1,quality:3};return c.gameEngine;}
function gameChooseEngine(s,projectId,engine='licensed'){
 const {p,c,g}=gameProject(s,projectId);if(!['licensed','proprietary'].includes(engine)||g.engineFee||p.weeksDone>p.weeksTotal*.35)throw new Error('Choose game tools early and only once.');
 if(engine==='proprietary'&&!c.gameEngine)throw new Error('This studio has not funded a proprietary engine.');
 const cost=gameSpend(s,p,c,engine==='licensed'?Math.max(450,p.budget*.026):Math.max(180,p.budget*.007),'engine-license');
 g.engine=engine;g.engineFee=cost;g.bugs=Math.max(0,g.bugs-(engine==='proprietary'?5:8));p.technicalQuality=Math.min(99,p.technicalQuality+(engine==='proprietary'?3:5));gameQuality(p);
 return {engine,cost,defects:g.bugs};}
function gameQA(s,projectId,level='standard'){
 const {p,c,g}=gameProject(s,projectId);if(!['standard','intensive','crunch'].includes(level)||g.qaHistory.length>=3)throw new Error('Invalid QA order or team already stretched.');
 const cost=gameSpend(s,p,c,Math.max(550,p.budget*(level==='intensive'?.075:level==='crunch'?.038:.045)),'qa');
 const reduction=level==='intensive'?14:level==='crunch'?8:10;g.bugs=Math.max(0,g.bugs-reduction);p.technicalQuality=Math.min(99,p.technicalQuality+(level==='intensive'?5:3));
 if(level==='intensive')p.weeksTotal+=2;if(level==='crunch')p.creativeQuality=Math.max(12,p.creativeQuality-2);
 const row={week:s.week,level,cost,defectsAfter:g.bugs};g.qaHistory.push(row);gameQuality(p);return row;}
function gameMilestone(s,p){const g=p.videoGame;if(!g)return;const ratio=p.weeksDone/Math.max(1,p.weeksTotal);
 const next=ratio>=.94?'certification':ratio>=.75?'beta':ratio>=.52?'alpha':ratio>=.18?'build':ratio>=.05?'prototype':'concept';
 if(g.stages.at(-1)?.phase!==next)g.stages.push({week:s.week,phase:next});}
function gameBeta(s,projectId){const {p,c,g}=gameProject(s,projectId);if(g.beta||p.weeksDone<p.weeksTotal*.45)throw new Error('Beta requires a developed playable build.');
 const cost=gameSpend(s,p,c,Math.max(450,p.budget*.025),'beta');g.beta={week:s.week,cost,estimatedAppeal:Math.round(clamp(p.creativeQuality-g.bugs*.4,1,100)),estimatedBugs:g.bugs};
 return {...g.beta};}
function gameCertify(s,projectId,region){const {p,c,g}=gameProject(s,projectId);
 if(!activeRegions(s).some(r=>r.name===region)||g.certification?.regions?.includes(region))throw new Error('Invalid or already certified region.');
 if(p.weeksDone<p.weeksTotal*.55)throw new Error('Certification requires sufficiently developed content.');
 const cost=gameSpend(s,p,c,450,'certification');if(!g.certification)g.certification={regions:[],failures:[],cost:0};g.certification.cost=money(g.certification.cost+cost);
 if(g.bugs>22){g.certification.failures.push({week:s.week,region,bugs:g.bugs});return {region,passed:false,bugs:g.bugs,cost};}
 g.certification.regions.push(region);return {region,passed:true,cost};}
function gameSetModel(s,projectId,model='premium'){
 const {p,g}=gameProject(s,projectId);if(!GAME_MODELS.includes(model)||p.weeksDone>p.weeksTotal*.65)throw new Error('Business model locks before the final build.');
 if(model==='subscription'&&yearAt(s.week)<23||model==='free-to-play'&&yearAt(s.week)<24)throw new Error('Selected business model is not yet supported by this world technology.');
 g.model=model;return {model};}
function gameCommunity(s,projectId,kind='community'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status==='cancelled'||!['community','modding','demo','esports'].includes(kind))throw new Error('Invalid game community support.');
 if(kind==='esports'&&(p.status!=='released'||!['strategy','action','simulation'].includes(g.mechanic)))throw new Error('Organized esports requires an eligible released game.');
 if(kind==='modding'&&yearAt(s.week)<15)throw new Error('Modding tools are not yet available.');
 if(g.communityActions.filter(x=>x.kind===kind).length>=2)throw new Error('Already supported this initiative twice.');
 const cost=gameSpend(s,p,c,kind==='esports'?2400:kind==='modding'?1500:kind==='demo'?650:800,'community');
 g.community=Math.min(18,g.community+(kind==='esports'?5:kind==='modding'?4:3));const row={week:s.week,kind,cost,bonus:g.community};g.communityActions.push(row);return row;}
function gameSupport(s,projectId,kind='patch'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status!=='released'||!['patch','dlc','port'].includes(kind))throw new Error('Only finished games receive postlaunch support.');
 if(!gameDistributionAllowed(s,p,s.week))throw new Error('Publishing rights have expired; no new paid distribution is permitted.');
 if(kind==='dlc'&&g.dlc.length>=2||kind==='port'&&g.support.some(x=>x.kind==='port'))throw new Error('Expansion or port already completed.');
 const cost=gameSpend(s,p,c,kind==='dlc'?3000:kind==='port'?4500:1100,'postlaunch');
 if(kind==='patch'){g.bugs=Math.max(0,g.bugs-12);p.technicalQuality=Math.min(99,p.technicalQuality+3);}
 if(kind==='dlc')g.dlc.push({week:s.week,cost});if(kind==='port')g.platform='pc';
 const row={week:s.week,kind,cost};g.support.push(row);gameQuality(p);return row;}
function gameDistributionAllowed(s,p,week){return !p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=week&&g.endWeek+(g.continuationWeeks||0)>week);}
function gameAtRelease(s,p){const g=p.videoGame;if(!g)return;
 g.stages.push({week:s.week,phase:'released'});g.releaseDefects=g.bugs;
 // A failed certification cannot be bypassed by silently selling in that region.
 g.launchRegions=g.certification?.regions?.length?[...g.certification.regions]:activeRegions(s).map(r=>r.name);
 g.criticRating=Math.round(clamp(p.creativeQuality*.66+p.technicalQuality*.34,1,100));
 g.userRating=Math.round(clamp(p.creativeQuality*.38+p.technicalQuality*.62-g.bugs*.65+g.community*.3,1,100));
 p.criticScore=g.criticRating;p.audienceScore=g.userRating;}
function gameDemandMultiplier(p,week,region){const g=p.videoGame;if(!g)return 1;
 if(!g.launchRegions?.includes(region)||week<p.releaseWeek||g.exclusiveStoreId&&g.exclusiveUntil>week&&g.storeId!==g.exclusiveStoreId)return 0;
 const technical=clamp(1-g.bugs/90,.30,1.03),platformFit=g.platform==='pc'?1:g.platform==='mobile'?1.15:g.platform==='handheld'?.90:1.05;
 return clamp(technical*platformFit*(1+g.community*.015+g.dlc.length*.06)*(g.model==='free-to-play'?.86:1),0,1.6);}
function gameReadiness(s,projectId){const {p,g}=gameProject(s,projectId,false);return {phase:g.stages.at(-1)?.phase,
  estimate:g.beta?.estimatedAppeal??null,bugs:g.bugs,platform:g.platform,generation:g.generation,
  launchRegions:g.certification?.regions||[],criticScore:p.status==='released'?g.criticRating:null,userScore:p.status==='released'?g.userRating:null,
  sales:g.regionalGross,units:g.salesUnits,observedWeeks:g.weeklySales.slice(-12),historyComplete:g.historyComplete,
  note:'Technical defects, critics and players are tracked separately. Beta appeal is an estimate; sales and cash are observed.'};}
// Late-era digital distribution is a CONTRACTED SERVICE, not a fifth industry.
function openGameStore(s,{name='Arcade Exchange'}={}){requireExecutiveControl(s);const c=player(s);
 if(yearAt(s.week)<19||!c.capabilities.games)throw new Error('Game storefronts require Year 19 and a game-company capability.');
 if(s.gameStores.some(x=>x.companyId===c.id))throw new Error('Your company already operates a storefront.');
 const cost=27500;if(c.finance.cash<cost+7000)throw new Error('Funded store launch and cash reserve required.');
 expense(s,c,cost,'game-store-setup','Game distribution store launch');
 const store={id:id(s,'gamestore'),companyId:c.id,name:String(name||'Arcade Exchange').trim().slice(0,44),startedWeek:s.week,active:true,monthlyCost:950,
  subscribed:false,tier:10,regionSubs:{},subscriptionGross:0,grossStoreFees:0,history:[],historyComplete:true};s.gameStores.push(store);return store;}
function gameStoreById(s,storeId){const store=s.gameStores.find(x=>x.id===storeId);if(!store||!store.active)throw new Error('Store unavailable.');return store;}
function gameStoreAvailable(s,p,store){return p?.sector==='games'&&p.status==='released'&&p.route!=='contract'&&
 gameDistributionAllowed(s,p,s.week)&&yearAt(s.week)>=19&&(!p.videoGame?.exclusiveUntil||p.videoGame.exclusiveUntil<=s.week);}
function gameStoreOffer(s,storeId,projectId,fee=1800){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),operator=company(s,store.companyId),owner=company(s,p?.companyId);
 if(!p||!owner||!operator||owner.id===operator.id||!gameStoreAvailable(s,p,store))throw new Error('Only independent, authorized completed games may be negotiated.');
 if(!Number.isFinite(fee)||fee<500||fee>10000)throw new Error('Invalid fixed rights license fee.');
 if(s.gameStoreOffers.some(o=>o.storeId===storeId&&o.projectId===projectId&&['counter','accepted','booked'].includes(o.status)))throw new Error('Offer already exists.');
 const counter=money(Math.max(fee,Math.min(10000,1300+p.quality*17)));const row={id:id(s,'gamestoreoffer'),storeId,operatorId:operator.id,ownerId:owner.id,
  projectId,proposedFee:money(fee),counterFee:counter,acceptedFee:null,status:fee>=counter?'accepted':'counter',createdWeek:s.week,expiresWeek:s.week+12,windowId:null};
 if(row.status==='accepted')row.acceptedFee=row.proposedFee;s.gameStoreOffers.push(row);return row;}
function gameAnswerStoreOffer(s,offerId,accept){const o=s.gameStoreOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No valid pending store counteroffer.');
 o.status=accept?'accepted':'declined';if(accept)o.acceptedFee=o.counterFee;return o;}
function gameListStore(s,storeId,projectId,offerId=null){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),c=company(s,store.companyId);
 if(!p||!gameStoreAvailable(s,p,store)||!c||s.gameStoreWindows.some(w=>w.storeId===storeId&&w.projectId===projectId&&w.endWeek>s.week))throw new Error('Store title is unavailable or already listed.');
 const external=p.companyId!==c.id,o=external?s.gameStoreOffers.find(x=>x.id===offerId):null;
 if(external&&(!o||o.storeId!==storeId||o.projectId!==p.id||o.status!=='accepted'||s.week>o.expiresWeek||o.ownerId!==p.companyId))throw new Error('Independent owner must accept valid matching terms.');
 const fee=external?o.acceptedFee:0;if(c.finance.cash<fee+3000)throw new Error('Insufficient cash to book catalog rights.');
 if(fee){expense(s,c,fee,'game-store-license','Lawful fixed fee for '+p.title,p.id);revenue(s,company(s,p.companyId),fee,'game-store-license-income','Store license earned: '+p.title,p.id);}
 const window={id:id(s,'gamestorewindow'),storeId,projectId:p.id,ownerId:p.companyId,offerId:o?.id||null,fee,
  startWeek:s.week,endWeek:s.week+52,share:.2,subscription:true,grantId:p.grantId||null};
 if(p.grantId){const grant=s.grants.find(g=>g.id===p.grantId);window.endWeek=Math.min(window.endWeek,grant.endWeek+(grant.continuationWeeks||0));}
 s.gameStoreWindows.push(window);if(o){o.status='booked';o.windowId=window.id;}return window;}
function gameWindows(s,storeId,atWeek=s.week){return s.gameStoreWindows.filter(w=>w.storeId===storeId&&w.startWeek<=atWeek&&w.endWeek>atWeek&&
 s.projects.some(p=>p.id===w.projectId&&p.companyId===w.ownerId&&gameDistributionAllowed(s,p,atWeek)));}
function gameSelectStore(s,projectId,storeId){const {p,g}=gameProject(s,projectId,false);if(p.status!=='released'||!gameWindows(s,storeId).some(x=>x.projectId===p.id)||g.exclusiveStoreId&&g.exclusiveUntil>s.week&&g.exclusiveStoreId!==storeId)throw new Error('Only actually licensed, nonconflicting stores may sell this game.');
 g.storeId=storeId;return {storeId};}
function gameMarketSplit(s,p,gross,region){const g=p.videoGame;g.lastStoreOwnerId=null;
 const win=g.storeId?gameWindows(s,g.storeId).find(x=>x.projectId===p.id):null;
 if(!win){if(g.exclusiveStoreId&&g.exclusiveUntil>s.week)return {fee:0,net:0,channel:'exclusive-blocked'};return {fee:money(gross*.27),net:money(gross*.73),channel:'external'};}
 g.lastStoreOwnerId=s.gameStores.find(x=>x.id===win.storeId)?.companyId||null;return {fee:money(gross*win.share),net:money(gross*(1-win.share)),channel:'licensed-store'};}
function gameSubscribeStore(s,storeId,enabled){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId||typeof enabled!=='boolean')throw new Error('Invalid subscription operator or setting.');
 if(enabled&&yearAt(s.week)<23)throw new Error('Game subscriptions require mature digital infrastructure in Year 23.');
 if(enabled&&!gameWindows(s,storeId).length)throw new Error('Subscription launch requires lawfully licensed catalog titles.');
 store.subscribed=enabled;return store;}
function gameStoreWeek(s){
 // Proprietary game technology is an ongoing supported capability, not a free perpetual bonus.
 if(s.week%4===0)for(const c of s.companies||[])if(c.gameEngine&&!c.bankrupt){
  expense(s,c,c.gameEngine.maintenance||240,'game-engine-upkeep','Maintain in-house production engine and tools');
 }
 s.gameMarketReserved={};for(const store of s.gameStores||[])if(store.active){
 const c=company(s,store.companyId);if(!c||c.bankrupt)continue;
 if(s.week>store.startedWeek&&s.week%4===0)expense(s,c,store.monthlyCost,'game-store-upkeep','Customer support, bandwidth and store discovery');
 if(!store.subscribed)continue;const licensed=gameWindows(s,store.id);
 for(const region of activeRegions(s)){const budget=worldMarketBudget(s,'games',region.name),w=store.regionSubs[region.name]||{subscribers:0,gross:0,churn:0};store.regionSubs[region.name]=w;
 const ceiling=Math.floor(Math.max(0,budget*.18-(s.gameMarketReserved[region.name]||0))/(store.tier/4.33));const target=licensed.length?Math.floor(ceiling*clamp(.18+licensed.length*.08,.1,.65)):0;
 const next=w.subscribers<target?Math.min(target,w.subscribers+Math.ceil((target-w.subscribers)*.2)):Math.max(target,w.subscribers-Math.ceil((w.subscribers-target)*.25));
 w.churn+=Math.max(0,w.subscribers-next);w.subscribers=next;const gross=money(Math.min(Math.max(0,budget*.18-(s.gameMarketReserved[region.name]||0)),next*store.tier/4.33));if(!gross)continue;
 bookConsumerReceipt(s,c,gross,'game-subscriptions','Paid game catalog subscriptions in '+region.name);
 w.gross=money(w.gross+gross);store.subscriptionGross=money(store.subscriptionGross+gross);
 s.gameMarketReserved[region.name]=money((s.gameMarketReserved[region.name]||0)+gross);
 store.history.push({week:s.week,region:region.name,subscribers:next,gross,licensed:licensed.length});if(store.history.length>160){store.history.shift();store.historyComplete=false;}
 }
 }}
function gameStoreReport(s,storeId){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId)throw new Error('Not your game storefront.');
 return {...store,licenses:gameWindows(s,storeId).map(w=>({...w,title:s.projects.find(x=>x.id===w.projectId)?.title||''})),
  note:'Subscription payments reserve real game audience budgets before other game purchases. Licensed games are not sold outside their effective rights.'};}
function auditVideoGames(s,problems){for(const p of s.projects||[])if(p.sector==='games'){
 const g=p.videoGame;if(!g||!GAME_PLATFORMS[g.platform]||g.generation<1||!Number.isInteger(g.bugs)||g.bugs<0||g.bugs>100||
 !GAME_MECHANICS.includes(g.mechanic)||!GAME_MODELS.includes(g.model)||!Array.isArray(g.stages)||
 !Array.isArray(g.qaHistory)||!Array.isArray(g.communityActions)||!Array.isArray(g.support)||
 !Array.isArray(g.weeklySales)||g.weeklySales.some(x=>x.week> s.week||x.week<p.startWeek||x.gross<0)||
 (g.certification?.regions||[]).some(r=>!REGIONS.some(x=>x.name===r))||
 (p.status==='released'&&(!Array.isArray(g.launchRegions)||g.launchRegions.some(r=>!REGIONS.some(x=>x.name===r))))||
 !Number.isFinite(g.platformFees)||g.platformFees<0)problems.push(p.id+': invalid game production or sales provenance');
 }
 for(const store of s.gameStores||[]){if(!company(s,store.companyId)||store.startedWeek>(s.week)||store.startedWeek<(19-1)*52||
 !Number.isFinite(store.subscriptionGross)||store.subscriptionGross<0||!Array.isArray(store.history)||store.history.some(x=>x.week> s.week||x.gross<0)||
 Math.abs(Object.values(store.regionSubs||{}).reduce((n,x)=>n+x.gross,0)-store.subscriptionGross)>.10)problems.push('Invalid game store cash/subscriber history');}
 for(const w of s.gameStoreWindows||[]){const store=s.gameStores.find(x=>x.id===w.storeId),p=s.projects.find(x=>x.id===w.projectId),o=s.gameStoreOffers.find(x=>x.id===w.offerId);
 if(!store||!p||w.startWeek> s.week||w.endWeek<=w.startWeek||w.endWeek-w.startWeek>52||w.ownerId!==p.companyId||p.sector!=='games'||
 w.grantId!==(p.grantId||null)||w.fee<0||w.share!==.2||w.ownerId!==store.companyId&&(!o||o.status!=='booked'||o.windowId!==w.id||o.acceptedFee!==w.fee||o.ownerId!==w.ownerId))problems.push('Invalid game digital distribution rights');}
 for(const e of s.gameExclusiveOffers||[]){const p=s.projects.find(x=>x.id===e.projectId),st=s.gameStores.find(x=>x.id===e.storeId);
 if(!p||!st||e.ownerId!==p.companyId||e.operatorId!==st.companyId||e.ownerId===e.operatorId||!['accepted','counter','declined','booked'].includes(e.status)||
 e.expiresWeek!==e.createdWeek+8||e.createdWeek>s.week||![13,26,52].includes(e.weeks)||e.proposedGrant<2500||e.counterGrant<2500||
 (e.status==='booked'&&(p.videoGame?.exclusiveStoreId!==e.storeId||p.videoGame?.exclusiveUntil!==e.activatedWeek+e.weeks||e.activatedWeek>s.week||e.acceptedGrant<=0)))problems.push('Invalid exclusive game contract or cash provenance');}
 for(const o of s.gameStoreOffers||[]){if(!s.gameStores.some(x=>x.id===o.storeId&&x.companyId===o.operatorId)||!s.projects.some(x=>x.id===o.projectId&&x.companyId===o.ownerId)||
 !['counter','accepted','declined','booked'].includes(o.status)||o.expiresWeek!==o.createdWeek+12||o.createdWeek>s.week||
 o.proposedFee<500||o.counterFee<500||o.status==='accepted'&&o.acceptedFee!==o.counterFee&&o.acceptedFee!==o.proposedFee)problems.push('Invalid game store offer');}
}

// UPDATE 41: optional corporate financing and succession. Only the player root
// gets governance. Normal startups have NO board and retain ordinary controls.
// No equity or ownership event can grant, sell or transfer underlying IP.
const CAPITAL_POOL=500000;
function initialGovernance(s){
 if(!Number.isFinite(s.investorPool))s.investorPool=CAPITAL_POOL;
 if(!Number.isFinite(s.investorPoolOpening))s.investorPoolOpening=CAPITAL_POOL;
 if(!Number.isFinite(s.insurancePool))s.insurancePool=150000;
 if(!Number.isFinite(s.insurancePoolOpening))s.insurancePoolOpening=150000;
 if(!Array.isArray(s.insuranceFlows))s.insuranceFlows=[];
 if(!Array.isArray(s.governanceHistory))s.governanceHistory=[];
 if(!Array.isArray(s.careerLineage))s.careerLineage=[];
 if(!Array.isArray(s.personalMoneyHistory))s.personalMoneyHistory=[];
 if(!Number.isFinite(s.founderFunds))s.founderFunds=0;
 if(!s.runStatus)s.runStatus='active';
 if(!s.management)s.management={personId:s.founder.id,role:'founder-manager',status:'active',plannedSuccessorId:null,historyComplete:false};
 for(const c of s.companies||[])if(!c.corporate&&c.id===s.playerId){
  c.corporate={stage:'founder',baselineEquity:c.finance.equity,shares:{founder:1000,investor:0,public:0},
   board:null,policy:{minCashWeeks:4,reviewLimit:15000,maxDebtRatio:.7},fundings:[],shareSales:[],dividends:[],resolutions:[],lineage:[{week:s.week,kind:'founded',companyId:c.id}],historyComplete:false};
 }
 for(const c of s.companies||[])if(c.corporate&&!c.corporate.insurance)c.corporate.insurance={active:false,startWeek:-1,premium:240,coveredCost:0,weeklyEvidence:[],premiumsPaid:0,claimsPaid:0};
}
function rootGoverned(s){if(!s.management)initialGovernance(s);const c=player(s);if(!c||c.parentId)throw new Error('Governance requires a legally controlled root company.');return c;}
function governanceEvent(s,c,kind,detail={}){
 const row={id:id(s,'governance'),week:s.week,companyId:c.id,kind,...detail};
 s.governanceHistory.push(row);
 if(c.corporate)c.corporate.lineage.push({week:s.week,kind,...detail});
 return row;
}
function requireExecutiveControl(s){if(s.runStatus==='ended'||s.management?.status!=='active')throw new Error('No active executive authority over this company; resolve succession or start a lawful independent firm.');}
function corporateStatus(s){const c=rootGoverned(s),g=c.corporate,total=Object.values(g.shares).reduce((a,b)=>a+b,0);
 return {companyId:c.id,stage:g.stage,board:g.board?g.board.slice():null,ownership:{...g.shares,total,founderShare:total?g.shares.founder/total:0},
  manager:{...s.management},founderFunds:s.founderFunds,policy:{...g.policy},recent:g.lineage.slice(-16),runStatus:s.runStatus};}
function corporateReadiness(s){const c=rootGoverned(s),f=c.finance;
 const checks={solvent:!c.bankrupt&&f.cash>=12000&&f.payable<Math.max(10000,f.cash*.75),
  leadership:!!(c.teams||[]).find(t=>t.leaderId&&(s.employees||[]).some(e=>e.id===t.leaderId&&e.status==='employed')),
  accounting:Math.abs(companyBalance(c))<EPS&&s.reports!==null,
  independence:!c.parentId};
 return {checks,eligible:Object.values(checks).every(Boolean)&&c.corporate.stage==='founder',
  note:'Financial, leadership and record readiness, not an artificial company-size level.'};}
function corporationOnly(s){const c=rootGoverned(s);if(!['private-corporation','public-corporation'].includes(c.corporate.stage))throw new Error('Only an incorporated company has board and shareholder governance.');return c;}
function incorporateStudio(s){requireExecutiveControl(s);const c=rootGoverned(s),r=corporateReadiness(s);if(!r.eligible)throw new Error('Corporation readiness checklist not yet met.');
 const legal=1800;if(c.finance.cash<legal+8000)throw new Error('Legal transition must protect operating cash.');
 expense(s,c,legal,'corporation-transition','Document real corporation readiness and legal conversion');
 c.corporate.stage='private-corporation';c.corporate.board=[{id:s.founder.id,role:'founder-director',orientation:'growth'},
 {id:c.id+':independent:1',role:'independent-director',orientation:'conservative'},
 {id:c.id+':independent:2',role:'independent-director',orientation:'balanced'}];
 c.corporate.historyComplete=true;
 governanceEvent(s,c,'incorporated',{legalCost:legal});news(s,c.name+' incorporates',
  'Optional corporation governance activated. The existing company still owns all its assets and rights; no IPO occurred.','company');
 return corporateStatus(s);}
function corporateValuation(s){const c=rootGoverned(s),f=c.finance;
 const tangible=money(Math.max(0,f.cash+(f.prepaid||0)+(f.receivable||0)+(f.inventory||0)+(f.investment||0)-f.payable-f.deferred-f.loanBalance));
 const underlying=s.ips.filter(i=>i.ownerId===c.id).length,earned=companyProfit(c);
 // Earnings are only a cautious proxy for near-term potential; market
 // confidence and leverage reduce the estimate, never company cash.
 const futureCashProxy=money(Math.min(120000,Math.max(0,earned)*.8));
 const marketConfidence=s.regionalEconomy?.[taxRegion(c).name]?.confidence||1;
 const leverage=clamp(f.loanBalance/Math.max(1,tangible+f.loanBalance),0,1);
 const outlookFactor=clamp(.8+.2*marketConfidence,.85,1.1);
 const riskFactor=1-.15*leverage;
 const expected=money(Math.max(8000,(tangible+futureCashProxy+Math.max(0,earned)*.35+underlying*1350+c.reputation*125)*outlookFactor*riskFactor));
 return {companyId:c.id,tangibleAssets:tangible,marketConfidence,futureCashProxy,leverage,
  conservative:money(expected*.68),expected,optimistic:money(expected*1.30),
  founderShare:corporateStatus(s).ownership.founderShare,
  note:'Illustrative company valuation (not cash or sale proceeds): tangible net value, observed earnings and modest owned-IP potential; rights remain titled to legal owners.'};}
function corporateRisk(s){const c=rootGoverned(s),f=c.finance,p=c.corporate.policy,weekly=weeklyOverhead(c,s),cash=Math.max(0,f.cash);
 const obligations=money(f.payable+f.deferred+f.loanBalance),runway=cash/Math.max(1,weekly),v=corporateValuation(s);
 return {cashRunwayWeeks:money(runway),liabilities:obligations,loanToValue:money(f.loanBalance/Math.max(1,v.expected)),
  cashBuffer:money(weekly*p.minCashWeeks),policy:{...p},
  scenarios:{conservative:money(Math.max(0,cash-weekly*13-obligations*.30)),expected:money(Math.max(0,cash-weekly*8-obligations*.15)),optimistic:money(Math.max(0,cash-weekly*5))},
  warning:runway<p.minCashWeeks||f.loanBalance/Math.max(1,v.expected)>p.maxDebtRatio};}
function setRiskPolicy(s,input={}){requireExecutiveControl(s);const c=rootGoverned(s),weeks=Number(input.minCashWeeks),limit=Number(input.reviewLimit),ratio=Number(input.maxDebtRatio);
 if(!Number.isInteger(weeks)||weeks<2||weeks>26||!Number.isInteger(limit)||limit<5000||limit>150000||!Number.isFinite(ratio)||ratio<.2||ratio>1)
 throw new Error('Invalid company risk settings.');
 c.corporate.policy={minCashWeeks:weeks,reviewLimit:limit,maxDebtRatio:ratio};governanceEvent(s,c,'risk-policy',{weeks,limit,ratio});return corporateRisk(s);}

// Real, optional supply-disruption coverage. No customer wallet, tax pool or
// rival firm receives imaginary income. Insurer reserve is finite; premiums
// are paid from company cash and claims need actual covered payroll evidence.
function setInsurance(s,active){requireExecutiveControl(s);const c=rootGoverned(s);if(s.runStatus==='ended')throw new Error('The campaign is concluded.');
 if(typeof active!=='boolean')throw new Error('Insurance policy must be explicitly enabled or disabled.');
 const i=c.corporate.insurance||(c.corporate.insurance={active:false,startWeek:-1,premium:240,coveredCost:0,weeklyEvidence:[],premiumsPaid:0,claimsPaid:0});
 if(active&&!i.active&&c.finance.cash<i.premium+weeklyOverhead(c,s)*2)throw new Error('Cannot begin insurance without operating cash.');
 if(i.active!==active){i.active=active;i.startWeek=s.week;governanceEvent(s,c,active?'insurance-started':'insurance-cancelled',{monthlyPremium:i.premium});}
 return insuranceStatus(s);
}
function insuranceStatus(s){const c=rootGoverned(s),i=c.corporate.insurance;
 return {active:!!i?.active,monthlyPremium:i?.premium||240,coveredCost:i?.coveredCost||0,
  lifetimePremium:i?.premiumsPaid||0,lifetimeClaims:i?.claimsPaid||0,insurerReserve:s.insurancePool,
  note:'Supply-shock payroll coverage only: 50 deductible, 60% reimbursement, capped at 2,500 per month and limited by funded insurer reserves. No sales booked.'};}
function accumulateInsurancePayroll(s,c,overhead){const i=c.corporate?.insurance;if(!i?.active||s.week<=i.startWeek)return;
 const region=taxRegion(c).name,index=s.regionalEconomy?.[region]?.wageIndex||1;
 const shock=(s.economicShocks||[]).find(q=>q.region===region&&q.kind==='supply'&&s.week-q.week<=13&&q.week<=s.week);
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
  const basis=money(Math.max(0,i.coveredCost-50)),claim=money(Math.min(2500,s.insurancePool,basis*.60));
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
 const available=money(f.cash-Math.max(0,f.payable)-weekly*4-outstanding);
 return {companyId:unit.id,name:unit.name,sector:unit.sector,observedCash:f.cash,
  companyProfit:companyProfit(unit),committedProduction:money(outstanding),weeklyPayroll:weekly,
  availableAfterRisks:available,decision:available>=5000?'Within cash limits':'Defer discretionary funding'};
 });
 return {rootCompanyId:c.id,units:rows.sort((a,b)=>b.availableAfterRisks-a.availableAfterRisks),
  note:'Advisory portfolio comparison from known controlled legal entities; no automatic funds moved, no intragroup sales created.'};
}
function renameCompany(s,name){requireExecutiveControl(s);const c=rootGoverned(s),next=String(name||'').trim().slice(0,42);
 if(s.runStatus==='ended'||s.management.status!=='active')throw new Error('No executive authority to rename this company.');
 if(next.length<3||next.toLowerCase()===c.name.toLowerCase()||s.companies.some(x=>x.id!==c.id&&x.name.toLowerCase()===next.toLowerCase()))throw new Error('Choose a distinct legal company name.');
 if(c.finance.cash<600+weeklyOverhead(c,s)*2)throw new Error('Company needs 600 registration cost and cash buffer.');
 const old=c.name;expense(s,c,600,'legal-name-change','Company registration of legal business name');c.name=next;
 governanceEvent(s,c,'company-renamed',{oldName:old,newName:next,fee:600});
 news(s,'Company renamed: '+next,old+' continues as '+next+' with unchanged legal IP titles, staff, debts and licenses.','company');
 return {oldName:old,newName:next,fee:600};
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
 if(!['expansion','financing','succession','ipo','investment','restructuring'].includes(kind)||!Number.isFinite(v)||v<0||v>1000000)
 throw new Error('Invalid corporation resolution.');
 const risk=corporateRisk(s),independentSupport=kind==='succession'||kind==='ipo'||v<=Math.max(0,c.finance.cash-risk.cashBuffer)&&risk.loanToValue<=policy.maxDebtRatio;
 const votes=c.corporate.board.map((m,i)=>({directorId:m.id,vote:i===0?'yes':independentSupport?'yes':'no'}));
 const approved=votes.filter(x=>x.vote==='yes').length>=2;
 const row={id:id(s,'resolution'),kind,amount:money(v),week:s.week,expiresWeek:s.week+13,votes,approved,used:false};
 c.corporate.resolutions.push(row);
 governanceEvent(s,c,'board-resolution',{resolutionId:row.id,kind,approved});
 return {...row};}
function boardMandate(s,kind,amount,use=false){const c=rootGoverned(s),g=c.corporate;if(g.stage==='founder'||amount<g.policy.reviewLimit)return null;
 const r=g.resolutions.findLast(r=>r.kind===kind&&r.approved&&!r.used&&r.week<=s.week&&r.expiresWeek>=s.week&&r.amount>=amount);
 if(!r)throw new Error('Board authorization required for material '+kind+' commitments.');
 if(use)r.used=true;return r;}
function issueShares(s,amount,kind){const c=corporationOnly(s),q=money(Number(amount));
 if(s.runStatus!=='active')throw new Error('Resolve executive control before issuing equity.');
 if(!Number.isFinite(Number(amount))||q<5000||q>250000||q>s.investorPool)throw new Error('Investor capital offer exceeds the finite funded market pool or permitted range.');
 const valuation=corporateValuation(s).expected,total=c.corporate.shares.founder+c.corporate.shares.investor+c.corporate.shares.public;
 const shares=Math.max(1,Math.ceil(total*q/valuation));if(shares>total*3)throw new Error('Issuance is too dilutive for one funding round.');
 // External investors pay company treasury; this is paid-in equity, NOT sales.
 transact(s,c,'outside-equity-contribution',{cash:q,equity:q},'External shareholder capital received (not revenue)');
 c.corporate.shares[kind]=c.corporate.shares[kind]+shares;
 s.investorPool=money(s.investorPool-q);
 c.corporate.fundings.push({week:s.week,amount:q,shares,kind});
 governanceEvent(s,c,'equity-raised',{amount:q,shares,kind});
 if(corporateStatus(s).ownership.founderShare<.5&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {amount:q,shares,stage:c.corporate.stage,founderVoteShare:corporateStatus(s).ownership.founderShare};}
function raiseEquity(s,amount){requireExecutiveControl(s);const c=corporationOnly(s);if(c.corporate.stage!=='private-corporation')throw new Error('Private equity is available only before public listing.');return issueShares(s,amount,'investor');}
function launchIPO(s,amount=12000){requireExecutiveControl(s);const c=corporationOnly(s);
 if(c.corporate.stage==='public-corporation')throw new Error('Company is already publicly listed.');
 if(yearAt(s.week)<25)throw new Error('Simplified public markets do not mature until World Year 25.');
 if(!c.teams.length||c.reputation<20||c.bankrupt)throw new Error('Company is not eligible for public listing.');
 const approval=boardVote(s,'ipo',Number(amount));if(!approval.approved)throw new Error('Board rejected public listing.');
 const fee=2400;if(c.finance.cash<fee+8000)throw new Error('Cannot finance the listing and maintain operating reserves.');
 expense(s,c,fee,'public-listing-fee','Underwriting and simplified disclosure expenses');
 const row=issueShares(s,amount,'public');c.corporate.stage='public-corporation';
 governanceEvent(s,c,'public-listing',{cost:fee,amount:row.amount});
 return {...row,stage:c.corporate.stage,fee};}
function sellFounderShares(s,count){const c=corporationOnly(s),shares=Number(count),g=c.corporate;
 if(s.runStatus==='ended'||!Number.isInteger(shares)||shares<1||shares>g.shares.founder)throw new Error('Founder may sell only valid personally held shares.');
const price=money(corporateValuation(s).expected/(g.shares.founder+g.shares.investor+g.shares.public));const proceeds=money(price*shares);
 if(proceeds>s.investorPool)throw new Error('External investors lack the funds to buy this equity.');
 // Investor buys EXISTING founder shares: no proceeds go to the company.
 g.shares.founder-=shares;g.shares.investor+=shares;s.investorPool=money(s.investorPool-proceeds);
 s.founderFunds=money(s.founderFunds+proceeds);g.shareSales.push({week:s.week,shares,price,proceeds});
 s.personalMoneyHistory.push({week:s.week,kind:'share-sale',amount:proceeds,companyId:c.id});
 governanceEvent(s,c,'founder-share-sale',{shares,proceeds});
 if(corporateStatus(s).ownership.founderShare<.5&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {shares,proceeds,founderVoteShare:corporateStatus(s).ownership.founderShare};}
function payDividend(s,amount){requireExecutiveControl(s);const c=corporationOnly(s),f=c.finance,q=money(Number(amount)),g=c.corporate;
 if(!Number.isFinite(Number(amount))||q<1000||companyProfit(c)<q||f.cash<q+weeklyOverhead(c,s)*8)throw new Error('Dividend requires distributable lifetime profit and cash reserves.');
 const sum=g.shares.founder+g.shares.investor+g.shares.public,personal=money(q*g.shares.founder/sum);
 transact(s,c,'paid-equity-distribution',{cash:-q,equity:-q},'Cash distributed to all shareholders in legal proportion');
 s.founderFunds=money(s.founderFunds+personal);g.dividends.push({week:s.week,amount:q,founderReceived:personal});
 s.personalMoneyHistory.push({week:s.week,kind:'dividend',amount:personal,companyId:c.id});
 governanceEvent(s,c,'dividend',{amount:q,founderReceived:personal});return {total:q,founderReceived:personal};}
function planLeadership(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=75||e.skill<45||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Only an eligible current team leader may be nominated.');
 s.management.plannedSuccessorId=e.id;governanceEvent(s,c,'successor-nominated',{personId:e.id});return {nomineeId:e.id,name:e.name,eligible:true};}
function chooseLeader(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=75||e.skill<45||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Successor must be a legally eligible employed leader.');
 if(c.corporate.stage!=='founder'&&!boardVote(s,'succession',0).approved)throw new Error('Corporate board rejected executive appointment.');
 s.management.personId=e.id;s.management.role='appointed-executive';s.management.status='active';s.management.plannedSuccessorId=null;
 governanceEvent(s,c,'executive-appointed',{personId:e.id});
 news(s,'Executive succession at '+c.name,e.name+' takes the management role. All shares, voting rights, underlying IP, contracts and liabilities stay legally unchanged.','company');
 return {...s.management};}
function stepDown(s){const c=rootGoverned(s);s.management.status='transition';governanceEvent(s,c,'executive-vacancy',{personId:s.management.personId});
 alert(s,'career-transition-'+c.id,'Leadership transition','Choose an eligible successor, a legitimately funded independent new company, or conclude this run.','critical');
 return {...s.management};}
function contestExecutiveControl(s){const c=corporationOnly(s),own=corporateStatus(s).ownership;
 if(s.management.status==='removed')return {...s.management};
 if(own.founderShare>=.5)throw new Error('Founder voting control has not been lost.');
 s.management.status='removed';governanceEvent(s,c,'shareholder-removal',{formerManagerId:s.management.personId});
 alert(s,'management-control-'+c.id,'Loss of executive control','Outside shareholders now hold majority votes. The founder may seek an authorized role, start anew with personal funds, or end the run. Company assets remain in place.','critical');
 return {...s.management};}
function startFreshCompany(s,data={}){const old=rootGoverned(s),capital=money(Number(data.capital)),sector=String(data.sector||'publishing'),name=String(data.name||'').trim().slice(0,42);
 if(s.runStatus==='ended'||!['removed','transition'].includes(s.management.status))throw new Error('A lawful exit or loss of management control is required before a new-company continuation.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('New company cannot predate its worldwide industry.');
 const severityReserve=s.settings.difficulty==='challenging'?2.25:s.settings.difficulty==='casual'?1.55:1.75;
 if(!Number.isFinite(Number(data.capital))||capital<SECTORS[sector].cost*severityReserve||capital>s.founderFunds||capital<=0)throw new Error('New firm requires independently documented founder funds and difficulty-adjusted sector startup reserves.');
 if(name.length<3||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct new-company name.');
 if(s.founder.age>=85)throw new Error('Founder is no longer legally available to manage a new company.');
 const neu=createCompany(s,{name,sector,origin:'Independent continuation',cash:capital,capacity:1,foundedYear:yearAt(s.week),homeRegion:old.homeRegion,isPlayer:true});
 old.isPlayer=false;s.playerId=neu.id;s.founderFunds=money(s.founderFunds-capital);
 s.personalMoneyHistory.push({week:s.week,kind:'new-company-capital',amount:-capital,companyId:neu.id});
 neu.corporate={stage:'founder',baselineEquity:capital,shares:{founder:1000,investor:0,public:0},board:null,
  policy:{minCashWeeks:4,reviewLimit:15000,maxDebtRatio:.7},fundings:[],shareSales:[],dividends:[],resolutions:[],lineage:[{week:s.week,kind:'new-independent-company',companyId:neu.id}],historyComplete:true};
 s.careerLineage.push({week:s.week,fromId:old.id,toId:neu.id,capital,kind:'fresh-company'});
 s.management={personId:s.founder.id,role:'founder-manager',status:'active',plannedSuccessorId:null,historyComplete:true};
 s.runStatus='active';governanceEvent(s,neu,'independent-continuation',{fromId:old.id,capital});
 news(s,'New independent company: '+name,'Personally funded start with no asset, title, team, contract or liability transfer from '+old.name+'.','company');return neu;}
function endRun(s){if(s.runStatus==='ended')throw new Error('Run already concluded.');const c=rootGoverned(s);s.runStatus='ended';governanceEvent(s,c,'run-ended',{personId:s.management.personId});return {status:'ended',companyId:c.id,year:yearAt(s.week)};}
function careerHistory(s){return {runStatus:s.runStatus,founder:{...s.founder},executive:{...s.management},personalFunds:s.founderFunds,
 events:s.governanceHistory.slice(-50),continuations:s.careerLineage.slice(),difficulty:s.settings.difficulty};}
function reviewFounderTransition(s){
 if(!s.management||s.runStatus==='ended'||s.management.status!=='active')return;
 if(s.management.personId!==s.founder.id){
  const executive=(s.employees||[]).find(e=>e.id===s.management.personId&&e.status==='employed'&&e.employerId===s.playerId);
  if(!executive){s.management.status='transition';alert(s,'executive-departure-'+s.playerId,'Executive position vacant',
    'The previously appointed leader no longer works here. Choose another eligible executive or a legally funded continuation.','critical');
    governanceEvent(s,player(s),'executive-departed',{personId:s.management.personId});}
  return;
 }

 const threshold=s.settings.difficulty==='challenging'?75:s.settings.difficulty==='casual'?80:77;
 if(s.founder.age>=threshold){s.management.status='transition';alert(s,'successor-due-'+s.playerId,'Leadership succession due',
 'Founder leadership reached the configured career horizon. Choose an authorized successor, independent funded continuation, or end; property is never transferred by default.','critical');
 governanceEvent(s,player(s),'succession-due',{age:s.founder.age});}}
function auditGovernance(s,problems){if(!player(s)?.corporate)problems.push('Missing player company governance identity');
 if(!Number.isFinite(s.investorPool)||s.investorPool<-.01||!Number.isFinite(s.investorPoolOpening)||
 !Array.isArray(s.governanceHistory)||!Array.isArray(s.personalMoneyHistory)||!Array.isArray(s.careerLineage)||!Number.isFinite(s.founderFunds)||s.founderFunds<-.01||
 !['active','ended'].includes(s.runStatus)||!s.management||!['active','transition','removed'].includes(s.management.status)){
 problems.push('Invalid governance and career records');return;}
 let financing=0,usedShares=0;
 for(const c of s.companies){const g=c.corporate;if(!g)continue;
 const st=['founder','private-corporation','public-corporation'].includes(g.stage),sh=g.shares,
 sum=Object.values(sh||{}).reduce((n,x)=>n+x,0),founder=Number.isInteger(sh?.founder)&&sh.founder>=0;
 if(!st||!founder||!Number.isInteger(sh.investor)||sh.investor<0||!Number.isInteger(sh.public)||sh.public<0||sum<1||
 g.stage==='founder'&&g.board!==null||g.stage!=='founder'&&(!Array.isArray(g.board)||g.board.length!==3)||
 !g.policy||!Number.isInteger(g.policy.reviewLimit)||g.policy.reviewLimit<5000||g.policy.minCashWeeks<2||g.policy.minCashWeeks>26||
 g.policy.maxDebtRatio<.2||g.policy.maxDebtRatio>1||!Array.isArray(g.fundings)||!Array.isArray(g.shareSales)||!Array.isArray(g.dividends)||!Array.isArray(g.resolutions)||!Array.isArray(g.lineage))
 problems.push('Invalid corporate share ledger or governance board');
 let issued=0,netSaleShares=0,distribution=0;
 for(const f of g.fundings||[]){if(!['investor','public'].includes(f.kind)||!Number.isInteger(f.shares)||f.shares<=0||f.amount<5000||f.week>s.week)problems.push('Invalid issued equity funding');issued=money(issued+f.amount);netSaleShares+=f.shares;}
 for(const f of g.shareSales||[]){if(!Number.isInteger(f.shares)||f.shares<1||f.proceeds<0||f.week>s.week)problems.push('Invalid personal share sale');}
 for(const d of g.dividends||[]){if(d.amount<=0||d.founderReceived<0||d.founderReceived>d.amount||d.week>s.week)problems.push('Invalid shareholder distribution');distribution=money(distribution+d.amount);}
 if(sum!==1000+netSaleShares)problems.push('Invalid share issuance conservation');
 if(g.stage!=='founder'&&Math.abs(c.finance.equity-money(g.baselineEquity+issued-distribution))>.031)problems.push('Invalid company paid-in equity bridge');
 for(const r of g.resolutions||[])if(!['expansion','financing','succession','ipo','investment','restructuring'].includes(r.kind)||r.expiresWeek!==r.week+13||r.week>s.week||!Array.isArray(r.votes)||r.votes.length!==3||r.approved!== (r.votes.filter(v=>v.vote==='yes').length>=2))problems.push('Invalid board resolution votes');
 financing+=issued;usedShares+=(g.shareSales||[]).reduce((n,x)=>n+x.proceeds,0);
 }
 if(Math.abs(money(s.investorPoolOpening-s.investorPool-financing-usedShares))>.10)problems.push('Invalid investor capital pool conservation');
 if(!Number.isFinite(s.insurancePool)||s.insurancePool<-.01||!Number.isFinite(s.insurancePoolOpening)||!Array.isArray(s.insuranceFlows))problems.push('Invalid funded insurance reserve');
 else {let balance=s.insurancePoolOpening;for(const f of s.insuranceFlows){
   const c=s.companies.find(c=>c.id===f.companyId);if(!c?.corporate?.insurance||!['premium','claim'].includes(f.kind)||f.amount<=0||f.week>s.week)problems.push('Invalid insurance claim or premium source');
   balance+=f.kind==='premium'?f.amount:-f.amount;}
 if(Math.abs(money(balance-s.insurancePool))>.10)problems.push('Invalid insurer pool conservation');
 for(const c of s.companies)if(c.corporate?.insurance){const i=c.corporate.insurance;
  const prem=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='premium').reduce((n,f)=>n+f.amount,0)),
        claim=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='claim').reduce((n,f)=>n+f.amount,0));
  if(Math.abs(prem-i.premiumsPaid)>.10||Math.abs(claim-i.claimsPaid)>.10||i.coveredCost<0||!Array.isArray(i.weeklyEvidence))problems.push('Invalid company insurance evidence');
 }}
 const personal=money(s.personalMoneyHistory.reduce((n,x)=>n+x.amount,0));
 if(Math.abs(personal-s.founderFunds)>.10)problems.push('Invalid founder personal capital provenance');
 for(const h of s.careerLineage)if(!s.companies.some(c=>c.id===h.fromId)||!s.companies.some(c=>c.id===h.toId)||h.week>s.week)problems.push('Invalid company lineage');
}

return {corporateStatus,corporateReadiness,corporateValuation,corporateRisk,setRiskPolicy,setInsurance,insuranceStatus,groupInvestmentReview,renameCompany,investmentCommittee,incorporateStudio,boardVote,raiseEquity,launchIPO,sellFounderShares,payDividend,planLeadership,chooseLeader,stepDown,contestExecutiveControl,startFreshCompany,endRun,careerHistory,SAVE_VERSION,GAME_PLATFORMS,GAME_MECHANICS,GAME_MODELS,gameOfferExclusive,gameAnswerExclusive,gameBookExclusive,gameDesign,gamePrototype,gameBuildEngine,gameChooseEngine,gameQA,gameBeta,gameCertify,gameSetModel,gameCommunity,gameSupport,gameReadiness,openGameStore,gameStoreOffer,gameAnswerStoreOffer,gameListStore,gameSelectStore,gameSubscribeStore,gameStoreReport,gameWindows,requestStreamingLicense,answerStreamingLicense,TV_NETWORKS,TV_SLOTS,STREAM_TIERS,tvPlanSeason,tvWritersRoom,tvEditEpisode,tvCast,tvSchedule,tvUseBacklot,tvRatings,tvRenewSeason,tvEndSeries,streamingReady,launchStreamingService,setStreamingTier,licenseStreamingTitle,streamingCatalog,streamingReport,FILM_METHODS,buildFilmBacklot,useFilmBacklot,filmPremiere,filmActorPool,filmAudition,filmChooseCast,filmDecision,filmDistribution,filmBoxOffice,PUBLISHING_PRICES,openPublishingOutlet,listPublishingOutlet,closePublishingOutlet,publishingOutletReport,requestManuscriptApproval,reviewSerialArc,publishingFormatAvailable,publishingFormatTreatment,translatePublishingEdition,createPublishingImprint,assignPublishingImprint,publishingImprintReport,openPublishingPreorders,manuscriptMarket,negotiateManuscript,answerManuscript,publishingInterest,setPublishingChannel,setSerialCadence,publishingSalesReport,editorialAssessment,editorialDecision,creatorCareer,creativeAwards,worldHistory,scoutEmergingCreator,developEmergingCreator,publishingCharts,candidatePool,employeeRoster,hireCandidate,renewEmployee,releaseEmployee,setCompanyCulture,configureStaffDelegation,configureTalentAuthority,delegateSpecialists,trainTeam,teamPerformance,availableSpecialists,bookSpecialist,setFranchiseReleaseTarget,coordinateFranchiseReleases,franchiseMomentum,franchiseAudienceSignals,routineCounterQueue,batchApproveRoutineCounters,captureAnnualSnapshots,historicalCompanyFinances,portfolioRankings,portfolioRecords,searchNewsArchive,dismissRoutineAdvisories,setPausePolicy,setDashboardFocus,SECTORS,THEMES,TARGET_AUDIENCES,CREATIVE_DIRECTIONS,MARKET_POSITIONINGS,coProductionQuote,investmentComparison,proposeCoProduction,answerCoProductionOffer,configureCoProductionAuthority,startCoProduction,coProductionStatement,requestCommission,answerCommissionOffer,configureCommissionAuthority,cancelProject,counterpartyTrust,WORLD_SCALES,activeRegions,regionalEconomyReport,audienceCohorts,estimateWeeklyPayroll,marketLoanRate,applyEconomicShock,businessTechnology,investResearch,adoptTechnology,technologyReport,worldMarketBudget,worldSetupWarnings,economicBrief,quarterlyMarketHistory,GENRES,FORMATS,MONTHS,ORIGINS,REGIONS,createGame,player,company,previewProject,createProject,franchiseBible,editFranchiseBible,editFranchiseBranch,franchiseSchedule,franchiseOverview,FRANCHISE_BRANCHES,changeProjectTeam,interveneProduction,projectEvidence,projectHistory,canUseIp,createOption,offerRights,offerRenewal,answerRightsOffer,exerciseLicensedOption,requestCreativeApproval,decideCreativeApproval,configureRightsAuthority,enterSector,capabilityCost,hireTeam,eligibleClients,advance,available,yearAt,yearWeek,periodAt,periodLabel,dismissAlert,companyProfit,companyBalance,currentProjectProfit,projectBudget,orderPrintRun,setPrintPolicy,writeOffPrintStock,productionFinancial,franchiseFinancial,financialStatements,settlementEvidence,groupSettlementEvidence,closedSettlementHistory,closedSettlementAudit,obligationExposure,groupObligationIntegrity,portfolioBudget,balanceSheetDetails,activeObligationRegister,rightsCalendar,royaltyStatements,liquidityForecast,loanLimit,borrowLoan,repayLoan,foundSubsidiary,controlledCompanies,chargeSharedServices,consolidatedStatements,audit,loadState,transactionsFor,shortMoney};
});

