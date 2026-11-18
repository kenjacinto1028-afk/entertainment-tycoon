
// Later publishing technologies require a world that has developed the
// supporting recording and digital infrastructure. No sector is opened early.
function publishingFormatAvailable(s,format){
 if(format==='Audiobook')return yearAt(s.week)>=CFG.tuning_engine.publishingFormatAvailable__001;
 if(format==='Ebook')return yearAt(s.week)>=CFG.tuning_engine.publishingFormatAvailable__002;
 return FORMATS.publishing.includes(format);
}
const PUBLISHING_PRICES=Object.freeze(CFG.publishing.PUBLISHING_PRICES);
function publishingUnitPrice(p){return p.printStock?.price||PUBLISHING_PRICES[p.format]||CFG.tuning_engine.publishingUnitPrice__001;}
// Audience categories are modeled estimates, NOT individually observed buyers.
// Apportion the actual whole units already sold, never increment receipts.
function estimatePublishingAudienceUnits(s,regionName,p,units){
 const cohorts=audienceCohorts(s,regionName);
 if(!cohorts.length||units<=0)return {};
 const factors=cohorts.map(k=>Math.max(0,k.share*(k.tastes[p.genre]||1)*audienceAffinity(p,k)));
 const total=factors.reduce((a,b)=>a+b,0)||1;
 const exact=factors.map(v=>units*v/total),whole=exact.map(Math.floor);
 const remainder=units-whole.reduce((a,b)=>a+b,0);
 const priorities=exact.map((v,i)=>({i,part:v-Math.floor(v)})).sort((a,b)=>b.part-a.part||a.i-b.i);
 for(let j=0;j<remainder;j++)whole[priorities[j%priorities.length].i]++;
 return Object.fromEntries(cohorts.map((k,i)=>[k.name,whole[i]]));
}
function openPublishingOutlet(s){
 requireExecutiveControl(s);const c=player(s);
 if(!c.capabilities.publishing||c.bankrupt||s.publishingOutlet?.active)throw new Error('Publishing outlet already active or unavailable.');
 const startup=CFG.tuning_engine.startup__001;if(c.finance.cash<startup+weeklyOverhead(c,s)*CFG.tuning_engine.openPublishingOutlet__001)throw new Error('Insufficient cash to launch and staff an owned publishing outlet.');
 expense(s,c,startup,'publishing-outlet-setup','Open first-party publishing outlet');
 if(s.publishingOutlet){s.publishingOutlet.active=true;s.publishingOutlet.startupSpent=money(s.publishingOutlet.startupSpent+startup);}
 else s.publishingOutlet={id:id(s,'publishingoutlet'),companyId:c.id,active:true,createdWeek:s.week,startupSpent:startup,operatingSpent:0,catalog:[],customerGross:0,distributionFees:0,monthlyCost:CFG.tuning_engine.openPublishingOutlet__002};
 return s.publishingOutlet;
}
function listPublishingOutlet(s,projectId){
 const o=s.publishingOutlet,p=s.projects.find(p=>p.id===projectId);
 if(!o?.active||!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||!['active','released'].includes(p.status))throw new Error('A controlled publishing title and active outlet are required.');
 if(p.grantId&&!s.grants.some(g=>g.id===p.grantId&&g.holderId===p.companyId&&g.type==='license'&&g.allowsProduction&&g.startWeek<=s.week&&g.endWeek>s.week))throw new Error('Distribution rights are unavailable or expired.');
 if(o.catalog.some(x=>x.projectId===p.id))throw new Error('This edition is already listed.');
 const rec={projectId:p.id,listedWeek:s.week};o.catalog.push(rec);return rec;
}
function closePublishingOutlet(s){
 const o=s.publishingOutlet;if(!o?.active)throw new Error('No active publishing outlet to close.');
 o.active=false;for(const p of s.projects)if(p.companyId===s.playerId&&p.publishingChannel==='owned')p.publishingChannel=isPrintEdition(p)?'mixed':'digital';
 return o;
}
function publishingOutletReport(s){
 const o=s.publishingOutlet;
 if(!o)return {active:false,listed:0,startupSpent:0,operatingSpent:0,customerGross:0,distributionFees:0};
 return {active:o.active,listed:o.catalog.length,startupSpent:o.startupSpent,operatingSpent:o.operatingSpent,customerGross:o.customerGross,distributionFees:o.distributionFees,monthlyCost:o.monthlyCost};
}
const PUBLISHING_CHANNELS=CFG.publishing.PUBLISHING_CHANNELS;
function setPublishingChannel(s,projectId,channel){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.route==='contract'||!['active','released'].includes(p.status))
  throw new Error('No eligible owned publishing edition.');
 if(!PUBLISHING_CHANNELS.includes(channel)||(channel==='digital'&&isPrintEdition(p)))throw new Error('Invalid publishing channel for edition.');
 if(channel==='owned'&&(!s.publishingOutlet?.active||!s.publishingOutlet.catalog.some(x=>x.projectId===p.id)))throw new Error('First-party publishing outlet must be active and list the licensed edition.');
 if(p.status==='released'&&!printRightsActive(s,p))throw new Error('Publishing distribution license has expired.');
 p.publishingChannel=channel;return channel;
}
function setSerialCadence(s,projectId,cadence){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!=='Web Serial'||p.status!=='active'||p.weeksDone>0||p.route==='contract')
  throw new Error('Serial pacing is set before the first scheduled production week.');
 if(!['steady','fast','polished'].includes(cadence))throw new Error('Invalid serial cadence.');
 if(p.serialCadence!=='steady')throw new Error('Serial cadence may be selected only once.');
 p.serialCadence=cadence;
 if(cadence==='fast'){p.weeksTotal=Math.max(CFG.tuning_engine.setSerialCadence__001,Math.floor(p.weeksTotal*CFG.tuning_engine.setSerialCadence__002));p.creativeQuality=Math.max(1,p.creativeQuality-CFG.tuning_engine.setSerialCadence__003);}
 if(cadence==='polished'){p.weeksTotal+=CFG.tuning_engine.setSerialCadence__004;p.creativeQuality=Math.min(CFG.tuning_engine.setSerialCadence__005,p.creativeQuality+CFG.tuning_engine.setSerialCadence__006);}
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.setSerialCadence__007+p.technicalQuality*CFG.tuning_engine.setSerialCadence__008,1,CFG.tuning_engine.setSerialCadence__009));
 return {cadence,weeks:p.weeksTotal,quality:p.quality};
}
// One optional arc-level decision, never a compulsory chapter/task queue.
function reviewSerialArc(s,projectId,choice){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId);
 if(!p||p.companyId!==s.playerId||p.sector!=='publishing'||p.format!=='Web Serial'||
    p.status!=='active'||p.weeksDone<=0||p.weeksDone>=p.weeksTotal*CFG.tuning_engine.reviewSerialArc__001||p.serialArcDecisions.length)
   throw new Error('An active mid-production serial arc is required; the team handles other arcs.');
 if(!['tighten','expand'].includes(choice))throw new Error('Unknown serial arc direction.');
 if(p.route==='adaptation'&&p.grantId&&s.grants.find(g=>g.id===p.grantId)?.approvalRequired)
   throw new Error('Creator veto restricts editing this licensed serial.');
 const cost=choice==='expand'?CFG.tuning_engine.cost__005:CFG.tuning_engine.cost__006;
 if(c.finance.cash<cost+CFG.tuning_engine.reviewSerialArc__002)throw new Error('Insufficient cash for serialized editorial work.');
 expense(s,c,cost,'serial-arc','Optional '+choice+' arc planning: '+p.title,p.id);
 p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
 p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);
 if(choice==='expand'){p.weeksTotal+=CFG.tuning_engine.reviewSerialArc__003;p.creativeQuality=Math.min(CFG.tuning_engine.reviewSerialArc__004,p.creativeQuality+CFG.tuning_engine.reviewSerialArc__005);}
 else {p.weeksTotal=Math.max(p.weeksDone+1,p.weeksTotal-1);p.technicalQuality=Math.min(CFG.tuning_engine.reviewSerialArc__006,p.technicalQuality+CFG.tuning_engine.reviewSerialArc__007);}
 p.quality=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.reviewSerialArc__008+p.technicalQuality*CFG.tuning_engine.reviewSerialArc__009,1,CFG.tuning_engine.reviewSerialArc__010));
 const rec={week:s.week,choice,cost};p.serialArcDecisions.push(rec);return rec;
}
function publishingSalesReport(s,projectId){
 const p=s.projects.find(x=>x.id===projectId);
 if(!p||p.sector!=='publishing')throw new Error('Unknown publishing title.');
 const b=p.salesByRegion||{},channels=p.salesByChannel||{},u=p.salesUnitsByRegion||{},v=p.salesUnitsByChannel||{},cohorts=p.salesUnitsByAudience||{};
 return {projectId:p.id,totalGross:money(Object.values(b).reduce((x,y)=>x+y,0)),
  unitPrice:publishingUnitPrice(p),totalUnits:Object.values(u).reduce((n,x)=>n+x,0),unitsHistoryComplete:p.publishingUnitHistoryComplete===true,
  audienceMixEstimated:true,audienceHistoryComplete:p.audienceUnitHistoryComplete===true,
  byAudience:Object.entries(cohorts).map(([name,units])=>({name,units,provenance:'estimated'})),
  recentWeeks:(p.publishingUnitHistory||[]).map(x=>({...x})),
  regions:Object.entries(b).map(([name,gross])=>({name,gross:money(gross),units:u[name]||0})),
  byChannel:Object.entries(channels).map(([name,gross])=>({name,gross:money(gross),units:v[name]||0})),
  observedSinceVersion:CFG.tuning_engine.publishingSalesReport__001,historyComplete:p.publishingSalesHistoryComplete===true,
  netProjectReceipts:p.directRevenue,printStock:p.printStock?.stock??null,weeklyGross:p.stats.weeklySales};
}
function previewProject(s,data={}) {
  const c=data.companyId?company(s,data.companyId):player(s);
  const sector=data.sector||c.sector;
  const size=clamp(Number(data.size)||1,CFG.tuning_engine.size__001,CFG.tuning_engine.size__002);const format=FORMATS[sector]?.includes(data.format)?data.format:FORMATS[sector]?.[0];
  if(sector==='publishing'&&!publishingFormatAvailable(s,format))throw new Error('This publishing format needs later world technology adoption.');
  const productionRegion=REGIONS.find(r=>r.name===data.productionRegion)||REGIONS[0];
  const base=sectorCost(sector,size,format)*productionRegion.productionCost;
  const outsource=c.capabilities[sector]==='partner';
  const budget=Math.round(base*(outsource?CFG.tuning_engine.budget__001:1)/CFG.tuning_engine.budget__002)*CFG.tuning_engine.budget__003;
  const weeks=Math.max(CFG.tuning_engine.weeks__003,Math.round(SECTORS[sector].weeks*(CFG.tuning_engine.weeks__004+size*CFG.tuning_engine.weeks__005)));
  const marketing=money(Math.round(budget*(Number(data.marketing)||CFG.tuning_engine.marketing__001)*CFG.tuning_engine.marketing__002)/CFG.tuning_engine.marketing__003);
  const printPhysical=sector==='publishing'&&data.route!=='contract'&&['Novel','Nonfiction','Comic / Manga'].includes(format);
  const initialPrintCash=printPhysical?money(Math.round(CFG.tuning_engine.initialPrintCash__001*size)*(format==='Comic / Manga'?CFG.tuning_engine.initialPrintCash__002:CFG.tuning_engine.initialPrintCash__003)):0;
  const plan={sector,format,size,productionRegion:productionRegion.name,budget,weeks,marketing,grandTotal:money(budget+marketing),initialPrintCash,contractFee:money((budget+marketing)*CFG.tuning_engine.plan__001*(c.id===s.playerId?1+contractTier(s,c).payBonus:1))};
  if(data.route==='contract'){
    const signed=data.offerId?s.commissionOffers.find(o=>o.id===data.offerId):null;
    if(data.offerId&&(!signed||signed.status!=='accepted'||signed.producerId!==c.id||signed.sector!==sector))throw new Error('No accepted client offer for this project.');
    if(signed)plan.contractFee=signed.acceptedFee;
    const clients=eligibleClients(s,plan.contractFee,c.id);
    plan.clientId=signed?signed.clientId:(clients.find(x=>x.id===data.clientId)?.id||(!data.clientId||data.clientId==='auto'?clients[0]?.id:null));
    plan.fundedClientCount=clients.length;
  }
  plan.forecast=data.withForecast===false?null:forecastProject(s,data,plan,c);
  return plan;
}

// Evidence is from the player's own completed releases only. A review reports
// a fixed 13-week observation, so lifetime catalogue receipts are never
// mistaken for the originally forecast horizon.
function projectEvidence(s,{companyId=s.playerId,sector='publishing',genre=null,limit=CFG.tuning_engine.projectEvidence__001}={}){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company for evidence.');
 if(!SECTORS[sector])throw new Error('Unknown industry for evidence.');
 const rows=s.projects.filter(p=>p.companyId===c.id&&p.sector===sector&&(!genre||p.genre===genre)&&p.status==='released'&&p.review&&
   Number.isFinite(p.review.actualDirect)&&Number.isFinite(p.review.expectedDirect)&&p.creativeHistoryComplete!==false)
  .sort((a,b)=>b.releaseWeek-a.releaseWeek).slice(0,clamp(Math.round(limit)||CFG.tuning_engine.rows__001,1,CFG.tuning_engine.rows__002))
  .map(p=>({projectId:p.id,title:p.title,genre:p.genre,releaseWeek:p.releaseWeek,year:yearAt(p.releaseWeek),
    actualDirect:money(p.review.actualDirect),expectedDirect:money(p.review.expectedDirect),actualGross:Number.isFinite(p.review.actualGross)?money(p.review.actualGross):null,expectedGross:Number.isFinite(p.review.expectedGross)?money(p.review.expectedGross):null,
    variance:money(p.review.actualDirect-p.review.expectedDirect),source:'observed 13-week postmortem',historyComplete:true}));
 return {companyId:c.id,sector,genre,sampleSize:rows.length,rows,
   averageVariance:rows.length?money(rows.reduce((n,r)=>n+r.variance,0)/rows.length):null,
   basis:rows.length?'Your own observed 13-week release results; not a guarantee of future sales.':'No comparable completed 13-week release reviews. Do not infer a performance history.'};
}