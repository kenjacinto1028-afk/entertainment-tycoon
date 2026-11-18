
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