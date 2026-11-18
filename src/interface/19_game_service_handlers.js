
document.addEventListener('click',event=>{const b=event.target.closest('button[data-u47]');if(!b)return;
 const action=b.dataset.u47,id=b.dataset.id47;
 if(action==='inspect'){safe(()=>{const r=E.commissionInspection47(S,id);notify(r.autoResolved?'Client disputed delivery; settled automatically ('+(r.settlement==='paid-rework'?'paid rework':'neutral arbitration')+').':r.status==='open'?'Client delivery contested. Review remedy or arbitration.':'Client approved inspection; production continues.');});return;}
 if(['remedy','cancel','arbitrate'].includes(action)){
  if(!confirm(action==='arbitrate'?'Accept a neutral ruling that may cancel delivery and split the protected escrow?':action==='cancel'?'Cancel this client project and return unearned protected funds?':'Pay real cash and extend the schedule by two weeks to satisfy the client?'))return;
  safe(()=>{const r=E.commissionResolve47(S,id,action==='remedy'?'rework':action);notify('Delivery dispute resolved: '+r.decision+'.');});return;
 }
 if(action==='workout'){
  const q=E.loanWorkoutQuote47(S,id);if(!q.approved)return notify(q.reason,'error');
  if(!confirm('Bank will reschedule the remaining principal over 24 monthly closes at '+(q.annualRate*CFG.tuning_ui.documentEvents__029).toFixed(1)+'% interest. Outstanding interest remains payable. Apply?'))return;
  safe(()=>{E.restructureLoan47(S,id);notify('Lender workout signed. No cash injected or debt written off.');});return;
 }
});

// UPDATE 49 — optional management for platform reach and recurring game events.
const _gameStudioPanel48=gameStudioPanel;
gameStudioPanel=function(){
 const market=E.gamePlatformReport49(S);
 const platformInfo=panel('Platform installed audiences · modeled estimates',
  '<p class="panel-sub">Game sales compete for finite regional consumer spending and the audience already using each platform generation. New generations grow gradually; old releases retain a specialist market. These are estimates, not console sales or manufacturing.</p>'+
  '<div class="two-cols">'+E.activeRegions(S).slice(0,CFG.tuning_ui.platformInfo__001).map(r=>{
   const rows=market.filter(x=>x.region===r.name);
   return '<div><h3>'+esc(r.name)+'</h3>'+(rows.map(x=>'<div class="small-stat"><span>'+esc(x.platform.toUpperCase())+' · generation '+x.generation+'</span><strong>'+suffix(x.installed)+' installed (est.)</strong></div>').join('')||'<p class="panel-sub">No game platforms debuted yet.</p>')+'</div>';
  }).join('')+'</div>');
 const games=myProjects().filter(p=>p.sector==='games'&&p.status==='released'&&p.route!=='contract'&&['strategy','action','simulation'].includes(p.videoGame?.mechanic)).slice(-CFG.tuning_ui.games__001).reverse();
 const service=panel('Optional ongoing game community & esports',
  '<p class="panel-sub">Competitive events and community hosting cost 1,250 per month while active. Payments reduce project contribution. An active service modestly improves audience retention inside the same capped market. Services pause automatically if cash or distribution rights expire; routine work is delegated.</p>'+
  (games.map(p=>{
   const live=p.videoGame.liveService49;
   const control=!live?btn('Start recurring events · '+fmt(CFG.tuning_ui.control__001),`data-u49-service="${esc(p.id)}" data-u49-action="start"`):
    live.status==='active'?btn('Pause paid events',`data-u49-service="${esc(p.id)}" data-u49-action="pause"`)+btn('End events',`data-u49-service="${esc(p.id)}" data-u49-action="stop"`):
    live.status==='paused'?btn('Resume paid events · '+fmt(CFG.tuning_ui.control__002),`data-u49-service="${esc(p.id)}" data-u49-action="resume"`)+btn('End events',`data-u49-service="${esc(p.id)}" data-u49-action="stop"`):badge('Ended');
   return '<div class="record"><strong>'+esc(p.title)+'</strong><p class="panel-sub">'+esc(live?.status||'Not started')+' · paid '+fmt(live?.totalPaid||0)+' in '+suffix(live?.billed||0)+' periods</p><div class="head-actions">'+control+'</div></div>';
  }).join('')||'<p class="panel-sub">Release a suitable game before starting optional recurring events.</p>'));
 return _gameStudioPanel48()+platformInfo+service;
};
document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-u49-service]');if(!b)return;
 safe(()=>{const row=E.gameLiveService49(S,b.dataset.u49Service,b.dataset.u49Action);notify('Ongoing game events: '+row.status+'.');});
});

init();