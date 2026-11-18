
function tvDemandMultiplier(p,week,region){const t=p.television;if(!t)return 1;
 const age=week-p.releaseWeek;const slot=t.slot==='prime'?CFG.tuning_engine.slot__001:t.slot==='late'?CFG.tuning_engine.slot__002:1;
 const network=t.network==='commercial'?CFG.tuning_engine.network__001:t.network==='premium'?CFG.tuning_engine.network__002:CFG.tuning_engine.network__003;
 return clamp(slot*network*(t.classification==='M'?CFG.tuning_engine.tvDemandMultiplier__001:1)*(age>=CFG.tuning_engine.tvDemandMultiplier__002?CFG.tuning_engine.tvDemandMultiplier__003:1),CFG.tuning_engine.tvDemandMultiplier__004,CFG.tuning_engine.tvDemandMultiplier__005);}
function tvRatings(s,projectId){const {p,t}=tvRequire(s,projectId,false);return {projectId:p.id,season:t.seasonNumber,episodes:t.episodes,network:t.network,slot:t.slot,classification:t.classification,
  regionalAdGross:{...t.regionalAdGross},channels:{...t.channelGross},estimatedViewers:{...t.estimatedViewers},estimatedViewersByCohort:{...t.viewersByCohort},
  totalAdGross:money(Object.values(t.regionalAdGross).reduce((n,x)=>n+x,0)),recentWeeks:t.weeklyRatings.map(x=>({...x})),historyComplete:t.ratingsHistoryComplete,
  estimateNote:'Viewers are illustrative estimates derived from recorded advertising receipts. Ad money shares the finite regional television wallet; viewership itself does not generate additional revenue.'};}
function tvRenewSeason(s,projectId,{episodes=CFG.tuning_engine.tvRenewSeason__001,castAgain=true}={}){
 const {p,c,t}=tvRequire(s,projectId,false);if(p.status!=='released'||t.ended||t.renewedBy||p.route==='contract')throw new Error('Only a released, continuing owned series can be renewed.');
 if(p.format==='Miniseries')throw new Error('Limited miniseries do not auto-renew as permanent series.');
 if(!Number.isInteger(episodes)||episodes<CFG.tuning_engine.tvRenewSeason__002||episodes>CFG.tuning_engine.tvRenewSeason__003)throw new Error('Choose a valid next-season episode order.');
 if(s.projects.some(x=>x.ipId===p.ipId&&x.sector==='tv'&&x.status==='active'))throw new Error('Another season of this franchise is already filming.');
 // Use the regular project route, cash reserve, independent rights permission,
 // and available team checks. Retain original IP; never mint a second owner.
 const next=createProject(s,{sector:'tv',route:'adaptation',ipId:p.ipId,title:p.title+' · Season '+(t.seasonNumber+1),genre:p.genre,
   format:'Series',size:p.size,theme:p.pitch?.theme,targetAudience:p.pitch?.targetAudience,direction:p.pitch?.direction,positioning:p.pitch?.positioning});
 next.television.seasonNumber=t.seasonNumber+1;next.television.previousSeasonId=p.id;
 const target=next.television.episodes;next.television.episodes=episodes;next.weeksTotal=Math.max(CFG.tuning_engine.tvRenewSeason__004,next.weeksTotal+Math.round((episodes-target)*CFG.tuning_engine.tvRenewSeason__005));
 t.renewedBy=next.id;
 if(castAgain&&t.castActorId){const a=s.filmActors.find(a=>a.id===t.castActorId);
   if(a&&!a.busyProjectId&&c.finance.cash>=a.fee*(1+CFG.tuning_engine.tvRenewSeason__006*(next.television.seasonNumber-1))+CFG.tuning_engine.tvRenewSeason__007)tvCast(s,next.id,a.id);
   else if(c.isPlayer)alert(s,'tv-cast-'+next.id,CFG.events.messages.tvRenewSeason__001,'Your previous lead is unavailable or unaffordable. Season '+next.television.seasonNumber+' continues with an unfilled cast slot.','advisory');}
 if(c.isPlayer)news(s,'Season renewed: '+p.title,'Season '+next.television.seasonNumber+' booked under an actual production budget and current rights.','production');
 return next;}
function tvEndSeries(s,projectId){const {p,t}=tvRequire(s,projectId,false);
 if(p.status!=='released'||t.renewedBy||t.ended)throw new Error('Conclude the most recently completed season instead.');
 t.ended=true;news(s,'Series concluded: '+p.title,CFG.events.messages.tvEndSeries__001,'release');return {ended:true};}
function recognizeTvHonors(s,year){if(!Array.isArray(s.tvHonors))s.tvHonors=[];
  if(!Array.isArray(s.tvCastRelations))s.tvCastRelations=[];
 if(s.tvHonors.some(x=>x.year===year))return;
 const eligible=s.projects.filter(p=>p.sector==='tv'&&p.status==='released'&&yearAt(p.releaseWeek)===year&&p.route!=='contract');
 if(!eligible.length)return;
 const p=[...eligible].sort((a,b)=>(b.criticScore||b.quality)-(a.criticScore||a.quality))[0];
 const award={id:id(s,'tvhonor'),year,week:s.week,projectId:p.id,companyId:p.companyId,
  name:year%CFG.tuning_engine.award__001?'Aurora Television Awards':'Northern Screen Honors',category:'series-writing',criticScore:p.criticScore||p.quality,source:'observed'};
 s.tvHonors.push(award);news(s,award.name+' recognizes '+p.title,CFG.events.messages.recognizeTvHonors__001,'awards');}

// Streaming is a TV/film distribution capability, never a fifth industry.
// Subscriber receipts use the SAME capped regional television money pool that
// also funds broadcast advertising, and are never booked as a second sale.
function streamingReady(s){const t=technologyReport(s).tv;
 return available('tv',s.week)&&yearAt(s.week)>=CFG.tuning_engine.streamingReady__001&&!!t?.discovered;}
function launchStreamingService(s,{name='Syndicate Stream',tier='standard'}={}){
 const c=player(s);if(!streamingReady(s)||!c.capabilities.tv)throw new Error('Streaming service requires mature television distribution technology (World Year 14 or later) and television capability.');
 if(s.streamingServices.some(x=>x.companyId===c.id&&x.active))throw new Error('A company already operates an active streaming service.');
 if(!STREAM_TIERS[tier])throw new Error('Invalid subscription tier.');
 const fee=CFG.tuning_engine.fee__013;if(c.finance.cash<fee+CFG.tuning_engine.launchStreamingService__001)throw new Error('Insufficient cash for streaming launch and ongoing expenses.');
 expense(s,c,fee,'streaming-launch','Streaming service infrastructure and subscriber acquisition');
 const service={id:id(s,'service'),companyId:c.id,name:String(name).trim().slice(0,CFG.tuning_engine.service__001)||'Syndicate Stream',tier,
  price:STREAM_TIERS[tier],startedWeek:s.week,active:true,monthlyCost:CFG.tuning_engine.service__002,setupCost:fee,runningCost:0,
  regions:Object.fromEntries(activeRegions(s).map(r=>[r.name,{subscribers:0,paidGross:0,churned:0}])),
  grossReceipts:0,history:[],historyComplete:true};s.streamingServices.push(service);return service;}
function setStreamingTier(s,serviceId,tier){const service=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active);
 if(!service||!STREAM_TIERS[tier])throw new Error('Owned streaming service or tier unavailable.');
 if(service.tier===tier)return {...service};service.tier=tier;service.price=STREAM_TIERS[tier];return {...service};}
function streamWindowAuthorized(s,w,week=s.week){const p=s.projects.find(x=>x.id===w.projectId);
 if(!p||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract'||week<w.startWeek||week>=w.endWeek)return false;
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>week||g.endWeek+g.continuationWeeks<=week)return false;}
 return true;}
function requestStreamingLicense(s,serviceId,projectId,weeks=CFG.tuning_engine.requestStreamingLicense__001,bid=CFG.tuning_engine.requestStreamingLicense__002){
 const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),
   p=s.projects.find(x=>x.id===projectId),owner=p&&company(s,p.companyId);
 if(!svc||!p||p.status!=='released'||p.route==='contract'||!['movie','tv'].includes(p.sector)||!owner||owner.bankrupt||
   owner.id===s.playerId||controlledCompanies(s).some(c=>c.id===owner.id))throw new Error('Choose a released independent studio title for a bilateral streaming offer.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.requestStreamingLicense__003||weeks>CFG.tuning_engine.requestStreamingLicense__004||!Number.isFinite(bid)||bid<CFG.tuning_engine.requestStreamingLicense__005||bid>CFG.tuning_engine.requestStreamingLicense__006)throw new Error('Invalid streaming term or licensed offer.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)
   throw new Error('The source holder cannot grant this long streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('The streaming title is already available under contract.');
 if(s.streamingOffers.some(o=>o.serviceId===svc.id&&o.projectId===p.id&&o.status!=='declined'&&o.status!=='booked'&&o.expiresWeek>s.week))throw new Error('An active streaming rights negotiation already exists.');
 // Independent producers will not accept an arbitrarily low bidder. The
 // reserve is based on visible existing quality and time, not omniscience.
 const ask=money(CFG.tuning_engine.ask__001+p.quality*weeks*CFG.tuning_engine.ask__002);
 const row={id:id(s,'streamoffer'),serviceId:svc.id,projectId:p.id,ownerId:owner.id,operatorId:svc.companyId,
  createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__009,weeks,
  proposedFee:money(bid),counterFee:ask,acceptedFee:bid>=ask?money(bid):null,
  status:bid>=ask?'accepted':'counter',windowId:null};
 s.streamingOffers.push(row);return {...row};
}
function answerStreamingLicense(s,offerId,accept){const o=s.streamingOffers.find(x=>x.id===offerId&&x.operatorId===s.playerId);
 if(!o||o.status!=='counter'||s.week>o.expiresWeek||typeof accept!=='boolean')throw new Error('No pending independent rights counteroffer remains.');
 o.status=accept?'accepted':'declined';o.acceptedFee=accept?o.counterFee:null;o.updatedWeek=s.week;return {...o};}
function licenseStreamingTitle(s,serviceId,projectId,weeks=CFG.tuning_engine.licenseStreamingTitle__001,offerId=null){const svc=s.streamingServices.find(x=>x.id===serviceId&&x.companyId===s.playerId&&x.active),p=s.projects.find(x=>x.id===projectId);
 const owner=p&&company(s,p.companyId),c=player(s);
 if(!svc||!p||!owner||!['tv','movie'].includes(p.sector)||p.status!=='released'||p.route==='contract')throw new Error('Choose a completed authorized TV or film title for the service.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.licenseStreamingTitle__002||weeks>CFG.tuning_engine.licenseStreamingTitle__003)throw new Error('Catalog windows last 13–156 weeks.');
 if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(!g||g.type!=='license'||g.startWeek>s.week||g.endWeek+g.continuationWeeks<s.week+weeks)throw new Error('Underlying rights do not cover the proposed streaming window.');}
 if(s.streamingWindows.some(x=>x.serviceId===svc.id&&x.projectId===p.id&&x.endWeek>s.week))throw new Error('An active streaming window already covers this title.');
 const offer=owner.id===c.id?null:s.streamingOffers.find(o=>o.id===offerId&&o.status==='accepted'&&o.operatorId===c.id&&o.ownerId===owner.id&&o.serviceId===svc.id&&o.projectId===p.id&&o.weeks===weeks&&s.week<=o.expiresWeek);
 if(owner.id!==c.id&&!offer)throw new Error('A willing external owner must accept the exact streaming contract before payment.');
 const fee=offer?offer.acceptedFee:0;
 if(fee>0){if(c.finance.cash<fee+CFG.tuning_engine.licenseStreamingTitle__004)throw new Error('Insufficient cash for licensed streaming access.');
 expense(s,c,fee,'streaming-rights','Term-limited streaming distribution window: '+p.title,p.id);
 revenue(s,owner,fee,'streaming-rights','License a completed screen title to '+svc.name,p.id);}
 const window={id:id(s,'streamwindow'),serviceId:svc.id,projectId:p.id,ownerId:owner.id,offerId:offer?.id||null,
  startWeek:s.week,endWeek:s.week+weeks,fee,rightsGrantId:p.grantId||null,territory:'Worldwide',exclusive:false};
 s.streamingWindows.push(window);if(offer){offer.status='booked';offer.windowId=window.id;offer.updatedWeek=s.week;}return window;}