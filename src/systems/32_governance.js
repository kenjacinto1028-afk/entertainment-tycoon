
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