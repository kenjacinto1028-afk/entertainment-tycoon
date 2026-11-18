
function assignTeamDivision(s,teamId,divisionId=null){
 requireExecutiveControl(s);ensure42B(s);
 const c=controlledCompanies(s).find(c=>c.teams.some(t=>t.id===teamId));if(!c||divisionId!==null&&!c.divisions.some(d=>d.id===divisionId&&d.active))throw new Error('Team/division must belong to the same controlled company.');
 const team=c.teams.find(t=>t.id===teamId);team.divisionId=divisionId;return {teamId,divisionId};
}
function divisionPerformance(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company.');ensure42B(s);
 const groups=[...c.divisions.filter(x=>x.active),{id:null,name:'Unassigned teams'}];
 return groups.map(d=>{const teams=c.teams.filter(t=>t.divisionId===d.id);
  const projects=s.projects.filter(p=>p.companyId===c.id&&teams.some(t=>t.id===p.teamId));
  return {divisionId:d.id,name:d.name,teamIds:teams.map(x=>x.id),projectCount:projects.length,
   directRevenue:money(projects.reduce((n,p)=>n+p.directRevenue,0)),directCost:money(projects.reduce((n,p)=>n+p.directCost,0)),
   directContribution:money(projects.reduce((n,p)=>n+currentProjectProfit(p),0)),
   allocatedOverhead:money(projects.reduce((n,p)=>n+(p.overheadAttributed||0),0)),
   note:'A non-legal management slice. Shared corporate expenses remain separately disclosed and do not transfer company cash.'};});
}
function setCentralService(s,name,enabled,companyId=s.playerId){
 requireExecutiveControl(s);ensure42B(s);const c=controlledCompanies(s).find(c=>c.id===companyId),item=CENTRAL_SERVICES[name];
 if(!c||!item||typeof enabled!=='boolean')throw new Error('Invalid managed company or central service.');
 if(enabled&&c.finance.cash<item.weekly*CFG.tuning_engine.setCentralService__001+estimateWeeklyPayroll(s,c.id)*CFG.tuning_engine.setCentralService__002)throw new Error('Not enough cash to finance this recurring service.');
 c.sharedServices[name]=enabled;return {companyId:c.id,service:name,enabled,weeklyCost:item.weekly};
}
function settleCentralServices(s){
 for(const c of s.companies){if(c.bankrupt)continue;
  for(const [name,settings] of Object.entries(CENTRAL_SERVICES))if(c.sharedServices?.[name]){
   expense(s,c,settings.weekly,'corporate-service',settings.label+' — real weekly shared overhead');
  }
  if(s.week%CFG.tuning_engine.settleCentralServices__001===0&&c.sharedServices?.hr)for(const person of s.employees||[])if(person.employerId===c.id&&person.status==='employed')person.morale=clamp(person.morale+1,CFG.tuning_engine.settleCentralServices__002,CFG.tuning_engine.settleCentralServices__003);
  if(s.week%CFG.tuning_engine.settleCentralServices__004===0&&c.sharedServices?.legal&&c.id===s.playerId){
   const expires=s.grants.find(g=>g.holderId===c.id&&g.endWeek>s.week&&g.endWeek<=s.week+CFG.tuning_engine.expires__001&&g.type==='license');
   if(expires)alert(s,'legal-advance-'+expires.id,CFG.events.messages.settleCentralServices__001,CFG.events.messages.settleCentralServices__002,'advisory');
  }
 }
}
function groupFinanceReport(s,rootId=s.playerId){ensure42B(s);
 const c=company(s,rootId);if(!c)throw new Error('Unknown reporting group.');
 const members=controlledCompanies(s,rootId),entityReports=members.map(x=>({companyId:x.id,name:x.name,financial:financialStatements(s,x.id),
  divisions:divisionPerformance(s,x.id),services:Object.entries(CENTRAL_SERVICES).filter(([k])=>x.sharedServices[k]).map(([k,v])=>({...v,type:k}))}));
 return {groupId:rootId,entities:entityReports,consolidated:consolidatedStatements(s,rootId),
  explanation:'Legal entities retain their exact cash, bank debt and obligations. Intragroup settlements are eliminated only on consolidated views.'};
}
const _createGame42A=createGame;
createGame=function(input){const s=_createGame42A(input);ensure42B(s);return s;};
const _loadState42A=loadState;
loadState=function(raw){const s=_loadState42A(raw);ensure42B(s);return s;};
const _singleWeek42A=singleWeek;
singleWeek=function(s){_singleWeek42A(s);settleCentralServices(s);};
const _audit42A=audit;
audit=function(s){const errs=_audit42A(s);
 for(const l of s.creditLines||[]){const c=company(s,l.companyId);
  if(!c||l.limit<CFG.tuning_engine.topLevel__001||l.openingWeek>s.week||l.expiresWeek-l.openingWeek!==CFG.tuning_engine.topLevel__002||l.fee<0||!Number.isFinite(l.interestRate)||l.interestRate<0||l.interestRate>CFG.tuning_engine.topLevel__003||creditLineStatus(s,l.id).outstanding>l.limit+CFG.tuning_engine.topLevel__004)errs.push('Invalid funding facility: '+l.id);}
 for(const c of s.companies)if(c.divisions){const ids=new Set(c.divisions.map(d=>d.id));if(ids.size!==c.divisions.length||c.teams.some(t=>t.divisionId&&!ids.has(t.divisionId)))errs.push(c.id+': invalid division ownership');}
 return errs;};

// UPDATE 42C — conservative asset-vs-company deals, funded acquisitions,
// lawful existing-rights continuation and consolidated group eliminations.
function ensure42C(s){
 if(!Array.isArray(s.diligenceRecords))s.diligenceRecords=[];
 if(!Array.isArray(s.acquisitionHistory))s.acquisitionHistory=[];
 if(!Array.isArray(s.groupLicenseHistory))s.groupLicenseHistory=[];
 if(!Array.isArray(s.integrationHistory))s.integrationHistory=[];
}
// Existing co-financing remains valid when its signatories later change
// shareholders. New intragroup co-financing is still prohibited at signing.
function validInheritedCoProduction(s,d){
 return [d.producerId,d.sponsorId].every(id=>{
  const c=company(s,id);
  if(!c)return false;
  if(!c.parentId)return true;
  return (s.acquisitionHistory||[]).some(a=>a.kind==='company'&&a.targetId===c.id&&a.week>=d.signedWeek);
 });
}
function acquisitionValue(c){const f=c.finance;
 return money(f.cash+(f.receivable||0)+(f.prepaid||0)+(f.inventory||0)+(f.investment||0)-(f.payable||0)-(f.deferred||0)-(f.loanBalance||0));}
function companyPurchaseQuote(s,targetId){
 const buyer=player(s),target=company(s,targetId);
 if(!target||target.id===buyer.id||target.isPlayer||target.parentId||s.companies.some(x=>x.parentId===target.id))throw new Error('Choose a distinct, independent company to acquire.');
 if(target.corporate&&target.corporate.stage!=='founder')throw new Error('External shareholders require a negotiated controlling-interest purchase not supported by this deal.');
 const book=acquisitionValue(target),operational=money(Math.max(0,target.finance.revenue-target.finance.expense)),
  ask=money(Math.max(CFG.tuning_engine.ask__003,book+Math.max(CFG.tuning_engine.ask__004,target.reputation*CFG.tuning_engine.ask__005+operational*CFG.tuning_engine.ask__006)));
 const minReserve=money(weeklyOverhead(buyer,s)*CFG.tuning_engine.minReserve__001+CFG.tuning_engine.minReserve__002),shortfall=money(Math.max(0,ask+minReserve-buyer.finance.cash));
 const credit=(s.creditLines||[]).filter(x=>x.companyId===buyer.id).map(l=>creditLineStatus(s,l.id)).filter(x=>x.open&&x.available>=shortfall);
 const inspected=(s.diligenceRecords||[]).some(x=>x.key==='company:'+targetId);
 return {targetId,kind:'shares',ask,bookNetAssets:inspected?book:null,expectedGoodwill:inspected?money(ask-book):null,
  cashRequired:ask,operatingReserve:minReserve,shortfall,creditLineIds:credit.map(x=>x.id),
  sector:target.sector,historyComplete:!!target.annualBaseline,
  note:'100% company equity purchase; no IP/work is reassigned. Target keeps all existing debt, employees, approvals, royalties, legal title and outstanding obligations.'};
}
function assetPurchaseQuote(s,{type='ip',id:assetId}={}){
 const buyer=player(s);
 const asset=type==='ip'?s.ips.find(x=>x.id===assetId):type==='work'?s.works.find(x=>x.id===assetId):null;
 if(!asset)throw new Error('Unknown IP or released-work asset.');
 const owner=company(s,asset.ownerId);if(!owner||owner.id===buyer.id||owner.parentId===buyer.id||owner.bankrupt&&owner.finance.cash<-CFG.tuning_engine.assetPurchaseQuote__001)
  throw new Error('Choose an independently owned external asset.');
 const grants=s.grants.filter(g=>g.ipId===(type==='ip'?asset.id:asset.ipId)),
  reserved=s.rightsOffers.filter(o=>o.ipId===(type==='ip'?asset.id:asset.ipId)),
  manuscript=s.manuscripts?.some(m=>m.ipId===(type==='ip'?asset.id:asset.ipId));
 const blocked=type==='ip'&&(grants.length>0||reserved.length>0||manuscript);
 const price=money(type==='ip'?CFG.tuning_engine.price__002+Math.min(CFG.tuning_engine.price__003,(asset.works?.length||0)*CFG.tuning_engine.price__004+owner.reputation*CFG.tuning_engine.price__005):
  CFG.tuning_engine.price__006+Math.max(0,s.projects.find(p=>p.id===asset.projectId)?.stats?.totalSales||0)*CFG.tuning_engine.price__007);
 return {kind:type,assetId,ownerId:owner.id,title:asset.name||asset.title,price,allowed:!blocked,
  encumbrances:grants.length,pendingOffers:reserved.length,manuscript:!!manuscript,
  includesUnderlyingIP:type==='ip',includesFinishedWork:type==='work',
  note:type==='work'?'Acquiring the completed work DOES NOT confer source-IP adaptations or extra distribution windows.':'Only a clean source title transfers. Any existing grant or offer blocks this simplified asset deal rather than silently stripping valid contracts.'};
}
function acquisitionDiligence(s,{kind='company',id:targetId}={},investigate=false){
 ensure42C(s);const c=kind==='company'?company(s,targetId):null;
 const asset=kind!=='company'?assetPurchaseQuote(s,{type:kind,id:targetId}):null;
 if(kind==='company'&&(!c||c.isPlayer||c.parentId))throw new Error('Choose an independently owned acquisition target.');
 if(!['company','ip','work'].includes(kind))throw new Error('Unknown diligence type.');
 const key=kind+':'+targetId;let ticket=s.diligenceRecords.find(r=>r.key===key);
 if(investigate&&!ticket){requireExecutiveControl(s);const buyer=player(s),fee=CFG.tuning_engine.fee__016;
  if(buyer.finance.cash<fee+weeklyOverhead(buyer,s)*CFG.tuning_engine.acquisitionDiligence__001)throw new Error('Insufficient cash for commercial title and debt inspection.');
  expense(s,buyer,fee,'acquisition-diligence','Funded review of real contracts and debt');
  ticket={id:id(s,'diligence'),key,companyId:buyer.id,week:s.week,fee};s.diligenceRecords.push(ticket);
 }
 if(kind!=='company')return {kind,asset,inspected:!!ticket,risks:asset.encumbrances>0?['Existing rights grants or options restrict title transfer']:[],source:'known registry facts'};
 const publicInfo=rivalIntelligence(s,c.id),debt=money(c.finance.loanBalance||0),trade=money(c.finance.payable||0);
 const conditions=!!ticket?{debt,unpaidBills:trade,cash:c.finance.cash,
  ownedIPs:s.ips.filter(i=>i.ownerId===c.id).map(x=>x.id),activeGrants:s.grants.filter(g=>g.grantorId===c.id||g.holderId===c.id).map(x=>x.id),
  activeProjects:s.projects.filter(p=>p.companyId===c.id&&p.status==='active').map(x=>x.id),source:'paid diligence — known'}:
  {debt:null,unpaidBills:null,cash:null,ownedIPs:null,activeGrants:null,activeProjects:null,source:'private — not yet inspected'};
 return {kind,targetId,publicInfo,conditions,inspected:!!ticket,quote:companyPurchaseQuote(s,c.id),
  risks:[...(c.bankrupt?['Insolvent owner: staff and rights remain, but operations require legitimate recapitalization']:[]),
   ...(debt>0&&ticket?['Existing bank principal and contract repayments survive']:[]),
   ...(trade>0&&ticket?['Unpaid supplier/creator obligations survive']:[])]};
}
function spendAcquisition(s,amount,financeWith='cash',creditLineId=null){
 const buyer=player(s),minCash=money(weeklyOverhead(buyer,s)*CFG.tuning_engine.minCash__001+CFG.tuning_engine.minCash__002),gap=money(Math.max(0,amount+minCash-buyer.finance.cash));
 if(gap>0){if(financeWith!=='line')throw new Error('Purchase would breach payroll or solvency reserve; choose a funded credit line or smaller deal.');
  const lineId=creditLineId||(s.creditLines||[]).find(l=>l.companyId===buyer.id&&creditLineStatus(s,l.id).available>=gap)?.id;
  if(!lineId||creditLineStatus(s,lineId).companyId!==buyer.id||creditLineStatus(s,lineId).available<gap)
   throw new Error('No valid external bank facility can cover the acquisition cash shortfall.');
  drawCreditLine(s,lineId,gap);
 }
 if(buyer.finance.cash<amount+minCash-CFG.tuning_engine.spendAcquisition__001)throw new Error('Company does not have a protected post-deal cash reserve.');
 return {borrowed:gap};
}
function acquireCompany(s,targetId,{price,financeWith='cash',creditLineId=null}={}){
 requireExecutiveControl(s);ensure42C(s);
 const quote=companyPurchaseQuote(s,targetId),bid=money(Number(price??quote.ask)),buyer=player(s),target=company(s,targetId),actualBook=acquisitionValue(target);
 if((s.coProductions||[]).some(d=>[d.producerId,d.sponsorId].includes(targetId)&&[d.producerId,d.sponsorId].some(id=>id!==targetId&&controlledCompanies(s).some(c=>c.id===id))))throw new Error('Existing funding partnership with this group requires separate elimination; this simplified acquisition is not available.');
 if(!Number.isFinite(Number(price??quote.ask))||bid<quote.ask||bid<actualBook||bid>CFG.tuning_engine.acquireCompany__001)
   throw new Error('Owners have not accepted a funded offer at or above the defensible book-value floor.');
 if(s.companies.filter(c=>c.parentId===buyer.id).length>=CFG.tuning_engine.acquireCompany__002)throw new Error('Maximum five controlled subsidiaries.');
 boardMandate(s,'expansion',bid);
 const financing=spendAcquisition(s,bid,financeWith,creditLineId);
 // The acquired company is NOT paid for its own shares; consideration goes to
 // the independent former shareholders. Its existing cash/debts stay inside it.
 const acquisition={id:id(s,'acquisition'),week:s.week,kind:'company',buyerId:buyer.id,targetId:target.id,
  price:bid,paidTo:'former independent shareholders',bookNetAssets:actualBook,
  preRevenue:target.finance.revenue,preExpense:target.finance.expense,
  preEquity:target.finance.equity,goodwill:money(bid-actualBook),borrowed:financing.borrowed};
 transact(s,buyer,'acquire-company-shares',{cash:-bid,investment:bid},'Purchased independent shares; target legal entity continues');
 target.parentId=buyer.id;target.investedCapital=bid;target.acquisition=acquisition;
 s.acquisitionHistory.push(acquisition);
 if(buyer.corporate)governanceEvent(s,buyer,'company-acquired',{subsidiaryId:target.id,price:bid});
 news(s,buyer.name+' acquires '+target.name,'The company changed shareholder control for '+shortMoney(bid)+'. All old staff, contracts, rights, liabilities and debt stayed with '+target.name+'.','deal');
 return acquisition;
}
function acquireAsset(s,{kind='ip',id:assetId,price,financeWith='cash',creditLineId=null}={}){
 requireExecutiveControl(s);ensure42C(s);
 const quote=assetPurchaseQuote(s,{type:kind,id:assetId}),bid=money(Number(price??quote.price));
 if(!quote.allowed)throw new Error('This asset is encumbered and cannot be transferred with a clean title under the current asset-deal terms.');
 if(!Number.isFinite(Number(price??quote.price))||bid<quote.price||bid>CFG.tuning_engine.acquireAsset__001)throw new Error('Seller did not agree to the purchase price.');
 const buyer=player(s),seller=company(s,quote.ownerId),asset=kind==='ip'?s.ips.find(x=>x.id===assetId):s.works.find(x=>x.id===assetId);
 if(seller.bankrupt&&seller.finance.cash<-CFG.tuning_engine.acquireAsset__002)throw new Error('Court-controlled bankruptcy asset sale unavailable.');
 boardMandate(s,'expansion',bid);const financing=spendAcquisition(s,bid,financeWith,creditLineId);
 // Conservative simplified accounting: acquired rights cost is recognized as
 // an expense, not an invented arbitrary carrying asset; no fictitious gain.
 transact(s,buyer,'purchased-ip-rights',{cash:-bid,expense:bid},'External source or completed-work rights purchase');
 transact(s,seller,'sold-ip-rights',{cash:bid,revenue:bid},'Rights sale to independently funded buyer');
 asset.ownerId=buyer.id;
 const record={id:id(s,'acquisition'),kind:'asset-'+kind,week:s.week,assetId,fromId:seller.id,toId:buyer.id,
  price:bid,borrowed:financing.borrowed,underlyingIpTransferred:kind==='ip',finishedWorkTransferred:kind==='work'};
 s.acquisitionHistory.push(record);
 news(s,buyer.name+' purchases '+quote.title,'The rights asset was purchased for '+shortMoney(bid)+'. Source-IP and finished-work ownership remain separately defined.','deal');
 return record;
}
function integrateAcquisition(s,childId,{choice='lean',capital=0}={}){
 requireExecutiveControl(s);ensure42C(s);
 const buyer=player(s),child=controlledCompanies(s).find(x=>x.id===childId&&x.parentId===buyer.id);
 if(!child)throw new Error('Only a legally controlled subsidiary may be integrated.');
 if(!['lean','supportive','recapitalize'].includes(choice))throw new Error('Unknown restructuring decision.');
 if(choice==='recapitalize'){
  const amount=money(Number(capital)),needed=money(Math.max(0,weeklyOverhead(child,s)*CFG.tuning_engine.needed__004+child.finance.payable-child.finance.cash));
  if(!Number.isFinite(Number(capital))||amount<Math.max(CFG.tuning_engine.integrateAcquisition__001,needed)||buyer.finance.cash<amount+CFG.tuning_engine.integrateAcquisition__002)throw new Error('Rescue must be real funded capital sufficient for documented cash obligations.');
  boardMandate(s,'expansion',amount);
  transact(s,buyer,'subsidiary-rescue-investment',{cash:-amount,investment:amount},'Additional paid-in equity; no phantom sales revenue');
  transact(s,child,'subsidiary-paid-in-capital',{cash:amount,equity:amount},'Owned subsidiary receives real parent capital');
  child.investedCapital=money(child.investedCapital+amount);
  if(child.bankrupt&&child.finance.cash>=child.finance.payable+weeklyOverhead(child,s)*CFG.tuning_engine.integrateAcquisition__003)child.bankrupt=false;
  if(buyer.corporate)governanceEvent(s,buyer,'subsidiary-recapitalized',{subsidiaryId:child.id,amount});
 }else {child.culture=choice;}
 const row={id:id(s,'integration'),week:s.week,childId,choice,capital:choice==='recapitalize'?money(capital):0,
  resultingCash:child.finance.cash,stillBankrupt:child.bankrupt};s.integrationHistory.push(row);
 news(s,'Group integration: '+child.name,choice==='recapitalize'?'Parent equity invested without eliminating any old debt.':'Company culture and recurring payroll policy changed; staff contracts and rights remain legally effective.','company');
 return row;
}