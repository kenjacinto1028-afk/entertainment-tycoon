
// v14: dashboard studio identity with evidence rather than a manually selected title.
function studioIdentityPanel14(){
 if(!S)return '';
 const i=E.studioIdentity14(S,E.player(S).id);
 const detail=i.releaseCount?('Based on '+i.releaseCount+' released '+(i.filmCount?'films':'works')+
  ', '+i.commercialHits+' commercially successful and '+i.honors+' awarded.'):
  'Your studio identity develops from released work, not a permanent starting label.';
 const signatures=[
  ['Genre signature',i.leadingGenre?(i.leadingGenre+' · '+i.genreShare+'% of releases'):'Unestablished'],
  ['Story signature',i.storyTheme||'Unestablished'],
  ['Creative direction',i.creativeApproach||'Unestablished'],
  ['Recurring talent',i.recurringActor||i.recurringCreator||'Build ongoing collaborations'],
  ['Studio culture',i.staffCulture],
  ['Critic track record',i.averageQuality===null?'Not rated':i.averageQuality+'/100']
 ];
 const rows=signatures.map(([label,value])=>'<div class="v14-identity-stat"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('');
 const message=i.genreCount>=2?'Specializing in '+esc(i.leadingGenre)+' creates a small discoverability edge for future releases. Changing genres may cost some familiarity.':'Release more films to establish a recognizable creative identity and earn audience familiarity.';
 return panel('Studio identity · '+esc(i.tier),'<div class="v14-identity"><h3>'+esc(i.classification)+'</h3><p>'+esc(detail)+'</p><div class="v14-identity-grid">'+rows+'</div><p class="panel-sub">'+message+'</p></div>');
}
const _renderDashboardBeforeIdentity14=renderDashboard;
renderDashboard=function(){return _renderDashboardBeforeIdentity14.apply(this,arguments)+studioIdentityPanel14()+industryRadarPanel14();};

function industryRadarPanel14(){
 if(!S)return '';
 const c=E.player(S),sector=c.capabilities?.movie?'movie':c.sector;
 const snapshot=E.industryPulse14(S,sector),rivals=E.rivalWatch14(S,sector);
 const rows=snapshot.genres.slice(0,4).map(g=>'<div class="v14-radar-row"><strong>'+esc(g.genre)+'</strong><span>'+esc(g.trend)+'</span><span>'+Math.round(g.multiplier*100)+'% relative attention</span></div>').join('');
 const slate=rivals.active.slice(0,3).map(p=>'<div class="v14-radar-rival"><strong>'+esc(p.company)+'</strong> · '+esc(p.title)+' <small>('+esc(p.genre)+' · '+p.completion+'% produced)</small></div>').join('');
 const takeaway=snapshot.leader?'Strongest current interest: '+snapshot.leader.genre+'. '+(snapshot.laggard?'Cooler: '+snapshot.laggard.genre+'.':''):'Trend data unavailable.';
 return panel('Living industry · '+esc(E.SECTORS[sector].name),
  '<p class="panel-sub">World quarter '+(snapshot.quarter+1)+' · '+esc(takeaway)+' Audience attention changes with seasonal tastes, recent successes and crowded release schedules.</p>'+
  '<div class="v14-radar"><div><h3>Genre interest</h3>'+rows+'</div><div><h3>Rival productions</h3>'+(slate||'<p class="panel-sub">No competing projects are currently in production.</p>')+
  '<p class="panel-sub">'+rivals.releases.length+' recent rival releases on record. Only public commitments are shown.</p></div></div>');
}

document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-film-aftercare]');
 if(!b)return;
 try{E.filmAftercare14(S,b.dataset.filmId,b.dataset.filmAftercare);
  remember();render();notify('Post-release campaign funded. Audience response will appear in future weekly results.');
 }catch(e){notify(e.message,'error');}
});
