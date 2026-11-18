
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