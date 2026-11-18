
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