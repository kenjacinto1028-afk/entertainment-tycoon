
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

// Depth step 2 (B3): the player's Reputation decides how big a client job they are trusted with and how well it pays.
function contractTier(s,c=player(s)){
  const T=CFG.depth.CONTRACT_TIERS.tiers,rep=Number(c?.reputation)||0;
  let i=0;for(let k=0;k<T.length;k++)if(rep>=T[k].minReputation)i=k;
  const t=T[i],n=T[i+1]||null;
  return {tier:i+1,reputation:rep,maxSize:t.maxSize,payBonus:t.payBonus,label:t.label,nextAt:n?n.minReputation:null,nextLabel:n?n.label:null};
}
function contractSizeLockMessage(s,size,c=player(s)){
  const t=contractTier(s,c);
  if(t.maxSize===null||size<=t.maxSize+1e-9)return null;
  const T=CFG.depth.CONTRACT_TIERS.tiers,nx=T.find(x=>x.minReputation>t.reputation&&(x.maxSize===null||size<=x.maxSize+1e-9));
  return CFG.depth.CONTRACT_TIERS.lockedMessage.replace('{sizeName}',t.maxSize<=0.75+1e-9?'small':'mid-size').replace('{next}',nx?nx.minReputation:t.nextAt);
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
function backgroundWeights(s,sector,region,fatigue=null) {
  const results=[];
  for(const b of s.backgroundFirms){
    if(b.sector!==sector)continue;
    // A bankrupt owner may still have residual rights and sell its catalog,
    // but cannot spend additional production money or restart by fiat.
    for(const p of b.releases){
      const age=s.week-p.releaseWeek;if(age<0||age>=CFG.tuning_engine.backgroundWeights__001)continue;
      const weight=((p.quality/CFG.tuning_engine.weight__001)**CFG.tuning_engine.weight__002)*region.tastes[p.genre]*(fatigue?genreFatigueMult(sector,fatigue[p.genre]):1)*(1+CFG.tuning_engine.weight__003*p.marketingRatio)*Math.exp(-age/(sector==='publishing'?CFG.tuning_engine.weight__004:CFG.tuning_engine.weight__005));
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