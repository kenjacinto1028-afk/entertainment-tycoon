


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