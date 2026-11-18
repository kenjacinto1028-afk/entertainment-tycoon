
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