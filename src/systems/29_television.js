
function streamingCatalog(s,serviceId,atWeek=s.week){const svc=s.streamingServices.find(x=>x.id===serviceId);if(!svc)throw new Error('Unknown service.');
 return s.streamingWindows.filter(w=>w.serviceId===serviceId&&streamWindowAuthorized(s,w,atWeek)).map(w=>({
  ...w,title:s.projects.find(p=>p.id===w.projectId)?.title||'',expiresIn:w.endWeek-atWeek}));}
function streamingWeek(s){s.streamingWeeklyReserved={};s.streamingWeeklyTotal=0;
 for(const svc of s.streamingServices||[])if(svc.active){const c=company(s,svc.companyId);if(!c||c.bankrupt)continue;
  const catalog=streamingCatalog(s,svc.id),quality=catalog.length?catalog.reduce((sum,x)=>sum+(s.projects.find(p=>p.id===x.projectId)?.quality||CFG.tuning_engine.quality__001),0)/catalog.length:0;
  for(const region of activeRegions(s)){const r=svc.regions[region.name]||{subscribers:0,paidGross:0,churned:0};svc.regions[region.name]=r;
   const permitted=catalog.filter(w=>canDistribute43(s,s.projects.find(p=>p.id===w.projectId),region.name,s.week));
   const permittedQuality=permitted.length?permitted.reduce((n,w)=>n+(s.projects.find(p=>p.id===w.projectId)?.quality||CFG.tuning_engine.permittedQuality__001),0)/permitted.length:0;
   const budget=worldMarketBudget(s,'tv',region.name),sharedBudget=Math.max(0,money(budget*CFG.tuning_engine.sharedBudget__001-(s.streamingWeeklyReserved?.[region.name]||0))),weeklyRate=svc.price/CFG.tuning_engine.weeklyRate__001;
   const ceiling=Math.max(0,Math.floor(sharedBudget/weeklyRate));
   const appeal=permitted.length?clamp((CFG.tuning_engine.appeal__001+CFG.tuning_engine.appeal__002*permitted.length+permittedQuality/CFG.tuning_engine.appeal__003)*(CFG.tuning_engine.appeal__004+(CFG.tuning_engine.appeal__005*s.macroeconomy)),CFG.tuning_engine.appeal__006,CFG.tuning_engine.appeal__007):0;
   const desired=Math.floor(ceiling*appeal);const old=r.subscribers;
   const newCount=old<desired?Math.min(desired,old+Math.max(CFG.tuning_engine.newCount__001,Math.ceil((desired-old)*CFG.tuning_engine.newCount__002))):Math.max(desired,old-Math.max(CFG.tuning_engine.newCount__003,Math.ceil((old-desired)*CFG.tuning_engine.newCount__004)));
   const billable=Math.max(0,Math.min(newCount,ceiling));r.churned+=Math.max(0,old-billable);r.subscribers=billable;
   const gross=money(Math.min(sharedBudget,billable*weeklyRate));if(gross<=0)continue;
   bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+' paid streaming subscriptions: '+svc.name);
   r.paidGross=money(r.paidGross+gross);svc.grossReceipts=money(svc.grossReceipts+gross);
   s.streamingWeeklyReserved[region.name]=money((s.streamingWeeklyReserved[region.name]||0)+gross);
   s.streamingWeeklyTotal=money(s.streamingWeeklyTotal+gross);
   svc.history.push({week:s.week,region:region.name,subscribers:billable,gross,activeTitles:catalog.length});
   if(svc.history.length>CFG.tuning_engine.streamingWeek__001){svc.history.shift();svc.historyComplete=false;}
  }
 }
}
function streamingReport(s,serviceId){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId);if(!svc)throw new Error('Not an owned service.');
 return {...svc,regions:Object.fromEntries(Object.entries(svc.regions).map(([k,v])=>[k,{...v}])),
 catalog:streamingCatalog(s,serviceId),history:svc.history.slice(-CFG.tuning_engine.streamingReport__001).map(x=>({...x})),
 note:'Receipts represent paid subscriptions within the single regional TV spending cap. Expired/unlicensed catalog entries are not available; no historical subscribers or income are invented.'};}
function auditTelevision(s,problems){const busy=new Set();
 for(const p of s.projects.filter(p=>p.sector==='tv')){const t=p.television;if(!t){problems.push(p.id+': missing TV record');continue;}
  if(!Number.isInteger(t.seasonNumber)||t.seasonNumber<1||!Number.isInteger(t.episodes)||t.episodes<CFG.tuning_engine.auditTelevision__001||t.episodes>CFG.tuning_engine.auditTelevision__002||
   !TV_NETWORKS.includes(t.network)||!TV_SLOTS.includes(t.slot)||!['Y7','PG','M'].includes(t.classification)||
   !Array.isArray(t.episodeEdits)||!Array.isArray(t.weeklyRatings)||!t.regionalAdGross||!t.channelGross||!t.viewersByCohort||
   Object.values(t.viewersByCohort).some(x=>!Number.isInteger(x)||x<0)||
   Math.abs(Object.values(t.viewersByCohort).reduce((n,v)=>n+v,0)-Object.values(t.estimatedViewers).reduce((n,v)=>n+v,0))>1||
   t.episodeEdits.some(e=>e.episode<1||e.episode>t.episodes||e.week>s.week||e.cost<0)||
   t.weeklyRatings.some(r=>r.week> s.week||r.week<p.releaseWeek||!REGIONS.some(x=>x.name===r.region)||r.gross<0||r.estimatedViewers<0||!['first-run','syndication'].includes(r.channel))||
   Math.abs(Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)-Object.values(t.channelGross).reduce((n,v)=>n+v,0))>CFG.tuning_engine.auditTelevision__003||
   Object.values(t.regionalAdGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.channelGross).some(v=>!Number.isFinite(v)||v<0)||
   Object.values(t.regionalAdGross).reduce((n,v)=>n+v,0)>p.stats.totalSales+CFG.tuning_engine.auditTelevision__004||
   t.previousSeasonId&&(!s.projects.some(x=>x.id===t.previousSeasonId&&x.sector==='tv'&&x.ipId===p.ipId&&x.television?.renewedBy===p.id))||
   t.renewedBy&&(!s.projects.some(x=>x.id===t.renewedBy&&x.television?.previousSeasonId===p.id))||
   t.writerRoom&&!s.employees.some(x=>x.id===t.writerRoom.showrunnerId)||
   t.facility==='owned'&&!company(s,p.companyId)?.filmBacklot||
   t.castActorId&&(!s.filmActors.some(a=>a.id===t.castActorId&& (p.status!=='active'||a.busyProjectId===p.id))||p.status==='active'&&busy.has(t.castActorId)))problems.push(p.id+': invalid television season, ratings or cast records');
  if(!Number.isFinite(t.chemistry)||t.chemistry<0||t.chemistry>CFG.tuning_engine.auditTelevision__005)problems.push(p.id+': invalid recurring cast chemistry');
  if(t.castActorId&&p.status==='active')busy.add(t.castActorId);
 }
 for(const r of s.tvCastRelations||[]){const p=s.projects.find(x=>x.id===r.projectId),prior=s.projects.find(x=>x.id===r.previousSeasonId);
  if(!p||!prior||p.sector!=='tv'||prior.sector!=='tv'||p.ipId!==r.ipId||prior.ipId!==r.ipId||
    p.television?.previousSeasonId!==prior.id||p.television?.castActorId!==r.actorId||prior.television?.castActorId!==r.actorId||
    (r.leaderId!==null&&!s.employees.some(x=>x.id===r.leaderId))||
    !Number.isFinite(r.bonus)||r.bonus<CFG.tuning_engine.auditTelevision__006||r.bonus>CFG.tuning_engine.auditTelevision__007||p.television.chemistry!==r.bonus||
    !Number.isInteger(r.week)||r.week>s.week||r.week<p.startWeek)problems.push('Invalid recurring team relationship and cast collaboration');
 }
 for(const a of s.tvHonors||[])if(!s.projects.some(p=>p.id===a.projectId&&p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===a.year)||a.week>s.week||typeof a.name!=='string')problems.push('Invalid television award provenance');
 const used=new Set();
 for(const svc of s.streamingServices||[]){if(!company(s,svc.companyId)||!STREAM_TIERS[svc.tier]||svc.price!==STREAM_TIERS[svc.tier]||
   !Number.isInteger(svc.startedWeek)||svc.startedWeek>s.week||svc.startedWeek<(CFG.tuning_engine.auditTelevision__008-1)*CFG.tuning_engine.auditTelevision__009||
   svc.monthlyCost!==CFG.tuning_engine.auditTelevision__010||!Number.isFinite(svc.grossReceipts)||svc.grossReceipts<0||
   !svc.regions||Object.entries(svc.regions).some(([k,r])=>!REGIONS.some(z=>z.name===k)||!Number.isInteger(r.subscribers)||r.subscribers<0||r.paidGross<0||r.churned<0)||
   !Array.isArray(svc.history)||svc.history.some(x=>x.week> s.week||x.week<svc.startedWeek||x.gross<0||x.subscribers<0)||
   Math.abs(Object.values(svc.regions).reduce((n,r)=>n+r.paidGross,0)-svc.grossReceipts)>CFG.tuning_engine.auditTelevision__011||used.has(svc.companyId))problems.push('Invalid streaming service and subscriber cash history');
  used.add(svc.companyId);
 }
 for(const o of s.streamingOffers||[])if(!s.streamingServices.some(x=>x.id===o.serviceId&&x.companyId===o.operatorId)||
   !s.projects.some(x=>x.id===o.projectId&&x.companyId===o.ownerId&&x.status==='released')||
   !['counter','accepted','booked','declined'].includes(o.status)||
   !Number.isInteger(o.createdWeek)||o.createdWeek>s.week||o.expiresWeek!==o.createdWeek+CFG.tuning_engine.auditTelevision__012||
   !Number.isFinite(o.proposedFee)||o.proposedFee<CFG.tuning_engine.auditTelevision__013||o.counterFee<CFG.tuning_engine.auditTelevision__014||
   o.status==='booked'&&!s.streamingWindows.some(w=>w.offerId===o.id&&w.id===o.windowId)||
   (o.status==='accepted'||o.status==='booked')&&(!Number.isFinite(o.acceptedFee)||![o.proposedFee,o.counterFee].includes(o.acceptedFee)))
   problems.push('Invalid bilateral streaming offer provenance');
 for(const w of s.streamingWindows||[]){const p=s.projects.find(x=>x.id===w.projectId),svc=s.streamingServices.find(x=>x.id===w.serviceId);
  const offer=w.offerId?s.streamingOffers.find(o=>o.id===w.offerId):null;
  if(!svc||!p||!['movie','tv'].includes(p.sector)||p.status!=='released'||p.route==='contract'||p.companyId!==w.ownerId||w.startWeek<p.releaseWeek||w.startWeek>s.week||
    (w.ownerId!==svc.companyId&&(!offer||offer.status!=='booked'||offer.windowId!==w.id||offer.acceptedFee!==w.fee))||
    !Number.isInteger(w.endWeek)||w.endWeek<=w.startWeek||w.endWeek-w.startWeek>CFG.tuning_engine.auditTelevision__015||w.endWeek-w.startWeek<CFG.tuning_engine.auditTelevision__016||w.fee<0||
    w.rightsGrantId!==(p.grantId||null)||w.territory!=='Worldwide'||w.exclusive!==false||
    (w.rightsGrantId&&(!s.grants.some(g=>g.id===w.rightsGrantId&&g.endWeek+g.continuationWeeks>=w.endWeek)))||
    s.streamingWindows.some(x=>x!==w&&x.serviceId===w.serviceId&&x.projectId===w.projectId&&x.startWeek<w.endWeek&&w.startWeek<x.endWeek))problems.push('Invalid streaming license and rights window');
 }
}

// UPDATE 40: Video-game creation and lawful digital distribution.
// These services operate inside the FOUR existing industries; platforms are not manufacturers.
// Promotional exclusive is a separate bilateral deal. A store cannot buy exclusivity from itself,
// and the grant is a REAL funded platform marketing transfer, not an industry subsidy.
function gameOfferExclusive(s,storeId,projectId,grant=CFG.tuning_engine.gameOfferExclusive__001,weeks=CFG.tuning_engine.gameOfferExclusive__002){
 const store=gameStoreById(s,storeId),win=gameWindows(s,storeId).find(x=>x.projectId===projectId),p=s.projects.find(x=>x.id===projectId);
 if(store.companyId!==s.playerId||!win||!p||p.companyId===s.playerId)throw new Error('Only independent licensed games may negotiate a platform exclusive.');
 if(!Number.isFinite(grant)||grant<CFG.tuning_engine.gameOfferExclusive__003||grant>CFG.tuning_engine.gameOfferExclusive__004||![CFG.tuning_engine.gameOfferExclusive__005,CFG.tuning_engine.gameOfferExclusive__006,CFG.tuning_engine.gameOfferExclusive__007].includes(weeks)||win.endWeek<s.week+weeks||p.videoGame.exclusiveUntil>s.week)
  throw new Error('Exclusive grant/term must fit the lawful catalog window.');
 if(s.gameStoreWindows.some(w=>w.projectId===p.id&&w.storeId!==store.id&&w.endWeek>s.week))throw new Error('Existing distribution rights prevent exclusivity.');
 const demand=money(Math.max(grant,Math.min(CFG.tuning_engine.demand__001,CFG.tuning_engine.demand__002+p.quality*CFG.tuning_engine.demand__003)));
 const o={id:id(s,'gameexclusive'),storeId,projectId,operatorId:store.companyId,ownerId:p.companyId,
 proposedGrant:money(grant),counterGrant:demand,acceptedGrant:grant>=demand?money(grant):null,status:grant>=demand?'accepted':'counter',weeks,
 createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.o__001,activatedWeek:null};s.gameExclusiveOffers.push(o);return o;
}
function gameAnswerExclusive(s,offerId,accept){const o=s.gameExclusiveOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No pending exclusive counteroffer.');
 o.status=accept?'accepted':'declined';o.acceptedGrant=accept?o.counterGrant:null;return o;}