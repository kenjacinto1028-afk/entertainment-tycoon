
function gamePublisherQuote43(s,projectId,publisherId){
 const p=s.projects.find(p=>p.id===projectId),c=p&&company(s,p.companyId),pub=company(s,publisherId);
 if(!p||!c||!pub||p.sector!=='games'||p.status!=='active'||p.route==='contract'||pub.id===c.id||pub.parentId===c.id||c.parentId===pub.id||!pub.capabilities.games||pub.bankrupt||!available('games',s.week))throw new Error('Choose an active authorized game and an independent publisher.');
 const advance=money(Math.min(CFG.tuning_engine.advance__003,Math.max(CFG.tuning_engine.advance__004,p.budget*CFG.tuning_engine.advance__005))),share=CFG.tuning_engine.share__001;
 const willing=pub.finance.cash>=advance+weeklyOverhead(pub,s)*CFG.tuning_engine.willing__001&&
   p.quality>=CFG.tuning_engine.willing__002&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.endWeek>s.week+CFG.tuning_engine.willing__003));
 return {projectId,publisherId,advance,share,termWeeks:CFG.tuning_engine.gamePublisherQuote43__001,willAccept:willing,
  conditions:'Funds paid up front as unearned development advance; share of real post-release customer receipts only. No IP sale.'};
}
function signGamePublisher43(s,projectId,publisherId){
 requireExecutiveControl(s);ensure43C(s);const q=gamePublisherQuote43(s,projectId,publisherId),p=s.projects.find(p=>p.id===projectId);
 if(p.companyId!==s.playerId)throw new Error('Only an authorized producing studio may approve this deal.');
 if(!q.willAccept)throw new Error('Independent publisher declined due to funds or rights risk.');
 if(s.gamePublisherDeals43.some(d=>d.projectId===p.id&&['active','delivered'].includes(d.status)))throw new Error('A publishing advance is already funding this game.');
 const pub=company(s,publisherId),studio=company(s,p.companyId);
 transact(s,pub,'game-publisher-advance',{cash:-q.advance,prepaid:q.advance},'Prepaid independent game publishing partnership',p.id);
 transact(s,studio,'game-publisher-advance',{cash:q.advance,deferred:q.advance},'Unearned publisher production advance',p.id);
 const d={id:id(s,'gamepublisher43'),projectId:p.id,publisherId,studioId:studio.id,signedWeek:s.week,advance:q.advance,
  share:q.share,termWeeks:q.termWeeks,status:'active',deliveredWeek:null,royaltyAccrued:0,royaltyPaid:0,royaltyOpen:0,paidAdvance:false};
 s.gamePublisherDeals43.push(d);p.gamePublisherDeal43=d.id;
 news(s,'Game funding signed: '+p.title,pub.name+' supplied a real cash publishing advance; studio IP ownership is unchanged.','deal');
 return d;
}
function gamePublisherSale43(s,p,gross){
 if(!p.gamePublisherDeal43||gross<=0)return;
 const d=s.gamePublisherDeals43?.find(x=>x.id===p.gamePublisherDeal43);
 if(!d||d.status!=='delivered'||s.week<d.deliveredWeek||s.week>=d.deliveredWeek+d.termWeeks)return;
 const due=money(gross*d.share);if(due<=0)return;
 const studio=company(s,d.studioId),publisher=company(s,d.publisherId);
 transact(s,studio,'game-publisher-share',{payable:due,expense:due},'Contracted share of external game sales: '+p.title,p.id);
 transact(s,publisher,'game-publisher-receivable',{receivable:due,revenue:due},'Game distribution service participation: '+p.title,p.id);
 d.royaltyAccrued=money(d.royaltyAccrued+due);d.royaltyOpen=money(d.royaltyOpen+due);
 p.directCost=money(p.directCost+due);
}
function gamePublisherWeek43(s){ensure43C(s);
 for(const d of s.gamePublisherDeals43){const p=s.projects.find(p=>p.id===d.projectId),studio=company(s,d.studioId),pub=company(s,d.publisherId);
  if(!p||!studio||!pub)continue;
  if(d.status==='active'&&p.status==='released'){
   transact(s,studio,'game-publisher-delivery',{deferred:-d.advance,revenue:d.advance},'Earn publisher advance on actual delivered game',p.id);
   transact(s,pub,'game-publisher-delivery',{prepaid:-d.advance,expense:d.advance},'Publisher prepaid game content delivered',p.id);
   p.directRevenue=money(p.directRevenue+d.advance);d.status='delivered';d.deliveredWeek=s.week;d.paidAdvance=true;
  }
  if(d.status==='active'&&p.status==='cancelled'){
   const refund=money(Math.min(studio.finance.cash,d.advance)),owed=money(d.advance-refund);
   transact(s,studio,'game-publisher-refund',{cash:-refund,deferred:-d.advance,payable:owed},'Return unearned cancelled publishing advance',p.id);
   transact(s,pub,'game-publisher-refund',{cash:refund,prepaid:-d.advance,receivable:owed},'Publisher refund and collectible cancellation claim',p.id);
   d.status='cancelled';d.refundOutstanding=owed;
  }
  if(d.royaltyOpen>0){
   const availableCash=Math.max(0,studio.finance.cash-weeklyOverhead(studio,s)*CFG.tuning_engine.availableCash__001);
   const paid=money(Math.min(d.royaltyOpen,availableCash));
   if(paid>0){transact(s,studio,'game-publisher-settlement',{cash:-paid,payable:-paid},'Pay accrued game publisher revenue share',p.id);
    transact(s,pub,'game-publisher-collection',{cash:paid,receivable:-paid},'Receive previously earned game publisher royalty',p.id);
    d.royaltyPaid=money(d.royaltyPaid+paid);d.royaltyOpen=money(d.royaltyOpen-paid);
   }
  }
  if(d.refundOutstanding>0){const payable=money(Math.min(d.refundOutstanding,Math.max(0,studio.finance.cash-weeklyOverhead(studio,s)*CFG.tuning_engine.payable__002)));
   if(payable>0){transact(s,studio,'game-publisher-refund-pay',{cash:-payable,payable:-payable},'Pay preserved publisher refund claim',p.id);
    transact(s,pub,'game-publisher-refund-receipt',{cash:payable,receivable:-payable},'Collect preserved publisher cancellation claim',p.id);
    d.refundOutstanding=money(d.refundOutstanding-payable);}
  }
 }
}
function gamePublisherReport43(s,projectId){ensure43C(s);return s.gamePublisherDeals43.filter(d=>d.projectId===projectId).map(x=>({...x}));}
function technologyOffer43(s,sellerId,sector){
 requireExecutiveControl(s);ensure43C(s);
 const seller=company(s,sellerId),buyer=player(s);
 if(!seller||seller.id===buyer.id||seller.bankrupt||seller.parentId===buyer.id||!SECTORS[sector]||!available(sector,s.week)||!buyer.capabilities[sector])throw new Error('Technology trade requires debuted sector and independent owner.');
 const tech=seller.research?.[sector],mine=buyer.research?.[sector];
 if(!tech||tech.level<1||tech.wave<1||mine?.wave===tech.wave&&mine.level>=tech.level)throw new Error('Seller has no better transferable company-owned R&D to offer.');
 const price=money(CFG.tuning_engine.price__008+tech.level*CFG.tuning_engine.price__009),willing=seller.finance.cash<weeklyOverhead(seller,s)*CFG.tuning_engine.willing__004||
  (hash(s.seed+':tech-willing:'+seller.id+':'+sector+':'+yearAt(s.week))%CFG.tuning_engine.willing__005!==0);
 const rec={id:id(s,'techOffer43'),sellerId,buyerId:buyer.id,sector,price,level:tech.level,wave:tech.wave,
  createdWeek:s.week,expiresWeek:s.week+CFG.tuning_engine.rec__002,status:willing?'accepted':'declined',sellerConsent:willing};
 s.technologyOffers43.push(rec);return rec;
}
function acquireTechnology43(s,offerId){
 requireExecutiveControl(s);ensure43C(s);
 const o=s.technologyOffers43.find(x=>x.id===offerId),buyer=player(s);
 if(!o||o.buyerId!==buyer.id||o.status!=='accepted'||!o.sellerConsent||o.expiresWeek<s.week)throw new Error('No current willing technology owner has accepted this transaction.');
 const seller=company(s,o.sellerId),old=seller?.research?.[o.sector],mine=buyer.research?.[o.sector];
 if(!seller||!old||old.level<o.level||old.wave!==o.wave||!buyer.capabilities[o.sector]||!available(o.sector,s.week))throw new Error('Technology ownership or current capability changed.');
 if(buyer.finance.cash<o.price+CFG.tuning_engine.acquireTechnology43__001)throw new Error('Insufficient funds to acquire technology while retaining payroll cash.');
 expense(s,buyer,o.price,'acquired-research','Purchased transferable R&D intellectual property from '+seller.name);
 revenue(s,seller,o.price,'technology-sale','Sold proprietary research know-how to '+buyer.name);
 seller.researchHistory43 ||= [];seller.researchHistory43.push({...old,transferredWeek:s.week,toId:buyer.id});
 seller.research[o.sector]={...old,spent:0,level:0,acquiredLevel:0,transferredAway:true};
 const sourceBoost=(mine?.wave===o.wave?mine.level:0),level=Math.max(sourceBoost,o.level);
 buyer.research[o.sector]={spent:mine?.wave===o.wave?(mine.spent||0):0,level,acquiredLevel:o.level,wave:o.wave,updatedWeek:s.week,acquiredFrom:seller.id};
 const rec={id:id(s,'techTrade43'),offerId,week:s.week,sector:o.sector,price:o.price,buyerId:buyer.id,sellerId:seller.id,wave:o.wave,level:o.level};
 s.technologyTrades43.push(rec);o.status='booked';
 news(s,buyer.name+' acquires '+SECTORS[o.sector].name+' R&D',seller.name+' sold actual proprietary know-how. Research history is preserved; tool vendors and source IP remain distinct.','deal');
 return rec;
}
function rivalResearch43(s){
 if(s.week%CFG.tuning_engine.rivalResearch43__001!==0)return;
 for(const c of s.companies){if(c.isPlayer||c.parentId||c.bankrupt||c.aiPlan?.goal!=='technology'||!available(c.sector,s.week))continue;
  const wave=technologyReport(s)[c.sector]?.wave||0;
  if(!wave||c.finance.cash<weeklyOverhead(c,s)*CFG.tuning_engine.rivalResearch43__002+CFG.tuning_engine.rivalResearch43__003)continue;
  const old=c.research?.[c.sector],spent=money((old?.wave===wave?old.spent:0)+CFG.tuning_engine.spent__001);
  expense(s,c,CFG.tuning_engine.rivalResearch43__004,'rival-proprietary-research','Independent rival funds genuine research capacity');
  c.research[c.sector]={spent,wave,level:Math.min(CFG.tuning_engine.rivalResearch43__005,Math.floor(spent/CFG.tuning_engine.rivalResearch43__006)),updatedWeek:s.week};
 }
}
function audit43C(s,problems){ensure43C(s);
 for(const g of s.grants.filter(g=>g.territories43)){
  if(!Array.isArray(g.territories43)||!g.territories43.length||new Set(g.territories43).size!==g.territories43.length||g.territories43.some(r=>!REGIONS.some(x=>x.name===r)))problems.push('Invalid scoped rights territories');
  const ip=s.ips.find(x=>x.id===g.ipId);
  if(!ip||!validGrantor43(s,g,ip))problems.push('Unauthorized licensed owner or sublicensing scope');
 }
 for(const p of s.projects.filter(p=>p.territories43))if(!p.territories43.length||p.territories43.some(x=>!REGIONS.some(r=>r.name===x)))problems.push('Invalid title release territory');
 for(const d of s.gamePublisherDeals43){const p=s.projects.find(x=>x.id===d.projectId),studio=company(s,d.studioId),pub=company(s,d.publisherId);
  if(!p||p.sector!=='games'||!pub||!studio||p.companyId!==studio.id||p.gamePublisherDeal43!==d.id||d.signedWeek>s.week||
   !['active','delivered','cancelled'].includes(d.status)||d.royaltyAccrued<0||d.royaltyPaid<0||d.royaltyOpen<0||
   Math.abs(money(d.royaltyAccrued-d.royaltyPaid-d.royaltyOpen))>CFG.tuning_engine.audit43C__001||
   (d.status==='active'&&p.status!=='active')||d.status==='delivered'&&p.status!=='released')problems.push('Invalid independent game publishing funding / receipts');
 }
 for(const t of s.technologyTrades43){const seller=company(s,t.sellerId),buyer=company(s,t.buyerId);
  if(!seller||!buyer||t.week>s.week||t.price<CFG.tuning_engine.audit43C__002||!s.technologyOffers43.some(o=>o.id===t.offerId&&o.status==='booked')||
   !seller.researchHistory43?.some(h=>h.toId===buyer.id&&h.transferredWeek===t.week&&h.level>=t.level))problems.push('Technology trade missing genuine funded seller provenance');
 }
}