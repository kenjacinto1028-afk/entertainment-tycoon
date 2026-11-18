
function refundPartnerReserve(s,p,status){
  if(!p.coProductionId)return;
  const d=s.coProductions.find(d=>d.id===p.coProductionId),b=d&&company(s,d.sponsorId);
  if(!d||!b||d.status!=='active')throw new Error('Co-production agreement is missing or already closed.');
  if(d.held>0){transact(s,b,'cofinance-unused-refund',{cash:d.held,prepaid:-d.held},'Unspent sponsor capital returned: '+p.title,p.id);d.refunded=money(d.refunded+d.held);d.held=0;}
  d.status=status;d.closedWeek=s.week;
}
function settlePartnerShare(s,p,gross){
  if(!p.coProductionId||gross<=0)return;
  const d=s.coProductions.find(d=>d.id===p.coProductionId),c=company(s,p.companyId);
  if(!d||d.producerId!==p.companyId||!c)throw new Error('Invalid co-production revenue claim.');
  const owed=money(gross*d.revenueShare);
  if(owed<=0)return;
  transact(s,c,'cofinance-participation-accrued',{payable:owed,expense:owed},'Contractual partner share of actual sales: '+p.title,p.id);
  d.shareAccrued=money(d.shareAccrued+owed);p.partnerShareCost=money((p.partnerShareCost||0)+owed);
}
function settlePartnerReceipts(s){
  for(const d of s.coProductions||[]){
    const producer=company(s,d.producerId),sponsor=company(s,d.sponsorId);
    if(!producer||!sponsor)continue;
    const owed=money(d.shareAccrued-d.sharePaid),cash=Math.max(0,producer.finance.cash);
    const paid=money(Math.min(owed,cash,producer.finance.payable));
    if(paid<=0)continue;
    transact(s,producer,'cofinance-participation-payment',{cash:-paid,payable:-paid},'Partner sales participation settled',d.projectId);
    revenue(s,sponsor,paid,'cofinance-participation-receipt','Partner sales participation received',d.projectId);
    d.sharePaid=money(d.sharePaid+paid);
  }
}
function coProductionStatement(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company.');
  const deals=(s.coProductions||[]).filter(d=>d.producerId===companyId||d.sponsorId===companyId).map(d=>{
    const p=s.projects.find(p=>p.id===d.projectId);
    return {...d,title:p?.title||'Unidentified production',role:d.producerId===companyId?'producer':'sponsor',
      partnerName:company(s,d.producerId===companyId?d.sponsorId:d.producerId)?.name||'Unknown',
      agreementType:d.offerId?'negotiated':'standard',
      unpaid:money(d.shareAccrued-d.sharePaid)};
  });
  return {companyId,deals,committed:money(deals.reduce((v,d)=>v+d.commitment,0)),
    spent:money(deals.reduce((v,d)=>v+d.spent,0)),reserved:money(deals.reduce((v,d)=>v+d.held,0)),
    unpaid:money(deals.reduce((v,d)=>v+d.unpaid,0))};
}
// An optional read-only strategic comparison. A license scenario is an
// *indicative* third-party deal, not a guaranteed offer, asset transfer, or sale.
function investmentComparison(s,data={}){
  const c=data.companyId?company(s,data.companyId):player(s),sector=data.sector||c?.sector;
  if(!c||!SECTORS[sector])throw new Error('Unknown company or sector for investment comparison.');
  const legal=available(sector,s.week),access=legal&&!!c.capabilities[sector];
  const full={sector,route:data.route==='adaptation'?'adaptation':'original',...data,companyId:c.id};
  const rights=full.route!=='adaptation'||canUseIp(s,c,full.ipId,sector).ok;
  const valid=legal&&rights;
  const plan=valid?previewProject(s,full):null;
  const fore=plan?.forecast||null;
  const noSales=money(c.finance.cash);
  function caseOut(id,label,allowed,scenarios,cashRisk,note,extra={}){
    return {id,label,available:!!allowed,scenario:scenarios||{},noSalesCashFloor:cashRisk??noSales,
      downsideWarning:cashRisk!==null&&cashRisk<0?'Potential cash shortfall before new receipts.':null,
      note,...extra};
  }
  const solo=caseOut('produce','Produce internally',access&&rights,fore?.scenario,
    fore?.noSalesCashFloor??null,access?'Keep sales upside but fund production and staff.':'Requires effective rights, sector debut and company production capability.');
  let partner=null;
  if(valid){try{const q=coProductionQuote(s,full);if(q.partners.length)partner=q;}catch(e){/* no qualified sponsor */}}
  const quote=partner;
  const coCases={};
  if(quote&&fore)for(const key of ['conservative','expected','optimistic']){
    const f=fore.scenario[key];
    coCases[key]={gross:f.gross,revenue:money(f.revenue-f.gross*quote.revenueShare),
      directContribution:money(f.directContribution+quote.commitment-f.gross*quote.revenueShare)};
  }
  // Neither the royalty rate nor the fee below grants a right or moves cash.
  const ip=s.ips.find(x=>x.id===full.ipId),canLicense=valid&&full.route==='adaptation'&&ip&&ip.ownerId===c.id&&s.companies.some(x=>x.id!==c.id&&!x.bankrupt&&x.capabilities[sector]);
  const hypotheticalFee=plan?money(plan.grandTotal*CFG.tuning_engine.hypotheticalFee__001):0;
  const licensing={};
  if(canLicense&&fore)for(const [key,ratio] of [['conservative',CFG.tuning_engine.investmentComparison__001],['expected',1],['optimistic',CFG.tuning_engine.investmentComparison__002]]){
    const f=fore.scenario[key];const revenue=money(hypotheticalFee*ratio+f.gross*CFG.tuning_engine.revenue__001*ratio);
    licensing[key]={gross:0,revenue,directContribution:revenue};
  }
  const lis=caseOut('license','License rights to another studio',canLicense,licensing,noSales,
    canLicense?'Indicative fee and royalty ranges only: a funded buyer must independently consent.':'Requires an existing owned IP, free applicable rights and a legally eligible funded licensee.',
    {indicativeFee:hypotheticalFee});
  const cop=caseOut('co-produce','Partner-funded co-production',!!quote,coCases,
    quote&&fore?money(fore.noSalesCashFloor+quote.commitment):null,
    quote?'Sponsor supplies real money and a team but receives a share of actual gross sales.':'No independent solvent and staffed co-producer presently available.',
    {funding:quote?.commitment||0,participationShare:quote?.revenueShare||0,partners:quote?.partners.length||0});
  const wait=caseOut('wait','Wait and preserve liquidity',true,{},noSales,
    'No immediate investment, return, guaranteed future opportunity, or rights transfer.');
  return {sector,estimatedWeek:s.week,basis:'Imperfect 13-week illustration, not guaranteed prices, bids, or outcomes. Scenarios share one finite audience wallet.',
    choices:[solo,lis,cop,wait]};
}

// An independent firm offers a true price, or an unfunded/overpriced proposal
// gets a counter. Merely signing reserves no cash; the signed job draws real
// prepayment and escrow ONLY at greenlight, once a team is available.
function requestCommission(s,data={}){
  requireExecutiveControl(s);const c=player(s),sector=data.sector||c.sector;
  if(!SECTORS[sector]||!available(sector,s.week)||!c.capabilities[sector])throw new Error('Industry capability or worldwide debut unavailable.');
  const title=String(data.title||'').trim().slice(0,CFG.tuning_engine.title__001);
  if(!title)throw new Error('Commission title is required.');
  const plan=previewProject(s,{...data,sector,route:'contract',clientId:'auto',withForecast:false});
  const client=company(s,data.clientId);
  if(!client||client.id===c.id||client.bankrupt||client.parentId||c.parentId||
     !eligibleClients(s,plan.contractFee,c.id).some(x=>x.id===client.id))throw new Error('No sufficiently funded independent client is available.');
  const fee=money(Number(data.fee??plan.contractFee));
  if(!Number.isFinite(Number(data.fee??plan.contractFee))||fee<CFG.tuning_engine.requestCommission__001||fee>CFG.tuning_engine.requestCommission__002)throw new Error('Invalid service fee proposal.');
  const trust=counterpartyTrust(s,client.id,c.id);
  const willingness=money(Math.min(client.finance.cash-CFG.tuning_engine.willingness__001,plan.contractFee*CFG.tuning_engine.willingness__002*trust.confidence));
  const agreed=fee<=willingness;
  const counter=agreed?null:money(Math.min(client.finance.cash-CFG.tuning_engine.counter__001,plan.contractFee*CFG.tuning_engine.counter__002*trust.confidence));
  if(!agreed&&counter<plan.grandTotal*CFG.tuning_engine.requestCommission__003)throw new Error('Client cannot support an economically viable fee.');
  const delegated=!agreed&&s.commissionPolicy.autoCounter&&fee<=s.commissionPolicy.maxFee&&counter<=s.commissionPolicy.maxFee&&counter>=plan.grandTotal*(1+s.commissionPolicy.minMargin);
  const row={id:id(s,'clientoffer'),clientId:client.id,producerId:c.id,sector,title,
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||CFG.tuning_engine.row__004),productionRegion:plan.productionRegion,
    proposedFee:fee,baseCost:plan.grandTotal,counterFee:counter,
    acceptedFee:agreed?fee:delegated?counter:null,
    status:agreed||delegated?'accepted':'counter',createdWeek:s.week,updatedWeek:s.week,projectId:null,
    delegated:!!delegated};
  s.commissionOffers.push(row);
  if(row.status==='counter')alert(s,'commission-counter-'+row.id,CFG.events.messages.requestCommission__001,
    client.name+' countered the proposed '+sector+' service fee. Review the Productions hub; no funds have moved.','advisory');
  return row;
}
function answerCommissionOffer(s,offerId,accept){
  const row=s.commissionOffers.find(o=>o.id===offerId);
  if(!row||row.producerId!==s.playerId||row.status!=='counter'||typeof accept!=='boolean')throw new Error('Only pending client counteroffers can be accepted or declined.');
  if(accept){const client=company(s,row.clientId);if(!client||client.bankrupt||client.finance.cash<row.counterFee+CFG.tuning_engine.answerCommissionOffer__001)throw new Error('Client lacks funds for this counteroffer.');
    row.status='accepted';row.acceptedFee=row.counterFee;
  }else row.status='declined';
  row.updatedWeek=s.week;const warning=s.inbox.find(a=>a.key==='commission-counter-'+row.id);if(warning)warning.open=false;
  return row;
}
function cancelProject(s,projectId){
  const p=s.projects.find(x=>x.id===projectId);
  if(!p||p.companyId!==s.playerId||p.status!=='active')throw new Error('Only an active, player-controlled project may be cancelled.');
  if(p.coProductionId)refundPartnerReserve(s,p,'cancelled');
  if(p.route==='contract'){
    const e=s.escrows.find(x=>x.id===p.escrowId),buyer=e&&company(s,e.buyerId),seller=company(s,p.companyId);
    if(!e||e.settled||!buyer||!seller)throw new Error('Funded commission agreement is missing.');
    // Nonrefundable 30% advance compensates actual work begun. Remaining 70%
    // stays outside studio cash and returns to the client without creating cash.
    const earned=money(e.advance+(e.milestonePaid||0));
    transact(s,buyer,'client-cancellation',{cash:e.held,prepaid:-e.fee,expense:earned},'Protected client funds returned; earned milestones retained',p.id);
    transact(s,seller,'service-cancellation',{deferred:-earned,revenue:earned},'Earned advance and completed service milestone',p.id);
    p.directRevenue=money(p.directRevenue+earned);
    e.held=0;e.settled=true;e.cancelled=true;e.closedWeek=s.week;
    recordCommissionOutcome(s,p,'cancelled');
  }
  releaseProjectSpecialist(s,p);
  if((p.sector==='movie'&&p.cinema?.castActorId)||(p.sector==='tv'&&p.television?.castActorId)){const actor=(s.filmActors||[]).find(a=>a.id===(p.cinema?.castActorId||p.television?.castActorId));if(actor?.busyProjectId===p.id)actor.busyProjectId=null;}
  p.status='cancelled';p.cancelledWeek=s.week;
  news(s,'Project cancelled: '+p.title,CFG.events.messages.cancelProject__001,'production');
  return p;
}