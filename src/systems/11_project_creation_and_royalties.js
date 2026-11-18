
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
  if(route==='contract'&&!signed&&c.id===s.playerId){const locked=contractSizeLockMessage(s,estimate.size,c);if(locked)throw new Error(locked);}
  if(route==='contract'&&!estimate.clientId)throw new Error('No funded client currently offers this commission. Pick a different project or wait for buyer funds.');
  if(route==='contract'&&!eligibleClients(s,estimate.contractFee,c.id).some(b=>b.id===estimate.clientId))
    throw new Error('Client lacks committed cash for this commission.');
  const team=selectTeam(s,c,data.teamId,data.genre||'Fantasy');
  if(!team)throw new Error('No available production team. Hire another team or wait for completion.');
  if(c.finance.cash < reserve+CFG.tuning_engine.createProject__004)throw new Error('Not enough available cash. A project requires a 30% initial liquidity reserve plus operating buffer.');
  if(c.id===s.playerId&&route!=='contract')boardGate(s,'greenlight',money(estimate.budget+estimate.marketing),true);// B2: Standard board block on big greenlights
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
  const project={id:id(s,'project'),title,companyId:c.id,sector,genre,format:estimate.format,productionRegion:estimate.productionRegion,route,ipId,grantId:null,teamId:team.id,clientId:null,escrowId:null,status:'active',printStock:null,startWeek:s.week,releaseWeek:null,overheadAttributed:0,overheadHistoryComplete:true,weeksTotal:estimate.weeks,weeksDone:0,budget:estimate.budget,marketingBudget:estimate.marketing,directCost:0,directRevenue:0,royaltyCost:0,earnedFee:route==='contract'?estimate.contractFee:0,advance:0,quality:releaseQuality,creativeQuality,technicalQuality,pitch,creativeHistoryComplete:true,phase:'concept',phaseHistory:[{week:s.week,phase:'concept'}],franchiseBranch:route==='contract'?null:FRANCHISE_BRANCHES.includes(data.franchiseBranch)?data.franchiseBranch:'main',franchiseHistoryComplete:true,holdUntilWeek:null,releasePlanHistory:[],specialistId:null,specialistAppointments:[],leadCharacter:typeof data.leadCharacter==='string'?data.leadCharacter.trim().slice(0,CFG.tuning_engine.project__001):'',editorialHistory:[],editorialHistoryComplete:true,creatorCredits:[],interventions:[],teamChanges:[],criticScore:null,audienceScore:null,repMilestones:{},audience:0,size:estimate.size,ai:isAI,major:estimate.grandTotal>c.finance.equity*CFG.tuning_engine.project__002||estimate.size>=CFG.tuning_engine.project__003||(estimate.forecast?.scenario.expected.gross||0)>c.finance.equity*CFG.tuning_engine.project__004||data.flagship===true||data.flagship==='yes',stats:{weeklySales:0,totalSales:0},serialReaderMomentum:1,serialEngagementHistory:[],serialArcDecisions:[],publishingFormatHistory:[],translations:[],preorderCampaign:null,imprintId:null,publishingChannel:sector==='publishing'?(isPrintEdition({sector,format:estimate.format,route})?'mixed':'digital'):null,serialCadence:sector==='publishing'&&estimate.format==='Web Serial'?'steady':null,salesByRegion:{},salesByChannel:{},salesUnitsByRegion:{},salesUnitsByChannel:{},salesUnitsByAudience:{},audienceUnitHistoryComplete:true,publishingUnitHistory:[],publishingUnitHistoryComplete:true,publishingSalesHistoryComplete:true,forecast:estimate.forecast,review:null,plannedTotal:estimate.grandTotal,
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