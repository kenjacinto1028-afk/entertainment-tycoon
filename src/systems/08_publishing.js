
// Manuscript rights are held by named independent publisher agencies. The author
// is credited in the catalog but no author's personal IP transfers by implication.
// Bids are nonbinding until a funded grant is signed by both companies.
const MANUSCRIPT_NAMES=CFG.publishing.MANUSCRIPT_NAMES;
function previewManuscripts(s){
 const owners=s.companies.filter(c=>!c.isPlayer&&c.sector==='publishing'&&!c.bankrupt);
 if(!owners.length)return [];
 return Array.from({length:Math.min(CFG.tuning_engine.previewManuscripts__001,owners.length+CFG.tuning_engine.previewManuscripts__002)},(_,i)=>{
  const owner=owners[i%owners.length],key=hash(s.seed+':manuscript-id:'+i).toString(CFG.tuning_engine.key__001);
  return {id:'manuscript_market_'+key,ipId:'ip_market_'+key,ownerId:owner.id,title:MANUSCRIPT_NAMES[i],
    genre:GENRES[hash(s.seed+':manuscript:'+i)%GENRES.length],
    authorName:['Maren Ash','Ivo Wren','Sera Vale','Cassian North','Ada Finch','Liora Stone'][i],
    advance:money(CFG.tuning_engine.previewManuscripts__003+(hash(s.seed+':advance:'+i)%CFG.tuning_engine.previewManuscripts__004)*CFG.tuning_engine.previewManuscripts__005),royaltyRate:money(CFG.tuning_engine.previewManuscripts__006+(i%CFG.tuning_engine.previewManuscripts__007)*CFG.tuning_engine.previewManuscripts__008),
    termWeeks:CFG.tuning_engine.previewManuscripts__009,agencyRate:CFG.tuning_engine.previewManuscripts__010,creatorApprovalRequired:false,createdWeek:s.week,status:'available',licenseId:null};
 });
}
function seedManuscripts(s){
 if(s.manuscripts?.length)return;
 // Prospective manuscripts appear in the read-only market first. Their legal
 // registry entries are created ONLY after the player requests negotiation.
 for(const item of previewManuscripts(s)){
  s.ips.push({id:item.ipId,name:item.title,ownerId:item.ownerId,createdWeek:s.week,sourceSector:'publishing',
   description:'Unpublished manuscript represented by '+company(s,item.ownerId).name,
   works:[],rightsIncome:0,rightsHistoryComplete:true});
  s.manuscripts.push(item);
 }
}
function manuscriptMarket(s){
 const rows=s.manuscripts?.length?s.manuscripts:previewManuscripts(s);
 return rows.filter(m=>m.status==='available'&&!company(s,m.ownerId)?.bankrupt).map(m=>({...m}));
}
function negotiateManuscript(s,manuscriptId,input={}){
 if(!s.manuscripts?.length) {
   if(!previewManuscripts(s).some(x=>x.id===manuscriptId))throw new Error('Manuscript unavailable.');
   seedManuscripts(s);
 }
 const m=s.manuscripts?.find(x=>x.id===manuscriptId),owner=m&&company(s,m.ownerId),buyer=player(s);
 if(!m||m.status!=='available'||!owner||owner.bankrupt||m.ownerId===buyer.id||!buyer.capabilities.publishing)
  throw new Error('Manuscript unavailable or already licensed.');
 if(s.grants.some(g=>g.ipId===m.ipId&&g.media==='publishing'&&g.exclusive&&g.endWeek>s.week))
  throw new Error('Manuscript exclusive publishing rights are unavailable.');
 const advance=money(Number(input.advance??m.advance)),royaltyRate=Number(input.royaltyRate??m.royaltyRate);
 const agencyRate=Number(input.agencyRate??m.agencyRate??0),approvalRequired=input.approvalRequired===true||input.approvalRequired==='true'||m.creatorApprovalRequired===true;
 if(!Number.isFinite(advance)||advance<CFG.tuning_engine.negotiateManuscript__001||advance>CFG.tuning_engine.negotiateManuscript__002||!Number.isFinite(royaltyRate)||royaltyRate<CFG.tuning_engine.negotiateManuscript__003||royaltyRate>CFG.tuning_engine.negotiateManuscript__004||!Number.isFinite(agencyRate)||agencyRate<0||agencyRate>CFG.tuning_engine.negotiateManuscript__005)
  throw new Error('Advance, agent share or royalty terms are invalid.');
 const agreed=advance>=m.advance&&royaltyRate>=m.royaltyRate&&agencyRate>=(m.agencyRate||0)&&(!m.creatorApprovalRequired||approvalRequired);
 const offer={id:id(s,'manuscriptoffer'),manuscriptId:m.id,ownerId:owner.id,buyerId:buyer.id,
  createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.offer__001,status:agreed?'agreed':'counter',
  proposal:{advance,royaltyRate,agencyRate,approvalRequired},counter:agreed?null:{advance:m.advance,royaltyRate:m.royaltyRate,agencyRate:m.agencyRate||0,approvalRequired:m.creatorApprovalRequired===true||approvalRequired},grantId:null};
 s.manuscriptOffers.push(offer);return offer;
}
function answerManuscript(s,offerId,approve){
 const offer=s.manuscriptOffers?.find(x=>x.id===offerId),m=offer&&s.manuscripts.find(x=>x.id===offer.manuscriptId);
 if(!offer||!m||offer.buyerId!==s.playerId||!['agreed','counter'].includes(offer.status)||!['available'].includes(m.status)||s.week>offer.expiresWeek)
  throw new Error('Manuscript offer is unavailable or expired.');
 if(approve!==true){offer.status='declined';return offer;}
 const owner=company(s,offer.ownerId),buyer=player(s),ip=s.ips.find(x=>x.id===m.ipId);
 if(!owner||owner.bankrupt||!ip||ip.ownerId!==owner.id||owner.id!==m.ownerId||
     s.grants.some(g=>g.ipId===m.ipId&&g.media==='publishing'&&g.exclusive&&g.endWeek>s.week))
  throw new Error('Manuscript title or exclusive rights are unavailable.');
 const terms=offer.counter||offer.proposal,fee=money(terms.advance);
 if(buyer.finance.cash<fee+CFG.tuning_engine.answerManuscript__001)throw new Error('Insufficient cash for manuscript advance and operating reserve.');
 expense(s,buyer,fee,'manuscript-advance','Exclusive manuscript license: '+ip.name);
 revenue(s,owner,fee,'manuscript-advance','Manuscript advance received: '+ip.name);
 ip.rightsIncome=money((ip.rightsIncome||0)+fee);
 const grant={id:id(s,'grant'),ipId:m.ipId,grantorId:owner.id,holderId:buyer.id,media:'publishing',territory:'Worldwide',
  type:'license',startWeek:s.week,endWeek:s.week+m.termWeeks,optionExpiresWeek:null,exercisedWeek:null,
  exerciseFee:0,exerciseFeePaid:0,renewalHistory:[],approvalRequired:terms.approvalRequired===true,agentRate:terms.agencyRate||0,agentFeesPaid:0,
  exclusive:true,allowsProduction:true,fee,royaltyRate:terms.royaltyRate,recoupableAdvance:fee,
  royaltyHistoryComplete:true,continuationWeeks:0,manuscriptId:m.id};
 s.grants.push(grant);m.status='licensed';m.licenseId=grant.id;
 offer.status='signed';offer.grantId=grant.id;offer.signedWeek=s.week;
 news(s,'Publishing manuscript licensed: '+ip.name,buyer.name+' acquired time-limited publishing rights from '+owner.name+'; creator approvals and agent share follow the signed terms.','deal');
 return grant;
}
// The independent author/rights owner decides a proposed publishing pitch.
// Matching the manuscript's originally contracted genre grants approval;
// changes outside that scope are vetoed, without player impersonation.
function requestManuscriptApproval(s,grantId,{title,genre}={}){
 const g=s.grants.find(x=>x.id===grantId),m=s.manuscripts?.find(x=>x.id===g?.manuscriptId);
 if(!g||!m||g.holderId!==s.playerId||g.grantorId===s.playerId||!g.approvalRequired)
  throw new Error('No independent contracted creator approval is available.');
 const req=requestCreativeApproval(s,grantId,{title,genre});
 req.status=req.genre===m.genre?'approved':'rejected';req.decidedBy=g.grantorId;req.decidedWeek=s.week;
 return req;
}
function publishingInterest(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.sector!=='publishing'||p.status!=='active'||!c)throw new Error('Publishing interest is available before release only.');
 const expectedGross=money(p.forecast?.scenario?.expected?.gross??0);
 const volume=money(expectedGross/Math.max(1,p.weeksTotal));
 return {projectId:p.id,kind:'estimate',sampleWeek:s.week,expectedGross,weeklyInterestEstimate:volume,
  confidence:p.forecast?.evidenceSampleSize?'calibrated':'uncertain',disclaimer:'Interest only, not collected preorder cash. Future buyers may change.'};
}
// Optional single high-level production treatments. Fictional outside vendors
// are paid like other abstract suppliers; none acquires underlying rights.
const PUBLISHING_TREATMENTS=Object.freeze(CFG.publishing.PUBLISHING_TREATMENTS);
function publishingFormatTreatment(s,projectId,focus){
 const p=s.projects.find(p=>p.id===projectId),t=PUBLISHING_TREATMENTS[focus],c=p&&company(s,p.companyId);
 if(!p||!t||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!==t.format||
    p.status!=='active'||p.weeksDone>=p.weeksTotal*CFG.tuning_engine.publishingFormatTreatment__001||p.route==='contract')
  throw new Error('Choose an eligible active publishing title for this format treatment.');
 if(p.publishingFormatHistory.some(h=>h.focus===focus))throw new Error('This format treatment was already completed.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Binding creative veto requires the rights owner to approve substantive changes.');
 if(c.finance.cash<t.cost+CFG.tuning_engine.publishingFormatTreatment__002)throw new Error('Insufficient cash for the format treatment and payroll buffer.');
 expense(s,c,t.cost,'publishing-format','Optional '+focus+' services: '+p.title,p.id);
 p.directCost=money(p.directCost+t.cost);p.productionSpend=money((p.productionSpend||0)+t.cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+t.cost);
 p.weeksTotal+=t.weeks;p.creativeQuality=Math.round(clamp(p.creativeQuality+t.creative,1,CFG.tuning_engine.publishingFormatTreatment__003));
 p.technicalQuality=Math.round(clamp(p.technicalQuality+t.technical,1,CFG.tuning_engine.publishingFormatTreatment__004));
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.publishingFormatTreatment__005+p.technicalQuality*CFG.tuning_engine.publishingFormatTreatment__006,1,CFG.tuning_engine.publishingFormatTreatment__007));
 const item={focus,week:s.week,cost:t.cost,quality:p.quality};p.publishingFormatHistory.push(item);return item;
}
function translatePublishingEdition(s,projectId,regionName){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),r=activeRegions(s).find(r=>r.name===regionName);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||p.status!=='released'||!r)
  throw new Error('Only a released publishing edition can be translated into an available region.');
 if(!printRightsActive(s,p))throw new Error('Publishing rights no longer authorize this edition.');
 if(p.translations.some(t=>t.region===r.name))throw new Error('Translation already funded for this region.');
 const cost=CFG.tuning_engine.cost__003;if(c.finance.cash<cost+CFG.tuning_engine.translatePublishingEdition__001)throw new Error('Insufficient cash for translation and operating reserve.');
 expense(s,c,cost,'publishing-translation','Regional translation: '+p.title+' / '+r.name,p.id);
 p.directCost=money(p.directCost+cost);
 const item={region:r.name,week:s.week,cost};p.translations.push(item);return item;
}
function createPublishingImprint(s,data={}){
 const c=player(s),name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__001),genre=data.genre;
 if(!c.capabilities.publishing||name.length<CFG.tuning_engine.createPublishingImprint__001||!GENRES.includes(genre))throw new Error('Choose an imprint name and publishing genre.');
 if(c.imprints.length>=CFG.tuning_engine.createPublishingImprint__002||c.imprints.some(i=>i.name.toLowerCase()===name.toLowerCase()))throw new Error('Imprint roster full or name already used.');
 const fee=CFG.tuning_engine.fee__002;if(c.finance.cash<fee+CFG.tuning_engine.createPublishingImprint__003)throw new Error('Insufficient cash for imprint branding.');
 expense(s,c,fee,'imprint-branding','Create publishing imprint '+name);
 const imprint={id:id(s,'imprint'),companyId:c.id,name,genre,createdWeek:s.week,startFee:fee};c.imprints.push(imprint);return imprint;
}
function assignPublishingImprint(s,projectId,imprintId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),i=c?.imprints?.find(i=>i.id===imprintId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.status!=='active'||p.route==='contract'||!i)
  throw new Error('Imprints can only brand controlled unreleased publishing titles.');
 p.imprintId=i.id;return {projectId:p.id,imprintId:i.id};
}
function publishingImprintReport(s,imprintId){
 const c=player(s),imprint=c.imprints?.find(i=>i.id===imprintId);
 if(!imprint)throw new Error('Unknown imprint.');
 const books=s.projects.filter(p=>p.imprintId===imprintId&&p.companyId===c.id);
 return {name:imprint.name,genre:imprint.genre,companyId:c.id,projects:books.length,
  released:books.filter(p=>p.status==='released').length,
  directRevenue:money(books.reduce((n,p)=>n+p.directRevenue,0)),
  directCosts:money(books.reduce((n,p)=>n+p.directCost,0)),
  sharedOverheadDisclosedSeparately:true};
}
// A promotional signup campaign provides uncertain interest, never early
// consumer-sale revenue or a second wallet. Only actual released sales book cash.
function openPublishingPreorders(s,projectId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.status!=='active'||p.route==='contract'||p.preorderCampaign)
  throw new Error('A single prelaunch interest campaign is available for an active owned title.');
 const cost=CFG.tuning_engine.cost__004;if(c.finance.cash<cost+CFG.tuning_engine.openPublishingPreorders__001)throw new Error('Insufficient cash for the preorder marketing campaign.');
 const expected=p.forecast?.scenario?.expected?.gross||0;
 const registrations=Math.round(Math.max(0,expected)*CFG.tuning_engine.registrations__001/(p.format==='Comic / Manga'?CFG.tuning_engine.registrations__002:CFG.tuning_engine.registrations__003));
 expense(s,c,cost,'prelaunch-interest','Reader signup campaign for '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 p.preorderCampaign={week:s.week,cost,registrations,kind:'nonbinding-reader-interest',paidDeposits:0};
 return {...p.preorderCampaign};
}