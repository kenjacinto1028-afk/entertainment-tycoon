
// v14 / Stage 2: public genre preferences and visible rival decisions.
// Read-only trends redistribute real regional wallets, without imaginary sales.
function industryPulse14(s,sector,atWeek=s.week){
 if(!SECTORS[sector])throw new Error('Unknown industry for trends.');
 const quarter=Math.floor(atWeek/13);
 const supplied=new Map(GENRES.map(g=>[g,0])),hits=new Map(GENRES.map(g=>[g,0]));
 for(const p of s.projects||[]){
  if(p.sector!==sector||p.status!=='released'||!Number.isFinite(p.releaseWeek))continue;
  const age=atWeek-p.releaseWeek;if(age<0||age>=39)continue;
  const relevance=Math.max(.1,1-age/39);
  supplied.set(p.genre,(supplied.get(p.genre)||0)+relevance);
  if((p.criticScore??p.quality??0)>=70)hits.set(p.genre,(hits.get(p.genre)||0)+relevance);
 }
 for(const b of s.backgroundFirms||[]){
  if(b.sector!==sector||b.bankrupt)continue;
  for(const r of b.releases||[]){
   const age=atWeek-r.releaseWeek;if(age<0||age>=39)continue;
   supplied.set(b.genre,(supplied.get(b.genre)||0)+.45*(1-age/39));
  }
 }
 const genres=GENRES.map(genre=>{
  const supply=supplied.get(genre)||0,acclaim=hits.get(genre)||0;
  const cyc=(hash(s.seed+':v14:taste:'+sector+':'+quarter+':'+genre)>>>0)%25;
  const previous=(hash(s.seed+':v14:taste:'+sector+':'+Math.max(0,quarter-1)+':'+genre)>>>0)%25;
  const raw=1+(cyc-12)*.005-Math.min(.04,supply*.007)+Math.min(.02,acclaim*.007);
  const multiplier=Math.round(clamp(raw,.91,1.075)*10000)/10000;
  const shift=(cyc-previous)*.005;
  const trend=supply>=5?'Crowded':shift>.018?'Rising':shift<-.018?'Cooling':'Steady';
  return {genre,trend,multiplier,supply:Math.round(supply*10)/10,change:Math.round(shift*100),knownHitWeight:Math.round(acclaim*10)/10};
 });
 genres.sort((a,b)=>b.multiplier-a.multiplier||a.genre.localeCompare(b.genre));
 return {sector,quarter,asOfWeek:atWeek,genres,leader:genres[0],laggard:genres[genres.length-1],
  explanation:'Seasonal tastes and actual recent competition affect attention, not regional wallet size.'};
}
function rivalGenrePick14(s,c,baselineGenre){
 const original=GENRES.includes(baselineGenre)?baselineGenre:GENRES[0];
 if(!c?.aiIdentity)return original;
 const pulse=industryPulse14(s,c.sector);
 const best=pulse.genres[0]?.genre||original;
 const signature=GENRES.includes(c.aiIdentity.specialty)?c.aiIdentity.specialty:original;
 const roll=(hash(s.seed+':v14:rival:'+c.id+':'+Math.floor(s.week/13))>>>0)%100;
 if(c.aiIdentity.style==='cautious')return roll<78?signature:original;
 if(c.aiIdentity.style==='creator-led')return roll<64?signature:roll<84?best:original;
 if(c.aiIdentity.style==='expansionist')return roll<74?best:original;
 return roll<60?best:roll<80?signature:original;
}
// Actual public committed productions only; no access to private rival books.
function rivalWatch14(s,sector='movie'){
 if(!SECTORS[sector])throw new Error('Unknown industry.');
 const actors=new Map(s.companies.filter(c=>!c.isPlayer&&!c.bankrupt&&c.sector===sector).map(c=>[c.id,c]));
 const active=s.projects.filter(p=>actors.has(p.companyId)&&p.sector===sector&&p.status==='active')
  .sort((a,b)=>(b.startWeek||0)-(a.startWeek||0)).slice(0,5)
  .map(p=>({company:actors.get(p.companyId).name,companyId:p.companyId,title:p.title,genre:p.genre,
    completion:Math.round(100*(p.weeksDone||0)/Math.max(1,p.weeksTotal||1)),stage:'In production'}));
 const releases=s.projects.filter(p=>actors.has(p.companyId)&&p.sector===sector&&p.status==='released'&&p.releaseWeek>=s.week-26)
  .sort((a,b)=>b.releaseWeek-a.releaseWeek).slice(0,4)
  .map(p=>({company:actors.get(p.companyId).name,companyId:p.companyId,title:p.title,genre:p.genre,stage:'Released',week:p.releaseWeek}));
 const moves=(s.rivalEvents||[]).filter(e=>e.kind==='creative-slate'&&e.week>=s.week-26&&actors.has(e.companyId))
  .slice(-5).reverse().map(e=>({company:actors.get(e.companyId).name,week:e.week,genre:e.detail?.genre,projectId:e.detail?.projectId}));
 return {sector,active,releases,moves};
}
