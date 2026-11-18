
function audit(s){const problems=[];auditIdentities(s,problems);auditGovernance(s,problems);audit43A(s,problems);audit43B(s,problems);audit43C(s,problems);
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))problems.push('Invalid saved dashboard layout');
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')problems.push('Invalid skip interruption settings');
  for(const x of s.snapshots||[])if(x.historyComplete===true&&(!s.companies.some(c=>c.id===x.companyId)||!Number.isFinite(x.cash)||!Number.isFinite(x.revenue)||!Number.isFinite(x.expense)||!Number.isFinite(x.profit)||!Number.isFinite(x.annualRevenue)||!Number.isFinite(x.annualExpense)||!Number.isFinite(x.annualProfit)||Math.abs(money(x.annualRevenue-x.annualExpense-x.annualProfit))>EPS))problems.push('Invalid historical entity close snapshot');
  for(const r of REGIONS){const v=s.regionalEconomy?.[r.name];if(!v||!Number.isFinite(v.fxRate)||v.fxRate<r.baseFx*CFG.tuning_engine.audit__001||v.fxRate>r.baseFx*CFG.tuning_engine.audit__002||!Number.isFinite(v.wageIndex)||v.wageIndex<CFG.tuning_engine.audit__003||v.wageIndex>CFG.tuning_engine.audit__004||!Number.isFinite(v.interestIndex)||v.interestIndex<CFG.tuning_engine.audit__005||v.interestIndex>CFG.tuning_engine.audit__006)problems.push(r.name+': invalid regional macro indicators');}
  for(const x of s.economicShocks||[])if(!REGIONS.some(r=>r.name===x.region)||!['supply','confidence'].includes(x.kind)||x.week>s.week)problems.push('Invalid historical economic disruption');
  if(!Array.isArray(s.creativeAwards)||!Array.isArray(s.creatorRelations))problems.push('Missing creator history ledger');
  const awardPairs=new Set();
  for(const a of s.creativeAwards||[]){
   const p=s.projects.find(p=>p.id===a.projectId),key=a.year+':'+a.sector;
   if(!p||p.status!=='released'||!Number.isInteger(a.year)||a.year!==yearAt(p.releaseWeek)||
      !SECTORS[a.sector]||p.sector!==a.sector||a.companyId!==p.companyId||
      !Number.isInteger(a.awardedWeek)||a.awardedWeek>s.week||a.awardedWeek<=p.releaseWeek||
      yearAt(a.awardedWeek)!==a.year+1||a.generated!==false||!Number.isFinite(a.score)||
      !Array.isArray(a.creatorIds)||a.creatorIds.some(x=>!p.creatorCredits?.some(c=>c.personId===x))||awardPairs.has(key))
      problems.push('Invalid creative award provenance');
   awardPairs.add(key);
  }
  const knownRelationships=new Set();
  for(const r of s.creatorRelations||[]){
   const key=r.leaderId+':'+r.specialistId;
   if(!s.employees.some(e=>e.id===r.leaderId)||!s.specialists.some(e=>e.id===r.specialistId)||
      !Array.isArray(r.projectIds)||r.projects!==r.projectIds.length||r.projects<1||
      r.projectIds.some(id=>!s.projects.some(p=>p.id===id&&p.status==='released'&&p.creatorCredits?.some(c=>c.personId===r.leaderId)&&p.creatorCredits?.some(c=>c.personId===r.specialistId)))||
      !Number.isInteger(r.lastWeek)||r.lastWeek>s.week||knownRelationships.has(key))problems.push('Invalid creator collaboration lineage');
   knownRelationships.add(key);
  }
  if(!s.coProductionPolicy||typeof s.coProductionPolicy.autoCounter!=='boolean'||
    !Number.isFinite(s.coProductionPolicy.maxCommitment)||s.coProductionPolicy.maxCommitment<CFG.tuning_engine.audit__007||s.coProductionPolicy.maxCommitment>CFG.tuning_engine.audit__008||
    !Number.isFinite(s.coProductionPolicy.maxShare)||s.coProductionPolicy.maxShare<CFG.tuning_engine.audit__009||s.coProductionPolicy.maxShare>CFG.tuning_engine.audit__010)
    problems.push('Invalid delegated partner-financing authority');
  for(const o of s.coProductionOffers||[]){
    const p=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    const d=o.projectId?s.coProductions.find(d=>d.projectId===o.projectId):null;
    if(!company(s,o.producerId)||!company(s,o.sponsorId)||o.producerId===o.sponsorId||
      !SECTORS[o.sector]||!['original','adaptation'].includes(o.route)||
      !['counter','accepted','declined','booked'].includes(o.status)||
      !Number.isFinite(o.proposedShare)||o.proposedShare<CFG.tuning_engine.audit__011||o.proposedShare>CFG.tuning_engine.audit__012||
      !Number.isFinite(o.commitment)||o.commitment<=0||![CFG.tuning_engine.audit__013,CFG.tuning_engine.audit__014,CFG.tuning_engine.audit__015].includes(o.capitalFraction)||
      !Number.isInteger(o.createdWeek)||!Number.isInteger(o.expiresWeek)||o.expiresWeek!==o.createdWeek+CFG.tuning_engine.audit__016||
      o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
      (o.status==='counter'&&(!Number.isFinite(o.counterShare)||o.counterShare<=o.proposedShare))||
      (['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedShare)||o.acceptedShare<CFG.tuning_engine.audit__017||o.acceptedShare>CFG.tuning_engine.audit__018))||
      (o.creativeTermsComplete&&(!THEMES.includes(o.theme)||!TARGET_AUDIENCES.includes(o.targetAudience)||
       !CREATIVE_DIRECTIONS.includes(o.direction)||!MARKET_POSITIONINGS.includes(o.positioning)||
       (o.status==='booked'&&p?.creativeHistoryComplete&&Object.entries(pitchFrom(o)).some(([k,v])=>p.pitch?.[k]!==v))))||
      (o.status==='booked'&&(!p||!d||d.offerId!==o.id||o.updatedWeek>o.expiresWeek))||
      (o.status!=='booked'&&!!o.projectId))problems.push(o.id+': invalid negotiated co-production offer');
  }
  if(!s.commissionPolicy||typeof s.commissionPolicy.autoCounter!=='boolean'||
    !Number.isFinite(s.commissionPolicy.maxFee)||s.commissionPolicy.maxFee<CFG.tuning_engine.audit__019||s.commissionPolicy.maxFee>CFG.tuning_engine.audit__020||
    !Number.isFinite(s.commissionPolicy.minMargin)||s.commissionPolicy.minMargin<0||s.commissionPolicy.minMargin>CFG.tuning_engine.audit__021)
    problems.push('Invalid delegated commission authority');
  for(const o of s.commissionOffers||[]){
    const linked=o.projectId?s.projects.find(p=>p.id===o.projectId):null;
    if(!company(s,o.clientId)||!company(s,o.producerId)||o.clientId===o.producerId||!SECTORS[o.sector]||
       !['counter','accepted','declined','booked'].includes(o.status)||!Number.isFinite(o.proposedFee)||o.proposedFee<CFG.tuning_engine.audit__022||
       !Number.isFinite(o.baseCost)||o.baseCost<=0||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Number.isFinite(o.size)||o.size<CFG.tuning_engine.audit__023||o.size>CFG.tuning_engine.audit__024||typeof o.title!=='string'||!o.title||
       (o.status==='booked'&&(!linked||linked.escrowId===null||linked.companyId!==o.producerId||linked.clientId!==o.clientId||linked.earnedFee!==o.acceptedFee))||
       !Number.isInteger(o.updatedWeek)||o.updatedWeek<o.createdWeek||o.updatedWeek>s.week||
       (o.status==='counter'&&o.acceptedFee!==null)||
       (['accepted','booked'].includes(o.status)&&o.acceptedFee!==o.proposedFee&&o.acceptedFee!==o.counterFee)||
       (o.status!=='booked'&&o.projectId)||(['accepted','booked'].includes(o.status)&&(!Number.isFinite(o.acceptedFee)||o.acceptedFee<CFG.tuning_engine.audit__025)))
      problems.push(o.id+': invalid client commission agreement');
  }
  for(const h of s.commissionHistory||[]){const p=s.projects.find(p=>p.id===h.projectId);
    if(!p||h.clientId!==p.clientId||h.producerId!==p.companyId||h.outcome!==(p.status==='cancelled'?'cancelled':'delivered')||
       !['released','cancelled'].includes(p.status)||h.week> s.week)problems.push(h.id+': invalid commission delivery history');
  }
  if(!s.rightsPolicy||typeof s.rightsPolicy.autoRenew!=='boolean' ||!Number.isFinite(s.rightsPolicy.maxFee)||s.rightsPolicy.maxFee<CFG.tuning_engine.audit__026||s.rightsPolicy.maxFee>CFG.tuning_engine.audit__027||![CFG.tuning_engine.audit__028,CFG.tuning_engine.audit__029].includes(s.rightsPolicy.extensionWeeks))problems.push('Invalid delegated rights authority');for(const c of [...s.companies,...s.backgroundFirms]){if(Math.abs(companyBalance(c))>EPS)problems.push(c.name+': balance discrepancy '+companyBalance(c));if(c.finance.deferred<-CFG.tuning_engine.audit__030||c.finance.payable<-CFG.tuning_engine.audit__031||(c.finance.prepaid||0)<-CFG.tuning_engine.audit__032||(c.finance.receivable||0)<-CFG.tuning_engine.audit__033)problems.push(c.name+': negative obligations or prepaid assets');if(c.teams&&c.teams.length!==c.capacity)problems.push(c.name+': team capacity mismatch');}
  for(const c of s.companies){
    for(const [sector,r] of Object.entries(c.research||{}))if(!SECTORS[sector]||!Number.isFinite(r.spent)||!(r.spent>=CFG.tuning_engine.audit__034||r.acquiredLevel>=1||r.transferredAway)||r.level!==Math.min(CFG.tuning_engine.audit__035,Math.max(Math.floor(r.spent/CFG.tuning_engine.audit__036),r.acquiredLevel||0))||r.wave<0||r.updatedWeek>s.week)problems.push(c.id+': invalid research portfolio');
    for(const [sector,r] of Object.entries(c.techLicenses||{}))if(!SECTORS[sector]||r.week>s.week||!Number.isInteger(r.wave)||r.wave<1||r.cost<CFG.tuning_engine.audit__037||!available(sector,r.week))problems.push(c.id+': invalid tool license');
  }
  // Group-accounting integrity; founders never inherit rival assets.
  for(const c of s.companies){
    if(c.parentId&&(!company(s,c.parentId)||c.parentId===c.id||company(s,c.parentId).parentId))problems.push(c.name+': illegal or missing parent company');
    const expected=money(s.companies.filter(child=>child.parentId===c.id).reduce((n,child)=>n+(child.investedCapital||0),0));
    if(Math.abs(expected-(c.finance.investment||0))>CFG.tuning_engine.audit__038)problems.push(c.name+': parent equity investment does not match subsidiary capital');
    if((c.finance.internalExpense||0)<-CFG.tuning_engine.audit__039||(c.finance.internalRevenue||0)<-CFG.tuning_engine.audit__040||(c.finance.internalExpense||0)>c.finance.expense+CFG.tuning_engine.audit__041||(c.finance.internalRevenue||0)>c.finance.revenue+CFG.tuning_engine.audit__042)problems.push(c.name+': invalid intragroup service totals');
  }
  if(s.companies.some(c=>c.parentId===s.playerId)){
    try{const group=consolidatedStatements(s);
      if(Math.abs(group.income.internalRevenueEliminated-group.income.internalExpenseEliminated)>CFG.tuning_engine.audit__043)problems.push('Group: internal service income does not equal internal service expense');
      if(Math.abs(group.balance.investmentEliminated-group.balance.subsidiaryCapitalEliminated)>CFG.tuning_engine.audit__044)problems.push('Group: parent share capital elimination does not reconcile');
      if(Math.abs(group.balance.difference)>CFG.tuning_engine.audit__045)problems.push('Group: consolidated balance does not reconcile');
    }catch(e){problems.push('Group consolidation error: '+e.message);}
  }
  const physicalByCompany=new Map();
  for(const p of s.projects)if(p.printStock){
    const b=p.printStock;
    const ok=isPrintEdition(p)&&p.status==='released'&&Number.isInteger(b.stock)&&b.stock>=0&&
      Number.isInteger(b.printed)&&Number.isInteger(b.sold)&&Number.isInteger(b.returned)&&Number.isInteger(b.writtenOff)&&
      b.stock===b.printed-b.sold+b.returned-b.writtenOff&&Number.isFinite(b.unitCost)&&b.unitCost>0&&
      Number.isFinite(b.price)&&b.price>b.unitCost&&b.printed>=0&&b.sold>=0&&b.returned>=0&&b.writtenOff>=0&&
      b.sold>=b.returned&&b.lastOrderWeek<=s.week&&
      (b.returnQueue||[]).every(q=>Number.isInteger(q.units)&&q.units>0&&Number.isInteger(q.dueWeek)&&q.dueWeek>s.week)&&
      Number.isFinite(b.returnFraction)&&b.returnFraction>=0&&b.returnFraction<CFG.tuning_engine.ok__001&&
      Number.isFinite(b.demandEwma)&&b.demandEwma>=0&&
      Math.abs(money(b.printSpend-b.printed*b.unitCost))<EPS&&
      Math.abs(money(b.cogs-(b.sold-b.returned)*b.unitCost))<EPS&&
      Math.abs(money((b.writeOffCost||0)-b.writtenOff*b.unitCost))<EPS;
    if(!ok)problems.push(p.id+': printed copy register inconsistent');
    physicalByCompany.set(p.companyId,money((physicalByCompany.get(p.companyId)||0)+b.stock*b.unitCost));
  }
  for(const c of s.companies){
    if((c.finance.inventory||0)<-CFG.tuning_engine.audit__046||Math.abs(money(c.finance.inventory||0)-(physicalByCompany.get(c.id)||0))>EPS)
      problems.push(c.name+': inventory asset not backed by physical stock');
  }
  for(const r of s.remittances)if(r.amount<=0||!Number.isFinite(r.amount)||!Number.isInteger(r.dueWeek)||r.dueWeek<=s.week)problems.push(r.id+': invalid pending distribution receipt');
  for(const c of [...s.companies,...s.backgroundFirms]){
    const pending=money(s.remittances.reduce((total,r)=>total+(r.companyId===c.id?r.amount:0),0));
    if(Math.abs(pending-(c.finance.receivable||0))>CFG.tuning_engine.audit__047)problems.push(c.name+': receivable unsupported by distributor remittance');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.overheadAttributed||0)<-CFG.tuning_engine.audit__048||(c.finance.overheadBooked||0)<(c.finance.overheadAttributed||0)-CFG.tuning_engine.audit__049)problems.push(c.name+': over-attributed company overhead');
  for(const p of s.projects)if((p.overheadAttributed||0)<-CFG.tuning_engine.audit__050)problems.push(p.id+': negative overhead allocation');
  for(const p of s.projects)if(!Number.isFinite(p.budgetMultiplier)||p.budgetMultiplier<CFG.tuning_engine.audit__051||p.budgetMultiplier>CFG.tuning_engine.audit__052||Math.abs((p.plannedTotal||0)-money(p.budget+p.marketingBudget+(p.interventions||[]).filter(e=>e.kind==='scope').reduce((n,e)=>n+e.originalBudget-e.newBudget,0)))>CFG.tuning_engine.audit__053||(p.productionSpend!==null&&(!Number.isFinite(p.productionSpend)||p.productionSpend<0||p.productionSpend>p.directCost+EPS)))problems.push(p.id+': invalid production budget plan');
  for(const c of s.companies){const allocated=money(s.projects.filter(p=>p.companyId===c.id).reduce((sum,p)=>sum+(p.overheadAttributed||0),0));if(Math.abs(allocated-(c.finance.overheadAttributed||0))>CFG.tuning_engine.audit__054)problems.push(c.name+': project overhead does not reconcile');}
  for(const p of s.projects){if(p.startWeek<(SECTORS[p.sector].year-1)*CFG.tuning_engine.audit__055)problems.push(p.title+': before debut');if(p.status==='active'&&p.weeksDone>p.weeksTotal+CFG.tuning_engine.audit__056)problems.push(p.title+': overworked');if(p.status==='active'&&p.teamId&&(!company(s,p.companyId)?.teams||!company(s,p.companyId).teams.some(t=>t.id===p.teamId)))problems.push(p.title+': missing team');}
  const activeTeams=new Set();for(const p of s.projects.filter(p=>p.status==='active'&&p.teamId)){if(activeTeams.has(p.teamId))problems.push(p.title+': team double-booked');activeTeams.add(p.teamId);}
  for(const d of s.coProductions||[])if(d.status==='active'){if(activeTeams.has(d.partnerTeamId))problems.push(d.id+': sponsor team double-booked');activeTeams.add(d.partnerTeamId);}
  for(const e of s.escrows||[]){if(e.fee<0||e.held<0||e.held>e.fee||!company(s,e.buyerId)||!company(s,e.sellerId))problems.push(e.id+': invalid funded escrow');if(e.settled&&e.held!==0)problems.push(e.id+': delivery escrow not cleared');if(!e.settled&&Math.abs(e.held+e.advance+(e.milestonePaid||0)-e.fee)>CFG.tuning_engine.audit__057)problems.push(e.id+': escrow funding discrepancy');
    const project=s.projects.find(p=>p.id===e.projectId);
    if(!project||project.companyId!==e.sellerId||project.clientId!==e.buyerId||project.route!=='contract'||
      project.earnedFee!==e.fee||project.escrowId!==e.id||
      (project.status==='active'&&e.settled)||(project.status!=='active'&&!e.settled))
      problems.push(e.id+': escrow does not match contracted production');
    if(!Number.isFinite(e.milestonePaid)||e.milestonePaid<0||!Number.isFinite(e.milestoneAt)||e.milestoneAt<0||
      (e.milestoneDone&&e.milestonePaid<=0)||(!e.milestoneDone&&e.milestonePaid>0))problems.push(e.id+': invalid service milestone history');}
  for(const p of s.projects||[]){
    if(p.pitch!==null&&p.pitch!==undefined&&(!THEMES.includes(p.pitch.theme)||!TARGET_AUDIENCES.includes(p.pitch.targetAudience)||
       !CREATIVE_DIRECTIONS.includes(p.pitch.direction)||!MARKET_POSITIONINGS.includes(p.pitch.positioning)||
       ![p.creativeQuality,p.technicalQuality,p.quality].every(x=>Number.isFinite(x)&&x>=1&&x<=CFG.tuning_engine.audit__058)))
      problems.push(p.id+': invalid creative project specifications');
    if(p.creativeHistoryComplete&&(!Array.isArray(p.phaseHistory)||!p.phaseHistory.length||
       !['concept','production','polish','released'].includes(p.phase)||
       p.phaseHistory.some(x=>!Number.isInteger(x.week)||x.week<p.startWeek||x.week>s.week||!['concept','production','polish','released'].includes(x.phase))))
      problems.push(p.id+': invalid milestone history');
  }
  for(const d of s.coProductions||[]){
    const p=s.projects.find(p=>p.id===d.projectId),owner=company(s,d.producerId),sponsor=company(s,d.sponsorId);
    const amounts=['commitment','held','spent','refunded','shareAccrued','sharePaid','capitalFraction','revenueShare'];
    if(!p||!owner||!sponsor||p.coProductionId!==d.id||p.companyId!==owner.id||p.clientId||p.route==='contract'||
      d.sector!==p.sector||owner.id===sponsor.id||!validInheritedCoProduction(s,d)||!sponsor.capabilities[d.sector]||
      !sponsor.teams?.some(t=>t.id===d.partnerTeamId)||
      !['active','released','cancelled'].includes(d.status)||d.status!==p.status&&!(p.status==='released'&&d.status==='released')||
      !amounts.every(k=>Number.isFinite(d[k])&&d[k]>=0)||
      ![CFG.tuning_engine.audit__059,CFG.tuning_engine.audit__060,CFG.tuning_engine.audit__061].includes(d.capitalFraction)||
      (d.offerId?!s.coProductionOffers.some(o=>o.id===d.offerId&&o.status==='booked'&&o.projectId===p.id&&o.producerId===d.producerId&&o.sponsorId===d.sponsorId&&o.commitment===d.commitment&&o.acceptedShare===d.revenueShare):Math.abs(d.revenueShare-money(d.capitalFraction*CFG.tuning_engine.audit__062))>CFG.tuning_engine.audit__063)||
      Math.abs(d.commitment-money(p.plannedTotal*d.capitalFraction))>CFG.tuning_engine.audit__064||
      Math.abs(d.commitment-money(d.held+d.spent+d.refunded))>CFG.tuning_engine.audit__065||
      Math.abs((p.partnerSpend||0)-d.spent)>CFG.tuning_engine.audit__066||
      d.sharePaid>d.shareAccrued+CFG.tuning_engine.audit__067||Math.abs((p.partnerShareCost||0)-d.shareAccrued)>CFG.tuning_engine.audit__068||
      (p.status==='active'&&(d.status!=='active'||d.closedWeek!==null))||
      (p.status!=='active'&&(d.held!==0||d.closedWeek===null)))
      problems.push(d.id+': co-production agreement/ownership/escrow audit failed');
  }
  for(const p of s.projects){
    if(p.coProductionId&&!s.coProductions.some(d=>d.id===p.coProductionId))problems.push(p.id+': missing sponsoring agreement');
    if(p.sponsoredSectorEntry){const d=s.coProductions.find(d=>d.id===p.coProductionId);
      const sponsor=company(s,p.sectorEntrySponsorId);
      if(!d||d.sponsorId!==p.sectorEntrySponsorId||!sponsor||!sponsor.capabilities[p.sector]||
         d.sector!==p.sector||d.signedWeek<((SECTORS[p.sector]?.year||CFG.tuning_engine.audit__069)-1)*CFG.tuning_engine.audit__070)
        problems.push(p.id+': missing or unauthorized specialist industry-entry partner');
    }
  }
  for(const c of s.companies){
    const unearned=(s.escrows||[]).filter(e=>e.buyerId===c.id&&!e.settled).reduce((total,e)=>total+e.fee,0);
    const sponsored=(s.coProductions||[]).filter(d=>d.sponsorId===c.id).reduce((total,d)=>total+d.held,0)+(s.gamePublisherDeals43||[]).filter(d=>d.publisherId===c.id&&d.status==="active").reduce((total,d)=>total+d.advance,0);
    if(Math.abs((c.finance.prepaid||0)-money(unearned+sponsored))>CFG.tuning_engine.audit__071)problems.push(c.name+': reserved client/partner capital does not reconcile with prepaid assets');
    const partnerDue=money((s.coProductions||[]).filter(d=>d.producerId===c.id).reduce((n,d)=>n+d.shareAccrued-d.sharePaid,0));
    if(partnerDue>c.finance.payable+CFG.tuning_engine.audit__072)problems.push(c.name+': partner profit participation exceeds accrued liabilities');
  }
  // Legal rights checks operate on the single persistent grant register. They
  // validate history too: a stale overlapping exclusive contract is not cured
  // merely because both grants have expired by the audit date.
  const bySourceMedium=new Map();
  for(const g of s.grants){
    const ip=s.ips.find(x=>x.id===g.ipId),grantor=company(s,g.grantorId),holder=company(s,g.holderId);
    const key=g.ipId+':'+g.media;
    if(!ip||!grantor||!holder||!validGrantor43(s,g,ip)||g.grantorId===g.holderId)
      problems.push(g.id+': rights grantor must own source IP and parties must differ');
    if(!SECTORS[g.media]||!['option','license'].includes(g.type)||!Number.isInteger(g.startWeek)||!Number.isInteger(g.endWeek)||g.startWeek<0||g.endWeek<=g.startWeek||
      !Number.isFinite(g.royaltyRate)||g.royaltyRate<0||g.royaltyRate>1||!Number.isFinite(g.recoupableAdvance)||g.recoupableAdvance<0||g.recoupableAdvance>(g.fee||0)+EPS||!Number.isInteger(g.continuationWeeks)||g.continuationWeeks<0)
      problems.push(g.id+': invalid rights interval or contract terms');
    if(g.type==='option'&&g.allowsProduction)problems.push(g.id+': unexercised option cannot authorize production');
    if((g.renewalAutoAttemptedEnd!==undefined&&(!Number.isInteger(g.renewalAutoAttemptedEnd)||g.renewalAutoAttemptedEnd<s.week-CFG.tuning_engine.audit__073||g.renewalAutoAttemptedEnd>g.endWeek))||
       !Number.isFinite(g.exerciseFee)||g.exerciseFee<0||g.exerciseFeePaid<0||
       (g.type==='option'&&g.exercisedWeek!==null)||
       (g.type==='option'&&g.optionExpiresWeek!==g.endWeek)||
       (g.type==='license'&&g.exercisedWeek!==null&&(!Number.isInteger(g.exercisedWeek)||g.exercisedWeek<0||g.exercisedWeek>s.week||g.exerciseFeePaid!==g.exerciseFee))||
       typeof g.approvalRequired!=='boolean'||!Array.isArray(g.renewalHistory))
       problems.push(g.id+': invalid grant option exercise history or approval terms');
    if(g.type==='license'&&(!g.allowsProduction||!available(g.media,g.startWeek)))
      problems.push(g.id+': rights license cannot authorize production before global debut');
    const others=bySourceMedium.get(key)||[];
    for(const other of others)if(rightsConflict43(s,g,other))
      problems.push(g.id+': exclusive rights interval overlap with '+other.id);
    others.push(g);bySourceMedium.set(key,others);
  }
  for(const offer of s.rightsOffers||[]){
    const g=s.grants.find(g=>g.id===offer.grantId),ip=s.ips.find(i=>i.id===offer.ipId);
    if(!['option','renewal'].includes(offer.kind)||!['counter','accepted','declined'].includes(offer.status)||
      !ip||!(g?validGrantor43(s,g,ip):ip.ownerId===offer.grantorId)||!company(s,offer.holderId)||offer.holderId===offer.grantorId||
      !SECTORS[offer.media]||!Number.isInteger(offer.createdWeek)||offer.createdWeek>s.week||
      !offer.proposal||!Number.isFinite(offer.proposal.fee)||offer.proposal.fee<CFG.tuning_engine.audit__074||
      offer.status==='counter'&&!offer.counter||offer.status==='accepted'&&(!g||g.ipId!==offer.ipId||g.grantorId!==offer.grantorId||g.holderId!==offer.holderId||g.media!==offer.media))
      problems.push(offer.id+': invalid bilateral rights offer record');
  }
  for(const g of s.grants||[])if(g.manuscriptId&&(
    !Number.isFinite(g.agentRate)||g.agentRate<0||g.agentRate>CFG.tuning_engine.audit__075||!Number.isFinite(g.agentFeesPaid)||g.agentFeesPaid<0||
    g.agentFeesPaid>money((s.royaltyAccounts||[]).filter(a=>a.grantId===g.id).reduce((n,a)=>n+a.paid,0)*g.agentRate)+CFG.tuning_engine.audit__076))
    problems.push(g.id+': invalid author agency cash statement');
  for(const req of s.creativeApprovals||[]){const g=s.grants.find(g=>g.id===req.grantId);
    const linked=req.launched?s.projects.find(p=>p.id===req.launched):null;
    if(!g||!g.approvalRequired||g.grantorId!==req.grantorId||g.holderId!==req.holderId||
      !GENRES.includes(req.genre)||typeof req.title!=='string'||!req.title||
      !['pending','approved','rejected'].includes(req.status)||!Number.isInteger(req.requestedWeek)||req.requestedWeek>s.week||
      (req.launched&&(!linked||linked.approvalId!==req.id||linked.companyId!==req.holderId||linked.grantId!==req.grantId||linked.title!==req.title||linked.genre!==req.genre||req.status!=='approved'))||
      (req.status==='pending'&&(req.decidedWeek!==null||req.decidedBy!==null))||
      (req.status!=='pending'&&(req.decidedBy!==req.grantorId||!Number.isInteger(req.decidedWeek)||req.decidedWeek<req.requestedWeek||req.decidedWeek>s.week)))
      problems.push(req.id+': invalid binding creative decision');
  }
  for(const p of s.projects)if(p.grantId){
    const grant=s.grants.find(g=>g.id===p.grantId);
    if(!grant||p.route!=='adaptation'||grant.ipId!==p.ipId||grant.media!==p.sector||
      grant.holderId!==p.companyId||grant.type!=='license'||!grant.allowsProduction||
      p.startWeek<grant.startWeek||p.startWeek>=grant.endWeek)
      problems.push(p.id+': project rights grant does not authorize its production');
    if(grant?.approvalRequired&&!s.creativeApprovals.some(req=>req.id===p.approvalId&&req.grantId===grant.id&&req.holderId===p.companyId&&req.status==='approved'&&req.launched===p.id&&req.title===p.title&&req.genre===p.genre&&req.decidedWeek<=p.startWeek))
      problems.push(p.id+': unapproved adaptation violates contractual creator veto');
  }
  for(const c of s.companies){
    const register=activeObligationRegister(s,c.id);
    if(Math.abs(register.reconciliation.loanDifference)>EPS)problems.push(c.name+': active bank loan liability register mismatch');
    if(Math.abs(register.reconciliation.payableDifference)>EPS||register.totals.allLiabilities<-CFG.tuning_engine.audit__077)problems.push(c.name+': active payable obligation register fails financial reconciliation');
  }

  for(const o of s.obligations||[]){
    const project=s.projects.find(p=>p.id===o.projectId);
    const grant=project?.grantId?s.grants.find(g=>g.id===project.grantId):null;
    if(o.kind!=='royalty'||!Number.isFinite(o.amount)||o.amount<=0||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !company(s,o.debtorId)||!company(s,o.creditorId)||o.debtorId===o.creditorId||
       (o.projectId&&!project)||(project&&project.companyId!==o.debtorId)||(grant&&(grant.grantorId!==o.creditorId||grant.holderId!==o.debtorId))||!grant||o.grantId!==grant.id||!s.royaltyAccounts.some(a=>a.id===o.accountId&&a.grantId===grant.id&&a.projectId===o.projectId))
      problems.push(o.id+': invalid royalty obligation provenance');
  }
  // A royalty contract must have precisely one source account for each
  // production; the legally enforceable unpaid portion must match the claims
  // still owed after old journals have been compacted.
  const byGrant=new Map();
  for(const a of s.royaltyAccounts||[]){
    const p=s.projects.find(p=>p.id===a.projectId),g=s.grants.find(g=>g.id===a.grantId);
    const claims=money(s.obligations.filter(o=>o.accountId===a.id).reduce((n,o)=>n+o.amount,0));
    const numeric=['openingOutstanding','salesBase','accrued','recouped','paid','outstanding'];
    if(!p||!g||p.grantId!==g.id||p.companyId!==a.debtorId||g.grantorId!==a.creditorId||
      !numeric.every(k=>Number.isFinite(a[k])&&a[k]>=-CFG.tuning_engine.audit__078)||
      Math.abs(money(a.openingOutstanding+a.accrued-a.recouped-a.paid-a.outstanding))>EPS||
      Math.abs(money(claims-a.outstanding))>EPS||!Number.isInteger(a.createdWeek)||a.createdWeek>s.week||
      !Number.isInteger(a.updatedWeek)||a.updatedWeek>s.week||a.createdWeek>a.updatedWeek)
      problems.push(a.id+': royalty account source/recoupment/recovery reconciliation invalid');
    if(a.historyComplete===true&&Math.abs(money(p.royaltyCost-a.accrued+a.recouped))>EPS)
      problems.push(a.id+': exact project royalty charge differs from contract statement');
    const group=byGrant.get(a.grantId)||[];group.push(a);byGrant.set(a.grantId,group);
  }
  for(const [grantId,accounts] of byGrant){
    const g=s.grants.find(g=>g.id===grantId);
    if(accounts.length!==new Set(accounts.map(a=>a.projectId)).size ||
       money(accounts.reduce((n,a)=>n+a.recouped,0))>(g?.recoupableAdvance||0)+EPS)
      problems.push(grantId+': duplicate royalty account or excessive recoupment');
  }
  for(const loan of s.loans||[]){
    const valid=Number.isFinite(loan.originalPrincipal)&&loan.originalPrincipal>=CFG.tuning_engine.valid__001&&Number.isFinite(loan.principalOutstanding)&&loan.principalOutstanding>=0&&Number.isFinite(loan.principalPaid)&&loan.principalPaid>=0&&Math.abs(loan.originalPrincipal-loan.principalOutstanding-loan.principalPaid)<EPS&&Number.isFinite(loan.interestArrears)&&loan.interestArrears>=0&&Number.isFinite(loan.principalArrears)&&loan.principalArrears>=0&&loan.principalArrears<=loan.principalOutstanding+EPS&&Number.isInteger(loan.installmentsDue)&&loan.installmentsDue>=0&&loan.installmentsDue<=CFG.tuning_engine.valid__002&&loan.createdWeek<=s.week&&Number.isFinite(loan.interestRate)&&loan.interestRate>=0&&loan.interestRate<=CFG.tuning_engine.valid__003&&Number.isFinite(loan.interestCharged)&&Number.isFinite(loan.interestPaid)&&loan.interestPaid>=0&&Math.abs(loan.interestCharged-loan.interestPaid-loan.interestArrears)<EPS&&Number.isInteger(loan.missedPeriods)&&loan.missedPeriods>=0&&['current','delinquent','paid'].includes(loan.status)&&((loan.status==='paid'&&loan.principalOutstanding===0&&loan.interestArrears===0)||(loan.status==='delinquent'&&(loan.principalArrears>0||loan.interestArrears>0))||(loan.status==='current'&&loan.principalOutstanding>0&&loan.principalArrears===0&&loan.interestArrears===0));
    if(!valid)problems.push(loan.id+': invalid loan servicing or balance');
  }
  for(const c of s.companies){
    const contracts=(s.loans||[]).filter(l=>l.debtorId===c.id);
    if(Math.abs(contracts.reduce((v,l)=>v+l.principalOutstanding,0)-(c.finance.loanBalance||0))>EPS)problems.push(c.name+': loan liability is not backed by active bank debt');
    if(Math.abs(contracts.reduce((v,l)=>v+l.interestArrears,0)-(c.finance.interestPayable||0))>EPS)problems.push(c.name+': accrued interest does not match bank debt');
  }
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.taxPayable||0)<-CFG.tuning_engine.audit__079||(c.finance.interestPayable||0)<-CFG.tuning_engine.audit__080||(c.finance.loanBalance||0)<-CFG.tuning_engine.audit__081||(c.finance.taxPayable||0)+(c.finance.interestPayable||0)+outstandingRoyaltyDebt(s,c.id)>c.finance.payable+CFG.tuning_engine.audit__082)problems.push(c.name+': statutory/royalty obligations exceed payable liability');
  for(const c of [...s.companies,...s.backgroundFirms])if((c.finance.creditCarry||0)<-CFG.tuning_engine.audit__083||(c.finance.periodCreditEarned||0)<-CFG.tuning_engine.audit__084)problems.push(c.name+': invalid tax credit balance');
  for(const c of s.companies)if(outstandingRoyaltyDebt(s,c.id)>c.finance.payable+CFG.tuning_engine.audit__085)problems.push(c.name+': royalty debt exceeds payable liability');
  for(const c of s.companies)problems.push(...closedSettlementAudit(s,c.id));
  for(const p of s.projects)if(p.budgetCloseComplete===true&&(!Number.isFinite(p.periodProductionSpend)||p.periodProductionSpend<-CFG.tuning_engine.audit__086||p.periodProductionSpend>p.productionSpend+EPS))
    problems.push(p.id+': invalid live production budget movement');
  // Period accounting remains exact even after old journal transactions are
  // compacted. Check both direct/indirect bridges and stored historic closes.
  for(const c of [...s.companies,...s.backgroundFirms]){
    const f=c.finance;
    if(f.periodHistoryComplete===true){
      const o=f.periodOpening;
      if(!o||!Number.isFinite(o.cash))problems.push(c.name+': missing monthly opening position');
      else if(Math.abs(money(o.cash+(f.periodOperatingCash||0)+(f.periodFinancingCash||0)+(f.periodInvestingCash||0)-f.cash))>EPS)
        problems.push(c.name+': live monthly cash flow does not reconcile');
    }
    if(Math.abs(money((f.periodOperatingCash||0)+(f.periodFinancingCash||0)+(f.periodInvestingCash||0)-(f.periodCashIn||0)+(f.periodCashOut||0)))>EPS&&f.periodHistoryComplete===true)
      problems.push(c.name+': monthly receipts/outflows inconsistent');
  }
  for(const r of s.reports){
    if(r.historyComplete!==true)continue; // legacy snapshots never retro-filled
    const flow=r.cashFlow,b=r.balance;
    if(!flow||!b||!Number.isFinite(flow.endingCash)||!Number.isFinite(b.assets)){
      problems.push(r.id+': missing monthly close bridge');continue;
    }
    if(r.budget&&r.budget.historyComplete===true){
      const budget=r.budget;
      if(!Array.isArray(budget.rows)||budget.rows.length!==budget.projectCount)
        problems.push(r.id+': monthly budget rows missing');
      else {
        const sum=k=>money(budget.rows.reduce((v,row)=>v+(row[k]||0),0));
        for(const k of ['approvedTotal','plannedToDate','actualToDate','varianceToDate','plannedPeriod','spentPeriod','variancePeriod','estimatedRemaining']){
          const field={approvedTotal:'approvedBudget',plannedToDate:'plannedToDate',actualToDate:'actualToDate',varianceToDate:'varianceToDate',plannedPeriod:'plannedPeriod',spentPeriod:'spentPeriod',variancePeriod:'variancePeriod',estimatedRemaining:'estimatedRemaining'}[k];
          if(!Number.isFinite(budget[k])||Math.abs(money(budget[k]-sum(field)))>EPS)problems.push(r.id+': monthly budget '+k+' mismatch');
        }
        if(Math.abs(money(budget.spentPeriod-budget.plannedPeriod-budget.variancePeriod))>EPS||budget.spentPeriod>r.expense+EPS)
          problems.push(r.id+': monthly budget period variance invalid');
        for(const row of budget.rows)if(row.historyComplete){
          if(!Number.isFinite(row.approvedBudget)||!Number.isFinite(row.plannedToDate)||!Number.isFinite(row.actualToDate)||
             row.approvedBudget<0||row.plannedToDate<0||row.actualToDate<0||row.plannedToDate>row.approvedBudget+EPS||
             Math.abs(money(row.actualToDate-row.plannedToDate-row.varianceToDate))>EPS||
             Math.abs(money(row.spentPeriod-row.plannedPeriod-row.variancePeriod))>EPS)
            problems.push(r.id+': monthly budget project variance invalid');
        }
      }
    }
    if(Math.abs(money(r.revenue-r.expense-r.net))>EPS)problems.push(r.id+': monthly income statement does not reconcile');
    if(Math.abs(money(flow.openingCash+flow.operating+flow.financing+flow.investing-r.cash))>EPS ||
      Math.abs(money(flow.operating+flow.financing+flow.investing-r.cashIn+r.cashOut))>EPS ||
      Math.abs(money(flow.indirectOperating-flow.operating))>EPS ||
      Math.abs(money(flow.difference))>EPS || Math.abs(money(flow.indirectDifference))>EPS ||
      Math.abs(money(flow.endingCash-r.cash))>EPS)problems.push(r.id+': monthly cash flow does not reconcile');
    if(Math.abs(money(b.cash+b.prepaid+b.receivable+b.investment+(b.inventory||0)-b.assets))>EPS ||
      Math.abs(money(b.deferred+b.payable+b.loanBalance-b.liabilities))>EPS ||
      Math.abs(money(b.assets-b.liabilities-b.equity))>EPS ||
      Math.abs(money(b.difference))>EPS || Math.abs(money(b.cash-r.cash))>EPS)
      problems.push(r.id+': monthly balance does not reconcile');
  }
  // Film contracts, cast exclusivity, ticket estimates and distributor shares.
  if(!Array.isArray(s.filmActors)||!Array.isArray(s.filmHonors))problems.push('Missing film industry ledger');
  for(const c of s.companies)if(c.filmBacklot){const b=c.filmBacklot;if(!Number.isInteger(b.builtWeek)||b.builtWeek>s.week||b.cost!==CFG.tuning_engine.audit__087||b.monthlyCost!==CFG.tuning_engine.audit__088||!Number.isFinite(b.totalUpkeep)||b.totalUpkeep<0)problems.push(c.id+': invalid in-house film facility');
    if(s.projects.filter(p=>p.status==='active'&&p.companyId===c.id&&p.cinema?.facilities==='owned').length>1)problems.push(c.id+': owned film studio double-booked');}
  const activeCast=new Set();
  for(const p of s.projects.filter(p=>p.sector==='movie')){
    const f=p.cinema;
    if(!f||!FILM_METHODS.includes(f.method)||!['G','T','M'].includes(f.rating)||!FILM_DISTRIBUTION.includes(f.distribution)||
      !Array.isArray(f.actions)||!Array.isArray(f.screenings)||!Array.isArray(f.weeklyBoxOffice)||
      f.weeklyBoxOffice.some(x=>!Number.isInteger(x.week)||x.week<p.releaseWeek&&p.releaseWeek!==null||x.week>s.week||
        !REGIONS.some(r=>r.name===x.region)||!Number.isFinite(x.gross)||x.gross<0||!Number.isInteger(x.estimatedAdmissions)||x.estimatedAdmissions<0)||!Array.isArray(f.auditions)||!Array.isArray(f.disruptions)||
      f.disruptions.some(d=>!Number.isInteger(d.week)||d.week<p.startWeek||d.week>s.week||!Number.isFinite(d.cost)||d.cost<0||d.delay!==CFG.tuning_engine.audit__089)||!Number.isFinite(f.castPaid)||f.castPaid<0||
      !Number.isFinite(f.castShare)||f.castShare<0||f.castShare>CFG.tuning_engine.audit__090||!Number.isFinite(f.castFee)||f.castFee<0||
      Object.values(f.boxOffice||{}).some(n=>!Number.isFinite(n)||n<0)||
      Object.values(f.admissions||{}).some(n=>!Number.isInteger(n)||n<0)||
      Object.values(f.channels||{}).some(n=>!Number.isFinite(n)||n<0)||
      money(Object.values(f.boxOffice||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+CFG.tuning_engine.audit__091||
      money(Object.values(f.channels||{}).reduce((a,b)=>a+b,0))>p.stats.totalSales+CFG.tuning_engine.audit__092)
      problems.push(p.id+': invalid film production/box office records');
    if(f?.facilities==='owned'&&!company(s,p.companyId)?.filmBacklot)problems.push(p.id+': unowned production facility');
    if(f?.premiere&&(!REGIONS.some(r=>r.name===f.premiere.region)||f.premiere.week> s.week||f.premiere.week<p.startWeek||f.premiere.cost!==CFG.tuning_engine.audit__093))problems.push(p.id+': invalid film premiere');
    if(f?.castActorId){const a=s.filmActors.find(a=>a.id===f.castActorId);
      if(!a||(p.status==='active'&&a.busyProjectId!==p.id)||p.status!=='active'&&a.busyProjectId===p.id||
        p.status==='active'&&activeCast.has(a.id))problems.push(p.id+': invalid cast exclusivity');
      if(p.status==='active')activeCast.add(f.castActorId);
    }
  }
  for(const a of s.filmActors||[])if(a.busyProjectId&&!s.projects.some(p=>p.id===a.busyProjectId&&p.status==='active'&&(p.sector==='movie'&&p.cinema?.castActorId===a.id||p.sector==='tv'&&p.television?.castActorId===a.id)))problems.push(a.id+': unbacked screen talent exclusivity');
  for(const a of s.filmHonors||[])if(!s.projects.some(p=>p.id===a.projectId&&p.sector==='movie'&&p.status==='released'&&yearAt(p.releaseWeek)===a.year&&p.cinema?.festival?.won)||a.week>s.week)problems.push('Invalid film festival award provenance');
  auditTelevision(s,problems);auditVideoGames(s,problems);
  return problems;}