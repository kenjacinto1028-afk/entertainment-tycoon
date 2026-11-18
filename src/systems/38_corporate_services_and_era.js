
function groupInternalLicense(s,ipId,holderId,medium,fee=CFG.tuning_engine.groupInternalLicense__001,weeks=CFG.tuning_engine.groupInternalLicense__002){
 requireExecutiveControl(s);ensure42C(s);
 const ip=s.ips.find(x=>x.id===ipId),owner=ip&&company(s,ip.ownerId),holder=company(s,holderId),group=controlledCompanies(s);
 fee=money(Number(fee));
 if(!ip||!owner||!holder||owner.id===holder.id||!group.some(x=>x.id===owner.id)||!group.some(x=>x.id===holder.id))
  throw new Error('Only separate, wholly controlled group companies can execute internal rights deals.');
 if(!SECTORS[medium]||!available(medium,s.week)||!Number.isInteger(weeks)||weeks<CFG.tuning_engine.groupInternalLicense__003||weeks>CFG.tuning_engine.groupInternalLicense__004||!Number.isFinite(Number(fee))||fee<0||fee>CFG.tuning_engine.groupInternalLicense__005)
  throw new Error('Internal license requires an open global medium, valid term and modest funded charge.');
 if(s.grants.some(g=>g.ipId===ipId&&g.media===medium&&g.exclusive&&g.startWeek<s.week+weeks&&g.endWeek>s.week&&g.holderId!==holder.id))throw new Error('Exclusive external IP rights cannot be bypassed by group reorganization.');
 if(holder.finance.cash<fee+CFG.tuning_engine.groupInternalLicense__006)throw new Error('Subsidiary cannot fund internal rights transfer and payroll buffer.');
 const grant={id:id(s,'grant'),ipId,grantorId:owner.id,holderId:holder.id,media:medium,territory:'Worldwide',type:'license',
  startWeek:s.week,endWeek:s.week+weeks,optionExpiresWeek:null,exercisedWeek:null,exerciseFee:0,exerciseFeePaid:0,
  renewalHistory:[],approvalRequired:false,exclusive:false,allowsProduction:true,fee,royaltyRate:0,recoupableAdvance:0,
  royaltyHistoryComplete:true,continuationWeeks:0,groupInternal:true};
 if(fee){transact(s,holder,'internal-license-expense',{cash:-fee,expense:fee},'Actual internal IP license charge');
   transact(s,owner,'internal-license-revenue',{cash:fee,revenue:fee},'Actual internal IP license receipt');
   holder.finance.internalExpense=money((holder.finance.internalExpense||0)+fee);
   owner.finance.internalRevenue=money((owner.finance.internalRevenue||0)+fee);}
 s.grants.push(grant);
 s.groupLicenseHistory.push({id:id(s,'grouplicense'),grantId:grant.id,week:s.week,ipId,ownerId:owner.id,holderId:holder.id,fee});
 return grant;
}
const _consolidated42B=consolidatedStatements;
consolidatedStatements=function(s,rootId=s.playerId){const out=_consolidated42B(s,rootId),units=controlledCompanies(s,rootId).slice(1),acquired=units.filter(c=>c.acquisition?.kind==='company');
 const preRevenue=money(acquired.reduce((n,c)=>n+c.acquisition.preRevenue,0)),preExpense=money(acquired.reduce((n,c)=>n+c.acquisition.preExpense,0)),
  goodwill=money(acquired.reduce((n,c)=>n+c.acquisition.goodwill,0));
 out.income.preacquisitionRevenueExcluded=preRevenue;out.income.preacquisitionExpensesExcluded=preExpense;
 out.income.revenue=money(out.income.revenue-preRevenue);out.income.expenses=money(out.income.expenses-preExpense);
 out.income.net=money(out.income.revenue-out.income.expenses);
 out.balance.acquisitionGoodwill=goodwill;out.balance.assets=money(out.balance.assets+goodwill);
 out.balance.retainedEarnings=out.income.net;out.balance.equity=money(out.balance.parentCapital+out.income.net);
 out.balance.difference=money(out.balance.assets-out.balance.liabilities-out.balance.equity);
 return out;};
// Controlled subsidiaries retain their ordinary cash-constrained studio
// management by default. The player can opt out and direct them manually.
function subsidiaryDelegation(s,childId,enabled){
 requireExecutiveControl(s);
 if(typeof enabled!=='boolean')throw new Error('Delegation must be explicitly enabled or disabled.');
 const child=controlledCompanies(s).find(x=>x.id===childId&&x.parentId===s.playerId);
 if(!child)throw new Error('Only a controlled subsidiary may change launch authority.');
 child.delegatedProduction=enabled;
 return {childId,enabled};
}
const _launchAI42=launchAI;
launchAI=function(s,c){if(c.parentId===s.playerId&&c.delegatedProduction===false)return null;return _launchAI42(s,c);};
const _createGame42B=createGame;
createGame=function(input){const s=_createGame42B(input);ensure42C(s);return s;};
const _loadState42B=loadState;
loadState=function(raw){const s=_loadState42B(raw);ensure42C(s);return s;};
const _audit42B=audit;
audit=function(s){const errs=_audit42B(s);
 for(const a of s.acquisitionHistory||[]){
  if(a.kind==='company'){const c=company(s,a.targetId),parent=company(s,a.buyerId);
   if(!c||!parent||c.parentId!==parent.id||c.acquisition?.id!==a.id||a.goodwill<-CFG.tuning_engine.topLevel__005)errs.push('Invalid acquired-company identity or purchase value');}
  else if(!['asset-ip','asset-work'].includes(a.kind)||!company(s,a.fromId)||!company(s,a.toId))errs.push('Invalid title purchase provenance');
 }
 for(const g of s.groupLicenseHistory||[])if(!s.grants.some(x=>x.id===g.grantId&&x.groupInternal&&x.royaltyRate===0))errs.push('Invalid internal rights consolidation');
 if(s.companies.some(c=>c.parentId===s.playerId)){const x=consolidatedStatements(s);if(Math.abs(x.balance.difference)>CFG.tuning_engine.topLevel__006)errs.push('Acquired-company goodwill does not balance after consolidation');}
 return errs;};

// UPDATE 43A — historical continuity, independent capabilities and delegation.
// Generated backstory is strictly archival: never a live receivable, IP grant or
// claimed booked historical cash flow.
const STARTUP_PROFILES=Object.freeze(CFG.onboarding.STARTUP_PROFILES);
function ensure43A(s){
 if(!Array.isArray(s.prehistoryWorks))s.prehistoryWorks=[];
 if(!s.eraArchive)s.eraArchive={originYear:s.startedYear,generated:false,coverageStart:null,coverageEnd:null,uncertain:true};
 if(!s.managementDepth43)s.managementDepth43={corporate:'guided',teams:{},projects:{},autoSpendLimit:CFG.tuning_engine.ensure43A__001,actions:[]};
 if(!s.settings.startupProfile)s.settings.startupProfile='focused';
}
function build43Prehistory(s){
 ensure43A(s);
 if(s.eraArchive.generated)return;
 const end=s.startedYear-1, start=s.startedYear===1?-CFG.tuning_engine.start__003:-CFG.tuning_engine.start__004;
 const firms=s.companies.filter(c=>!c.isPlayer&&!c.parentId);
 const names=CFG.world.HISTORICAL_ARCHIVE_TITLES;
 for(let year=start;year<=end;year++){
   const availableSectors=Object.entries(SECTORS).filter(([sector,x])=>year>=x.year).map(([k])=>k);
   if(year<=0)availableSectors.splice(0,availableSectors.length,'publishing');
   // Historical fictional publishers may predate ALL presently active firms.
   // Their entities are archives, not projected ownership of generated rivals.
   for(const sector of availableSectors){
     const idx=hash(s.seed+':prehistory:'+year+':'+sector);
     const eligible=firms.filter(c=>c.sector===sector&&c.foundedYear<=year);
     const firm=eligible.length?eligible[idx%eligible.length]:null;
     const title=names[idx%names.length]+' '+(Math.abs(year)+1);
     const rec={id:'archive_'+sector+'_'+String(year).replace('-','m'),year,sector,title,
       companyId:firm?.id||null,companyName:firm?.name||'Historical independent creator',
       source:'generated',status:'archived',financials:'not reconstructed',
       rights:'unasserted',award:(idx%CFG.tuning_engine.rec__001===0)?'Fictional cultural nomination':null};
     s.prehistoryWorks.push(rec);
     // One stable world event, no weekly transaction or fake live project.
     s.worldStory.push({year,text:rec.title+' ('+SECTORS[sector].name+') — historical release',source:'Generated prehistory',archiveId:rec.id,sector});
   }
 }
 s.eraArchive={originYear:s.startedYear,generated:true,coverageStart:start,coverageEnd:end,uncertain:true};
 s.prehistoryWorks.sort((a,b)=>a.year-b.year||a.sector.localeCompare(b.sector));
}
function apply43StartupProfile(s,input={}){
 ensure43A(s);
 const profile=STARTUP_PROFILES[input.startupProfile]?input.startupProfile:'focused';
 s.settings.startupProfile=profile;const c=player(s);
 if(profile==='team'){
  const cost=money(CFG.tuning_engine.cost__049*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
  if(c.finance.cash<cost+CFG.tuning_engine.apply43StartupProfile__001)throw new Error('Startup needs an affordable training and payroll buffer.');
  expense(s,c,cost,'startup-team','Initial extra trained workgroup');
  c.capacity++;c.teamLevel++;c.teams.push(newTeam(s,c,c.teams.length));
 }
 if(profile==='partner'){
  const target=Object.keys(SECTORS).find(sec=>sec!==c.sector&&available(sec,s.week));
  if(!target)throw new Error('No separate production sector exists in this era; choose the team or focused profile.');
  const cost=money(capabilityCost(target,'partner')*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
  if(c.finance.cash<cost+CFG.tuning_engine.apply43StartupProfile__002)throw new Error('Initial partner readiness cannot be funded.');
  expense(s,c,cost,'startup-partner','Initial outsourced '+target+' operating capability');
  c.capabilities[target]='partner';
 }
 c.startupProfile=profile;c.startupProfileCost=s.ledger.filter(e=>e.companyId===c.id&&e.kind.startsWith('startup-')).reduce((n,e)=>money(n+e.amount),0);
}
function prepare43World(s,input={}){
 ensure43A(s);build43Prehistory(s);apply43StartupProfile(s,input);
}
function eraOverview43(s){ensure43A(s);return {
 startedYear:s.startedYear,worldYear:yearAt(s.week),companyAge:Math.max(0,yearAt(s.week)-player(s).foundedYear),
 maturity:s.settings.worldMaturity,industryStages:Object.fromEntries(Object.entries(SECTORS).map(([k,v])=>[k,{
 debut:v.year,available:available(k,s.week),yearsSinceDebut:Math.max(0,yearAt(s.week)-v.year),
 maturity:!available(k,s.week)?'locked':yearAt(s.week)===v.year?'emerging':yearAt(s.week)-v.year<CFG.tuning_engine.eraOverview43__001?'growing':'mature'}])),
 archives:s.prehistoryWorks.length,origin:'independently founded',generatedNotBooked:true,historyComplete:s.eraArchive.generated};}