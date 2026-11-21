
// v14 / Stage 3: optional, finite, post-release film campaigns.
// Actual company cash is expensed; any lift competes inside the same audience wallet.
const FILM_AFTERCARE14={
 'fan-tour':{label:'Cast & fan screenings',costRate:.035,floor:4500,weeks:5},
 'restoration':{label:'Restore & relaunch catalog edition',costRate:.055,floor:6500,weeks:26}
};
function filmAftercareQuote14(s,projectId){
 const {p,c}=filmRequire(s,projectId,false);
 if(p.status!=='released'||!Number.isFinite(p.releaseWeek))throw new Error('A released film is required.');
 const channel=filmWindowChannel(p,s.week);
 const validRights=!p.grantId||activeRegions(s).some(r=>canDistribute43(s,p,r.name,s.week));
 const actions=p.cinema.aftercare14||[];
 const options=Object.entries(FILM_AFTERCARE14).map(([kind,info])=>{
  const cost=money(Math.max(info.floor,(p.budget||0)*info.costRate));
  const used=actions.some(a=>a.kind===kind),rights=p.route!=='contract'&&validRights;
  const stage=kind==='fan-tour'?channel==='theatrical'&&s.week-p.releaseWeek<=Math.min(8,filmTheatricalRunWeeks(p)-1):channel==='catalog';
  const reserve=weeklyOverhead(c,s)*3;
  const canAfford=c.finance.cash>=cost+reserve;
  return {kind,label:info.label,cost,window:info.weeks,
   available:!used&&rights&&stage&&canAfford,used,rights,stage,canAfford,
   reason:used?'Already completed':!rights?'Rights or production contract restricts the campaign':
    !stage?(kind==='fan-tour'?'Only during the first theatrical weeks':'Available when the film enters catalog'):
    !canAfford?'Insufficient cash after three weeks of overhead':'Optional; returns depend on actual audience demand'};
 });
 return {projectId:p.id,channel,actions:actions.map(a=>({...a})),options};
}
function filmAftercare14(s,projectId,kind){
 if(!FILM_AFTERCARE14[kind])throw new Error('Unknown film promotion.');
 const {p,c}=filmRequire(s,projectId,false);
 const quote=filmAftercareQuote14(s,projectId),o=quote.options.find(x=>x.kind===kind);
 if(!o?.available)throw new Error(o?.reason||'Promotion unavailable.');
 // The decision changes demand weight rather than directly creating sales.
 expense(s,c,o.cost,'film-postrelease',FILM_AFTERCARE14[kind].label+' for '+p.title,p.id);
 p.directCost=money((p.directCost||0)+o.cost);
 p.cinema.aftercare14 ||= [];
 const action={week:s.week,kind,cost:o.cost};
 p.cinema.aftercare14.push(action);
 news(s,p.title+': '+o.label,'Post-release campaign funded from '+c.name+' operating cash. Financial results depend on remaining audience demand.','production');
 return {...action,projectId:p.id};
}
function filmAftercareFactor14(p,week,channel){
 let effect=0;
 for(const a of p.cinema?.aftercare14||[]){
  const info=FILM_AFTERCARE14[a.kind];
  if(!info)continue;
  const elapsed=week-a.week;
  if(elapsed<0||elapsed>=info.weeks)continue;
  if(a.kind==='fan-tour'&&channel==='theatrical')effect+=.14*(1-elapsed/info.weeks);
  if(a.kind==='restoration'&&channel==='catalog')effect+=.20*(1-elapsed/info.weeks);
 }
 return Math.round((1+Math.min(.20,effect))*10000)/10000;
}
function auditAftercare14(s,problems){
 for(const p of s.projects||[]){
  if(p.sector!=='movie'||!p.cinema||p.cinema.aftercare14===undefined)continue;
  if(!Array.isArray(p.cinema.aftercare14)){problems.push(p.id+': invalid after-release campaigns');continue;}
  const seen=new Set();
  for(const a of p.cinema.aftercare14){
   if(!FILM_AFTERCARE14[a.kind]||seen.has(a.kind)||p.status!=='released'||
     !Number.isInteger(a.week)||a.week<p.releaseWeek||a.week>s.week||
     !Number.isFinite(a.cost)||a.cost<0)
    problems.push(p.id+': invalid post-release promotion record');
   seen.add(a.kind);
  }
 }
}
const _auditBeforeAftercare14=audit;
audit=function(s){const problems=_auditBeforeAftercare14(s);auditAftercare14(s,problems);return problems;};
