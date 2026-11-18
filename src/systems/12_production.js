
// Inventoried print editions are physical units. Digital/serial rights are not
// silently invented; older releases migrated from v8 retain their old sales model.
function isPrintEdition(p){return p.sector==='publishing'&&p.route!=='contract'&&['Novel','Nonfiction','Comic / Manga'].includes(p.format);}
function initPrintEdition(s,p){
  if(!isPrintEdition(p)||p.printStock)return;
  const comic=p.format==='Comic / Manga';
  p.printStock={stock:0,printed:0,sold:0,returned:0,writtenOff:0,unitCost:comic?CFG.tuning_engine.initPrintEdition__001:CFG.tuning_engine.initPrintEdition__002,price:comic?CFG.tuning_engine.initPrintEdition__003:CFG.tuning_engine.initPrintEdition__004,
    printSpend:0,cogs:0,returnsCost:0,writeOffCost:0,lastOrderWeek:-1,autoReprint:true,returnQueue:[],returnFraction:0,demandEwma:0,closed:false,historyComplete:true};
  const c=company(s,p.companyId),ideal=Math.round(CFG.tuning_engine.ideal__001*p.size);
  const affordable=Math.floor(Math.max(0,c.finance.cash-weeklyOverhead(c,s)*CFG.tuning_engine.affordable__001)/p.printStock.unitCost);
  const quantity=Math.max(0,Math.min(ideal,affordable));
  if(quantity>=CFG.tuning_engine.initPrintEdition__005)buyPrintRun(s,p,quantity,true);
  else if(c.isPlayer)alert(s,'initial-print-'+p.id,CFG.events.messages.initPrintEdition__001,p.title+' has no initial print stock. Budget for copies in Productions before expecting sales.','advisory');
}
function buyPrintRun(s,p,quantity,initial=false){
  if(!p.printStock||p.status!=='released'||p.printStock.closed||s.week-p.releaseWeek>=CFG.tuning_engine.buyPrintRun__001||!printRightsActive(s,p))throw new Error('This edition is not currently eligible for printing.');
  const q=Number(quantity),c=company(s,p.companyId),book=p.printStock;
  if(!Number.isInteger(q)||q<CFG.tuning_engine.buyPrintRun__002||q>CFG.tuning_engine.buyPrintRun__003)throw new Error('Choose 50 to 10,000 physical copies.');
  const cost=money(q*book.unitCost),buffer=weeklyOverhead(c,s)*CFG.tuning_engine.buffer__001;
  if(c.bankrupt||c.finance.cash<cost+buffer)throw new Error('Print order would use cash reserved for four weeks of studio overhead.');
  transact(s,c,'print-inventory-purchase',{cash:-cost,inventory:cost},(initial?'Opening print run: ':'Additional print run: ')+p.title,p.id);
  book.stock+=q;book.printed+=q;book.printSpend=money(book.printSpend+cost);book.lastOrderWeek=s.week;
  return {copies:q,cost,stock:book.stock};
}
function printRightsActive(s,p){
  if(!p.grantId)return true;
  return s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=s.week&&g.endWeek+(g.continuationWeeks||0)>s.week);
}
function orderPrintRun(s,projectId,quantity){
  const p=s.projects.find(p=>p.id===projectId);
  if(!p||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('You cannot fund an unrelated publisher.');
  if(!printRightsActive(s,p))throw new Error('Distribution license does not allow this print order.');
  return buyPrintRun(s,p,quantity);
}
function setPrintPolicy(s,projectId,enabled){
  const p=s.projects.find(p=>p.id===projectId);
  if(!p||!p.printStock||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('Printed edition is not managed by this company.');
  p.printStock.autoReprint=enabled===true;
  return p.printStock.autoReprint;
}
function autoReplenishPrint(s){
  for(const p of s.projects) {
    const b=p.printStock;if(!b||!b.autoReprint||b.closed||p.status!=='released')continue;
    const age=s.week-p.releaseWeek;
    if(age<0||age>=CFG.tuning_engine.autoReplenishPrint__001||!printRightsActive(s,p))continue;
    // Replenish against OBSERVED reader demand, not an arbitrary perpetual
    // fixed stock target. Slow backlist works must not trap cash in reprints.
    const observed=b.demandEwma||0;
    if(observed<CFG.tuning_engine.autoReplenishPrint__002||b.lastOrderWeek>=s.week)continue;
    const target=Math.min(CFG.tuning_engine.target__001,Math.max(CFG.tuning_engine.target__002,Math.ceil(observed*CFG.tuning_engine.target__003)));
    if(b.stock>=target*CFG.tuning_engine.autoReplenishPrint__003)continue;
    const c=company(s,p.companyId);if(!c||c.bankrupt)continue;
    const qty=Math.min(CFG.tuning_engine.qty__001,Math.ceil(Math.max(CFG.tuning_engine.qty__002,target-b.stock)/CFG.tuning_engine.qty__003)*CFG.tuning_engine.qty__004);
    const affordable=Math.floor((c.finance.cash-weeklyOverhead(c,s)*CFG.tuning_engine.affordable__002)/b.unitCost/CFG.tuning_engine.affordable__003)*CFG.tuning_engine.affordable__004;
    if(affordable<CFG.tuning_engine.autoReplenishPrint__004){
      if(c.isPlayer&&b.stock===0&&age<CFG.tuning_engine.autoReplenishPrint__005)alert(s,'print-stock-'+p.id,CFG.events.messages.autoReplenishPrint__001,p.title+' cannot meet more orders until there is cash for another print run. Reprinting is delegated when affordable.','advisory');
      continue;
    }
    buyPrintRun(s,p,Math.min(CFG.tuning_engine.autoReplenishPrint__006,qty,affordable));
  }
}
function disposePrintStock(s,p,quantity){
  const b=p.printStock,c=company(s,p.companyId),q=Number(quantity);
  if(!b||!Number.isInteger(q)||q<1||q>b.stock)throw new Error('Cannot write off more copies than are in stock.');
  const value=money(q*b.unitCost);
  transact(s,c,'print-stock-writeoff',{inventory:-value,expense:value},'Unsold or damaged stock written off: '+p.title,p.id);
  b.stock-=q;b.writtenOff+=q;b.writeOffCost=money(b.writeOffCost+value);
  p.directCost=money(p.directCost+value);
  return {copies:q,expense:value,stock:b.stock};
}
function writeOffPrintStock(s,projectId,quantity){
  const p=s.projects.find(x=>x.id===projectId);
  if(!p||!controlledCompanies(s).some(c=>c.id===p.companyId))throw new Error('Cannot dispose stock owned by another firm.');
  return disposePrintStock(s,p,quantity);
}
function settlePrintReturns(s,p,units){
  const b=p.printStock,c=company(s,p.companyId),q=Math.min(units,b.sold-b.returned);
  if(q<1)return;
  const refund=money(q*b.price),cost=money(q*b.unitCost);
  const paid=money(Math.min(refund,Math.max(0,c.finance.cash)));
  // Returns reverse the original external sale and restore undamaged stock.
  // Distribution fees and previously paid contractual royalties are not
  // silently clawed back. Unpaid refunds become actual generic payables.
  transact(s,c,'print-retail-return',{cash:-paid,payable:money(refund-paid),inventory:cost,revenue:-refund,expense:-cost},
    q+' retail copies returned: '+p.title,p.id);
  b.stock+=q;b.returned+=q;b.cogs=money(b.cogs-cost);
  b.refunded=money((b.refunded||0)+refund);
  p.directRevenue=money(p.directRevenue-refund);p.directCost=money(p.directCost-cost);
  p.stats.totalSales=money(p.stats.totalSales-refund);p.stats.weeklySales=money(p.stats.weeklySales-refund);
}
function settlePrintLifecycle(s){
  for(const p of s.projects){
    const b=p.printStock;if(!b||p.status!=='released')continue;
    const fresh=p.stats.weeklyPrintUnits||0;
    if(fresh){
      const fractional=fresh*CFG.tuning_engine.fractional__001+(b.returnFraction||0);
      const qty=Math.floor(fractional);
      b.returnFraction=fractional-qty;
      if(qty)b.returnQueue.push({dueWeek:s.week+CFG.tuning_engine.settlePrintLifecycle__001,units:qty});
      p.stats.weeklyPrintUnits=0;
    }
    const observedDemand=p.stats.weeklyPrintDemand||0;
    b.demandEwma=(b.demandEwma||0)*CFG.tuning_engine.settlePrintLifecycle__002+observedDemand*CFG.tuning_engine.settlePrintLifecycle__003;
    p.stats.weeklyPrintDemand=0;
    const remaining=[];
    for(const due of b.returnQueue){
      if(due.dueWeek<=s.week)settlePrintReturns(s,p,due.units);
      else remaining.push(due);
    }
    b.returnQueue=remaining;
    const age=s.week-p.releaseWeek;
    if(age>=CFG.tuning_engine.settlePrintLifecycle__004){
      if(b.stock)disposePrintStock(s,p,b.stock);
      b.closed=true;
    }else if(age>=0&&b.stock>0){
      // Small delegated storage expense, paid or accrued as an obligation.
      const c=company(s,p.companyId);
      const charge=money(b.stock*CFG.tuning_engine.charge__001);
      if(charge>0){expense(s,c,charge,'warehouse','Print warehouse service: '+p.title,p.id);p.directCost=money(p.directCost+charge);}
    }
  }
}
function projectWork(s,p) {
  const c=company(s,p.companyId);if(!c||c.bankrupt||c.operating44?.furloughed)return;
  if(p.escrowId&&s.escrows.find(e=>e.id===p.escrowId)?.review47?.status==="open")return;
  if(p.route==='adaptation'){
    const permission=canUseIp(s,c,p.ipId,p.sector,s.week);
    if(!permission.ok){ if(c.isPlayer)alert(s,'blocked-'+p.id,CFG.events.messages.projectWork__001,p.title+': '+permission.reason+' Project has been paused.','critical');return;}
  }
  const team=c.teams?.find(t=>t.id===p.teamId);
  // Work is automatically delegated to one finite team. Specialization and accumulated
  // skill shorten elapsed time; the same budget is consumed over units of progress.
  const expertise=businessTechnology(s,c.id,p.sector);
  const partnerDeal=p.coProductionId?s.coProductions.find(d=>d.id===p.coProductionId):null;
  const partnerTeam=partnerDeal?company(s,partnerDeal.sponsorId)?.teams?.find(t=>t.id===partnerDeal.partnerTeamId):null;
  const partnerSpeed=partnerTeam?clamp((partnerTeam.skill-CFG.tuning_engine.partnerSpeed__001)*CFG.tuning_engine.partnerSpeed__002,CFG.tuning_engine.partnerSpeed__003,CFG.tuning_engine.partnerSpeed__004):0;
  const specialist=s.specialists?.find(x=>x.id===p.specialistId&&x.assignedProjectId===p.id);
  const specialistSpeed=specialist?.discipline==='production'?clamp((specialist.skill-CFG.tuning_engine.specialistSpeed__001)*CFG.tuning_engine.specialistSpeed__002,CFG.tuning_engine.specialistSpeed__003,CFG.tuning_engine.specialistSpeed__004):0;
  const leader=team?(s.employees||[]).find(e=>e.id===team.leaderId&&e.status==='employed'):null;
  const leadershipSpeed=leader?clamp((leader.skill-CFG.tuning_engine.leadershipSpeed__001)*CFG.tuning_engine.leadershipSpeed__002+(leader.morale-CFG.tuning_engine.leadershipSpeed__003)*CFG.tuning_engine.leadershipSpeed__004,-CFG.tuning_engine.leadershipSpeed__005,CFG.tuning_engine.leadershipSpeed__006):-CFG.tuning_engine.leadershipSpeed__007;
  const speed=team?clamp(1+leadershipSpeed+Math.max(0,team.skill-CFG.tuning_engine.speed__001)*CFG.tuning_engine.speed__002+(team.specialty===p.genre?CFG.tuning_engine.speed__003:0)+expertise.effectiveness+expertise.researchBonus+partnerSpeed+specialistSpeed,1,CFG.tuning_engine.speed__004):1;
  const nextProgress=Math.min(p.weeksTotal,money(p.weeksDone+speed));
  const work=money(p.budget*(nextProgress-p.weeksDone)/p.weeksTotal*(p.budgetMultiplier??1)+(p.weeksDone===0?p.marketingBudget:0));
  let sponsorPaid=0;
  if(p.coProductionId){
    const deal=s.coProductions.find(d=>d.id===p.coProductionId),sponsor=deal&&company(s,deal.sponsorId);
    if(!deal||!sponsor||deal.status!=='active')throw new Error('Active co-production capital agreement missing.');
    sponsorPaid=money(Math.min(deal.held,work*deal.capitalFraction));
    if(sponsorPaid>0){transact(s,sponsor,'cofinance-work-spend',{prepaid:-sponsorPaid,expense:sponsorPaid},'Sponsored share of production cost: '+p.title,p.id);
      deal.held=money(deal.held-sponsorPaid);deal.spent=money(deal.spent+sponsorPaid);p.partnerSpend=money((p.partnerSpend||0)+sponsorPaid);}
  }
  expense(s,c,money(work-sponsorPaid),'development','Development & marketing for '+p.title,p.id);p.directCost=money(p.directCost+work);p.productionSpend=money((p.productionSpend??0)+work);p.periodProductionSpend=money((p.periodProductionSpend||0)+work);
  p.weeksDone=nextProgress;
  // Occasional deterministic cinema setbacks cost real funds and time. Routine repairs
  // are delegated; material budget alerts still use the existing threshold checks.
  if(p.sector==='movie'&&p.cinema&&p.weeksDone>=p.weeksTotal*CFG.tuning_engine.projectWork__001&&p.weeksDone<p.weeksTotal*CFG.tuning_engine.projectWork__002&&
    !p.cinema.disruptions?.length&&(hash(s.seed+':film-setback:'+p.id)%CFG.tuning_engine.projectWork__003===0)){
    const cost=money(p.budget*CFG.tuning_engine.cost__008);expense(s,c,cost,'film-disruption','Unexpected production logistics and recovery: '+p.title,p.id);
    p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
    p.periodProductionSpend=money((p.periodProductionSpend||0)+cost);p.weeksTotal+=CFG.tuning_engine.projectWork__004;
    p.cinema.disruptions=[{week:s.week,cost,delay:CFG.tuning_engine.projectWork__005,kind:'logistics'}];
    if(c.isPlayer)news(s,'Film setback: '+p.title,CFG.events.messages.projectWork__002,'production');
  }
  if(p.phaseHistory?.length){const ratio=p.weeksDone/p.weeksTotal;
    const phase=ratio>=1?(p.holdUntilWeek&&s.week<p.holdUntilWeek?'polish':'released'):ratio>=CFG.tuning_engine.phase__001?'polish':ratio>=CFG.tuning_engine.phase__002?'production':'concept';
    if(p.phase!==phase){p.phase=phase;p.phaseHistory.push({week:s.week,phase});}
  }
  if(p.sector==='games'&&p.videoGame){gameMilestone(s,p);}
  if(p.sector==='movie'&&p.cinema?.delayWeeks>0){
    p.weeksTotal+=p.cinema.delayWeeks;p.cinema.delayWeeks=0;
  }
  if(p.route==='contract' &&p.escrowId)releaseClientMilestone(s,p);
  const costView=projectBudget(s,p.id);
  if(c.isPlayer&&p.major&&!p.budgetAlerted&&p.weeksDone>=p.weeksTotal*CFG.tuning_engine.projectWork__006&&costView.projectedVariance>costView.plannedTotal*CFG.tuning_engine.projectWork__007){
    p.budgetAlerted=true;alert(s,'budget-'+p.id,CFG.events.messages.projectWork__003,p.title+' is projected to spend '+shortMoney(costView.projectedVariance)+' above its approved budget. The team will continue within delegated authority; review if liquidity becomes tight.','advisory');
  }
  if(team){team.workWeeks++;team.skill=Math.min(CFG.tuning_engine.projectWork__008,team.skill+(team.workWeeks%CFG.tuning_engine.projectWork__009===0?1:0));}
  if(partnerTeam){partnerTeam.workWeeks++;partnerTeam.skill=Math.min(CFG.tuning_engine.projectWork__010,partnerTeam.skill+(partnerTeam.workWeeks%CFG.tuning_engine.projectWork__011===0?1:0));}
  if(p.weeksDone>=p.weeksTotal){
    // A failed certification attempt cannot silently fall back to every region.
    // Keep the live production available for optional funded QA and re-certification.
    if(p.sector==='games'&&p.videoGame?.certification?.failures?.length&&!p.videoGame.certification.regions.length)return;
    if(p.holdUntilWeek!==null&&s.week<p.holdUntilWeek)return; // funded team remains occupied until deliberately chosen launch; no premature consumer sales.
    if(p.phaseHistory?.length&&p.phase!=='released'){p.phase='released';p.phaseHistory.push({week:s.week,phase:'released'});}
    if((p.sector==='movie'&&p.cinema?.castActorId)||(p.sector==='tv'&&p.television?.castActorId)){const actor=(s.filmActors||[]).find(a=>a.id===(p.cinema?.castActorId||p.television?.castActorId));if(actor?.busyProjectId===p.id)actor.busyProjectId=null;}
    recordCreatorCredit(s,p,c,team);
    releaseProjectSpecialist(s,p,true);
    p.status='released';p.releaseWeek=s.week;
    if(p.sector==='games'&&p.videoGame){p.videoGame.launchUserRating=p.videoGame.userRating??null;p.videoGame.launchCriticRating=p.videoGame.criticRating??null;}
    if(Number.isFinite(p.creativeQuality)&&Number.isFinite(p.technicalQuality)){
      p.criticScore=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.projectWork__012+p.technicalQuality*CFG.tuning_engine.projectWork__013+(p.pitch?.direction==='experimental'?CFG.tuning_engine.projectWork__014:0),1,CFG.tuning_engine.projectWork__015));
      p.audienceScore=Math.round(clamp(p.creativeQuality*CFG.tuning_engine.projectWork__016+p.technicalQuality*CFG.tuning_engine.projectWork__017+(p.pitch?.positioning==='broad'?CFG.tuning_engine.projectWork__018:p.pitch?.positioning==='niche'?-CFG.tuning_engine.projectWork__019:0),1,CFG.tuning_engine.projectWork__020));
      if(p.sector==='games'&&p.videoGame){p.criticScore=p.videoGame.criticRating;p.audienceScore=p.videoGame.userRating;}
    }
    if(p.sector==='games'&&p.videoGame)gameAtRelease(s,p);
    receptionRoll(s,p);
    if(p.coProductionId)refundPartnerReserve(s,p,'released');
    if(p.route==='contract') {if(p.escrowId)deliverClientFee(s,p);else finalizeContract(s,c,p.earnedFee,p.advance,p.id);p.directRevenue=money(p.directRevenue+p.earnedFee);}
    else {initPrintEdition(s,p);const work={id:id(s,'work'),title:p.title,ipId:p.ipId,projectId:p.id,sector:p.sector,ownerId:c.id,releaseWeek:s.week};s.works.push(work);const ip=s.ips.find(x=>x.id===p.ipId);if(ip)ip.works.push(work.id);}
    if(team){const leader=s.employees?.find(e=>e.id===team.leaderId&&e.status==='employed');
      if(leader){leader.completed++;leader.morale=clamp(leader.morale+(p.quality>=CFG.tuning_engine.projectWork__021?CFG.tuning_engine.projectWork__022:-1),CFG.tuning_engine.projectWork__023,CFG.tuning_engine.projectWork__024);leader.history.push({week:s.week,kind:'release',companyId:c.id,teamId:team.id,projectId:p.id,quality:p.quality});if(leader.history.length>CFG.tuning_engine.projectWork__025)leader.history.shift();}
      if(c.isPlayer&&s.founder){s.founder.experience=(s.founder.experience||0)+1;s.founder.lastReleaseWeek=s.week;}
      team.completed++;if(!Array.isArray(team.performanceHistory))team.performanceHistory=[];team.performanceHistory.push({projectId:p.id,week:s.week,quality:p.quality,sector:p.sector,genre:p.genre});if(team.performanceHistory.length>CFG.tuning_engine.projectWork__026)team.performanceHistory.shift();}
    c.reputation=Math.round(clamp(c.reputation+(p.quality-CFG.tuning_engine.projectWork__027)/CFG.tuning_engine.projectWork__028,CFG.tuning_engine.projectWork__029,CFG.tuning_engine.projectWork__030));
    if(c.isPlayer){news(s,p.title+' released',p.route==='contract'?'Commissioned work delivered; full fee recognized.':p.genre+' '+p.format+' enters the '+SECTORS[p.sector].name+' market.'+(p.reception?' Reception: '+p.reception.label+', '+(CFG.depth.RECEPTION.LEVELS.find(l=>l.key===p.reception.key)?.news||'')+'.':''),'release'); }
    else if(rand(s)<CFG.tuning_engine.projectWork__031)news(s,c.name+' releases '+p.title,'A competing '+p.genre.toLowerCase()+' '+SECTORS[p.sector].name.toLowerCase()+' title enters the market.','competitor');
  }
}