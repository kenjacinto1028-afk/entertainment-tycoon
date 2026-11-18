
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