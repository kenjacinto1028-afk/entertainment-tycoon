
/* Studio Syndicate — initial prototype simulation engine. No external dependencies. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudioEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
'use strict';
// Generated build reads config/compiled.json on Node or embedded JSON in the standalone HTML.
const CFG = (typeof module === 'object' && module.exports) ? require('../config/compiled.json') : globalThis.__STUDIO_CONFIG__;
if(!CFG || !CFG.save || !Number.isInteger(CFG.save.SAVE_VERSION))throw new Error('Studio Syndicate configuration missing or incompatible');

const SAVE_VERSION = CFG.save.SAVE_VERSION;
const SECTORS = Object.freeze(CFG.world.SECTORS);
const MONTHS = CFG.world.MONTHS;
const MONTH_WEEKS = CFG.world.MONTH_WEEKS;
const GENRES = CFG.creativity.GENRES;
const THEMES=Object.freeze(CFG.creativity.THEMES);
const TARGET_AUDIENCES=Object.freeze(CFG.creativity.TARGET_AUDIENCES);
const CREATIVE_DIRECTIONS=Object.freeze(CFG.creativity.CREATIVE_DIRECTIONS);
const MARKET_POSITIONINGS=Object.freeze(CFG.creativity.MARKET_POSITIONINGS);
const FRANCHISE_BRANCHES=Object.freeze(CFG.creativity.FRANCHISE_BRANCHES);
function pitchFrom(data){return {theme:THEMES.includes(data.theme)?data.theme:'Found family',
  targetAudience:TARGET_AUDIENCES.includes(data.targetAudience)?data.targetAudience:'all',
  direction:CREATIVE_DIRECTIONS.includes(data.direction)?data.direction:'balanced',
  positioning:MARKET_POSITIONINGS.includes(data.positioning)?data.positioning:'broad'};}
function audienceAffinity(p,cohort){
  const pitch=p.pitch;if(!pitch)return 1;
  const target=pitch.targetAudience==='young'?'Young explorers':pitch.targetAudience==='family'?'Family readers':pitch.targetAudience==='mature'?'Mature audiences':null;
  const match=!target||cohort.name===target;
  let reach=target?(match?CFG.tuning_engine.reach__001:CFG.tuning_engine.reach__002):1;
  if(pitch.positioning==='niche')reach*=match?CFG.tuning_engine.audienceAffinity__001:CFG.tuning_engine.audienceAffinity__002;
  if(pitch.positioning==='prestige')reach*=cohort.name==='Mature audiences'?CFG.tuning_engine.audienceAffinity__003:CFG.tuning_engine.audienceAffinity__004;
  return reach;
}
const FORMATS = CFG.creativity.FORMATS;
const REGIONS = CFG.regions.REGIONS;
const ORIGINS = CFG.starting.ORIGINS;
const AI_NAMES = CFG.rivals.AI_NAMES;
const EPS = CFG.finance.EPS;
// Background companies are small financially constrained firms whose original
// releases compete for the SAME regional wallets as detailed studio titles.
const WORLD_SCALES = Object.freeze(CFG.world.WORLD_SCALES);
const BACKGROUND_LEDGER_LIMIT = CFG.world.BACKGROUND_LEDGER_LIMIT;
const CAPITAL_PRESETS=Object.freeze(CFG.starting.CAPITAL_PRESETS);
const WORLD_MATURITY=Object.freeze(CFG.world.WORLD_MATURITY);
const TECH_PACES=Object.freeze(CFG.world.TECH_PACES);
const ADOPTION_PACES=Object.freeze(CFG.world.ADOPTION_PACES);
const CAPABILITY_PACES=Object.freeze(CFG.world.CAPABILITY_PACES);
const POPULATION_SCALES=Object.freeze(CFG.world.POPULATION_SCALES);
const DEFAULT_RIVAL_COUNTS=Object.freeze(CFG.world.DEFAULT_RIVAL_COUNTS);
 // all firms share the normal bounded journal

// Keep an exact recent ledger window while trimming in batches: shifting 4,500
// array elements after every sale dominated century-long simulation time.
// Archived older transactions are already represented in financial balances and reports.
const LEDGER_RETAIN = CFG.world.LEDGER_RETAIN;
const LEDGER_TRIM_AT = CFG.world.LEDGER_TRIM_AT;
const money = n => (Math.round((Number(n)||0)*CFG.tuning_engine.money__001)/CFG.tuning_engine.money__002)||0;
const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
function hash(input) {let h=CFG.tuning_engine.h__001; for (const c of String(input)) {h^=c.charCodeAt(0);h=Math.imul(h,CFG.tuning_engine.hash__001);}return (h>>>0)||CFG.tuning_engine.hash__002;}
function rand(s) {let x=s.rng>>>0;x^=x<<CFG.tuning_engine.rand__001;x^=x>>>CFG.tuning_engine.rand__002;x^=x<<CFG.tuning_engine.rand__003;s.rng=x>>>0;return (s.rng>>>0)/CFG.tuning_engine.rand__004;}
function pick(s, xs) {return xs[Math.floor(rand(s)*xs.length)];}
function id(s, prefix) {s.sequence++;return prefix+'_'+String(s.sequence).padStart(CFG.tuning_engine.id__001,'0');}
function yearAt(week) {return Math.floor(week/CFG.tuning_engine.yearAt__001)+1;}
function yearWeek(week) {return week%CFG.tuning_engine.yearWeek__001+1;}
function periodAt(week) {let index=week%CFG.tuning_engine.index__001, used=0;for (let i=0;i<CFG.tuning_engine.periodAt__001;i++){used+=MONTH_WEEKS[i];if (index<used) return i;}return CFG.tuning_engine.periodAt__002;}
function periodLabel(week) {return MONTHS[periodAt(week)]+' · Y'+yearAt(week);}
function available(sector, week) {return !!SECTORS[sector] && yearAt(week)>=SECTORS[sector].year;}
function company(s, idValue) {return s.companies.find(c=>c.id===idValue);}
// Market-potential changes consumers' spending pool, never existing company cash.
// Separate settings control world maturity, geographic reach and competition.
function activeRegions(s){return REGIONS.slice(0,s.settings.regionCount||CFG.tuning_engine.activeRegions__001);}
function regionalEconomyReport(s){return Object.fromEntries(REGIONS.map(r=>[r.name,{currency:r.currency,...(s.regionalEconomy?.[r.name]||{confidence:1,inflation:CFG.tuning_engine.regionalEconomyReport__001,employment:1,fxRate:r.baseFx,wageIndex:1,interestIndex:1})}]));}
// Three broad spending cohorts are deliberately aggregated. Each regional wallet
// remains finite, even when a niche genre becomes especially popular.
const COHORT_TASTES=Object.freeze(CFG.regions.COHORT_TASTES);
function audienceCohorts(s,regionName){
 const r=activeRegions(s).find(x=>x.name===regionName);if(!r)return [];
 const index=REGIONS.findIndex(x=>x.name===r.name);
 const young=[CFG.tuning_engine.young__001,CFG.tuning_engine.young__002,CFG.tuning_engine.young__003,CFG.tuning_engine.young__004][index],family=[CFG.tuning_engine.family__001,CFG.tuning_engine.family__002,CFG.tuning_engine.family__003,CFG.tuning_engine.family__004][index];
 return COHORT_TASTES.map((c,i)=>({name:c.name,share:[young,family,1-young-family][i],tastes:{...c.tastes}}));
}
function estimateWeeklyPayroll(s,companyId=s.playerId){const c=company(s,companyId);if(!c)throw new Error('Unknown payroll company.');return weeklyOverhead(c,s);}
function marketLoanRate(s,companyId=s.playerId){const c=company(s,companyId);if(!c)throw new Error('Unknown borrower.');const base=s.settings.difficulty==='challenging'?CFG.tuning_engine.base__001:s.settings.difficulty==='casual'?CFG.tuning_engine.base__002:CFG.tuning_engine.base__003;return money(clamp(base*(s.regionalEconomy?.[taxRegion(c).name]?.interestIndex||1),CFG.tuning_engine.marketLoanRate__001,CFG.tuning_engine.marketLoanRate__002));}
function applyEconomicShock(s,regionName,kind='supply'){
 const r=activeRegions(s).find(r=>r.name===regionName);if(!r)throw new Error('Unknown or unavailable market for disruption.');
 if(!['supply','confidence'].includes(kind))throw new Error('Unknown economic disruption.');
 const v=s.regionalEconomy[r.name];
 v.confidence=money(clamp(v.confidence-(kind==='supply'?CFG.tuning_engine.applyEconomicShock__001:CFG.tuning_engine.applyEconomicShock__002),CFG.tuning_engine.applyEconomicShock__003,CFG.tuning_engine.applyEconomicShock__004));
 if(kind==='supply')v.wageIndex=money(clamp(v.wageIndex+CFG.tuning_engine.applyEconomicShock__005,CFG.tuning_engine.applyEconomicShock__006,CFG.tuning_engine.applyEconomicShock__007));
 const item={id:id(s,'shock'),week:s.week,region:r.name,kind,impact:kind==='supply'?'Manufacturing delays and higher labor pressure':'Temporary entertainment demand slowdown'};
 s.economicShocks.unshift(item);if(s.economicShocks.length>CFG.tuning_engine.applyEconomicShock__008)s.economicShocks.length=CFG.tuning_engine.applyEconomicShock__009;
 news(s,r.name+' economic disruption',item.impact+' temporarily changes real audience wallets and business costs.','world');
 return item;
}
function technologyReport(s){
  const discovery=TECH_PACES[s.settings.discoveryPace]||1, adoption=ADOPTION_PACES[s.settings.adoptionPace]||1;
  const result={};
  for(const [sector,info] of Object.entries(SECTORS)){
    const debut=(info.year-1)*CFG.tuning_engine.debut__001,first=debut+Math.max(CFG.tuning_engine.first__001,Math.round(CFG.tuning_engine.first__002*discovery));
    const wave=Math.max(0,Math.floor((s.week-first)/(CFG.tuning_engine.wave__001)));
    const discover=first+wave*CFG.tuning_engine.discover__001;
    const discovered=s.week>=first&&available(sector,s.week);
    const adoptionLevel=discovered?clamp((s.week-discover)*adoption/(CFG.tuning_engine.adoptionLevel__001*CFG.tuning_engine.adoptionLevel__002),0,1):0;
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
 const effectiveness=now.discovered&&adoptedWave>0?money(lag===0?CFG.tuning_engine.effectiveness__001:lag===1?CFG.tuning_engine.effectiveness__002:CFG.tuning_engine.effectiveness__003):0;
 const researchBonus=money((research?.level||0)*CFG.tuning_engine.researchBonus__001*(research?.wave>0&&now.wave>research.wave?CFG.tuning_engine.researchBonus__002:1));
 const upgradeCost=money(CFG.tuning_engine.upgradeCost__001+SECTORS[sector].cost*CFG.tuning_engine.upgradeCost__002);
 return {companyId:c.id,sector,globalWave:now.wave,discovered:now.discovered,adoptedWave,obsolete:lag>0,
   effectiveness,researchBonus,researchSpend:research?.spent||0,researchLevel:research?.level||0,
   upgradeCost,canUpgrade:now.discovered&&!!c.capabilities?.[sector]&&now.wave>adoptedWave&&c.finance.cash>=upgradeCost+CFG.tuning_engine.businessTechnology__001};
}
function investResearch(s,sector,amount=CFG.tuning_engine.investResearch__001,companyId=s.playerId){
 requireExecutiveControl(s);const c=company(s,companyId),cost=money(Number(amount));
 if(!c||!controlledCompanies(s).some(x=>x.id===companyId))throw new Error('Cannot fund unrelated research.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('Research sector unavailable before its global debut.');
 if(!c.capabilities?.[sector])throw new Error('The company needs legitimate sector capability before research.');
 if(!Number.isFinite(Number(amount))||cost<CFG.tuning_engine.investResearch__002||cost>CFG.tuning_engine.investResearch__003)throw new Error('Research requires a funded budget of 2,500–25,000.');
 if(c.finance.cash<cost+CFG.tuning_engine.investResearch__004)throw new Error('Insufficient cash and payroll buffer for research.');
 const tech=technologyReport(s)[sector],old=c.research?.[sector],same=old&&old.wave===tech.wave;
 const spent=money((same?old.spent:0)+cost),level=Math.min(CFG.tuning_engine.level__001,Math.max(Math.floor(spent/CFG.tuning_engine.level__002),same?(old.acquiredLevel||0):0));
 expense(s,c,cost,'research-development','Company-funded '+SECTORS[sector].name+' research');
 if(!c.research)c.research={};c.research[sector]={spent,level,acquiredLevel:same?(old.acquiredLevel||0):0,wave:tech.wave,updatedWeek:s.week};
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
 if(c.finance.cash<b.upgradeCost+CFG.tuning_engine.adoptTechnology__001)throw new Error('Insufficient cash for vendor technology and payroll buffer.');
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
function departLeader(s,e,kind='departed',severance=false){
 const c=company(s,e.employerId),t=c?.teams.find(t=>t.id===e.teamId);
 if(severance){const due=money(e.weeklySalary*CFG.tuning_engine.due__001);if(c.finance.cash<due+CFG.tuning_engine.departLeader__001)throw new Error('Insufficient cash for contractual severance.');expense(s,c,due,'severance','Team lead departure: '+e.name);}
 if(t&&t.leaderId===e.id)t.leaderId=null;
 e.history.push({week:s.week,kind,companyId:e.employerId,teamId:e.teamId,weeklySalary:e.weeklySalary});
 if(e.history.length>CFG.tuning_engine.departLeader__002)e.history=e.history.slice(-CFG.tuning_engine.departLeader__003);
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
 news(s,CFG.events.messages.setCompanyCulture__001,c.name+' chooses '+culture+' staff support. Morale and weekly cash costs respond over time.','company');
 return culture;
}
function annualCareers(s){
 const founder=s.founder;if(founder){founder.age=founder.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(founder.enteredWeek));founder.experience=founder.experience||0;
   if(founder.age>=CFG.tuning_engine.annualCareers__001&&!founder.retirementNoted){founder.retirementNoted=true;alert(s,'founder-retirement',CFG.events.messages.annualCareers__001,
     CFG.events.messages.annualCareers__002,'advisory');}}
 for(const e of s.employees||[]){if(e.status!=='employed')continue;
   const c=company(s,e.employerId);if(!c||c.bankrupt)continue;
   e.age=e.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(e.enteredWeek));
   const culture=c.culture||'balanced';e.morale=clamp(e.morale+(culture==='supportive'?CFG.tuning_engine.annualCareers__002:culture==='lean'?-CFG.tuning_engine.annualCareers__003:1)+(e.trait==='collaborative'&&culture==='supportive'?CFG.tuning_engine.annualCareers__004:0),CFG.tuning_engine.annualCareers__005,CFG.tuning_engine.annualCareers__006);
   if(e.age>=CFG.tuning_engine.annualCareers__007+(hash(e.id)%CFG.tuning_engine.annualCareers__008)){departLeader(s,e,'retired');continue;}
   if(s.week>=e.contractEndWeek){
     if(e.morale>=CFG.tuning_engine.annualCareers__009){e.contractEndWeek=s.week+CFG.tuning_engine.annualCareers__010;e.history.push({week:s.week,kind:'renewed',companyId:e.employerId,teamId:e.teamId,weeklySalary:e.weeklySalary});}
     else {departLeader(s,e,'departed');continue;}
   }
 }
 // Candidates age too; retired and stale external applicants rotate out without
 // fabricating a career record for someone who never worked here.
 s.candidates=s.candidates.filter(e=>{e.age=e.ageAtEntry+Math.max(0,yearAt(s.week)-yearAt(e.enteredWeek));return e.age<CFG.tuning_engine.annualCareers__011&&s.week-e.enteredWeek<CFG.tuning_engine.annualCareers__012;});
 // Background and rival personnel obey the same candidate, cash and team-capacity rules.
 seedCandidates(s,CFG.tuning_engine.annualCareers__013);
}
function recruitVacancies(s){
 for(const c of s.companies){if(c.bankrupt)continue;
   const policy=c.staffPolicy||{autoFill:true,maxSalary:CFG.tuning_engine.policy__001};if(!policy.autoFill)continue;
   for(const t of c.teams)if(!t.leaderId&&!teamBusy(s,t.id)){
     const options=s.candidates.filter(e=>e.status==='candidate'&&e.weeklySalary<=policy.maxSalary).sort((a,b)=>
      (b.specialty===t.specialty?CFG.tuning_engine.options__001:0)+b.skill-((a.specialty===t.specialty?CFG.tuning_engine.options__002:0)+a.skill));
     if(!options.length)continue;
     // Same funded transaction for player and AI; quiet if no affordable hire.
     if(c.finance.cash<options[0].weeklySalary*CFG.tuning_engine.recruitVacancies__001+weeklyOverhead(c,s)*CFG.tuning_engine.recruitVacancies__002+CFG.tuning_engine.recruitVacancies__003)continue;
     try{staffHire(s,options[0].id,t.id,true);}catch(err){/* A failed offer never mints a worker or money. */}
   }
 }
}
function configureStaffDelegation(s,{autoFill,maxSalary}){
 if(typeof autoFill!=='boolean'||!Number.isFinite(Number(maxSalary))||maxSalary<CFG.tuning_engine.configureStaffDelegation__001||maxSalary>CFG.tuning_engine.configureStaffDelegation__002)throw new Error('Staff delegation requires opt-in and a weekly wage cap.');
 const c=player(s);c.staffPolicy={autoFill,maxSalary:money(maxSalary)};return {...c.staffPolicy};
}
// Teams are delegated workgroups, not extra project slots invented at launch.
function newTeam(s,c,index,specialty) {
  const genre=GENRES.includes(specialty)?specialty:GENRES[(index*CFG.tuning_engine.genre__001+s.companies.length)%GENRES.length];
  const t={id:id(s,'team'),name:CFG.starting.TEAM_LABELS[index%CFG.tuning_engine.t__001]+' '+(index+1),specialty:genre,skill:CFG.tuning_engine.t__002+(hash(c.name+':'+index)%CFG.tuning_engine.t__003),workWeeks:0,completed:0,trainingHistory:[],performanceHistory:[],leaderId:null};
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
  return c.teams.filter(t=>!teamBusy(s,t.id)).sort((a,b)=>(b.specialty===genre?CFG.tuning_engine.selectTeam__001:0)+b.skill-((a.specialty===genre?CFG.tuning_engine.selectTeam__002:0)+a.skill))[0]||null;
}
function eligibleClients(s,fee,producerId=s.playerId){
  // No intragroup escrow until the separate-entity restricted-cash model is complete.
  return s.companies.filter(c=>c.id!==producerId&&!c.parentId&&!c.bankrupt&&c.finance.cash>=fee+CFG.tuning_engine.eligibleClients__001).sort((a,b)=>b.finance.cash-a.finance.cash);
}

function createBackgroundFirm(s,sector,index,era) {
  if(!available(sector,s.week))throw new Error('Minor firm cannot precede world industry debut.');
  const base=SECTORS[sector].cost;
  const opening=money(base*(CFG.tuning_engine.opening__001+rand(s)*CFG.tuning_engine.opening__002));
  const genre=pick(s,GENRES);
  const firm={id:id(s,'minor'),name:CFG.rivals.BACKGROUND_FIRM_PREFIXES[index%CFG.tuning_engine.firm__001]+' '+CFG.rivals.BACKGROUND_FIRM_SUFFIXES[Math.floor(index/CFG.tuning_engine.firm__002)%CFG.tuning_engine.firm__003]+' '+sector,
    sector,foundedYear:Math.max(SECTORS[sector].year,era-Math.floor(rand(s)*CFG.tuning_engine.firm__004)),genre,productionRegion:REGIONS[index%REGIONS.length].name,quality:CFG.tuning_engine.firm__005+Math.floor(rand(s)*CFG.tuning_engine.firm__006),
    finance:financeStart(opening),bankrupt:false,active:null,releases:[],releasedTotal:0};
  s.backgroundFirms.push(firm);return firm;
}
function addBackgroundFirms(s,sector,era) {
  for(let i=0;i<WORLD_SCALES[s.settings.worldScale].perSector;i++)createBackgroundFirm(s,sector,i,era);
}
function backgroundOverhead(firm){return money(CFG.tuning_engine.backgroundOverhead__001+SECTORS[firm.sector].cost*CFG.tuning_engine.backgroundOverhead__002);}
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
    } else if(s.week%CFG.tuning_engine.backgroundProgress__001===Math.floor(hash(b.id)%CFG.tuning_engine.backgroundProgress__002)&&b.finance.cash>SECTORS[b.sector].cost*CFG.tuning_engine.backgroundProgress__003+CFG.tuning_engine.backgroundProgress__004) {
      const weeks=Math.max(CFG.tuning_engine.weeks__001,Math.round(SECTORS[b.sector].weeks*CFG.tuning_engine.weeks__002));
      const cost=money(SECTORS[b.sector].cost*(CFG.tuning_engine.cost__001+rand(s)*CFG.tuning_engine.cost__002));
      b.active={id:id(s,'minorjob'),title:b.name+' original '+(b.releasedTotal+1),genre:rand(s)<CFG.tuning_engine.backgroundProgress__005?b.genre:pick(s,GENRES),quality:clamp(b.quality+Math.floor((rand(s)-CFG.tuning_engine.backgroundProgress__006)*CFG.tuning_engine.backgroundProgress__007),CFG.tuning_engine.backgroundProgress__008,CFG.tuning_engine.backgroundProgress__009),marketingRatio:CFG.tuning_engine.backgroundProgress__010+rand(s)*CFG.tuning_engine.backgroundProgress__011,weeks,done:0,cost};
    }
    // A release is commercially active only for its finite 85-week lifecycle.
    b.releases=b.releases.filter(p=>s.week-p.releaseWeek<CFG.tuning_engine.backgroundProgress__012);
    if(b.finance.cash<=0&&b.finance.payable>SECTORS[b.sector].cost*CFG.tuning_engine.backgroundProgress__013){b.bankrupt=true;b.active=null;}
  }
}
function backgroundWeights(s,sector,region) {
  const results=[];
  for(const b of s.backgroundFirms){
    if(b.sector!==sector)continue;
    // A bankrupt owner may still have residual rights and sell its catalog,
    // but cannot spend additional production money or restart by fiat.
    for(const p of b.releases){
      const age=s.week-p.releaseWeek;if(age<0||age>=CFG.tuning_engine.backgroundWeights__001)continue;
      const weight=((p.quality/CFG.tuning_engine.weight__001)**CFG.tuning_engine.weight__002)*region.tastes[p.genre]*(1+CFG.tuning_engine.weight__003*p.marketingRatio)*Math.exp(-age/(sector==='publishing'?CFG.tuning_engine.weight__004:CFG.tuning_engine.weight__005));
      results.push({firm:b,genre:p.genre,weight});
    }
  }
  return results;
}
function createCompany(s, props) {
  const c={id:id(s,'company'),name:props.name,sector:props.sector,origin:props.origin||'Independent Studio',foundedYear:props.foundedYear||yearAt(s.week),reputation:props.reputation||CFG.tuning_engine.c__001,capacity:props.capacity||CFG.tuning_engine.c__002,homeRegion:REGIONS.some(r=>r.name===props.homeRegion)?props.homeRegion:REGIONS[0].name,teamLevel:1,capabilities:{[props.sector]:'internal'},finance:financeStart(money(props.cash)),research:{},techLicenses:{},isPlayer:!!props.isPlayer,annualBaseline:{revenue:0,expense:0},bankrupt:false,parentId:props.parentId||null,investedCapital:props.parentId?money(props.cash):0,culture:'balanced',filmBacklot:null,staffPolicy:{autoFill:true,maxSalary:CFG.tuning_engine.c__003},imprints:[],teams:[]};
  for(let i=0;i<c.capacity;i++)c.teams.push(newTeam(s,c,i));
  s.companies.push(c);return c;
}
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
function configureCommissionAuthority(s,policy={}){
  const maxFee=money(Number(policy.maxFee??s.commissionPolicy.maxFee));
  const minMargin=Number(policy.minMargin??s.commissionPolicy.minMargin);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(maxFee)||maxFee<CFG.tuning_engine.configureCommissionAuthority__001||maxFee>CFG.tuning_engine.configureCommissionAuthority__002||
     !Number.isFinite(minMargin)||minMargin<0||minMargin>CFG.tuning_engine.configureCommissionAuthority__003)
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
  const fraction=Number(data.capitalFraction??CFG.tuning_engine.fraction__001);
  if(![CFG.tuning_engine.coProductionQuote__001,CFG.tuning_engine.coProductionQuote__002,CFG.tuning_engine.coProductionQuote__003].includes(fraction))throw new Error('Choose a supported 20%, 30% or 40% cash-financing share.');
  const plan=previewProject(s,{...data,route,withForecast:false});
  const commitment=money(plan.grandTotal*fraction),revenueShare=money(fraction*CFG.tuning_engine.revenueShare__001);
  const partners=s.companies.filter(b=>b.id!==c.id&&!b.bankrupt&&!b.parentId&&!c.parentId&&b.capabilities[sector]&&(c.isPlayer||!b.isPlayer)&&b.teams?.some(t=>!teamBusy(s,t.id))&&b.finance.cash>=commitment+CFG.tuning_engine.partners__001)
    .sort((a,b)=>b.finance.cash-a.finance.cash).map(b=>({id:b.id,name:b.name,cash:b.finance.cash}));
  return {sector,route,capitalFraction:fraction,commitment,revenueShare,plannedTotal:plan.grandTotal,partners,
    ownership:'Producer keeps underlying IP and work; partner receives only contracted sales participation.'};
}
// A sponsor does not give up cash merely because a producer requests terms.
// Counteroffers are nonbinding until a matching offer is explicitly booked.
function configureCoProductionAuthority(s,policy={}){
  const amount=money(Number(policy.maxCommitment)),share=Number(policy.maxShare);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(amount)||amount<CFG.tuning_engine.configureCoProductionAuthority__001||amount>CFG.tuning_engine.configureCoProductionAuthority__002||
     !Number.isFinite(share)||share<CFG.tuning_engine.configureCoProductionAuthority__003||share>CFG.tuning_engine.configureCoProductionAuthority__004)throw new Error('Delegation needs bounded commitment and participation limits.');
  s.coProductionPolicy={autoCounter:policy.autoCounter,maxCommitment:amount,maxShare:share};
  return s.coProductionPolicy;
}
function proposeCoProduction(s,data={}){
  if(!data.companyId||data.companyId===s.playerId)requireExecutiveControl(s);
  const c=data.companyId?company(s,data.companyId):player(s),quote=coProductionQuote(s,data);
  const sponsor=quote.partners.find(x=>x.id===data.partnerId);
  if(!sponsor)throw new Error('A solvent independent co-producer with available team must be selected.');
  if(s.coProductionOffers.filter(x=>x.producerId===c.id&&x.status==='counter'&&s.week-x.createdWeek<=CFG.tuning_engine.proposeCoProduction__001).length>=CFG.tuning_engine.proposeCoProduction__002)
    throw new Error('Review earlier open financing counteroffers first.');
  const proposed=money(Number(data.participationShare??quote.revenueShare));
  if(!Number.isFinite(Number(data.participationShare??quote.revenueShare))||proposed<CFG.tuning_engine.proposeCoProduction__003||proposed>CFG.tuning_engine.proposeCoProduction__004)
    throw new Error('Co-production participation must be between 5% and 50%.');
  const partner=company(s,sponsor.id),plan=previewProject(s,{...data,route:quote.route,withForecast:false});
  // Terms depend on observable capital risk and partner reputation, not secret future sales.
  const minimum=money(clamp(quote.capitalFraction*CFG.tuning_engine.minimum__001+Math.max(0,CFG.tuning_engine.minimum__002-partner.reputation)*CFG.tuning_engine.minimum__003,CFG.tuning_engine.minimum__004,CFG.tuning_engine.minimum__005));
  const counter=proposed<minimum?minimum:null;
  const policy=s.coProductionPolicy;
  const delegated=counter!==null&&c.isPlayer&&policy.autoCounter&&quote.commitment<=policy.maxCommitment&&counter<=policy.maxShare;
  const accepted=counter===null||delegated;
  const row={id:id(s,'cooffer'),createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__001,
    producerId:c.id,sponsorId:partner.id,sector:quote.sector,route:quote.route,
    title:String(data.title||'Untitled Project').trim().slice(0,CFG.tuning_engine.row__002)||'Untitled Project',
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||CFG.tuning_engine.row__003),productionRegion:plan.productionRegion,
    teamId:data.teamId||'auto',flagship:data.flagship||'no',
    ...pitchFrom(data),creativeTermsComplete:true,
    capitalFraction:quote.capitalFraction,commitment:quote.commitment,proposedShare:proposed,
    counterShare:counter,acceptedShare:accepted?(counter??proposed):null,
    status:accepted?'accepted':'counter',delegated,projectId:null};
  s.coProductionOffers.push(row);
  if(row.status==='counter'&&c.isPlayer)alert(s,'co-offer-'+row.id,CFG.events.messages.proposeCoProduction__001,
    partner.name+' requests '+Math.round(counter*CFG.tuning_engine.proposeCoProduction__005)+'% gross-sales participation to fund '+row.title+'. No money has moved.','advisory');
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
      offer.title!==(String(data.title||'').trim().slice(0,CFG.tuning_engine.startCoProduction__001)||'Untitled Project')||
      offer.genre!==(GENRES.includes(data.genre)?data.genre:'Fantasy')||offer.format!==plan.format||
      offer.size!==plan.size||offer.marketing!==money(Number(data.marketing)||CFG.tuning_engine.startCoProduction__002)||
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
  if(producer.finance.cash<money(plan.grandTotal*CFG.tuning_engine.startCoProduction__003)+CFG.tuning_engine.startCoProduction__004)throw new Error('Producer lacks the required project launch reserve.');
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
  p.quality=Math.min(CFG.tuning_engine.startCoProduction__005,p.quality+(partnerTeam.specialty===p.genre?CFG.tuning_engine.startCoProduction__006:1));
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
  const hypotheticalFee=plan?money(plan.grandTotal*CFG.tuning_engine.hypotheticalFee__001):0;
  const licensing={};
  if(canLicense&&fore)for(const [key,ratio] of [['conservative',CFG.tuning_engine.investmentComparison__001],['expected',1],['optimistic',CFG.tuning_engine.investmentComparison__002]]){
    const f=fore.scenario[key];const revenue=money(hypotheticalFee*ratio+f.gross*CFG.tuning_engine.revenue__001*ratio);
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
  const title=String(data.title||'').trim().slice(0,CFG.tuning_engine.title__001);
  if(!title)throw new Error('Commission title is required.');
  const plan=previewProject(s,{...data,sector,route:'contract',clientId:'auto',withForecast:false});
  const client=company(s,data.clientId);
  if(!client||client.id===c.id||client.bankrupt||client.parentId||c.parentId||
     !eligibleClients(s,plan.contractFee,c.id).some(x=>x.id===client.id))throw new Error('No sufficiently funded independent client is available.');
  const fee=money(Number(data.fee??plan.contractFee));
  if(!Number.isFinite(Number(data.fee??plan.contractFee))||fee<CFG.tuning_engine.requestCommission__001||fee>CFG.tuning_engine.requestCommission__002)throw new Error('Invalid service fee proposal.');
  const trust=counterpartyTrust(s,client.id,c.id);
  const willingness=money(Math.min(client.finance.cash-CFG.tuning_engine.willingness__001,plan.contractFee*CFG.tuning_engine.willingness__002*trust.confidence));
  const agreed=fee<=willingness;
  const counter=agreed?null:money(Math.min(client.finance.cash-CFG.tuning_engine.counter__001,plan.contractFee*CFG.tuning_engine.counter__002*trust.confidence));
  if(!agreed&&counter<plan.grandTotal*CFG.tuning_engine.requestCommission__003)throw new Error('Client cannot support an economically viable fee.');
  const delegated=!agreed&&s.commissionPolicy.autoCounter&&fee<=s.commissionPolicy.maxFee&&counter<=s.commissionPolicy.maxFee&&counter>=plan.grandTotal*(1+s.commissionPolicy.minMargin);
  const row={id:id(s,'clientoffer'),clientId:client.id,producerId:c.id,sector,title,
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||CFG.tuning_engine.row__004),productionRegion:plan.productionRegion,
    proposedFee:fee,baseCost:plan.grandTotal,counterFee:counter,
    acceptedFee:agreed?fee:delegated?counter:null,
    status:agreed||delegated?'accepted':'counter',createdWeek:s.week,updatedWeek:s.week,projectId:null,
    delegated:!!delegated};
  s.commissionOffers.push(row);
  if(row.status==='counter')alert(s,'commission-counter-'+row.id,CFG.events.messages.requestCommission__001,
    client.name+' countered the proposed '+sector+' service fee. Review the Productions hub; no funds have moved.','advisory');
  return row;
}
function answerCommissionOffer(s,offerId,accept){
  const row=s.commissionOffers.find(o=>o.id===offerId);
  if(!row||row.producerId!==s.playerId||row.status!=='counter'||typeof accept!=='boolean')throw new Error('Only pending client counteroffers can be accepted or declined.');
  if(accept){const client=company(s,row.clientId);if(!client||client.bankrupt||client.finance.cash<row.counterFee+CFG.tuning_engine.answerCommissionOffer__001)throw new Error('Client lacks funds for this counteroffer.');
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
  news(s,'Project cancelled: '+p.title,CFG.events.messages.cancelProject__001,'production');
  return p;
}

function createGame(input={}) {
  const era=[1,CFG.tuning_engine.era__001,CFG.tuning_engine.era__002,CFG.tuning_engine.era__003,CFG.tuning_engine.era__004].includes(Number(input.era))?Number(input.era):1;
  let origin=ORIGINS[input.origin]?input.origin:'publisher';
  if(SECTORS[ORIGINS[origin].sector].year>era)origin='publisher';
  const seed=String(input.seed||'STUDIO-114');const s={version:SAVE_VERSION,seed,rng:hash(seed),sequence:0,week:(era-1)*CFG.tuning_engine.s__001,startedYear:era,playerId:null,settings:{difficulty:['casual','standard','challenging'].includes(input.difficulty)?input.difficulty:'standard',era,origin,
    worldScale:WORLD_SCALES[Number(input.worldScale)]?Number(input.worldScale):1,
    startingCapital:CAPITAL_PRESETS[input.startingCapital]?input.startingCapital:'standard',
    worldMaturity:WORLD_MATURITY[input.worldMaturity]?input.worldMaturity:'standard',
    aiCount:Number.isInteger(Number(input.aiCount))&&input.aiCount!==undefined&&String(input.aiCount)!==''?clamp(Number(input.aiCount),1,CFG.tuning_engine.s__002):DEFAULT_RIVAL_COUNTS[era],
    populationScale:POPULATION_SCALES.includes(Number(input.populationScale))?Number(input.populationScale):1,
    regionCount:[CFG.tuning_engine.s__003,CFG.tuning_engine.s__004,CFG.tuning_engine.s__005].includes(Number(input.regionCount))?Number(input.regionCount):CFG.tuning_engine.s__006,
    discoveryPace:TECH_PACES[input.discoveryPace]?input.discoveryPace:'standard',
    adoptionPace:ADOPTION_PACES[input.adoptionPace]?input.adoptionPace:'standard',
    capabilityPace:CAPABILITY_PACES[input.capabilityPace]?input.capabilityPace:'standard'},
    regionalEconomy:Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:CFG.tuning_engine.s__007,employment:1,fxRate:r.baseFx,wageIndex:1,interestIndex:1}])),economicShocks:[],technology:{historyComplete:true},marketBriefs:[],quarterlyMarketReports:[],companies:[],backgroundFirms:[],employees:[],candidates:[],specialists:[],creativeAwards:[],creatorRelations:[],creatorScouting:[],creatorHistoryComplete:true,filmActors:[],filmHonors:[],gameStores:[],gameStoreOffers:[],gameStoreWindows:[],gameMarketReserved:{},gameCommunityHistory:[],gameExclusiveOffers:[],tvHonors:[],tvCastRelations:[],streamingServices:[],streamingWindows:[],streamingOffers:[],streamingWeeklyReserved:{},streamingWeeklyTotal:0,talentPolicy:{autoBook:false,maxFee:CFG.tuning_engine.s__008},remittances:[],loans:[],projects:[],manuscripts:[],manuscriptOffers:[],ips:[],franchiseNotes:{},grants:[],rightsOffers:[],creativeApprovals:[],rightsPolicy:{autoRenew:false,maxFee:CFG.tuning_engine.s__009,extensionWeeks:CFG.tuning_engine.s__010},commissionPolicy:{autoCounter:false,maxFee:CFG.tuning_engine.s__011,minMargin:CFG.tuning_engine.s__012},commissionOffers:[],commissionHistory:[],coProductions:[],coProductionOffers:[],coProductionPolicy:{autoCounter:false,maxCommitment:CFG.tuning_engine.s__013,maxShare:CFG.tuning_engine.s__014},works:[],obligations:[],royaltyAccounts:[],escrows:[],news:[],archivedNews:[],inbox:[],ledger:[],reports:[],snapshots:[],dashboardFocus:'operations',pausePolicy:{stopForAdvisory:false},macroeconomy:1,weeklyConsumerSpend:0,founder:{id:'founder_0',name:(String(input.founder||'Alex Morgan').trim().slice(0,CFG.tuning_engine.s__015)||'Alex Morgan'),age:clamp(Number(input.age)||CFG.tuning_engine.s__016,CFG.tuning_engine.s__017,CFG.tuning_engine.s__018),ageAtEntry:clamp(Number(input.age)||CFG.tuning_engine.s__019,CFG.tuning_engine.s__020,CFG.tuning_engine.s__021),enteredWeek:(era-1)*CFG.tuning_engine.s__022,background:FOUNDER_BACKGROUNDS.includes(input.background)?input.background:'editorial',focus:FOUNDER_FOCUSES.includes(input.founderFocus)?input.founderFocus:'creative',experience:0,retirementNoted:false},worldStory:[]};
  const config=ORIGINS[origin],cash=money(config.cash * CAPITAL_PRESETS[s.settings.startingCapital] * (s.settings.difficulty==='casual'?CFG.tuning_engine.cash__001:s.settings.difficulty==='challenging'?CFG.tuning_engine.cash__002:1));
  const c=createCompany(s,{name:String(input.companyName||'Syndicate Works').trim().slice(0,CFG.tuning_engine.c__004)||'Syndicate Works',sector:config.sector,origin:config.name,cash,reputation:config.reputation,capacity:origin==='established'?CFG.tuning_engine.c__005:CFG.tuning_engine.c__006,foundedYear:era,homeRegion:input.homeRegion,isPlayer:true});s.playerId=c.id;
  // The four publishing origins change early staffing, payroll commitments and
  // creative focus without inheriting another company's property or rights.
  c.originWeeklyCommitment=config.weeklyCommitment||0;
  c.preferredFormat=config.preferredFormat||FORMATS[config.sector][0];
  if(config.teamGenres)for(let i=0;i<c.teams.length;i++){
    c.teams[i].specialty=config.teamGenres[i%config.teamGenres.length];
    c.teams[i].skill=Math.min(CFG.tuning_engine.createGame__001,c.teams[i].skill+(origin==='comics'||origin==='contract'?CFG.tuning_engine.createGame__002:0));
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
  if(era===1)news(s,CFG.events.messages.createGame__001,CFG.events.messages.createGame__002,'world');
  seedSpecialists(s);
  seedCandidates(s,CFG.tuning_engine.createGame__003);
  prepare43World(s,input);
  setDepth(s,DEPTH_MODES.includes(input.depth)?input.depth:CFG.depth.DEFAULT);
  s.decisionCards={year:yearAt(s.week),cards:0,low:0,auto:0};
  return s;
}
function seedRivals(s,era) {
  const categories=CFG.world.RIVAL_INITIAL_SECTOR_WEIGHTS;
  const availableCategories=categories.filter(sector=>SECTORS[sector].year<=era);
  const limit=s.settings.aiCount||DEFAULT_RIVAL_COUNTS[era];
  for(let i=0;i<limit;i++) {
    const sector=availableCategories[i%availableCategories.length],start=SECTORS[sector].year,originYear=Math.max(start,era-Math.floor(rand(s)*CFG.tuning_engine.originYear__001));
    const cash=money((CFG.tuning_engine.cash__003+rand(s)*(sector==='publishing'?CFG.tuning_engine.cash__004:CFG.tuning_engine.cash__005))*WORLD_MATURITY[s.settings.worldMaturity]);
    const c=createCompany(s,{name:AI_NAMES[i]||('Fictional Studio '+(i+1)),sector,foundedYear:originYear,cash,reputation:clamp(Math.round((CFG.tuning_engine.c__007+rand(s)*CFG.tuning_engine.c__008)*WORLD_MATURITY[s.settings.worldMaturity])+(s.settings.difficulty==='challenging'?CFG.tuning_engine.c__009:s.settings.difficulty==='casual'?-CFG.tuning_engine.c__010:0),CFG.tuning_engine.c__011,CFG.tuning_engine.c__012),capacity:1+Math.floor(rand(s)*CFG.tuning_engine.c__013),homeRegion:REGIONS[i%REGIONS.length].name});
    if(era>1)s.worldStory.push({year:originYear,text:c.name+' founded ('+SECTORS[sector].name+')',source:'Generated prehistory'});
  }
}
function sectorCost(sector,size=1,format='') {
  const factor=format==='Web Serial'?CFG.tuning_engine.factor__001:format==='Comic / Manga'?CFG.tuning_engine.factor__002:format==='Nonfiction'?CFG.tuning_engine.factor__003:format==='Ebook'?CFG.tuning_engine.factor__004:format==='Audiobook'?CFG.tuning_engine.factor__005:format==='Animated Film'?CFG.tuning_engine.factor__006:format==='Miniseries'?CFG.tuning_engine.factor__007:format==='Indie Game'?CFG.tuning_engine.factor__008:1;
  return Math.round(SECTORS[sector].cost*factor*size/CFG.tuning_engine.sectorCost__001)*CFG.tuning_engine.sectorCost__002;
}

function weeklyOverhead(c,s) {const base=(c.isPlayer?CFG.tuning_engine.base__004:CFG.tuning_engine.base__005)+(c.teamLevel-1)*CFG.tuning_engine.base__006+(c.capacity-CFG.tuning_engine.base__007)*CFG.tuning_engine.base__008+(c.originWeeklyCommitment||0);
 const leaders=(c.teams||[]).map(t=>(s.employees||[]).find(e=>e.id===t.leaderId&&e.status==='employed')).filter(Boolean);
 const namedWages=leaders.reduce((sum,e)=>sum+e.weeklySalary,0);
 const culture=(c.culture||'balanced')==='supportive'?CFG.tuning_engine.culture__001*(c.teams||[]).length:(c.culture||'balanced')==='lean'?-CFG.tuning_engine.culture__002*(c.teams||[]).length:0;
 return money(Math.max(CFG.tuning_engine.weeklyOverhead__001,base-CFG.tuning_engine.weeklyOverhead__002*(c.teams||[]).length+namedWages+culture)*(s?.regionalEconomy?.[taxRegion(c).name]?.wageIndex||1));}
// A read-only, imperfect forecast from published releases and known market spending.
// It does not inspect secret rival pipelines, draw randomness, or guarantee sales.
function forecastProject(s,data,plan,c) {
  const route=['original','adaptation','contract'].includes(data.route)?data.route:'original';
  const horizonWeeks=CFG.tuning_engine.horizonWeeks__001;
  const candidate={sector:plan.sector,genre:GENRES.includes(data.genre)?data.genre:'Fantasy',quality:clamp(CFG.tuning_engine.candidate__001+c.reputation*CFG.tuning_engine.candidate__002+plan.size*CFG.tuning_engine.candidate__003,CFG.tuning_engine.candidate__004,CFG.tuning_engine.candidate__005),budget:plan.budget,marketingBudget:plan.marketing,pitch:pitchFrom(data)};
  const stocked=plan.initialPrintCash>0;
  const printMarginal=plan.format==='Comic / Manga'?CFG.tuning_engine.printMarginal__001/CFG.tuning_engine.printMarginal__002:CFG.tuning_engine.printMarginal__003/CFG.tuning_engine.printMarginal__004;
  const distRate=stocked?CFG.tuning_engine.distRate__001*CFG.tuning_engine.distRate__002+CFG.tuning_engine.distRate__003*(CFG.tuning_engine.distRate__004+printMarginal):(plan.sector==='publishing'?CFG.tuning_engine.distRate__005:CFG.tuning_engine.distRate__006);
  let royaltyRate=0;
  if(route==='adaptation') {
    const permission=canUseIp(s,c,data.ipId,plan.sector);
    if(permission.grantId)royaltyRate=s.grants.find(g=>g.id===permission.grantId)?.royaltyRate||0;
  }
  const observations=projectEvidence(s,{companyId:c.id,sector:plan.sector,genre:candidate.genre,limit:CFG.tuning_engine.observations__001});
  // Previous 13-week launches inform market-fit uncertainty, not future
  // prophecy. Blend toward neutral when sample is small; cap correction.
  const comparable=observations.rows.filter(r=>r.expectedGross>0&&r.actualGross>=0);
  const averageRatio=comparable.length?comparable.reduce((n,r)=>n+clamp(r.actualGross/r.expectedGross,CFG.tuning_engine.averageRatio__001,CFG.tuning_engine.averageRatio__002),0)/comparable.length:1;
  const marketCalibration=money(clamp(1+(averageRatio-1)*comparable.length/(comparable.length+CFG.tuning_engine.marketCalibration__001),CFG.tuning_engine.marketCalibration__002,CFG.tuning_engine.marketCalibration__003));
  const revenueByScenario={};
  for(const [scenario,qualityShift,marketShift] of [['conservative',-CFG.tuning_engine.forecastProject__001,CFG.tuning_engine.forecastProject__002],['expected',0,1],['optimistic',CFG.tuning_engine.forecastProject__003,CFG.tuning_engine.forecastProject__004]]) {
    let gross=0;
    if(route!=='contract')for(let i=0;i<horizonWeeks;i++) {
      const futureWeek=s.week+plan.weeks+i;
      for(const region of activeRegions(s)) {
        const budget=worldMarketBudget(s,plan.sector,region.name,futureWeek)*marketShift;
        const decay=Math.exp(-i/(plan.sector==='publishing'?CFG.tuning_engine.decay__001:CFG.tuning_engine.decay__002));
        const reach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(candidate,k),0);
        const weight=((clamp(candidate.quality+qualityShift,CFG.tuning_engine.weight__006,CFG.tuning_engine.weight__007)/CFG.tuning_engine.weight__008)**CFG.tuning_engine.weight__009)*region.tastes[candidate.genre]*(1+CFG.tuning_engine.weight__010*(candidate.marketingBudget/Math.max(candidate.budget,1)))*decay*reach;
        const knownCompetition=s.projects.filter(p=>p.sector===plan.sector&&p.status==='released'&&p.releaseWeek<=futureWeek&&futureWeek-p.releaseWeek<CFG.tuning_engine.knownCompetition__001&&p.route!=='contract'&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=futureWeek&&g.endWeek+g.continuationWeeks>futureWeek))).reduce((sum,p)=>{
          const competingAge=futureWeek-p.releaseWeek;
          const rivalReach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(p,k),0);
          return sum+((p.quality/CFG.tuning_engine.knownCompetition__002)**CFG.tuning_engine.knownCompetition__003)*region.tastes[p.genre]*(1+CFG.tuning_engine.knownCompetition__004*(p.marketingBudget/Math.max(p.budget,1)))*Math.exp(-competingAge/(p.sector==='publishing'?CFG.tuning_engine.knownCompetition__005:CFG.tuning_engine.knownCompetition__006))*rivalReach;
        },0);
        gross+=budget*weight/(CFG.tuning_engine.forecastProject__005+weight+knownCompetition);
      }
    }
    gross=money(gross*(route==='contract'?1:marketCalibration));
    const receipts=route==='contract'?plan.contractFee:gross;
    revenueByScenario[scenario]={gross:money(gross),revenue:money(receipts),directContribution:money(receipts-gross*(distRate+royaltyRate)-plan.grandTotal)};
  }
  const committed=s.projects.filter(p=>p.companyId===c.id&&p.status==='active').reduce((sum,p)=>sum+Math.max(0,p.budget*(1-p.weeksDone/p.weeksTotal)),0);
  const advance=route==='contract'?plan.contractFee*CFG.tuning_engine.advance__002:0;
  // Stress-case liquidity before any new consumer sales, not an accounting profit forecast.
  const noSalesCashFloor=money(c.finance.cash+advance-plan.grandTotal-(plan.initialPrintCash||0)-committed-weeklyOverhead(c,s)*plan.weeks-c.finance.payable);
  return {horizonWeeks,estimatedAtWeek:s.week,estimatedQuality:money(candidate.quality),evidenceSampleSize:comparable.length,marketCalibration,scenario:revenueByScenario,royaltyRate,initialPrintCash:plan.initialPrintCash||0,noSalesCashFloor,
downsideWarning:noSalesCashFloor<0?'Possible cash shortfall before release. Other income or financing may be needed.':noSalesCashFloor<weeklyOverhead(c,s)*CFG.tuning_engine.forecastProject__006?'Thin pre-release cash buffer: leave room for operating expenses.':null,
    basis:route==='contract'?'Fixed client delivery fee, subject to completing the work.':stocked?'Estimated first 13 sales weeks; includes expected print COGS/wholesale fees, but retailer returns and stockouts can change results.':'Estimated first 13 sales weeks; future rivals, changing taste and economic shocks are uncertain.'};
}
// Manuscript rights are held by named independent publisher agencies. The author
// is credited in the catalog but no author's personal IP transfers by implication.
// Bids are nonbinding until a funded grant is signed by both companies.
const MANUSCRIPT_NAMES=CFG.publishing.MANUSCRIPT_NAMES;
function previewManuscripts(s){
 const owners=s.companies.filter(c=>!c.isPlayer&&c.sector==='publishing'&&!c.bankrupt);
 if(!owners.length)return [];
 return Array.from({length:Math.min(CFG.tuning_engine.previewManuscripts__001,owners.length+CFG.tuning_engine.previewManuscripts__002)},(_,i)=>{
  const owner=owners[i%owners.length],key=hash(s.seed+':manuscript-id:'+i).toString(CFG.tuning_engine.key__001);
  return {id:'manuscript_market_'+key,ipId:'ip_market_'+key,ownerId:owner.id,title:MANUSCRIPT_NAMES[i],
    genre:GENRES[hash(s.seed+':manuscript:'+i)%GENRES.length],
    authorName:['Maren Ash','Ivo Wren','Sera Vale','Cassian North','Ada Finch','Liora Stone'][i],
    advance:money(CFG.tuning_engine.previewManuscripts__003+(hash(s.seed+':advance:'+i)%CFG.tuning_engine.previewManuscripts__004)*CFG.tuning_engine.previewManuscripts__005),royaltyRate:money(CFG.tuning_engine.previewManuscripts__006+(i%CFG.tuning_engine.previewManuscripts__007)*CFG.tuning_engine.previewManuscripts__008),
    termWeeks:CFG.tuning_engine.previewManuscripts__009,agencyRate:CFG.tuning_engine.previewManuscripts__010,creatorApprovalRequired:false,createdWeek:s.week,status:'available',licenseId:null};
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
 if(!Number.isFinite(advance)||advance<CFG.tuning_engine.negotiateManuscript__001||advance>CFG.tuning_engine.negotiateManuscript__002||!Number.isFinite(royaltyRate)||royaltyRate<CFG.tuning_engine.negotiateManuscript__003||royaltyRate>CFG.tuning_engine.negotiateManuscript__004||!Number.isFinite(agencyRate)||agencyRate<0||agencyRate>CFG.tuning_engine.negotiateManuscript__005)
  throw new Error('Advance, agent share or royalty terms are invalid.');
 const agreed=advance>=m.advance&&royaltyRate>=m.royaltyRate&&agencyRate>=(m.agencyRate||0)&&(!m.creatorApprovalRequired||approvalRequired);
 const offer={id:id(s,'manuscriptoffer'),manuscriptId:m.id,ownerId:owner.id,buyerId:buyer.id,
  createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.offer__001,status:agreed?'agreed':'counter',
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
 if(buyer.finance.cash<fee+CFG.tuning_engine.answerManuscript__001)throw new Error('Insufficient cash for manuscript advance and operating reserve.');
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
const PUBLISHING_TREATMENTS=Object.freeze(CFG.publishing.PUBLISHING_TREATMENTS);
function publishingFormatTreatment(s,projectId,focus){
 const p=s.projects.find(p=>p.id===projectId),t=PUBLISHING_TREATMENTS[focus],c=p&&company(s,p.companyId);
 if(!p||!t||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!==t.format||
    p.status!=='active'||p.weeksDone>=p.weeksTotal*CFG.tuning_engine.publishingFormatTreatment__001||p.route==='contract')
  throw new Error('Choose an eligible active publishing title for this format treatment.');
 if(p.publishingFormatHistory.some(h=>h.focus===focus))throw new Error('This format treatment was already completed.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Binding creative veto requires the rights owner to approve substantive changes.');
 if(c.finance.cash<t.cost+CFG.tuning_engine.publishingFormatTreatment__002)throw new Error('Insufficient cash for the format treatment and payroll buffer.');
 expense(s,c,t.cost,'publishing-format','Optional '+focus+' services: '+p.title,p.id);
 p.directCost=money(p.directCost+t.cost);p.productionSpend=money((p.productionSpend||0)+t.cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+t.cost);
 p.weeksTotal+=t.weeks;p.creativeQuality=Math.round(clamp(p.creativeQuality+t.creative,1,CFG.tuning_engine.publishingFormatTreatment__003));
 p.technicalQuality=Math.round(clamp(p.technicalQuality+t.technical,1,CFG.tuning_engine.publishingFormatTreatment__004));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.publishingFormatTreatment__005+p.technicalQuality*CFG.tuning_engine.publishingFormatTreatment__006,1,CFG.tuning_engine.publishingFormatTreatment__007));
 const item={focus,week:s.week,cost:t.cost,quality:p.quality};p.publishingFormatHistory.push(item);return item;
}
function translatePublishingEdition(s,projectId,regionName){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),r=activeRegions(s).find(r=>r.name===regionName);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||p.status!=='released'||!r)
  throw new Error('Only a released publishing edition can be translated into an available region.');
 if(!printRightsActive(s,p))throw new Error('Publishing rights no longer authorize this edition.');
 if(p.translations.some(t=>t.region===r.name))throw new Error('Translation already funded for this region.');
 const cost=CFG.tuning_engine.cost__003;if(c.finance.cash<cost+CFG.tuning_engine.translatePublishingEdition__001)throw new Error('Insufficient cash for translation and operating reserve.');
 expense(s,c,cost,'publishing-translation','Regional translation: '+p.title+' / '+r.name,p.id);
 p.directCost=money(p.directCost+cost);
 const item={region:r.name,week:s.week,cost};p.translations.push(item);return item;
}
function createPublishingImprint(s,data={}){
 const c=player(s),name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__001),genre=data.genre;
 if(!c.capabilities.publishing||name.length<CFG.tuning_engine.createPublishingImprint__001||!GENRES.includes(genre))throw new Error('Choose an imprint name and publishing genre.');
 if(c.imprints.length>=CFG.tuning_engine.createPublishingImprint__002||c.imprints.some(i=>i.name.toLowerCase()===name.toLowerCase()))throw new Error('Imprint roster full or name already used.');
 const fee=CFG.tuning_engine.fee__002;if(c.finance.cash<fee+CFG.tuning_engine.createPublishingImprint__003)throw new Error('Insufficient cash for imprint branding.');
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
 const cost=CFG.tuning_engine.cost__004;if(c.finance.cash<cost+CFG.tuning_engine.openPublishingPreorders__001)throw new Error('Insufficient cash for the preorder marketing campaign.');
 const expected=p.forecast?.scenario?.expected?.gross||0;
 const registrations=Math.round(Math.max(0,expected)*CFG.tuning_engine.registrations__001/(p.format==='Comic / Manga'?CFG.tuning_engine.registrations__002:CFG.tuning_engine.registrations__003));
 expense(s,c,cost,'prelaunch-interest','Reader signup campaign for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.preorderCampaign={week:s.week,cost,registrations,kind:'nonbinding-reader-interest',paidDeposits:0};
 return {...p.preorderCampaign};
}
// Later publishing technologies require a world that has developed the
// supporting recording and digital infrastructure. No sector is opened early.
function publishingFormatAvailable(s,format){
 if(format==='Audiobook')return yearAt(s.week)>=CFG.tuning_engine.publishingFormatAvailable__001;
 if(format==='Ebook')return yearAt(s.week)>=CFG.tuning_engine.publishingFormatAvailable__002;
 return FORMATS.publishing.includes(format);
}
const PUBLISHING_PRICES=Object.freeze(CFG.publishing.PUBLISHING_PRICES);
function publishingUnitPrice(p){return p.printStock?.price||PUBLISHING_PRICES[p.format]||CFG.tuning_engine.publishingUnitPrice__001;}
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
 const startup=CFG.tuning_engine.startup__001;if(c.finance.cash<startup+weeklyOverhead(c,s)*CFG.tuning_engine.openPublishingOutlet__001)throw new Error('Insufficient cash to launch and staff an owned publishing outlet.');
 expense(s,c,startup,'publishing-outlet-setup','Open first-party publishing outlet');
 if(s.publishingOutlet){s.publishingOutlet.active=true;s.publishingOutlet.startupSpent=money(s.publishingOutlet.startupSpent+startup);}
 else s.publishingOutlet={id:id(s,'publishingoutlet'),companyId:c.id,active:true,createdWeek:s.week,startupSpent:startup,operatingSpent:0,catalog:[],customerGross:0,distributionFees:0,monthlyCost:CFG.tuning_engine.openPublishingOutlet__002};
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
const PUBLISHING_CHANNELS=CFG.publishing.PUBLISHING_CHANNELS;
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
 if(cadence==='fast'){p.weeksTotal=Math.max(CFG.tuning_engine.setSerialCadence__001,Math.floor(p.weeksTotal*CFG.tuning_engine.setSerialCadence__002));p.creativeQuality=Math.max(1,p.creativeQuality-CFG.tuning_engine.setSerialCadence__003);}
 if(cadence==='polished'){p.weeksTotal+=CFG.tuning_engine.setSerialCadence__004;p.creativeQuality=Math.min(CFG.tuning_engine.setSerialCadence__005,p.creativeQuality+CFG.tuning_engine.setSerialCadence__006);}
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.setSerialCadence__007+p.technicalQuality*CFG.tuning_engine.setSerialCadence__008,1,CFG.tuning_engine.setSerialCadence__009));
 return {cadence,weeks:p.weeksTotal,quality:p.quality};
}
// One optional arc-level decision, never a compulsory chapter/task queue.
function reviewSerialArc(s,projectId,choice){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!=='Web Serial'||
    p.status!=='active'||p.weeksDone<=0||p.weeksDone>=p.weeksTotal*CFG.tuning_engine.reviewSerialArc__001||p.serialArcDecisions.length)
   throw new Error('An active mid-production serial arc is required; the team handles other arcs.');
 if(!['tighten','expand'].includes(choice))throw new Error('Unknown serial arc direction.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Creator veto restricts editing this licensed serial.');
 const cost=choice==='expand'?CFG.tuning_engine.cost__005:CFG.tuning_engine.cost__006;
 if(c.finance.cash<cost+CFG.tuning_engine.reviewSerialArc__002)throw new Error('Insufficient cash for serialized editorial work.');
 expense(s,c,cost,'serial-arc','Optional '+choice+' arc planning: '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 if(choice==='expand'){p.weeksTotal+=CFG.tuning_engine.reviewSerialArc__003;p.creativeQuality=Math.min(CFG.tuning_engine.reviewSerialArc__004,p.creativeQuality+CFG.tuning_engine.reviewSerialArc__005);}
 else {p.weeksTotal=Math.max(p.weeksDone+1,p.weeksTotal-1);p.technicalQuality=Math.min(CFG.tuning_engine.reviewSerialArc__006,p.technicalQuality+CFG.tuning_engine.reviewSerialArc__007);}
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.reviewSerialArc__008+p.technicalQuality*CFG.tuning_engine.reviewSerialArc__009,1,CFG.tuning_engine.reviewSerialArc__010));
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
  observedSinceVersion:CFG.tuning_engine.publishingSalesReport__001,historyComplete:p.publishingSalesHistoryComplete===true,
  netProjectReceipts:p.directRevenue,printStock:p.printStock?.stock??null,weeklyGross:p.stats.weeklySales};
}
function previewProject(s,data={}) {
  const c=data.companyId?company(s,data.companyId):player(s);
  const sector=data.sector||c.sector;
  const size=clamp(Number(data.size)||1,CFG.tuning_engine.size__001,CFG.tuning_engine.size__002);const format=FORMATS[sector]?.includes(data.format)?data.format:FORMATS[sector]?.[0];
  if(sector==='publishing'&&!publishingFormatAvailable(s,format))throw new Error('This publishing format needs later world technology adoption.');
  const productionRegion=REGIONS.find(r=>r.name===data.productionRegion)||REGIONS[0];
  const base=sectorCost(sector,size,format)*productionRegion.productionCost;
  const outsource=c.capabilities[sector]==='partner';
  const budget=Math.round(base*(outsource?CFG.tuning_engine.budget__001:1)/CFG.tuning_engine.budget__002)*CFG.tuning_engine.budget__003;
  const weeks=Math.max(CFG.tuning_engine.weeks__003,Math.round(SECTORS[sector].weeks*(CFG.tuning_engine.weeks__004+size*CFG.tuning_engine.weeks__005)));
  const marketing=money(Math.round(budget*(Number(data.marketing)||CFG.tuning_engine.marketing__001)*CFG.tuning_engine.marketing__002)/CFG.tuning_engine.marketing__003);
  const printPhysical=sector==='publishing'&&data.route!=='contract'&&['Novel','Nonfiction','Comic / Manga'].includes(format);
  const initialPrintCash=printPhysical?money(Math.round(CFG.tuning_engine.initialPrintCash__001*size)*(format==='Comic / Manga'?CFG.tuning_engine.initialPrintCash__002:CFG.tuning_engine.initialPrintCash__003)):0;
  const plan={sector,format,size,productionRegion:productionRegion.name,budget,weeks,marketing,grandTotal:money(budget+marketing),initialPrintCash,contractFee:money((budget+marketing)*CFG.tuning_engine.plan__001)};
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
function projectEvidence(s,{companyId=s.playerId,sector='publishing',genre=null,limit=CFG.tuning_engine.projectEvidence__001}={}){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company for evidence.');
 if(!SECTORS[sector])throw new Error('Unknown industry for evidence.');
 const rows=s.projects.filter(p=>p.companyId===c.id&&p.sector===sector&&(!genre||p.genre===genre)&&p.status==='released'&&p.review&&
   Number.isFinite(p.review.actualDirect)&&Number.isFinite(p.review.expectedDirect)&&p.creativeHistoryComplete!==false)
  .sort((a,b)=>b.releaseWeek-a.releaseWeek).slice(0,clamp(Math.round(limit)||CFG.tuning_engine.rows__001,1,CFG.tuning_engine.rows__002))
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
 if(c.isPlayer)news(s,CFG.events.messages.changeProjectTeam__001,p.title+' moved to '+to.name+' without resetting completed work or changing underlying rights.','production');
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
 if(p.weeksDone/p.weeksTotal>=CFG.tuning_engine.interveneProduction__001)throw new Error('Production is too close to release for this major intervention.');
 const initialBudget=p.budget;let spend=0;
 if(kind==='revision'||kind==='polish'){
   spend=money(p.budget*(kind==='revision'?CFG.tuning_engine.interveneProduction__002:CFG.tuning_engine.interveneProduction__003));
   if(c.finance.cash<spend+weeklyOverhead(c,s)*CFG.tuning_engine.interveneProduction__004)throw new Error('Insufficient cash and operating buffer for this intervention.');
   expense(s,c,spend,'production-intervention',(kind==='revision'?'Creative revision':'Technical polish')+': '+p.title,p.id);
   p.directCost=money(p.directCost+spend);
   p.productionSpend=money((p.productionSpend??0)+spend);
   p.periodProductionSpend=money((p.periodProductionSpend||0)+spend);
   p.weeksTotal=money(p.weeksTotal+CFG.tuning_engine.interveneProduction__005);
   if(kind==='revision'){p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)+CFG.tuning_engine.interveneProduction__006,1,CFG.tuning_engine.interveneProduction__007));p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)-1,1,CFG.tuning_engine.interveneProduction__008));}
   else {p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)+CFG.tuning_engine.interveneProduction__009,1,CFG.tuning_engine.interveneProduction__010));p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)-1,1,CFG.tuning_engine.interveneProduction__011));}
 }else {
   const remain=clamp(1-p.weeksDone/p.weeksTotal,0,1);
   p.budget=money(p.budget*(1-CFG.tuning_engine.interveneProduction__012*remain));
   p.weeksTotal=money(Math.max(p.weeksDone+1,p.weeksTotal-CFG.tuning_engine.interveneProduction__013));
   p.creativeQuality=Math.round(clamp((p.creativeQuality||p.quality)-CFG.tuning_engine.interveneProduction__014,1,CFG.tuning_engine.interveneProduction__015));
   p.technicalQuality=Math.round(clamp((p.technicalQuality||p.quality)-CFG.tuning_engine.interveneProduction__016,1,CFG.tuning_engine.interveneProduction__017));
 }
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.interveneProduction__018+p.technicalQuality*CFG.tuning_engine.interveneProduction__019,1,CFG.tuning_engine.interveneProduction__020));
 const rec={week:s.week,kind,spend,originalBudget:initialBudget,newBudget:p.budget,weeksTotal:p.weeksTotal,
   creativeQuality:p.creativeQuality,technicalQuality:p.technicalQuality};
 if(!p.interventions)p.interventions=[];p.interventions.push(rec);
 if(c.isPlayer)news(s,'Production decision: '+p.title,kind==='scope'?'Trimmed unfinished scope to protect cash, at a quality cost.':
   'Authorized '+(kind==='revision'?'editorial revisions':'technical polish')+' with real spending and a later completion.','production');
 return rec;
}

// Opt-in editorial desk: uncertainty is explained, not hidden in a compulsory
// chapter-by-chapter workflow. Changes cost actual cash and do not affect IP.
const EDITORIAL_ACTIONS=Object.freeze(CFG.publishing.EDITORIAL_ACTIONS);
function editorialAssessment(s,projectId){
 const p=s.projects.find(p=>p.id===projectId);
 if(!p||p.sector!=='publishing')throw new Error('Editorial desk assesses publishing projects only.');
 const team=company(s,p.companyId)?.teams.find(t=>t.id===p.teamId);
 const risks=[];
 if(p.creativeQuality<CFG.tuning_engine.editorialAssessment__001)risks.push('Story and audience response may benefit from a development edit.');
 if(p.technicalQuality<CFG.tuning_engine.editorialAssessment__002)risks.push('Copyediting and presentation are a potential weakness.');
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
 if(p.weeksDone/p.weeksTotal>=CFG.tuning_engine.editorialDecision__001)throw new Error('Too late in production for this editorial pass.');
 const cost=money(Math.max(action.minimum,p.budget*action.fraction));
 if(c.finance.cash<cost+weeklyOverhead(c,s)*CFG.tuning_engine.editorialDecision__002)throw new Error('Insufficient cash and payroll reserve to fund editorial work.');
 expense(s,c,cost,'editorial-development',action.label+' for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.creativeQuality=Math.round(clamp((p.creativeQuality??p.quality)+action.creative,1,CFG.tuning_engine.editorialDecision__003));
 p.technicalQuality=Math.round(clamp((p.technicalQuality??p.quality)+action.technical,1,CFG.tuning_engine.editorialDecision__004));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.editorialDecision__005+p.technicalQuality*CFG.tuning_engine.editorialDecision__006,1,CFG.tuning_engine.editorialDecision__007));
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
  leader.morale=clamp(leader.morale+(leader.trait==='collaborative'?CFG.tuning_engine.recordCreatorCredit__001:1),CFG.tuning_engine.recordCreatorCredit__002,CFG.tuning_engine.recordCreatorCredit__003);
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
 return entries.sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title)).slice(0,CFG.tuning_engine.worldHistory__001);
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
  if(c){c.reputation=Math.round(clamp(c.reputation+1,CFG.tuning_engine.recognizeCreativeAwards__001,CFG.tuning_engine.recognizeCreativeAwards__002));
   for(const pid of creators){const e=s.employees.find(x=>x.id===pid&&x.status==='employed');if(e)e.morale=clamp(e.morale+CFG.tuning_engine.recognizeCreativeAwards__003,0,CFG.tuning_engine.recognizeCreativeAwards__004);}}
  news(s,'Annual '+SECTORS[sector].name+' creative honor: '+winner.title,
   'Year '+completedYear+' award for an actual released work by '+c?.name+'. Critics and audience sales remain separate.','award');
 }
 if(s.creativeAwards.length>CFG.tuning_engine.recognizeCreativeAwards__005)s.creativeAwards.splice(0,s.creativeAwards.length-CFG.tuning_engine.recognizeCreativeAwards__006);
}
// Emerging writer/artist discovery is optional and financed; scouting makes
// a genuine outside creator available, never an employee or rights owner.
function scoutEmergingCreator(s,role){
 if(!['writer','artist'].includes(role))throw new Error('Choose a writer or artist to scout.');
 const c=player(s),year=yearAt(s.week),fee=CFG.tuning_engine.fee__003;
 if((s.creatorScouting||[]).filter(x=>yearAt(x.week)===year).length>=CFG.tuning_engine.scoutEmergingCreator__001)throw new Error('Creative scouting limit reached for this year.');
 if(s.specialists.length>=CFG.tuning_engine.scoutEmergingCreator__002)throw new Error('External creative roster is already at its simulation limit.');
 if(c.bankrupt||c.finance.cash<fee+weeklyOverhead(c,s)*CFG.tuning_engine.scoutEmergingCreator__003)throw new Error('Insufficient cash and operating reserves for scouting.');
 const seq=s.sequence+1,n=hash(s.seed+':emerging:'+seq+':'+role);
 const candidate={id:id(s,'talent'),name:STAFF_FIRST[n%STAFF_FIRST.length]+' '+STAFF_LAST[Math.floor(n/CFG.tuning_engine.candidate__006)%STAFF_LAST.length],
  creatorRole:role,discipline:'editorial',skill:CFG.tuning_engine.candidate__007+n%CFG.tuning_engine.candidate__008,fee:money(CFG.tuning_engine.candidate__009+(n%CFG.tuning_engine.candidate__010)*CFG.tuning_engine.candidate__011),assignedProjectId:null,completed:0,
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
 const c=player(s),cost=CFG.tuning_engine.cost__007;if(c.bankrupt||c.finance.cash<cost+weeklyOverhead(c,s)*CFG.tuning_engine.developEmergingCreator__001)throw new Error('Insufficient cash and payroll reserves for this fellowship.');
 if(talent.skill>=CFG.tuning_engine.developEmergingCreator__002)throw new Error('Creator has reached the current skill ceiling.');
 expense(s,c,cost,'creative-fellowship','Independent creator fellowship: '+talent.name);
 const before=talent.skill;talent.skill=Math.min(CFG.tuning_engine.developEmergingCreator__003,talent.skill+CFG.tuning_engine.developEmergingCreator__004);talent.fee=money(talent.fee+CFG.tuning_engine.developEmergingCreator__005);
 talent.mentorshipHistory.push({week:s.week,cost,oldSkill:before,newSkill:talent.skill});
 news(s,'Creative fellowship: '+talent.name,'Funded development improves a freelance '+talent.creatorRole+'; no employment, IP or forced exclusive contract is created.','talent');
 return {id:talent.id,skill:talent.skill,cost};
}
// Recorded actual releases only: the chart never predicts preorders or
// combines incomparable inventory copies with distribution gross.
function publishingCharts(s,{metric='gross',year='all',limit=CFG.tuning_engine.publishingCharts__001}={}){
 if(!['gross','critic','audience'].includes(metric))throw new Error('Unknown publishing chart metric.');
 if(year!=='all'&&(!Number.isInteger(Number(year))||Number(year)<1||Number(year)>yearAt(s.week)))throw new Error('Invalid publishing chart year.');
 const rows=s.projects.filter(p=>p.sector==='publishing'&&p.status==='released'&&p.route!=='contract'&&
  p.releaseWeek!==null&&(year==='all'||yearAt(p.releaseWeek)===Number(year))).map(p=>({projectId:p.id,title:p.title,
  companyId:p.companyId,year:yearAt(p.releaseWeek),format:p.format,criticScore:p.criticScore??p.quality,
  audienceScore:p.audienceScore??p.quality,gross:money(p.stats?.totalSales||0),
  source:'actual',historyComplete:p.creativeHistoryComplete!==false}));
 return rows.sort((a,b)=>(metric==='gross'?b.gross-a.gross:metric==='critic'?b.criticScore-a.criticScore:b.audienceScore-a.audienceScore)||a.title.localeCompare(b.title)).slice(0,clamp(Number(limit)||CFG.tuning_engine.publishingCharts__002,1,CFG.tuning_engine.publishingCharts__003));
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
    const releaseScope44=data.releaseTerritories&&data.releaseTerritories!=="Worldwide"?normalizeRegions43(data.releaseTerritories):null;
    const permissions44=releaseScope44?releaseScope44.map(r=>canUseIp(s,c,data.ipId,sector,s.week,r)):[canUseIp(s,c,data.ipId,sector,s.week)];
    const test=permissions44.find(p=>!p.ok)||permissions44[0];if(!test.ok)throw new Error(test.reason);
    if(test.grantId){const grant=s.grants.find(g=>g.id===test.grantId);
      if(grant?.approvalRequired){const pitch=s.creativeApprovals.find(a=>a.id===data.approvalId&&a.grantId===grant.id&&a.holderId===c.id&&a.status==='approved'&&
        a.title===String(data.title||'Untitled Project').trim().slice(0,CFG.tuning_engine.pitch__001)&&a.genre===(GENRES.includes(data.genre)?data.genre:'Fantasy')&&!a.launched);
        if(!pitch)throw new Error('Binding creator approval required before this adaptation can start.');
        approvedPitch=pitch;
      }
    }
  }
  const signed=data.offerId?s.commissionOffers.find(o=>o.id===data.offerId):null;
  if(data.offerId){
    if(route!=='contract'||!signed||signed.status!=='accepted'||signed.producerId!==c.id||
       signed.title!==String(data.title||'').trim().slice(0,CFG.tuning_engine.createProject__001)||signed.sector!==sector||
       signed.size!==clamp(Number(data.size)||1,CFG.tuning_engine.createProject__002,CFG.tuning_engine.createProject__003))throw new Error('Only a matching accepted commission may be booked.');
    data={...data,clientId:signed.clientId,genre:signed.genre,format:signed.format,
      marketing:signed.marketing,productionRegion:signed.productionRegion};
  }
  const estimate=previewProject(s,{...data,sector,companyId:c.id,withForecast:!isAI});
  const cost=money(estimate.grandTotal),reserve=money(cost*CFG.tuning_engine.reserve__001);
  if(route==='contract'&&!estimate.clientId)throw new Error('No funded client currently offers this commission. Pick a different project or wait for buyer funds.');
  if(route==='contract'&&!eligibleClients(s,estimate.contractFee,c.id).some(b=>b.id===estimate.clientId))
    throw new Error('Client lacks committed cash for this commission.');
  const team=selectTeam(s,c,data.teamId,data.genre||'Fantasy');
  if(!team)throw new Error('No available production team. Hire another team or wait for completion.');
  if(c.finance.cash < reserve+CFG.tuning_engine.createProject__004)throw new Error('Not enough available cash. A project requires a 30% initial liquidity reserve plus operating buffer.');
  const title=(String(data.title||'Untitled Project').trim().slice(0,CFG.tuning_engine.title__002)||'Untitled Project');
  const genre=GENRES.includes(data.genre)?data.genre:pick(s,GENRES);
  const pitch=pitchFrom(data);
  const leader=(s.employees||[]).find(e=>e.id===team.leaderId&&e.status==='employed');
  const leadershipQuality=leader?clamp((leader.skill-CFG.tuning_engine.leadershipQuality__001)*CFG.tuning_engine.leadershipQuality__002+(leader.morale-CFG.tuning_engine.leadershipQuality__003)*CFG.tuning_engine.leadershipQuality__004+(leader.trait==='inventive'?CFG.tuning_engine.leadershipQuality__005:leader.trait==='meticulous'?1:0),-CFG.tuning_engine.leadershipQuality__006,CFG.tuning_engine.leadershipQuality__007):-CFG.tuning_engine.leadershipQuality__008;
  // Founder aptitudes change an actual project's outcome; neither founder
  // reputation nor company shares/IP ownership changes without an event.
  const founderBonus=c.isPlayer?(s.founder?.background==='editorial'&&estimate.sector==='publishing'?CFG.tuning_engine.founderBonus__001:s.founder?.background==='production'?CFG.tuning_engine.founderBonus__002:s.founder?.background==='finance'?1:0)+(s.founder?.focus==='creative'?CFG.tuning_engine.founderBonus__003:s.founder?.focus==='people'?1:0):0;
  const baseQuality=Math.round(clamp(CFG.tuning_engine.baseQuality__001+c.reputation*CFG.tuning_engine.baseQuality__002+rand(s)*CFG.tuning_engine.baseQuality__003+estimate.size*CFG.tuning_engine.baseQuality__004+(team.specialty===genre?CFG.tuning_engine.baseQuality__005:0)+(team.skill-CFG.tuning_engine.baseQuality__006)*CFG.tuning_engine.baseQuality__007+leadershipQuality+founderBonus,CFG.tuning_engine.baseQuality__008,CFG.tuning_engine.baseQuality__009));
  const creativeQuality=Math.round(clamp(baseQuality+(pitch.direction==='experimental'?CFG.tuning_engine.creativeQuality__001:pitch.direction==='polished'?-CFG.tuning_engine.creativeQuality__002:0)+(pitch.theme==='Survival'?CFG.tuning_engine.creativeQuality__003:0),CFG.tuning_engine.creativeQuality__004,CFG.tuning_engine.creativeQuality__005));
  const technicalQuality=Math.round(clamp(baseQuality+(pitch.direction==='polished'?CFG.tuning_engine.technicalQuality__001:pitch.direction==='experimental'?-CFG.tuning_engine.technicalQuality__002:0)+(team.skill-CFG.tuning_engine.technicalQuality__003)*CFG.tuning_engine.technicalQuality__004,CFG.tuning_engine.technicalQuality__005,CFG.tuning_engine.technicalQuality__006));
  const releaseQuality=Math.round(clamp(creativeQuality*CFG.tuning_engine.releaseQuality__001+technicalQuality*CFG.tuning_engine.releaseQuality__002,CFG.tuning_engine.releaseQuality__003,CFG.tuning_engine.releaseQuality__004));
  let ipId=route==='adaptation'?data.ipId:null;
  if(route==='original') {const ip={id:id(s,'ip'),name:title,ownerId:c.id,createdWeek:s.week,sourceSector:sector,description:genre+' original',works:[],rightsIncome:0,rightsHistoryComplete:true};s.ips.push(ip);ipId=ip.id;}
  const project={id:id(s,'project'),title,companyId:c.id,sector,genre,format:estimate.format,productionRegion:estimate.productionRegion,route,ipId,grantId:null,teamId:team.id,clientId:null,escrowId:null,status:'active',printStock:null,startWeek:s.week,releaseWeek:null,overheadAttributed:0,overheadHistoryComplete:true,weeksTotal:estimate.weeks,weeksDone:0,budget:estimate.budget,marketingBudget:estimate.marketing,directCost:0,directRevenue:0,royaltyCost:0,earnedFee:route==='contract'?estimate.contractFee:0,advance:0,quality:releaseQuality,creativeQuality,technicalQuality,pitch,creativeHistoryComplete:true,phase:'concept',phaseHistory:[{week:s.week,phase:'concept'}],franchiseBranch:route==='contract'?null:FRANCHISE_BRANCHES.includes(data.franchiseBranch)?data.franchiseBranch:'main',franchiseHistoryComplete:true,holdUntilWeek:null,releasePlanHistory:[],specialistId:null,specialistAppointments:[],leadCharacter:typeof data.leadCharacter==='string'?data.leadCharacter.trim().slice(0,CFG.tuning_engine.project__001):'',editorialHistory:[],editorialHistoryComplete:true,creatorCredits:[],interventions:[],teamChanges:[],criticScore:null,audienceScore:null,audience:0,size:estimate.size,ai:isAI,major:estimate.grandTotal>c.finance.equity*CFG.tuning_engine.project__002||estimate.size>=CFG.tuning_engine.project__003||(estimate.forecast?.scenario.expected.gross||0)>c.finance.equity*CFG.tuning_engine.project__004||data.flagship===true||data.flagship==='yes',stats:{weeklySales:0,totalSales:0},serialReaderMomentum:1,serialEngagementHistory:[],serialArcDecisions:[],publishingFormatHistory:[],translations:[],preorderCampaign:null,imprintId:null,publishingChannel:sector==='publishing'?(isPrintEdition({sector,format:estimate.format,route})?'mixed':'digital'):null,serialCadence:sector==='publishing'&&estimate.format==='Web Serial'?'steady':null,salesByRegion:{},salesByChannel:{},salesUnitsByRegion:{},salesUnitsByChannel:{},salesUnitsByAudience:{},audienceUnitHistoryComplete:true,publishingUnitHistory:[],publishingUnitHistoryComplete:true,publishingSalesHistoryComplete:true,forecast:estimate.forecast,review:null,plannedTotal:estimate.grandTotal,
    // Risk is hidden at greenlight; published EAC uses observed spend, never secret future certainty.
    budgetMultiplier:money(1+(((hash(s.seed+':cost:'+s.sequence)%CFG.tuning_engine.project__005)/CFG.tuning_engine.project__006)-1)*(team.specialty===genre?CFG.tuning_engine.project__007:CFG.tuning_engine.project__008)),budgetAlerted:false,productionSpend:0,periodProductionSpend:0,lastClosedPlannedSpend:0,budgetCloseComplete:true,budgetHistoryComplete:true};
  if(sector==='movie')project.cinema=filmDefault(project);
  if(sector==='tv')project.television=tvDefault(project);
  if(sector==='games')project.videoGame=gameDefault(project,s.week);
  if(route==='adaptation') {const check=canUseIp(s,c,ipId,sector);project.grantId=check.grantId||null;}
  project.territories43=data.releaseTerritories&&data.releaseTerritories!=="Worldwide"?normalizeRegions43(data.releaseTerritories):project.grantId?regionScope43(s.grants.find(g=>g.id===project.grantId)) :null;
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
  p.printStock={stock:0,printed:0,sold:0,returned:0,writtenOff:0,unitCost:comic?CFG.tuning_engine.initPrintEdition__001:CFG.tuning_engine.initPrintEdition__002,price:comic?CFG.tuning_engine.initPrintEdition__003:CFG.tuning_engine.initPrintEdition__004,
    printSpend:0,cogs:0,returnsCost:0,writeOffCost:0,lastOrderWeek:-1,autoReprint:true,returnQueue:[],returnFraction:0,demandEwma:0,closed:false,historyComplete:true};
  const c=company(s,p.companyId),ideal=Math.round(CFG.tuning_engine.ideal__001*p.size);
  const affordable=Math.floor(Math.max(0,c.finance.cash-weeklyOverhead(c,s)*CFG.tuning_engine.affordable__001)/p.printStock.unitCost);
  const quantity=Math.max(0,Math.min(ideal,affordable));
  if(quantity>=CFG.tuning_engine.initPrintEdition__005)buyPrintRun(s,p,quantity,true);
  else if(c.isPlayer)alert(s,'initial-print-'+p.id,CFG.events.messages.initPrintEdition__001,p.title+' has no initial print stock. Budget for copies in Productions before expecting sales.','advisory');
}
function buyPrintRun(s,p,quantity,initial=false){
  if(!p.printStock||p.status!=='released'||p.printStock.closed||s.week-p.releaseWeek>=CFG.tuning_engine.buyPrintRun__001||!printRightsActive(s,p))throw new Error('This edition is not currently eligible for printing.');
  const q=Number(quantity),c=company(s,p.companyId),book=p.printStock;
  if(!Number.isInteger(q)||q<CFG.tuning_engine.buyPrintRun__002||q>CFG.tuning_engine.buyPrintRun__003)throw new Error('Choose 50 to 10,000 physical copies.');
  const cost=money(q*book.unitCost),buffer=weeklyOverhead(c,s)*CFG.tuning_engine.buffer__001;
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
    if(age<0||age>=CFG.tuning_engine.autoReplenishPrint__001||!printRightsActive(s,p))continue;
    // Replenish against OBSERVED reader demand, not an arbitrary perpetual
    // fixed stock target. Slow backlist works must not trap cash in reprints.
    const observed=b.demandEwma||0;
    if(observed<CFG.tuning_engine.autoReplenishPrint__002||b.lastOrderWeek>=s.week)continue;
    const target=Math.min(CFG.tuning_engine.target__001,Math.max(CFG.tuning_engine.target__002,Math.ceil(observed*CFG.tuning_engine.target__003)));
    if(b.stock>=target*CFG.tuning_engine.autoReplenishPrint__003)continue;
    const c=company(s,p.companyId);if(!c||c.bankrupt)continue;
    const qty=Math.min(CFG.tuning_engine.qty__001,Math.ceil(Math.max(CFG.tuning_engine.qty__002,target-b.stock)/CFG.tuning_engine.qty__003)*CFG.tuning_engine.qty__004);
    const affordable=Math.floor((c.finance.cash-weeklyOverhead(c,s)*CFG.tuning_engine.affordable__002)/b.unitCost/CFG.tuning_engine.affordable__003)*CFG.tuning_engine.affordable__004;
    if(affordable<CFG.tuning_engine.autoReplenishPrint__004){
      if(c.isPlayer&&b.stock===0&&age<CFG.tuning_engine.autoReplenishPrint__005)alert(s,'print-stock-'+p.id,CFG.events.messages.autoReplenishPrint__001,p.title+' cannot meet more orders until there is cash for another print run. Reprinting is delegated when affordable.','advisory');
      continue;
    }
    buyPrintRun(s,p,Math.min(CFG.tuning_engine.autoReplenishPrint__006,qty,affordable));
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
      const fractional=fresh*CFG.tuning_engine.fractional__001+(b.returnFraction||0);
      const qty=Math.floor(fractional);
      b.returnFraction=fractional-qty;
      if(qty)b.returnQueue.push({dueWeek:s.week+CFG.tuning_engine.settlePrintLifecycle__001,units:qty});
      p.stats.weeklyPrintUnits=0;
    }
    const observedDemand=p.stats.weeklyPrintDemand||0;
    b.demandEwma=(b.demandEwma||0)*CFG.tuning_engine.settlePrintLifecycle__002+observedDemand*CFG.tuning_engine.settlePrintLifecycle__003;
    p.stats.weeklyPrintDemand=0;
    const remaining=[];
    for(const due of b.returnQueue){
      if(due.dueWeek<=s.week)settlePrintReturns(s,p,due.units);
      else remaining.push(due);
    }
    b.returnQueue=remaining;
    const age=s.week-p.releaseWeek;
    if(age>=CFG.tuning_engine.settlePrintLifecycle__004){
      if(b.stock)disposePrintStock(s,p,b.stock);
      b.closed=true;
    }else if(age>=0&&b.stock>0){
      // Small delegated storage expense, paid or accrued as an obligation.
      const c=company(s,p.companyId);
      const charge=money(b.stock*CFG.tuning_engine.charge__001);
      if(charge>0){expense(s,c,charge,'warehouse','Print warehouse service: '+p.title,p.id);p.directCost=money(p.directCost+charge);}
    }
  }
}
function projectWork(s,p) {
  const c=company(s,p.companyId);if(!c||c.bankrupt||c.operating44?.furloughed)return;
  if(p.escrowId&&s.escrows.find(e=>e.id===p.escrowId)?.review47?.status==="open")return;
  if(p.route==='adaptation'){
    const permission=canUseIp(s,c,p.ipId,p.sector,s.week);
    if(!permission.ok){ if(c.isPlayer)alert(s,'blocked-'+p.id,CFG.events.messages.projectWork__001,p.title+': '+permission.reason+' Project has been paused.','critical');return;}
  }
  const team=c.teams?.find(t=>t.id===p.teamId);
  // Work is automatically delegated to one finite team. Specialization and accumulated
  // skill shorten elapsed time; the same budget is consumed over units of progress.
  const expertise=businessTechnology(s,c.id,p.sector);
  const partnerDeal=p.coProductionId?s.coProductions.find(d=>d.id===p.coProductionId):null;
  const partnerTeam=partnerDeal?company(s,partnerDeal.sponsorId)?.teams?.find(t=>t.id===partnerDeal.partnerTeamId):null;
  const partnerSpeed=partnerTeam?clamp((partnerTeam.skill-CFG.tuning_engine.partnerSpeed__001)*CFG.tuning_engine.partnerSpeed__002,CFG.tuning_engine.partnerSpeed__003,CFG.tuning_engine.partnerSpeed__004):0;
  const specialist=s.specialists?.find(x=>x.id===p.specialistId&&x.assignedProjectId===p.id);
  const specialistSpeed=specialist?.discipline==='production'?clamp((specialist.skill-CFG.tuning_engine.specialistSpeed__001)*CFG.tuning_engine.specialistSpeed__002,CFG.tuning_engine.specialistSpeed__003,CFG.tuning_engine.specialistSpeed__004):0;
  const leader=team?(s.employees||[]).find(e=>e.id===team.leaderId&&e.status==='employed'):null;
  const leadershipSpeed=leader?clamp((leader.skill-CFG.tuning_engine.leadershipSpeed__001)*CFG.tuning_engine.leadershipSpeed__002+(leader.morale-CFG.tuning_engine.leadershipSpeed__003)*CFG.tuning_engine.leadershipSpeed__004,-CFG.tuning_engine.leadershipSpeed__005,CFG.tuning_engine.leadershipSpeed__006):-CFG.tuning_engine.leadershipSpeed__007;
  const speed=team?clamp(1+leadershipSpeed+Math.max(0,team.skill-CFG.tuning_engine.speed__001)*CFG.tuning_engine.speed__002+(team.specialty===p.genre?CFG.tuning_engine.speed__003:0)+expertise.effectiveness+expertise.researchBonus+partnerSpeed+specialistSpeed,1,CFG.tuning_engine.speed__004):1;
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
  if(p.sector==='movie'&&p.cinema&&p.weeksDone>=p.weeksTotal*CFG.tuning_engine.projectWork__001&&p.weeksDone<p.weeksTotal*CFG.tuning_engine.projectWork__002&&
    !p.cinema.disruptions?.length&&(hash(s.seed+':film-setback:'+p.id)%CFG.tuning_engine.projectWork__003===0)){
    const cost=money(p.budget*CFG.tuning_engine.cost__008);expense(s,c,cost,'film-disruption','Unexpected production logistics and recovery: '+p.title,p.id);
    p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
    p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);p.weeksTotal+=CFG.tuning_engine.projectWork__004;
    p.cinema.disruptions=[{week:s.week,cost,delay:CFG.tuning_engine.projectWork__005,kind:'logistics'}];
    if(c.isPlayer)news(s,'Film setback: '+p.title,CFG.events.messages.projectWork__002,'production');
  }
  if(p.phaseHistory?.length){const ratio=p.weeksDone/p.weeksTotal;
    const phase=ratio>=1?(p.holdUntilWeek&&s.week<p.holdUntilWeek?'polish':'released'):ratio>=CFG.tuning_engine.phase__001?'polish':ratio>=CFG.tuning_engine.phase__002?'production':'concept';
    if(p.phase!==phase){p.phase=phase;p.phaseHistory.push({week:s.week,phase});}
  }
  if(p.sector==='games'&&p.videoGame){gameMilestone(s,p);}
  if(p.sector==='movie'&&p.cinema?.delayWeeks>0){
    p.weeksTotal+=p.cinema.delayWeeks;p.cinema.delayWeeks=0;
  }
  if(p.route==='contract' &&p.escrowId)releaseClientMilestone(s,p);
  const costView=projectBudget(s,p.id);
  if(c.isPlayer&&p.major&&!p.budgetAlerted&&p.weeksDone>=p.weeksTotal*CFG.tuning_engine.projectWork__006&&costView.projectedVariance>costView.plannedTotal*CFG.tuning_engine.projectWork__007){
    p.budgetAlerted=true;alert(s,'budget-'+p.id,CFG.events.messages.projectWork__003,p.title+' is projected to spend '+shortMoney(costView.projectedVariance)+' above its approved budget. The team will continue within delegated authority; review if liquidity becomes tight.','advisory');
  }
  if(team){team.workWeeks++;team.skill=Math.min(CFG.tuning_engine.projectWork__008,team.skill+(team.workWeeks%CFG.tuning_engine.projectWork__009===0?1:0));}
  if(partnerTeam){partnerTeam.workWeeks++;partnerTeam.skill=Math.min(CFG.tuning_engine.projectWork__010,partnerTeam.skill+(partnerTeam.workWeeks%CFG.tuning_engine.projectWork__011===0?1:0));}
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
      p.criticScore=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.projectWork__012+p.technicalQuality*CFG.tuning_engine.projectWork__013+(p.pitch?.direction==='experimental'?CFG.tuning_engine.projectWork__014:0),1,CFG.tuning_engine.projectWork__015));
      p.audienceScore=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.projectWork__016+p.technicalQuality*CFG.tuning_engine.projectWork__017+(p.pitch?.positioning==='broad'?CFG.tuning_engine.projectWork__018:p.pitch?.positioning==='niche'?-CFG.tuning_engine.projectWork__019:0),1,CFG.tuning_engine.projectWork__020));
      if(p.sector==='games'&&p.videoGame){p.criticScore=p.videoGame.criticRating;p.audienceScore=p.videoGame.userRating;}
    }
    if(p.sector==='games'&&p.videoGame)gameAtRelease(s,p);
    if(p.coProductionId)refundPartnerReserve(s,p,'released');
    if(p.route==='contract') {if(p.escrowId)deliverClientFee(s,p);else finalizeContract(s,c,p.earnedFee,p.advance,p.id);p.directRevenue=money(p.directRevenue+p.earnedFee);}
    else {initPrintEdition(s,p);const work={id:id(s,'work'),title:p.title,ipId:p.ipId,projectId:p.id,sector:p.sector,ownerId:c.id,releaseWeek:s.week};s.works.push(work);const ip=s.ips.find(x=>x.id===p.ipId);if(ip)ip.works.push(work.id);}
    if(team){const leader=s.employees?.find(e=>e.id===team.leaderId&&e.status==='employed');
      if(leader){leader.completed++;leader.morale=clamp(leader.morale+(p.quality>=CFG.tuning_engine.projectWork__021?CFG.tuning_engine.projectWork__022:-1),CFG.tuning_engine.projectWork__023,CFG.tuning_engine.projectWork__024);leader.history.push({week:s.week,kind:'release',companyId:c.id,teamId:team.id,projectId:p.id,quality:p.quality});if(leader.history.length>CFG.tuning_engine.projectWork__025)leader.history.shift();}
      if(c.isPlayer&&s.founder){s.founder.experience=(s.founder.experience||0)+1;s.founder.lastReleaseWeek=s.week;}
      team.completed++;if(!Array.isArray(team.performanceHistory))team.performanceHistory=[];team.performanceHistory.push({projectId:p.id,week:s.week,quality:p.quality,sector:p.sector,genre:p.genre});if(team.performanceHistory.length>CFG.tuning_engine.projectWork__026)team.performanceHistory.shift();}
    c.reputation=Math.round(clamp(c.reputation+(p.quality-CFG.tuning_engine.projectWork__027)/CFG.tuning_engine.projectWork__028,CFG.tuning_engine.projectWork__029,CFG.tuning_engine.projectWork__030));
    if(c.isPlayer){news(s,p.title+' released',p.route==='contract'?'Commissioned work delivered; full fee recognized.':p.genre+' '+p.format+' enters the '+SECTORS[p.sector].name+' market.','release'); }
    else if(rand(s)<CFG.tuning_engine.projectWork__031)news(s,c.name+' releases '+p.title,'A competing '+p.genre.toLowerCase()+' '+SECTORS[p.sector].name.toLowerCase()+' title enters the market.','competitor');
  }
}
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
// Creating a new company is NOT purchasing an old firm's IP, shares or
// liabilities. The founding company legally owns 100% of new subsidiary equity.
// Cash decreases at the parent and increases at the child; the offset is a
// parent investment asset, not a made-up sale or production profit.
function foundSubsidiary(s,data={}){
  requireExecutiveControl(s);const owner=player(s),sector=String(data.sector||'publishing'),capital=money(Number(data.capital));
  if(!SECTORS[sector]||!available(sector,s.week))throw new Error('That industry has not debuted globally.');
  if(s.companies.filter(c=>c.parentId===owner.id).length>=CFG.tuning_engine.foundSubsidiary__001)throw new Error('Maximum five managed subsidiaries in this prototype.');
  if(!Number.isFinite(capital)||capital<SECTORS[sector].cost*CFG.tuning_engine.foundSubsidiary__002)throw new Error('Startup capital below sector operating requirements.');
  if(owner.finance.cash<capital+CFG.tuning_engine.foundSubsidiary__003)throw new Error('Insufficient parent cash after required operating reserve.');
  const name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__002);
  if(name.length<CFG.tuning_engine.foundSubsidiary__004||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct studio name of at least three characters.');
  boardMandate(s,'expansion',capital);
  const child=createCompany(s,{name,sector,cash:capital,capacity:1,foundYear:yearAt(s.week),foundedYear:yearAt(s.week),parentId:owner.id,reputation:CFG.tuning_engine.child__001,homeRegion:owner.homeRegion});
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
  if(child.finance.cash<amount+CFG.tuning_engine.chargeSharedServices__001)throw new Error('Subsidiary cannot fund this internal charge.');
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
function hireTeam(s,specialty='Fantasy') {requireExecutiveControl(s);const c=player(s),cost=money(CFG.tuning_engine.cost__009*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);if(!GENRES.includes(specialty))throw new Error('Choose a valid team specialization.');if(c.finance.cash<cost+CFG.tuning_engine.hireTeam__001)throw new Error('Insufficient funds to hire another project team.');expense(s,c,cost,'recruitment','Expand project team');c.capacity++;c.teamLevel++;const team=newTeam(s,c,c.teams.length,specialty);c.teams.push(team);news(s,CFG.events.messages.hireTeam__001,team.name+' specializes in '+specialty+'. Another project can now run concurrently; recurring weekly payroll rises.','company');return team;}
// Rights agreements: real bilateral funding, with counteroffers before any
// contract or cash movement. An AI's willingness depends on its own liquidity;
// it cannot be forced to accept an expensive option or renewal.
function rightsTerms(input={},medium='movie',week=0){
  if(!Number.isFinite(Number(input.fee??CFG.tuning_engine.rightsTerms__001))||!Number.isFinite(Number(input.exerciseFee??CFG.tuning_engine.rightsTerms__002)))throw new Error('Option fees must be finite amounts.');
  const fee=money(Number(input.fee??CFG.tuning_engine.fee__004));
  const exerciseFee=money(Number(input.exerciseFee??CFG.tuning_engine.exerciseFee__001));
  const royaltyRate=Number(input.royaltyRate??CFG.tuning_engine.royaltyRate__001);
  const optionWeeks=Number(input.optionWeeks??Math.max(CFG.tuning_engine.optionWeeks__001,((SECTORS[medium].year-1)*CFG.tuning_engine.optionWeeks__002-week)+CFG.tuning_engine.optionWeeks__003));
  const continuationWeeks=Number(input.continuationWeeks??0);
  if(!Number.isFinite(fee)||fee<CFG.tuning_engine.rightsTerms__003||fee>CFG.tuning_engine.rightsTerms__004||!Number.isFinite(exerciseFee)||exerciseFee<0||exerciseFee>CFG.tuning_engine.rightsTerms__005||
    !Number.isFinite(royaltyRate)||royaltyRate<0||royaltyRate>CFG.tuning_engine.rightsTerms__006||!Number.isInteger(optionWeeks)||optionWeeks<CFG.tuning_engine.rightsTerms__007||optionWeeks>CFG.tuning_engine.rightsTerms__008||
    !Number.isInteger(continuationWeeks)||continuationWeeks<0||continuationWeeks>CFG.tuning_engine.rightsTerms__009)
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
  if(other.finance.cash<fee+CFG.tuning_engine.createOption__001)throw new Error('Counterparty lacks the funds for this option.');
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
  return !holder.bankrupt&&holder.finance.cash>=terms.fee+CFG.tuning_engine.optionWillingness__001&&
    terms.fee<=Math.min(CFG.tuning_engine.optionWillingness__002,Math.max(CFG.tuning_engine.optionWillingness__003,money(holder.finance.cash*CFG.tuning_engine.optionWillingness__004)))&&terms.royaltyRate<=CFG.tuning_engine.optionWillingness__005;
}
function offerRights(s,ipId,medium,licenseeId,terms={}){
  requireExecutiveControl(s);const {owner,other}=validateOptionParties(s,ipId,medium,licenseeId);
  const proposed=rightsTerms(terms,medium,s.week);
  const accepted=optionWillingness(other,proposed);
  const row={id:id(s,'rightsoffer'),kind:'option',ipId,grantId:null,grantorId:owner.id,
    holderId:other.id,media:medium,createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',
    proposal:proposed,counter:accepted?null:rightsTerms({fee:CFG.tuning_engine.row__005,exerciseFee:proposed.exerciseFee,
      royaltyRate:Math.min(proposed.royaltyRate,CFG.tuning_engine.row__006),optionWeeks:proposed.optionWeeks,
      continuationWeeks:proposed.continuationWeeks,approvalRequired:proposed.approvalRequired},medium,s.week)};
  if(accepted)row.grantId=createOption(s,ipId,medium,licenseeId,proposed).id;
  s.rightsOffers.push(row);
  return row;
}
function fulfillRenewal(s,grant,terms){
  if(grant.endWeek<=s.week)throw new Error('Expired contract must be renegotiated as a new grant.');
  const owner=company(s,grant.grantorId),holder=company(s,grant.holderId),ip=s.ips.find(x=>x.id===grant.ipId);
  if(!owner||!holder||!ip||!validGrantor43(s,{...grant,endWeek:grant.endWeek+terms.extensionWeeks},ip)||holder.bankrupt||holder.finance.cash<terms.fee+CFG.tuning_engine.fulfillRenewal__001)
    throw new Error('Renewal parties or funding are unavailable.');
  const proposedEnd=grant.endWeek+terms.extensionWeeks;
  if(s.grants.some(g=>g.id!==grant.id&&g.ipId===grant.ipId&&g.media===grant.media&&
    rightsConflict43(s,{...grant,endWeek:proposedEnd},g)))
    throw new Error('Renewal would overlap another exclusive contract.');
  expense(s,holder,terms.fee,'rights-renewal','Mutually agreed rights renewal');
  revenue(s,owner,terms.fee,'rights-renewal','Rights renewal income');
  if(ip.ownerId===owner.id)ip.rightsIncome=money((ip.rightsIncome||0)+terms.fee);
  grant.endWeek=proposedEnd;
  if(grant.type==='option')grant.optionExpiresWeek=proposedEnd;
  news(s,'Rights renewed: '+ip.name,owner.name+' and '+holder.name+' agreed to extend '+SECTORS[grant.media].name+' rights.','deal');
}
function renewalTerms(input={}){
  if(!Number.isFinite(Number(input.fee??CFG.tuning_engine.renewalTerms__001)))throw new Error('Renewal fee must be finite.');
  const fee=money(Number(input.fee??CFG.tuning_engine.fee__005)),extensionWeeks=Number(input.extensionWeeks??CFG.tuning_engine.extensionWeeks__001);
  if(!Number.isFinite(fee)||fee<CFG.tuning_engine.renewalTerms__002||fee>CFG.tuning_engine.renewalTerms__003||!Number.isInteger(extensionWeeks)||extensionWeeks<CFG.tuning_engine.renewalTerms__004||extensionWeeks>CFG.tuning_engine.renewalTerms__005)
    throw new Error('Renewal terms are outside permitted limits.');
  return {fee,extensionWeeks};
}
function offerRenewal(s,grantId,input={}){
  const grant=s.grants.find(g=>g.id===grantId);
  if(!grant||grant.grantorId!==s.playerId||grant.endWeek<=s.week)throw new Error('Only valid, unexpired owned rights may be offered for renewal.');
  const holder=company(s,grant.holderId),proposed=renewalTerms(input);
  if(!holder||holder.bankrupt)throw new Error('Holder is no longer available to consent.');
  const accepted=holder.finance.cash>=proposed.fee+CFG.tuning_engine.accepted__001&&
    proposed.fee<=Math.min(CFG.tuning_engine.accepted__002,Math.max(CFG.tuning_engine.accepted__003,money(holder.finance.cash*CFG.tuning_engine.accepted__004)));
  const row={id:id(s,'rightsoffer'),kind:'renewal',ipId:grant.ipId,grantId,
    grantorId:grant.grantorId,holderId:grant.holderId,media:grant.media,
    createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',proposal:proposed,
    counter:accepted?null:renewalTerms({fee:CFG.tuning_engine.row__007,extensionWeeks:Math.min(CFG.tuning_engine.row__008,proposed.extensionWeeks)})};
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
    if(!g||g.grantorId!==s.playerId||!holder||holder.finance.cash<row.counter.fee+CFG.tuning_engine.answerRightsOffer__001)
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
     maxFee<CFG.tuning_engine.configureRightsAuthority__001||maxFee>CFG.tuning_engine.configureRightsAuthority__002||![CFG.tuning_engine.configureRightsAuthority__003,CFG.tuning_engine.configureRightsAuthority__004].includes(extensionWeeks))
    throw new Error('Delegated renewals require a valid opt-in and minor-deal limits.');
  s.rightsPolicy={autoRenew:policy.autoRenew,maxFee,extensionWeeks};
  return s.rightsPolicy;
}
function delegateRightsRenewals(s){
  if(!s.rightsPolicy?.autoRenew)return;
  for(const g of s.grants)if(g.grantorId===s.playerId&&g.endWeek>s.week&&g.endWeek-s.week<=CFG.tuning_engine.delegateRightsRenewals__001&&
    g.renewalAutoAttemptedEnd!==g.endWeek){
    const currentEnd=g.endWeek;
    g.renewalAutoAttemptedEnd=currentEnd;
    try{
      const offer=offerRenewal(s,g.id,{fee:s.rightsPolicy.maxFee,extensionWeeks:s.rightsPolicy.extensionWeeks});
      if(offer.status==='counter')alert(s,'rights-counter-'+offer.id,CFG.events.messages.delegateRightsRenewals__001,
        CFG.events.messages.delegateRightsRenewals__002,'critical');
    }catch(e){alert(s,'rights-delegation-'+g.id+'-'+currentEnd,CFG.events.messages.delegateRightsRenewals__003,
      'An automatic renewal did not complete: '+e.message,'critical');}
  }
}
function exerciseOption(s,g){
  if(g.type!=='option'||g.endWeek<=s.week||!available(g.media,s.week))return false;
  const c=company(s,g.holderId),owner=company(s,g.grantorId),fee=money(g.exerciseFee??CFG.tuning_engine.fee__006);
  if(!c||!owner||c.bankrupt||c.finance.cash<fee+CFG.tuning_engine.exerciseOption__001)return false;
  expense(s,c,fee,'rights-license','Exercise '+g.media+' rights option');
  revenue(s,owner,fee,'rights-license','Option exercised for '+g.media);
  const sourceIp=s.ips.find(i=>i.id===g.ipId);if(sourceIp)sourceIp.rightsIncome=money((sourceIp.rightsIncome||0)+fee);
  g.optionExpiresWeek=g.endWeek;g.exercisedWeek=s.week;g.exerciseFeePaid=fee;
  g.type='license';g.startWeek=s.week;g.endWeek=s.week+CFG.tuning_engine.exerciseOption__002;g.allowsProduction=true;
  news(s,CFG.events.messages.exerciseOption__001,c.name+' licensed '+SECTORS[g.media].name+' production rights in '+(sourceIp?.name||'an IP')+'.','deal');return true;
}
function exerciseLicensedOption(s,grantId){const g=s.grants.find(x=>x.id===grantId);return !!g&&exerciseOption(s,g);}
function requestCreativeApproval(s,grantId,{title='Untitled adaptation',genre='Fantasy'}={}){
  const g=s.grants.find(g=>g.id===grantId);
  if(!g||g.type!=='license'||!g.approvalRequired||g.endWeek<=s.week||!g.allowsProduction)
    throw new Error('This grant has no active binding creative approval clause.');
  title=String(title).trim().slice(0,CFG.tuning_engine.requestCreativeApproval__001);if(!title||!GENRES.includes(genre))throw new Error('Valid title and genre required for approval.');
  const row={id:id(s,'pitchapproval'),grantId:g.id,grantorId:g.grantorId,holderId:g.holderId,
    title,genre,status:'pending',requestedWeek:s.week,decidedWeek:null,decidedBy:null};
  s.creativeApprovals.push(row);
  if(g.grantorId===s.playerId)alert(s,'approval-'+row.id,CFG.events.messages.requestCreativeApproval__001,
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
  s.obligations=s.obligations.filter(o=>o.amount>CFG.tuning_engine.settleRoyaltyObligations__001);
}
function weekSales(s) {
  s.weeklyConsumerSpend=money((s.streamingWeeklyTotal||0)+Object.values(s.gameMarketReserved||{}).reduce((a,b)=>a+b,0));
  for(const [sector,info] of Object.entries(SECTORS)) {
    if(!available(sector,s.week))continue;
    const titles=s.projects.filter(p=>p.sector===sector&&p.status==='released'&&p.route!=='contract'&&s.week-p.releaseWeek<CFG.tuning_engine.titles__001&&s.week>=p.releaseWeek&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=s.week&&g.endWeek+g.continuationWeeks>s.week)));
    if(!titles.length&&!s.backgroundFirms.some(b=>b.sector===sector&&b.releases.length))continue;
    for(const region of activeRegions(s)) {
      const budget=Math.max(0,money(worldMarketBudget(s,sector,region.name)-(sector==='tv'?(s.streamingWeeklyReserved?.[region.name]||0):sector==='games'?(s.gameMarketReserved?.[region.name]||0):0)));
      const background=backgroundWeights(s,sector,region);
      const cohortShares=audienceCohorts(s,region.name);
      const weights=titles.map(()=>0),minorShares=background.map(()=>0);
      for(const cohort of cohortShares){
        const titleWeights=titles.map(p=>{
          if(!canDistribute43(s,p,region.name,s.week))return 0;
          const age=s.week-p.releaseWeek,decay=Math.exp(-age/(p.sector==='publishing'?CFG.tuning_engine.decay__003:CFG.tuning_engine.decay__004));
          return ((p.quality/CFG.tuning_engine.titleWeights__001)**CFG.tuning_engine.titleWeights__002)*region.tastes[p.genre]*cohort.tastes[p.genre]*(1+CFG.tuning_engine.titleWeights__003*(p.marketingBudget/Math.max(p.budget,1)))*decay*audienceAffinity(p,cohort)*franchiseMomentum(s,p,s.week)*
           (p.sector==='movie'&&p.cinema?filmDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='tv'&&p.television?tvDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='games'&&p.videoGame?gameDemandMultiplier(p,s.week,region.name)*gamePlatformDemand49(s,p,region.name):1)*
           (p.sector==='publishing'?(p.translations?.some(t=>t.region===region.name)?CFG.tuning_engine.titleWeights__004:1)*
             (company(s,p.companyId)?.imprints?.some(i=>i.id===p.imprintId&&i.genre===p.genre)?CFG.tuning_engine.titleWeights__005:1)*
             (p.preorderCampaign&&age<CFG.tuning_engine.titleWeights__006?CFG.tuning_engine.titleWeights__007:1)*
             (p.format==='Web Serial'?(p.serialReaderMomentum||1):1):1);
        });
        const minorWeights=background.map(b=>b.weight*cohort.tastes[b.genre]);
        const denominator=CFG.tuning_engine.denominator__001+titleWeights.reduce((a,b)=>a+b,0)+minorWeights.reduce((a,b)=>a+b,0);
        for(let i=0;i<weights.length;i++)weights[i]+=cohort.share*titleWeights[i]/denominator;
        for(let i=0;i<minorShares.length;i++)minorShares[i]+=cohort.share*minorWeights[i]/denominator;
      }
      for(let i=0;i<titles.length;i++) {
        const p=titles[i],targetGross=money(budget*weights[i]);
        const c=company(s,p.companyId);let gross=p.sector==='games'&&p.videoGame?gamePlatformCapGross49(s,p,region.name,targetGross):targetGross,fee=money(gross*(p.sector==='publishing'?(p.publishingChannel==='owned'?CFG.tuning_engine.fee__007:p.publishingChannel==='direct'?CFG.tuning_engine.fee__008:p.publishingChannel==='digital'?CFG.tuning_engine.fee__009:CFG.tuning_engine.fee__010):CFG.tuning_engine.fee__011));
        const price=p.sector==='publishing'?publishingUnitPrice(p):0;let soldUnits=0;
        if(p.printStock){
          const book=p.printStock;
          // Wholesale partners fulfill 60% of a new edition's physical demand
          // without stock entering our warehouse. Their larger fee pays for
          // printing/retailer service; remaining 40% uses our own copies.
          // Both channels compete for the SAME capped consumer budget.
          const wholesaleShare=p.publishingChannel==='direct'?CFG.tuning_engine.wholesaleShare__001:p.publishingChannel==='wholesale'?CFG.tuning_engine.wholesaleShare__002:CFG.tuning_engine.wholesaleShare__003;
          const partnerGross=money(Math.floor(targetGross*wholesaleShare/book.price)*book.price),managedDemand=money(targetGross-partnerGross);
          p.stats.weeklyPrintDemand=(p.stats.weeklyPrintDemand||0)+Math.floor(managedDemand/book.price);
          const units=Math.min(book.stock,Math.floor(managedDemand/book.price));
          const directGross=money(units*book.price);
          gross=money(partnerGross+directGross);soldUnits=Math.floor(partnerGross/book.price)+units;
          fee=money(partnerGross*CFG.tuning_engine.weekSales__001+directGross*(p.publishingChannel==='owned'?CFG.tuning_engine.weekSales__002:CFG.tuning_engine.weekSales__003));
          if(units>0){
            const cogs=money(units*book.unitCost);
            transact(s,c,'printed-copies-sold',{inventory:-cogs,expense:cogs},'Cost of '+units+' printed copies: '+p.title,p.id);
            book.stock-=units;book.sold+=units;book.cogs=money(book.cogs+cogs);p.stats.weeklyPrintUnits=(p.stats.weeklyPrintUnits||0)+units;
            book.partnerGross=money((book.partnerGross||0)+partnerGross);
            book.directGross=money((book.directGross||0)+directGross);
            p.directCost=money(p.directCost+cogs);
          }else book.partnerGross=money((book.partnerGross||0)+partnerGross);
        }
        if(p.sector==='publishing'&&!p.printStock){soldUnits=Math.floor(targetGross/price);gross=money(soldUnits*price);fee=money(gross*(p.publishingChannel==='owned'?CFG.tuning_engine.weekSales__004:p.publishingChannel==='direct'?CFG.tuning_engine.weekSales__005:p.publishingChannel==='digital'?CFG.tuning_engine.weekSales__006:CFG.tuning_engine.weekSales__007));}
        if(gross<CFG.tuning_engine.weekSales__008)continue;
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
          if(p.publishingUnitHistory.length>CFG.tuning_engine.weekSales__009)p.publishingUnitHistory.splice(0,p.publishingUnitHistory.length-CFG.tuning_engine.weekSales__010);
          if(channel==='owned'&&s.publishingOutlet?.active){s.publishingOutlet.customerGross=money(s.publishingOutlet.customerGross+gross);s.publishingOutlet.distributionFees=money(s.publishingOutlet.distributionFees+fee);}
        }
        if(p.sector==='tv'&&p.television){
          const t=p.television;const age=s.week-p.releaseWeek,channel=age<CFG.tuning_engine.channel__001?'first-run':'syndication';
          t.regionalAdGross[region.name]=money((t.regionalAdGross[region.name]||0)+gross);
          t.channelGross[channel]=money((t.channelGross[channel]||0)+gross);
          const viewers=Math.floor(gross/(t.network==='premium'?CFG.tuning_engine.viewers__001:CFG.tuning_engine.viewers__002));
          t.estimatedViewers[region.name]=(t.estimatedViewers[region.name]||0)+viewers;
          const cohort=audienceCohorts(s,region.name),weights=cohort.map(x=>x.share*x.tastes[p.genre]*audienceAffinity(p,x));
          const all=weights.reduce((n,x)=>n+x,0)||1;let remaining=viewers;
          for(let j=0;j<cohort.length;j++){const count=j===cohort.length-1?remaining:Math.min(remaining,Math.floor(viewers*weights[j]/all));
           t.viewersByCohort[cohort[j].name]=(t.viewersByCohort[cohort[j].name]||0)+count;remaining-=count;}
          t.weeklyRatings.push({week:s.week,region:region.name,gross,estimatedViewers:viewers,channel});
          if(t.weeklyRatings.length>CFG.tuning_engine.weekSales__011){t.weeklyRatings.shift();t.ratingsHistoryComplete=false;}
          fee=money(gross*(channel==='syndication'?CFG.tuning_engine.weekSales__012:t.network==='premium'?CFG.tuning_engine.weekSales__013:t.network==='public'?CFG.tuning_engine.weekSales__014:CFG.tuning_engine.weekSales__015));
        }
        if(p.sector==='movie'){
          p.cinema.boxOffice[region.name]=money((p.cinema.boxOffice[region.name]||0)+gross);
          const channel=filmWindowChannel(p,s.week);
          const old=p.cinema.channels[channel]||0;p.cinema.channels[channel]=money(old+gross);
          const tickets=Math.floor(gross/CFG.tuning_engine.tickets__001);p.cinema.admissions[region.name]=(p.cinema.admissions[region.name]||0)+tickets;
          const weekly=p.cinema.weeklyBoxOffice.find(r=>r.week===s.week&&r.region===region.name);
          if(weekly){weekly.gross=money(weekly.gross+gross);weekly.estimatedAdmissions+=tickets;}
          else p.cinema.weeklyBoxOffice.push({week:s.week,region:region.name,channel,gross,estimatedAdmissions:tickets});
          if(p.cinema.weeklyBoxOffice.length>CFG.tuning_engine.weekSales__016){p.cinema.weeklyBoxOffice.splice(0,p.cinema.weeklyBoxOffice.length-CFG.tuning_engine.weekSales__017);p.cinema.boxOfficeHistoryComplete=false;}
          // Participation is an external talent expense from the producer's real receipts.
          const bonus=money(gross*(p.cinema.castShare||0));
          if(bonus>0){expense(s,c,bonus,'film-cast-backend','Contracted cast backend: '+p.title,p.id);p.directCost=money(p.directCost+bonus);p.cinema.castPaid=money(p.cinema.castPaid+bonus);}
          fee=money(gross*({wide:CFG.tuning_engine.weekSales__018,independent:CFG.tuning_engine.weekSales__019,limited:CFG.tuning_engine.weekSales__020}[p.cinema.distribution]||CFG.tuning_engine.weekSales__021));
        }
        if(p.sector==='games'&&p.videoGame){
          const split=gameMarketSplit(s,p,gross,region.name);
          fee=split.fee;
          if(split.fee>0){p.videoGame.platformFees=money(p.videoGame.platformFees+split.fee);p.videoGame.platformGross=money(p.videoGame.platformGross+gross);fee=split.fee;}
          p.videoGame.regionalGross[region.name]=money((p.videoGame.regionalGross[region.name]||0)+gross);
          p.videoGame.salesUnits[region.name]=(p.videoGame.salesUnits[region.name]||0)+Math.floor(gross/(p.videoGame.model==='free-to-play'?CFG.tuning_engine.weekSales__022:CFG.tuning_engine.weekSales__023));
          p.videoGame.weeklySales.push({week:s.week,region:region.name,gross,channel:split.channel});
          if(p.videoGame.weeklySales.length>CFG.tuning_engine.weekSales__024){p.videoGame.weeklySales.shift();p.videoGame.historyComplete=false;}
        }
        bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+(p.sector==='tv'?' broadcast and syndication receipts: ':' earned sales: ')+p.title,p.id);
        if(p.sector==='games'&&p.videoGame&&p.videoGame.lastStoreOwnerId&&p.videoGame.lastStoreOwnerId!==p.companyId){
          const operator=company(s,p.videoGame.lastStoreOwnerId);
          const payable=money(Math.max(0,Math.min(fee, c.finance.cash-CFG.tuning_engine.payable__001)));
          if(operator&&payable>0){expense(s,c,payable,'game-store-service','Actual store service settlement: '+p.title,p.id);revenue(s,operator,payable,'game-store-commission','Store service fee earned: '+p.title,p.id);}
          const remaining=money(fee-payable);if(remaining>0)expense(s,c,remaining,'distribution','External game distribution balance: '+p.title,p.id);
        }else if(fee>0)expense(s,c,fee,'distribution','Distribution fees: '+p.title,p.id);

        const salesDuty=money(gross*region.salesTaxRate);
        expense(s,c,salesDuty,'automatic-sales-tax','Regional sales levy: '+p.title,p.id);
        p.directRevenue=money(p.directRevenue+gross);p.directCost=money(p.directCost+fee+salesDuty);p.audience=money(p.audience+gross);p.stats.weeklySales=money(p.stats.weeklySales+gross);p.stats.totalSales=money(p.stats.totalSales+gross);
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
        if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(g)settleRoyalty(s,p,g,gross*g.royaltyRate,gross);}
        settlePartnerShare(s,p,gross);
        gamePublisherSale43(s,p,gross);
      }
      // Aggregate competitor income is sourced from the same finite wallet;
      // it does not multiply world spending or create market-share bailouts.
      for(let j=0;j<background.length;j++){
        const item=background[j];const gross=money(budget*minorShares[j]);if(gross<CFG.tuning_engine.weekSales__025)continue;
        const b=item.firm;bookConsumerReceipt(s,b,gross,'minor-consumer-sales','Regional minor-firm original receipts',null);
        expense(s,b,money(gross*(sector==='publishing'?CFG.tuning_engine.weekSales__026:CFG.tuning_engine.weekSales__027)),'minor-distribution','Background distribution fees');
        expense(s,b,money(gross*region.salesTaxRate),'automatic-sales-tax','Regional background-sales levy');
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
      }
    }
  }
}
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
    for(const [sec,info] of Object.entries(SECTORS))if(info.year===year&&sec!=='publishing') {news(s,info.name+' industry debuts',CFG.events.messages.singleWeek__001,'breakthrough');alert(s,'industry-'+sec,CFG.events.messages.singleWeek__002,info.name+' has globally debuted. You can remain a specialist or invest in an entry capability.','advisory');newEntrants(s,year);}
  }
  for(const [sec,info]of Object.entries(SECTORS))if(info.year>1&&s.week===(info.year-1)*CFG.tuning_engine.singleWeek__001-CFG.tuning_engine.singleWeek__002){
    news(s,'Industry outlook: '+info.name+' approaches','Worldwide debut expected in World Year '+info.year+'. Binding future-media options may be negotiated now; production remains prohibited before debut.','breakthrough');
    alert(s,'preview-'+sec,'Prepare for '+info.name,'The global '+info.name+' sector debuts in 26 weeks. Compare optional partners and rights; there is no mandatory expansion.','advisory');
  }
  s.macroeconomy=clamp(s.macroeconomy+(rand(s)-CFG.tuning_engine.singleWeek__003)*CFG.tuning_engine.singleWeek__004-(s.macroeconomy-1)*CFG.tuning_engine.singleWeek__005,CFG.tuning_engine.singleWeek__006,CFG.tuning_engine.singleWeek__007);
  updateRegionalEconomy(s);
  if(s.week%CFG.tuning_engine.singleWeek__008===0)recruitVacancies(s);
  for(const [sector,t] of Object.entries(technologyReport(s)))if(t.discovered&&t.discoveryWeek===s.week){
    news(s,SECTORS[sector].name+' technology breakthrough',CFG.events.messages.singleWeek__003,'breakthrough');
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
    if(!fundedPayroll44(s,c))continue;
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
    if(exerciseOption(s,g)) {const c=company(s,g.holderId);if(c&&!c.capabilities[g.media]&&c.finance.cash>=capabilityCost(g.media,'partner')+CFG.tuning_engine.singleWeek__009){expense(s,c,capabilityCost(g.media,'partner'),'capability','Partner adaptation production capability');c.capabilities[g.media]='partner';}const ip=s.ips.find(x=>x.id===g.ipId);
      const pitchTitle=(ip?.name||'New Story')+': Adapted';
      if(g.approvalRequired){
        requestCreativeApproval(s,g.id,{title:pitchTitle,genre:GENRES[0]});
      }else try{createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,title:pitchTitle,genre:GENRES[0],size:CFG.tuning_engine.singleWeek__010});}catch(e) {/* Counterparty retains rights but may defer production. */}

    }
  }
  for(const approval of s.creativeApprovals||[])if(approval.status==='approved'&&!approval.launched){
    const g=s.grants.find(g=>g.id===approval.grantId),c=company(s,approval.holderId);
    if(!g||g.type!=='license'||g.endWeek<=s.week||!c||c.bankrupt||c.id===s.playerId)continue;
    if(!c.capabilities[g.media])continue;
    try{const production=createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,
      title:approval.title,genre:approval.genre,size:CFG.tuning_engine.production__001,approvalId:approval.id});approval.launched=production.id;}
    catch(e){/* Pending capacity/cash; approved terms remain valid until the actual expiry. */}
  }
  streamingWeek(s);
  gameStoreWeek(s);
  gameLiveServiceWeek49(s);
  gamePublisherWeek43(s);
  weekSales(s);
  // Serialized reader momentum reacts only to ACTUAL current-week purchases.
  // It reallocates share within the same consumer wallets in following weeks.
  const weeklyPublishingWallet=activeRegions(s).reduce((n,r)=>n+worldMarketBudget(s,'publishing',r.name),0);
  for(const p of s.projects)if(p.sector==='publishing'&&p.format==='Web Serial'&&p.status==='released'){
    const observed=(p.stats.weeklySales||0)/Math.max(1,weeklyPublishingWallet);
    const target=clamp(CFG.tuning_engine.target__004+observed*CFG.tuning_engine.target__005,CFG.tuning_engine.target__006,CFG.tuning_engine.target__007);
    p.serialReaderMomentum=money(clamp((p.serialReaderMomentum||1)*CFG.tuning_engine.singleWeek__011+target*CFG.tuning_engine.singleWeek__012,CFG.tuning_engine.singleWeek__013,CFG.tuning_engine.singleWeek__014));
    p.serialEngagementHistory.push({week:s.week,momentum:p.serialReaderMomentum,observedGross:money(p.stats.weeklySales||0)});
    if(p.serialEngagementHistory.length>CFG.tuning_engine.singleWeek__015)p.serialEngagementHistory.shift();
  }
  settlePrintLifecycle(s);
  autoReplenishPrint(s);
  reviewReleases(s);
  if(s.week%CFG.tuning_engine.singleWeek__016===0){for(const c of s.companies){if(c.isPlayer||c.bankrupt)continue;if(rand(s)<(s.settings.difficulty==='challenging'?CFG.tuning_engine.singleWeek__017:s.settings.difficulty==='casual'?CFG.tuning_engine.singleWeek__018:CFG.tuning_engine.singleWeek__019))launchAI(s,c);}}
  if(s.week%CFG.tuning_engine.singleWeek__020===0)for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash>SECTORS[c.sector].cost*CFG.tuning_engine.singleWeek__021){
    const t=businessTechnology(s,c.id,c.sector);
    if(t.canUpgrade&&rand(s)<CFG.tuning_engine.singleWeek__022)try{adoptTechnologyForRival(s,c,c.sector);}catch(e){/* A real competitor can defer an upgrade. */}
  }
  for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash<=0&&c.finance.payable>SECTORS[c.sector].cost*CFG.tuning_engine.singleWeek__023){c.bankrupt=true;news(s,c.name+' closes its doors','The financially distressed '+SECTORS[c.sector].name+' firm could not meet ongoing obligations.','competitor');}
  managementWeek43(s);
  update43CWeek(s);
  update43BWeek(s);
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
  if(s.snapshots.length>CFG.tuning_engine.captureAnnualSnapshots__001)s.snapshots.splice(0,s.snapshots.length-CFG.tuning_engine.captureAnnualSnapshots__002);
}
function historicalCompanyFinances(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for yearly financial history.');
  return s.snapshots.filter(x=>x.companyId===companyId).sort((a,b)=>b.year-a.year).map(x=>({...x}));
}
// Rival financial books are private. Only rough bands, explicitly tagged as
// estimates, may appear in the player's intelligence views; ownership group
// companies and actual public release results are shown accurately.
function portfolioRankings(s,{type='finance',metric=null,sector='all',region='all',year='all',limit=CFG.tuning_engine.portfolioRankings__001}={}){
  if(!['finance','audience','prestige'].includes(type))throw new Error('Unknown ranking type.');
  if(sector!=='all'&&!SECTORS[sector])throw new Error('Unknown ranking sector.');
  if(region!=='all'&&!activeRegions(s).some(r=>r.name===region))throw new Error('Unknown ranking region.');
  if(year!=='all'&&(!Number.isInteger(Number(year))||Number(year)<1||Number(year)>yearAt(s.week)))throw new Error('Invalid ranking year.');
  const yearNum=year==='all'?null:Number(year),max=clamp(Number(limit)||CFG.tuning_engine.max__001,1,CFG.tuning_engine.max__002);
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
      const shown=actual?money(value):money(Math.round(value/CFG.tuning_engine.shown__001)*CFG.tuning_engine.shown__002);
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
  const titles=portfolioRankings(s,{type:'audience',sector,year,limit:CFG.tuning_engine.titles__002});
  const acclaim=portfolioRankings(s,{type:'prestige',sector,year,limit:CFG.tuning_engine.acclaim__001});
  const entries=s.projects.filter(p=>p.status==='released'&&p.releaseWeek!==null&&(sector==='all'||p.sector===sector)&&
    (year==='all'||yearAt(p.releaseWeek)===Number(year)));
  return {topAudience:titles[0]||null,topCritic:acclaim[0]||null,
    releasedCount:entries.length,franchiseCount:new Set(entries.map(p=>p.ipId).filter(Boolean)).size,
    note:'Played releases only; gross audience sales and critic scores are not accounting profit.'};
}
function searchNewsArchive(s,{query='',kind='all',year='all',limit=CFG.tuning_engine.searchNewsArchive__001}={}){
  const q=String(query||'').toLowerCase().slice(0,CFG.tuning_engine.q__003);return [...s.news,...(s.archivedNews||[])]
   .filter(n=>(kind==='all'||n.kind===kind)&&(year==='all'||n.year===Number(year))&&
      (n.title+' '+n.body).toLowerCase().includes(q))
   .sort((a,b)=>b.week-a.week||b.id.localeCompare(a.id)).slice(0,clamp(Number(limit)||CFG.tuning_engine.searchNewsArchive__002,1,CFG.tuning_engine.searchNewsArchive__003));
}

// Small real freelance pool: an individual specialist can only serve one active
// production. No compulsory task scheduling or permanent payroll minigame.
const SPECIALIST_NAMES=CFG.starting.SPECIALIST_NAMES;
const SPECIALIST_DISCIPLINES=CFG.starting.SPECIALIST_DISCIPLINES;
function seedSpecialists(s){
 if(!Array.isArray(s.specialists))s.specialists=[];
 if(s.specialists.length)return;
 for(let i=0;i<SPECIALIST_NAMES.length;i++){
  const skill=CFG.tuning_engine.skill__001+hash(s.seed+':talent:'+i)%CFG.tuning_engine.skill__002;
  s.specialists.push({id:id(s,'talent'),name:SPECIALIST_NAMES[i],discipline:SPECIALIST_DISCIPLINES[i%CFG.tuning_engine.seedSpecialists__001],skill,
   fee:money(CFG.tuning_engine.seedSpecialists__002+(skill-CFG.tuning_engine.seedSpecialists__003)*CFG.tuning_engine.seedSpecialists__004),assignedProjectId:null,completed:0,enteredWeek:s.week,creatorRole:null,mentorshipHistory:[]});
 }
}
function availableSpecialists(s,projectId){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.status!=='active')throw new Error('No active project for specialist booking.');
 return (s.specialists||[]).filter(x=>!x.assignedProjectId).map(x=>({...x,canAfford:company(s,p.companyId).finance.cash>=x.fee+CFG.tuning_engine.availableSpecialists__001}));
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
 if(c.finance.cash<talent.fee+CFG.tuning_engine.bookSpecialist__001)throw new Error('Specialist fee would breach the protected operating cash buffer.');
 expense(s,c,talent.fee,'specialist-fee','Specialist '+talent.name+' on '+p.title,p.id);
 p.directCost=money(p.directCost+talent.fee);p.productionSpend=money((p.productionSpend||0)+talent.fee);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+talent.fee);
 const leader=s.employees.find(e=>e.id===c.teams.find(t=>t.id===p.teamId)?.leaderId&&e.status==='employed');
 const repeatBond=s.creatorRelations?.find(r=>r.leaderId===leader?.id&&r.specialistId===talent.id);
 const chemistry=repeatBond?Math.min(CFG.tuning_engine.chemistry__001,repeatBond.projects):0;
 if(talent.discipline==='editorial')p.creativeQuality=Math.round(clamp(p.creativeQuality+CFG.tuning_engine.bookSpecialist__002+(talent.skill-CFG.tuning_engine.bookSpecialist__003)/CFG.tuning_engine.bookSpecialist__004+chemistry,1,CFG.tuning_engine.bookSpecialist__005));
 if(talent.discipline==='technical')p.technicalQuality=Math.round(clamp(p.technicalQuality+CFG.tuning_engine.bookSpecialist__006+(talent.skill-CFG.tuning_engine.bookSpecialist__007)/CFG.tuning_engine.bookSpecialist__008+chemistry,1,CFG.tuning_engine.bookSpecialist__009));
 if(talent.discipline!=='production')p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.bookSpecialist__010+p.technicalQuality*CFG.tuning_engine.bookSpecialist__011,1,CFG.tuning_engine.bookSpecialist__012));
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
 if(!Number.isInteger(targetWeek)||targetWeek<s.week||targetWeek>s.week+CFG.tuning_engine.setFranchiseReleaseTarget__001)
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
function coordinateFranchiseReleases(s,ipId,spacing=CFG.tuning_engine.coordinateFranchiseReleases__001){
 const ip=s.ips.find(x=>x.id===ipId);
 if(!ip||!controlledCompanies(s).some(c=>c.id===ip.ownerId))throw new Error('Franchise owner approval required.');
 if(!Number.isInteger(spacing)||spacing<CFG.tuning_engine.coordinateFranchiseReleases__002||spacing>CFG.tuning_engine.coordinateFranchiseReleases__003)throw new Error('Use 4–12 weeks between releases.');
 const projects=s.projects.filter(p=>p.ipId===ipId&&p.status==='active'&&p.route!=='contract'&&
  controlledCompanies(s).some(c=>c.id===p.companyId)).sort((a,b)=>(a.holdUntilWeek||s.week+a.weeksTotal-a.weeksDone)-(b.holdUntilWeek||s.week+b.weeksTotal-b.weeksDone));
 const proposed=[];let previous=-Infinity;
 for(const p of projects){
  const natural=s.week+Math.ceil(Math.max(0,p.weeksTotal-p.weeksDone)/CFG.tuning_engine.natural__001),planned=Math.max(natural,p.holdUntilWeek||0);
  const target=Math.max(planned,previous+spacing);
  if(target>s.week+CFG.tuning_engine.coordinateFranchiseReleases__004)throw new Error('Spacing would exceed the one-year planning horizon.');
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
   x.status==='released'&&x.releaseWeek<=atWeek&&atWeek-x.releaseWeek<CFG.tuning_engine.peers__001&&x.route!=='contract');
 let delta=0;
 for(const x of peers){const q=Number.isFinite(x.audienceScore)?x.audienceScore:x.quality;
  const impact=clamp((q-CFG.tuning_engine.impact__001)/CFG.tuning_engine.impact__002,-CFG.tuning_engine.impact__003,CFG.tuning_engine.impact__004)*Math.exp(-(atWeek-x.releaseWeek)/CFG.tuning_engine.impact__005);
  delta+=impact;
 }
 return money(clamp(1+delta,CFG.tuning_engine.franchiseMomentum__001,CFG.tuning_engine.franchiseMomentum__002));
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
 if(typeof policy?.autoBook!=='boolean'||!Number.isFinite(Number(policy.maxFee))||policy.maxFee<CFG.tuning_engine.configureTalentAuthority__001||policy.maxFee>CFG.tuning_engine.configureTalentAuthority__002)
  throw new Error('Specialist delegation needs an explicit opt-in and fee ceiling.');
 s.talentPolicy={autoBook:policy.autoBook,maxFee:money(policy.maxFee)};
 return {...s.talentPolicy};
}
function delegateSpecialists(s){
 if(!s.talentPolicy?.autoBook||s.week%CFG.tuning_engine.delegateSpecialists__001!==0)return 0;
 let booked=0;
 for(const p of s.projects.filter(p=>p.companyId===s.playerId&&p.status==='active'&&p.major&&
   !p.specialistId&&!(p.specialistAppointments||[]).length&&p.weeksDone<p.weeksTotal*CFG.tuning_engine.delegateSpecialists__002)){
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
 if((t.trainingHistory||[]).length&&s.week-t.trainingHistory.at(-1).week<CFG.tuning_engine.trainTeam__001)throw new Error('Team recently trained; wait at least a quarter.');
 const cost=focus==='mentorship'?CFG.tuning_engine.cost__010:CFG.tuning_engine.cost__011;
 if(c.finance.cash<cost+CFG.tuning_engine.trainTeam__002)throw new Error('Insufficient cash for training and normal payroll reserve.');
 if(focus==='mentorship'&&t.skill>=CFG.tuning_engine.trainTeam__003)throw new Error('Team has reached the current skill ceiling.');
 const oldSkill=t.skill,oldSpecialty=t.specialty;
 expense(s,c,cost,'training','Develop '+t.name+' skills and specialty');
 t.skill=Math.min(CFG.tuning_engine.trainTeam__004,t.skill+(focus==='mentorship'?CFG.tuning_engine.trainTeam__005:1));
 if(focus==='specialize')t.specialty=specialty;
 if(!Array.isArray(t.trainingHistory))t.trainingHistory=[];
 t.trainingHistory.push({week:s.week,focus,cost,oldSkill,newSkill:t.skill,oldSpecialty,newSpecialty:t.specialty});
 if(t.trainingHistory.length>CFG.tuning_engine.trainTeam__006)t.trainingHistory.shift();
 if(c.isPlayer)news(s,'Team development: '+t.name,'Optional '+focus+' cost '+shortMoney(cost)+'; future project matching may improve, but no project result is guaranteed.','company');
 return {teamId,cost,focus,skill:t.skill,specialty:t.specialty};
}
function teamPerformance(s,teamId){
 const c=s.companies.find(c=>c.teams?.some(t=>t.id===teamId));
 if(!c)throw new Error('Unknown production team.');
 const t=c.teams.find(t=>t.id===teamId),rows=t.performanceHistory||[];
 return {teamId:t.id,team:t.name,skill:t.skill,specialty:t.specialty,completed:t.completed,
  trackedProjects:rows.length,averageQuality:rows.length?money(rows.reduce((n,r)=>n+r.quality,0)/rows.length):null,
  recent:rows.slice(-CFG.tuning_engine.teamPerformance__001).map(x=>({...x})),training:(t.trainingHistory||[]).slice(-CFG.tuning_engine.teamPerformance__002).map(x=>({...x})),
  historyComplete:rows.length>0||t.completed===0,
  note:'Ratings reflect observed releases from this build; older campaigns may not include past project evaluations.'};
}

function advance(s,count=1) {
  if(s.runStatus==='ended')return {weeks:0,stopped:true,reason:'Run concluded.'};
  const n=clamp(Math.round(Number(count)||1),1,CFG.tuning_engine.n__001);let moved=0,stopped=false;
  const pauses=()=>s.inbox.some(a=>a.open&&(a.kind==='critical'||(s.pausePolicy?.stopForAdvisory&&a.kind==='advisory')));
  if(n>1&&pauses())return {weeks:0,stopped:true,reason:'Review your selected Inbox interruptions before skipping.'};
  for(let i=0;i<n;i++){if(i>0&&pauses()){stopped=true;break;}singleWeek(s);moved++;if(n>1&&pauses()){stopped=true;break;}}
  return {weeks:moved,stopped,reason:stopped?'An important decision or warning needs attention.':''};
}
// Depth modes D4: advance week by week until a NEW Inbox card opens (or the config cap is reached).
function advanceToDecision(s){
  if(s.runStatus==='ended')return {weeks:0,stopped:true,reason:'Run concluded.',found:false,capped:false};
  if(s.inbox.some(a=>a.open&&a.kind==='critical'))return {weeks:0,stopped:true,reason:'A decision is already waiting in your Inbox.',found:true,capped:false};
  const cap=Math.max(1,Math.round(Number(CFG.depth.ADVANCE_TO_DECISION.maxWeeks)||1)),seen=new Set(s.inbox.filter(a=>a.open).map(a=>a.id));
  let moved=0,found=false;
  while(moved<cap){singleWeek(s);moved++;if(s.runStatus==='ended')break;if(s.inbox.some(a=>a.open&&!seen.has(a.id))){found=true;break;}}
  const capped=!found&&s.runStatus!=='ended';
  return {weeks:moved,stopped:found,found,capped,reason:found?'A decision needs your attention.':capped?'No decisions for '+moved+' weeks, so I stopped.':'Run concluded.'};
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
function batchApproveRoutineCounters(s,limit=CFG.tuning_engine.batchApproveRoutineCounters__001){
  if(!Number.isInteger(limit)||limit<1||limit>CFG.tuning_engine.batchApproveRoutineCounters__002)throw new Error('Routine approval batch must contain 1–10 offers.');
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
// Depth modes (Simple / Standard / Very Complex) only switch automatic policies;
// the simulation rules are the same in every mode. Presets live in config/depth.json.
const DEPTH_MODES=Object.keys(CFG.depth.MODES);
function applyDepthPreset(s,mode){const p=CFG.depth.MODES[mode];
 s.pausePolicy.stopForAdvisory=p.stopForAdvisory;s.talentPolicy.autoBook=p.talentAutoBook;
 s.rightsPolicy.autoRenew=p.rightsAutoRenew;s.commissionPolicy.autoCounter=p.commissionAutoCounter;
 const c=player(s);if(c&&c.staffPolicy)c.staffPolicy.autoFill=p.staffAutoFill;}
function setDepth(s,mode){if(!DEPTH_MODES.includes(mode))throw new Error('Invalid depth mode.');s.settings.depth=mode;applyDepthPreset(s,mode);return mode;}
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
    variancePercent:plannedTotal?money((estimatedTotal-plannedTotal)/plannedTotal*CFG.tuning_engine.projectBudget__001):0,
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
 if(details.displayTitle!==undefined&&(typeof details.displayTitle!=='string'||details.displayTitle.length>CFG.tuning_engine.editFranchiseBible__001))throw new Error('Invalid editorial display name.');
 if(details.continuity!==undefined&&!['strict','flexible'].includes(details.continuity))throw new Error('Unknown continuity policy.');
 if(details.summary!==undefined&&(typeof details.summary!=='string'||details.summary.length>CFG.tuning_engine.editFranchiseBible__002))throw new Error('Franchise summary must contain no more than 600 characters.');
 const old=s.franchiseNotes?.[ipId]||{summary:'',continuity:'flexible',displayTitle:''};
 const next={displayTitle:details.displayTitle!==undefined?details.displayTitle.trim().slice(0,CFG.tuning_engine.next__001):(old.displayTitle||''),
  summary:details.summary!==undefined?details.summary.trim().slice(0,CFG.tuning_engine.next__002):old.summary,
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
    Math.ceil(Math.max(0,project.weeksTotal-project.weeksDone)/CFG.tuning_engine.remaining__001):0;
  const plannedWeek=project.releaseWeek??(project.status==='active'?Math.max(s.week+remaining,project.holdUntilWeek||0):null);
  const grant=project.grantId?s.grants.find(g=>g.id===project.grantId):null;
  return {...p,plannedWeek,rightsRisk:!!(grant&&plannedWeek!==null&&grant.endWeek<=plannedWeek&&grant.endWeek>s.week)};
 });
 const warnings=[];
 const upcoming=rows.filter(r=>r.plannedWeek!==null&&r.plannedWeek>=s.week).sort((a,b)=>a.plannedWeek-b.plannedWeek);
 for(let i=1;i<upcoming.length;i++)if(upcoming[i].plannedWeek-upcoming[i-1].plannedWeek<=CFG.tuning_engine.franchiseSchedule__001)
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
  if(!FOUNDER_BACKGROUNDS.includes(s.founder.background)||!FOUNDER_FOCUSES.includes(s.founder.focus)||!Number.isFinite(s.founder.age)||s.founder.age<CFG.tuning_engine.auditIdentities__001||s.founder.age>CFG.tuning_engine.auditIdentities__002)problems.push('Invalid founder career profile');
  if(!Array.isArray(s.employees)||!Array.isArray(s.candidates))problems.push('Missing staff personnel registers');
  for(const e of [...(s.employees||[]),...(s.candidates||[])]){
    record(e,'employee');
    if(!STAFF_TRAITS.includes(e.trait)||!GENRES.includes(e.specialty)||!Number.isFinite(e.skill)||e.skill<CFG.tuning_engine.auditIdentities__003||e.skill>CFG.tuning_engine.auditIdentities__004||!Number.isFinite(e.weeklySalary)||e.weeklySalary<CFG.tuning_engine.auditIdentities__005||e.weeklySalary>CFG.tuning_engine.auditIdentities__006||!Number.isInteger(e.age)||e.age<CFG.tuning_engine.auditIdentities__007||e.age>CFG.tuning_engine.auditIdentities__008||!Number.isInteger(e.enteredWeek)||e.enteredWeek>s.week||!Number.isFinite(e.morale)||e.morale<0||e.morale>CFG.tuning_engine.auditIdentities__009||!Array.isArray(e.history)||e.history.some(h=>h.week>s.week))problems.push(e.id+': invalid employee identity, compensation or history');
    if(e.status==='employed'){const owner=company(s,e.employerId),t=owner?.teams.find(t=>t.id===e.teamId);
      if(!owner||!t||t.leaderId!==e.id||e.contractEndWeek<=s.week||!Number.isInteger(e.hiredWeek))problems.push(e.id+': invalid employee active team or contract');}
    else if(e.employerId||e.teamId)problems.push(e.id+': employee without job still owns a team');
  }
  for(const c of s.companies){
    if(!Array.isArray(c.imprints)||c.imprints.some((i,j)=>i.companyId!==c.id||!GENRES.includes(i.genre)||
      typeof i.name!=='string'||i.name.length<CFG.tuning_engine.auditIdentities__010||i.createdWeek>s.week||i.startFee!==CFG.tuning_engine.auditIdentities__011||
      c.imprints.slice(0,j).some(x=>x.name===i.name)))problems.push(c.id+': invalid publishing imprint');
  }
  for(const c of s.companies)if(!CULTURES.includes(c.culture)||!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean'||!Number.isFinite(c.staffPolicy.maxSalary)||c.staffPolicy.maxSalary<CFG.tuning_engine.auditIdentities__012||c.staffPolicy.maxSalary>CFG.tuning_engine.auditIdentities__013)problems.push(c.id+': invalid culture or delegated payroll policy');
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee)||s.talentPolicy.maxFee<CFG.tuning_engine.auditIdentities__014||s.talentPolicy.maxFee>CFG.tuning_engine.auditIdentities__015)problems.push('Invalid freelance delegation authority');
  if(!Array.isArray(s.creatorScouting)||s.creatorScouting.some(x=>!Number.isInteger(x.week)||x.week>s.week||
     !s.specialists.some(t=>t.id===x.personId&&['writer','artist'].includes(t.creatorRole))||x.fee!==CFG.tuning_engine.auditIdentities__016)||
     new Set(s.creatorScouting.map(x=>x.personId)).size!==s.creatorScouting.length)problems.push('Invalid emerging creator scouting provenance');
  for(const t of s.specialists||[]){
   if(![null,'writer','artist'].includes(t.creatorRole)||!Array.isArray(t.mentorshipHistory)||
      t.mentorshipHistory.some((h,i)=>!Number.isInteger(h.week)||h.week<t.enteredWeek||h.week>s.week||h.cost!==CFG.tuning_engine.auditIdentities__017||
        !Number.isFinite(h.oldSkill)||!Number.isFinite(h.newSkill)||h.newSkill!==Math.min(CFG.tuning_engine.auditIdentities__018,h.oldSkill+CFG.tuning_engine.auditIdentities__019)||
        t.mentorshipHistory.slice(0,i).some(x=>yearAt(x.week)===yearAt(h.week))))problems.push('Invalid emerging creator fellowship history');
  }
  for(const t of s.specialists||[]){record(t,'external specialist');if(!SPECIALIST_DISCIPLINES.includes(t.discipline)||!Number.isFinite(t.skill)||t.skill<CFG.tuning_engine.auditIdentities__020||t.skill>CFG.tuning_engine.auditIdentities__021||!Number.isFinite(t.fee)||t.fee<=0||!Number.isInteger(t.enteredWeek)||t.enteredWeek>s.week||t.enteredWeek<0||!Number.isInteger(t.completed)||t.completed<0)problems.push(t.id+': invalid specialist identity/fee/history');
   if(t.assignedProjectId){const p=s.projects.find(p=>p.id===t.assignedProjectId);if(!p||p.status!=='active'||p.specialistId!==t.id)problems.push(t.id+': invalid active specialist assignment');}}
  for(const c of s.companies){record(c,'company');for(const t of c.teams||[]){record(t,'team');
   if(t.leaderId&&!s.employees?.some(e=>e.id===t.leaderId&&e.employerId===c.id&&e.teamId===t.id&&e.status==='employed'))problems.push(t.id+': orphaned team employee');
   if(!GENRES.includes(t.specialty)||!Number.isFinite(t.skill)||t.skill<CFG.tuning_engine.auditIdentities__022||t.skill>CFG.tuning_engine.auditIdentities__023||!Array.isArray(t.trainingHistory)||!Array.isArray(t.performanceHistory)||
      t.trainingHistory.some(h=>!Number.isInteger(h.week)||h.week<0||h.week>s.week||!['mentorship','specialize'].includes(h.focus)||!Number.isFinite(h.cost)||h.cost<=0||!GENRES.includes(h.newSpecialty)||!Number.isFinite(h.newSkill)||h.newSkill>CFG.tuning_engine.auditIdentities__024)||
      t.performanceHistory.some(h=>!projectIds.has(h.projectId)||!Number.isInteger(h.week)||h.week> s.week||!SECTORS[h.sector]||!GENRES.includes(h.genre)||h.quality<1||h.quality>CFG.tuning_engine.auditIdentities__025))problems.push(t.id+': invalid training or performance record');
  }}
  for(const b of s.backgroundFirms){
    record(b,'background company');
    if(!SECTORS[b.sector]||b.foundedYear<SECTORS[b.sector].year)problems.push(b.id+': background founding predates medium');
    if(b.active){record(b.active,'background active job');if(!available(b.sector,s.week))problems.push(b.id+': premature minor production');}
    for(const work of b.releases){record(work,'background original');if(work.releaseWeek<(SECTORS[b.sector].year-1)*CFG.tuning_engine.auditIdentities__026)problems.push(work.id+': premature minor release');}
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
      !Number.isFinite(m.royaltyRate)||m.royaltyRate<=0||m.royaltyRate>CFG.tuning_engine.auditIdentities__027||
      !Number.isFinite(m.agencyRate)||m.agencyRate<0||m.agencyRate>CFG.tuning_engine.auditIdentities__028||typeof m.creatorApprovalRequired!=='boolean'||
      (m.status==='licensed'&&!s.grants.some(g=>g.id===m.licenseId&&g.ipId===m.ipId&&g.holderId===s.playerId)))
      problems.push(m.id+': invalid manuscript rights provenance');
  }
  for(const o of s.manuscriptOffers||[]){
    record(o,'manuscript offer');const m=s.manuscripts?.find(m=>m.id===o.manuscriptId);
    if(!m||o.ownerId!==m.ownerId||o.buyerId!==s.playerId||
      !['agreed','counter','signed','declined'].includes(o.status)||o.createdWeek>s.week||o.expiresWeek<o.createdWeek||
      [o.proposal,o.counter].filter(Boolean).some(t=>!Number.isFinite(t.agencyRate)||t.agencyRate<0||t.agencyRate>CFG.tuning_engine.auditIdentities__029||typeof t.approvalRequired!=='boolean')||
      o.status==='signed'&&!s.grants.some(g=>g.id===o.grantId&&g.manuscriptId===m.id))
      problems.push(o.id+': invalid manuscript offer provenance');
  }
  if(s.publishingOutlet){
    const o=s.publishingOutlet;record(o,'publishing outlet');
    if(o.companyId!==s.playerId||typeof o.active!=='boolean'||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Array.isArray(o.catalog)||o.monthlyCost!==CFG.tuning_engine.auditIdentities__030||![o.startupSpent,o.operatingSpent,o.customerGross,o.distributionFees].every(x=>Number.isFinite(x)&&x>=0)||
       o.distributionFees>o.customerGross+CFG.tuning_engine.auditIdentities__031||
       o.catalog.some((x,i)=>!s.projects.some(p=>p.id===x.projectId&&p.sector==='publishing'&&p.companyId===o.companyId&&p.route!=='contract')||
          !Number.isInteger(x.listedWeek)||x.listedWeek> s.week||o.catalog.slice(0,i).some(y=>y.projectId===x.projectId))||
       o.customerGross>money(s.projects.filter(p=>p.companyId===o.companyId).reduce((n,p)=>n+(p.salesByChannel?.owned||0),0))+CFG.tuning_engine.auditIdentities__032)
      problems.push('Invalid owned publishing outlet cash, fees or catalog rights');
  }
  for(const p of s.projects){
    record(p,'project');
    if(!companyIds.has(p.companyId))problems.push(p.id+': missing production company');
    if(p.ipId&&!ipIds.has(p.ipId))problems.push(p.id+': missing source IP');
    if(p.grantId&&!grantIds.has(p.grantId))problems.push(p.id+': missing underlying rights grant');
    if(p.escrowId&&!escrowIds.has(p.escrowId))problems.push(p.id+': missing funded commission escrow');
    if(p.sector==='publishing'&&(!Number.isFinite(p.serialReaderMomentum)||p.serialReaderMomentum<CFG.tuning_engine.auditIdentities__033||p.serialReaderMomentum>CFG.tuning_engine.auditIdentities__034||
      !Array.isArray(p.serialEngagementHistory)||p.serialEngagementHistory.some(h=>h.week>s.week||h.momentum<CFG.tuning_engine.auditIdentities__035||h.momentum>CFG.tuning_engine.auditIdentities__036||h.observedGross<0)||
      !Array.isArray(p.serialArcDecisions)||p.serialArcDecisions.some((h,i)=>!['tighten','expand'].includes(h.choice)||h.week<p.startWeek||h.week>s.week||h.cost!==(h.choice==='expand'?CFG.tuning_engine.auditIdentities__037:CFG.tuning_engine.auditIdentities__038)||i>0)||
      !Array.isArray(p.publishingFormatHistory)||!Array.isArray(p.translations)||
      p.publishingFormatHistory.some((h,i)=>!PUBLISHING_TREATMENTS[h.focus]||PUBLISHING_TREATMENTS[h.focus].format!==p.format||
        !Number.isFinite(h.cost)||h.cost!==PUBLISHING_TREATMENTS[h.focus].cost||h.week<p.startWeek||h.week>s.week||
        p.publishingFormatHistory.slice(0,i).some(x=>x.focus===h.focus))||
      p.translations.some((t,i)=>!activeRegions(s).some(r=>r.name===t.region)||!Number.isInteger(t.week)||t.week> s.week||t.cost!==CFG.tuning_engine.auditIdentities__039||
        p.translations.slice(0,i).some(x=>x.region===t.region))||
      (p.preorderCampaign&&(!Number.isInteger(p.preorderCampaign.week)||p.preorderCampaign.week<p.startWeek||p.preorderCampaign.week>s.week||
        p.preorderCampaign.cost!==CFG.tuning_engine.auditIdentities__040||p.preorderCampaign.paidDeposits!==0||p.preorderCampaign.kind!=='nonbinding-reader-interest'))||
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
    if(p.holdUntilWeek!==null&&(!Number.isInteger(p.holdUntilWeek)||p.holdUntilWeek<p.startWeek||p.holdUntilWeek>s.week+CFG.tuning_engine.auditIdentities__041||(p.status==='released'&&p.releaseWeek<p.holdUntilWeek)||p.route==='contract'))problems.push(p.id+': invalid launch hold');
    if(p.specialistId&&!s.specialists?.some(t=>t.id===p.specialistId&&t.assignedProjectId===p.id))problems.push(p.id+': invalid specialist assignment');
    if(p.specialistAppointments?.length>1||p.specialistAppointments?.some(a=>!s.specialists?.some(t=>t.id===a.specialistId)||!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||!Number.isFinite(a.fee)||a.fee<=0||!SPECIALIST_DISCIPLINES.includes(a.discipline)))problems.push(p.id+': invalid specialist contract history');
    if(!Array.isArray(p.editorialHistory)||typeof p.editorialHistoryComplete!=='boolean'||
      p.editorialHistory.some((h,i)=>!EDITORIAL_ACTIONS[h.kind]||!Number.isInteger(h.week)||h.week<p.startWeek||h.week>s.week||
        h.cost<=0||!Number.isFinite(h.cost)||!Number.isFinite(h.creativeQuality)||!Number.isFinite(h.technicalQuality)||
        h.creativeQuality<1||h.creativeQuality>CFG.tuning_engine.auditIdentities__042||h.technicalQuality<1||h.technicalQuality>CFG.tuning_engine.auditIdentities__043||
        p.editorialHistory.slice(0,i).some(r=>r.kind===h.kind)||p.sector!=='publishing'))
      problems.push(p.id+': invalid editorial activity history');
    if(!Array.isArray(p.creatorCredits)||p.creatorCredits.some(x=>!['team lead','editorial specialist','technical specialist','production specialist'].includes(x.role)||
       ![...s.employees,...(s.specialists||[])].some(e=>e.id===x.personId))||
       (p.status!=='released'&&p.creatorCredits.length>0))problems.push(p.id+': forged creator release credits');
    if(p.releasePlanHistory?.some(a=>!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||(a.targetWeek!==null&&(!Number.isInteger(a.targetWeek)||a.targetWeek<a.week||a.targetWeek>a.week+CFG.tuning_engine.auditIdentities__044))))problems.push(p.id+': invalid release planning history');
  }

  for(const p of s.projects){
    const c=company(s,p.companyId),used=new Set();
    if(p.status==='active'&&p.teamId&&c?.teams&&!c.teams.some(t=>t.id===p.teamId))problems.push(p.id+': active project has no owned team');
    for(const e of p.interventions||[]){
      if(!['revision','polish','scope'].includes(e.kind)||used.has(e.kind)||!Number.isInteger(e.week)||e.week<p.startWeek||e.week>s.week||
        !Number.isFinite(e.spend)||e.spend<0||!Number.isFinite(e.originalBudget)||e.originalBudget<=0||
        !Number.isFinite(e.newBudget)||e.newBudget<=0||!Number.isFinite(e.weeksTotal)||e.weeksTotal<=0||
        !Number.isFinite(e.creativeQuality)||e.creativeQuality<1||e.creativeQuality>CFG.tuning_engine.auditIdentities__045||
        !Number.isFinite(e.technicalQuality)||e.technicalQuality<1||e.technicalQuality>CFG.tuning_engine.auditIdentities__046||
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
    if(!ip||!note||typeof note.summary!=='string'||note.summary.length>CFG.tuning_engine.auditIdentities__047||!['strict','flexible'].includes(note.continuity)||(note.displayTitle!==undefined&&(typeof note.displayTitle!=='string'||note.displayTitle.length>CFG.tuning_engine.auditIdentities__048)))
      problems.push(ipId+': invalid optional Franchise Bible note');
  }
  for(const p of s.projects){
    if(p.leadCharacter!==undefined&&(typeof p.leadCharacter!=='string'||p.leadCharacter.length>CFG.tuning_engine.auditIdentities__049))problems.push(p.id+': invalid character history');
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
function audit(s){const problems=[];auditIdentities(s,problems);auditGovernance(s,problems);audit43A(s,problems);audit43B(s,problems);audit43C(s,problems);
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))problems.push('Invalid saved dashboard layout');
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')problems.push('Invalid skip interruption settings');
  if(!DEPTH_MODES.includes(s.settings?.depth))problems.push('Invalid depth mode');
  {const d=s.decisionCards;if(!d||!['year','cards','low','auto'].every(k=>Number.isInteger(d[k])&&d[k]>=0)||d.low>d.cards||d.year>yearAt(s.week))problems.push('Invalid decision card log');}
  for(const x of s.snapshots||[])if(x.historyComplete===true&&(!s.companies.some(c=>c.id===x.companyId)||!Number.isFinite(x.cash)||!Number.isFinite(x.revenue)||!Number.isFinite(x.expense)||!Number.isFinite(x.profit)||!Number.isFinite(x.annualRevenue)||!Number.isFinite(x.annualExpense)||!Number.isFinite(x.annualProfit)||Math.abs(money(x.annualRevenue-x.annualExpense-x.annualProfit))>EPS))problems.push('Invalid historical entity close snapshot');
  for(const r of REGIONS){const v=s.regionalEconomy?.[r.name];if(!v||!Number.isFinite(v.fxRate)||v.fxRate<r.baseFx*CFG.tuning_engine.audit__001||v.fxRate>r.baseFx*CFG.tuning_engine.audit__002||!Number.isFinite(v.wageIndex)||v.wageIndex<CFG.tuning_engine.audit__003||v.wageIndex>CFG.tuning_engine.audit__004||!Number.isFinite(v.interestIndex)||v.interestIndex<CFG.tuning_engine.audit__005||v.interestIndex>CFG.tuning_engine.audit__006)problems.push(r.name+': invalid regional macro indicators');}
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
    !Number.isFinite(s.coProductionPolicy.maxCommitment)||s.coProductionPolicy.maxCommitment<CFG.tuning_engine.audit__007||s.coProductionPolicy.maxCommitment>CFG.tuning_engine.audit__008||
    !Number.isFinite(s.coProductionPolicy.maxShare)||s.coProductionPolicy.maxShare<CFG.tuning_engine.audit__009||s.coProductionPolicy.maxShare>CFG.tuning_engine.audit__010)
    problems.push('Invalid delegated partner-financing authority');
  for(const o of s.coProductionOffers||[]){
    const p=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    const d=o.projectId?s.coProductions.find(d=>d.projectId===o.projectId):null;
    if(!company(s,o.producerId)||!company(s,o.sponsorId)||o.producerId===o.sponsorId||
      !SECTORS[o.sector]||!['original','adaptation'].includes(o.route)||
      !['counter','accepted','declined','booked'].includes(o.status)||
      !Number.isFinite(o.proposedShare)||o.proposedShare<CFG.tuning_engine.audit__011||o.proposedShare>CFG.tuning_engine.audit__012||
      !Number.isFinite(o.commitment)||o.commitment<=0||![CFG.tuning_engine.audit__013,CFG.tuning_engine.audit__014,CFG.tuning_engine.audit__015].includes(o.capitalFraction)||
      !Number.isInteger(o.createdWeek)||!Number.isInteger(o.expiresWeek)||o.expiresWeek!==o.createdWeek+CFG.tuning_engine.audit__016||
      o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
      (o.status==='counter'&&(!Number.isFinite(o.counterShare)||o.counterShare<=o.proposedShare))||
      (['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedShare)||o.acceptedShare<CFG.tuning_engine.audit__017||o.acceptedShare>CFG.tuning_engine.audit__018))||
      (o.creativeTermsComplete&&(!THEMES.includes(o.theme)||!TARGET_AUDIENCES.includes(o.targetAudience)||
       !CREATIVE_DIRECTIONS.includes(o.direction)||!MARKET_POSITIONINGS.includes(o.positioning)||
       (o.status==='booked'&&p?.creativeHistoryComplete&&Object.entries(pitchFrom(o)).some(([k,v])=>p.pitch?.[k]!==v))))||
      (o.status==='booked'&&(!p||!d||d.offerId!==o.id||o.updatedWeek>o.expiresWeek))||
      (o.status!=='booked'&&!!o.projectId))problems.push(o.id+': invalid negotiated co-production offer');
  }
  if(!s.commissionPolicy||typeof s.commissionPolicy.autoCounter!=='boolean'||
    !Number.isFinite(s.commissionPolicy.maxFee)||s.commissionPolicy.maxFee<CFG.tuning_engine.audit__019||s.commissionPolicy.maxFee>CFG.tuning_engine.audit__020||
    !Number.isFinite(s.commissionPolicy.minMargin)||s.commissionPolicy.minMargin<0||s.commissionPolicy.minMargin>CFG.tuning_engine.audit__021)
    problems.push('Invalid delegated commission authority');
  for(const o of s.commissionOffers||[]){
    const linked=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    if(!company(s,o.clientId)||!company(s,o.producerId)||o.clientId===o.producerId||!SECTORS[o.sector]||
       !['counter','accepted','declined','booked'].includes(o.status)||!Number.isFinite(o.proposedFee)||o.proposedFee<CFG.tuning_engine.audit__022||
       !Number.isFinite(o.baseCost)||o.baseCost<=0||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Number.isFinite(o.size)||o.size<CFG.tuning_engine.audit__023||o.size>CFG.tuning_engine.audit__024||typeof o.title!=='string'||!o.title||
       (o.status==='booked'&&(!linked||linked.escrowId===null||linked.companyId!==o.producerId||linked.clientId!==o.clientId||linked.earnedFee!==o.acceptedFee))||
       !Number.isInteger(o.updatedWeek)||o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
       (o.status==='counter'&&o.acceptedFee!==null)||
       (['accepted','booked'].includes(o.status)&&o.acceptedFee!==o.proposedFee&&o.acceptedFee!==o.counterFee)||
       (o.status!=='booked'&&o.projectId)||(['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedFee)||o.acceptedFee<CFG.tuning_engine.audit__025)))
      problems.push(o.id+': invalid client commission agreement');
  }
  for(const h of s.commissionHistory||[]){const p=s.projects.find(p=>p.id===h.projectId);
    if(!p||h.clientId!==p.clientId||h.producerId!==p.companyId||h.outcome!==(p.status==='cancelled'?'cancelled':'delivered')||
       !['released','cancelled'].includes(p.status)||h.week> s.week)problems.push(h.id+': invalid commission delivery history');
  }
  if(!s.rightsPolicy||typeof s.rightsPolicy.autoRenew!=='boolean' ||!Number.isFinite(s.rightsPolicy.maxFee)||s.rightsPolicy.maxFee<CFG.tuning_engine.audit__026||s.rightsPolicy.maxFee>CFG.tuning_engine.audit__027||![CFG.tuning_engine.audit__028,CFG.tuning_engine.audit__029].includes(s.rightsPolicy.extensionWeeks))problems.push('Invalid delegated rights authority');for(const c of [...s.companies,...s.backgroundFirms]){if(Math.abs(companyBalance(c))>EPS)problems.push(c.name+': balance discrepancy '+companyBalance(c));if(c.finance.deferred<-CFG.tuning_engine.audit__030||c.finance.payable<-CFG.tuning_engine.audit__031||(c.finance.prepaid||0)<-CFG.tuning_engine.audit__032||(c.finance.receivable||0)<-CFG.tuning_engine.audit__033)problems.push(c.name+': negative obligations or prepaid assets');if(c.teams&&c.teams.length!==c.capacity)problems.push(c.name+': team capacity mismatch');}
  for(const c of s.companies){
    for(const [sector,r] of Object.entries(c.research||{}))if(!SECTORS[sector]||!Number.isFinite(r.spent)||!(r.spent>=CFG.tuning_engine.audit__034||r.acquiredLevel>=1||r.transferredAway)||r.level!==Math.min(CFG.tuning_engine.audit__035,Math.max(Math.floor(r.spent/CFG.tuning_engine.audit__036),r.acquiredLevel||0))||r.wave<0||r.updatedWeek>s.week)problems.push(c.id+': invalid research portfolio');
    for(const [sector,r] of Object.entries(c.techLicenses||{}))if(!SECTORS[sector]||r.week>s.week||!Number.isInteger(r.wave)||r.wave<1||r.cost<CFG.tuning_engine.audit__037||!available(sector,r.week))problems.push(c.id+': invalid tool license');
  }
  // Group-accounting integrity; founders never inherit rival assets.
  for(const c of s.companies){
    if(c.parentId&&(!company(s,c.parentId)||c.parentId===c.id||company(s,c.parentId).parentId))problems.push(c.name+': illegal or missing parent company');
    const expected=money(s.companies.filter(child=>child.parentId===c.id).reduce((n,child)=>n+(child.investedCapital||0),0));
    if(Math.abs(expected-(c.finance.investment||0))>CFG.tuning_engine.audit__038)problems.push(c.name+': parent equity investment does not match subsidiary capital');
    if((c.finance.internalExpense||0)<-CFG.tuning_engine.audit__039||(c.finance.internalRevenue||0)<-CFG.tuning_engine.audit__040||(c.finance.internalExpense||0)>c.finance.expense+CFG.tuning_engine.audit__041||(c.finance.internalRevenue||0)>c.finance.revenue+CFG.tuning_engine.audit__042)problems.push(c.name+': invalid intragroup service totals');
  }
  if(s.companies.some(c=>c.parentId===s.playerId)){
    try{const group=consolidatedStatements(s);
      if(Math.abs(group.income.internalRevenueEliminated-group.income.internalExpenseEliminated)>CFG.tuning_engine.audit__043)problems.push('Group: internal service income does not equal internal service expense');
      if(Math.abs(group.balance.investmentEliminated-group.balance.subsidiaryCapitalEliminated)>CFG.tuning_engine.audit__044)problems.push('Group: parent share capital elimination does not reconcile');
      if(Math.abs(group.balance.difference)>CFG.tuning_engine.audit__045)problems.push('Group: consolidated balance does not reconcile');
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
      Number.isFinite(b.returnFraction)&&b.returnFraction>=0&&b.returnFraction<CFG.tuning_engine.ok__001&&
      Number.isFinite(b.demandEwma)&&b.demandEwma>=0&&
      Math.abs(money(b.printSpend-b.printed*b.unitCost))<EPS&&
      Math.abs(money(b.cogs-(b.sold-b.returned)*b.unitCost))<EPS&&
      Math.abs(money((b.writeOffCost||0)-b.writtenOff*b.unitCost))<EPS;
    if(!ok)problems.push(p.id+': printed copy register inconsistent');
    physicalByCompany.set(p.companyId,money((physicalByCompany.get(p.companyId)||0)+b.stock*b.unitCost));
  }
  for(const c of s.companies){
    if((c.finance.inventory||0)<-CFG.tuning_engine.audit__046||Math.abs(money(c.finance.inventory||0)-(physicalByCompany.get(c.id)||0))>EPS)
      problems.push(c.name+': inventory asset not backed by physical stock');
  }
  for(const r of s.remittances)if(r.amount<=0||!Number.isFinite(r.amount)||!Number.isInteger(r.dueWeek)||r.dueWeek<=s.week)problems.push(r.id+': invalid pending distribution receipt');
  for(const c of [...s.companies,...s.backgroundFirms]){
    const pending=money(s.remittances.reduce((total,r)=>total+(r.companyId===c.id?r.amount:0),0));
    if(Math.abs(pending-(c.finance.receivable||0))>CFG.tuning_engine.audit__047)problems.push(c.name+': receivable unsupported by distributor remittance');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.overheadAttributed||0)<-CFG.tuning_engine.audit__048||(c.finance.overheadBooked||0)<(c.finance.overheadAttributed||0)-CFG.tuning_engine.audit__049)problems.push(c.name+': over-attributed company overhead');
  for(const p of s.projects)if((p.overheadAttributed||0)<-CFG.tuning_engine.audit__050)problems.push(p.id+': negative overhead allocation');
  for(const p of s.projects)if(!Number.isFinite(p.budgetMultiplier)||p.budgetMultiplier<CFG.tuning_engine.audit__051||p.budgetMultiplier>CFG.tuning_engine.audit__052||Math.abs((p.plannedTotal||0)-money(p.budget+p.marketingBudget+(p.interventions||[]).filter(e=>e.kind==='scope').reduce((n,e)=>n+e.originalBudget-e.newBudget,0)))>CFG.tuning_engine.audit__053||(p.productionSpend!==null&&(!Number.isFinite(p.productionSpend)||p.productionSpend<0||p.productionSpend>p.directCost+EPS)))problems.push(p.id+': invalid production budget plan');
  for(const c of s.companies){const allocated=money(s.projects.filter(p=>p.companyId===c.id).reduce((sum,p)=>sum+(p.overheadAttributed||0),0));if(Math.abs(allocated-(c.finance.overheadAttributed||0))>CFG.tuning_engine.audit__054)problems.push(c.name+': project overhead does not reconcile');}
  for(const p of s.projects){if(p.startWeek<(SECTORS[p.sector].year-1)*CFG.tuning_engine.audit__055)problems.push(p.title+': before debut');if(p.status==='active'&&p.weeksDone>p.weeksTotal+CFG.tuning_engine.audit__056)problems.push(p.title+': overworked');if(p.status==='active'&&p.teamId&&(!company(s,p.companyId)?.teams||!company(s,p.companyId).teams.some(t=>t.id===p.teamId)))problems.push(p.title+': missing team');}
  const activeTeams=new Set();for(const p of s.projects.filter(p=>p.status==='active'&&p.teamId)){if(activeTeams.has(p.teamId))problems.push(p.title+': team double-booked');activeTeams.add(p.teamId);}
  for(const d of s.coProductions||[])if(d.status==='active'){if(activeTeams.has(d.partnerTeamId))problems.push(d.id+': sponsor team double-booked');activeTeams.add(d.partnerTeamId);}
  for(const e of s.escrows||[]){if(e.fee<0||e.held<0||e.held>e.fee||!company(s,e.buyerId)||!company(s,e.sellerId))problems.push(e.id+': invalid funded escrow');if(e.settled&&e.held!==0)problems.push(e.id+': delivery escrow not cleared');if(!e.settled&&Math.abs(e.held+e.advance+(e.milestonePaid||0)-e.fee)>CFG.tuning_engine.audit__057)problems.push(e.id+': escrow funding discrepancy');
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
       ![p.creativeQuality,p.technicalQuality,p.quality].every(x=>Number.isFinite(x)&&x>=1&&x<=CFG.tuning_engine.audit__058)))
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
      d.sector!==p.sector||owner.id===sponsor.id||!validInheritedCoProduction(s,d)||!sponsor.capabilities[d.sector]||
      !sponsor.teams?.some(t=>t.id===d.partnerTeamId)||
      !['active','released','cancelled'].includes(d.status)||d.status!==p.status&&!(p.status==='released'&&d.status==='released')||
      !amounts.every(k=>Number.isFinite(d[k])&&d[k]>=0)||
      ![CFG.tuning_engine.audit__059,CFG.tuning_engine.audit__060,CFG.tuning_engine.audit__061].includes(d.capitalFraction)||
      (d.offerId?!s.coProductionOffers.some(o=>o.id===d.offerId&&o.status==='booked'&&o.projectId===p.id&&o.producerId===d.producerId&&o.sponsorId===d.sponsorId&&o.commitment===d.commitment&&o.acceptedShare===d.revenueShare):Math.abs(d.revenueShare-money(d.capitalFraction*CFG.tuning_engine.audit__062))>CFG.tuning_engine.audit__063)||
      Math.abs(d.commitment-money(p.plannedTotal*d.capitalFraction))>CFG.tuning_engine.audit__064||
      Math.abs(d.commitment-money(d.held+d.spent+d.refunded))>CFG.tuning_engine.audit__065||
      Math.abs((p.partnerSpend||0)-d.spent)>CFG.tuning_engine.audit__066||
      d.sharePaid>d.shareAccrued+CFG.tuning_engine.audit__067||Math.abs((p.partnerShareCost||0)-d.shareAccrued)>CFG.tuning_engine.audit__068||
      (p.status==='active'&&(d.status!=='active'||d.closedWeek!==null))||
      (p.status!=='active'&&(d.held!==0||d.closedWeek===null)))
      problems.push(d.id+': co-production agreement/ownership/escrow audit failed');
  }
  for(const p of s.projects){
    if(p.coProductionId&&!s.coProductions.some(d=>d.id===p.coProductionId))problems.push(p.id+': missing sponsoring agreement');
    if(p.sponsoredSectorEntry){const d=s.coProductions.find(d=>d.id===p.coProductionId);
      const sponsor=company(s,p.sectorEntrySponsorId);
      if(!d||d.sponsorId!==p.sectorEntrySponsorId||!sponsor||!sponsor.capabilities[p.sector]||
         d.sector!==p.sector||d.signedWeek<((SECTORS[p.sector]?.year||CFG.tuning_engine.audit__069)-1)*CFG.tuning_engine.audit__070)
        problems.push(p.id+': missing or unauthorized specialist industry-entry partner');
    }
  }
  for(const c of s.companies){
    const unearned=(s.escrows||[]).filter(e=>e.buyerId===c.id&&!e.settled).reduce((total,e)=>total+e.fee,0);
    const sponsored=(s.coProductions||[]).filter(d=>d.sponsorId===c.id).reduce((total,d)=>total+d.held,0)+(s.gamePublisherDeals43||[]).filter(d=>d.publisherId===c.id&&d.status==="active").reduce((total,d)=>total+d.advance,0);
    if(Math.abs((c.finance.prepaid||0)-money(unearned+sponsored))>CFG.tuning_engine.audit__071)problems.push(c.name+': reserved client/partner capital does not reconcile with prepaid assets');
    const partnerDue=money((s.coProductions||[]).filter(d=>d.producerId===c.id).reduce((n,d)=>n+d.shareAccrued-d.sharePaid,0));
    if(partnerDue>c.finance.payable+CFG.tuning_engine.audit__072)problems.push(c.name+': partner profit participation exceeds accrued liabilities');
  }
  // Legal rights checks operate on the single persistent grant register. They
  // validate history too: a stale overlapping exclusive contract is not cured
  // merely because both grants have expired by the audit date.
  const bySourceMedium=new Map();
  for(const g of s.grants){
    const ip=s.ips.find(x=>x.id===g.ipId),grantor=company(s,g.grantorId),holder=company(s,g.holderId);
    const key=g.ipId+':'+g.media;
    if(!ip||!grantor||!holder||!validGrantor43(s,g,ip)||g.grantorId===g.holderId)
      problems.push(g.id+': rights grantor must own source IP and parties must differ');
    if(!SECTORS[g.media]||!['option','license'].includes(g.type)||!Number.isInteger(g.startWeek)||!Number.isInteger(g.endWeek)||g.startWeek<0||g.endWeek<=g.startWeek||
      !Number.isFinite(g.royaltyRate)||g.royaltyRate<0||g.royaltyRate>1||!Number.isFinite(g.recoupableAdvance)||g.recoupableAdvance<0||g.recoupableAdvance>(g.fee||0)+EPS||!Number.isInteger(g.continuationWeeks)||g.continuationWeeks<0)
      problems.push(g.id+': invalid rights interval or contract terms');
    if(g.type==='option'&&g.allowsProduction)problems.push(g.id+': unexercised option cannot authorize production');
    if((g.renewalAutoAttemptedEnd!==undefined&&(!Number.isInteger(g.renewalAutoAttemptedEnd)||g.renewalAutoAttemptedEnd<s.week-CFG.tuning_engine.audit__073||g.renewalAutoAttemptedEnd>g.endWeek))||
       !Number.isFinite(g.exerciseFee)||g.exerciseFee<0||g.exerciseFeePaid<0||
       (g.type==='option'&&g.exercisedWeek!==null)||
       (g.type==='option'&&g.optionExpiresWeek!==g.endWeek)||
       (g.type==='license'&&g.exercisedWeek!==null&&(!Number.isInteger(g.exercisedWeek)||g.exercisedWeek<0||g.exercisedWeek>s.week||g.exerciseFeePaid!==g.exerciseFee))||
       typeof g.approvalRequired!=='boolean'||!Array.isArray(g.renewalHistory))
       problems.push(g.id+': invalid grant option exercise history or approval terms');
    if(g.type==='license'&&(!g.allowsProduction||!available(g.media,g.startWeek)))
      problems.push(g.id+': rights license cannot authorize production before global debut');
    const others=bySourceMedium.get(key)||[];
    for(const other of others)if(rightsConflict43(s,g,other))
      problems.push(g.id+': exclusive rights interval overlap with '+other.id);
    others.push(g);bySourceMedium.set(key,others);
  }
  for(const offer of s.rightsOffers||[]){
    const g=s.grants.find(g=>g.id===offer.grantId),ip=s.ips.find(i=>i.id===offer.ipId);
    if(!['option','renewal'].includes(offer.kind)||!['counter','accepted','declined'].includes(offer.status)||
      !ip||!(g?validGrantor43(s,g,ip):ip.ownerId===offer.grantorId)||!company(s,offer.holderId)||offer.holderId===offer.grantorId||
      !SECTORS[offer.media]||!Number.isInteger(offer.createdWeek)||offer.createdWeek>s.week||
      !offer.proposal||!Number.isFinite(offer.proposal.fee)||offer.proposal.fee<CFG.tuning_engine.audit__074||
      offer.status==='counter'&&!offer.counter||offer.status==='accepted'&&(!g||g.ipId!==offer.ipId||g.grantorId!==offer.grantorId||g.holderId!==offer.holderId||g.media!==offer.media))
      problems.push(offer.id+': invalid bilateral rights offer record');
  }
  for(const g of s.grants||[])if(g.manuscriptId&&(
    !Number.isFinite(g.agentRate)||g.agentRate<0||g.agentRate>CFG.tuning_engine.audit__075||!Number.isFinite(g.agentFeesPaid)||g.agentFeesPaid<0||
    g.agentFeesPaid>money((s.royaltyAccounts||[]).filter(a=>a.grantId===g.id).reduce((n,a)=>n+a.paid,0)*g.agentRate)+CFG.tuning_engine.audit__076))
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
    if(Math.abs(register.reconciliation.payableDifference)>EPS||register.totals.allLiabilities<-CFG.tuning_engine.audit__077)problems.push(c.name+': active payable obligation register fails financial reconciliation');
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
      !numeric.every(k=>Number.isFinite(a[k])&&a[k]>=-CFG.tuning_engine.audit__078)||
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
    const valid=Number.isFinite(loan.originalPrincipal)&&loan.originalPrincipal>=CFG.tuning_engine.valid__001&&Number.isFinite(loan.principalOutstanding)&&loan.principalOutstanding>=0&&Number.isFinite(loan.principalPaid)&&loan.principalPaid>=0&&Math.abs(loan.originalPrincipal-loan.principalOutstanding-loan.principalPaid)<EPS&&Number.isFinite(loan.interestArrears)&&loan.interestArrears>=0&&Number.isFinite(loan.principalArrears)&&loan.principalArrears>=0&&loan.principalArrears<=loan.principalOutstanding+EPS&&Number.isInteger(loan.installmentsDue)&&loan.installmentsDue>=0&&loan.installmentsDue<=CFG.tuning_engine.valid__002&&loan.createdWeek<=s.week&&Number.isFinite(loan.interestRate)&&loan.interestRate>=0&&loan.interestRate<=CFG.tuning_engine.valid__003&&Number.isFinite(loan.interestCharged)&&Number.isFinite(loan.interestPaid)&&loan.interestPaid>=0&&Math.abs(loan.interestCharged-loan.interestPaid-loan.interestArrears)<EPS&&Number.isInteger(loan.missedPeriods)&&loan.missedPeriods>=0&&['current','delinquent','paid'].includes(loan.status)&&((loan.status==='paid'&&loan.principalOutstanding===0&&loan.interestArrears===0)||(loan.status==='delinquent'&&(loan.principalArrears>0||loan.interestArrears>0))||(loan.status==='current'&&loan.principalOutstanding>0&&loan.principalArrears===0&&loan.interestArrears===0));
    if(!valid)problems.push(loan.id+': invalid loan servicing or balance');
  }
  for(const c of s.companies){
    const contracts=(s.loans||[]).filter(l=>l.debtorId===c.id);
    if(Math.abs(contracts.reduce((v,l)=>v+l.principalOutstanding,0)-(c.finance.loanBalance||0))>EPS)problems.push(c.name+': loan liability is not backed by active bank debt');
    if(Math.abs(contracts.reduce((v,l)=>v+l.interestArrears,0)-(c.finance.interestPayable||0))>EPS)problems.push(c.name+': accrued interest does not match bank debt');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.taxPayable||0)<-CFG.tuning_engine.audit__079||(c.finance.interestPayable||0)<-CFG.tuning_engine.audit__080||(c.finance.loanBalance||0)<-CFG.tuning_engine.audit__081||(c.finance.taxPayable||0)+(c.finance.interestPayable||0)+outstandingRoyaltyDebt(s,c.id)>c.finance.payable+CFG.tuning_engine.audit__082)problems.push(c.name+': statutory/royalty obligations exceed payable liability');
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.creditCarry||0)<-CFG.tuning_engine.audit__083||(c.finance.periodCreditEarned||0)<-CFG.tuning_engine.audit__084)problems.push(c.name+': invalid tax credit balance');
  for(const c of s.companies)if(outstandingRoyaltyDebt(s,c.id)>c.finance.payable+CFG.tuning_engine.audit__085)problems.push(c.name+': royalty debt exceeds payable liability');
  for(const c of s.companies)problems.push(...closedSettlementAudit(s,c.id));
  for(const p of s.projects)if(p.budgetCloseComplete===true&&(!Number.isFinite(p.periodProductionSpend)||p.periodProductionSpend<-CFG.tuning_engine.audit__086||p.periodProductionSpend>p.productionSpend+EPS))
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
  for(const c of s.companies)if(c.filmBacklot){const b=c.filmBacklot;if(!Number.isInteger(b.builtWeek)||b.builtWeek>s.week||b.cost!==CFG.tuning_engine.audit__087||b.monthlyCost!==CFG.tuning_engine.audit__088||!Number.isFinite(b.totalUpkeep)||b.totalUpkeep<0)problems.push(c.id+': invalid in-house film facility');
    if(s.projects.filter(p=>p.status==='active'&&p.companyId===c.id&&p.cinema?.facilities==='owned').length>1)problems.push(c.id+': owned film studio double-booked');}
  const activeCast=new Set();
  for(const p of s.projects.filter(p=>p.sector==='movie')){
    const f=p.cinema;
    if(!f||!FILM_METHODS.includes(f.method)||!['G','T','M'].includes(f.rating)||!FILM_DISTRIBUTION.includes(f.distribution)||
      !Array.isArray(f.actions)||!Array.isArray(f.screenings)||!Array.isArray(f.weeklyBoxOffice)||
      f.weeklyBoxOffice.some(x=>!Number.isInteger(x.week)||x.week<p.releaseWeek&&p.releaseWeek!==null||x.week>s.week||
        !REGIONS.some(r=>r.name===x.region)||!Number.isFinite(x.gross)||x.gross<0||!Number.isInteger(x.estimatedAdmissions)||x.estimatedAdmissions<0)||!Array.isArray(f.auditions)||!Array.isArray(f.disruptions)||
      f.disruptions.some(d=>!Number.isInteger(d.week)||d.week<p.startWeek||d.week>s.week||!Number.isFinite(d.cost)||d.cost<0||d.delay!==CFG.tuning_engine.audit__089)||!Number.isFinite(f.castPaid)||f.castPaid<0||
      !Number.isFinite(f.castShare)||f.castShare<0||f.castShare>CFG.tuning_engine.audit__090||!Number.isFinite(f.castFee)||f.castFee<0||
      Object.values(f.boxOffice||{}).some(n=>!Number.isFinite(n)||n<0)||
      Object.values(f.admissions||{}).some(n=>!Number.isInteger(n)||n<0)||
      Object.values(f.channels||{}).some(n=>!Number.isFinite(n)||n<0)||
      money(Object.values(f.boxOffice||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+CFG.tuning_engine.audit__091||
      money(Object.values(f.channels||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+CFG.tuning_engine.audit__092)
      problems.push(p.id+': invalid film production/box office records');
    if(f?.facilities==='owned'&&!company(s,p.companyId)?.filmBacklot)problems.push(p.id+': unowned production facility');
    if(f?.premiere&&(!REGIONS.some(r=>r.name===f.premiere.region)||f.premiere.week> s.week||f.premiere.week<p.startWeek||f.premiere.cost!==CFG.tuning_engine.audit__093))problems.push(p.id+': invalid film premiere');
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
  migrate43(s,oldVersion);
  if(s&&oldVersion>=1&&oldVersion<CFG.tuning_engine.loadState__001)initialGovernance(s);
  if([1,CFG.tuning_engine.loadState__002,CFG.tuning_engine.loadState__003,CFG.tuning_engine.loadState__004,CFG.tuning_engine.loadState__005,CFG.tuning_engine.loadState__006,CFG.tuning_engine.loadState__007,CFG.tuning_engine.loadState__008,CFG.tuning_engine.loadState__009,CFG.tuning_engine.loadState__010,CFG.tuning_engine.loadState__011,CFG.tuning_engine.loadState__012].includes(oldVersion)){
    s.rightsOffers=[];s.creativeApprovals=[];s.rightsPolicy={autoRenew:false,maxFee:CFG.tuning_engine.loadState__013,extensionWeeks:CFG.tuning_engine.loadState__014};
    for(const g of s.grants||[]){
      g.exerciseFee=CFG.tuning_engine.loadState__015;g.exerciseFeePaid=0;g.optionExpiresWeek=g.type==='option'?g.endWeek:null;
      g.exercisedWeek=null;g.approvalRequired=false;g.renewalHistory=[];
    }
  }
  if([1,CFG.tuning_engine.loadState__016,CFG.tuning_engine.loadState__017,CFG.tuning_engine.loadState__018,CFG.tuning_engine.loadState__019,CFG.tuning_engine.loadState__020,CFG.tuning_engine.loadState__021,CFG.tuning_engine.loadState__022,CFG.tuning_engine.loadState__023,CFG.tuning_engine.loadState__024,CFG.tuning_engine.loadState__025].includes(oldVersion)){
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
  if([1,CFG.tuning_engine.loadState__026,CFG.tuning_engine.loadState__027,CFG.tuning_engine.loadState__028,CFG.tuning_engine.loadState__029,CFG.tuning_engine.loadState__030,CFG.tuning_engine.loadState__031,CFG.tuning_engine.loadState__032,CFG.tuning_engine.loadState__033,CFG.tuning_engine.loadState__034].includes(oldVersion)){
    // The old bounded journal cannot prove duty allocation for an in-flight
    // month. No historic amounts or balances are invented during migration.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      c.finance.periodDuty=emptyDutyFlows();c.finance.periodDutyOpening={tax:0,royalty:0,interest:0};
      c.finance.periodDutyComplete=false;
      if(!c.homeRegion)c.homeRegion=REGIONS[0].name;
    }
  }
  if([1,CFG.tuning_engine.loadState__035,CFG.tuning_engine.loadState__036,CFG.tuning_engine.loadState__037,CFG.tuning_engine.loadState__038,CFG.tuning_engine.loadState__039,CFG.tuning_engine.loadState__040,CFG.tuning_engine.loadState__041].includes(oldVersion)){
    // Existing current-month activity predates transaction cash classification.
    // Carry the exact balance, mark ONLY the first closing incomplete, and
// start a complete period from the next monthly boundary.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      resetPeriodBridge(c.finance);c.finance.periodHistoryComplete=false;
    }
  }
  if([1,CFG.tuning_engine.loadState__042,CFG.tuning_engine.loadState__043,CFG.tuning_engine.loadState__044,CFG.tuning_engine.loadState__045,CFG.tuning_engine.loadState__046].includes(oldVersion)){
    s.loans=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.loanBalance=0;c.finance.interestPayable=0;}
  }
  if([1,CFG.tuning_engine.loadState__047,CFG.tuning_engine.loadState__048,CFG.tuning_engine.loadState__049,CFG.tuning_engine.loadState__050].includes(oldVersion)){
    for(const c of s.companies||[]){c.parentId=null;c.investedCapital=0;}
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.investment=0;c.finance.internalRevenue=0;c.finance.internalExpense=0;}
  }
  if([1,CFG.tuning_engine.loadState__051,CFG.tuning_engine.loadState__052,CFG.tuning_engine.loadState__053].includes(oldVersion)){
    // No fabricated retroactive allocations or rights income: earlier records
    // remain complete for their own cash/direct result, not the new breakdown.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.overheadBooked=0;c.finance.overheadAttributed=0;}
    for(const p of s.projects||[]){p.overheadAttributed=0;p.overheadHistoryComplete=false;}
    for(const ip of s.ips||[]){ip.rightsIncome=0;ip.rightsHistoryComplete=false;}
  }
  if([1,CFG.tuning_engine.loadState__054,CFG.tuning_engine.loadState__055].includes(oldVersion)){
    // Legacy sales already arrived in cash, and must NOT be re-invoiced.
    s.remittances=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance)c.finance.receivable=0;
  }
  if([1,CFG.tuning_engine.loadState__056,CFG.tuning_engine.loadState__057,CFG.tuning_engine.loadState__058,CFG.tuning_engine.loadState__059,CFG.tuning_engine.loadState__060,CFG.tuning_engine.loadState__061,CFG.tuning_engine.loadState__062].includes(oldVersion)){
    // Old works had no print register; NEVER create a fictitious asset or
    // retroactively cap sales of a title already published under the old model.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      if(!Number.isFinite(c.finance.inventory))c.finance.inventory=0;
      if(c.finance.periodOpening&&!Number.isFinite(c.finance.periodOpening.inventory))c.finance.periodOpening.inventory=0;
    }
    for(const r of s.reports||[])if(r.balance&&!Number.isFinite(r.balance.inventory))r.balance.inventory=0;
    for(const p of s.projects||[])if(!('printStock' in p))p.printStock=null;
  }
  if([1,CFG.tuning_engine.loadState__063,CFG.tuning_engine.loadState__064,CFG.tuning_engine.loadState__065,CFG.tuning_engine.loadState__066,CFG.tuning_engine.loadState__067,CFG.tuning_engine.loadState__068,CFG.tuning_engine.loadState__069,CFG.tuning_engine.loadState__070].includes(oldVersion))for(const p of s.projects||[])if(p.printStock){
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
    if(!Number.isInteger(s.settings.aiCount)||s.settings.aiCount<1||s.settings.aiCount>CFG.tuning_engine.loadState__071)s.settings.aiCount=DEFAULT_RIVAL_COUNTS[s.startedYear]||CFG.tuning_engine.loadState__072;
    if(!POPULATION_SCALES.includes(s.settings.populationScale))s.settings.populationScale=1;
    if(![CFG.tuning_engine.loadState__073,CFG.tuning_engine.loadState__074,CFG.tuning_engine.loadState__075].includes(s.settings.regionCount))s.settings.regionCount=CFG.tuning_engine.loadState__076;
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
  if(oldVersion<CFG.tuning_engine.loadState__077&&Array.isArray(s.projects))for(const p of s.projects){
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
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee))s.talentPolicy={autoBook:false,maxFee:CFG.tuning_engine.loadState__078};
  seedSpecialists(s);
  for(const x of s.specialists)if(x.assignedProjectId===undefined)x.assignedProjectId=null;
  for(const p of s.projects||[]){if(p.holdUntilWeek===undefined)p.holdUntilWeek=null;if(!Array.isArray(p.releasePlanHistory))p.releasePlanHistory=[];if(p.specialistId===undefined)p.specialistId=null;if(!Array.isArray(p.specialistAppointments))p.specialistAppointments=[];}
  if(!s.franchiseNotes||typeof s.franchiseNotes!=='object')s.franchiseNotes={};
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))s.dashboardFocus='operations';
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')s.pausePolicy={stopForAdvisory:false};
  for(const c of s.companies||[]){if(!('annualBaseline' in c))c.annualBaseline=null;for(const t of c.teams||[]){if(!Array.isArray(t.trainingHistory))t.trainingHistory=[];if(!Array.isArray(t.performanceHistory))t.performanceHistory=[];}}
  // A pre-team v1/v2 save has no existing employee roster. Do not keep
  // orphaned modern leader IDs from a synthetic old-save fixture.
  if(oldVersion<=CFG.tuning_engine.loadState__079&&s.companies.some(c=>!Array.isArray(c.teams)))s.employees=[];
  if(!Array.isArray(s.employees))s.employees=[];if(!Array.isArray(s.candidates))s.candidates=[];
  for(const c of s.companies||[]){
    if(!CULTURES.includes(c.culture))c.culture='balanced';
    if(!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean')c.staffPolicy={autoFill:true,maxSalary:CFG.tuning_engine.loadState__080};
    if(!Array.isArray(c.imprints))c.imprints=[];
    for(const t of c.teams||[])if(!t.leaderId){assignInitialLeader(s,c,t,true);}
  }
  if(oldVersion<CFG.tuning_engine.loadState__081)seedCandidates(s,CFG.tuning_engine.loadState__082);
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
  if(oldVersion<CFG.tuning_engine.loadState__083){
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
    if(oldVersion<CFG.tuning_engine.loadState__084){p.salesUnitsByAudience={};p.audienceUnitHistoryComplete=false;}
    else {if(!p.salesUnitsByAudience)p.salesUnitsByAudience={};if(typeof p.audienceUnitHistoryComplete!=='boolean')p.audienceUnitHistoryComplete=false;}
    if(!Array.isArray(p.publishingUnitHistory))p.publishingUnitHistory=[];
    if(typeof p.publishingUnitHistoryComplete!=='boolean')p.publishingUnitHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__085;
    if(!Number.isFinite(p.serialReaderMomentum))p.serialReaderMomentum=1;
    if(!Array.isArray(p.serialEngagementHistory))p.serialEngagementHistory=[];
    if(!Array.isArray(p.serialArcDecisions))p.serialArcDecisions=[];
    if(!Array.isArray(p.publishingFormatHistory))p.publishingFormatHistory=[];if(!Array.isArray(p.translations))p.translations=[];
    if(!('preorderCampaign' in p))p.preorderCampaign=null;if(!('imprintId' in p))p.imprintId=null;
    if(typeof p.publishingSalesHistoryComplete!=='boolean')p.publishingSalesHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__086;
  }
  if(!Array.isArray(s.creatorScouting))s.creatorScouting=[];
  for(const t of s.specialists||[]){if(t.creatorRole===undefined)t.creatorRole=null;if(!Array.isArray(t.mentorshipHistory))t.mentorshipHistory=[];}
  if(!Array.isArray(s.creativeAwards))s.creativeAwards=[];
  if(!Array.isArray(s.creatorRelations))s.creatorRelations=[];
  if(typeof s.creatorHistoryComplete!=='boolean')s.creatorHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__087;
  for(const p of s.projects||[]){
    if(!Array.isArray(p.editorialHistory))p.editorialHistory=[];
    if(typeof p.editorialHistoryComplete!=='boolean')p.editorialHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__088;
    if(!Array.isArray(p.creatorCredits))p.creatorCredits=[];
  }
  if(oldVersion<CFG.tuning_engine.loadState__089)for(const p of s.projects||[]){if(!('franchiseBranch' in p))p.franchiseBranch=null;if(!('franchiseHistoryComplete' in p))p.franchiseHistoryComplete=false;if(!('leadCharacter' in p))p.leadCharacter='';}
  if(!Array.isArray(s.coProductions))s.coProductions=[];
  if(!Array.isArray(s.coProductionOffers))s.coProductionOffers=[];
  if(!s.coProductionPolicy)s.coProductionPolicy={autoCounter:false,maxCommitment:CFG.tuning_engine.loadState__090,maxShare:CFG.tuning_engine.loadState__091};
  for(const d of s.coProductions)if(!('offerId' in d))d.offerId=null;
  if(!Array.isArray(s.commissionOffers))s.commissionOffers=[];
  if(!Array.isArray(s.commissionHistory))s.commissionHistory=[];
  if(!s.commissionPolicy)s.commissionPolicy={autoCounter:false,maxFee:CFG.tuning_engine.loadState__092,minMargin:CFG.tuning_engine.loadState__093};
  // v35: pre-depth saves become the default depth (old saves were test-only; owner decision 2026-11-18).
  if(s.settings&&!DEPTH_MODES.includes(s.settings.depth)&&s.pausePolicy&&s.talentPolicy&&s.rightsPolicy)setDepth(s,CFG.depth.DEFAULT);
  // v36: yearly Inbox decision-card log (depth modes D3); older saves start an empty log for the current year.
  if(!s.decisionCards&&Number.isInteger(s.week))s.decisionCards={year:yearAt(s.week),cards:0,low:0,auto:0};
  if(!s.regionalEconomy)s.regionalEconomy=Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:CFG.tuning_engine.loadState__094,employment:1}]));
  for(const r of REGIONS){
    if(!s.regionalEconomy[r.name])s.regionalEconomy[r.name]={confidence:1,inflation:CFG.tuning_engine.loadState__095,employment:1};
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
  if(s&&(s.version===1||s.version===CFG.tuning_engine.loadState__096)&&Array.isArray(s.projects)){
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
  if(oldVersion>=1&&oldVersion<CFG.tuning_engine.loadState__097)s.version=SAVE_VERSION;
  if(!s||s.version!==SAVE_VERSION||!Array.isArray(s.companies)||!Array.isArray(s.backgroundFirms)||!Array.isArray(s.remittances)||!Array.isArray(s.loans)||!Array.isArray(s.projects)||!Array.isArray(s.ips)||!Array.isArray(s.grants)||!Array.isArray(s.commissionOffers)||!Array.isArray(s.commissionHistory)||!Array.isArray(s.coProductions)||!Array.isArray(s.coProductionOffers)||!Array.isArray(s.rightsOffers)||!Array.isArray(s.creativeApprovals)||!Array.isArray(s.ledger)||!Array.isArray(s.obligations)||!Array.isArray(s.royaltyAccounts)||!Array.isArray(s.escrows)||!Array.isArray(s.news)||!Array.isArray(s.inbox)||!Array.isArray(s.works)||!Array.isArray(s.reports)||!Number.isInteger(s.week)||!s.companies.some(c=>c.id===s.playerId)||![...s.companies,...s.backgroundFirms].every(c=>c.finance&&Number.isFinite(c.finance.cash)&&Number.isFinite(c.finance.prepaid)&&Number.isFinite(c.finance.receivable)&&Number.isFinite(c.finance.equity))||!Number.isInteger(s.rng))throw new Error('This is not a supported Studio Syndicate prototype save.');
  if(audit(s).length)throw new Error('Save integrity check failed: '+audit(s)[0]);return s;}


// UPDATE 38 — Optional cinema management. No scene-by-scene minigame.
// All decisions are paid and rights-preserving; sales share the global finite wallet.
const FILM_DISTRIBUTION=Object.freeze(CFG.film.FILM_DISTRIBUTION);
const FILM_METHODS=Object.freeze(CFG.film.FILM_METHODS);
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
 if(!s.filmActors.length){const names=CFG.film.FILM_ACTOR_NAMES;
  for(let i=0;i<names.length;i++){const skill=CFG.tuning_engine.skill__003+hash(s.seed+':filmstar:'+i)%CFG.tuning_engine.skill__004;
   s.filmActors.push({id:id(s,'actor'),name:names[i],skill,genreSpecialty:GENRES[hash(s.seed+':filmactor:genre:'+i)%GENRES.length],fee:money(CFG.tuning_engine.filmActorPool__001+(skill-CFG.tuning_engine.filmActorPool__002)*CFG.tuning_engine.filmActorPool__003),busyProjectId:null,firstWeek:s.week,credits:[]});}}
 return s.filmActors.map(a=>({...a,available:!a.busyProjectId}));
}
function filmRequire(s,projectId,active=true){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='movie'||!c||!controlledCompanies(s).some(x=>x.id===c.id)||active&&p.status!=='active')throw new Error('Select a controllable active movie production.');
 if(!p.cinema)p.cinema=filmDefault(p);return {p,c};
}
function filmCost(s,p,c,cost,action){
 cost=money(cost);
 if(c.finance.cash<cost+CFG.tuning_engine.filmCost__001)throw new Error('Insufficient cash for film decision and payroll buffer.');
 expense(s,c,cost,'film-'+action,'Cinema decision: '+action+' for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.cinema.actions.push({week:s.week,action,cost});return cost;
}
function filmAudition(s,projectId,actorId){
 const {p,c}=filmRequire(s,projectId);if(p.cinema.castActorId)throw new Error('Lead already contracted; audition window closed.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));
 if(!a||a.busyProjectId)throw new Error('Actor not available for audition.');
 if(p.cinema.auditions.some(x=>x.actorId===a.id)||p.cinema.auditions.length>=CFG.tuning_engine.filmAudition__001)throw new Error('Actor already evaluated or audition budget limit reached.');
 const cost=filmCost(s,p,c,CFG.tuning_engine.cost__012,'audition');
 const score=Math.round(clamp(a.skill*CFG.tuning_engine.score__001+(a.genreSpecialty===p.genre?CFG.tuning_engine.score__002:0)+(hash(s.seed+':audition:'+p.id+':'+a.id)%CFG.tuning_engine.score__003)-CFG.tuning_engine.score__004,1,CFG.tuning_engine.score__005));
 const row={actorId:a.id,week:s.week,estimate:score,cost};p.cinema.auditions.push(row);return row;
}
function filmChooseCast(s,projectId,actorId){
 const {p,c}=filmRequire(s,projectId);if(p.cinema.castActorId)throw new Error('Film already has a contracted lead actor.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));
 if(!a||a.busyProjectId)throw new Error('Actor unavailable due to an exclusive production schedule.');
 const fee=filmCost(s,p,c,a.fee,'casting');a.busyProjectId=p.id;
 a.credits.push({projectId:p.id,week:s.week});p.cinema.castActorId=a.id;p.cinema.castFee=fee;
 p.cinema.castShare=money(CFG.tuning_engine.filmChooseCast__001+Math.max(0,a.skill-CFG.tuning_engine.filmChooseCast__002)*CFG.tuning_engine.filmChooseCast__003);
 p.creativeQuality=Math.min(CFG.tuning_engine.filmChooseCast__004,p.creativeQuality+Math.round((a.skill-CFG.tuning_engine.filmChooseCast__005)/CFG.tuning_engine.filmChooseCast__006)+(a.genreSpecialty===p.genre?CFG.tuning_engine.filmChooseCast__007:0));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.filmChooseCast__008+p.technicalQuality*CFG.tuning_engine.filmChooseCast__009,1,CFG.tuning_engine.filmChooseCast__010));
 return {actorId:a.id,fee,backendShare:p.cinema.castShare};
}
function filmDecision(s,projectId,decision){
 const {p,c}=filmRequire(s,projectId);
 if(!['script','screening','reshoot','facilities','festival','hybrid'].includes(decision))throw new Error('Unknown film choice.');
 if(p.route==='contract')throw new Error('Client-funded creative changes require negotiated approval.');
 if(p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired&&['script','reshoot','hybrid'].includes(decision))throw new Error('Binding creator approval prevents this unilateral change.');
 if(p.cinema.actions.some(a=>a.action===decision))throw new Error('This specific film decision has already been made.');
 if(decision==='facilities'&&p.cinema.facilities!=='partner')throw new Error('Facilities are already committed.');
 if(decision==='screening'&&(p.weeksDone<p.weeksTotal*CFG.tuning_engine.filmDecision__001||p.weeksDone>=p.weeksTotal*CFG.tuning_engine.filmDecision__002))throw new Error('Test screenings require an unfinished, substantially developed film.');
 if(decision==='reshoot'&&p.weeksDone<p.weeksTotal*CFG.tuning_engine.filmDecision__003)throw new Error('Reshoots require filmed material.');
 const ratio={script:CFG.tuning_engine.ratio__001,screening:CFG.tuning_engine.ratio__002,reshoot:CFG.tuning_engine.ratio__003,facilities:CFG.tuning_engine.ratio__004,festival:CFG.tuning_engine.ratio__005,hybrid:CFG.tuning_engine.ratio__006}[decision];
 const cost=filmCost(s,p,c,Math.max(CFG.tuning_engine.cost__013,p.budget*ratio),decision);
 if(decision==='script'){p.weeksTotal+=CFG.tuning_engine.filmDecision__004;p.creativeQuality=Math.min(CFG.tuning_engine.filmDecision__005,p.creativeQuality+CFG.tuning_engine.filmDecision__006);p.cinema.scriptDrafts++;}
 if(decision==='screening'){const estimate=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.estimate__001+p.technicalQuality*CFG.tuning_engine.estimate__002+(rand(s)-CFG.tuning_engine.estimate__003)*CFG.tuning_engine.estimate__004,1,CFG.tuning_engine.estimate__005));p.cinema.screenings.push({week:s.week,estimate,cost});}
 if(decision==='reshoot'){p.weeksTotal+=CFG.tuning_engine.filmDecision__007;p.creativeQuality=Math.min(CFG.tuning_engine.filmDecision__008,p.creativeQuality+CFG.tuning_engine.filmDecision__009);p.technicalQuality=Math.min(CFG.tuning_engine.filmDecision__010,p.technicalQuality+CFG.tuning_engine.filmDecision__011);p.cinema.reshoots++;}
 if(decision==='facilities'){p.cinema.facilities='rented';p.technicalQuality=Math.min(CFG.tuning_engine.filmDecision__012,p.technicalQuality+CFG.tuning_engine.filmDecision__013);}
 if(decision==='festival'){p.cinema.festival={entryWeek:s.week,cost,eligible:true,won:false};}
 if(decision==='hybrid'){p.cinema.method='hybrid';p.technicalQuality=Math.min(CFG.tuning_engine.filmDecision__014,p.technicalQuality+CFG.tuning_engine.filmDecision__015);}
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.filmDecision__016+p.technicalQuality*CFG.tuning_engine.filmDecision__017,1,CFG.tuning_engine.filmDecision__018));
 return {decision,cost,quality:p.quality,phase:p.phase};
}
// Film backlots are an optional expensed company operational capability with
// real ongoing costs, not a free asset or fictitious subsidiary investment.
function buildFilmBacklot(s){
 const c=player(s);if(!available('movie',s.week)||c.capabilities?.movie!=='internal')throw new Error('Film studio capability required.');
 if(c.filmBacklot)throw new Error('Studio already operates its own film backlot.');
 const cost=CFG.tuning_engine.cost__014;
 if(c.finance.cash<cost+CFG.tuning_engine.buildFilmBacklot__001)throw new Error('Insufficient reserve to establish a staffed film backlot.');
 expense(s,c,cost,'film-studio-fitout','One-time in-house studio fit-out; expensed conservatively');
 c.filmBacklot={builtWeek:s.week,cost,monthlyCost:CFG.tuning_engine.buildFilmBacklot__002,totalUpkeep:0};
 news(s,c.name+' opens in-house film studio',CFG.events.messages.buildFilmBacklot__001,'company');
 return {...c.filmBacklot};
}
function useFilmBacklot(s,projectId){
 const {p,c}=filmRequire(s,projectId);
 if(!c.filmBacklot)throw new Error('Build a funded in-house film studio first.');
 if(p.cinema.facilities!=='partner')throw new Error('Film facility method already committed.');
 if(s.projects.some(x=>x.id!==p.id&&x.status==='active'&&x.companyId===c.id&&(x.cinema?.facilities==='owned'||x.television?.facility==='owned')))throw new Error('In-house studio is currently occupied by another screen production.');
 p.cinema.facilities='owned';p.cinema.actions.push({week:s.week,action:'backlot',cost:0});
 p.technicalQuality=Math.min(CFG.tuning_engine.useFilmBacklot__001,p.technicalQuality+CFG.tuning_engine.useFilmBacklot__002);p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.useFilmBacklot__003+p.technicalQuality*CFG.tuning_engine.useFilmBacklot__004,1,CFG.tuning_engine.useFilmBacklot__005));
 return {projectId:p.id,facility:'owned',quality:p.quality};
}
function filmPremiere(s,projectId,region){
 const {p,c}=filmRequire(s,projectId);
 if(!activeRegions(s).some(x=>x.name===region))throw new Error('Premiere must be in an active regional market.');
 if(p.route==='contract'||p.cinema.premiere)throw new Error('Only one owned premiere campaign can be funded.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.endWeek<=s.week+Math.max(1,Math.ceil(p.weeksTotal-p.weeksDone)))throw new Error('Premiere timing requires effective film rights.');}
 const cost=filmCost(s,p,c,CFG.tuning_engine.cost__015,'premiere');p.cinema.premiere={region,week:s.week,cost};
 return {...p.cinema.premiere};
}
function filmDistribution(s,projectId,mode){
 const {p,c}=filmRequire(s,projectId);
 if(!FILM_DISTRIBUTION.includes(mode))throw new Error('Unknown cinema release route.');
 if(p.cinema.distribution===mode)return {mode,fee:0};
 if(p.cinema.actions.some(a=>a.action==='distribution'))throw new Error('The film release campaign is already committed.');
 const cost=mode==='wide'?money(p.budget*CFG.tuning_engine.cost__016):mode==='limited'?money(p.budget*CFG.tuning_engine.cost__017):0;
 if(cost)filmCost(s,p,c,cost,'distribution');
 else p.cinema.actions.push({week:s.week,action:'distribution',cost:0});
 p.cinema.distribution=mode;return {mode,cost};
}
function filmWindowChannel(p,week){const age=week-p.releaseWeek;
 return age<CFG.tuning_engine.filmWindowChannel__001?'theatrical':age<CFG.tuning_engine.filmWindowChannel__002?'premium-rental':'catalog';}
function filmDemandMultiplier(p,week,region){
 if(!p.cinema)return 1;
 const age=week-p.releaseWeek,mode=p.cinema.distribution;
 const channel=filmWindowChannel(p,week);
 const theatrical=channel==='theatrical';
 const releaseFactor=theatrical?(mode==='wide'?CFG.tuning_engine.releaseFactor__001:mode==='limited'?CFG.tuning_engine.releaseFactor__002:1):mode==='wide'?CFG.tuning_engine.releaseFactor__003:mode==='limited'?CFG.tuning_engine.releaseFactor__004:CFG.tuning_engine.releaseFactor__005;
 const localPremiere=theatrical&&age<CFG.tuning_engine.localPremiere__001&&p.cinema.premiere?.region===region?CFG.tuning_engine.localPremiere__002:1;
 const ratingFactor=p.cinema.rating==='M'?CFG.tuning_engine.ratingFactor__001:1;
 return clamp(releaseFactor*ratingFactor*localPremiere*(p.cinema.festival?.won?CFG.tuning_engine.filmDemandMultiplier__001:1),CFG.tuning_engine.filmDemandMultiplier__002,CFG.tuning_engine.filmDemandMultiplier__003);
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
  const festivalNames=CFG.film.FILM_FESTIVAL_NAMES;
  const festivalName=festivalNames[year%festivalNames.length];
 const award={id:id(s,'filmhonor'),year,week:s.week,projectId:winner.id,companyId:winner.companyId,
  score:winner.criticScore||winner.quality,category:'festival-recognition',festivalName,source:'observed'};
 s.filmHonors.push(award);winner.cinema.festival.won=true;
 news(s,festivalName+' recognizes '+winner.title,CFG.events.messages.recognizeFilmHonors__001,'awards');
}

// UPDATE 39: Television, season scheduling and rights-safe streaming.
// These are optional executive decisions; a production is still a single weekly team job.
const TV_NETWORKS=Object.freeze(CFG.television.TV_NETWORKS);
const TV_SLOTS=Object.freeze(CFG.television.TV_SLOTS);
const STREAM_TIERS=Object.freeze(CFG.television.STREAM_TIERS);
function tvDefault(p){return {seasonNumber:1,previousSeasonId:null,episodes:p.format==='Miniseries'?CFG.tuning_engine.tvDefault__001:CFG.tuning_engine.tvDefault__002,
  classification:p.pitch?.targetAudience==='mature'?'M':p.pitch?.targetAudience==='young'?'Y7':'PG',
  network:'public',slot:'daytime',scheduleCost:0,castActorId:null,castFee:0,writerRoom:null,
  episodeEdits:[],renewedBy:null,ended:false,chemistry:0,facility:null,actions:[],regionalAdGross:{},
  channelGross:{'first-run':0,syndication:0},estimatedViewers:{},viewersByCohort:{},weeklyRatings:[],ratingsHistoryComplete:true};}
function tvRequire(s,projectId,active=true){const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='tv'||!c||!controlledCompanies(s).some(x=>x.id===c.id)||active&&p.status!=='active')throw new Error('Select a controllable television production.');
 if(!p.television)p.television=tvDefault(p);return {p,c,t:p.television};}
function tvCost(s,p,c,cost,kind){cost=money(cost);if(c.finance.cash<cost+CFG.tuning_engine.tvCost__001)throw new Error('Insufficient operating cash for television decision.');
 expense(s,c,cost,'tv-'+kind,kind+' for '+p.title,p.id);p.directCost=money(p.directCost+cost);
 p.productionSpend=money((p.productionSpend||0)+cost);p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.television.actions.push({week:s.week,kind,cost});return cost;}
function tvPlanSeason(s,projectId,episodes){const {p,t}=tvRequire(s,projectId);
 if(!Number.isInteger(episodes)||episodes<CFG.tuning_engine.tvPlanSeason__001||episodes>CFG.tuning_engine.tvPlanSeason__002||p.weeksDone>0||t.seasonNumber>1&&episodes>CFG.tuning_engine.tvPlanSeason__003)throw new Error('Choose 3–24 episodes before production begins.');
 if(t.actions.some(x=>x.kind==='order'))throw new Error('Season order already committed.');
 const delta=episodes-t.episodes;if(delta>0)tvCost(s,p,company(s,p.companyId),money(delta*p.budget*CFG.tuning_engine.tvPlanSeason__004),'order');
 else t.actions.push({week:s.week,kind:'order',cost:0});
 p.weeksTotal=Math.max(CFG.tuning_engine.tvPlanSeason__005,p.weeksTotal+Math.round(delta*CFG.tuning_engine.tvPlanSeason__006));t.episodes=episodes;return {episodes,weeksTotal:p.weeksTotal};}
function tvWritersRoom(s,projectId,approach='balanced'){
 const {p,c,t}=tvRequire(s,projectId);if(p.route==='contract')throw new Error('Commissioned scripts require client approval.');
 if(p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)throw new Error('Creator approval restricts unilateral script changes.');
 if(t.writerRoom||!['balanced','character','spectacle'].includes(approach))throw new Error('Writers room already staffed or approach invalid.');
 const team=c.teams.find(x=>x.id===p.teamId),lead=s.employees.find(x=>x.id===team?.leaderId&&x.status==='employed');
 if(!team||!lead)throw new Error('A contracted team leader is needed to run the writing room.');
 const cost=tvCost(s,p,c,Math.max(CFG.tuning_engine.cost__018,p.budget*CFG.tuning_engine.cost__019),'writers-room');t.writerRoom={showrunnerId:lead.id,approach,week:s.week,cost};
 p.creativeQuality=Math.min(CFG.tuning_engine.tvWritersRoom__001,p.creativeQuality+(approach==='character'?CFG.tuning_engine.tvWritersRoom__002:CFG.tuning_engine.tvWritersRoom__003));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.tvWritersRoom__004+p.technicalQuality*CFG.tuning_engine.tvWritersRoom__005,1,CFG.tuning_engine.tvWritersRoom__006));return {...t.writerRoom};}
function tvEditEpisode(s,projectId,episode,choice='revision'){
 const {p,c,t}=tvRequire(s,projectId);if(p.route==='contract'||p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)throw new Error('Client or creator approval required for episode changes.');
 if(!Number.isInteger(episode)||episode<1||episode>t.episodes||!['revision','finale','technical'].includes(choice)||t.episodeEdits.some(x=>x.episode===episode))throw new Error('Invalid or previously edited episode.');
 const cost=tvCost(s,p,c,Math.max(CFG.tuning_engine.cost__020,p.budget*CFG.tuning_engine.cost__021),'episode');p.weeksTotal+=1;
 if(choice==='technical')p.technicalQuality=Math.min(CFG.tuning_engine.tvEditEpisode__001,p.technicalQuality+CFG.tuning_engine.tvEditEpisode__002);else p.creativeQuality=Math.min(CFG.tuning_engine.tvEditEpisode__003,p.creativeQuality+(choice==='finale'?CFG.tuning_engine.tvEditEpisode__004:CFG.tuning_engine.tvEditEpisode__005));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.tvEditEpisode__006+p.technicalQuality*CFG.tuning_engine.tvEditEpisode__007,1,CFG.tuning_engine.tvEditEpisode__008));const row={episode,choice,cost,week:s.week};t.episodeEdits.push(row);return row;}
function tvCast(s,projectId,actorId){const {p,c,t}=tvRequire(s,projectId);
 if(t.castActorId)throw new Error('Recurring lead already contracted.');
 const a=(filmActorPool(s),s.filmActors.find(a=>a.id===actorId));if(!a||a.busyProjectId)throw new Error('Performer unavailable for a recurring series schedule.');
 const fee=money(a.fee*(1+CFG.tuning_engine.fee__012*(t.seasonNumber-1)));tvCost(s,p,c,fee,'cast');a.busyProjectId=p.id;
 a.credits.push({projectId:p.id,week:s.week});t.castActorId=a.id;t.castFee=fee;
 const previous=s.projects.find(x=>x.id===t.previousSeasonId&&x.sector==='tv'&&x.ipId===p.ipId);
 const team=c.teams.find(x=>x.id===p.teamId),leader=team?.leaderId||null;
 if(previous?.television?.castActorId===a.id){
   const repeat=clamp((previous.television.chemistry||0)+CFG.tuning_engine.repeat__001+(previous.television.writerRoom?.showrunnerId===leader?1:0),0,CFG.tuning_engine.repeat__002);
   t.chemistry=repeat;
   s.tvCastRelations.push({projectId:p.id,previousSeasonId:previous.id,ipId:p.ipId,actorId:a.id,leaderId:leader,week:s.week,bonus:repeat});
 }
 p.creativeQuality=Math.min(CFG.tuning_engine.tvCast__001,p.creativeQuality+Math.max(1,Math.round((a.skill-CFG.tuning_engine.tvCast__002)/CFG.tuning_engine.tvCast__003))+t.chemistry);
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.tvCast__004+p.technicalQuality*CFG.tuning_engine.tvCast__005,1,CFG.tuning_engine.tvCast__006));return {actorId:a.id,fee,seasonNumber:t.seasonNumber};}
function tvSchedule(s,projectId,network='public',slot='daytime'){
 const {p,c,t}=tvRequire(s,projectId);if(!TV_NETWORKS.includes(network)||!TV_SLOTS.includes(slot))throw new Error('Choose a valid broadcaster and time slot.');
 if(t.actions.some(x=>x.kind==='schedule'))throw new Error('Broadcast slot already contracted.');
 const cost=money((network==='premium'?CFG.tuning_engine.cost__022:network==='commercial'?CFG.tuning_engine.cost__023:CFG.tuning_engine.cost__024)+(slot==='prime'?CFG.tuning_engine.cost__025:slot==='late'?CFG.tuning_engine.cost__026:0));
 tvCost(s,p,c,cost,'schedule');t.network=network;t.slot=slot;t.scheduleCost=cost;return {network,slot,cost};}
function tvUseBacklot(s,projectId){const {p,c,t}=tvRequire(s,projectId);
 if(!c.filmBacklot)throw new Error('Build an owned studio backlot first.');
 if(t.facility||s.projects.some(x=>x.id!==p.id&&x.companyId===c.id&&x.status==='active'&&(x.cinema?.facilities==='owned'||x.television?.facility==='owned')))throw new Error('Shared film and TV soundstage already occupied.');
 tvCost(s,p,c,CFG.tuning_engine.tvUseBacklot__001,'backlot-turnaround');t.facility='owned';p.technicalQuality=Math.min(CFG.tuning_engine.tvUseBacklot__002,p.technicalQuality+CFG.tuning_engine.tvUseBacklot__003);
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.tvUseBacklot__004+p.technicalQuality*CFG.tuning_engine.tvUseBacklot__005,1,CFG.tuning_engine.tvUseBacklot__006));return {facility:'owned',projectId:p.id};}
function tvDemandMultiplier(p,week,region){const t=p.television;if(!t)return 1;
 const age=week-p.releaseWeek;const slot=t.slot==='prime'?CFG.tuning_engine.slot__001:t.slot==='late'?CFG.tuning_engine.slot__002:1;
 const network=t.network==='commercial'?CFG.tuning_engine.network__001:t.network==='premium'?CFG.tuning_engine.network__002:CFG.tuning_engine.network__003;
 return clamp(slot*network*(t.classification==='M'?CFG.tuning_engine.tvDemandMultiplier__001:1)*(age>=CFG.tuning_engine.tvDemandMultiplier__002?CFG.tuning_engine.tvDemandMultiplier__003:1),CFG.tuning_engine.tvDemandMultiplier__004,CFG.tuning_engine.tvDemandMultiplier__005);}
function tvRatings(s,projectId){const {p,t}=tvRequire(s,projectId,false);return {projectId:p.id,season:t.seasonNumber,episodes:t.episodes,network:t.network,slot:t.slot,classification:t.classification,
  regionalAdGross:{...t.regionalAdGross},channels:{...t.channelGross},estimatedViewers:{...t.estimatedViewers},estimatedViewersByCohort:{...t.viewersByCohort},
  totalAdGross:money(Object.values(t.regionalAdGross).reduce((n,x)=>n+x,0)),recentWeeks:t.weeklyRatings.map(x=>({...x})),historyComplete:t.ratingsHistoryComplete,
  estimateNote:'Viewers are illustrative estimates derived from recorded advertising receipts. Ad money shares the finite regional television wallet; viewership itself does not generate additional revenue.'};}
function tvRenewSeason(s,projectId,{episodes=CFG.tuning_engine.tvRenewSeason__001,castAgain=true}={}){
 const {p,c,t}=tvRequire(s,projectId,false);if(p.status!=='released'||t.ended||t.renewedBy||p.route==='contract')throw new Error('Only a released, continuing owned series can be renewed.');
 if(p.format==='Miniseries')throw new Error('Limited miniseries do not auto-renew as permanent series.');
 if(!Number.isInteger(episodes)||episodes<CFG.tuning_engine.tvRenewSeason__002||episodes>CFG.tuning_engine.tvRenewSeason__003)throw new Error('Choose a valid next-season episode order.');
 if(s.projects.some(x=>x.ipId===p.ipId&&x.sector==='tv'&&x.status==='active'))throw new Error('Another season of this franchise is already filming.');
 // Use the regular project route, cash reserve, independent rights permission,
 // and available team checks. Retain original IP; never mint a second owner.
 const next=createProject(s,{sector:'tv',route:'adaptation',ipId:p.ipId,title:p.title+' · Season '+(t.seasonNumber+1),genre:p.genre,
   format:'Series',size:p.size,theme:p.pitch?.theme,targetAudience:p.pitch?.targetAudience,direction:p.pitch?.direction,positioning:p.pitch?.positioning});
 next.television.seasonNumber=t.seasonNumber+1;next.television.previousSeasonId=p.id;
 const target=next.television.episodes;next.television.episodes=episodes;next.weeksTotal=Math.max(CFG.tuning_engine.tvRenewSeason__004,next.weeksTotal+Math.round((episodes-target)*CFG.tuning_engine.tvRenewSeason__005));
 t.renewedBy=next.id;
 if(castAgain&&t.castActorId){const a=s.filmActors.find(a=>a.id===t.castActorId);
   if(a&&!a.busyProjectId&&c.finance.cash>=a.fee*(1+CFG.tuning_engine.tvRenewSeason__006*(next.television.seasonNumber-1))+CFG.tuning_engine.tvRenewSeason__007)tvCast(s,next.id,a.id);
   else if(c.isPlayer)alert(s,'tv-cast-'+next.id,CFG.events.messages.tvRenewSeason__001,'Your previous lead is unavailable or unaffordable. Season '+next.television.seasonNumber+' continues with an unfilled cast slot.','advisory');}
 if(c.isPlayer)news(s,'Season renewed: '+p.title,'Season '+next.television.seasonNumber+' booked under an actual production budget and current rights.','production');
 return next;}
function tvEndSeries(s,projectId){const {p,t}=tvRequire(s,projectId,false);
 if(p.status!=='released'||t.renewedBy||t.ended)throw new Error('Conclude the most recently completed season instead.');
 t.ended=true;news(s,'Series concluded: '+p.title,CFG.events.messages.tvEndSeries__001,'release');return {ended:true};}
function recognizeTvHonors(s,year){if(!Array.isArray(s.tvHonors))s.tvHonors=[];
  if(!Array.isArray(s.tvCastRelations))s.tvCastRelations=[];
 if(s.tvHonors.some(x=>x.year===year))return;
 const eligible=s.projects.filter(p=>p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===year&&p.route!=='contract');
 if(!eligible.length)return;
 const p=[...eligible].sort((a,b)=>(b.criticScore||b.quality)-(a.criticScore||a.quality))[0];
 const award={id:id(s,'tvhonor'),year,week:s.week,projectId:p.id,companyId:p.companyId,
  name:year%CFG.tuning_engine.award__001?'Aurora Television Awards':'Northern Screen Honors',category:'series-writing',criticScore:p.criticScore||p.quality,source:'observed'};
 s.tvHonors.push(award);news(s,award.name+' recognizes '+p.title,CFG.events.messages.recognizeTvHonors__001,'awards');}

// Streaming is a TV/film distribution capability, never a fifth industry.
// Subscriber receipts use the SAME capped regional television money pool that
// also funds broadcast advertising, and are never booked as a second sale.
function streamingReady(s){const t=technologyReport(s).tv;
 return available('tv',s.week)&&yearAt(s.week)>=CFG.tuning_engine.streamingReady__001&&!!t?.discovered;}
function launchStreamingService(s,{name='Syndicate Stream',tier='standard'}={}){
 const c=player(s);if(!streamingReady(s)||!c.capabilities.tv)throw new Error('Streaming service requires mature television distribution technology (World Year 14 or later) and television capability.');
 if(s.streamingServices.some(x=>x.companyId===c.id&&x.active))throw new Error('A company already operates an active streaming service.');
 if(!STREAM_TIERS[tier])throw new Error('Invalid subscription tier.');
 const fee=CFG.tuning_engine.fee__013;if(c.finance.cash<fee+CFG.tuning_engine.launchStreamingService__001)throw new Error('Insufficient cash for streaming launch and ongoing expenses.');
 expense(s,c,fee,'streaming-launch','Streaming service infrastructure and subscriber acquisition');
 const service={id:id(s,'service'),companyId:c.id,name:String(name).trim().slice(0,CFG.tuning_engine.service__001)||'Syndicate Stream',tier,
  price:STREAM_TIERS[tier],startedWeek:s.week,active:true,monthlyCost:CFG.tuning_engine.service__002,setupCost:fee,runningCost:0,
  regions:Object.fromEntries(activeRegions(s).map(r=>[r.name,{subscribers:0,paidGross:0,churned:0}])),
  grossReceipts:0,history:[],historyComplete:true};s.streamingServices.push(service);return service;}
function setStreamingTier(s,serviceId,tier){const service=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active);
 if(!service||!STREAM_TIERS[tier])throw new Error('Owned streaming service or tier unavailable.');
 if(service.tier===tier)return {...service};service.tier=tier;service.price=STREAM_TIERS[tier];return {...service};}
function streamWindowAuthorized(s,w,week=s.week){const p=s.projects.find(x=>x.id===w.projectId);
 if(!p||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract'||week<w.startWeek||week>=w.endWeek)return false;
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>week||g.endWeek+g.continuationWeeks<=week)return false;}
 return true;}
function requestStreamingLicense(s,serviceId,projectId,weeks=CFG.tuning_engine.requestStreamingLicense__001,bid=CFG.tuning_engine.requestStreamingLicense__002){
 const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),
   p=s.projects.find(x=>x.id===projectId),owner=p&&company(s,p.companyId);
 if(!svc||!p||p.status!=='released'||p.route==='contract'||!['movie','tv'].includes(p.sector)||!owner||owner.bankrupt||
   owner.id===s.playerId||controlledCompanies(s).some(c=>c.id===owner.id))throw new Error('Choose a released independent studio title for a bilateral streaming offer.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.requestStreamingLicense__003||weeks>CFG.tuning_engine.requestStreamingLicense__004||!Number.isFinite(bid)||bid<CFG.tuning_engine.requestStreamingLicense__005||bid>CFG.tuning_engine.requestStreamingLicense__006)throw new Error('Invalid streaming term or licensed offer.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)
   throw new Error('The source holder cannot grant this long streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('The streaming title is already available under contract.');
 if(s.streamingOffers.some(o=>o.serviceId===svc.id&&o.projectId===p.id&&o.status!=='declined'&&o.status!=='booked'&&o.expiresWeek>s.week))throw new Error('An active streaming rights negotiation already exists.');
 // Independent producers will not accept an arbitrarily low bidder. The
 // reserve is based on visible existing quality and time, not omniscience.
 const ask=money(CFG.tuning_engine.ask__001+p.quality*weeks*CFG.tuning_engine.ask__002);
 const row={id:id(s,'streamoffer'),serviceId:svc.id,projectId:p.id,ownerId:owner.id,operatorId:svc.companyId,
  createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__009,weeks,
  proposedFee:money(bid),counterFee:ask,acceptedFee:bid>=ask?money(bid):null,
  status:bid>=ask?'accepted':'counter',windowId:null};
 s.streamingOffers.push(row);return {...row};
}
function answerStreamingLicense(s,offerId,accept){const o=s.streamingOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No pending independent rights counteroffer remains.');
 o.status=accept?'accepted':'declined';o.acceptedFee=accept?o.counterFee:null;o.updatedWeek=s.week;return {...o};}
function licenseStreamingTitle(s,serviceId,projectId,weeks=CFG.tuning_engine.licenseStreamingTitle__001,offerId=null){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),p=s.projects.find(x=>x.id===projectId);
 const owner=p&&company(s,p.companyId),c=player(s);
 if(!svc||!p||!owner||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract')throw new Error('Choose a completed authorized TV or film title for the service.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.licenseStreamingTitle__002||weeks>CFG.tuning_engine.licenseStreamingTitle__003)throw new Error('Catalog windows last 13–156 weeks.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)throw new Error('Underlying rights do not cover the proposed streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('An active streaming window already covers this title.');
 const offer=owner.id===c.id?null:s.streamingOffers.find(o=>o.id===offerId&&o.status==='accepted'&&o.operatorId===c.id&&o.ownerId===owner.id&&o.serviceId===svc.id&&o.projectId===p.id&&o.weeks===weeks&&s.week<=o.expiresWeek);
 if(owner.id!==c.id&&!offer)throw new Error('A willing external owner must accept the exact streaming contract before payment.');
 const fee=offer?offer.acceptedFee:0;
 if(fee>0){if(c.finance.cash<fee+CFG.tuning_engine.licenseStreamingTitle__004)throw new Error('Insufficient cash for licensed streaming access.');
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
  const catalog=streamingCatalog(s,svc.id),quality=catalog.length?catalog.reduce((sum,x)=>sum+(s.projects.find(p=>p.id===x.projectId)?.quality||CFG.tuning_engine.quality__001),0)/catalog.length:0;
  for(const region of activeRegions(s)){const r=svc.regions[region.name]||{subscribers:0,paidGross:0,churned:0};svc.regions[region.name]=r;
   const permitted=catalog.filter(w=>canDistribute43(s,s.projects.find(p=>p.id===w.projectId),region.name,s.week));
   const permittedQuality=permitted.length?permitted.reduce((n,w)=>n+(s.projects.find(p=>p.id===w.projectId)?.quality||CFG.tuning_engine.permittedQuality__001),0)/permitted.length:0;
   const budget=worldMarketBudget(s,'tv',region.name),sharedBudget=Math.max(0,money(budget*CFG.tuning_engine.sharedBudget__001-(s.streamingWeeklyReserved?.[region.name]||0))),weeklyRate=svc.price/CFG.tuning_engine.weeklyRate__001;
   const ceiling=Math.max(0,Math.floor(sharedBudget/weeklyRate));
   const appeal=permitted.length?clamp((CFG.tuning_engine.appeal__001+CFG.tuning_engine.appeal__002*permitted.length+permittedQuality/CFG.tuning_engine.appeal__003)*(CFG.tuning_engine.appeal__004+(CFG.tuning_engine.appeal__005*s.macroeconomy)),CFG.tuning_engine.appeal__006,CFG.tuning_engine.appeal__007):0;
   const desired=Math.floor(ceiling*appeal);const old=r.subscribers;
   const newCount=old<desired?Math.min(desired,old+Math.max(CFG.tuning_engine.newCount__001,Math.ceil((desired-old)*CFG.tuning_engine.newCount__002))):Math.max(desired,old-Math.max(CFG.tuning_engine.newCount__003,Math.ceil((old-desired)*CFG.tuning_engine.newCount__004)));
   const billable=Math.max(0,Math.min(newCount,ceiling));r.churned+=Math.max(0,old-billable);r.subscribers=billable;
   const gross=money(Math.min(sharedBudget,billable*weeklyRate));if(gross<=0)continue;
   bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+' paid streaming subscriptions: '+svc.name);
   r.paidGross=money(r.paidGross+gross);svc.grossReceipts=money(svc.grossReceipts+gross);
   s.streamingWeeklyReserved[region.name]=money((s.streamingWeeklyReserved[region.name]||0)+gross);
   s.streamingWeeklyTotal=money(s.streamingWeeklyTotal+gross);
   svc.history.push({week:s.week,region:region.name,subscribers:billable,gross,activeTitles:catalog.length});
   if(svc.history.length>CFG.tuning_engine.streamingWeek__001){svc.history.shift();svc.historyComplete=false;}
  }
 }
}
function streamingReport(s,serviceId){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId);if(!svc)throw new Error('Not an owned service.');
 return {...svc,regions:Object.fromEntries(Object.entries(svc.regions).map(([k,v])=>[k,{...v}])),
 catalog:streamingCatalog(s,serviceId),history:svc.history.slice(-CFG.tuning_engine.streamingReport__001).map(x=>({...x})),
 note:'Receipts represent paid subscriptions within the single regional TV spending cap. Expired/unlicensed catalog entries are not available; no historical subscribers or income are invented.'};}
function auditTelevision(s,problems){const busy=new Set();
 for(const p of s.projects.filter(p=>p.sector==='tv')){const t=p.television;if(!t){problems.push(p.id+': missing TV record');continue;}
  if(!Number.isInteger(t.seasonNumber)||t.seasonNumber<1||!Number.isInteger(t.episodes)||t.episodes<CFG.tuning_engine.auditTelevision__001||t.episodes>CFG.tuning_engine.auditTelevision__002||
   !TV_NETWORKS.includes(t.network)||!TV_SLOTS.includes(t.slot)||!['Y7','PG','M'].includes(t.classification)||
   !Array.isArray(t.episodeEdits)||!Array.isArray(t.weeklyRatings)||!t.regionalAdGross||!t.channelGross||!t.viewersByCohort||
   Object.values(t.viewersByCohort).some(x=>!Number.isInteger(x)||x<0)||
   Math.abs(Object.values(t.viewersByCohort).reduce((n,v)=>n+v,0)-Object.values(t.estimatedViewers).reduce((n,v)=>n+v,0))>1||
   t.episodeEdits.some(e=>e.episode<1||e.episode>t.episodes||e.week>s.week||e.cost<0)||
   t.weeklyRatings.some(r=>r.week> s.week||r.week<p.releaseWeek||!REGIONS.some(x=>x.name===r.region)||r.gross<0||r.estimatedViewers<0||!['first-run','syndication'].includes(r.channel))||
   Math.abs(Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)-Object.values(t.channelGross).reduce((n,v)=>n+v,0))>CFG.tuning_engine.auditTelevision__003||
   Object.values(t.regionalAdGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.channelGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)>p.stats.totalSales+CFG.tuning_engine.auditTelevision__004||
   t.previousSeasonId&&(!s.projects.some(x=>x.id===t.previousSeasonId&&x.sector==='tv'&&x.ipId===p.ipId&&x.television?.renewedBy===p.id))||
   t.renewedBy&&(!s.projects.some(x=>x.id===t.renewedBy&&x.television?.previousSeasonId===p.id))||
   t.writerRoom&&!s.employees.some(x=>x.id===t.writerRoom.showrunnerId)||
   t.facility==='owned'&&!company(s,p.companyId)?.filmBacklot||
   t.castActorId&&(!s.filmActors.some(a=>a.id===t.castActorId&& (p.status!=='active'||a.busyProjectId===p.id))||p.status==='active'&&busy.has(t.castActorId)))problems.push(p.id+': invalid television season, ratings or cast records');
  if(!Number.isFinite(t.chemistry)||t.chemistry<0||t.chemistry>CFG.tuning_engine.auditTelevision__005)problems.push(p.id+': invalid recurring cast chemistry');
  if(t.castActorId&&p.status==='active')busy.add(t.castActorId);
 }
 for(const r of s.tvCastRelations||[]){const p=s.projects.find(x=>x.id===r.projectId),prior=s.projects.find(x=>x.id===r.previousSeasonId);
  if(!p||!prior||p.sector!=='tv'||prior.sector!=='tv'||p.ipId!==r.ipId||prior.ipId!==r.ipId||
    p.television?.previousSeasonId!==prior.id||p.television?.castActorId!==r.actorId||prior.television?.castActorId!==r.actorId||
    (r.leaderId!==null&&!s.employees.some(x=>x.id===r.leaderId))||
    !Number.isFinite(r.bonus)||r.bonus<CFG.tuning_engine.auditTelevision__006||r.bonus>CFG.tuning_engine.auditTelevision__007||p.television.chemistry!==r.bonus||
    !Number.isInteger(r.week)||r.week>s.week||r.week<p.startWeek)problems.push('Invalid recurring team relationship and cast collaboration');
 }
 for(const a of s.tvHonors||[])if(!s.projects.some(p=>p.id===a.projectId&&p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===a.year)||a.week>s.week||typeof a.name!=='string')problems.push('Invalid television award provenance');
 const used=new Set();
 for(const svc of s.streamingServices||[]){if(!company(s,svc.companyId)||!STREAM_TIERS[svc.tier]||svc.price!==STREAM_TIERS[svc.tier]||
   !Number.isInteger(svc.startedWeek)||svc.startedWeek>s.week||svc.startedWeek<(CFG.tuning_engine.auditTelevision__008-1)*CFG.tuning_engine.auditTelevision__009||
   svc.monthlyCost!==CFG.tuning_engine.auditTelevision__010||!Number.isFinite(svc.grossReceipts)||svc.grossReceipts<0||
   !svc.regions||Object.entries(svc.regions).some(([k,r])=>!REGIONS.some(z=>z.name===k)||!Number.isInteger(r.subscribers)||r.subscribers<0||r.paidGross<0||r.churned<0)||
   !Array.isArray(svc.history)||svc.history.some(x=>x.week> s.week||x.week<svc.startedWeek||x.gross<0||x.subscribers<0)||
   Math.abs(Object.values(svc.regions).reduce((n,r)=>n+r.paidGross,0)-svc.grossReceipts)>CFG.tuning_engine.auditTelevision__011||used.has(svc.companyId))problems.push('Invalid streaming service and subscriber cash history');
  used.add(svc.companyId);
 }
 for(const o of s.streamingOffers||[])if(!s.streamingServices.some(x=>x.id===o.serviceId&&x.companyId===o.operatorId)||
   !s.projects.some(x=>x.id===o.projectId&&x.companyId===o.ownerId&&x.status==='released')||
   !['counter','accepted','booked','declined'].includes(o.status)||
   !Number.isInteger(o.createdWeek)||o.createdWeek>s.week||o.expiresWeek!==o.createdWeek+CFG.tuning_engine.auditTelevision__012||
   !Number.isFinite(o.proposedFee)||o.proposedFee<CFG.tuning_engine.auditTelevision__013||o.counterFee<CFG.tuning_engine.auditTelevision__014||
   o.status==='booked'&&!s.streamingWindows.some(w=>w.offerId===o.id&&w.id===o.windowId)||
   (o.status==='accepted'||o.status==='booked')&&(!Number.isFinite(o.acceptedFee)||![o.proposedFee,o.counterFee].includes(o.acceptedFee)))
   problems.push('Invalid bilateral streaming offer provenance');
 for(const w of s.streamingWindows||[]){const p=s.projects.find(x=>x.id===w.projectId),svc=s.streamingServices.find(x=>x.id===w.serviceId);
  const offer=w.offerId?s.streamingOffers.find(o=>o.id===w.offerId):null;
  if(!svc||!p||!['movie','tv'].includes(p.sector)||p.status!=='released'||p.route==='contract'||p.companyId!==w.ownerId||w.startWeek<p.releaseWeek||w.startWeek>s.week||
    (w.ownerId!==svc.companyId&&(!offer||offer.status!=='booked'||offer.windowId!==w.id||offer.acceptedFee!==w.fee))||
    !Number.isInteger(w.endWeek)||w.endWeek<=w.startWeek||w.endWeek-w.startWeek>CFG.tuning_engine.auditTelevision__015||w.endWeek-w.startWeek<CFG.tuning_engine.auditTelevision__016||w.fee<0||
    w.rightsGrantId!==(p.grantId||null)||w.territory!=='Worldwide'||w.exclusive!==false||
    (w.rightsGrantId&&(!s.grants.some(g=>g.id===w.rightsGrantId&&g.endWeek+g.continuationWeeks>=w.endWeek)))||
    s.streamingWindows.some(x=>x!==w&&x.serviceId===w.serviceId&&x.projectId===w.projectId&&x.startWeek<w.endWeek&&w.startWeek<x.endWeek))problems.push('Invalid streaming license and rights window');
 }
}

// UPDATE 40: Video-game creation and lawful digital distribution.
// These services operate inside the FOUR existing industries; platforms are not manufacturers.
// Promotional exclusive is a separate bilateral deal. A store cannot buy exclusivity from itself,
// and the grant is a REAL funded platform marketing transfer, not an industry subsidy.
function gameOfferExclusive(s,storeId,projectId,grant=CFG.tuning_engine.gameOfferExclusive__001,weeks=CFG.tuning_engine.gameOfferExclusive__002){
 const store=gameStoreById(s,storeId),win=gameWindows(s,storeId).find(x=>x.projectId===projectId),p=s.projects.find(x=>x.id===projectId);
 if(store.companyId!==s.playerId||!win||!p||p.companyId===s.playerId)throw new Error('Only independent licensed games may negotiate a platform exclusive.');
 if(!Number.isFinite(grant)||grant<CFG.tuning_engine.gameOfferExclusive__003||grant>CFG.tuning_engine.gameOfferExclusive__004||![CFG.tuning_engine.gameOfferExclusive__005,CFG.tuning_engine.gameOfferExclusive__006,CFG.tuning_engine.gameOfferExclusive__007].includes(weeks)||win.endWeek<s.week+weeks||p.videoGame.exclusiveUntil>s.week)
  throw new Error('Exclusive grant/term must fit the lawful catalog window.');
 if(s.gameStoreWindows.some(w=>w.projectId===p.id&&w.storeId!==store.id&&w.endWeek>s.week))throw new Error('Existing distribution rights prevent exclusivity.');
 const demand=money(Math.max(grant,Math.min(CFG.tuning_engine.demand__001,CFG.tuning_engine.demand__002+p.quality*CFG.tuning_engine.demand__003)));
 const o={id:id(s,'gameexclusive'),storeId,projectId,operatorId:store.companyId,ownerId:p.companyId,
 proposedGrant:money(grant),counterGrant:demand,acceptedGrant:grant>=demand?money(grant):null,status:grant>=demand?'accepted':'counter',weeks,
 createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.o__001,activatedWeek:null};s.gameExclusiveOffers.push(o);return o;
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
 if(operator.finance.cash<o.acceptedGrant+CFG.tuning_engine.gameBookExclusive__001)throw new Error('Store cannot fund the agreed marketing grant.');
 expense(s,operator,o.acceptedGrant,'game-exclusive-marketing','Time-limited marketing rights '+p.title,p.id);
 revenue(s,owner,o.acceptedGrant,'game-exclusive-grant','Contracted exclusive marketing support '+p.title,p.id);
 p.videoGame.exclusiveStoreId=o.storeId;p.videoGame.exclusiveUntil=s.week+o.weeks;p.videoGame.storeId=o.storeId;
 o.activatedWeek=s.week;o.status='booked';return {projectId:p.id,storeId:o.storeId,grant:o.acceptedGrant,endWeek:p.videoGame.exclusiveUntil};
}

const GAME_PLATFORMS=Object.freeze(CFG.games.GAME_PLATFORMS);
const GAME_MECHANICS=Object.freeze(CFG.games.GAME_MECHANICS);
const GAME_MODELS=Object.freeze(CFG.games.GAME_MODELS);
const GAME_STAGES=Object.freeze(CFG.games.GAME_STAGES);
function gameGeneration(week,platform){return 1+Math.floor((yearAt(week)-GAME_PLATFORMS[platform])/CFG.tuning_engine.gameGeneration__001);}
function gameDefault(p,week){return {mechanic:'strategy',platform:'pc',generation:gameGeneration(Math.max((CFG.tuning_engine.gameDefault__001-1)*CFG.tuning_engine.gameDefault__002,week),'pc'),
  scope:'balanced',engine:'licensed',engineFee:0,prototype:null,designHistory:[],stages:[{week,phase:'concept'}],
  bugs:Math.max(0,Math.round(CFG.tuning_engine.gameDefault__003+(CFG.tuning_engine.gameDefault__004-p.technicalQuality)*CFG.tuning_engine.gameDefault__005)),qaHistory:[],beta:null,certification:null,
  model:'premium',exclusiveUntil:0,exclusivePlatform:null,exclusivePromotion:0,community:0,communityActions:[],
  support:[],dlc:[],esports:[],regionalGross:{},salesUnits:{},platformFees:0,platformGross:0,
  weeklySales:[],historyComplete:true,storeId:null,lastStoreOwnerId:null};}
function gameProject(s,projectId,needsActive=true){const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||!c||p.sector!=='games'||!controlledCompanies(s).some(x=>x.id===c.id)||needsActive&&p.status!=='active'||p.route==='contract')throw new Error('Choose an eligible owned game project.');
 if(!available('games',s.week))throw new Error('Worldwide games debut in Year 10.');
 if(!p.videoGame)p.videoGame=gameDefault(p,p.startWeek);return {p,c,g:p.videoGame};}
function gameSpend(s,p,c,amount,kind){amount=money(amount);if(c.finance.cash<amount+CFG.tuning_engine.gameSpend__001)throw new Error('Game decision requires funded cash with operating buffer.');
 expense(s,c,amount,'game-'+kind,kind+' development: '+p.title,p.id);p.directCost=money(p.directCost+amount);
 p.productionSpend=money((p.productionSpend||0)+amount);p.periodProductionSpend=money((p.periodProductionSpend||0)+amount);return amount;}
function gameQuality(p){p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameQuality__001+p.technicalQuality*CFG.tuning_engine.gameQuality__002-p.videoGame.bugs*CFG.tuning_engine.gameQuality__003,CFG.tuning_engine.gameQuality__004,CFG.tuning_engine.gameQuality__005));return p.quality;}
function gameDesign(s,projectId,{mechanic='strategy',platform='pc',scope='balanced'}={}){
 const {p,g}=gameProject(s,projectId);if(p.weeksDone>0||g.designHistory.length)throw new Error('Core design locks after development starts.');
 if(!GAME_MECHANICS.includes(mechanic)||!GAME_PLATFORMS[platform]||!['focused','balanced','ambitious'].includes(scope))throw new Error('Invalid game design.');
 if(yearAt(s.week)<GAME_PLATFORMS[platform])throw new Error('That platform ecosystem has not appeared yet.');
 if(p.grantId&&s.grants.some(x=>x.id===p.grantId&&x.approvalRequired))throw new Error('Creator approval restricts changed design.');
 g.mechanic=mechanic;g.platform=platform;g.generation=gameGeneration(s.week,platform);g.scope=scope;
 g.designHistory.push({week:s.week,mechanic,platform,scope});if(scope==='ambitious'){p.weeksTotal+=CFG.tuning_engine.gameDesign__001;g.bugs+=CFG.tuning_engine.gameDesign__002;p.creativeQuality=Math.min(CFG.tuning_engine.gameDesign__003,p.creativeQuality+CFG.tuning_engine.gameDesign__004);}
 if(scope==='focused'){p.weeksTotal=Math.max(CFG.tuning_engine.gameDesign__005,p.weeksTotal-CFG.tuning_engine.gameDesign__006);g.bugs=Math.max(CFG.tuning_engine.gameDesign__007,g.bugs-CFG.tuning_engine.gameDesign__008);}gameQuality(p);
 return {mechanic,platform,scope,generation:g.generation,plannedWeeks:p.weeksTotal};}
function gamePrototype(s,projectId,approach='balanced'){
 const {p,c,g}=gameProject(s,projectId);if(g.prototype||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gamePrototype__001||!['balanced','technical','creative'].includes(approach))throw new Error('Prototype must be commissioned early, once per game.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__027,p.budget*CFG.tuning_engine.cost__028),'prototype');g.prototype={week:s.week,approach,cost,riskEstimate:Math.round(clamp(CFG.tuning_engine.gamePrototype__002+g.bugs-(p.technicalQuality-CFG.tuning_engine.gamePrototype__003)*CFG.tuning_engine.gamePrototype__004,CFG.tuning_engine.gamePrototype__005,CFG.tuning_engine.gamePrototype__006))};
 if(approach==='technical'){g.bugs=Math.max(1,g.bugs-CFG.tuning_engine.gamePrototype__007);p.technicalQuality=Math.min(CFG.tuning_engine.gamePrototype__008,p.technicalQuality+CFG.tuning_engine.gamePrototype__009);}
 else {p.creativeQuality=Math.min(CFG.tuning_engine.gamePrototype__010,p.creativeQuality+(approach==='creative'?CFG.tuning_engine.gamePrototype__011:CFG.tuning_engine.gamePrototype__012));}
 gameQuality(p);return {...g.prototype};}
function gameBuildEngine(s){const c=player(s);if(!available('games',s.week)||!c.capabilities.games)throw new Error('Game studio technology unavailable.');
 if(c.gameEngine)throw new Error('Company already maintains a proprietary game engine.');
 const cost=CFG.tuning_engine.cost__029;if(c.finance.cash<cost+CFG.tuning_engine.gameBuildEngine__001)throw new Error('Not enough funds for engine R&D and operating reserve.');
 expense(s,c,cost,'game-engine-rnd','Fund proprietary reusable game engine R&D');
 c.gameEngine={createdWeek:s.week,maintenance:CFG.tuning_engine.gameBuildEngine__002,version:1,quality:CFG.tuning_engine.gameBuildEngine__003};return c.gameEngine;}
function gameChooseEngine(s,projectId,engine='licensed'){
 const {p,c,g}=gameProject(s,projectId);if(!['licensed','proprietary'].includes(engine)||g.engineFee||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gameChooseEngine__001)throw new Error('Choose game tools early and only once.');
 if(engine==='proprietary'&&!c.gameEngine)throw new Error('This studio has not funded a proprietary engine.');
 const cost=gameSpend(s,p,c,engine==='licensed'?Math.max(CFG.tuning_engine.cost__030,p.budget*CFG.tuning_engine.cost__031):Math.max(CFG.tuning_engine.cost__032,p.budget*CFG.tuning_engine.cost__033),'engine-license');
 g.engine=engine;g.engineFee=cost;g.bugs=Math.max(0,g.bugs-(engine==='proprietary'?CFG.tuning_engine.gameChooseEngine__002:CFG.tuning_engine.gameChooseEngine__003));p.technicalQuality=Math.min(CFG.tuning_engine.gameChooseEngine__004,p.technicalQuality+(engine==='proprietary'?CFG.tuning_engine.gameChooseEngine__005:CFG.tuning_engine.gameChooseEngine__006));gameQuality(p);
 return {engine,cost,defects:g.bugs};}
function gameQA(s,projectId,level='standard'){
 const {p,c,g}=gameProject(s,projectId);if(!['standard','intensive','crunch'].includes(level)||g.qaHistory.length>=CFG.tuning_engine.gameQA__001)throw new Error('Invalid QA order or team already stretched.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__034,p.budget*(level==='intensive'?CFG.tuning_engine.cost__035:level==='crunch'?CFG.tuning_engine.cost__036:CFG.tuning_engine.cost__037)),'qa');
 const reduction=level==='intensive'?CFG.tuning_engine.reduction__001:level==='crunch'?CFG.tuning_engine.reduction__002:CFG.tuning_engine.reduction__003;g.bugs=Math.max(0,g.bugs-reduction);p.technicalQuality=Math.min(CFG.tuning_engine.gameQA__002,p.technicalQuality+(level==='intensive'?CFG.tuning_engine.gameQA__003:CFG.tuning_engine.gameQA__004));
 if(level==='intensive')p.weeksTotal+=CFG.tuning_engine.gameQA__005;if(level==='crunch')p.creativeQuality=Math.max(CFG.tuning_engine.gameQA__006,p.creativeQuality-CFG.tuning_engine.gameQA__007);
 const row={week:s.week,level,cost,defectsAfter:g.bugs};g.qaHistory.push(row);gameQuality(p);return row;}
function gameMilestone(s,p){const g=p.videoGame;if(!g)return;const ratio=p.weeksDone/Math.max(1,p.weeksTotal);
 const next=ratio>=CFG.tuning_engine.next__003?'certification':ratio>=CFG.tuning_engine.next__004?'beta':ratio>=CFG.tuning_engine.next__005?'alpha':ratio>=CFG.tuning_engine.next__006?'build':ratio>=CFG.tuning_engine.next__007?'prototype':'concept';
 if(g.stages.at(-1)?.phase!==next)g.stages.push({week:s.week,phase:next});}
function gameBeta(s,projectId){const {p,c,g}=gameProject(s,projectId);if(g.beta||p.weeksDone<p.weeksTotal*CFG.tuning_engine.gameBeta__001)throw new Error('Beta requires a developed playable build.');
 const cost=gameSpend(s,p,c,Math.max(CFG.tuning_engine.cost__038,p.budget*CFG.tuning_engine.cost__039),'beta');g.beta={week:s.week,cost,estimatedAppeal:Math.round(clamp(p.creativeQuality-g.bugs*CFG.tuning_engine.gameBeta__002,1,CFG.tuning_engine.gameBeta__003)),estimatedBugs:g.bugs};
 return {...g.beta};}
function gameCertify(s,projectId,region){const {p,c,g}=gameProject(s,projectId);
 if(!activeRegions(s).some(r=>r.name===region)||g.certification?.regions?.includes(region))throw new Error('Invalid or already certified region.');
 if(p.weeksDone<p.weeksTotal*CFG.tuning_engine.gameCertify__001)throw new Error('Certification requires sufficiently developed content.');
 const cost=gameSpend(s,p,c,CFG.tuning_engine.cost__040,'certification');if(!g.certification)g.certification={regions:[],failures:[],cost:0};g.certification.cost=money(g.certification.cost+cost);
 if(g.bugs>CFG.tuning_engine.gameCertify__002){g.certification.failures.push({week:s.week,region,bugs:g.bugs});return {region,passed:false,bugs:g.bugs,cost};}
 g.certification.regions.push(region);return {region,passed:true,cost};}
function gameSetModel(s,projectId,model='premium'){
 const {p,g}=gameProject(s,projectId);if(!GAME_MODELS.includes(model)||p.weeksDone>p.weeksTotal*CFG.tuning_engine.gameSetModel__001)throw new Error('Business model locks before the final build.');
 if(model==='subscription'&&yearAt(s.week)<CFG.tuning_engine.gameSetModel__002||model==='free-to-play'&&yearAt(s.week)<CFG.tuning_engine.gameSetModel__003)throw new Error('Selected business model is not yet supported by this world technology.');
 g.model=model;return {model};}
function gameCommunity(s,projectId,kind='community'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status==='cancelled'||!['community','modding','demo','esports'].includes(kind))throw new Error('Invalid game community support.');
 if(kind==='esports'&&(p.status!=='released'||!['strategy','action','simulation'].includes(g.mechanic)))throw new Error('Organized esports requires an eligible released game.');
 if(kind==='modding'&&yearAt(s.week)<CFG.tuning_engine.gameCommunity__001)throw new Error('Modding tools are not yet available.');
 if(g.communityActions.filter(x=>x.kind===kind).length>=CFG.tuning_engine.gameCommunity__002)throw new Error('Already supported this initiative twice.');
 const cost=gameSpend(s,p,c,kind==='esports'?CFG.tuning_engine.cost__041:kind==='modding'?CFG.tuning_engine.cost__042:kind==='demo'?CFG.tuning_engine.cost__043:CFG.tuning_engine.cost__044,'community');
 g.community=Math.min(CFG.tuning_engine.gameCommunity__003,g.community+(kind==='esports'?CFG.tuning_engine.gameCommunity__004:kind==='modding'?CFG.tuning_engine.gameCommunity__005:CFG.tuning_engine.gameCommunity__006));const row={week:s.week,kind,cost,bonus:g.community};g.communityActions.push(row);return row;}
function gameSupport(s,projectId,kind='patch'){
 const {p,c,g}=gameProject(s,projectId,false);if(p.status!=='released'||!['patch','dlc','port'].includes(kind))throw new Error('Only finished games receive postlaunch support.');
 if(!gameDistributionAllowed(s,p,s.week))throw new Error('Publishing rights have expired; no new paid distribution is permitted.');
 if(kind==='dlc'&&g.dlc.length>=CFG.tuning_engine.gameSupport__001||kind==='port'&&g.support.some(x=>x.kind==='port'))throw new Error('Expansion or port already completed.');
 const cost=gameSpend(s,p,c,kind==='dlc'?CFG.tuning_engine.cost__045:kind==='port'?CFG.tuning_engine.cost__046:CFG.tuning_engine.cost__047,'postlaunch');
 if(kind==='patch'){g.bugs=Math.max(0,g.bugs-CFG.tuning_engine.gameSupport__002);p.technicalQuality=Math.min(CFG.tuning_engine.gameSupport__003,p.technicalQuality+CFG.tuning_engine.gameSupport__004);}
 if(kind==='dlc')g.dlc.push({week:s.week,cost});if(kind==='port')g.platform='pc';
 const row={week:s.week,kind,cost};g.support.push(row);gameQuality(p);return row;}
function gameDistributionAllowed(s,p,week){return !p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=week&&g.endWeek+(g.continuationWeeks||0)>week);}
function gameAtRelease(s,p){const g=p.videoGame;if(!g)return;
 g.stages.push({week:s.week,phase:'released'});g.releaseDefects=g.bugs;
 // A failed certification cannot be bypassed by silently selling in that region.
 g.launchRegions=g.certification?.regions?.length?[...g.certification.regions]:activeRegions(s).map(r=>r.name);
 g.criticRating=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameAtRelease__001+p.technicalQuality*CFG.tuning_engine.gameAtRelease__002,1,CFG.tuning_engine.gameAtRelease__003));
 g.userRating=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.gameAtRelease__004+p.technicalQuality*CFG.tuning_engine.gameAtRelease__005-g.bugs*CFG.tuning_engine.gameAtRelease__006+g.community*CFG.tuning_engine.gameAtRelease__007,1,CFG.tuning_engine.gameAtRelease__008));
 p.criticScore=g.criticRating;p.audienceScore=g.userRating;}
function gameDemandMultiplier(p,week,region){const g=p.videoGame;if(!g)return 1;
 if(!g.launchRegions?.includes(region)||week<p.releaseWeek||g.exclusiveStoreId&&g.exclusiveUntil>week&&g.storeId!==g.exclusiveStoreId)return 0;
 const technical=clamp(1-g.bugs/CFG.tuning_engine.technical__001,CFG.tuning_engine.technical__002,CFG.tuning_engine.technical__003),platformFit=g.platform==='pc'?1:g.platform==='mobile'?CFG.tuning_engine.platformFit__001:g.platform==='handheld'?CFG.tuning_engine.platformFit__002:CFG.tuning_engine.platformFit__003;
 return clamp(technical*platformFit*(1+g.community*CFG.tuning_engine.gameDemandMultiplier__001+g.dlc.length*CFG.tuning_engine.gameDemandMultiplier__002)*(g.model==='free-to-play'?CFG.tuning_engine.gameDemandMultiplier__003:1),0,CFG.tuning_engine.gameDemandMultiplier__004);}
function gameReadiness(s,projectId){const {p,g}=gameProject(s,projectId,false);return {phase:g.stages.at(-1)?.phase,
  estimate:g.beta?.estimatedAppeal??null,bugs:g.bugs,platform:g.platform,generation:g.generation,
  launchRegions:g.certification?.regions||[],criticScore:p.status==='released'?g.criticRating:null,userScore:p.status==='released'?g.userRating:null,
  sales:g.regionalGross,units:g.salesUnits,observedWeeks:g.weeklySales.slice(-CFG.tuning_engine.gameReadiness__001),historyComplete:g.historyComplete,
  note:'Technical defects, critics and players are tracked separately. Beta appeal is an estimate; sales and cash are observed.'};}
// Late-era digital distribution is a CONTRACTED SERVICE, not a fifth industry.
function openGameStore(s,{name='Arcade Exchange'}={}){requireExecutiveControl(s);const c=player(s);
 if(yearAt(s.week)<CFG.tuning_engine.openGameStore__001||!c.capabilities.games)throw new Error('Game storefronts require Year 19 and a game-company capability.');
 if(s.gameStores.some(x=>x.companyId===c.id))throw new Error('Your company already operates a storefront.');
 const cost=CFG.tuning_engine.cost__048;if(c.finance.cash<cost+CFG.tuning_engine.openGameStore__002)throw new Error('Funded store launch and cash reserve required.');
 expense(s,c,cost,'game-store-setup','Game distribution store launch');
 const store={id:id(s,'gamestore'),companyId:c.id,name:String(name||'Arcade Exchange').trim().slice(0,CFG.tuning_engine.store__001),startedWeek:s.week,active:true,monthlyCost:CFG.tuning_engine.store__002,
  subscribed:false,tier:CFG.tuning_engine.store__003,regionSubs:{},subscriptionGross:0,grossStoreFees:0,history:[],historyComplete:true};s.gameStores.push(store);return store;}
function gameStoreById(s,storeId){const store=s.gameStores.find(x=>x.id===storeId);if(!store||!store.active)throw new Error('Store unavailable.');return store;}
function gameStoreAvailable(s,p,store){return p?.sector==='games'&&p.status==='released'&&p.route!=='contract'&&
 gameDistributionAllowed(s,p,s.week)&&yearAt(s.week)>=CFG.tuning_engine.gameStoreAvailable__001&&(!p.videoGame?.exclusiveUntil||p.videoGame.exclusiveUntil<=s.week);}
function gameStoreOffer(s,storeId,projectId,fee=CFG.tuning_engine.gameStoreOffer__001){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),operator=company(s,store.companyId),owner=company(s,p?.companyId);
 if(!p||!owner||!operator||owner.id===operator.id||!gameStoreAvailable(s,p,store))throw new Error('Only independent, authorized completed games may be negotiated.');
 if(!Number.isFinite(fee)||fee<CFG.tuning_engine.gameStoreOffer__002||fee>CFG.tuning_engine.gameStoreOffer__003)throw new Error('Invalid fixed rights license fee.');
 if(s.gameStoreOffers.some(o=>o.storeId===storeId&&o.projectId===projectId&&['counter','accepted','booked'].includes(o.status)))throw new Error('Offer already exists.');
 const counter=money(Math.max(fee,Math.min(CFG.tuning_engine.counter__003,CFG.tuning_engine.counter__004+p.quality*CFG.tuning_engine.counter__005)));const row={id:id(s,'gamestoreoffer'),storeId,operatorId:operator.id,ownerId:owner.id,
  projectId,proposedFee:money(fee),counterFee:counter,acceptedFee:null,status:fee>=counter?'accepted':'counter',createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__010,windowId:null};
 if(row.status==='accepted')row.acceptedFee=row.proposedFee;s.gameStoreOffers.push(row);return row;}
function gameAnswerStoreOffer(s,offerId,accept){const o=s.gameStoreOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No valid pending store counteroffer.');
 o.status=accept?'accepted':'declined';if(accept)o.acceptedFee=o.counterFee;return o;}
function gameListStore(s,storeId,projectId,offerId=null){const store=gameStoreById(s,storeId),p=s.projects.find(x=>x.id===projectId),c=company(s,store.companyId);
 if(!p||!gameStoreAvailable(s,p,store)||!c||s.gameStoreWindows.some(w=>w.storeId===storeId&&w.projectId===projectId&&w.endWeek>s.week))throw new Error('Store title is unavailable or already listed.');
 const external=p.companyId!==c.id,o=external?s.gameStoreOffers.find(x=>x.id===offerId):null;
 if(external&&(!o||o.storeId!==storeId||o.projectId!==p.id||o.status!=='accepted'||s.week>o.expiresWeek||o.ownerId!==p.companyId))throw new Error('Independent owner must accept valid matching terms.');
 const fee=external?o.acceptedFee:0;if(c.finance.cash<fee+CFG.tuning_engine.gameListStore__001)throw new Error('Insufficient cash to book catalog rights.');
 if(fee){expense(s,c,fee,'game-store-license','Lawful fixed fee for '+p.title,p.id);revenue(s,company(s,p.companyId),fee,'game-store-license-income','Store license earned: '+p.title,p.id);}
 const window={id:id(s,'gamestorewindow'),storeId,projectId:p.id,ownerId:p.companyId,offerId:o?.id||null,fee,
  startWeek:s.week,endWeek:s.week+CFG.tuning_engine.window__001,share:CFG.tuning_engine.window__002,subscription:true,grantId:p.grantId||null};
 if(p.grantId){const grant=s.grants.find(g=>g.id===p.grantId);window.endWeek=Math.min(window.endWeek,grant.endWeek+(grant.continuationWeeks||0));}
 s.gameStoreWindows.push(window);if(external&&p.videoGame)p.videoGame.storeId=store.id;if(o){o.status='booked';o.windowId=window.id;}return window;}
function gameWindows(s,storeId,atWeek=s.week){return s.gameStoreWindows.filter(w=>w.storeId===storeId&&w.startWeek<=atWeek&&w.endWeek>atWeek&&
 s.projects.some(p=>p.id===w.projectId&&p.companyId===w.ownerId&&gameDistributionAllowed(s,p,atWeek)));}
function gameSelectStore(s,projectId,storeId){const {p,g}=gameProject(s,projectId,false);if(p.status!=='released'||!gameWindows(s,storeId).some(x=>x.projectId===p.id)||g.exclusiveStoreId&&g.exclusiveUntil>s.week&&g.exclusiveStoreId!==storeId)throw new Error('Only actually licensed, nonconflicting stores may sell this game.');
 g.storeId=storeId;return {storeId};}
function gameMarketSplit(s,p,gross,region){const g=p.videoGame;g.lastStoreOwnerId=null;
 const win=g.storeId?gameWindows(s,g.storeId).find(x=>x.projectId===p.id):null;
 if(!win){if(g.exclusiveStoreId&&g.exclusiveUntil>s.week)return {fee:0,net:0,channel:'exclusive-blocked'};return {fee:money(gross*CFG.tuning_engine.gameMarketSplit__001),net:money(gross*CFG.tuning_engine.gameMarketSplit__002),channel:'external'};}
 g.lastStoreOwnerId=s.gameStores.find(x=>x.id===win.storeId)?.companyId||null;if(g.lastStoreOwnerId===p.companyId)return {fee:0,net:money(gross),channel:'first-party'};return {fee:money(gross*win.share),net:money(gross*(1-win.share)),channel:'licensed-store'};}
function gameSubscribeStore(s,storeId,enabled){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId||typeof enabled!=='boolean')throw new Error('Invalid subscription operator or setting.');
 if(enabled&&yearAt(s.week)<CFG.tuning_engine.gameSubscribeStore__001)throw new Error('Game subscriptions require mature digital infrastructure in Year 23.');
 if(enabled&&!gameWindows(s,storeId).length)throw new Error('Subscription launch requires lawfully licensed catalog titles.');
 store.subscribed=enabled;return store;}
function gameStoreWeek(s){
 // Proprietary game technology is an ongoing supported capability, not a free perpetual bonus.
 if(s.week%CFG.tuning_engine.gameStoreWeek__001===0)for(const c of s.companies||[])if(c.gameEngine&&!c.bankrupt){
  expense(s,c,c.gameEngine.maintenance||CFG.tuning_engine.gameStoreWeek__002,'game-engine-upkeep','Maintain in-house production engine and tools');
 }
 s.gameMarketReserved={};for(const store of s.gameStores||[])if(store.active){
 const c=company(s,store.companyId);if(!c||c.bankrupt)continue;
 if(s.week>store.startedWeek&&s.week%CFG.tuning_engine.gameStoreWeek__003===0)expense(s,c,store.monthlyCost,'game-store-upkeep','Customer support, bandwidth and store discovery');
 if(!store.subscribed)continue;const licensed=gameWindows(s,store.id);
 for(const region of activeRegions(s)){const budget=worldMarketBudget(s,'games',region.name),w=store.regionSubs[region.name]||{subscribers:0,gross:0,churn:0};store.regionSubs[region.name]=w;
 const ceiling=Math.floor(Math.max(0,budget*CFG.tuning_engine.ceiling__001-(s.gameMarketReserved[region.name]||0))/(store.tier/CFG.tuning_engine.ceiling__002));const target=licensed.length?Math.floor(ceiling*clamp(CFG.tuning_engine.target__008+licensed.length*CFG.tuning_engine.target__009,CFG.tuning_engine.target__010,CFG.tuning_engine.target__011)):0;
 const next=w.subscribers<target?Math.min(target,w.subscribers+Math.ceil((target-w.subscribers)*CFG.tuning_engine.next__008)):Math.max(target,w.subscribers-Math.ceil((w.subscribers-target)*CFG.tuning_engine.next__009));
 w.churn+=Math.max(0,w.subscribers-next);w.subscribers=next;const gross=money(Math.min(Math.max(0,budget*CFG.tuning_engine.gross__001-(s.gameMarketReserved[region.name]||0)),next*store.tier/CFG.tuning_engine.gross__002));if(!gross)continue;
 bookConsumerReceipt(s,c,gross,'game-subscriptions','Paid game catalog subscriptions in '+region.name);
 w.gross=money(w.gross+gross);store.subscriptionGross=money(store.subscriptionGross+gross);
 s.gameMarketReserved[region.name]=money((s.gameMarketReserved[region.name]||0)+gross);
 store.history.push({week:s.week,region:region.name,subscribers:next,gross,licensed:licensed.length});if(store.history.length>CFG.tuning_engine.gameStoreWeek__004){store.history.shift();store.historyComplete=false;}
 }
 }}
function gameStoreReport(s,storeId){const store=gameStoreById(s,storeId);if(store.companyId!==s.playerId)throw new Error('Not your game storefront.');
 return {...store,licenses:gameWindows(s,storeId).map(w=>({...w,title:s.projects.find(x=>x.id===w.projectId)?.title||''})),
  note:'Subscription payments reserve real game audience budgets before other game purchases. Licensed games are not sold outside their effective rights.'};}
function auditVideoGames(s,problems){for(const p of s.projects||[])if(p.sector==='games'){
 const g=p.videoGame;if(!g||!GAME_PLATFORMS[g.platform]||g.generation<1||!Number.isInteger(g.bugs)||g.bugs<0||g.bugs>CFG.tuning_engine.auditVideoGames__001||
 !GAME_MECHANICS.includes(g.mechanic)||!GAME_MODELS.includes(g.model)||!Array.isArray(g.stages)||
 !Array.isArray(g.qaHistory)||!Array.isArray(g.communityActions)||!Array.isArray(g.support)||
 !Array.isArray(g.weeklySales)||g.weeklySales.some(x=>x.week> s.week||x.week<p.startWeek||x.gross<0)||
 (g.certification?.regions||[]).some(r=>!REGIONS.some(x=>x.name===r))||
 (p.status==='released'&&(!Array.isArray(g.launchRegions)||g.launchRegions.some(r=>!REGIONS.some(x=>x.name===r))))||
 !Number.isFinite(g.platformFees)||g.platformFees<0)problems.push(p.id+': invalid game production or sales provenance');
 }
 for(const store of s.gameStores||[]){if(!company(s,store.companyId)||store.startedWeek>(s.week)||store.startedWeek<(CFG.tuning_engine.auditVideoGames__002-1)*CFG.tuning_engine.auditVideoGames__003||
 !Number.isFinite(store.subscriptionGross)||store.subscriptionGross<0||!Array.isArray(store.history)||store.history.some(x=>x.week> s.week||x.gross<0)||
 Math.abs(Object.values(store.regionSubs||{}).reduce((n,x)=>n+x.gross,0)-store.subscriptionGross)>CFG.tuning_engine.auditVideoGames__004)problems.push('Invalid game store cash/subscriber history');}
 for(const w of s.gameStoreWindows||[]){const store=s.gameStores.find(x=>x.id===w.storeId),p=s.projects.find(x=>x.id===w.projectId),o=s.gameStoreOffers.find(x=>x.id===w.offerId);
 if(!store||!p||w.startWeek> s.week||w.endWeek<=w.startWeek||w.endWeek-w.startWeek>CFG.tuning_engine.auditVideoGames__005||w.ownerId!==p.companyId||p.sector!=='games'||
 w.grantId!==(p.grantId||null)||w.fee<0||w.share!==CFG.tuning_engine.auditVideoGames__006||w.ownerId!==store.companyId&&(!o||o.status!=='booked'||o.windowId!==w.id||o.acceptedFee!==w.fee||o.ownerId!==w.ownerId))problems.push('Invalid game digital distribution rights');}
 for(const e of s.gameExclusiveOffers||[]){const p=s.projects.find(x=>x.id===e.projectId),st=s.gameStores.find(x=>x.id===e.storeId);
 if(!p||!st||e.ownerId!==p.companyId||e.operatorId!==st.companyId||e.ownerId===e.operatorId||!['accepted','counter','declined','booked'].includes(e.status)||
 e.expiresWeek!==e.createdWeek+CFG.tuning_engine.auditVideoGames__007||e.createdWeek>s.week||![CFG.tuning_engine.auditVideoGames__008,CFG.tuning_engine.auditVideoGames__009,CFG.tuning_engine.auditVideoGames__010].includes(e.weeks)||e.proposedGrant<CFG.tuning_engine.auditVideoGames__011||e.counterGrant<CFG.tuning_engine.auditVideoGames__012||
 (e.status==='booked'&&(p.videoGame?.exclusiveStoreId!==e.storeId||p.videoGame?.exclusiveUntil!==e.activatedWeek+e.weeks||e.activatedWeek>s.week||e.acceptedGrant<=0)))problems.push('Invalid exclusive game contract or cash provenance');}
 for(const o of s.gameStoreOffers||[]){if(!s.gameStores.some(x=>x.id===o.storeId&&x.companyId===o.operatorId)||!s.projects.some(x=>x.id===o.projectId&&x.companyId===o.ownerId)||
 !['counter','accepted','declined','booked'].includes(o.status)||o.expiresWeek!==o.createdWeek+CFG.tuning_engine.auditVideoGames__013||o.createdWeek>s.week||
 o.proposedFee<CFG.tuning_engine.auditVideoGames__014||o.counterFee<CFG.tuning_engine.auditVideoGames__015||o.status==='accepted'&&o.acceptedFee!==o.counterFee&&o.acceptedFee!==o.proposedFee)problems.push('Invalid game store offer');}
}

// UPDATE 41: optional corporate financing and succession. Only the player root
// gets governance. Normal startups have NO board and retain ordinary controls.
// No equity or ownership event can grant, sell or transfer underlying IP.
const CAPITAL_POOL=CFG.rivals.CAPITAL_POOL;
function initialGovernance(s){
 if(!Number.isFinite(s.investorPool))s.investorPool=CAPITAL_POOL;
 if(!Number.isFinite(s.investorPoolOpening))s.investorPoolOpening=CAPITAL_POOL;
 if(!Number.isFinite(s.insurancePool))s.insurancePool=CFG.tuning_engine.initialGovernance__001;
 if(!Number.isFinite(s.insurancePoolOpening))s.insurancePoolOpening=CFG.tuning_engine.initialGovernance__002;
 if(!Array.isArray(s.insuranceFlows))s.insuranceFlows=[];
 if(!Array.isArray(s.governanceHistory))s.governanceHistory=[];
 if(!Array.isArray(s.careerLineage))s.careerLineage=[];
 if(!Array.isArray(s.personalMoneyHistory))s.personalMoneyHistory=[];
 if(!Number.isFinite(s.founderFunds))s.founderFunds=0;
 if(!s.runStatus)s.runStatus='active';
 if(!s.management)s.management={personId:s.founder.id,role:'founder-manager',status:'active',plannedSuccessorId:null,historyComplete:false};
 for(const c of s.companies||[])if(!c.corporate&&c.id===s.playerId){
  c.corporate={stage:'founder',baselineEquity:c.finance.equity,shares:{founder:CFG.tuning_engine.initialGovernance__003,investor:0,public:0},
   board:null,policy:{minCashWeeks:CFG.tuning_engine.initialGovernance__004,reviewLimit:CFG.tuning_engine.initialGovernance__005,maxDebtRatio:CFG.tuning_engine.initialGovernance__006},fundings:[],shareSales:[],dividends:[],resolutions:[],lineage:[{week:s.week,kind:'founded',companyId:c.id}],historyComplete:false};
 }
 for(const c of s.companies||[])if(c.corporate&&!c.corporate.insurance)c.corporate.insurance={active:false,startWeek:-1,premium:CFG.tuning_engine.initialGovernance__007,coveredCost:0,weeklyEvidence:[],premiumsPaid:0,claimsPaid:0};
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
  manager:{...s.management},founderFunds:s.founderFunds,policy:{...g.policy},recent:g.lineage.slice(-CFG.tuning_engine.corporateStatus__001),runStatus:s.runStatus};}
function corporateReadiness(s){const c=rootGoverned(s),f=c.finance;
 const checks={solvent:!c.bankrupt&&f.cash>=CFG.tuning_engine.checks__001&&f.payable<Math.max(CFG.tuning_engine.checks__002,f.cash*CFG.tuning_engine.checks__003),
  leadership:!!(c.teams||[]).find(t=>t.leaderId&&(s.employees||[]).some(e=>e.id===t.leaderId&&e.status==='employed')),
  accounting:Math.abs(companyBalance(c))<EPS&&s.reports!==null,
  independence:!c.parentId};
 return {checks,eligible:Object.values(checks).every(Boolean)&&c.corporate.stage==='founder',
  note:'Financial, leadership and record readiness, not an artificial company-size level.'};}
function corporationOnly(s){const c=rootGoverned(s);if(!['private-corporation','public-corporation'].includes(c.corporate.stage))throw new Error('Only an incorporated company has board and shareholder governance.');return c;}
function incorporateStudio(s){requireExecutiveControl(s);const c=rootGoverned(s),r=corporateReadiness(s);if(!r.eligible)throw new Error('Corporation readiness checklist not yet met.');
 const legal=CFG.tuning_engine.legal__001;if(c.finance.cash<legal+CFG.tuning_engine.incorporateStudio__001)throw new Error('Legal transition must protect operating cash.');
 expense(s,c,legal,'corporation-transition','Document real corporation readiness and legal conversion');
 c.corporate.stage='private-corporation';c.corporate.board=[{id:s.founder.id,role:'founder-director',orientation:'growth'},
 {id:c.id+':independent:1',role:'independent-director',orientation:'conservative'},
 {id:c.id+':independent:2',role:'independent-director',orientation:'balanced'}];
 c.corporate.historyComplete=true;
 governanceEvent(s,c,'incorporated',{legalCost:legal});news(s,c.name+' incorporates',
  CFG.events.messages.incorporateStudio__001,'company');
 return corporateStatus(s);}
function corporateValuation(s){const c=rootGoverned(s),f=c.finance;
 const tangible=money(Math.max(0,f.cash+(f.prepaid||0)+(f.receivable||0)+(f.inventory||0)+(f.investment||0)-f.payable-f.deferred-f.loanBalance));
 const underlying=s.ips.filter(i=>i.ownerId===c.id).length,earned=companyProfit(c);
 // Earnings are only a cautious proxy for near-term potential; market
 // confidence and leverage reduce the estimate, never company cash.
 const futureCashProxy=money(Math.min(CFG.tuning_engine.futureCashProxy__001,Math.max(0,earned)*CFG.tuning_engine.futureCashProxy__002));
 const marketConfidence=s.regionalEconomy?.[taxRegion(c).name]?.confidence||1;
 const leverage=clamp(f.loanBalance/Math.max(1,tangible+f.loanBalance),0,1);
 const outlookFactor=clamp(CFG.tuning_engine.outlookFactor__001+CFG.tuning_engine.outlookFactor__002*marketConfidence,CFG.tuning_engine.outlookFactor__003,CFG.tuning_engine.outlookFactor__004);
 const riskFactor=1-CFG.tuning_engine.riskFactor__001*leverage;
 const expected=money(Math.max(CFG.tuning_engine.expected__001,(tangible+futureCashProxy+Math.max(0,earned)*CFG.tuning_engine.expected__002+underlying*CFG.tuning_engine.expected__003+c.reputation*CFG.tuning_engine.expected__004)*outlookFactor*riskFactor));
 return {companyId:c.id,tangibleAssets:tangible,marketConfidence,futureCashProxy,leverage,
  conservative:money(expected*CFG.tuning_engine.corporateValuation__001),expected,optimistic:money(expected*CFG.tuning_engine.corporateValuation__002),
  founderShare:corporateStatus(s).ownership.founderShare,
  note:'Illustrative company valuation (not cash or sale proceeds): tangible net value, observed earnings and modest owned-IP potential; rights remain titled to legal owners.'};}
function corporateRisk(s){const c=rootGoverned(s),f=c.finance,p=c.corporate.policy,weekly=weeklyOverhead(c,s),cash=Math.max(0,f.cash);
 const obligations=money(f.payable+f.deferred+f.loanBalance),runway=cash/Math.max(1,weekly),v=corporateValuation(s);
 return {cashRunwayWeeks:money(runway),liabilities:obligations,loanToValue:money(f.loanBalance/Math.max(1,v.expected)),
  cashBuffer:money(weekly*p.minCashWeeks),policy:{...p},
  scenarios:{conservative:money(Math.max(0,cash-weekly*CFG.tuning_engine.corporateRisk__001-obligations*CFG.tuning_engine.corporateRisk__002)),expected:money(Math.max(0,cash-weekly*CFG.tuning_engine.corporateRisk__003-obligations*CFG.tuning_engine.corporateRisk__004)),optimistic:money(Math.max(0,cash-weekly*CFG.tuning_engine.corporateRisk__005))},
  warning:runway<p.minCashWeeks||f.loanBalance/Math.max(1,v.expected)>p.maxDebtRatio};}
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
function launchIPO(s,amount=CFG.tuning_engine.launchIPO__001){requireExecutiveControl(s);const c=corporationOnly(s);
 if(c.corporate.stage==='public-corporation')throw new Error('Company is already publicly listed.');
 if(yearAt(s.week)<CFG.tuning_engine.launchIPO__002)throw new Error('Simplified public markets do not mature until World Year 25.');
 if(!c.teams.length||c.reputation<CFG.tuning_engine.launchIPO__003||c.bankrupt)throw new Error('Company is not eligible for public listing.');
 const approval=boardVote(s,'ipo',Number(amount));if(!approval.approved)throw new Error('Board rejected public listing.');
 const fee=CFG.tuning_engine.fee__014;if(c.finance.cash<fee+CFG.tuning_engine.launchIPO__004)throw new Error('Cannot finance the listing and maintain operating reserves.');
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
 if(corporateStatus(s).ownership.founderShare<CFG.tuning_engine.sellFounderShares__001&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {shares,proceeds,founderVoteShare:corporateStatus(s).ownership.founderShare};}
function payDividend(s,amount){requireExecutiveControl(s);const c=corporationOnly(s),f=c.finance,q=money(Number(amount)),g=c.corporate;
 if(!Number.isFinite(Number(amount))||q<CFG.tuning_engine.payDividend__001||companyProfit(c)<q||f.cash<q+weeklyOverhead(c,s)*CFG.tuning_engine.payDividend__002)throw new Error('Dividend requires distributable lifetime profit and cash reserves.');
 const sum=g.shares.founder+g.shares.investor+g.shares.public,personal=money(q*g.shares.founder/sum);
 transact(s,c,'paid-equity-distribution',{cash:-q,equity:-q},'Cash distributed to all shareholders in legal proportion');
 s.founderFunds=money(s.founderFunds+personal);g.dividends.push({week:s.week,amount:q,founderReceived:personal});
 s.personalMoneyHistory.push({week:s.week,kind:'dividend',amount:personal,companyId:c.id});
 governanceEvent(s,c,'dividend',{amount:q,founderReceived:personal});return {total:q,founderReceived:personal};}
function planLeadership(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=CFG.tuning_engine.planLeadership__001||e.skill<CFG.tuning_engine.planLeadership__002||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Only an eligible current team leader may be nominated.');
 s.management.plannedSuccessorId=e.id;governanceEvent(s,c,'successor-nominated',{personId:e.id});return {nomineeId:e.id,name:e.name,eligible:true};}
function chooseLeader(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=CFG.tuning_engine.chooseLeader__001||e.skill<CFG.tuning_engine.chooseLeader__002||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Successor must be a legally eligible employed leader.');
 if(c.corporate.stage!=='founder'&&!boardVote(s,'succession',0).approved)throw new Error('Corporate board rejected executive appointment.');
 s.management.personId=e.id;s.management.role='appointed-executive';s.management.status='active';s.management.plannedSuccessorId=null;
 governanceEvent(s,c,'executive-appointed',{personId:e.id});
 news(s,'Executive succession at '+c.name,e.name+' takes the management role. All shares, voting rights, underlying IP, contracts and liabilities stay legally unchanged.','company');
 return {...s.management};}
function stepDown(s){const c=rootGoverned(s);s.management.status='transition';governanceEvent(s,c,'executive-vacancy',{personId:s.management.personId});
 alert(s,'career-transition-'+c.id,CFG.events.messages.stepDown__001,CFG.events.messages.stepDown__002,'critical');
 return {...s.management};}
function contestExecutiveControl(s){const c=corporationOnly(s),own=corporateStatus(s).ownership;
 if(s.management.status==='removed')return {...s.management};
 if(own.founderShare>=CFG.tuning_engine.contestExecutiveControl__001)throw new Error('Founder voting control has not been lost.');
 s.management.status='removed';governanceEvent(s,c,'shareholder-removal',{formerManagerId:s.management.personId});
 alert(s,'management-control-'+c.id,CFG.events.messages.contestExecutiveControl__001,CFG.events.messages.contestExecutiveControl__002,'critical');
 return {...s.management};}
function startFreshCompany(s,data={}){const old=rootGoverned(s),capital=money(Number(data.capital)),sector=String(data.sector||'publishing'),name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__003);
 if(s.runStatus==='ended'||!['removed','transition'].includes(s.management.status))throw new Error('A lawful exit or loss of management control is required before a new-company continuation.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('New company cannot predate its worldwide industry.');
 const severityReserve=s.settings.difficulty==='challenging'?CFG.tuning_engine.severityReserve__001:s.settings.difficulty==='casual'?CFG.tuning_engine.severityReserve__002:CFG.tuning_engine.severityReserve__003;
 if(!Number.isFinite(Number(data.capital))||capital<SECTORS[sector].cost*severityReserve||capital>s.founderFunds||capital<=0)throw new Error('New firm requires independently documented founder funds and difficulty-adjusted sector startup reserves.');
 if(name.length<CFG.tuning_engine.startFreshCompany__001||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct new-company name.');
 if(s.founder.age>=CFG.tuning_engine.startFreshCompany__002)throw new Error('Founder is no longer legally available to manage a new company.');
 const neu=createCompany(s,{name,sector,origin:'Independent continuation',cash:capital,capacity:1,foundedYear:yearAt(s.week),homeRegion:old.homeRegion,isPlayer:true});
 old.isPlayer=false;s.playerId=neu.id;s.founderFunds=money(s.founderFunds-capital);
 s.personalMoneyHistory.push({week:s.week,kind:'new-company-capital',amount:-capital,companyId:neu.id});
 neu.corporate={stage:'founder',baselineEquity:capital,shares:{founder:CFG.tuning_engine.startFreshCompany__003,investor:0,public:0},board:null,
  policy:{minCashWeeks:CFG.tuning_engine.startFreshCompany__004,reviewLimit:CFG.tuning_engine.startFreshCompany__005,maxDebtRatio:CFG.tuning_engine.startFreshCompany__006},fundings:[],shareSales:[],dividends:[],resolutions:[],lineage:[{week:s.week,kind:'new-independent-company',companyId:neu.id}],historyComplete:true};
 s.careerLineage.push({week:s.week,fromId:old.id,toId:neu.id,capital,kind:'fresh-company'});
 s.management={personId:s.founder.id,role:'founder-manager',status:'active',plannedSuccessorId:null,historyComplete:true};
 s.runStatus='active';governanceEvent(s,neu,'independent-continuation',{fromId:old.id,capital});
 news(s,'New independent company: '+name,'Personally funded start with no asset, title, team, contract or liability transfer from '+old.name+'.','company');return neu;}
function endRun(s){if(s.runStatus==='ended')throw new Error('Run already concluded.');const c=rootGoverned(s);s.runStatus='ended';governanceEvent(s,c,'run-ended',{personId:s.management.personId});return {status:'ended',companyId:c.id,year:yearAt(s.week)};}
function careerHistory(s){return {runStatus:s.runStatus,founder:{...s.founder},executive:{...s.management},personalFunds:s.founderFunds,
 events:s.governanceHistory.slice(-CFG.tuning_engine.careerHistory__001),continuations:s.careerLineage.slice(),difficulty:s.settings.difficulty};}
function reviewFounderTransition(s){
 if(!s.management||s.runStatus==='ended'||s.management.status!=='active')return;
 if(s.management.personId!==s.founder.id){
  const executive=(s.employees||[]).find(e=>e.id===s.management.personId&&e.status==='employed'&&e.employerId===s.playerId);
  if(!executive){s.management.status='transition';alert(s,'executive-departure-'+s.playerId,CFG.events.messages.reviewFounderTransition__001,
    CFG.events.messages.reviewFounderTransition__002,'critical');
    governanceEvent(s,player(s),'executive-departed',{personId:s.management.personId});}
  return;
 }

 const threshold=s.settings.difficulty==='challenging'?CFG.tuning_engine.threshold__001:s.settings.difficulty==='casual'?CFG.tuning_engine.threshold__002:CFG.tuning_engine.threshold__003;
 if(s.founder.age>=threshold){s.management.status='transition';alert(s,'successor-due-'+s.playerId,CFG.events.messages.reviewFounderTransition__003,
 CFG.events.messages.reviewFounderTransition__004,'critical');
 governanceEvent(s,player(s),'succession-due',{age:s.founder.age});}}
function auditGovernance(s,problems){if(!player(s)?.corporate)problems.push('Missing player company governance identity');
 if(!Number.isFinite(s.investorPool)||s.investorPool<-CFG.tuning_engine.auditGovernance__001||!Number.isFinite(s.investorPoolOpening)||
 !Array.isArray(s.governanceHistory)||!Array.isArray(s.personalMoneyHistory)||!Array.isArray(s.careerLineage)||!Number.isFinite(s.founderFunds)||s.founderFunds<-CFG.tuning_engine.auditGovernance__002||
 !['active','ended'].includes(s.runStatus)||!s.management||!['active','transition','removed'].includes(s.management.status)){
 problems.push('Invalid governance and career records');return;}
 let financing=0,usedShares=0;
 for(const c of s.companies){const g=c.corporate;if(!g)continue;
 const st=['founder','private-corporation','public-corporation'].includes(g.stage),sh=g.shares,
 sum=Object.values(sh||{}).reduce((n,x)=>n+x,0),founder=Number.isInteger(sh?.founder)&&sh.founder>=0;
 if(!st||!founder||!Number.isInteger(sh.investor)||sh.investor<0||!Number.isInteger(sh.public)||sh.public<0||sum<1||
 g.stage==='founder'&&g.board!==null||g.stage!=='founder'&&(!Array.isArray(g.board)||g.board.length!==CFG.tuning_engine.auditGovernance__003)||
 !g.policy||!Number.isInteger(g.policy.reviewLimit)||g.policy.reviewLimit<CFG.tuning_engine.auditGovernance__004||g.policy.minCashWeeks<CFG.tuning_engine.auditGovernance__005||g.policy.minCashWeeks>CFG.tuning_engine.auditGovernance__006||
 g.policy.maxDebtRatio<CFG.tuning_engine.auditGovernance__007||g.policy.maxDebtRatio>1||!Array.isArray(g.fundings)||!Array.isArray(g.shareSales)||!Array.isArray(g.dividends)||!Array.isArray(g.resolutions)||!Array.isArray(g.lineage))
 problems.push('Invalid corporate share ledger or governance board');
 let issued=0,netSaleShares=0,distribution=0;
 for(const f of g.fundings||[]){if(!['investor','public'].includes(f.kind)||!Number.isInteger(f.shares)||f.shares<=0||f.amount<CFG.tuning_engine.auditGovernance__008||f.week>s.week)problems.push('Invalid issued equity funding');issued=money(issued+f.amount);netSaleShares+=f.shares;}
 for(const f of g.shareSales||[]){if(!Number.isInteger(f.shares)||f.shares<1||f.proceeds<0||f.week>s.week)problems.push('Invalid personal share sale');}
 for(const d of g.dividends||[]){if(d.amount<=0||d.founderReceived<0||d.founderReceived>d.amount||d.week>s.week)problems.push('Invalid shareholder distribution');distribution=money(distribution+d.amount);}
 if(sum!==CFG.tuning_engine.auditGovernance__009+netSaleShares)problems.push('Invalid share issuance conservation');
 if(g.stage!=='founder'&&Math.abs(c.finance.equity-money(g.baselineEquity+issued-distribution))>CFG.tuning_engine.auditGovernance__010)problems.push('Invalid company paid-in equity bridge');
 for(const r of g.resolutions||[])if(!['expansion','financing','succession','ipo','investment','restructuring'].includes(r.kind)||r.expiresWeek!==r.week+CFG.tuning_engine.auditGovernance__011||r.week>s.week||!Array.isArray(r.votes)||r.votes.length!==CFG.tuning_engine.auditGovernance__012||r.approved!== (r.votes.filter(v=>v.vote==='yes').length>=CFG.tuning_engine.auditGovernance__013))problems.push('Invalid board resolution votes');
 financing+=issued;usedShares+=(g.shareSales||[]).reduce((n,x)=>n+x.proceeds,0);
 }
 if(Math.abs(money(s.investorPoolOpening-s.investorPool-financing-usedShares))>CFG.tuning_engine.auditGovernance__014)problems.push('Invalid investor capital pool conservation');
 if(!Number.isFinite(s.insurancePool)||s.insurancePool<-CFG.tuning_engine.auditGovernance__015||!Number.isFinite(s.insurancePoolOpening)||!Array.isArray(s.insuranceFlows))problems.push('Invalid funded insurance reserve');
 else {let balance=s.insurancePoolOpening;for(const f of s.insuranceFlows){
   const c=s.companies.find(c=>c.id===f.companyId);if(!c?.corporate?.insurance||!['premium','claim'].includes(f.kind)||f.amount<=0||f.week>s.week)problems.push('Invalid insurance claim or premium source');
   balance+=f.kind==='premium'?f.amount:-f.amount;}
 if(Math.abs(money(balance-s.insurancePool))>CFG.tuning_engine.auditGovernance__016)problems.push('Invalid insurer pool conservation');
 for(const c of s.companies)if(c.corporate?.insurance){const i=c.corporate.insurance;
  const prem=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='premium').reduce((n,f)=>n+f.amount,0)),
        claim=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='claim').reduce((n,f)=>n+f.amount,0));
  if(Math.abs(prem-i.premiumsPaid)>CFG.tuning_engine.auditGovernance__017||Math.abs(claim-i.claimsPaid)>CFG.tuning_engine.auditGovernance__018||i.coveredCost<0||!Array.isArray(i.weeklyEvidence))problems.push('Invalid company insurance evidence');
 }}
 const personal=money(s.personalMoneyHistory.reduce((n,x)=>n+x.amount,0));
 if(Math.abs(personal-s.founderFunds)>CFG.tuning_engine.auditGovernance__019)problems.push('Invalid founder personal capital provenance');
 for(const h of s.careerLineage)if(!s.companies.some(c=>c.id===h.fromId)||!s.companies.some(c=>c.id===h.toId)||h.week>s.week)problems.push('Invalid company lineage');
}

// UPDATE 42A — living rivals. Corporate strategies spend existing funds;
// founder-funded new firms draw from a finite external capital pool.
const RIVAL_STYLES=CFG.rivals.RIVAL_STYLES;
const RIVAL_GOALS=CFG.rivals.RIVAL_GOALS;
function ensure42A(s){
 if(!Array.isArray(s.rivalEvents))s.rivalEvents=[];
 if(!Number.isFinite(s.entrepreneurPool))s.entrepreneurPool=money(CFG.tuning_engine.ensure42A__001*(s.settings.populationScale||1));
 if(!s.institutions)s.institutions={bank:'Civic Credit Consortium',agency:'Creators Guild Network',regulator:'Regional Commerce Authority',active:true,historyComplete:s.version>=CFG.tuning_engine.ensure42A__002};
 for(const c of s.companies){
  if(c.isPlayer||c.parentId===s.playerId)continue;
  if(!c.aiIdentity){const h=hash(s.seed+':persona:'+c.id);c.aiIdentity={style:RIVAL_STYLES[h%CFG.tuning_engine.ensure42A__003],risk:CFG.tuning_engine.ensure42A__004+(h%CFG.tuning_engine.ensure42A__005)*CFG.tuning_engine.ensure42A__006,specialty:GENRES[(h>>>CFG.tuning_engine.ensure42A__007)%GENRES.length],foundedBy:'Independent founders',historyComplete:!c.bankrupt};}
  if(!c.aiPlan)rivalAnnualPlan(s,c);
 }
}
function rivalAnnualPlan(s,c){
 if(!c.aiIdentity)return null;
 const age=yearAt(s.week)-c.foundedYear,style=c.aiIdentity.style;
 const goal=style==='cautious'?'specialize':style==='creator-led'?'technology':style==='expansionist'?'capacity':'partnerships';
 const cash=c.finance.cash,needed=SECTORS[c.sector].cost*CFG.tuning_engine.needed__002+weeklyOverhead(c,s)*CFG.tuning_engine.needed__003;
 const plan={issuedWeek:s.week,reviewWeek:s.week+CFG.tuning_engine.plan__003,endWeek:s.week+CFG.tuning_engine.plan__004*(CFG.tuning_engine.plan__005+(hash(c.id+':'+yearAt(s.week))%CFG.tuning_engine.plan__006)),
  goal,sector:c.sector,genre:c.aiIdentity.specialty,riskTolerance:c.aiIdentity.risk,
  budgetCeiling:money(Math.max(0,Math.min(cash*CFG.tuning_engine.plan__007,Math.max(0,cash-needed)))),
  source:'private-company-plan',forecastBasis:'own cash and prior sales; future market behavior uncertain',
  ageAtIssue:age};
 c.aiPlan=plan;return plan;
}
function rivalEvent(s,c,kind,detail){
 const e={id:id(s,'rival_event'),week:s.week,companyId:c.id,kind,detail};s.rivalEvents.push(e);
 if(s.rivalEvents.length>CFG.tuning_engine.rivalEvent__001)s.rivalEvents.splice(0,s.rivalEvents.length-CFG.tuning_engine.rivalEvent__002);
 return e;
}
function rivalQuarterly(s){
 if(s.week%CFG.tuning_engine.rivalQuarterly__001!==0)return;
 ensure42A(s);
 for(const c of s.companies){
  if(c.isPlayer||c.parentId===s.playerId||c.bankrupt||!c.aiIdentity)continue;
  if(s.week>=c.aiPlan.reviewWeek)rivalAnnualPlan(s,c);
  const p=c.aiPlan, cash=c.finance.cash,buffer=weeklyOverhead(c,s)*CFG.tuning_engine.buffer__002;
  if(p.goal==='capacity'&&c.capacity<CFG.tuning_engine.rivalQuarterly__002&&cash>SECTORS[c.sector].cost*CFG.tuning_engine.rivalQuarterly__003+buffer&&s.projects.filter(x=>x.companyId===c.id&&x.status==='active').length>=c.capacity-1){
   const price=money(CFG.tuning_engine.price__001*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
   if(cash>price+buffer){expense(s,c,price,'rival-expansion','Cash-funded rival team expansion');
     c.capacity++;c.teamLevel++;const team=newTeam(s,c,c.teams.length,p.genre);c.teams.push(team);
     rivalEvent(s,c,'expansion',{teamId:team.id,cost:price});news(s,c.name+' opens another production team','The rival added funded capacity to its '+SECTORS[c.sector].name+' operation.','competitor');}
  }
  if(p.goal==='technology'&&cash>buffer+CFG.tuning_engine.rivalQuarterly__004){
   const tech=businessTechnology(s,c.id,c.sector);
   if(tech.canUpgrade&&tech.upgradeCost<=p.budgetCeiling){const adopted=adoptTechnologyForRival(s,c,c.sector);
     if(adopted)rivalEvent(s,c,'tech-investment',{sector:c.sector,cost:adopted.cost,wave:adopted.wave});}
  }
  if(p.goal==='partnerships'&&cash>buffer+CFG.tuning_engine.rivalQuarterly__005&&rand(s)<CFG.tuning_engine.rivalQuarterly__006){
   // Intent only; no unconsented license or transfer. Real contracts remain
   // exclusively governed by existing bilateral rights/commission engines.
   rivalEvent(s,c,'partner-search',{sector:c.sector});
  }
 }
}
function rivalYearlyPopulation(s){
 if(s.week%CFG.tuning_engine.rivalYearlyPopulation__001!==0)return;
 const alive=s.companies.filter(c=>!c.isPlayer&&!c.parentId&&!c.bankrupt);
 const wanted=Math.min(CFG.tuning_engine.wanted__001,Math.max(s.settings.aiCount||CFG.tuning_engine.wanted__002,CFG.tuning_engine.wanted__003));
 if(alive.length>=wanted||s.companies.length>=CFG.tuning_engine.rivalYearlyPopulation__002||s.entrepreneurPool<CFG.tuning_engine.rivalYearlyPopulation__003)return;
 const choices=Object.keys(SECTORS).filter(sec=>available(sec,s.week));
 const sec=choices[hash(s.seed+':entrants:'+yearAt(s.week))%choices.length];
 const capital=money(Math.min(s.entrepreneurPool,CFG.tuning_engine.capital__001+SECTORS[sec].cost*CFG.tuning_engine.capital__002));
 if(capital<CFG.tuning_engine.rivalYearlyPopulation__004)return;
 s.entrepreneurPool=money(s.entrepreneurPool-capital);
 const newcomer=createCompany(s,{name:'New Horizon '+yearAt(s.week)+' '+(s.sequence%CFG.tuning_engine.newcomer__001),sector:sec,foundedYear:yearAt(s.week),cash:capital,reputation:CFG.tuning_engine.newcomer__002,capacity:1,homeRegion:REGIONS[s.sequence%REGIONS.length].name});
 ensure42A(s);rivalEvent(s,newcomer,'founder-funded-entry',{capital,source:'finite-entrepreneur-equity'});
 news(s,newcomer.name+' enters '+SECTORS[sec].name,'A newly formed rival enters with '+shortMoney(capital)+' in finite founder capital, not free recurring income.','competitor');
}
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
function assignTeamDivision(s,teamId,divisionId=null){
 requireExecutiveControl(s);ensure42B(s);
 const c=controlledCompanies(s).find(c=>c.teams.some(t=>t.id===teamId));if(!c||divisionId!==null&&!c.divisions.some(d=>d.id===divisionId&&d.active))throw new Error('Team/division must belong to the same controlled company.');
 const team=c.teams.find(t=>t.id===teamId);team.divisionId=divisionId;return {teamId,divisionId};
}
function divisionPerformance(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company.');ensure42B(s);
 const groups=[...c.divisions.filter(x=>x.active),{id:null,name:'Unassigned teams'}];
 return groups.map(d=>{const teams=c.teams.filter(t=>t.divisionId===d.id);
  const projects=s.projects.filter(p=>p.companyId===c.id&&teams.some(t=>t.id===p.teamId));
  return {divisionId:d.id,name:d.name,teamIds:teams.map(x=>x.id),projectCount:projects.length,
   directRevenue:money(projects.reduce((n,p)=>n+p.directRevenue,0)),directCost:money(projects.reduce((n,p)=>n+p.directCost,0)),
   directContribution:money(projects.reduce((n,p)=>n+currentProjectProfit(p),0)),
   allocatedOverhead:money(projects.reduce((n,p)=>n+(p.overheadAttributed||0),0)),
   note:'A non-legal management slice. Shared corporate expenses remain separately disclosed and do not transfer company cash.'};});
}
function setCentralService(s,name,enabled,companyId=s.playerId){
 requireExecutiveControl(s);ensure42B(s);const c=controlledCompanies(s).find(c=>c.id===companyId),item=CENTRAL_SERVICES[name];
 if(!c||!item||typeof enabled!=='boolean')throw new Error('Invalid managed company or central service.');
 if(enabled&&c.finance.cash<item.weekly*CFG.tuning_engine.setCentralService__001+estimateWeeklyPayroll(s,c.id)*CFG.tuning_engine.setCentralService__002)throw new Error('Not enough cash to finance this recurring service.');
 c.sharedServices[name]=enabled;return {companyId:c.id,service:name,enabled,weeklyCost:item.weekly};
}
function settleCentralServices(s){
 for(const c of s.companies){if(c.bankrupt)continue;
  for(const [name,settings] of Object.entries(CENTRAL_SERVICES))if(c.sharedServices?.[name]){
   expense(s,c,settings.weekly,'corporate-service',settings.label+' — real weekly shared overhead');
  }
  if(s.week%CFG.tuning_engine.settleCentralServices__001===0&&c.sharedServices?.hr)for(const person of s.employees||[])if(person.employerId===c.id&&person.status==='employed')person.morale=clamp(person.morale+1,CFG.tuning_engine.settleCentralServices__002,CFG.tuning_engine.settleCentralServices__003);
  if(s.week%CFG.tuning_engine.settleCentralServices__004===0&&c.sharedServices?.legal&&c.id===s.playerId){
   const expires=s.grants.find(g=>g.holderId===c.id&&g.endWeek>s.week&&g.endWeek<=s.week+CFG.tuning_engine.expires__001&&g.type==='license');
   if(expires)alert(s,'legal-advance-'+expires.id,CFG.events.messages.settleCentralServices__001,CFG.events.messages.settleCentralServices__002,'advisory');
  }
 }
}
function groupFinanceReport(s,rootId=s.playerId){ensure42B(s);
 const c=company(s,rootId);if(!c)throw new Error('Unknown reporting group.');
 const members=controlledCompanies(s,rootId),entityReports=members.map(x=>({companyId:x.id,name:x.name,financial:financialStatements(s,x.id),
  divisions:divisionPerformance(s,x.id),services:Object.entries(CENTRAL_SERVICES).filter(([k])=>x.sharedServices[k]).map(([k,v])=>({...v,type:k}))}));
 return {groupId:rootId,entities:entityReports,consolidated:consolidatedStatements(s,rootId),
  explanation:'Legal entities retain their exact cash, bank debt and obligations. Intragroup settlements are eliminated only on consolidated views.'};
}
const _createGame42A=createGame;
createGame=function(input){const s=_createGame42A(input);ensure42B(s);return s;};
const _loadState42A=loadState;
loadState=function(raw){const s=_loadState42A(raw);ensure42B(s);return s;};
const _singleWeek42A=singleWeek;
singleWeek=function(s){_singleWeek42A(s);settleCentralServices(s);};
const _audit42A=audit;
audit=function(s){const errs=_audit42A(s);
 for(const l of s.creditLines||[]){const c=company(s,l.companyId);
  if(!c||l.limit<CFG.tuning_engine.topLevel__001||l.openingWeek>s.week||l.expiresWeek-l.openingWeek!==CFG.tuning_engine.topLevel__002||l.fee<0||!Number.isFinite(l.interestRate)||l.interestRate<0||l.interestRate>CFG.tuning_engine.topLevel__003||creditLineStatus(s,l.id).outstanding>l.limit+CFG.tuning_engine.topLevel__004)errs.push('Invalid funding facility: '+l.id);}
 for(const c of s.companies)if(c.divisions){const ids=new Set(c.divisions.map(d=>d.id));if(ids.size!==c.divisions.length||c.teams.some(t=>t.divisionId&&!ids.has(t.divisionId)))errs.push(c.id+': invalid division ownership');}
 return errs;};

// UPDATE 42C — conservative asset-vs-company deals, funded acquisitions,
// lawful existing-rights continuation and consolidated group eliminations.
function ensure42C(s){
 if(!Array.isArray(s.diligenceRecords))s.diligenceRecords=[];
 if(!Array.isArray(s.acquisitionHistory))s.acquisitionHistory=[];
 if(!Array.isArray(s.groupLicenseHistory))s.groupLicenseHistory=[];
 if(!Array.isArray(s.integrationHistory))s.integrationHistory=[];
}
// Existing co-financing remains valid when its signatories later change
// shareholders. New intragroup co-financing is still prohibited at signing.
function validInheritedCoProduction(s,d){
 return [d.producerId,d.sponsorId].every(id=>{
  const c=company(s,id);
  if(!c)return false;
  if(!c.parentId)return true;
  return (s.acquisitionHistory||[]).some(a=>a.kind==='company'&&a.targetId===c.id&&a.week>=d.signedWeek);
 });
}
function acquisitionValue(c){const f=c.finance;
 return money(f.cash+(f.receivable||0)+(f.prepaid||0)+(f.inventory||0)+(f.investment||0)-(f.payable||0)-(f.deferred||0)-(f.loanBalance||0));}
function companyPurchaseQuote(s,targetId){
 const buyer=player(s),target=company(s,targetId);
 if(!target||target.id===buyer.id||target.isPlayer||target.parentId||s.companies.some(x=>x.parentId===target.id))throw new Error('Choose a distinct, independent company to acquire.');
 if(target.corporate&&target.corporate.stage!=='founder')throw new Error('External shareholders require a negotiated controlling-interest purchase not supported by this deal.');
 const book=acquisitionValue(target),operational=money(Math.max(0,target.finance.revenue-target.finance.expense)),
  ask=money(Math.max(CFG.tuning_engine.ask__003,book+Math.max(CFG.tuning_engine.ask__004,target.reputation*CFG.tuning_engine.ask__005+operational*CFG.tuning_engine.ask__006)));
 const minReserve=money(weeklyOverhead(buyer,s)*CFG.tuning_engine.minReserve__001+CFG.tuning_engine.minReserve__002),shortfall=money(Math.max(0,ask+minReserve-buyer.finance.cash));
 const credit=(s.creditLines||[]).filter(x=>x.companyId===buyer.id).map(l=>creditLineStatus(s,l.id)).filter(x=>x.open&&x.available>=shortfall);
 const inspected=(s.diligenceRecords||[]).some(x=>x.key==='company:'+targetId);
 return {targetId,kind:'shares',ask,bookNetAssets:inspected?book:null,expectedGoodwill:inspected?money(ask-book):null,
  cashRequired:ask,operatingReserve:minReserve,shortfall,creditLineIds:credit.map(x=>x.id),
  sector:target.sector,historyComplete:!!target.annualBaseline,
  note:'100% company equity purchase; no IP/work is reassigned. Target keeps all existing debt, employees, approvals, royalties, legal title and outstanding obligations.'};
}
function assetPurchaseQuote(s,{type='ip',id:assetId}={}){
 const buyer=player(s);
 const asset=type==='ip'?s.ips.find(x=>x.id===assetId):type==='work'?s.works.find(x=>x.id===assetId):null;
 if(!asset)throw new Error('Unknown IP or released-work asset.');
 const owner=company(s,asset.ownerId);if(!owner||owner.id===buyer.id||owner.parentId===buyer.id||owner.bankrupt&&owner.finance.cash<-CFG.tuning_engine.assetPurchaseQuote__001)
  throw new Error('Choose an independently owned external asset.');
 const grants=s.grants.filter(g=>g.ipId===(type==='ip'?asset.id:asset.ipId)),
  reserved=s.rightsOffers.filter(o=>o.ipId===(type==='ip'?asset.id:asset.ipId)),
  manuscript=s.manuscripts?.some(m=>m.ipId===(type==='ip'?asset.id:asset.ipId));
 const blocked=type==='ip'&&(grants.length>0||reserved.length>0||manuscript);
 const price=money(type==='ip'?CFG.tuning_engine.price__002+Math.min(CFG.tuning_engine.price__003,(asset.works?.length||0)*CFG.tuning_engine.price__004+owner.reputation*CFG.tuning_engine.price__005):
  CFG.tuning_engine.price__006+Math.max(0,s.projects.find(p=>p.id===asset.projectId)?.stats?.totalSales||0)*CFG.tuning_engine.price__007);
 return {kind:type,assetId,ownerId:owner.id,title:asset.name||asset.title,price,allowed:!blocked,
  encumbrances:grants.length,pendingOffers:reserved.length,manuscript:!!manuscript,
  includesUnderlyingIP:type==='ip',includesFinishedWork:type==='work',
  note:type==='work'?'Acquiring the completed work DOES NOT confer source-IP adaptations or extra distribution windows.':'Only a clean source title transfers. Any existing grant or offer blocks this simplified asset deal rather than silently stripping valid contracts.'};
}
function acquisitionDiligence(s,{kind='company',id:targetId}={},investigate=false){
 ensure42C(s);const c=kind==='company'?company(s,targetId):null;
 const asset=kind!=='company'?assetPurchaseQuote(s,{type:kind,id:targetId}):null;
 if(kind==='company'&&(!c||c.isPlayer||c.parentId))throw new Error('Choose an independently owned acquisition target.');
 if(!['company','ip','work'].includes(kind))throw new Error('Unknown diligence type.');
 const key=kind+':'+targetId;let ticket=s.diligenceRecords.find(r=>r.key===key);
 if(investigate&&!ticket){requireExecutiveControl(s);const buyer=player(s),fee=CFG.tuning_engine.fee__016;
  if(buyer.finance.cash<fee+weeklyOverhead(buyer,s)*CFG.tuning_engine.acquisitionDiligence__001)throw new Error('Insufficient cash for commercial title and debt inspection.');
  expense(s,buyer,fee,'acquisition-diligence','Funded review of real contracts and debt');
  ticket={id:id(s,'diligence'),key,companyId:buyer.id,week:s.week,fee};s.diligenceRecords.push(ticket);
 }
 if(kind!=='company')return {kind,asset,inspected:!!ticket,risks:asset.encumbrances>0?['Existing rights grants or options restrict title transfer']:[],source:'known registry facts'};
 const publicInfo=rivalIntelligence(s,c.id),debt=money(c.finance.loanBalance||0),trade=money(c.finance.payable||0);
 const conditions=!!ticket?{debt,unpaidBills:trade,cash:c.finance.cash,
  ownedIPs:s.ips.filter(i=>i.ownerId===c.id).map(x=>x.id),activeGrants:s.grants.filter(g=>g.grantorId===c.id||g.holderId===c.id).map(x=>x.id),
  activeProjects:s.projects.filter(p=>p.companyId===c.id&&p.status==='active').map(x=>x.id),source:'paid diligence — known'}:
  {debt:null,unpaidBills:null,cash:null,ownedIPs:null,activeGrants:null,activeProjects:null,source:'private — not yet inspected'};
 return {kind,targetId,publicInfo,conditions,inspected:!!ticket,quote:companyPurchaseQuote(s,c.id),
  risks:[...(c.bankrupt?['Insolvent owner: staff and rights remain, but operations require legitimate recapitalization']:[]),
   ...(debt>0&&ticket?['Existing bank principal and contract repayments survive']:[]),
   ...(trade>0&&ticket?['Unpaid supplier/creator obligations survive']:[])]};
}
function spendAcquisition(s,amount,financeWith='cash',creditLineId=null){
 const buyer=player(s),minCash=money(weeklyOverhead(buyer,s)*CFG.tuning_engine.minCash__001+CFG.tuning_engine.minCash__002),gap=money(Math.max(0,amount+minCash-buyer.finance.cash));
 if(gap>0){if(financeWith!=='line')throw new Error('Purchase would breach payroll or solvency reserve; choose a funded credit line or smaller deal.');
  const lineId=creditLineId||(s.creditLines||[]).find(l=>l.companyId===buyer.id&&creditLineStatus(s,l.id).available>=gap)?.id;
  if(!lineId||creditLineStatus(s,lineId).companyId!==buyer.id||creditLineStatus(s,lineId).available<gap)
   throw new Error('No valid external bank facility can cover the acquisition cash shortfall.');
  drawCreditLine(s,lineId,gap);
 }
 if(buyer.finance.cash<amount+minCash-CFG.tuning_engine.spendAcquisition__001)throw new Error('Company does not have a protected post-deal cash reserve.');
 return {borrowed:gap};
}
function acquireCompany(s,targetId,{price,financeWith='cash',creditLineId=null}={}){
 requireExecutiveControl(s);ensure42C(s);
 const quote=companyPurchaseQuote(s,targetId),bid=money(Number(price??quote.ask)),buyer=player(s),target=company(s,targetId),actualBook=acquisitionValue(target);
 if((s.coProductions||[]).some(d=>[d.producerId,d.sponsorId].includes(targetId)&&[d.producerId,d.sponsorId].some(id=>id!==targetId&&controlledCompanies(s).some(c=>c.id===id))))throw new Error('Existing funding partnership with this group requires separate elimination; this simplified acquisition is not available.');
 if(!Number.isFinite(Number(price??quote.ask))||bid<quote.ask||bid<actualBook||bid>CFG.tuning_engine.acquireCompany__001)
   throw new Error('Owners have not accepted a funded offer at or above the defensible book-value floor.');
 if(s.companies.filter(c=>c.parentId===buyer.id).length>=CFG.tuning_engine.acquireCompany__002)throw new Error('Maximum five controlled subsidiaries.');
 boardMandate(s,'expansion',bid);
 const financing=spendAcquisition(s,bid,financeWith,creditLineId);
 // The acquired company is NOT paid for its own shares; consideration goes to
 // the independent former shareholders. Its existing cash/debts stay inside it.
 const acquisition={id:id(s,'acquisition'),week:s.week,kind:'company',buyerId:buyer.id,targetId:target.id,
  price:bid,paidTo:'former independent shareholders',bookNetAssets:actualBook,
  preRevenue:target.finance.revenue,preExpense:target.finance.expense,
  preEquity:target.finance.equity,goodwill:money(bid-actualBook),borrowed:financing.borrowed};
 transact(s,buyer,'acquire-company-shares',{cash:-bid,investment:bid},'Purchased independent shares; target legal entity continues');
 target.parentId=buyer.id;target.investedCapital=bid;target.acquisition=acquisition;
 s.acquisitionHistory.push(acquisition);
 if(buyer.corporate)governanceEvent(s,buyer,'company-acquired',{subsidiaryId:target.id,price:bid});
 news(s,buyer.name+' acquires '+target.name,'The company changed shareholder control for '+shortMoney(bid)+'. All old staff, contracts, rights, liabilities and debt stayed with '+target.name+'.','deal');
 return acquisition;
}
function acquireAsset(s,{kind='ip',id:assetId,price,financeWith='cash',creditLineId=null}={}){
 requireExecutiveControl(s);ensure42C(s);
 const quote=assetPurchaseQuote(s,{type:kind,id:assetId}),bid=money(Number(price??quote.price));
 if(!quote.allowed)throw new Error('This asset is encumbered and cannot be transferred with a clean title under the current asset-deal terms.');
 if(!Number.isFinite(Number(price??quote.price))||bid<quote.price||bid>CFG.tuning_engine.acquireAsset__001)throw new Error('Seller did not agree to the purchase price.');
 const buyer=player(s),seller=company(s,quote.ownerId),asset=kind==='ip'?s.ips.find(x=>x.id===assetId):s.works.find(x=>x.id===assetId);
 if(seller.bankrupt&&seller.finance.cash<-CFG.tuning_engine.acquireAsset__002)throw new Error('Court-controlled bankruptcy asset sale unavailable.');
 boardMandate(s,'expansion',bid);const financing=spendAcquisition(s,bid,financeWith,creditLineId);
 // Conservative simplified accounting: acquired rights cost is recognized as
 // an expense, not an invented arbitrary carrying asset; no fictitious gain.
 transact(s,buyer,'purchased-ip-rights',{cash:-bid,expense:bid},'External source or completed-work rights purchase');
 transact(s,seller,'sold-ip-rights',{cash:bid,revenue:bid},'Rights sale to independently funded buyer');
 asset.ownerId=buyer.id;
 const record={id:id(s,'acquisition'),kind:'asset-'+kind,week:s.week,assetId,fromId:seller.id,toId:buyer.id,
  price:bid,borrowed:financing.borrowed,underlyingIpTransferred:kind==='ip',finishedWorkTransferred:kind==='work'};
 s.acquisitionHistory.push(record);
 news(s,buyer.name+' purchases '+quote.title,'The rights asset was purchased for '+shortMoney(bid)+'. Source-IP and finished-work ownership remain separately defined.','deal');
 return record;
}
function integrateAcquisition(s,childId,{choice='lean',capital=0}={}){
 requireExecutiveControl(s);ensure42C(s);
 const buyer=player(s),child=controlledCompanies(s).find(x=>x.id===childId&&x.parentId===buyer.id);
 if(!child)throw new Error('Only a legally controlled subsidiary may be integrated.');
 if(!['lean','supportive','recapitalize'].includes(choice))throw new Error('Unknown restructuring decision.');
 if(choice==='recapitalize'){
  const amount=money(Number(capital)),needed=money(Math.max(0,weeklyOverhead(child,s)*CFG.tuning_engine.needed__004+child.finance.payable-child.finance.cash));
  if(!Number.isFinite(Number(capital))||amount<Math.max(CFG.tuning_engine.integrateAcquisition__001,needed)||buyer.finance.cash<amount+CFG.tuning_engine.integrateAcquisition__002)throw new Error('Rescue must be real funded capital sufficient for documented cash obligations.');
  boardMandate(s,'expansion',amount);
  transact(s,buyer,'subsidiary-rescue-investment',{cash:-amount,investment:amount},'Additional paid-in equity; no phantom sales revenue');
  transact(s,child,'subsidiary-paid-in-capital',{cash:amount,equity:amount},'Owned subsidiary receives real parent capital');
  child.investedCapital=money(child.investedCapital+amount);
  if(child.bankrupt&&child.finance.cash>=child.finance.payable+weeklyOverhead(child,s)*CFG.tuning_engine.integrateAcquisition__003)child.bankrupt=false;
  if(buyer.corporate)governanceEvent(s,buyer,'subsidiary-recapitalized',{subsidiaryId:child.id,amount});
 }else {child.culture=choice;}
 const row={id:id(s,'integration'),week:s.week,childId,choice,capital:choice==='recapitalize'?money(capital):0,
  resultingCash:child.finance.cash,stillBankrupt:child.bankrupt};s.integrationHistory.push(row);
 news(s,'Group integration: '+child.name,choice==='recapitalize'?'Parent equity invested without eliminating any old debt.':'Company culture and recurring payroll policy changed; staff contracts and rights remain legally effective.','company');
 return row;
}
function groupInternalLicense(s,ipId,holderId,medium,fee=CFG.tuning_engine.groupInternalLicense__001,weeks=CFG.tuning_engine.groupInternalLicense__002){
 requireExecutiveControl(s);ensure42C(s);
 const ip=s.ips.find(x=>x.id===ipId),owner=ip&&company(s,ip.ownerId),holder=company(s,holderId),group=controlledCompanies(s);
 fee=money(Number(fee));
 if(!ip||!owner||!holder||owner.id===holder.id||!group.some(x=>x.id===owner.id)||!group.some(x=>x.id===holder.id))
  throw new Error('Only separate, wholly controlled group companies can execute internal rights deals.');
 if(!SECTORS[medium]||!available(medium,s.week)||!Number.isInteger(weeks)||weeks<CFG.tuning_engine.groupInternalLicense__003||weeks>CFG.tuning_engine.groupInternalLicense__004||!Number.isFinite(Number(fee))||fee<0||fee>CFG.tuning_engine.groupInternalLicense__005)
  throw new Error('Internal license requires an open global medium, valid term and modest funded charge.');
 if(s.grants.some(g=>g.ipId===ipId&&g.media===medium&&g.exclusive&&g.startWeek<s.week+weeks&&g.endWeek>s.week&&g.holderId!==holder.id))throw new Error('Exclusive external IP rights cannot be bypassed by group reorganization.');
 if(holder.finance.cash<fee+CFG.tuning_engine.groupInternalLicense__006)throw new Error('Subsidiary cannot fund internal rights transfer and payroll buffer.');
 const grant={id:id(s,'grant'),ipId,grantorId:owner.id,holderId:holder.id,media:medium,territory:'Worldwide',type:'license',
  startWeek:s.week,endWeek:s.week+weeks,optionExpiresWeek:null,exercisedWeek:null,exerciseFee:0,exerciseFeePaid:0,
  renewalHistory:[],approvalRequired:false,exclusive:false,allowsProduction:true,fee,royaltyRate:0,recoupableAdvance:0,
  royaltyHistoryComplete:true,continuationWeeks:0,groupInternal:true};
 if(fee){transact(s,holder,'internal-license-expense',{cash:-fee,expense:fee},'Actual internal IP license charge');
   transact(s,owner,'internal-license-revenue',{cash:fee,revenue:fee},'Actual internal IP license receipt');
   holder.finance.internalExpense=money((holder.finance.internalExpense||0)+fee);
   owner.finance.internalRevenue=money((owner.finance.internalRevenue||0)+fee);}
 s.grants.push(grant);
 s.groupLicenseHistory.push({id:id(s,'grouplicense'),grantId:grant.id,week:s.week,ipId,ownerId:owner.id,holderId:holder.id,fee});
 return grant;
}
const _consolidated42B=consolidatedStatements;
consolidatedStatements=function(s,rootId=s.playerId){const out=_consolidated42B(s,rootId),units=controlledCompanies(s,rootId).slice(1),acquired=units.filter(c=>c.acquisition?.kind==='company');
 const preRevenue=money(acquired.reduce((n,c)=>n+c.acquisition.preRevenue,0)),preExpense=money(acquired.reduce((n,c)=>n+c.acquisition.preExpense,0)),
  goodwill=money(acquired.reduce((n,c)=>n+c.acquisition.goodwill,0));
 out.income.preacquisitionRevenueExcluded=preRevenue;out.income.preacquisitionExpensesExcluded=preExpense;
 out.income.revenue=money(out.income.revenue-preRevenue);out.income.expenses=money(out.income.expenses-preExpense);
 out.income.net=money(out.income.revenue-out.income.expenses);
 out.balance.acquisitionGoodwill=goodwill;out.balance.assets=money(out.balance.assets+goodwill);
 out.balance.retainedEarnings=out.income.net;out.balance.equity=money(out.balance.parentCapital+out.income.net);
 out.balance.difference=money(out.balance.assets-out.balance.liabilities-out.balance.equity);
 return out;};
// Controlled subsidiaries retain their ordinary cash-constrained studio
// management by default. The player can opt out and direct them manually.
function subsidiaryDelegation(s,childId,enabled){
 requireExecutiveControl(s);
 if(typeof enabled!=='boolean')throw new Error('Delegation must be explicitly enabled or disabled.');
 const child=controlledCompanies(s).find(x=>x.id===childId&&x.parentId===s.playerId);
 if(!child)throw new Error('Only a controlled subsidiary may change launch authority.');
 child.delegatedProduction=enabled;
 return {childId,enabled};
}
const _launchAI42=launchAI;
launchAI=function(s,c){if(c.parentId===s.playerId&&c.delegatedProduction===false)return null;return _launchAI42(s,c);};
const _createGame42B=createGame;
createGame=function(input){const s=_createGame42B(input);ensure42C(s);return s;};
const _loadState42B=loadState;
loadState=function(raw){const s=_loadState42B(raw);ensure42C(s);return s;};
const _audit42B=audit;
audit=function(s){const errs=_audit42B(s);
 for(const a of s.acquisitionHistory||[]){
  if(a.kind==='company'){const c=company(s,a.targetId),parent=company(s,a.buyerId);
   if(!c||!parent||c.parentId!==parent.id||c.acquisition?.id!==a.id||a.goodwill<-CFG.tuning_engine.topLevel__005)errs.push('Invalid acquired-company identity or purchase value');}
  else if(!['asset-ip','asset-work'].includes(a.kind)||!company(s,a.fromId)||!company(s,a.toId))errs.push('Invalid title purchase provenance');
 }
 for(const g of s.groupLicenseHistory||[])if(!s.grants.some(x=>x.id===g.grantId&&x.groupInternal&&x.royaltyRate===0))errs.push('Invalid internal rights consolidation');
 if(s.companies.some(c=>c.parentId===s.playerId)){const x=consolidatedStatements(s);if(Math.abs(x.balance.difference)>CFG.tuning_engine.topLevel__006)errs.push('Acquired-company goodwill does not balance after consolidation');}
 return errs;};

// UPDATE 43A — historical continuity, independent capabilities and delegation.
// Generated backstory is strictly archival: never a live receivable, IP grant or
// claimed booked historical cash flow.
const STARTUP_PROFILES=Object.freeze(CFG.onboarding.STARTUP_PROFILES);
function ensure43A(s){
 if(!Array.isArray(s.prehistoryWorks))s.prehistoryWorks=[];
 if(!s.eraArchive)s.eraArchive={originYear:s.startedYear,generated:false,coverageStart:null,coverageEnd:null,uncertain:true};
 if(!s.managementDepth43)s.managementDepth43={corporate:'guided',teams:{},projects:{},autoSpendLimit:CFG.tuning_engine.ensure43A__001,actions:[]};
 if(!s.settings.startupProfile)s.settings.startupProfile='focused';
}
function build43Prehistory(s){
 ensure43A(s);
 if(s.eraArchive.generated)return;
 const end=s.startedYear-1, start=s.startedYear===1?-CFG.tuning_engine.start__003:-CFG.tuning_engine.start__004;
 const firms=s.companies.filter(c=>!c.isPlayer&&!c.parentId);
 const names=CFG.world.HISTORICAL_ARCHIVE_TITLES;
 for(let year=start;year<=end;year++){
   const availableSectors=Object.entries(SECTORS).filter(([sector,x])=>year>=x.year).map(([k])=>k);
   if(year<=0)availableSectors.splice(0,availableSectors.length,'publishing');
   // Historical fictional publishers may predate ALL presently active firms.
   // Their entities are archives, not projected ownership of generated rivals.
   for(const sector of availableSectors){
     const idx=hash(s.seed+':prehistory:'+year+':'+sector);
     const eligible=firms.filter(c=>c.sector===sector&&c.foundedYear<=year);
     const firm=eligible.length?eligible[idx%eligible.length]:null;
     const title=names[idx%names.length]+' '+(Math.abs(year)+1);
     const rec={id:'archive_'+sector+'_'+String(year).replace('-','m'),year,sector,title,
       companyId:firm?.id||null,companyName:firm?.name||'Historical independent creator',
       source:'generated',status:'archived',financials:'not reconstructed',
       rights:'unasserted',award:(idx%CFG.tuning_engine.rec__001===0)?'Fictional cultural nomination':null};
     s.prehistoryWorks.push(rec);
     // One stable world event, no weekly transaction or fake live project.
     s.worldStory.push({year,text:rec.title+' ('+SECTORS[sector].name+') — historical release',source:'Generated prehistory',archiveId:rec.id,sector});
   }
 }
 s.eraArchive={originYear:s.startedYear,generated:true,coverageStart:start,coverageEnd:end,uncertain:true};
 s.prehistoryWorks.sort((a,b)=>a.year-b.year||a.sector.localeCompare(b.sector));
}
function apply43StartupProfile(s,input={}){
 ensure43A(s);
 const profile=STARTUP_PROFILES[input.startupProfile]?input.startupProfile:'focused';
 s.settings.startupProfile=profile;const c=player(s);
 if(profile==='team'){
  const cost=money(CFG.tuning_engine.cost__049*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
  if(c.finance.cash<cost+CFG.tuning_engine.apply43StartupProfile__001)throw new Error('Startup needs an affordable training and payroll buffer.');
  expense(s,c,cost,'startup-team','Initial extra trained workgroup');
  c.capacity++;c.teamLevel++;c.teams.push(newTeam(s,c,c.teams.length));
 }
 if(profile==='partner'){
  const target=Object.keys(SECTORS).find(sec=>sec!==c.sector&&available(sec,s.week));
  if(!target)throw new Error('No separate production sector exists in this era; choose the team or focused profile.');
  const cost=money(capabilityCost(target,'partner')*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
  if(c.finance.cash<cost+CFG.tuning_engine.apply43StartupProfile__002)throw new Error('Initial partner readiness cannot be funded.');
  expense(s,c,cost,'startup-partner','Initial outsourced '+target+' operating capability');
  c.capabilities[target]='partner';
 }
 c.startupProfile=profile;c.startupProfileCost=s.ledger.filter(e=>e.companyId===c.id&&e.kind.startsWith('startup-')).reduce((n,e)=>money(n+e.amount),0);
}
function prepare43World(s,input={}){
 ensure43A(s);build43Prehistory(s);apply43StartupProfile(s,input);
}
function eraOverview43(s){ensure43A(s);return {
 startedYear:s.startedYear,worldYear:yearAt(s.week),companyAge:Math.max(0,yearAt(s.week)-player(s).foundedYear),
 maturity:s.settings.worldMaturity,industryStages:Object.fromEntries(Object.entries(SECTORS).map(([k,v])=>[k,{
 debut:v.year,available:available(k,s.week),yearsSinceDebut:Math.max(0,yearAt(s.week)-v.year),
 maturity:!available(k,s.week)?'locked':yearAt(s.week)===v.year?'emerging':yearAt(s.week)-v.year<CFG.tuning_engine.eraOverview43__001?'growing':'mature'}])),
 archives:s.prehistoryWorks.length,origin:'independently founded',generatedNotBooked:true,historyComplete:s.eraArchive.generated};}
function capabilityReadiness43(s,sector,companyId=s.playerId){
 const c=company(s,companyId);if(!c||!SECTORS[sector])throw new Error('Unknown company or industry.');
 const launched=available(sector,s.week),installed=c.capabilities[sector]||null;
 const price=money(capabilityCost(sector,'partner')*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
 const active=s.projects.filter(p=>p.companyId===c.id&&p.status==='active').length;
 return {companyId,sector,worldYear:yearAt(s.week),debutYear:SECTORS[sector].year,
  globallyAvailable:launched,capability:installed,partnerRouteCost:price,staffTeams:c.teams.length,
  freeSlots:Math.max(0,c.capacity-active),hasOperatingBuffer:c.finance.cash>=price+CFG.tuning_engine.capabilityReadiness43__001,
  canProduce:!!(launched&&installed&&active<c.capacity&&!c.bankrupt),
  canInvest:!!(launched&&!installed&&c.finance.cash>=price+CFG.tuning_engine.capabilityReadiness43__002&&!c.bankrupt),
  alternatives:launched?['in-house staffing','funded outsourcing','licensed adaptation','remain specialist']:['pre-debut binding options only'],
  reason:!launched?'Global sector clock not yet open':!installed?'Company lacks a paid internal or partner capability':active>=c.capacity?'All production teams committed':c.bankrupt?'Company insolvent':'Ready for authorized production'};
}
function managementStatus43(s){ensure43A(s);return {corporate:s.managementDepth43.corporate,teamModes:{...s.managementDepth43.teams},projectModes:{...s.managementDepth43.projects},autoSpendLimit:s.managementDepth43.autoSpendLimit,actions:s.managementDepth43.actions.slice(-CFG.tuning_engine.managementStatus43__001)};}
function setManagement43(s,{scope='corporate',id:targetId=null,mode='guided',spendLimit=CFG.tuning_engine.setManagement43__001}={}){
 requireExecutiveControl(s);ensure43A(s);
 if(!['guided','delegated','manual'].includes(mode))throw new Error('Unknown management mode.');
 if(!Number.isFinite(spendLimit)||spendLimit<0||spendLimit>CFG.tuning_engine.setManagement43__002)throw new Error('Delegation cap must be between 0 and 5,000.');
 const c=player(s),cfg=s.managementDepth43;
 if(scope==='corporate'){
  cfg.corporate=mode;cfg.autoSpendLimit=money(spendLimit);
  c.staffPolicy.autoFill=mode!=='manual';
  s.talentPolicy.autoBook=mode==='delegated';
  s.rightsPolicy.autoRenew=mode==='delegated'; // Existing engine still requires counterpart consent.
 }else if(scope==='team'){
  if(!c.teams.some(t=>t.id===targetId))throw new Error('Team is outside authorized company.');
  cfg.teams[targetId]=mode;
 }else if(scope==='project'){
  if(!s.projects.some(p=>p.id===targetId&&p.companyId===c.id&&p.status==='active'))throw new Error('Project is not active and owned.');
  cfg.projects[targetId]=mode;
 }else throw new Error('Unknown management scope.');
 return managementStatus43(s);
}
function managementWeek43(s){
 ensure43A(s);if(s.runStatus!=='active'||s.management?.status!=='active'||s.week%CFG.tuning_engine.managementWeek43__001!==0)return;
 const cfg=s.managementDepth43,c=player(s);if(c.bankrupt)return;
 for(const p of s.projects.filter(p=>p.companyId===c.id&&p.status==='active'&&cfg.projects[p.id]==='delegated')){
  // Autopilot only performs an affordable, consenting technical polish; no
  // creator-controlled revision, client-scope change or unauthorized action.
  const cost=money(p.budget*CFG.tuning_engine.cost__050);
  if(cost>cfg.autoSpendLimit||p.technicalQuality==null||p.technicalQuality>=CFG.tuning_engine.managementWeek43__002||p.weeksDone/p.weeksTotal>CFG.tuning_engine.managementWeek43__003)continue;
  try{const result=interveneProduction(s,p.id,'polish');cfg.actions.push({week:s.week,kind:'technical-polish',projectId:p.id,cost:result.spend});}
  catch(e){/* Never ignore financing, creator rights or project deadlines. */}
 }
 for(const t of c.teams.filter(t=>cfg.teams[t.id]==='delegated')){
  if(cfg.autoSpendLimit<CFG.tuning_engine.managementWeek43__004||t.skill>=CFG.tuning_engine.managementWeek43__005||s.projects.some(p=>p.teamId===t.id&&p.status==='active'))continue;
  if((t.trainingHistory||[]).length&&s.week-t.trainingHistory.at(-1).week<CFG.tuning_engine.managementWeek43__006)continue;
  try{const result=trainTeam(s,t.id,'mentorship');cfg.actions.push({week:s.week,kind:'team-mentorship',teamId:t.id,cost:result.cost});}
  catch(e){/* No free training, no overbooking; staff can be retained and re-trained later. */}
 }
 if(cfg.actions.length>CFG.tuning_engine.managementWeek43__007)cfg.actions.splice(0,cfg.actions.length-CFG.tuning_engine.managementWeek43__008);
}
function productionPath43(s,sector,companyId=s.playerId){
 const ready=capabilityReadiness43(s,sector,companyId),c=company(s,companyId);
 const phases=CFG.world.PRODUCTION_PHASES;
 return {...ready,phases:phases[sector],formatChoices:FORMATS[sector].slice(),estimatedBaseCost:SECTORS[sector].cost,
  teamSpecialties:(c.teams||[]).map(t=>({id:t.id,name:t.name,genre:t.specialty,skill:t.skill})),
  rule:'Same finite staffing, weekly costs, rights and demand accounting; distinct medium phases and sale channels.'};
}
function audit43A(s,problems){
 ensure43A(s);const a=s.eraArchive;
 if(a.generated){
  if(a.coverageEnd!==s.startedYear-1||a.coverageStart!==-CFG.tuning_engine.audit43A__001||s.prehistoryWorks.some(w=>
    !SECTORS[w.sector]||w.year>0&&w.year<SECTORS[w.sector].year||w.year>0&&w.year>=s.startedYear||
    w.year<=0&&w.sector!=='publishing'||w.source!=='generated'||w.status!=='archived'||w.financials!=='not reconstructed'||
    w.companyId&&!s.companies.some(c=>c.id===w.companyId&&c.foundedYear<=w.year)))problems.push('Invalid generated era history / industry chronology');
 }
 if(!STARTUP_PROFILES[s.settings.startupProfile]||!['guided','delegated','manual'].includes(s.managementDepth43.corporate)||
 !Number.isFinite(s.managementDepth43.autoSpendLimit)||s.managementDepth43.autoSpendLimit<0||s.managementDepth43.autoSpendLimit>CFG.tuning_engine.audit43A__002)problems.push('Invalid capability or delegation settings');
}
function migrate43(s,oldVersion){
 if(!s||!s.settings)return;
 ensure43A(s);
 // Old saves have no generated historical records; never fabricate past
 // rival project ownership or financial statements on a loaded campaign.
 if(oldVersion<CFG.tuning_engine.migrate43__001)s.eraArchive={originYear:s.startedYear,generated:false,coverageStart:null,coverageEnd:null,uncertain:true};
 if(!s.settings.startupProfile)s.settings.startupProfile='focused';
}

// UPDATE 43B — optional learning tools, objectives, event provenance and portraits.
// All UI help is derived from the actual campaign; nothing forces a quest.
// Predicates are executable gameplay logic; only objective labels and thresholds
// belong to JSON. JSON serialization would drop functions and break milestones.
const OBJECTIVE_RULES43=CFG.onboarding.OBJECTIVE_RULES43;
const OBJECTIVE_TESTS43={
 first_release:s=>s.projects.filter(p=>p.companyId===s.playerId&&p.status==='released').length>=OBJECTIVE_RULES43.firstReleaseCount,
 catalog_three:s=>s.projects.filter(p=>p.companyId===s.playerId&&p.status==='released').length>=OBJECTIVE_RULES43.catalogReleaseCount,
 secure_cash:s=>{const c=player(s);return c.finance.cash>=weeklyOverhead(c,s)*OBJECTIVE_RULES43.cashWeeksPayroll&&Math.max(0,c.finance.payable-(c.finance.taxPayable||0)-(c.finance.interestPayable||0))<OBJECTIVE_RULES43.payableTolerance&&s.week>=(s.objectives43?.selectedWeek?.secure_cash??s.week)+OBJECTIVE_RULES43.secureCashMinimumWeeks;},
 industry_reach:s=>new Set(s.projects.filter(p=>p.companyId===s.playerId&&p.status==='released'&&p.route==='original').map(p=>p.sector)).size>=OBJECTIVE_RULES43.industryReachCount,
 prestige:s=>s.creativeAwards.some(a=>a.companyId===s.playerId)
};
const OBJECTIVE_DEFS43=Object.freeze(Object.fromEntries(
 Object.entries(CFG.onboarding.OBJECTIVE_DEFS43).map(([key,row])=>[key,{...row,test:OBJECTIVE_TESTS43[key]}])
));
const TUTORIAL_STEPS43=Object.freeze(CFG.onboarding.TUTORIAL_STEPS43);
function ensure43B(s){
 if(!s.tutorial43)s.tutorial43={enabled:false,completed:false,step:0,visited:[],startedWeek:s.week,launchCount:s.projects.length};
 if(!s.objectives43)s.objectives43={selected:[],selectedWeek:{},completed:{},history:[]};
 if(!Array.isArray(s.events43))s.events43=[];
 if(!s.events43Keys)s.events43Keys={};
}
function beginTutorial43(s){ensure43B(s);s.tutorial43={enabled:true,completed:false,step:0,visited:[],startedWeek:s.week,launchCount:s.projects.filter(p=>p.companyId===s.playerId).length};return tutorialStatus43(s);}
function endTutorial43(s){ensure43B(s);s.tutorial43.enabled=false;return tutorialStatus43(s);}
function visitTutorial43(s,screen){ensure43B(s);if(!['dashboard','productions','library','finance','world','settings'].includes(screen))throw new Error('Unknown tutorial screen.');
 const t=s.tutorial43;if(!t.enabled)return tutorialStatus43(s);
 if(!t.visited.includes(screen))t.visited.push(screen);
 return tutorialStatus43(s);
}
function tutorialStatus43(s){ensure43B(s);const t=s.tutorial43;
 if(t.enabled&&!t.completed){
  let advance=true;while(advance&&!t.completed){
   let done=false;
   if(t.step===0)done=t.visited.includes('dashboard');
   else if(t.step===1)done=s.projects.filter(p=>p.companyId===s.playerId).length>t.launchCount;
   else if(t.step===CFG.tuning_engine.tutorialStatus43__001)done=t.visited.includes('library')&&t.visited.includes('finance');
   else if(t.step===CFG.tuning_engine.tutorialStatus43__002)done=s.week>t.startedWeek;
   if(done){t.step++;if(t.step>=TUTORIAL_STEPS43.length){t.completed=true;t.enabled=false;}}
   else advance=false;
  }
 }
 return {enabled:t.enabled,completed:t.completed,step:t.step,total:TUTORIAL_STEPS43.length,
  current:t.completed?null:{...TUTORIAL_STEPS43[t.step]},optional:true};
}
function chooseObjective43(s,key,enabled=true){requireExecutiveControl(s);ensure43B(s);
 if(!OBJECTIVE_DEFS43[key])throw new Error('Unknown optional achievement.');
 const o=s.objectives43,has=o.selected.includes(key);
 if(enabled&&!has){o.selected.push(key);o.selectedWeek[key]=s.week;}
 if(!enabled&&has)o.selected.splice(o.selected.indexOf(key),1);
 updateObjectives43(s);return objectiveStatus43(s);
}
function updateObjectives43(s){ensure43B(s);const o=s.objectives43;
 for(const key of o.selected)if(!o.completed[key]&&OBJECTIVE_DEFS43[key].test(s)){
  o.completed[key]={week:s.week,year:yearAt(s.week)};
  o.history.push({key,week:s.week,kind:'objective-completed'});
  // No cash or prestige is created; these are player-selected markers.
  news(s,'Goal reached: '+OBJECTIVE_DEFS43[key].name,CFG.events.messages.updateObjectives43__001,'company');
 }
}
function objectiveStatus43(s){ensure43B(s);return Object.entries(OBJECTIVE_DEFS43).map(([key,x])=>({
 key,name:x.name,hint:x.hint,selected:s.objectives43.selected.includes(key),complete:!!s.objectives43.completed[key],
 achievedWeek:s.objectives43.completed[key]?.week??null}));}
function adviser43(s){const c=player(s),f=c.finance,critical=s.inbox.filter(i=>i.open&&i.kind==='critical').length;
 const active=s.projects.filter(p=>p.companyId===c.id&&p.status==='active').length;
 const rights=rightsCalendar(s,{companyId:c.id,horizonWeeks:CFG.tuning_engine.rights__001}).filter(g=>g.status==='active');
 const liquidity=liquidityForecast(s,c.id,CFG.tuning_engine.liquidity__001);
 if(critical)return {priority:'critical',headline:'Review '+critical+' consequential inbox decisions',reason:'Binding deadlines, major rights issues, or solvency pressure can pause long skips.',screen:'inbox'};
 if(liquidity.runwayWeeks!==null&&liquidity.runwayWeeks<CFG.tuning_engine.adviser43__001)return {priority:'warning',headline:'Protect your cash runway',reason:'Committed staffing, debt and production may exhaust liquid cash before new income is paid.',screen:'finance'};
 if(rights.length)return {priority:'warning',headline:'Rights window approaching',reason:'Inspect expiries before funding another adaptation. Renewals require consent.',screen:'library'};
 if(active===0)return {priority:'opportunity',headline:'Consider a small production',reason:'An original in your available industry builds a catalog. Leave a payroll buffer.',screen:'productions'};
 return {priority:'information',headline:'Monitor your '+active+' active projects',reason:'Weekly work advances by real teams; creative, cash, and audience outcomes are different.',screen:'productions'};
}
const PORTRAIT_COLORS43=Object.freeze(CFG.onboarding.PORTRAIT_COLORS43);
function portraitTraits43(s,personId){
 const person=(s.employees||[]).find(p=>p.id===personId)||(s.specialists||[]).find(p=>p.id===personId)||(s.filmActors||[]).find(p=>p.id===personId)||(s.candidates||[]).find(p=>p.id===personId)||(s.founder.id===personId?s.founder:null);
 if(!person)throw new Error('Portrait subject must be a known named person.');
 const h=hash(s.seed+':portrait43:'+personId),skin=PORTRAIT_COLORS43.skins[h%CFG.tuning_engine.skin__001],hair=PORTRAIT_COLORS43.hairs[(h>>>CFG.tuning_engine.hair__001)%CFG.tuning_engine.hair__002],shirt=PORTRAIT_COLORS43.shirts[(h>>>CFG.tuning_engine.shirt__001)%CFG.tuning_engine.shirt__002],background=PORTRAIT_COLORS43.backdrops[(h>>>CFG.tuning_engine.background__001)%CFG.tuning_engine.background__002];
 return {personId,name:person.name||'Creator',skin,hair,shirt,background,hairstyle:(h>>>CFG.tuning_engine.portraitTraits43__001)%CFG.tuning_engine.portraitTraits43__002,
  glasses:(h>>>CFG.tuning_engine.portraitTraits43__003)%CFG.tuning_engine.portraitTraits43__004===0,eyes:(h>>>CFG.tuning_engine.portraitTraits43__005)%CFG.tuning_engine.portraitTraits43__006,style:'original-vector-cartoon',reusable:true};
}
function syncWorldEvents43(s){ensure43B(s);
 const add=(key,week,kind,entityId,title,newsKind)=>{
  if(s.events43Keys[key]||week>s.week||week<s.startedYear*CFG.tuning_engine.add__001-CFG.tuning_engine.add__002||week<0)return;
  const headline=[...s.news,...s.archivedNews].find(n=>n.week===week&&
    (n.kind===newsKind||n.kind==='company')&&(n.title.includes(title)||n.body.includes(title)));
  const row={id:id(s,'worldevent43'),key,week,kind,entityId,newsId:headline?.id||null,source:'played-entity',title};
  s.events43.push(row);s.events43Keys[key]=true;
 };
 const now=s.week;
 for(const p of s.projects)if(p.status==='released'&&p.releaseWeek!=null&&p.releaseWeek>=now-1)add('release:'+p.id,p.releaseWeek,'release',p.id,p.title,'release');
 for(const g of s.grants)if(g.startWeek>=now-1)add('rights:'+g.id,g.startWeek,'rights',g.id,s.ips.find(ip=>ip.id===g.ipId)?.name||g.ipId,'deal');
 for(const a of s.creativeAwards)if(a.awardedWeek>=now-1)add('award:'+a.year+':'+a.sector,a.awardedWeek,'award',a.projectId,s.projects.find(p=>p.id===a.projectId)?.title||a.projectId,'award');
 for(const c of s.companies)if(c.bankrupt&&!s.events43Keys['bankrupt:'+c.id]){
  const n=[...s.news,...s.archivedNews].find(n=>n.title.includes(c.name+' closes its doors'));
  if(n)add('bankrupt:'+c.id,n.week,'bankruptcy',c.id,c.name,'competitor');
 }
 if(s.events43.length>CFG.tuning_engine.syncWorldEvents43__001)s.events43.splice(0,s.events43.length-CFG.tuning_engine.syncWorldEvents43__002);
 updateObjectives43(s);
 return s.events43.slice(-CFG.tuning_engine.syncWorldEvents43__003);
}
function worldEvents43(s,{kind='all',limit=CFG.tuning_engine.worldEvents43__001}={}){ensure43B(s);
 return s.events43.filter(x=>kind==='all'||x.kind===kind).slice(-Math.max(1,Math.min(CFG.tuning_engine.worldEvents43__002,Number(limit)||CFG.tuning_engine.worldEvents43__003))).reverse();
}
function audit43B(s,problems){ensure43B(s);
 const t=s.tutorial43,o=s.objectives43;
 if(!Number.isInteger(t.step)||t.step<0||t.step>TUTORIAL_STEPS43.length||!Array.isArray(t.visited)||
 !Array.isArray(o.selected)||o.selected.some(x=>!OBJECTIVE_DEFS43[x])||
 Object.keys(o.completed).some(k=>!OBJECTIVE_DEFS43[k]||o.completed[k].week>s.week))problems.push('Invalid optional learning or objectives data');
 const known=new Set();
 for(const e of s.events43){
  const object=e.kind==='release'||e.kind==='award'?s.projects.find(p=>p.id===e.entityId):e.kind==='rights'?s.grants.find(g=>g.id===e.entityId):s.companies.find(c=>c.id===e.entityId);
  if(!object||e.week>s.week||known.has(e.key)||e.source!=='played-entity'||!s.events43Keys[e.key])problems.push('Invalid source-linked entertainment event');
  known.add(e.key);
  if(e.kind==='release'&&object&&(object.status!=='released'||object.releaseWeek!==e.week))problems.push('Event disagrees with real project release');
  if(e.kind==='rights'&&object&&object.startWeek!==e.week)problems.push('Event disagrees with rights grant');
 }
}
function update43BWeek(s){syncWorldEvents43(s);}

// UPDATE 43C — scoped contractual rights, actual game-publishing financing,
// transferable R&D ownership. No invented publisher money or magic technology.
function ensure43C(s){
 if(!Array.isArray(s.gamePublisherDeals43))s.gamePublisherDeals43=[];
 if(!Array.isArray(s.gamePublisherPayments43))s.gamePublisherPayments43=[];
 if(!Array.isArray(s.technologyOffers43))s.technologyOffers43=[];
 if(!Array.isArray(s.technologyTrades43))s.technologyTrades43=[];
}
function regionScope43(g){
 if(Array.isArray(g.territories43))return g.territories43;
 if(!g.territory||g.territory==='Worldwide')return REGIONS.map(r=>r.name);
 return REGIONS.some(r=>r.name===g.territory)?[g.territory]:REGIONS.map(r=>r.name);
}
function normalizeRegions43(regions){
 const list=regions==='Worldwide'||regions==null?activeRegionsDummy43():typeof regions==='string'?[regions]:regions;
 if(!Array.isArray(list)||list.length<1||list.length>REGIONS.length||new Set(list).size!==list.length||list.some(r=>!REGIONS.some(x=>x.name===r)))throw new Error('Choose valid unique licensed territories.');
 return REGIONS.map(r=>r.name).filter(r=>list.includes(r));
}
function activeRegionsDummy43(){return REGIONS.map(r=>r.name);}
function rightsOverlap43(a,b){return regionScope43(a).some(r=>regionScope43(b).includes(r));}
function rightsAncestor43(s,a,b){
 let node=b,steps=0;
 while(node?.parentGrantId&&steps++<CFG.tuning_engine.rightsAncestor43__001){
  if(node.parentGrantId===a.id)return true;
  node=s.grants.find(x=>x.id===node.parentGrantId);
 }
 return false;
}
function validGrantor43(s,g,ip){
 if(!g.parentGrantId)return ip.ownerId===g.grantorId;
 const parent=s.grants.find(x=>x.id===g.parentGrantId);
 return !!(parent&&parent.type==='license'&&parent.holderId===g.grantorId&&parent.sublicensable43&&
  parent.startWeek<=g.startWeek&&parent.endWeek>=g.endWeek&&
  regionScope43(g).every(r=>regionScope43(parent).includes(r))&&parent.media===g.media&&
  (!parent.approvalRequired||g.approvalRequired));
}
function rightsConflict43(s,trial,other){
 if(trial.id===other.id||trial.ipId!==other.ipId||trial.media!==other.media||
  trial.startWeek>=other.endWeek||other.startWeek>=trial.endWeek||!rightsOverlap43(trial,other))return false;
 if(rightsAncestor43(s,trial,other)||rightsAncestor43(s,other,trial))return false;
 return !!(trial.exclusive||other.exclusive);
}
// Replaces the old worldwide-only permission function (the grant registry stays one).
function canUseIp(s,c,ipId,sector,week=s.week,territory=null){
 if(!available(sector,week))return {ok:false,reason:'This industry has not debuted globally.'};
 const ip=s.ips.find(x=>x.id===ipId);if(!ip)return {ok:false,reason:'Source IP not found.'};
 const region=territory&&territory!=='Worldwide'?territory:null;
 if(region&&!REGIONS.some(r=>r.name===region))return {ok:false,reason:'Unknown distribution territory.'};
 if(ip.ownerId===c.id){
  const denied=s.grants.some(g=>g.ipId===ipId&&g.media===sector&&g.exclusive&&g.holderId!==c.id&&g.startWeek<=week&&g.endWeek>week&&
   ['option','license'].includes(g.type)&&(!region||regionScope43(g).includes(region)));
  return denied?{ok:false,reason:'Exclusive '+sector+' rights are reserved in the requested territory.'}:{ok:true};
 }
 const r=s.grants.find(g=>g.ipId===ipId&&g.holderId===c.id&&g.media===sector&&g.type==='license'&&g.startWeek<=week&&g.endWeek>week&&g.allowsProduction&&
  (!region||regionScope43(g).includes(region)));
 return r?{ok:true,grantId:r.id,territories:regionScope43(r)}:{ok:false,reason:'No effective adaptation license for this territory and medium.'};
}
function canDistribute43(s,p,region,week=s.week){
 if(!p||!REGIONS.some(r=>r.name===region))return false;
 if(Array.isArray(p.territories43)&&!p.territories43.includes(region))return false;
 if(!p.grantId)return true;
 const g=s.grants.find(x=>x.id===p.grantId);
 return !!(g&&g.type==='license'&&g.startWeek<=week&&g.endWeek+(g.continuationWeeks||0)>week&&regionScope43(g).includes(region));
}
function rightsPackageReport43(s,ipId){
 const ip=s.ips.find(x=>x.id===ipId);if(!ip)throw new Error('IP unknown.');
 return s.grants.filter(g=>g.ipId===ipId).map(g=>({id:g.id,grantorId:g.grantorId,holderId:g.holderId,medium:g.media,kind:g.type,
  regions:regionScope43(g),startWeek:g.startWeek,endWeek:g.endWeek,exclusive:!!g.exclusive,
  sublicense:!!g.sublicensable43,parentGrantId:g.parentGrantId||null,approvalRequired:!!g.approvalRequired,
  continuationWeeks:g.continuationWeeks||0,productionAllowed:g.type==='license'&&!!g.allowsProduction&&g.endWeek>s.week}));
}
function grantRightsPackage43(s,{ipId,holderId,media,territories=['North Coast'],weeks=CFG.tuning_engine.grantRightsPackage43__001,fee=CFG.tuning_engine.grantRightsPackage43__002,royaltyRate=CFG.tuning_engine.grantRightsPackage43__003,
 exclusive=false,sublicensable=false,approvalRequired=false,continuationWeeks=0,parentGrantId=null}={}){
 requireExecutiveControl(s);ensure43C(s);
 const ip=s.ips.find(x=>x.id===ipId),playerFirm=player(s),holder=company(s,holderId),regions=normalizeRegions43(territories);
 if(!ip||!holder||holder.bankrupt)throw new Error('Rights parties must be valid independent companies.');
 // A player may license out owned IP, license in from a consenting rival,
 // or sublicense rights it holds when its own parent grant expressly allows it.
 const grantorId=parentGrantId?playerFirm.id:ip.ownerId,owner=company(s,grantorId);
 if(!owner||grantorId===holder.id||owner.parentId===holder.id||holder.parentId===owner.id||
   (grantorId!==playerFirm.id&&holder.id!==playerFirm.id))throw new Error('Rights parties must be valid independent companies.');
 if(!SECTORS[media]||!available(media,s.week))throw new Error('Commercial adaptation rights open only after world sector debut; use binding options earlier.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.grantRightsPackage43__004||weeks>CFG.tuning_engine.grantRightsPackage43__005||!Number.isFinite(fee)||fee<CFG.tuning_engine.grantRightsPackage43__006||fee>CFG.tuning_engine.grantRightsPackage43__007||!Number.isFinite(royaltyRate)||royaltyRate<0||royaltyRate>CFG.tuning_engine.grantRightsPackage43__008||!Number.isInteger(continuationWeeks)||continuationWeeks<0||continuationWeeks>CFG.tuning_engine.grantRightsPackage43__009)throw new Error('Rights duration or compensation invalid.');
 const g={id:id(s,'grant'),ipId,grantorId:owner.id,holderId,media,territory:regions.length===REGIONS.length?'Worldwide':regions.join(', '),
  territories43:regions,parentGrantId,parentSublicense43:!!parentGrantId,sublicensable43:!!sublicensable,
  type:'license',startWeek:s.week,endWeek:s.week+weeks,optionExpiresWeek:null,exercisedWeek:null,exerciseFee:0,exerciseFeePaid:0,
  renewalHistory:[],approvalRequired:!!approvalRequired,exclusive:!!exclusive,allowsProduction:true,fee:money(fee),royaltyRate,
  recoupableAdvance:0,royaltyHistoryComplete:true,continuationWeeks};
 if(!validGrantor43(s,g,ip))throw new Error('Seller lacks underlying title or permission to sublicense these territories and dates.');
 if(parentGrantId){
  const parent=s.grants.find(x=>x.id===parentGrantId);
  if(parent?.approvalRequired&&!approvalRequired)throw new Error('Binding creator approvals cannot be waived.');
  // The parent and holder must be the same legal company; only that company can resell rights.
 }
 const conflicts=s.grants.find(other=>rightsConflict43(s,g,other));
 if(conflicts)throw new Error('Overlapping exclusive rights are already contracted: '+conflicts.id);
 if(holder.finance.cash<fee+CFG.tuning_engine.grantRightsPackage43__010)throw new Error('Counterparty cannot fund this rights package.');
 if(grantorId!==playerFirm.id&&fee<Math.max(CFG.tuning_engine.grantRightsPackage43__011,Math.round((ip.rightsIncome||0)*CFG.tuning_engine.grantRightsPackage43__012+CFG.tuning_engine.grantRightsPackage43__013)))throw new Error('External IP owner declined the proposed cash terms.');
 // Both sides book the actual same payment. No fictitious consumer demand.
 expense(s,holder,money(fee),'scoped-license-fee','License '+media+' territories for '+ip.name);
 revenue(s,owner,money(fee),'scoped-license-fee','Paid '+media+' rights grant for '+ip.name);
 if(ip.ownerId===owner.id)ip.rightsIncome=money((ip.rightsIncome||0)+money(fee));
 s.grants.push(g);
 news(s,'Scoped rights signed: '+ip.name,holder.name+' acquired '+media+' rights in '+regions.join(', ')+'. Term and existing approvals remain binding.','deal');
 return g;
}
function gamePublisherQuote43(s,projectId,publisherId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),pub=company(s,publisherId);
 if(!p||!c||!pub||p.sector!=='games'||p.status!=='active'||p.route==='contract'||pub.id===c.id||pub.parentId===c.id||c.parentId===pub.id||!pub.capabilities.games||pub.bankrupt||!available('games',s.week))throw new Error('Choose an active authorized game and an independent publisher.');
 const advance=money(Math.min(CFG.tuning_engine.advance__003,Math.max(CFG.tuning_engine.advance__004,p.budget*CFG.tuning_engine.advance__005))),share=CFG.tuning_engine.share__001;
 const willing=pub.finance.cash>=advance+weeklyOverhead(pub,s)*CFG.tuning_engine.willing__001&&
   p.quality>=CFG.tuning_engine.willing__002&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.endWeek>s.week+CFG.tuning_engine.willing__003));
 return {projectId,publisherId,advance,share,termWeeks:CFG.tuning_engine.gamePublisherQuote43__001,willAccept:willing,
  conditions:'Funds paid up front as unearned development advance; share of real post-release customer receipts only. No IP sale.'};
}
function signGamePublisher43(s,projectId,publisherId){
 requireExecutiveControl(s);ensure43C(s);const q=gamePublisherQuote43(s,projectId,publisherId),p=s.projects.find(p=>p.id===projectId);
 if(p.companyId!==s.playerId)throw new Error('Only an authorized producing studio may approve this deal.');
 if(!q.willAccept)throw new Error('Independent publisher declined due to funds or rights risk.');
 if(s.gamePublisherDeals43.some(d=>d.projectId===p.id&&['active','delivered'].includes(d.status)))throw new Error('A publishing advance is already funding this game.');
 const pub=company(s,publisherId),studio=company(s,p.companyId);
 transact(s,pub,'game-publisher-advance',{cash:-q.advance,prepaid:q.advance},'Prepaid independent game publishing partnership',p.id);
 transact(s,studio,'game-publisher-advance',{cash:q.advance,deferred:q.advance},'Unearned publisher production advance',p.id);
 const d={id:id(s,'gamepublisher43'),projectId:p.id,publisherId,studioId:studio.id,signedWeek:s.week,advance:q.advance,
  share:q.share,termWeeks:q.termWeeks,status:'active',deliveredWeek:null,royaltyAccrued:0,royaltyPaid:0,royaltyOpen:0,paidAdvance:false};
 s.gamePublisherDeals43.push(d);p.gamePublisherDeal43=d.id;
 news(s,'Game funding signed: '+p.title,pub.name+' supplied a real cash publishing advance; studio IP ownership is unchanged.','deal');
 return d;
}
function gamePublisherSale43(s,p,gross){
 if(!p.gamePublisherDeal43||gross<=0)return;
 const d=s.gamePublisherDeals43?.find(x=>x.id===p.gamePublisherDeal43);
 if(!d||d.status!=='delivered'||s.week<d.deliveredWeek||s.week>=d.deliveredWeek+d.termWeeks)return;
 const due=money(gross*d.share);if(due<=0)return;
 const studio=company(s,d.studioId),publisher=company(s,d.publisherId);
 transact(s,studio,'game-publisher-share',{payable:due,expense:due},'Contracted share of external game sales: '+p.title,p.id);
 transact(s,publisher,'game-publisher-receivable',{receivable:due,revenue:due},'Game distribution service participation: '+p.title,p.id);
 d.royaltyAccrued=money(d.royaltyAccrued+due);d.royaltyOpen=money(d.royaltyOpen+due);
 p.directCost=money(p.directCost+due);
}
function gamePublisherWeek43(s){ensure43C(s);
 for(const d of s.gamePublisherDeals43){const p=s.projects.find(p=>p.id===d.projectId),studio=company(s,d.studioId),pub=company(s,d.publisherId);
  if(!p||!studio||!pub)continue;
  if(d.status==='active'&&p.status==='released'){
   transact(s,studio,'game-publisher-delivery',{deferred:-d.advance,revenue:d.advance},'Earn publisher advance on actual delivered game',p.id);
   transact(s,pub,'game-publisher-delivery',{prepaid:-d.advance,expense:d.advance},'Publisher prepaid game content delivered',p.id);
   p.directRevenue=money(p.directRevenue+d.advance);d.status='delivered';d.deliveredWeek=s.week;d.paidAdvance=true;
  }
  if(d.status==='active'&&p.status==='cancelled'){
   const refund=money(Math.min(studio.finance.cash,d.advance)),owed=money(d.advance-refund);
   transact(s,studio,'game-publisher-refund',{cash:-refund,deferred:-d.advance,payable:owed},'Return unearned cancelled publishing advance',p.id);
   transact(s,pub,'game-publisher-refund',{cash:refund,prepaid:-d.advance,receivable:owed},'Publisher refund and collectible cancellation claim',p.id);
   d.status='cancelled';d.refundOutstanding=owed;
  }
  if(d.royaltyOpen>0){
   const availableCash=Math.max(0,studio.finance.cash-weeklyOverhead(studio,s)*CFG.tuning_engine.availableCash__001);
   const paid=money(Math.min(d.royaltyOpen,availableCash));
   if(paid>0){transact(s,studio,'game-publisher-settlement',{cash:-paid,payable:-paid},'Pay accrued game publisher revenue share',p.id);
    transact(s,pub,'game-publisher-collection',{cash:paid,receivable:-paid},'Receive previously earned game publisher royalty',p.id);
    d.royaltyPaid=money(d.royaltyPaid+paid);d.royaltyOpen=money(d.royaltyOpen-paid);
   }
  }
  if(d.refundOutstanding>0){const payable=money(Math.min(d.refundOutstanding,Math.max(0,studio.finance.cash-weeklyOverhead(studio,s)*CFG.tuning_engine.payable__002)));
   if(payable>0){transact(s,studio,'game-publisher-refund-pay',{cash:-payable,payable:-payable},'Pay preserved publisher refund claim',p.id);
    transact(s,pub,'game-publisher-refund-receipt',{cash:payable,receivable:-payable},'Collect preserved publisher cancellation claim',p.id);
    d.refundOutstanding=money(d.refundOutstanding-payable);}
  }
 }
}
function gamePublisherReport43(s,projectId){ensure43C(s);return s.gamePublisherDeals43.filter(d=>d.projectId===projectId).map(x=>({...x}));}
function technologyOffer43(s,sellerId,sector){
 requireExecutiveControl(s);ensure43C(s);
 const seller=company(s,sellerId),buyer=player(s);
 if(!seller||seller.id===buyer.id||seller.bankrupt||seller.parentId===buyer.id||!SECTORS[sector]||!available(sector,s.week)||!buyer.capabilities[sector])throw new Error('Technology trade requires debuted sector and independent owner.');
 const tech=seller.research?.[sector],mine=buyer.research?.[sector];
 if(!tech||tech.level<1||tech.wave<1||mine?.wave===tech.wave&&mine.level>=tech.level)throw new Error('Seller has no better transferable company-owned R&D to offer.');
 const price=money(CFG.tuning_engine.price__008+tech.level*CFG.tuning_engine.price__009),willing=seller.finance.cash<weeklyOverhead(seller,s)*CFG.tuning_engine.willing__004||
  (hash(s.seed+':tech-willing:'+seller.id+':'+sector+':'+yearAt(s.week))%CFG.tuning_engine.willing__005!==0);
 const rec={id:id(s,'techOffer43'),sellerId,buyerId:buyer.id,sector,price,level:tech.level,wave:tech.wave,
  createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.rec__002,status:willing?'accepted':'declined',sellerConsent:willing};
 s.technologyOffers43.push(rec);return rec;
}
function acquireTechnology43(s,offerId){
 requireExecutiveControl(s);ensure43C(s);
 const o=s.technologyOffers43.find(x=>x.id===offerId),buyer=player(s);
 if(!o||o.buyerId!==buyer.id||o.status!=='accepted'||!o.sellerConsent||o.expiresWeek<s.week)throw new Error('No current willing technology owner has accepted this transaction.');
 const seller=company(s,o.sellerId),old=seller?.research?.[o.sector],mine=buyer.research?.[o.sector];
 if(!seller||!old||old.level<o.level||old.wave!==o.wave||!buyer.capabilities[o.sector]||!available(o.sector,s.week))throw new Error('Technology ownership or current capability changed.');
 if(buyer.finance.cash<o.price+CFG.tuning_engine.acquireTechnology43__001)throw new Error('Insufficient funds to acquire technology while retaining payroll cash.');
 expense(s,buyer,o.price,'acquired-research','Purchased transferable R&D intellectual property from '+seller.name);
 revenue(s,seller,o.price,'technology-sale','Sold proprietary research know-how to '+buyer.name);
 seller.researchHistory43 ||= [];seller.researchHistory43.push({...old,transferredWeek:s.week,toId:buyer.id});
 seller.research[o.sector]={...old,spent:0,level:0,acquiredLevel:0,transferredAway:true};
 const sourceBoost=(mine?.wave===o.wave?mine.level:0),level=Math.max(sourceBoost,o.level);
 buyer.research[o.sector]={spent:mine?.wave===o.wave?(mine.spent||0):0,level,acquiredLevel:o.level,wave:o.wave,updatedWeek:s.week,acquiredFrom:seller.id};
 const rec={id:id(s,'techTrade43'),offerId,week:s.week,sector:o.sector,price:o.price,buyerId:buyer.id,sellerId:seller.id,wave:o.wave,level:o.level};
 s.technologyTrades43.push(rec);o.status='booked';
 news(s,buyer.name+' acquires '+SECTORS[o.sector].name+' R&D',seller.name+' sold actual proprietary know-how. Research history is preserved; tool vendors and source IP remain distinct.','deal');
 return rec;
}
function rivalResearch43(s){
 if(s.week%CFG.tuning_engine.rivalResearch43__001!==0)return;
 for(const c of s.companies){if(c.isPlayer||c.parentId||c.bankrupt||c.aiPlan?.goal!=='technology'||!available(c.sector,s.week))continue;
  const wave=technologyReport(s)[c.sector]?.wave||0;
  if(!wave||c.finance.cash<weeklyOverhead(c,s)*CFG.tuning_engine.rivalResearch43__002+CFG.tuning_engine.rivalResearch43__003)continue;
  const old=c.research?.[c.sector],spent=money((old?.wave===wave?old.spent:0)+CFG.tuning_engine.spent__001);
  expense(s,c,CFG.tuning_engine.rivalResearch43__004,'rival-proprietary-research','Independent rival funds genuine research capacity');
  c.research[c.sector]={spent,wave,level:Math.min(CFG.tuning_engine.rivalResearch43__005,Math.floor(spent/CFG.tuning_engine.rivalResearch43__006)),updatedWeek:s.week};
 }
}
function audit43C(s,problems){ensure43C(s);
 for(const g of s.grants.filter(g=>g.territories43)){
  if(!Array.isArray(g.territories43)||!g.territories43.length||new Set(g.territories43).size!==g.territories43.length||g.territories43.some(r=>!REGIONS.some(x=>x.name===r)))problems.push('Invalid scoped rights territories');
  const ip=s.ips.find(x=>x.id===g.ipId);
  if(!ip||!validGrantor43(s,g,ip))problems.push('Unauthorized licensed owner or sublicensing scope');
 }
 for(const p of s.projects.filter(p=>p.territories43))if(!p.territories43.length||p.territories43.some(x=>!REGIONS.some(r=>r.name===x)))problems.push('Invalid title release territory');
 for(const d of s.gamePublisherDeals43){const p=s.projects.find(x=>x.id===d.projectId),studio=company(s,d.studioId),pub=company(s,d.publisherId);
  if(!p||p.sector!=='games'||!pub||!studio||p.companyId!==studio.id||p.gamePublisherDeal43!==d.id||d.signedWeek>s.week||
   !['active','delivered','cancelled'].includes(d.status)||d.royaltyAccrued<0||d.royaltyPaid<0||d.royaltyOpen<0||
   Math.abs(money(d.royaltyAccrued-d.royaltyPaid-d.royaltyOpen))>CFG.tuning_engine.audit43C__001||
   (d.status==='active'&&p.status!=='active')||d.status==='delivered'&&p.status!=='released')problems.push('Invalid independent game publishing funding / receipts');
 }
 for(const t of s.technologyTrades43){const seller=company(s,t.sellerId),buyer=company(s,t.buyerId);
  if(!seller||!buyer||t.week>s.week||t.price<CFG.tuning_engine.audit43C__002||!s.technologyOffers43.some(o=>o.id===t.offerId&&o.status==='booked')||
   !seller.researchHistory43?.some(h=>h.toId===buyer.id&&h.transferredWeek===t.week&&h.level>=t.level))problems.push('Technology trade missing genuine funded seller provenance');
 }
}
function update43CWeek(s){gamePublisherWeek43(s);rivalResearch43(s);}

// UPDATE 44A — fair sector-entrant financing and funded payroll work.
// New industry competitors use the SAME finite entrepreneur reserve as later
// startups. A studio that cannot pay workers cannot indefinitely complete new
// projects merely by adding unpaid payroll to the liability ledger.
function ensure44A(s){
 if(!Number.isFinite(s.entrepreneurPool))ensure42A(s);
 if(!s.hardening44)s.hardening44={startedWeek:s.week,entrepreneurOpening:money(s.entrepreneurPool||0),debutCommitted:0,seededVersion:s.version};
 if(!Array.isArray(s.debutFundings44))s.debutFundings44=[];
 for(const c of s.companies||[])if(!c.operating44)c.operating44={unfundedWeeks:0,furloughed:false,startWeek:null,resumptions:0};
}
function industryDebutFirm44(s,sector,year,name){
 ensure44A(s);
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('Industry competitor must wait for worldwide debut.');
 const minCapital=money(Math.max(CFG.tuning_engine.minCapital__001,SECTORS[sector].cost*CFG.tuning_engine.minCapital__002));
 // Deterministic but affordable. When external founder capital is exhausted,
 // market entry is deferred, not secretly subsidized.
 const proposed=money(CFG.tuning_engine.proposed__001+rand(s)*CFG.tuning_engine.proposed__002);
 if(s.entrepreneurPool<minCapital){
  s.hardening44.deferredEntrants=(s.hardening44.deferredEntrants||0)+1;
  return null;
 }
 const capital=money(Math.min(proposed,s.entrepreneurPool));
 if(capital<minCapital)return null;
 s.entrepreneurPool=money(s.entrepreneurPool-capital);
 const firm=createCompany(s,{name,sector,foundedYear:year,cash:capital,reputation:CFG.tuning_engine.firm__007+Math.floor(rand(s)*CFG.tuning_engine.firm__008)});
 s.debutFundings44.push({companyId:firm.id,sector,week:s.week,capital,source:'finite-entrepreneur-pool'});
 s.hardening44.debutCommitted=money(s.hardening44.debutCommitted+capital);
 rivalEvent(s,firm,'funded-industry-debut',{capital,sector,source:'finite-entrepreneur-pool'});
 return firm;
}
function fundedPayroll44(s,c){
 ensure44A(s);
 const state=c.operating44,weekly=weeklyOverhead(c,s),cash=c.finance.cash;
 if(state.furloughed){
  // The company must have liquidity for at least four funded work-weeks plus
  // sufficiently manageable outstanding obligations before resuming payroll.
  if(cash>=weekly*CFG.tuning_engine.fundedPayroll44__001&&c.finance.payable<=cash+weekly*CFG.tuning_engine.fundedPayroll44__002){
   state.furloughed=false;state.unfundedWeeks=0;state.resumptions++;
   if(c.isPlayer)news(s,'Operations resume at '+c.name,CFG.events.messages.fundedPayroll44__001,'company');
  }else return false;
 }
 if(cash<weekly*CFG.tuning_engine.fundedPayroll44__003){state.unfundedWeeks++;
  if(state.unfundedWeeks>=CFG.tuning_engine.fundedPayroll44__004){
   state.furloughed=true;state.startWeek=s.week;
   if(c.isPlayer){
    alert(s,'unpaid-labor-'+c.id,CFG.events.messages.fundedPayroll44__002,
     CFG.events.messages.fundedPayroll44__003,'critical');
    news(s,CFG.events.messages.fundedPayroll44__004,c.name+' furloughed its teams. No new production output will be claimed without funded labor.','company');
   }
   return false;
  }
 }else state.unfundedWeeks=0;
 return true;
}
function operatingStatus44(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company.');ensure44A(s);
 return {companyId:c.id,weeklyPayroll:weeklyOverhead(c,s),cash:c.finance.cash,payable:c.finance.payable,
  ...c.operating44,explanation:'A furlough pauses production without erasing existing payroll, royalty, tax, credit or other obligations.'};
}
function audit44A(s,problems){
 ensure44A(s);const d=s.hardening44;
 if(!Number.isFinite(d.entrepreneurOpening)||d.entrepreneurOpening<0||!Number.isFinite(s.entrepreneurPool)||s.entrepreneurPool<-CFG.tuning_engine.audit44A__001||
  !Number.isFinite(d.debutCommitted)||d.debutCommitted<0||d.debutCommitted>d.entrepreneurOpening+CFG.tuning_engine.audit44A__002||
  d.debutCommitted>d.entrepreneurOpening-s.entrepreneurPool+CFG.tuning_engine.audit44A__003)
  problems.push('Update44 unfunded industry entrant capital');
 const seen=new Set();let booked=0;
 for(const row of s.debutFundings44){
  if(seen.has(row.companyId)||!s.companies.some(c=>c.id===row.companyId&&c.foundedYear===yearAt(row.week)&&c.finance.equity>=row.capital-CFG.tuning_engine.audit44A__004)||
   !SECTORS[row.sector]||row.week>s.week||yearAt(row.week)<SECTORS[row.sector].year||row.capital<=0)problems.push('Update44 invalid industry debut funding record');
  seen.add(row.companyId);booked=money(booked+row.capital);
 }
 if(Math.abs(booked-d.debutCommitted)>CFG.tuning_engine.audit44A__005)problems.push('Update44 founder-funding ledger mismatch');
 for(const c of s.companies){const w=c.operating44;
  if(!w||!Number.isInteger(w.unfundedWeeks)||w.unfundedWeeks<0||typeof w.furloughed!=='boolean'||
    !Number.isInteger(w.resumptions)||w.resumptions<0||w.startWeek!==null&&w.startWeek>s.week)
    problems.push('Update44 invalid company payroll state');
 }
}
const _create44A=createGame;
createGame=function(input){const s=_create44A(input);ensure44A(s);return s;};
const _load44A=loadState;
loadState=function(raw){const s=_load44A(raw);ensure44A(s);return s;};
const _audit44A=audit;
audit=function(s){const errs=_audit44A(s);audit44A(s,errs);return errs;};


// Update 45 — exclusive distribution and outstanding production safeguards.
// Exclusive licenses must restrict their grantor's ongoing exploitation in the
// licensed medium/territory. Neither pre-debut options nor licensing a distinct
// medium silently curtail existing sales.
const _canDistributeBefore45=canDistribute43;
canDistribute43=function(s,p,region,week=s.week){
 if(!_canDistributeBefore45(s,p,region,week))return false;
 const ip=s.ips.find(x=>x.id===p.ipId);
 if(!ip||ip.ownerId!==p.companyId||!['publishing','movie','tv','games'].includes(p.sector))return true;
 return !s.grants.some(g=>g.ipId===p.ipId&&g.media===p.sector&&g.type==='license'&&g.exclusive&&
   g.holderId!==p.companyId&&g.startWeek<=week&&g.endWeek>week&&regionScope43(g).includes(region));
};
const _grantRightsPackageBefore45=grantRightsPackage43;
grantRightsPackage43=function(s,terms){
 if(terms?.exclusive){
  const regions=normalizeRegions43(terms.territories??['North Coast']);
  const grantor=terms.parentGrantId?s.playerId:s.ips.find(i=>i.id===terms.ipId)?.ownerId;
  const conflict=s.projects.some(p=>p.status==='active'&&p.companyId===grantor&&p.ipId===terms.ipId&&p.sector===terms.media&&
    (!Array.isArray(p.territories43)||p.territories43.some(r=>regions.includes(r))));
  if(conflict)throw new Error('Finish or legally re-scope existing active productions before granting exclusive rights in the same medium and territory.');
 }
 return _grantRightsPackageBefore45(s,terms);
};


// Update 47 — client-delivery disputes; all monetary movements use reserved escrow.
// Reviews are optional unless explicitly requested, never a mandatory weekly task.
function commissionInspection47(s,projectId){
 requireExecutiveControl(s);
 const p=s.projects.find(x=>x.id===projectId&&x.companyId===s.playerId&&x.route==='contract'&&x.status==='active');
 const e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47||p.weeksDone<p.weeksTotal*CFG.tuning_engine.commissionInspection47__001||p.weeksDone>=p.weeksTotal)
   throw new Error('Client inspection is available once during active, substantively started contract work.');
 const challenged=p.quality<CFG.tuning_engine.challenged__001||(hash(s.seed+':delivery-review:'+p.id)%CFG.tuning_engine.challenged__002===0);
 e.review47={week:s.week,status:challenged?'open':'approved',reason:challenged?'Client challenges quality or agreed delivery scope.':'Client accepted inspected work.',riskScore:p.quality,settlement:null};
 if(challenged){
  alert(s,'commission-dispute-'+p.id,'Client disputes delivery: '+p.title,
   CFG.events.messages.commissionInspection47__001,'critical');
  news(s,'Client requests remedy: '+p.title,CFG.events.messages.commissionInspection47__002,'company');
 }
 return {...e.review47};
}
function commissionDispute47(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 return e?{projectId,escrowId:e.id,fee:e.fee,earned:money(e.advance+(e.milestonePaid||0)),protected:e.held,
   inspection:e.review47?{...e.review47}:null}:null;
}
const _cancelProjectBefore47=cancelProject;
cancelProject=function(s,projectId){const p=_cancelProjectBefore47(s,projectId),e=s.escrows.find(x=>x.projectId===projectId);
 if(e?.review47?.status==='open'){e.review47.status='cancelled';e.review47.settlement='protected-refund';}
 return p;
};
function commissionResolve47(s,projectId,decision){
 requireExecutiveControl(s);
 const p=s.projects.find(x=>x.id===projectId&&x.companyId===s.playerId&&x.status==='active');
 const e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47?.status!=='open')throw new Error('No outstanding funded client dispute.');
 if(!['rework','cancel','arbitrate'].includes(decision))throw new Error('Choose rework, cancellation or contract arbitration.');
 if(decision==='cancel'){const before=e.held;cancelProject(s,projectId);return {decision,refunded:before,sellerAward:0};}
 if(decision==='rework'){
  const seller=company(s,e.sellerId),cost=money(Math.max(CFG.tuning_engine.cost__051,p.budget*CFG.tuning_engine.cost__052));
  if(seller.finance.cash<cost+weeklyOverhead(seller,s)*CFG.tuning_engine.commissionResolve47__001)throw new Error('Remedial work is not funded; use arbitration or cancel.');
  expense(s,seller,cost,'contract-remediation','Client-approved corrective work: '+p.title,p.id);
  p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
  p.weeksTotal+=CFG.tuning_engine.commissionResolve47__002;e.review47.status='remedied';e.review47.settlement='paid-rework';e.review47.cost=cost;
  news(s,'Client approves paid remedy: '+p.title,CFG.events.messages.commissionResolve47__001,'production');
  const notice=s.inbox.find(a=>a.key==='commission-dispute-'+p.id);if(notice)notice.open=false;
  return {decision,cost,extraWeeks:CFG.tuning_engine.commissionResolve47__003,protected:e.held};
 }
 // Fictional neutral arbitration splits only the *unearned reserved balance*.
 // Earned advance/milestones stay earned. No third-party cash is invented.
 const buyer=company(s,e.buyerId),seller=company(s,e.sellerId),held=e.held;
 const award=money(held*clamp(CFG.tuning_engine.award__002+p.quality/CFG.tuning_engine.award__003,CFG.tuning_engine.award__004,CFG.tuning_engine.award__005)),refund=money(held-award),earned=money(e.advance+(e.milestonePaid||0));
 transact(s,buyer,'client-arbitration',{cash:refund,prepaid:-e.fee,expense:money(e.fee-refund)},'Neutral commission settlement and protected refund',p.id);
 transact(s,seller,'service-arbitration',{cash:award,deferred:-earned,revenue:money(earned+award)},'Neutral contract settlement of earned work',p.id);
 p.directRevenue=money(p.directRevenue+earned+award);e.held=0;e.settled=true;e.cancelled=true;e.closedWeek=s.week;
 e.review47.status='arbitrated';e.review47.settlement='neutral-award';e.review47.refund=refund;e.review47.award=award;
 recordCommissionOutcome(s,p,'cancelled');releaseProjectSpecialist(s,p);p.status='cancelled';p.cancelledWeek=s.week;
 const notice=s.inbox.find(a=>a.key==='commission-dispute-'+p.id);if(notice)notice.open=false;
 news(s,'Arbitration settled: '+p.title,CFG.events.messages.commissionResolve47__002,'company');
 return {decision,refunded:refund,sellerAward:award,earned};
}
// Depth modes D3 — yearly Inbox decision-card limit per mode (config/depth.json INBOX/PRIORITY).
// Every new Inbox item is triaged: shown as a card, or filed and settled by policy. Urgent items
// are always shown. Very Complex has no limit, so it only counts cards. No RNG is used here.
function inboxRulesD3(s){return CFG.depth.INBOX[s.settings?.depth]||CFG.depth.INBOX.veryComplex;}
function inboxPriorityD3(key){const P=CFG.depth.PRIORITY,hit=list=>list.some(p=>key.startsWith(p));
 return hit(P.urgent)?'urgent':hit(P.low)?'low':'normal';}
function decisionYearD3(s){const y=yearAt(s.week);
 if(!s.decisionCards||s.decisionCards.year!==y)s.decisionCards={year:y,cards:0,low:0,auto:0};return s.decisionCards;}
function triageInboxItemD3(s,item){
 const log=decisionYearD3(s),rules=inboxRulesD3(s),priority=inboxPriorityD3(item.key);
 const dispute=item.key.startsWith('commission-dispute-')&&rules.autoDisputes;
 const show=!dispute&&(priority==='urgent'||rules.yearlyCards===null||
  (log.cards<rules.yearlyCards&&(priority==='normal'||log.cards<rules.lowPriorityCards)));
 if(show){log.cards++;if(priority==='low')log.low++;item.depthTriage='card';return;}
 item.open=false;item.depthTriage='auto';log.auto++;
}
// Settles one filed item. Returns a short outcome, or throws if the decision could not be made.
function settleInboxItemD3(s,item){
 const k=item.key,ref=prefix=>k.slice(prefix.length);
 if(k.startsWith('commission-counter-')){const o=s.commissionOffers.find(x=>x.id===ref('commission-counter-'));
  if(!o||o.status!=='counter')return 'already handled';
  // Accepting only agrees terms (no production starts), so any counter that keeps the policy margin is taken.
  const ok=o.counterFee>=o.baseCost*(1+s.commissionPolicy.minMargin);
  if(ok)try{answerCommissionOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerCommissionOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('co-offer-')){const o=s.coProductionOffers.find(x=>x.id===ref('co-offer-'));
  if(!o||o.status!=='counter'||s.week>o.expiresWeek)return 'already handled';
  const ok=o.commitment<=s.coProductionPolicy.maxCommitment&&o.counterShare<=s.coProductionPolicy.maxShare;
  if(ok)try{answerCoProductionOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerCoProductionOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('rights-counter-')){const o=s.rightsOffers.find(x=>x.id===ref('rights-counter-'));
  if(!o||o.status!=='counter')return 'already handled';
  try{answerRightsOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerRightsOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('approval-')){const a=s.creativeApprovals.find(x=>x.id===ref('approval-'));
  if(!a||a.status!=='pending')return 'already handled';decideCreativeApproval(s,a.id,true);return 'creator request approved';}
 if(k.startsWith('commission-dispute-'))return autoResolveDisputeD3(s,ref('commission-dispute-'));
 return 'filed';
}
function autoResolveDisputeD3(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47?.status!=='open')return 'already handled';
 try{commissionResolve47(s,projectId,'rework');return 'dispute settled with paid rework';}
 catch(err){commissionResolve47(s,projectId,'arbitrate');return 'dispute settled by neutral arbitration';}
}
function settleFiledInboxD3(s){
 for(const item of [...s.inbox].reverse()){if(item.depthTriage!=='auto')continue;
  try{const outcome=settleInboxItemD3(s,item);item.depthTriage='settled';
   if(outcome!=='already handled')news(s,'Handled automatically: '+item.title,'Your '+CFG.depth.LABELS[s.settings.depth].name+' policy: '+outcome+'.','company');}
  catch(err){item.depthTriage='card';item.open=true;decisionYearD3(s).cards++;}// could not decide safely: hand it to the player
 }
}
const _alertBeforeD3=alert;
alert=function(s,key,title,body,kind='critical'){const before=s.inbox[0];_alertBeforeD3(s,key,title,body,kind);
 const item=s.inbox[0];if(item&&item!==before&&item.key===key)triageInboxItemD3(s,item);};
const _singleWeekBeforeD3=singleWeek;
singleWeek=function(s){settleFiledInboxD3(s);_singleWeekBeforeD3(s);settleFiledInboxD3(s);};
const _commissionInspectionBeforeD3=commissionInspection47;
commissionInspection47=function(s,projectId){const r=_commissionInspectionBeforeD3(s,projectId);
 if(r.status!=='open'||!inboxRulesD3(s).autoDisputes)return r;
 settleFiledInboxD3(s);
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 return {...(e?.review47||r),autoResolved:true};};
function decisionCardLog(s){const y=yearAt(s.week),d=s.decisionCards?.year===y?s.decisionCards:{year:y,cards:0,low:0,auto:0};
 return {...d,limit:inboxRulesD3(s).yearlyCards,lowLimit:inboxRulesD3(s).lowPriorityCards};}

function audit47A(s,problems){
 for(const e of s.escrows||[]){if(!e.review47)continue;
  const r=e.review47,p=s.projects.find(x=>x.id===e.projectId);
  if(!p||!Number.isInteger(r.week)||r.week> s.week||!['open','approved','remedied','cancelled','arbitrated'].includes(r.status)||
   !Number.isFinite(r.riskScore)||r.riskScore<1||r.riskScore>CFG.tuning_engine.audit47A__001||
   (r.status==='open'&&(e.settled||p.status!=='active'))||
   (r.status==='arbitrated'&&(!e.settled||p.status!=='cancelled'||money((r.refund||0)+(r.award||0))<0||Math.abs(money((r.refund||0)+(r.award||0)+e.advance+(e.milestonePaid||0)-e.fee))>CFG.tuning_engine.audit47A__002)))
     problems.push(e.id+': invalid contested milestone settlement');
 }
}
const _auditBefore47A=audit;
audit=function(s){const problems=_auditBefore47A(s);audit47A(s,problems);return problems;};


// Update 47 — one real lender workout for genuinely delinquent secured debt.
// No new lender cash, cancellation of principal, or disappearance of accrued interest.
function loanWorkoutQuote47(s,loanId){
 const loan=s.loans.find(l=>l.id===loanId),c=loan&&company(s,loan.debtorId);
 if(!c)throw new Error('Unknown borrower or lender claim.');
 const principal=money(loan.principalOutstanding),arrears=money(loan.interestArrears+loan.principalArrears);
 const collateral=money(Math.max(0,c.finance.cash)+Math.max(0,c.finance.receivable)*CFG.tuning_engine.collateral__001+
  Math.max(0,c.finance.inventory)*CFG.tuning_engine.collateral__002+Math.max(0,c.finance.investment)*CFG.tuning_engine.collateral__003);
 let reason='Conditional lender workout available.';
 if(!controlledCompanies(s).some(x=>x.id===c.id))reason='This loan belongs to another company.';
 else if(c.bankrupt||loan.status==='paid')reason='The borrower is bankrupt or the claim is already paid.';
 else if(loan.workout47)reason='Bank permits only one principal term extension.';
 else if(loan.status!=='delinquent')reason='Current loans do not qualify for distress protection.';
 else if(loan.missedPeriods>CFG.tuning_engine.loanWorkoutQuote47__001&&collateral<principal*CFG.tuning_engine.loanWorkoutQuote47__002)reason='Creditor declined: extended delinquency and insufficient recoverable collateral.';
 return {loanId,companyId:c.id,approved:reason==='Conditional lender workout available.',reason,
  outstandingPrincipal:principal,overduePrincipal:loan.principalArrears,overdueInterest:loan.interestArrears,
  termMonths:CFG.tuning_engine.loanWorkoutQuote47__003,oldAnnualRate:loan.interestRate,annualRate:money(Math.min(CFG.tuning_engine.loanWorkoutQuote47__004,Math.max(loan.interestRate,marketLoanRate(s,c.id))+CFG.tuning_engine.loanWorkoutQuote47__005)),
  collateralEstimate:collateral,source:'reviewed existing receivables and company assets; not a new capital injection'};
}
function restructureLoan47(s,loanId){
 requireExecutiveControl(s);
 const quote=loanWorkoutQuote47(s,loanId);
 if(!quote.approved)throw new Error(quote.reason);
 const loan=s.loans.find(l=>l.id===loanId),c=company(s,loan.debtorId);
 if(c.id===s.playerId)boardMandate(s,'restructuring',Math.min(CFG.tuning_engine.restructureLoan47__001,loan.principalOutstanding));
 const startPaid=loan.principalPaid,startPrincipal=loan.principalOutstanding,priorRate=loan.interestRate;
 loan.workout47={approvedWeek:s.week,principalAtStart:startPrincipal,principalPaidAtStart:startPaid,
   oldRate:priorRate,newRate:quote.annualRate,termMonths:CFG.tuning_engine.restructureLoan47__002,interestArrearsAtStart:loan.interestArrears,
   principalArrearsAtStart:loan.principalArrears};
 loan.installmentsDue=0;loan.principalArrears=0;loan.interestRate=quote.annualRate;
 // Unpaid interest stays legally payable; no fictional refinancing proceeds.
 loan.status=loan.interestArrears>0?'delinquent':'current';
 loan.missedPeriods=loan.status==='delinquent'?1:0;
 if(c.id===s.playerId)boardMandate(s,'restructuring',Math.min(CFG.tuning_engine.restructureLoan47__003,loan.principalOutstanding),true);
 news(s,'Lender modifies debt schedule for '+c.name,CFG.events.messages.restructureLoan47__001,'finance');
 return {...loan.workout47,loanId,principalOutstanding:loan.principalOutstanding,interestOutstanding:loan.interestArrears};
}
function audit47B(s,problems){
 for(const l of s.loans||[])if(l.workout47){
  const w=l.workout47;
  if(!Number.isInteger(w.approvedWeek)||w.approvedWeek<l.createdWeek||w.approvedWeek>s.week||w.termMonths!==CFG.tuning_engine.audit47B__001||
   w.principalAtStart<=0||w.principalPaidAtStart<0||
   Math.abs(money(w.principalAtStart+w.principalPaidAtStart-l.originalPrincipal))>CFG.tuning_engine.audit47B__002||
   !Number.isFinite(w.newRate)||w.newRate<w.oldRate||w.newRate>CFG.tuning_engine.audit47B__003||
   w.interestArrearsAtStart<0||w.principalArrearsAtStart<0)
    problems.push(l.id+': invalid lender restructuring records');
 }
}
const _auditBefore47B=audit;
audit=function(s){const problems=_auditBefore47B(s);audit47B(s,problems);return problems;};


// UPDATE 49 — regional game platform adoption and financed continuing support.
// No new industry or console-manufacturing enterprise: figures are aggregate
// eligible audiences, not real simulated devices or unlimited consumer wallets.
function gamePlatformMarket49(s,platform,region,week=s.week,generation=null){
 if(!GAME_PLATFORMS[platform])throw new Error('Unknown game platform.');
 const r=activeRegions(s).find(x=>x.name===region);
 if(!r)throw new Error('Unknown game market.');
 const debut=GAME_PLATFORMS[platform],year=yearAt(week);
 if(year<debut)return {platform,region,year,active:false,generation:0,installed:0,allGenerations:0,penetration:0,maturity:0,estimated:true};
 const current=gameGeneration(week,platform),g=generation===null?current:generation;
 if(!Number.isInteger(g)||g<1||g>current)throw new Error('Generation not commercially available.');
 const pace=ADOPTION_PACES[s.settings.adoptionPace]||1;
 const globalAge=Math.max(0,(week-(debut-1)*CFG.tuning_engine.globalAge__001)/CFG.tuning_engine.globalAge__002),genStart=(debut+(g-1)*CFG.tuning_engine.genStart__001-1)*CFG.tuning_engine.genStart__002;
 const age=Math.max(0,(week-genStart)/CFG.tuning_engine.age__001);
 // Platform addressable audience expands slowly even after its global debut.
 const regionalPopulation=Math.round(r.cash*CFG.tuning_engine.regionalPopulation__001*(s.settings.populationScale||1));
 const penetration=clamp(CFG.tuning_engine.penetration__001+CFG.tuning_engine.penetration__002*(1-Math.exp(-globalAge*pace/CFG.tuning_engine.penetration__003)),CFG.tuning_engine.penetration__004,CFG.tuning_engine.penetration__005);
 const allGenerations=Math.max(1,Math.floor(regionalPopulation*penetration));
 const generationAdoption=clamp(CFG.tuning_engine.generationAdoption__001+CFG.tuning_engine.generationAdoption__002*(1-Math.exp(-age*pace/CFG.tuning_engine.generationAdoption__003)),CFG.tuning_engine.generationAdoption__004,CFG.tuning_engine.generationAdoption__005);
 const retiredYears=Math.max(0,(week-(genStart+CFG.tuning_engine.retiredYears__001*CFG.tuning_engine.retiredYears__002))/CFG.tuning_engine.retiredYears__003);
 const retained=Math.exp(-retiredYears*CFG.tuning_engine.retained__001*pace);
 const installed=Math.min(allGenerations,Math.max(1,Math.floor(allGenerations*generationAdoption*retained)));
 return {platform,region,year,active:true,generation:g,currentGeneration:current,installed,allGenerations,
  penetration:Number(penetration.toFixed(CFG.tuning_engine.gamePlatformMarket49__001)),maturity:Number((generationAdoption*retained).toFixed(CFG.tuning_engine.gamePlatformMarket49__002)),estimated:true};
}
function gamePlatformDemand49(s,p,region){
 const g=p.videoGame;if(!g)return 1;
 const m=gamePlatformMarket49(s,g.platform,region,s.week,g.generation);
 if(!m.active)return 0;
 // Older generations keep niche sales, but active generations adopt gradually.
 return clamp(m.installed/Math.max(1,m.allGenerations)*CFG.tuning_engine.gamePlatformDemand49__001*(g.liveService49?.status==='active'?CFG.tuning_engine.gamePlatformDemand49__002:1),CFG.tuning_engine.gamePlatformDemand49__003,CFG.tuning_engine.gamePlatformDemand49__004);
}
function gamePlatformCapGross49(s,p,region,gross){
 const g=p.videoGame;if(!g||gross<=0)return gross;
 const m=gamePlatformMarket49(s,g.platform,region,s.week,g.generation);
 const price=g.model==='free-to-play'?CFG.tuning_engine.price__010:CFG.tuning_engine.price__011;
 // Paid units are unique purchasers of this title. Free-to-play units are a
 // weekly audience proxy, not lifetime unique users or a new spending pool.
 const acquired=g.model==='free-to-play'?0:Math.max(0,g.salesUnits[region]||0);
 const capacity=Math.max(0,m.installed-acquired);
 return money(Math.min(Math.floor(gross/price),capacity)*price);
}
function gamePlatformReport49(s,region=null){
 const regions=region?[region]:activeRegions(s).map(x=>x.name);
 return regions.flatMap(name=>Object.keys(GAME_PLATFORMS).filter(platform=>yearAt(s.week)>=GAME_PLATFORMS[platform]).map(platform=>gamePlatformMarket49(s,platform,name)));
}
function gameLiveService49(s,projectId,action='start'){
 requireExecutiveControl(s);
 const {p,c,g}=gameProject(s,projectId,false);
 if(p.status!=='released'||!['strategy','action','simulation'].includes(g.mechanic)||!['start','pause','resume','stop'].includes(action))
  throw new Error('A funded released competitive game is required for recurring support.');
 const live=g.liveService49||null;
 if(action==='start'&&live)throw new Error('This service has already been configured.');
 if(action!=='start'&&!live)throw new Error('No recurring service to manage.');
 if(action==='resume'&&live.status!=='paused')throw new Error('Only paused services can resume.');
 if(action==='pause'&&live.status!=='active'||action==='stop'&&live.status==='closed')throw new Error('Service already inactive.');
 const monthlyCost=CFG.tuning_engine.monthlyCost__001;
 if(action==='start'||action==='resume'){
  if(!gameDistributionAllowed(s,p,s.week))throw new Error('Publishing rights must remain effective for ongoing service.');
  if(c.finance.cash<monthlyCost+CFG.tuning_engine.gameLiveService49__001)throw new Error('Insufficient cash to fund service and retain an operating reserve.');
  expense(s,c,monthlyCost,'game-live-service','Competitive event and community hosting: '+p.title,p.id);
  p.directCost=money(p.directCost+monthlyCost);
  const rec=live||{status:'active',startedWeek:s.week,totalPaid:0,billed:0,history:[]};
  rec.status='active';rec.totalPaid=money(rec.totalPaid+monthlyCost);rec.billed++;
  rec.nextPeriod=yearAt(s.week)*CFG.tuning_engine.gameLiveService49__002+periodAt(s.week)+1;
  rec.history.push({week:s.week,kind:action,cost:monthlyCost});
  g.liveService49=rec;
 }else{
  live.status=action==='stop'?'closed':'paused';
  live.history.push({week:s.week,kind:action,cost:0});
 }
 return {...g.liveService49,history:g.liveService49.history.slice(-CFG.tuning_engine.gameLiveService49__003)};
}
function gameLiveServiceWeek49(s){
 const period=yearAt(s.week)*CFG.tuning_engine.period__001+periodAt(s.week);
 for(const p of s.projects){const live=p.videoGame?.liveService49;
  if(!live||live.status!=='active'||period<live.nextPeriod)continue;
  const c=company(s,p.companyId),cost=CFG.tuning_engine.cost__053;
  if(!c||c.bankrupt||p.status!=='released'||!gameDistributionAllowed(s,p,s.week)||c.finance.cash<cost+CFG.tuning_engine.gameLiveServiceWeek49__001){
   live.status='paused';live.history.push({week:s.week,kind:'automatic-pause',cost:0});
   if(c?.id===s.playerId)news(s,'Live service paused: '+p.title,CFG.events.messages.gameLiveServiceWeek49__001,'company');
  }else{
   expense(s,c,cost,'game-live-service','Monthly competitive event operations: '+p.title,p.id);
   p.directCost=money(p.directCost+cost);live.totalPaid=money(live.totalPaid+cost);live.billed++;
   live.history.push({week:s.week,kind:'monthly',cost});
  }
  live.nextPeriod=period+1;
  if(live.history.length>CFG.tuning_engine.gameLiveServiceWeek49__002)live.history.splice(0,live.history.length-CFG.tuning_engine.gameLiveServiceWeek49__003);
 }
}
function audit49(s,problems){
 for(const p of s.projects){if(p.sector!=='games'||!p.videoGame)continue;
  const g=p.videoGame,live=g.liveService49;
  if(yearAt(p.startWeek)<GAME_PLATFORMS[g.platform]||g.generation<1||
   g.salesUnits&&Object.values(g.salesUnits).some(x=>!Number.isInteger(x)||x<0))
   problems.push(p.id+': invalid platform debut or game units');
  if(!live)continue;
  if(!['active','paused','closed'].includes(live.status)||!Number.isInteger(live.startedWeek)||live.startedWeek> s.week||
   !Number.isInteger(live.billed)||live.billed<1||!Number.isFinite(live.totalPaid)||
   Math.abs(live.totalPaid-CFG.tuning_engine.audit49__001*live.billed)>CFG.tuning_engine.audit49__002||!Number.isInteger(live.nextPeriod)||
   !Array.isArray(live.history)||live.history.some(h=>h.week>s.week||!['start','resume','pause','stop','monthly','automatic-pause'].includes(h.kind)||h.cost<0||h.cost>CFG.tuning_engine.audit49__003))
   problems.push(p.id+': unfunded or invalid ongoing games service');
 }
}
const _auditBefore49=audit;
audit=function(s){const problems=_auditBefore49(s);audit49(s,problems);return problems;};


return {CONFIG:CFG,rivalMarketConcentration,rivalIntelligence,institutionsReport,automaticLenderDecision,openCreditLine,creditLineStatus,drawCreditLine,closeCreditLine,createDivision,assignTeamDivision,divisionPerformance,setCentralService,groupFinanceReport,companyPurchaseQuote,assetPurchaseQuote,acquisitionDiligence,acquireCompany,acquireAsset,integrateAcquisition,groupInternalLicense,subsidiaryDelegation,STARTUP_PROFILES,eraOverview43,capabilityReadiness43,managementStatus43,setManagement43,productionPath43,OBJECTIVE_DEFS43,TUTORIAL_STEPS43,beginTutorial43,endTutorial43,visitTutorial43,tutorialStatus43,chooseObjective43,objectiveStatus43,adviser43,portraitTraits43,syncWorldEvents43,worldEvents43,rightsPackageReport43,grantRightsPackage43,canDistribute43,gamePublisherQuote43,signGamePublisher43,gamePublisherReport43,technologyOffer43,acquireTechnology43,canUseIp,rivalResearch43,operatingStatus44,commissionInspection47,commissionDispute47,commissionResolve47,loanWorkoutQuote47,restructureLoan47,gamePlatformMarket49,gamePlatformReport49,gameLiveService49,corporateStatus,corporateReadiness,corporateValuation,corporateRisk,setRiskPolicy,setInsurance,insuranceStatus,groupInvestmentReview,renameCompany,investmentCommittee,incorporateStudio,boardVote,raiseEquity,launchIPO,sellFounderShares,payDividend,planLeadership,chooseLeader,stepDown,contestExecutiveControl,startFreshCompany,endRun,careerHistory,SAVE_VERSION,GAME_PLATFORMS,GAME_MECHANICS,GAME_MODELS,gameOfferExclusive,gameAnswerExclusive,gameBookExclusive,gameDesign,gamePrototype,gameBuildEngine,gameChooseEngine,gameQA,gameBeta,gameCertify,gameSetModel,gameCommunity,gameSupport,gameReadiness,openGameStore,gameStoreOffer,gameAnswerStoreOffer,gameListStore,gameSelectStore,gameSubscribeStore,gameStoreReport,gameWindows,requestStreamingLicense,answerStreamingLicense,TV_NETWORKS,TV_SLOTS,STREAM_TIERS,tvPlanSeason,tvWritersRoom,tvEditEpisode,tvCast,tvSchedule,tvUseBacklot,tvRatings,tvRenewSeason,tvEndSeries,streamingReady,launchStreamingService,setStreamingTier,licenseStreamingTitle,streamingCatalog,streamingReport,FILM_METHODS,buildFilmBacklot,useFilmBacklot,filmPremiere,filmActorPool,filmAudition,filmChooseCast,filmDecision,filmDistribution,filmBoxOffice,PUBLISHING_PRICES,openPublishingOutlet,listPublishingOutlet,closePublishingOutlet,publishingOutletReport,requestManuscriptApproval,reviewSerialArc,publishingFormatAvailable,publishingFormatTreatment,translatePublishingEdition,createPublishingImprint,assignPublishingImprint,publishingImprintReport,openPublishingPreorders,manuscriptMarket,negotiateManuscript,answerManuscript,publishingInterest,setPublishingChannel,setSerialCadence,publishingSalesReport,editorialAssessment,editorialDecision,creatorCareer,creativeAwards,worldHistory,scoutEmergingCreator,developEmergingCreator,publishingCharts,candidatePool,employeeRoster,hireCandidate,renewEmployee,releaseEmployee,setCompanyCulture,configureStaffDelegation,configureTalentAuthority,delegateSpecialists,trainTeam,teamPerformance,availableSpecialists,bookSpecialist,setFranchiseReleaseTarget,coordinateFranchiseReleases,franchiseMomentum,franchiseAudienceSignals,routineCounterQueue,batchApproveRoutineCounters,captureAnnualSnapshots,historicalCompanyFinances,portfolioRankings,portfolioRecords,searchNewsArchive,dismissRoutineAdvisories,setPausePolicy,setDepth,DEPTH_MODES,decisionCardLog,setDashboardFocus,SECTORS,THEMES,TARGET_AUDIENCES,CREATIVE_DIRECTIONS,MARKET_POSITIONINGS,coProductionQuote,investmentComparison,proposeCoProduction,answerCoProductionOffer,configureCoProductionAuthority,startCoProduction,coProductionStatement,requestCommission,answerCommissionOffer,configureCommissionAuthority,cancelProject,counterpartyTrust,WORLD_SCALES,activeRegions,regionalEconomyReport,audienceCohorts,estimateWeeklyPayroll,marketLoanRate,applyEconomicShock,businessTechnology,investResearch,adoptTechnology,technologyReport,worldMarketBudget,worldSetupWarnings,economicBrief,quarterlyMarketHistory,GENRES,FORMATS,MONTHS,ORIGINS,REGIONS,createGame,player,company,previewProject,createProject,franchiseBible,editFranchiseBible,editFranchiseBranch,franchiseSchedule,franchiseOverview,FRANCHISE_BRANCHES,changeProjectTeam,interveneProduction,projectEvidence,projectHistory,canUseIp,createOption,offerRights,offerRenewal,answerRightsOffer,exerciseLicensedOption,requestCreativeApproval,decideCreativeApproval,configureRightsAuthority,enterSector,capabilityCost,hireTeam,eligibleClients,advance,advanceToDecision,available,yearAt,yearWeek,periodAt,periodLabel,dismissAlert,companyProfit,companyBalance,currentProjectProfit,projectBudget,orderPrintRun,setPrintPolicy,writeOffPrintStock,productionFinancial,franchiseFinancial,financialStatements,settlementEvidence,groupSettlementEvidence,closedSettlementHistory,closedSettlementAudit,obligationExposure,groupObligationIntegrity,portfolioBudget,balanceSheetDetails,activeObligationRegister,rightsCalendar,royaltyStatements,liquidityForecast,loanLimit,borrowLoan,repayLoan,foundSubsidiary,controlledCompanies,chargeSharedServices,consolidatedStatements,audit,loadState,transactionsFor,shortMoney};
});

