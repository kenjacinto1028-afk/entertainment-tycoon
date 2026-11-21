
// Film Production Center (2026-11): a presentation layer over the existing
// project, cinema and finance ledgers. No shadow state, invented cash or RNG.
let filmCenterFocusId=null,filmCenterOlder=false;
const FILM_STAGES=['Development','Pre-production','Filming','Post-production','Marketing','In theaters','Catalog'];
function filmCenterStage(p){
 const active=p.status==='active',r=active?Math.max(0,Math.min(1,(p.weeksDone||0)/Math.max(1,p.weeksTotal||1))):1;
 const age=Number.isFinite(p.releaseWeek)?Math.max(0,S.week-p.releaseWeek):0;
 const run=E.filmTheatricalRunWeeks(p);
 let index=active?(r<.12?0:r<.28?1:r<.77?2:r<.91?3:4):E.filmWindowChannel(p,S.week)==='theatrical'?5:6;
 if(p.status==='cancelled')index=6;
 const channel=active?'production':E.filmWindowChannel(p,S.week);
 const label=p.status==='cancelled'?'Cancelled':active?FILM_STAGES[index]:channel==='theatrical'?'In theaters · Week '+(age+1)+' of '+run:channel==='premium-rental'?'Rental & digital':'Catalog · theatrical run ended';
 return {index,label,ratio:r,age,run,channel,active};
}
function filmCenterHype(p){
 const c=E.company(S,p.companyId),f=p.cinema||{};
 const marketing=Math.min(18,Math.max(0,p.marketingBudget||0)/Math.max(1,p.budget||1)*60);
 const actual=p.status==='released'?(Number.isFinite(p.audienceScore)?(p.audienceScore-55)*.3:0):0;
 return Math.max(6,Math.min(98,Math.round(18+(c?.reputation||45)*.37+marketing+(f.castActorId?7:0)+(f.premiere?5:0)+(f.festival?.won?4:0)+actual)));
}
function filmCenterQuality(p){
 if(p.status==='released')return (p.criticScore??p.quality??'—')+' / 100';
 const progress=Math.max(0,Math.min(1,(p.weeksDone||0)/Math.max(1,p.weeksTotal||1)));
 const projected=Number.isFinite(p.forecast?.estimatedQuality)?p.forecast.estimatedQuality:Math.round((p.creativeQuality||55)*.52+(p.technicalQuality||55)*.48);
 const center=Math.round(projected+(p.cinema?.screenings?.length?((p.cinema.screenings.at(-1).estimate-projected)*.3):0));
 const spread=Math.max(5,Math.round(15-progress*9));
 return Math.max(1,center-spread)+'–'+Math.min(100,center+spread);
}
function filmCenterSummary(p,st){
 const cash=E.projectBudget(S,p.id),forecast=p.forecast?.scenario;
 const remaining=Math.max(0,Math.ceil((p.weeksTotal||0)-(p.weeksDone||0)));
 const date=st.active?weekLabel(S.week+remaining):weekLabel(p.releaseWeek||S.week);
 const gross=forecast?.expected?.gross;
 const actual=Object.values(p.cinema?.boxOffice||{}).reduce((n,v)=>n+v,0);
 const kpi=(label,value,foot)=>"<div class='fc-kpi'><small>"+label+"</small><strong>"+value+"</strong>"+(foot?"<em>"+foot+"</em>":"")+"</div>";
 return "<div class='fc-metrics'>"+
  kpi(st.active?'Estimated quality':'Critic score',esc(filmCenterQuality(p)),st.active?'Range, not final score':'Final review')+
  kpi('Public interest',filmCenterHype(p)+" / 100",'Indicative hype')+
  kpi('Project spending',fmt(p.directCost||0),'Approved '+fmt(cash.plannedTotal||0))+
  kpi(st.active?'Estimated release':'Release date',esc(date),st.active?'Schedule can change':(st.channel==='theatrical'?'Theatrical week '+(st.age+1):'Released'))+
  kpi(st.active?'Forecast gross':'Recorded gross',st.active?(Number.isFinite(gross)?fmt(gross):'Not forecast'):fmt(actual),st.active?'Scenario estimate':'Across all channels')+
  "</div>";
}
function filmCenterMilestones(p,st){
 const steps=[
  ['Script & pitch',0],['Crew and cast',.12],['Principal photography',.28],
  ['Final edit',.77],['Marketing preparations',.91],['Theatrical premiere',1]
 ];
 const items=steps.map(([name,n],i)=>{
  const done=st.active?st.ratio>=n&&n!==1:!st.active&&p.status==='released';
  const current=st.active?i===st.index:st.channel==='theatrical'&&i===5;
  let aside='';if(current&&st.active)aside=Math.ceil(Math.max(0,p.weeksTotal-p.weeksDone))+' work units to release';
  if(i===5&&!st.active&&Number.isFinite(p.releaseWeek))aside=weekLabel(p.releaseWeek);
  return "<li class='"+(done?'fc-done ':'')+(current?'fc-current':'')+"'><span>"+(done?'✓':current?'◉':'○')+"</span><span>"+name+"</span><small>"+esc(aside)+"</small></li>";
 }).join('');
 return "<section class='fc-subpanel'><h3>Production milestones</h3><ol class='fc-milestones'>"+items+"</ol></section>";
}
function filmCenterChoice(p,st){
 if(!st.active)return "<section class='fc-subpanel fc-note'><h3>Automatic progression</h3><p>The theatrical result is recorded each week. Rental and catalog windows follow automatically, without a new release order.</p></section>";
 const acts=p.cinema?.actions||[],has=k=>acts.some(a=>a.action===k);
 const eligible=p.route!=='contract';
 let choice=null;
 if(eligible&&!has('script')&&st.ratio<.48)choice=['script','Script rewrite','Invest in a tighter screenplay. Adds cost and two work units; improves creative quality.'];
 else if(eligible&&!has('screening')&&st.ratio>=.40&&st.ratio<.97)choice=['screening','Audience screening','Pay for an early audience reading before the film is locked.'];
 else if(eligible&&!has('reshoot')&&st.ratio>=.35&&st.ratio<.88)choice=['reshoot','Selected reshoots','Revisit key scenes at a direct cost and a longer schedule.'];
 else if(eligible&&!has('festival')&&st.ratio>=.75)choice=['festival','Festival submission','Fund a festival entry as the film approaches completion.'];
 if(choice){
  const disabled=filmCenterDismissed.has(p.id+':'+choice[0]);
  if(!disabled)return "<section class='fc-subpanel fc-decision'><div class='fc-decision-label'>OPTIONAL DIRECTOR'S DECISION</div><h3>"+choice[1]+"</h3><p>"+choice[2]+"</p><div class='fc-actions'><button type='button' class='btn btn-primary' data-film-action='"+choice[0]+"' data-film-id='"+esc(p.id)+"'>Review & approve</button><button type='button' class='btn btn-outline' data-film-skip='"+esc(p.id+':'+choice[0])+"'>Keep current plan</button></div></section>";
 }
 return "<section class='fc-subpanel fc-note'><h3>Production delegated</h3><p>The studio team advances this film every week. More casting, publicity and release options are available under Studio decisions.</p><button type='button' class='btn btn-outline btn-mini' data-film-tools>Studio decisions</button></section>";
}
const filmCenterDismissed=new Set();
function filmCenterBoxOffice(p,st){
 const rec=(p.cinema?.weeklyBoxOffice||[]).filter(x=>x.channel==='theatrical');
 const totals=new Map();
 for(const w of rec)totals.set(w.week,(totals.get(w.week)||0)+w.gross);
 const weeks=[...totals.keys()].sort((a,b)=>a-b).slice(-8),peak=Math.max(1,...weeks.map(w=>totals.get(w)));
 const weekly=totals.get(S.week)||0,prior=totals.get(S.week-1)||0;
 const run=st.run,remaining=Math.max(0,run-st.age-1);
 const bars=weeks.map(w=>"<div class='fc-bar'><i style='height:"+Math.max(5,Math.round(100*totals.get(w)/peak))+"%'></i><small>W"+(w-p.releaseWeek+1)+"</small></div>").join('');
 const gross=Object.values(p.cinema?.channels||{}).reduce((n,x)=>n+x,0);
 return "<section class='fc-theaters'><div><small>THEATRICAL PERFORMANCE</small><h3>"+esc(p.title)+"</h3><p>"+(st.channel==='theatrical'?'Week '+(st.age+1)+' of '+run+' · '+remaining+' estimated weeks left':'Theatrical run completed · now '+(st.channel==='catalog'?'in catalog':'in rental / digital'))+"</p></div>"+
  "<div class='fc-gross'><small>This week</small><strong>"+fmt(weekly)+"</strong><em>"+(prior?'Previous '+fmt(prior):'Opening week or no sales recorded')+"</em></div>"+
  "<div class='fc-gross'><small>All-channel gross</small><strong>"+fmt(gross)+"</strong><em>Consumer spending already booked</em></div>"+
  "<div class='fc-chart' aria-label='Recorded weekly theatrical gross'>"+(bars||"<span class='fc-empty-chart'>Box office will appear after the first sales week.</span>")+"</div></section>";
}
function filmProductionCenter(projects){
 const sorted=[...projects].filter(p=>p.status!=='cancelled').sort((a,b)=>(b.status==='active'?1:0)-(a.status==='active'?1:0)||(b.startWeek||0)-(a.startWeek||0));
 const active=sorted.filter(p=>p.status==='active');
 const inTheaters=sorted.filter(p=>p.status==='released'&&E.filmWindowChannel(p,S.week)==='theatrical');
 const recent=sorted.filter(p=>p.status==='released').sort((a,b)=>(b.releaseWeek||0)-(a.releaseWeek||0));
 const choice=sorted.find(p=>p.id===filmCenterFocusId)||active[0]||inTheaters[0]||recent[0];
 const summary="<div class='fc-overview'><span><b>"+active.length+"</b> In production</span><span><b>"+inTheaters.length+"</b> In theaters</span><span><b>"+recent.length+"</b> Released</span><span class='fc-auto'>● Automatic progress · weekly</span></div>";
 if(!choice)return "<section class='film-center'>"+summary+"<div class='fc-empty'><h2>Your film slate starts here</h2><p>Greenlight a movie to follow its development, filming, release and long-term catalog life.</p><button class='btn btn-primary' data-project='movie'>Greenlight a film</button></div></section>";
 const st=filmCenterStage(choice);
 const filmName=esc(choice.title);
 const stageUI="<div class='fc-stagebar'>"+FILM_STAGES.map((name,i)=>"<div class='fc-stage "+(i<st.index?'fc-stage-done ':i===st.index?'fc-stage-here':'')+"'><span>"+(i<st.index?'✓':i+1)+"</span><small>"+name+"</small></div>").join('')+"</div>";
 const take=filmCenterOlder?sorted:sorted.slice(0,7);
 const projectItems=take.map(p=>{const a=filmCenterStage(p);return "<button type='button' class='fc-slate-item "+(p.id===choice.id?'fc-selected':'')+"' data-film-focus='"+esc(p.id)+"'><strong>"+esc(p.title)+"</strong><small>"+esc(a.label)+"</small></button>";}).join('');
 const list="<section class='fc-slate'><h3>Current film slate</h3>"+projectItems+(sorted.length>7?"<button type='button' class='fc-more' data-film-older='1'>"+(filmCenterOlder?'Show fewer':'View '+(sorted.length-7)+' older films')+"</button>":"")+"</section>";
 const decision=filmCenterChoice(choice,st);
 const projectedRemaining=Math.max(0,Math.ceil((choice.weeksTotal||0)-(choice.weeksDone||0)));
 const sub=st.active?'Approximately '+projectedRemaining+' work units remaining · release '+weekLabel(S.week+projectedRemaining):st.channel==='theatrical'?'Theatrical run estimated at '+st.run+' weeks':'Theatrical run completed; remaining rights continue to earn in rental or catalog';
 const hero="<section class='fc-feature'><div class='fc-hero'><div class='fc-hero-eyebrow'>FEATURED FILM · "+esc(choice.genre)+"</div><h2>"+filmName+"</h2><div class='fc-hero-state'>"+esc(st.label)+"</div><p>"+esc(sub)+"</p></div>"+stageUI+filmCenterSummary(choice,st)+"</section>";
 const theaterFilm=inTheaters[0]||(choice.status==='released'?choice:recent[0]);
 const theaterBox=theaterFilm?filmCenterBoxOffice(theaterFilm,filmCenterStage(theaterFilm)):"<section class='fc-theaters fc-wait'><div><small>THEATRICAL BOX OFFICE</small><h3>Upcoming releases</h3><p>Weekly sales and estimated run length appear here when a film opens.</p></div></section>";
 return "<section class='film-center' aria-label='Film production and release tracking'>"+summary+"<div class='fc-layout'><div class='fc-main'>"+hero+"<div class='fc-details'>"+filmCenterMilestones(choice,st)+decision+"</div></div>"+list+"</div>"+theaterBox+"</section>";
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.filmFocus){filmCenterFocusId=b.dataset.filmFocus;render();return;}
 if(b.dataset.filmOlder){filmCenterOlder=!filmCenterOlder;render();return;}
 if(b.dataset.filmSkip){filmCenterDismissed.add(b.dataset.filmSkip);render();return;}
 if(b.hasAttribute('data-film-tools')){const d=document.querySelector('#film-studio-decisions');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});}return;}
});
