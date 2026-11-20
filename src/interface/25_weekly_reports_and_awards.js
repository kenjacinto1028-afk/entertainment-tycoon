
// Weekly studio pulse and annual awards ceremony.
// Read-only presentation of booked events; no simulated winnings or sales.
function filmWeeklyStudioReport(){
 if(!S)return '';
 const mine=myProjects().filter(p=>p.sector==='movie');
 if(!mine.length)return '';
 const active=mine.filter(p=>p.status==='active');
 const releases=mine.filter(p=>p.status==='released'&&p.releaseWeek===S.week);
 const theaters=mine.filter(p=>p.status==='released'&&E.filmWindowChannel(p,S.week)==='theatrical');
 const gross=theaters.reduce((sum,p)=>sum+(p.cinema?.weeklyBoxOffice||[]).filter(w=>w.week===S.week&&w.channel==='theatrical').reduce((n,w)=>n+w.gross,0),0);
 const upcoming=active.slice().sort((a,b)=>(a.weeksTotal-a.weeksDone)-(b.weeksTotal-b.weeksDone))[0];
 const updates=[];
 if(releases.length)updates.push(releases.map(p=>esc(p.title)).join(', ')+' released this week');
 if(upcoming)updates.push('Next expected completion: '+esc(upcoming.title)+' · '+Math.ceil(Math.max(0,upcoming.weeksTotal-upcoming.weeksDone))+' work units remaining');
 if(!updates.length)updates.push('All productions are advancing automatically; no intervention required.');
 return "<section class='fc-weekly' aria-label='Weekly studio report'><div><small>THIS WEEK AT YOUR STUDIO · "+esc(weekLabel(S.week))+"</small><h2>Film studio report</h2><p>"+updates.join(' · ')+"</p></div><div class='fc-weekly-metrics'><span><strong>"+active.length+"</strong><small>Producing</small></span><span><strong>"+theaters.length+"</strong><small>In theaters</small></span><span><strong>"+fmt(gross)+"</strong><small>Theatrical gross this week</small></span></div><button type='button' class='btn btn-outline btn-mini' data-open-movie-center>Open Production Center</button></section>";
}
const _renderDashboardBeforeWeeklyFilms=renderDashboard;
renderDashboard=function(){
 return _renderDashboardBeforeWeeklyFilms.apply(this,arguments)+filmWeeklyStudioReport();
};
document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-open-movie-center]');
 if(!b)return;
 industry='movie';view='productions';render();window.scrollTo(0,0);
});
function showYearEndAwardsIfNew(previousYear){
 if(!S||!Number.isFinite(previousYear)||E.yearAt(S.week)===previousYear)return;
 // A real award entry is created at the completed year's close. A release by
 // itself is not an award, and no ceremonial result changes the studio ledger.
 const year=E.yearAt(S.week)-1;
 const awards=(S.creativeAwards||[]).filter(a=>a.year===year);
 const festivals=(S.filmHonors||[]).filter(a=>a.year===year);
 if(!awards.length&&!festivals.length)return;
 if($('modal')?.classList.contains('open'))return;
 const key='studio-syndicate-awards-'+S.seed+'-'+S.playerId+'-'+year;
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch(_){}
 const names={publishing:'Publishing',movie:'Film',tv:'Television',games:'Video games'};
 const rows=awards.map(a=>{
  const p=S.projects.find(p=>p.id===a.projectId),c=E.company(S,a.companyId);
  return "<div class='fc-award-row'><span>"+esc(names[a.sector]||a.sector)+"</span><div><strong>"+esc(p?.title||'Recorded production')+"</strong><small>"+esc(c?.name||'Unknown studio')+"</small></div>"+(a.companyId===S.playerId?"<b>Your studio</b>":"")+"</div>";
 }).join('');
 const special=festivals.length?"<h3>Festival recognition</h3>"+festivals.map(a=>{
  const p=S.projects.find(p=>p.id===a.projectId);
  return "<div class='fc-award-row'><span>"+esc(a.festivalName||'Film festival')+"</span><div><strong>"+esc(p?.title||'Film')+"</strong><small>Critic recognition</small></div></div>";
 }).join(''):'';
 showModal(modalHead('Year '+year+' · Entertainment Awards')+
  "<div class='fc-awards-intro'>THE YEAR IN ENTERTAINMENT<p>Honors from real released productions across the simulated world.</p></div>"+
  "<div class='fc-awards-list'>"+rows+special+"</div>"+
  "<div class='fc-awards-footer'><span>Recorded awards only · historical results remain in company and creator records.</span><button type='button' class='btn btn-primary' data-close-modal>Continue</button></div>");
}
