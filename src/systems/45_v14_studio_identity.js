
// v14 / Stage 1: studio identity emerges from actual releases, collaborators and honors.
// Read-only: no backfilled award, paid audience, revenue or invented creative credit.
function studioIdentity14(s,companyId,asOfWeek=s.week){
 const firm=company(s,companyId);
 if(!firm)throw new Error('Unknown studio for identity report.');
 const releases=(s.projects||[]).filter(p=>p.companyId===companyId&&p.status==='released'&&p.route!=='contract'&&Number.isFinite(p.releaseWeek)&&p.releaseWeek<=asOfWeek);
 const films=releases.filter(p=>p.sector==='movie');
 const works=films.length?films:releases;
 const genres=new Map(),stories=new Map(),directions=new Map(),cast=new Map(),creators=new Map();
 let quality=0,successful=0;
 for(const p of works){
  quality+=p.criticScore??p.quality??0;
  const multiple=p.directCost>0?(p.directRevenue||0)/p.directCost:0;
  if(multiple>=1.5)successful++;
  genres.set(p.genre,(genres.get(p.genre)||0)+1);
  if(p.pitch?.theme)stories.set(p.pitch.theme,(stories.get(p.pitch.theme)||0)+1);
  if(p.pitch?.direction)directions.set(p.pitch.direction,(directions.get(p.pitch.direction)||0)+1);
  if(p.cinema?.castActorId)cast.set(p.cinema.castActorId,(cast.get(p.cinema.castActorId)||0)+1);
  for(const credit of p.creatorCredits||[])creators.set(credit.personId,(creators.get(credit.personId)||0)+1);
 }
 const top=map=>[...map.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])))[0]||[null,0];
 const [leadingGenre,genreCount]=top(genres);
 const [storyTheme,themeCount]=top(stories);
 const [creativeApproach]=top(directions);
 const [leadActorId,actorCount]=top(cast);
 const [creatorId,creatorCount]=top(creators);
 const honors=(s.creativeAwards||[]).filter(a=>a.companyId===companyId&&(a.awardedWeek??(a.year*52))<=asOfWeek).length+
  (s.filmHonors||[]).filter(a=>a.projectId&&works.some(p=>p.id===a.projectId)&&(a.awardedWeek??(a.year*52))<=asOfWeek).length;
 const averageQuality=works.length?Math.round(quality/works.length):null;
 const concentration=works.length?genreCount/works.length:0;
 const score=works.length*1.5+successful*1.25+honors*2+(averageQuality||0)/18;
 const tier=score>=32?'Legendary':score>=18?'Major':score>=9?'Established':score>=4?'Rising':'Independent';
 let classification='Emerging studio';
 if(works.length>=2){
  if(honors>=2&&averageQuality>=65)classification='Prestige filmmaker';
  else if(successful>=3&&successful>=works.length*.55)classification='Commercial powerhouse';
  else if(concentration>=.6&&genreCount>=2)classification='Genre specialist';
  else if(averageQuality>=72)classification='Creator-led studio';
  else classification='Versatile production house';
 }
 const star=(s.filmActors||[]).find(a=>a.id===leadActorId);
 const leadCreator=(s.employees||[]).concat(s.specialists||[]).find(a=>a.id===creatorId);
 const identity={
  companyId:firm.id,name:firm.name,tier,classification,releaseCount:works.length,filmCount:films.length,
  allSectorReleaseCount:releases.length,leadingGenre,genreCount,genreShare:Math.round(concentration*100),
  storyTheme,storyThemeCount:themeCount,creativeApproach,averageQuality,commercialHits:successful,honors,
  recurringActor:actorCount>=2?(star?.name||'Recurring cast member'):null,recurringActorCount:actorCount,
  recurringCreator:creatorCount>=2?(leadCreator?.name||'Recurring creative lead'):null,
  recurringCreatorCount:creatorCount,activeTeamCount:(firm.teams||[]).length,
  staffCulture:firm.culture||'balanced',earnedReputation:firm.reputation
 };
 return identity;
}
// An audience familiarity effect, not bonus money. Applied only to the market's
// finite shared wallet and based on releases known before THIS film was greenlit.
function studioBrandMultiplier14(s,p){
 if(p.route==='contract')return 1;
 const asOf=(Number.isFinite(p.startWeek)?p.startWeek:s.week)-1;
 const i=studioIdentity14(s,p.companyId,asOf);
 if(i.releaseCount<2)return 1;
 const same=i.leadingGenre===p.genre&&i.genreCount>=2;
 const depth=Math.min(4,Math.max(0,i.releaseCount-1));
 const recognition=i.honors>0?.012:0;
 const loyalty=same?(.015+depth*.009+recognition):(-.008-Math.min(2,depth)*.004);
 // A creative change can broaden the audience, but abandoning a proven brand
 // carries a small discoverability cost. No hidden cash or RNG is generated.
 return Math.round(clamp(1+loyalty,.965,1.075)*10000)/10000;
}
