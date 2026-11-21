
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
renderDashboard=function(){return _renderDashboardBeforeIdentity14.apply(this,arguments)+studioIdentityPanel14();};
