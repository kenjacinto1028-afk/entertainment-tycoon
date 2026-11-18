
function configureCommissionAuthority(s,policy={}){
  const maxFee=money(Number(policy.maxFee??s.commissionPolicy.maxFee));
  const minMargin=Number(policy.minMargin??s.commissionPolicy.minMargin);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(maxFee)||maxFee<CFG.tuning_engine.configureCommissionAuthority__001||maxFee>CFG.tuning_engine.configureCommissionAuthority__002||
     !Number.isFinite(minMargin)||minMargin<0||minMargin>CFG.tuning_engine.configureCommissionAuthority__003)
    throw new Error('Delegation requires an opt-in, bounded authority and minimum margin.');
  s.commissionPolicy={autoCounter:policy.autoCounter,maxFee,minMargin};return s.commissionPolicy;
}
// Partner co-financing is a legally distinct agreement from a paid client job.
// Sponsors reserve REAL cash as a prepaid asset. Work consumes this asset as
// project cost, not as fictitious producer income. The originating company
// retains its underlying IP; the counterparty buys participation only.
function coProductionQuote(s,data={}){
  const c=data.companyId?company(s,data.companyId):player(s),sector=data.sector||c?.sector,route=data.route||'original';
  if(!c||c.bankrupt||!SECTORS[sector]||!available(sector,s.week))throw new Error('Industry debut or capability unavailable for co-production.');
  if(!c.teams?.some(t=>!teamBusy(s,t.id)))throw new Error('Producer has no available qualified team to collaborate.');
  if(route==='adaptation'&&!canUseIp(s,c,data.ipId,sector).ok)throw new Error('Partner funding cannot bypass underlying adaptation rights.');
  if(!['original','adaptation'].includes(route))throw new Error('Client contracts cannot be converted to jointly owned IP.');
  const fraction=Number(data.capitalFraction??CFG.tuning_engine.fraction__001);
  if(![CFG.tuning_engine.coProductionQuote__001,CFG.tuning_engine.coProductionQuote__002,CFG.tuning_engine.coProductionQuote__003].includes(fraction))throw new Error('Choose a supported 20%, 30% or 40% cash-financing share.');
  const plan=previewProject(s,{...data,route,withForecast:false});
  const commitment=money(plan.grandTotal*fraction),revenueShare=money(fraction*CFG.tuning_engine.revenueShare__001);
  const partners=s.companies.filter(b=>b.id!==c.id&&!b.bankrupt&&!b.parentId&&!c.parentId&&b.capabilities[sector]&&(c.isPlayer||!b.isPlayer)&&b.teams?.some(t=>!teamBusy(s,t.id))&&b.finance.cash>=commitment+CFG.tuning_engine.partners__001)
    .sort((a,b)=>b.finance.cash-a.finance.cash).map(b=>({id:b.id,name:b.name,cash:b.finance.cash}));
  return {sector,route,capitalFraction:fraction,commitment,revenueShare,plannedTotal:plan.grandTotal,partners,
    ownership:'Producer keeps underlying IP and work; partner receives only contracted sales participation.'};
}
// A sponsor does not give up cash merely because a producer requests terms.
// Counteroffers are nonbinding until a matching offer is explicitly booked.
function configureCoProductionAuthority(s,policy={}){
  const amount=money(Number(policy.maxCommitment)),share=Number(policy.maxShare);
  if(typeof policy.autoCounter!=='boolean'||!Number.isFinite(amount)||amount<CFG.tuning_engine.configureCoProductionAuthority__001||amount>CFG.tuning_engine.configureCoProductionAuthority__002||
     !Number.isFinite(share)||share<CFG.tuning_engine.configureCoProductionAuthority__003||share>CFG.tuning_engine.configureCoProductionAuthority__004)throw new Error('Delegation needs bounded commitment and participation limits.');
  s.coProductionPolicy={autoCounter:policy.autoCounter,maxCommitment:amount,maxShare:share};
  return s.coProductionPolicy;
}
function proposeCoProduction(s,data={}){
  if(!data.companyId||data.companyId===s.playerId)requireExecutiveControl(s);
  const c=data.companyId?company(s,data.companyId):player(s),quote=coProductionQuote(s,data);
  const sponsor=quote.partners.find(x=>x.id===data.partnerId);
  if(!sponsor)throw new Error('A solvent independent co-producer with available team must be selected.');
  if(s.coProductionOffers.filter(x=>x.producerId===c.id&&x.status==='counter'&&s.week-x.createdWeek<=CFG.tuning_engine.proposeCoProduction__001).length>=CFG.tuning_engine.proposeCoProduction__002)
    throw new Error('Review earlier open financing counteroffers first.');
  const proposed=money(Number(data.participationShare??quote.revenueShare));
  if(!Number.isFinite(Number(data.participationShare??quote.revenueShare))||proposed<CFG.tuning_engine.proposeCoProduction__003||proposed>CFG.tuning_engine.proposeCoProduction__004)
    throw new Error('Co-production participation must be between 5% and 50%.');
  const partner=company(s,sponsor.id),plan=previewProject(s,{...data,route:quote.route,withForecast:false});
  // Terms depend on observable capital risk and partner reputation, not secret future sales.
  const minimum=money(clamp(quote.capitalFraction*CFG.tuning_engine.minimum__001+Math.max(0,CFG.tuning_engine.minimum__002-partner.reputation)*CFG.tuning_engine.minimum__003,CFG.tuning_engine.minimum__004,CFG.tuning_engine.minimum__005));
  const counter=proposed<minimum?minimum:null;
  const policy=s.coProductionPolicy;
  const delegated=counter!==null&&c.isPlayer&&policy.autoCounter&&quote.commitment<=policy.maxCommitment&&counter<=policy.maxShare;
  const accepted=counter===null||delegated;
  const row={id:id(s,'cooffer'),createdWeek:s.week,updatedWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.row__001,
    producerId:c.id,sponsorId:partner.id,sector:quote.sector,route:quote.route,
    title:String(data.title||'Untitled Project').trim().slice(0,CFG.tuning_engine.row__002)||'Untitled Project',
    genre:GENRES.includes(data.genre)?data.genre:'Fantasy',format:plan.format,size:plan.size,
    marketing:money(Number(data.marketing)||CFG.tuning_engine.row__003),productionRegion:plan.productionRegion,
    teamId:data.teamId||'auto',flagship:data.flagship||'no',
    ...pitchFrom(data),creativeTermsComplete:true,
    capitalFraction:quote.capitalFraction,commitment:quote.commitment,proposedShare:proposed,
    counterShare:counter,acceptedShare:accepted?(counter??proposed):null,
    status:accepted?'accepted':'counter',delegated,projectId:null};
  s.coProductionOffers.push(row);
  if(row.status==='counter'&&c.isPlayer)alert(s,'co-offer-'+row.id,CFG.events.messages.proposeCoProduction__001,
    partner.name+' requests '+Math.round(counter*CFG.tuning_engine.proposeCoProduction__005)+'% gross-sales participation to fund '+row.title+'. No money has moved.','advisory');
  return row;
}
function answerCoProductionOffer(s,offerId,accept){
  const row=s.coProductionOffers.find(x=>x.id===offerId);
  if(!row||row.producerId!==s.playerId||row.status!=='counter'||typeof accept!=='boolean'||s.week>row.expiresWeek)
    throw new Error('Only pending unexpired partner counteroffers can be accepted or declined.');
  if(accept){const q=coProductionQuote(s,{...row,companyId:row.producerId});
    if(!q.partners.some(x=>x.id===row.sponsorId))throw new Error('Partner cash or production team is no longer available.');
    row.status='accepted';row.acceptedShare=row.counterShare;
  }else row.status='declined';
  row.updatedWeek=s.week;const warning=s.inbox.find(a=>a.key==='co-offer-'+row.id);if(warning)warning.open=false;
  return row;
}
function startCoProduction(s,data={}){
  const quote=coProductionQuote(s,data),producer=data.companyId?company(s,data.companyId):player(s);
  const offer=data.offerId?s.coProductionOffers.find(o=>o.id===data.offerId):null;
  if(data.offerId){
    const plan=previewProject(s,{...data,route:quote.route,withForecast:false});
    if(!offer||offer.status!=='accepted'||s.week>offer.expiresWeek||offer.producerId!==producer.id||
      offer.sponsorId!==data.partnerId||offer.sector!==quote.sector||offer.route!==quote.route||
      offer.title!==(String(data.title||'').trim().slice(0,CFG.tuning_engine.startCoProduction__001)||'Untitled Project')||
      offer.genre!==(GENRES.includes(data.genre)?data.genre:'Fantasy')||offer.format!==plan.format||
      offer.size!==plan.size||offer.marketing!==money(Number(data.marketing)||CFG.tuning_engine.startCoProduction__002)||
      offer.productionRegion!==plan.productionRegion||offer.capitalFraction!==quote.capitalFraction||
      offer.commitment!==quote.commitment||offer.teamId!==(data.teamId||'auto')||
      (offer.creativeTermsComplete&&Object.entries(pitchFrom(offer)).some(([k,v])=>pitchFrom(data)[k]!==v)))
      throw new Error('Accepted partner offer is expired or does not match approved project terms.');
  }
  const sponsor=quote.partners.find(x=>x.id===data.partnerId);
  if(!sponsor)throw new Error('An independent, solvent, funded partner must agree to the project.');
  // Validate required rights, team, cash and proposal before placing sponsor
  // funds at risk. createProject is the only authorized production gateway.
  const plan=previewProject(s,{...data,route:quote.route,withForecast:false});
  if(producer.finance.cash<money(plan.grandTotal*CFG.tuning_engine.startCoProduction__003)+CFG.tuning_engine.startCoProduction__004)throw new Error('Producer lacks the required project launch reserve.');
  const {offerId:_financeOfferId,...projectData}=data;
  // A real independent specialist partner can supply a missing capability for
  // this one project, not permanently unlock an entire sector or global debut.
  const entryThroughPartner=!producer.capabilities[quote.sector];
  let p;
  if(entryThroughPartner)producer.capabilities[quote.sector]='internal';
  try{p=createProject(s,{...projectData,companyId:producer.id,route:quote.route});}
  finally{if(entryThroughPartner)delete producer.capabilities[quote.sector];}
  if(entryThroughPartner){p.sponsoredSectorEntry=true;p.sectorEntrySponsorId=sponsor.id;}
  const investor=company(s,sponsor.id),partnerTeam=selectTeam(s,investor,'auto',p.genre);
  if(!partnerTeam)throw new Error('Co-producer has no available real production team.');
  transact(s,investor,'cofinance-reserve',{cash:-quote.commitment,prepaid:quote.commitment},'Reserved production capital: '+p.title,p.id);
  const agreement={id:id(s,'cofinance'),projectId:p.id,producerId:producer.id,sponsorId:investor.id,
    signedWeek:s.week,sector:p.sector,partnerTeamId:partnerTeam.id,commitment:quote.commitment,capitalFraction:quote.capitalFraction,
    revenueShare:offer?offer.acceptedShare:quote.revenueShare,offerId:offer?.id||null,held:quote.commitment,spent:0,refunded:0,shareAccrued:0,sharePaid:0,
    status:'active',closedWeek:null};
  s.coProductions.push(agreement);p.coProductionId=agreement.id;p.partnerSpend=0;p.partnerShareCost=0;
  if(offer){offer.status='booked';offer.projectId=p.id;offer.updatedWeek=s.week;}
  p.quality=Math.min(CFG.tuning_engine.startCoProduction__005,p.quality+(partnerTeam.specialty===p.genre?CFG.tuning_engine.startCoProduction__006:1));
  news(s,'Co-production greenlit: '+p.title,investor.name+' reserved '+shortMoney(quote.commitment)+' in actual production funding for contractual gross-sales participation. Underlying rights remain unchanged.','deal');
  return p;
}