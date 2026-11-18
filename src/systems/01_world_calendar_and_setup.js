
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