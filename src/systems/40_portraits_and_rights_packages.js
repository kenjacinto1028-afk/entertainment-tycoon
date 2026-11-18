
const PORTRAIT_COLORS43=Object.freeze(CFG.onboarding.PORTRAIT_COLORS43);
function portraitTraits43(s,personId){
 const person=(s.employees||[]).find(p=>p.id===personId)||(s.specialists||[]).find(p=>p.id===personId)||(s.filmActors||[]).find(p=>p.id===personId)||(s.candidates||[]).find(p=>p.id===personId)||(s.founder.id===personId?s.founder:null);
 if(!person)throw new Error('Portrait subject must be a known named person.');
 const h=hash(s.seed+':portrait43:'+personId),skin=PORTRAIT_COLORS43.skins[h%CFG.tuning_engine.skin__001],hair=PORTRAIT_COLORS43.hairs[(h>>>CFG.tuning_engine.hair__001)%CFG.tuning_engine.hair__002],shirt=PORTRAIT_COLORS43.shirts[(h>>>CFG.tuning_engine.shirt__001)%CFG.tuning_engine.shirt__002],background=PORTRAIT_COLORS43.backdrops[(h>>>CFG.tuning_engine.background__001)%CFG.tuning_engine.background__002];
 return {personId,name:person.name||'Creator',skin,hair,shirt,background,hairstyle:(h>>>CFG.tuning_engine.portraitTraits43__001)%CFG.tuning_engine.portraitTraits43__002,
  glasses:(h>>>CFG.tuning_engine.portraitTraits43__003)%CFG.tuning_engine.portraitTraits43__004===0,eyes:(h>>>CFG.tuning_engine.portraitTraits43__005)%CFG.tuning_engine.portraitTraits43__006,style:'original-vector-cartoon',reusable:true};
}
function syncWorldEvents43(s){ensure43B(s);
 const add=(key,week,kind,entityId,title,newsKind)=>{
  if(s.events43Keys[key]||week>s.week||week<s.startedYear*CFG.tuning_engine.add__001-CFG.tuning_engine.add__002||week<0)return;
  const headline=[...s.news,...s.archivedNews].find(n=>n.week===week&&
    (n.kind===newsKind||n.kind==='company')&&(n.title.includes(title)||n.body.includes(title)));
  const row={id:id(s,'worldevent43'),key,week,kind,entityId,newsId:headline?.id||null,source:'played-entity',title};
  s.events43.push(row);s.events43Keys[key]=true;
 };
 const now=s.week;
 for(const p of s.projects)if(p.status==='released'&&p.releaseWeek!=null&&p.releaseWeek>=now-1)add('release:'+p.id,p.releaseWeek,'release',p.id,p.title,'release');
 for(const g of s.grants)if(g.startWeek>=now-1)add('rights:'+g.id,g.startWeek,'rights',g.id,s.ips.find(ip=>ip.id===g.ipId)?.name||g.ipId,'deal');
 for(const a of s.creativeAwards)if(a.awardedWeek>=now-1)add('award:'+a.year+':'+a.sector,a.awardedWeek,'award',a.projectId,s.projects.find(p=>p.id===a.projectId)?.title||a.projectId,'award');
 for(const c of s.companies)if(c.bankrupt&&!s.events43Keys['bankrupt:'+c.id]){
  const n=[...s.news,...s.archivedNews].find(n=>n.title.includes(c.name+' closes its doors'));
  if(n)add('bankrupt:'+c.id,n.week,'bankruptcy',c.id,c.name,'competitor');
 }
 if(s.events43.length>CFG.tuning_engine.syncWorldEvents43__001)s.events43.splice(0,s.events43.length-CFG.tuning_engine.syncWorldEvents43__002);
 updateObjectives43(s);
 return s.events43.slice(-CFG.tuning_engine.syncWorldEvents43__003);
}
function worldEvents43(s,{kind='all',limit=CFG.tuning_engine.worldEvents43__001}={}){ensure43B(s);
 return s.events43.filter(x=>kind==='all'||x.kind===kind).slice(-Math.max(1,Math.min(CFG.tuning_engine.worldEvents43__002,Number(limit)||CFG.tuning_engine.worldEvents43__003))).reverse();
}
function audit43B(s,problems){ensure43B(s);
 const t=s.tutorial43,o=s.objectives43;
 if(!Number.isInteger(t.step)||t.step<0||t.step>TUTORIAL_STEPS43.length||!Array.isArray(t.visited)||
 !Array.isArray(o.selected)||o.selected.some(x=>!OBJECTIVE_DEFS43[x])||
 Object.keys(o.completed).some(k=>!OBJECTIVE_DEFS43[k]||o.completed[k].week>s.week))problems.push('Invalid optional learning or objectives data');
 const known=new Set();
 for(const e of s.events43){
  const object=e.kind==='release'||e.kind==='award'?s.projects.find(p=>p.id===e.entityId):e.kind==='rights'?s.grants.find(g=>g.id===e.entityId):s.companies.find(c=>c.id===e.entityId);
  if(!object||e.week>s.week||known.has(e.key)||e.source!=='played-entity'||!s.events43Keys[e.key])problems.push('Invalid source-linked entertainment event');
  known.add(e.key);
  if(e.kind==='release'&&object&&(object.status!=='released'||object.releaseWeek!==e.week))problems.push('Event disagrees with real project release');
  if(e.kind==='rights'&&object&&object.startWeek!==e.week)problems.push('Event disagrees with rights grant');
 }
}
function update43BWeek(s){syncWorldEvents43(s);}

// UPDATE 43C — scoped contractual rights, actual game-publishing financing,
// transferable R&D ownership. No invented publisher money or magic technology.
function ensure43C(s){
 if(!Array.isArray(s.gamePublisherDeals43))s.gamePublisherDeals43=[];
 if(!Array.isArray(s.gamePublisherPayments43))s.gamePublisherPayments43=[];
 if(!Array.isArray(s.technologyOffers43))s.technologyOffers43=[];
 if(!Array.isArray(s.technologyTrades43))s.technologyTrades43=[];
}
function regionScope43(g){
 if(Array.isArray(g.territories43))return g.territories43;
 if(!g.territory||g.territory==='Worldwide')return REGIONS.map(r=>r.name);
 return REGIONS.some(r=>r.name===g.territory)?[g.territory]:REGIONS.map(r=>r.name);
}
function normalizeRegions43(regions){
 const list=regions==='Worldwide'||regions==null?activeRegionsDummy43():typeof regions==='string'?[regions]:regions;
 if(!Array.isArray(list)||list.length<1||list.length>REGIONS.length||new Set(list).size!==list.length||list.some(r=>!REGIONS.some(x=>x.name===r)))throw new Error('Choose valid unique licensed territories.');
 return REGIONS.map(r=>r.name).filter(r=>list.includes(r));
}
function activeRegionsDummy43(){return REGIONS.map(r=>r.name);}
function rightsOverlap43(a,b){return regionScope43(a).some(r=>regionScope43(b).includes(r));}
function rightsAncestor43(s,a,b){
 let node=b,steps=0;
 while(node?.parentGrantId&&steps++<CFG.tuning_engine.rightsAncestor43__001){
  if(node.parentGrantId===a.id)return true;
  node=s.grants.find(x=>x.id===node.parentGrantId);
 }
 return false;
}
function validGrantor43(s,g,ip){
 if(!g.parentGrantId)return ip.ownerId===g.grantorId;
 const parent=s.grants.find(x=>x.id===g.parentGrantId);
 return !!(parent&&parent.type==='license'&&parent.holderId===g.grantorId&&parent.sublicensable43&&
  parent.startWeek<=g.startWeek&&parent.endWeek>=g.endWeek&&
  regionScope43(g).every(r=>regionScope43(parent).includes(r))&&parent.media===g.media&&
  (!parent.approvalRequired||g.approvalRequired));
}
function rightsConflict43(s,trial,other){
 if(trial.id===other.id||trial.ipId!==other.ipId||trial.media!==other.media||
  trial.startWeek>=other.endWeek||other.startWeek>=trial.endWeek||!rightsOverlap43(trial,other))return false;
 if(rightsAncestor43(s,trial,other)||rightsAncestor43(s,other,trial))return false;
 return !!(trial.exclusive||other.exclusive);
}
// Replaces the old worldwide-only permission function (the grant registry stays one).
function canUseIp(s,c,ipId,sector,week=s.week,territory=null){
 if(!available(sector,week))return {ok:false,reason:'This industry has not debuted globally.'};
 const ip=s.ips.find(x=>x.id===ipId);if(!ip)return {ok:false,reason:'Source IP not found.'};
 const region=territory&&territory!=='Worldwide'?territory:null;
 if(region&&!REGIONS.some(r=>r.name===region))return {ok:false,reason:'Unknown distribution territory.'};
 if(ip.ownerId===c.id){
  const denied=s.grants.some(g=>g.ipId===ipId&&g.media===sector&&g.exclusive&&g.holderId!==c.id&&g.startWeek<=week&&g.endWeek>week&&
   ['option','license'].includes(g.type)&&(!region||regionScope43(g).includes(region)));
  return denied?{ok:false,reason:'Exclusive '+sector+' rights are reserved in the requested territory.'}:{ok:true};
 }
 const r=s.grants.find(g=>g.ipId===ipId&&g.holderId===c.id&&g.media===sector&&g.type==='license'&&g.startWeek<=week&&g.endWeek>week&&g.allowsProduction&&
  (!region||regionScope43(g).includes(region)));
 return r?{ok:true,grantId:r.id,territories:regionScope43(r)}:{ok:false,reason:'No effective adaptation license for this territory and medium.'};
}
function canDistribute43(s,p,region,week=s.week){
 if(!p||!REGIONS.some(r=>r.name===region))return false;
 if(Array.isArray(p.territories43)&&!p.territories43.includes(region))return false;
 if(!p.grantId)return true;
 const g=s.grants.find(x=>x.id===p.grantId);
 return !!(g&&g.type==='license'&&g.startWeek<=week&&g.endWeek+(g.continuationWeeks||0)>week&&regionScope43(g).includes(region));
}
function rightsPackageReport43(s,ipId){
 const ip=s.ips.find(x=>x.id===ipId);if(!ip)throw new Error('IP unknown.');
 return s.grants.filter(g=>g.ipId===ipId).map(g=>({id:g.id,grantorId:g.grantorId,holderId:g.holderId,medium:g.media,kind:g.type,
  regions:regionScope43(g),startWeek:g.startWeek,endWeek:g.endWeek,exclusive:!!g.exclusive,
  sublicense:!!g.sublicensable43,parentGrantId:g.parentGrantId||null,approvalRequired:!!g.approvalRequired,
  continuationWeeks:g.continuationWeeks||0,productionAllowed:g.type==='license'&&!!g.allowsProduction&&g.endWeek>s.week}));
}
function grantRightsPackage43(s,{ipId,holderId,media,territories=['North Coast'],weeks=CFG.tuning_engine.grantRightsPackage43__001,fee=CFG.tuning_engine.grantRightsPackage43__002,royaltyRate=CFG.tuning_engine.grantRightsPackage43__003,
 exclusive=false,sublicensable=false,approvalRequired=false,continuationWeeks=0,parentGrantId=null}={}){
 requireExecutiveControl(s);ensure43C(s);
 const ip=s.ips.find(x=>x.id===ipId),playerFirm=player(s),holder=company(s,holderId),regions=normalizeRegions43(territories);
 if(!ip||!holder||holder.bankrupt)throw new Error('Rights parties must be valid independent companies.');
 // A player may license out owned IP, license in from a consenting rival,
 // or sublicense rights it holds when its own parent grant expressly allows it.
 const grantorId=parentGrantId?playerFirm.id:ip.ownerId,owner=company(s,grantorId);
 if(!owner||grantorId===holder.id||owner.parentId===holder.id||holder.parentId===owner.id||
   (grantorId!==playerFirm.id&&holder.id!==playerFirm.id))throw new Error('Rights parties must be valid independent companies.');
 if(!SECTORS[media]||!available(media,s.week))throw new Error('Commercial adaptation rights open only after world sector debut; use binding options earlier.');
 if(!Number.isInteger(weeks)||weeks<CFG.tuning_engine.grantRightsPackage43__004||weeks>CFG.tuning_engine.grantRightsPackage43__005||!Number.isFinite(fee)||fee<CFG.tuning_engine.grantRightsPackage43__006||fee>CFG.tuning_engine.grantRightsPackage43__007||!Number.isFinite(royaltyRate)||royaltyRate<0||royaltyRate>CFG.tuning_engine.grantRightsPackage43__008||!Number.isInteger(continuationWeeks)||continuationWeeks<0||continuationWeeks>CFG.tuning_engine.grantRightsPackage43__009)throw new Error('Rights duration or compensation invalid.');
 const g={id:id(s,'grant'),ipId,grantorId:owner.id,holderId,media,territory:regions.length===REGIONS.length?'Worldwide':regions.join(', '),
  territories43:regions,parentGrantId,parentSublicense43:!!parentGrantId,sublicensable43:!!sublicensable,
  type:'license',startWeek:s.week,endWeek:s.week+weeks,optionExpiresWeek:null,exercisedWeek:null,exerciseFee:0,exerciseFeePaid:0,
  renewalHistory:[],approvalRequired:!!approvalRequired,exclusive:!!exclusive,allowsProduction:true,fee:money(fee),royaltyRate,
  recoupableAdvance:0,royaltyHistoryComplete:true,continuationWeeks};
 if(!validGrantor43(s,g,ip))throw new Error('Seller lacks underlying title or permission to sublicense these territories and dates.');
 if(parentGrantId){
  const parent=s.grants.find(x=>x.id===parentGrantId);
  if(parent?.approvalRequired&&!approvalRequired)throw new Error('Binding creator approvals cannot be waived.');
  // The parent and holder must be the same legal company; only that company can resell rights.
 }
 const conflicts=s.grants.find(other=>rightsConflict43(s,g,other));
 if(conflicts)throw new Error('Overlapping exclusive rights are already contracted: '+conflicts.id);
 if(holder.finance.cash<fee+CFG.tuning_engine.grantRightsPackage43__010)throw new Error('Counterparty cannot fund this rights package.');
 if(grantorId!==playerFirm.id&&fee<Math.max(CFG.tuning_engine.grantRightsPackage43__011,Math.round((ip.rightsIncome||0)*CFG.tuning_engine.grantRightsPackage43__012+CFG.tuning_engine.grantRightsPackage43__013)))throw new Error('External IP owner declined the proposed cash terms.');
 // Both sides book the actual same payment. No fictitious consumer demand.
 expense(s,holder,money(fee),'scoped-license-fee','License '+media+' territories for '+ip.name);
 revenue(s,owner,money(fee),'scoped-license-fee','Paid '+media+' rights grant for '+ip.name);
 if(ip.ownerId===owner.id)ip.rightsIncome=money((ip.rightsIncome||0)+money(fee));
 s.grants.push(g);
 news(s,'Scoped rights signed: '+ip.name,holder.name+' acquired '+media+' rights in '+regions.join(', ')+'. Term and existing approvals remain binding.','deal');
 return g;
}