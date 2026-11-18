
function loadState(raw){const s=typeof raw==='string'?JSON.parse(raw):raw;
  const oldVersion=s?.version;
  migrate43(s,oldVersion);
  if(s&&oldVersion>=1&&oldVersion<CFG.tuning_engine.loadState__001)initialGovernance(s);
  if([1,CFG.tuning_engine.loadState__002,CFG.tuning_engine.loadState__003,CFG.tuning_engine.loadState__004,CFG.tuning_engine.loadState__005,CFG.tuning_engine.loadState__006,CFG.tuning_engine.loadState__007,CFG.tuning_engine.loadState__008,CFG.tuning_engine.loadState__009,CFG.tuning_engine.loadState__010,CFG.tuning_engine.loadState__011,CFG.tuning_engine.loadState__012].includes(oldVersion)){
    s.rightsOffers=[];s.creativeApprovals=[];s.rightsPolicy={autoRenew:false,maxFee:CFG.tuning_engine.loadState__013,extensionWeeks:CFG.tuning_engine.loadState__014};
    for(const g of s.grants||[]){
      g.exerciseFee=CFG.tuning_engine.loadState__015;g.exerciseFeePaid=0;g.optionExpiresWeek=g.type==='option'?g.endWeek:null;
      g.exercisedWeek=null;g.approvalRequired=false;g.renewalHistory=[];
    }
  }
  if([1,CFG.tuning_engine.loadState__016,CFG.tuning_engine.loadState__017,CFG.tuning_engine.loadState__018,CFG.tuning_engine.loadState__019,CFG.tuning_engine.loadState__020,CFG.tuning_engine.loadState__021,CFG.tuning_engine.loadState__022,CFG.tuning_engine.loadState__023,CFG.tuning_engine.loadState__024,CFG.tuning_engine.loadState__025].includes(oldVersion)){
    s.royaltyAccounts=[];
    for(const g of s.grants||[]){g.recoupableAdvance=0;g.royaltyHistoryComplete=false;}
    for(const o of s.obligations||[]){
      const p=(s.projects||[]).find(p=>p.id===o.projectId);
      const g=(s.grants||[]).find(g=>g.id===p?.grantId);
      if(!g)continue; // source/creditor provenance is validated below
      let a=s.royaltyAccounts.find(a=>a.grantId===g.id&&a.projectId===p.id);
      if(!a){a={id:id(s,'royaltyaccount'),grantId:g.id,projectId:p.id,debtorId:o.debtorId,
        creditorId:o.creditorId,createdWeek:s.week,updatedWeek:s.week,openingOutstanding:0,
        salesBase:0,accrued:0,recouped:0,paid:0,outstanding:0,historyComplete:false};s.royaltyAccounts.push(a);}
      a.openingOutstanding=money(a.openingOutstanding+o.amount);
      a.outstanding=money(a.outstanding+o.amount);o.accountId=a.id;o.grantId=g.id;
    }
  }
  if([1,CFG.tuning_engine.loadState__026,CFG.tuning_engine.loadState__027,CFG.tuning_engine.loadState__028,CFG.tuning_engine.loadState__029,CFG.tuning_engine.loadState__030,CFG.tuning_engine.loadState__031,CFG.tuning_engine.loadState__032,CFG.tuning_engine.loadState__033,CFG.tuning_engine.loadState__034].includes(oldVersion)){
    // The old bounded journal cannot prove duty allocation for an in-flight
    // month. No historic amounts or balances are invented during migration.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      c.finance.periodDuty=emptyDutyFlows();c.finance.periodDutyOpening={tax:0,royalty:0,interest:0};
      c.finance.periodDutyComplete=false;
      if(!c.homeRegion)c.homeRegion=REGIONS[0].name;
    }
  }
  if([1,CFG.tuning_engine.loadState__035,CFG.tuning_engine.loadState__036,CFG.tuning_engine.loadState__037,CFG.tuning_engine.loadState__038,CFG.tuning_engine.loadState__039,CFG.tuning_engine.loadState__040,CFG.tuning_engine.loadState__041].includes(oldVersion)){
    // Existing current-month activity predates transaction cash classification.
    // Carry the exact balance, mark ONLY the first closing incomplete, and
// start a complete period from the next monthly boundary.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      resetPeriodBridge(c.finance);c.finance.periodHistoryComplete=false;
    }
  }
  if([1,CFG.tuning_engine.loadState__042,CFG.tuning_engine.loadState__043,CFG.tuning_engine.loadState__044,CFG.tuning_engine.loadState__045,CFG.tuning_engine.loadState__046].includes(oldVersion)){
    s.loans=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.loanBalance=0;c.finance.interestPayable=0;}
  }
  if([1,CFG.tuning_engine.loadState__047,CFG.tuning_engine.loadState__048,CFG.tuning_engine.loadState__049,CFG.tuning_engine.loadState__050].includes(oldVersion)){
    for(const c of s.companies||[]){c.parentId=null;c.investedCapital=0;}
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.investment=0;c.finance.internalRevenue=0;c.finance.internalExpense=0;}
  }
  if([1,CFG.tuning_engine.loadState__051,CFG.tuning_engine.loadState__052,CFG.tuning_engine.loadState__053].includes(oldVersion)){
    // No fabricated retroactive allocations or rights income: earlier records
    // remain complete for their own cash/direct result, not the new breakdown.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){c.finance.overheadBooked=0;c.finance.overheadAttributed=0;}
    for(const p of s.projects||[]){p.overheadAttributed=0;p.overheadHistoryComplete=false;}
    for(const ip of s.ips||[]){ip.rightsIncome=0;ip.rightsHistoryComplete=false;}
  }
  if([1,CFG.tuning_engine.loadState__054,CFG.tuning_engine.loadState__055].includes(oldVersion)){
    // Legacy sales already arrived in cash, and must NOT be re-invoiced.
    s.remittances=[];
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance)c.finance.receivable=0;
  }
  if([1,CFG.tuning_engine.loadState__056,CFG.tuning_engine.loadState__057,CFG.tuning_engine.loadState__058,CFG.tuning_engine.loadState__059,CFG.tuning_engine.loadState__060,CFG.tuning_engine.loadState__061,CFG.tuning_engine.loadState__062].includes(oldVersion)){
    // Old works had no print register; NEVER create a fictitious asset or
    // retroactively cap sales of a title already published under the old model.
    for(const c of [...(s.companies||[]),...(s.backgroundFirms||[])])if(c.finance){
      if(!Number.isFinite(c.finance.inventory))c.finance.inventory=0;
      if(c.finance.periodOpening&&!Number.isFinite(c.finance.periodOpening.inventory))c.finance.periodOpening.inventory=0;
    }
    for(const r of s.reports||[])if(r.balance&&!Number.isFinite(r.balance.inventory))r.balance.inventory=0;
    for(const p of s.projects||[])if(!('printStock' in p))p.printStock=null;
  }
  if([1,CFG.tuning_engine.loadState__063,CFG.tuning_engine.loadState__064,CFG.tuning_engine.loadState__065,CFG.tuning_engine.loadState__066,CFG.tuning_engine.loadState__067,CFG.tuning_engine.loadState__068,CFG.tuning_engine.loadState__069,CFG.tuning_engine.loadState__070].includes(oldVersion))for(const p of s.projects||[])if(p.printStock){
    if(typeof p.printStock.autoReprint!=='boolean')p.printStock.autoReprint=true;
    if(!Array.isArray(p.printStock.returnQueue))p.printStock.returnQueue=[];
    if(!Number.isFinite(p.printStock.returnFraction))p.printStock.returnFraction=0;
    if(typeof p.printStock.closed!=='boolean')p.printStock.closed=false;
    if(!Number.isFinite(p.printStock.demandEwma))p.printStock.demandEwma=0;
  }
  if(!Array.isArray(s.gameExclusiveOffers))s.gameExclusiveOffers=[];
  if(!Array.isArray(s.gameStores))s.gameStores=[];if(!Array.isArray(s.gameStoreOffers))s.gameStoreOffers=[];if(!Array.isArray(s.gameStoreWindows))s.gameStoreWindows=[];if(!Array.isArray(s.gameCommunityHistory))s.gameCommunityHistory=[];
  for(const p of s.projects||[])if(p.sector==='games'&&!p.videoGame){p.videoGame=gameDefault(p,p.startWeek);p.videoGame.historyComplete=false;}
  if(!Array.isArray(s.tvHonors))s.tvHonors=[];
  if(!Array.isArray(s.tvCastRelations))s.tvCastRelations=[];
  if(!Array.isArray(s.streamingServices))s.streamingServices=[];
  if(!Array.isArray(s.streamingWindows))s.streamingWindows=[];
  if(!Array.isArray(s.streamingOffers))s.streamingOffers=[];
  for(const p of s.projects||[])if(p.sector==='tv'){
   if(!p.television){p.television=tvDefault(p);p.television.ratingsHistoryComplete=false;}
   if(!p.television.viewersByCohort){p.television.viewersByCohort={};p.television.audienceCohortHistoryComplete=false;}
 }
  if(s?.projects)for(const p of s.projects){
    if(!Number.isFinite(p.plannedTotal))p.plannedTotal=money(p.budget+p.marketingBudget);
    if(!Number.isFinite(p.budgetMultiplier))p.budgetMultiplier=1;
    if(!('productionSpend' in p)){p.productionSpend=p.status==='active'?p.directCost:null;p.budgetHistoryComplete=p.status==='active';}
    if(typeof p.budgetHistoryComplete!=='boolean')p.budgetHistoryComplete=p.productionSpend!==null;
    if(typeof p.budgetAlerted!=='boolean')p.budgetAlerted=false;
    if(!Number.isFinite(p.periodProductionSpend))p.periodProductionSpend=0;
    if(!Number.isFinite(p.lastClosedPlannedSpend))p.lastClosedPlannedSpend=plannedProjectSpend(p)||0;
    if(typeof p.budgetCloseComplete!=='boolean')p.budgetCloseComplete=false;
  }
  if(s&&!Array.isArray(s.archivedNews))s.archivedNews=[];
  if(s&&!Array.isArray(s.backgroundFirms))s.backgroundFirms=[]; // older v3 worlds remain intact
  if(s?.settings&&!WORLD_SCALES[s.settings.worldScale])s.settings.worldScale=1;
  if(s?.settings){
    if(!CAPITAL_PRESETS[s.settings.startingCapital])s.settings.startingCapital='standard';
    if(!WORLD_MATURITY[s.settings.worldMaturity])s.settings.worldMaturity='standard';
    if(!Number.isInteger(s.settings.aiCount)||s.settings.aiCount<1||s.settings.aiCount>CFG.tuning_engine.loadState__071)s.settings.aiCount=DEFAULT_RIVAL_COUNTS[s.startedYear]||CFG.tuning_engine.loadState__072;
    if(!POPULATION_SCALES.includes(s.settings.populationScale))s.settings.populationScale=1;
    if(![CFG.tuning_engine.loadState__073,CFG.tuning_engine.loadState__074,CFG.tuning_engine.loadState__075].includes(s.settings.regionCount))s.settings.regionCount=CFG.tuning_engine.loadState__076;
    if(!TECH_PACES[s.settings.discoveryPace])s.settings.discoveryPace='standard';
    if(!ADOPTION_PACES[s.settings.adoptionPace])s.settings.adoptionPace='standard';
    if(!CAPABILITY_PACES[s.settings.capabilityPace])s.settings.capabilityPace='standard';
  }
  // v15 and earlier funded jobs keep their original advance/final split.
  // Never fabricate a halfway payment into preexisting balance sheets.
  for(const e of s.escrows||[]){
    if(!Number.isFinite(e.milestonePaid))e.milestonePaid=0;
    if(typeof e.milestoneDone!=='boolean')e.milestoneDone=false;
    if(!Number.isFinite(e.milestoneAt))e.milestoneAt=0;
  }
  if(oldVersion<CFG.tuning_engine.loadState__077&&Array.isArray(s.projects))for(const p of s.projects){
    p.creativeHistoryComplete=false; // legacy project choices were never recorded; do not invent them
    if(!('pitch' in p))p.pitch=null;
    if(!('creativeQuality' in p))p.creativeQuality=null;
    if(!('technicalQuality' in p))p.technicalQuality=null;
    if(!('creativeHistoryComplete' in p))p.creativeHistoryComplete=false;
    if(!('phase' in p))p.phase=null;
    if(!('phaseHistory' in p))p.phaseHistory=[];
    if(!('criticScore' in p))p.criticScore=null;
    if(!('audienceScore' in p))p.audienceScore=null;
  }
  for(const p of s.projects||[]){if(!Array.isArray(p.interventions))p.interventions=[];if(!Array.isArray(p.teamChanges))p.teamChanges=[];}
  if(!Array.isArray(s.specialists))s.specialists=[];
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee))s.talentPolicy={autoBook:false,maxFee:CFG.tuning_engine.loadState__078};
  seedSpecialists(s);
  for(const x of s.specialists)if(x.assignedProjectId===undefined)x.assignedProjectId=null;
  for(const p of s.projects||[]){if(p.holdUntilWeek===undefined)p.holdUntilWeek=null;if(!Array.isArray(p.releasePlanHistory))p.releasePlanHistory=[];if(p.specialistId===undefined)p.specialistId=null;if(!Array.isArray(p.specialistAppointments))p.specialistAppointments=[];}
  if(!s.franchiseNotes||typeof s.franchiseNotes!=='object')s.franchiseNotes={};
  if(!['operations','finance','franchise'].includes(s.dashboardFocus))s.dashboardFocus='operations';
  if(!s.pausePolicy||typeof s.pausePolicy.stopForAdvisory!=='boolean')s.pausePolicy={stopForAdvisory:false};
  for(const c of s.companies||[]){if(!('annualBaseline' in c))c.annualBaseline=null;for(const t of c.teams||[]){if(!Array.isArray(t.trainingHistory))t.trainingHistory=[];if(!Array.isArray(t.performanceHistory))t.performanceHistory=[];}}
  // A pre-team v1/v2 save has no existing employee roster. Do not keep
  // orphaned modern leader IDs from a synthetic old-save fixture.
  if(oldVersion<=CFG.tuning_engine.loadState__079&&s.companies.some(c=>!Array.isArray(c.teams)))s.employees=[];
  if(!Array.isArray(s.employees))s.employees=[];if(!Array.isArray(s.candidates))s.candidates=[];
  for(const c of s.companies||[]){
    if(!CULTURES.includes(c.culture))c.culture='balanced';
    if(!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean')c.staffPolicy={autoFill:true,maxSalary:CFG.tuning_engine.loadState__080};
    if(!Array.isArray(c.imprints))c.imprints=[];
    for(const t of c.teams||[])if(!t.leaderId){assignInitialLeader(s,c,t,true);}
  }
  if(oldVersion<CFG.tuning_engine.loadState__081)seedCandidates(s,CFG.tuning_engine.loadState__082);
  if(!FOUNDER_BACKGROUNDS.includes(s.founder.background))s.founder.background='editorial';
  if(!FOUNDER_FOCUSES.includes(s.founder.focus))s.founder.focus='creative';
  if(!Number.isInteger(s.founder.ageAtEntry))s.founder.ageAtEntry=s.founder.age;
  if(!Number.isInteger(s.founder.enteredWeek))s.founder.enteredWeek=s.week;
  if(!Number.isInteger(s.founder.experience))s.founder.experience=0;
  if(typeof s.founder.retirementNoted!=='boolean')s.founder.retirementNoted=false;
  for(const x of s.snapshots||[]){if(!('historyComplete' in x))x.historyComplete=false;if(!('annualRevenue' in x))x.annualRevenue=null;if(!('annualExpense' in x))x.annualExpense=null;if(!('annualProfit' in x))x.annualProfit=null;}

  if(!Array.isArray(s.filmActors))s.filmActors=[];if(!Array.isArray(s.filmHonors))s.filmHonors=[];
  for(const p of s.projects||[])if(p.sector==='movie'&&!p.cinema){p.cinema=filmDefault(p);p.cinema.historyComplete=false;}
  for(const c of s.companies)if(c.filmBacklot===undefined)c.filmBacklot=null;
  for(const p of s.projects||[])if(p.sector==='movie'&&p.cinema&&!Array.isArray(p.cinema.disruptions))p.cinema.disruptions=[];
  for(const p of s.projects||[])if(p.sector==='movie'&&p.cinema){if(!Array.isArray(p.cinema.weeklyBoxOffice)){p.cinema.weeklyBoxOffice=[];p.cinema.boxOfficeHistoryComplete=false;}if(!Array.isArray(p.cinema.auditions))p.cinema.auditions=[];}
  if(!Array.isArray(s.manuscripts))s.manuscripts=[];
  if(!Array.isArray(s.manuscriptOffers))s.manuscriptOffers=[];
  if(oldVersion<CFG.tuning_engine.loadState__083){
    s.publishingOutlet=null;
    for(const m of s.manuscripts){if(!Number.isFinite(m.agencyRate))m.agencyRate=0;if(typeof m.creatorApprovalRequired!=='boolean')m.creatorApprovalRequired=false;}
    for(const offer of s.manuscriptOffers){for(const terms of [offer.proposal,offer.counter])if(terms){if(!Number.isFinite(terms.agencyRate))terms.agencyRate=0;if(typeof terms.approvalRequired!=='boolean')terms.approvalRequired=false;}}
    for(const g of s.grants){if(!Number.isFinite(g.agentRate))g.agentRate=0;if(!Number.isFinite(g.agentFeesPaid))g.agentFeesPaid=0;}
  }
  for(const p of s.projects||[]){
    if(p.publishingChannel===undefined)p.publishingChannel=p.sector==='publishing'?(isPrintEdition(p)?'mixed':'digital'):null;
    if(p.serialCadence===undefined)p.serialCadence=p.sector==='publishing'&&p.format==='Web Serial'?'steady':null;
    if(!p.salesByRegion)p.salesByRegion={};if(!p.salesByChannel)p.salesByChannel={};
    if(!p.salesUnitsByRegion)p.salesUnitsByRegion={};if(!p.salesUnitsByChannel)p.salesUnitsByChannel={};
    if(oldVersion<CFG.tuning_engine.loadState__084){p.salesUnitsByAudience={};p.audienceUnitHistoryComplete=false;}
    else {if(!p.salesUnitsByAudience)p.salesUnitsByAudience={};if(typeof p.audienceUnitHistoryComplete!=='boolean')p.audienceUnitHistoryComplete=false;}
    if(!Array.isArray(p.publishingUnitHistory))p.publishingUnitHistory=[];
    if(typeof p.publishingUnitHistoryComplete!=='boolean')p.publishingUnitHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__085;
    if(!Number.isFinite(p.serialReaderMomentum))p.serialReaderMomentum=1;
    if(!Array.isArray(p.serialEngagementHistory))p.serialEngagementHistory=[];
    if(!Array.isArray(p.serialArcDecisions))p.serialArcDecisions=[];
    if(!Array.isArray(p.publishingFormatHistory))p.publishingFormatHistory=[];if(!Array.isArray(p.translations))p.translations=[];
    if(!('preorderCampaign' in p))p.preorderCampaign=null;if(!('imprintId' in p))p.imprintId=null;
    if(typeof p.publishingSalesHistoryComplete!=='boolean')p.publishingSalesHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__086;
  }
  if(!Array.isArray(s.creatorScouting))s.creatorScouting=[];
  for(const t of s.specialists||[]){if(t.creatorRole===undefined)t.creatorRole=null;if(!Array.isArray(t.mentorshipHistory))t.mentorshipHistory=[];}
  if(!Array.isArray(s.creativeAwards))s.creativeAwards=[];
  if(!Array.isArray(s.creatorRelations))s.creatorRelations=[];
  if(typeof s.creatorHistoryComplete!=='boolean')s.creatorHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__087;
  for(const p of s.projects||[]){
    if(!Array.isArray(p.editorialHistory))p.editorialHistory=[];
    if(typeof p.editorialHistoryComplete!=='boolean')p.editorialHistoryComplete=oldVersion>=CFG.tuning_engine.loadState__088;
    if(!Array.isArray(p.creatorCredits))p.creatorCredits=[];
  }
  if(oldVersion<CFG.tuning_engine.loadState__089)for(const p of s.projects||[]){if(!('franchiseBranch' in p))p.franchiseBranch=null;if(!('franchiseHistoryComplete' in p))p.franchiseHistoryComplete=false;if(!('leadCharacter' in p))p.leadCharacter='';}
  if(!Array.isArray(s.coProductions))s.coProductions=[];
  if(!Array.isArray(s.coProductionOffers))s.coProductionOffers=[];
  if(!s.coProductionPolicy)s.coProductionPolicy={autoCounter:false,maxCommitment:CFG.tuning_engine.loadState__090,maxShare:CFG.tuning_engine.loadState__091};
  for(const d of s.coProductions)if(!('offerId' in d))d.offerId=null;
  if(!Array.isArray(s.commissionOffers))s.commissionOffers=[];
  if(!Array.isArray(s.commissionHistory))s.commissionHistory=[];
  if(!s.commissionPolicy)s.commissionPolicy={autoCounter:false,maxFee:CFG.tuning_engine.loadState__092,minMargin:CFG.tuning_engine.loadState__093};
  // v35: pre-depth saves become the default depth (old saves were test-only; owner decision 2026-11-18).
  if(s.settings&&!DEPTH_MODES.includes(s.settings.depth)&&s.pausePolicy&&s.talentPolicy&&s.rightsPolicy)setDepth(s,CFG.depth.DEFAULT);
  // v36: yearly Inbox decision-card log (depth modes D3); older saves start an empty log for the current year.
  if(!s.decisionCards&&Number.isInteger(s.week))s.decisionCards={year:yearAt(s.week),cards:0,low:0,auto:0};
  // v37: Board Reputation (depth modes step 2 B1) plus empty fields for B4 milestones. Old incorporated studios start at 50; only titles released later count.
  if(s.settings&&Number.isInteger(s.week)){
    for(const c of s.companies||[])if(c.corporate&&c.corporate.boardRep===undefined)c.corporate.boardRep=c.corporate.board?boardRepNew(s):null;
    for(const p of s.projects||[])if(!p.repMilestones)p.repMilestones={};
    if(!s.studioMilestones)s.studioMilestones={};if(!Array.isArray(s.legends))s.legends=[];
  }
  // v38: release reception roll (R1). Titles released before v38 keep their old sales (no reception, multiplier 1).
  for(const p of s.projects||[])if(p.reception===undefined)p.reception=null;
  if(!s.regionalEconomy)s.regionalEconomy=Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:CFG.tuning_engine.loadState__094,employment:1}]));
  for(const r of REGIONS){
    if(!s.regionalEconomy[r.name])s.regionalEconomy[r.name]={confidence:1,inflation:CFG.tuning_engine.loadState__095,employment:1};
    const v=s.regionalEconomy[r.name];
    if(!Number.isFinite(v.fxRate))v.fxRate=r.baseFx;
    if(!Number.isFinite(v.wageIndex))v.wageIndex=1;
    if(!Number.isFinite(v.interestIndex))v.interestIndex=1;
  }
  if(!Array.isArray(s.economicShocks))s.economicShocks=[];
  if(s?.companies)for(const c of s.companies){
    if(!c.research)c.research={};
    if(!c.techLicenses)c.techLicenses={};
  }

  if(!Array.isArray(s.marketBriefs))s.marketBriefs=[];
  if(!Array.isArray(s.quarterlyMarketReports))s.quarterlyMarketReports=[];
  if(!s.technology)s.technology={historyComplete:false};
  if(s?.companies)for(const c of [...s.companies,...(s.backgroundFirms||[])]) {
    if(!Number.isFinite(c.finance?.taxPayable))c.finance.taxPayable=0;
    if(!Number.isFinite(c.finance?.creditCarry))c.finance.creditCarry=0;
    if(!Number.isFinite(c.finance?.periodCreditEarned))c.finance.periodCreditEarned=0;
  } // compatible additive v3 history
  if(s&&(s.version===1||s.version===CFG.tuning_engine.loadState__096)&&Array.isArray(s.projects)){
    for(const p of s.projects){if(!('forecast' in p))p.forecast=null;if(!('review' in p))p.review=null;if(!('clientId' in p))p.clientId=null;if(!('escrowId' in p))p.escrowId=null;if(!('teamId' in p))p.teamId=null;}
    if(!s.escrows)s.escrows=[];
    for(const c of s.companies){if(!Number.isFinite(c.finance.prepaid))c.finance.prepaid=0;
      if(!Array.isArray(c.teams)){c.teams=[];for(let i=0;i<c.capacity;i++)c.teams.push(newTeam(s,c,i));}
      const active=s.projects.filter(p=>p.companyId===c.id&&p.status==='active');
      for(let i=0;i<active.length;i++)if(!active[i].teamId&&c.teams[i])active[i].teamId=c.teams[i].id;
    }
    // Historical abstract commissions retain their previous cash and deferred balances;
    // migration must not invent a retroactive client transfer or change earned revenue.
    s.version=SAVE_VERSION;
  }
  if(oldVersion>=1&&oldVersion<CFG.tuning_engine.loadState__097)s.version=SAVE_VERSION;
  if(!s||s.version!==SAVE_VERSION||!Array.isArray(s.companies)||!Array.isArray(s.backgroundFirms)||!Array.isArray(s.remittances)||!Array.isArray(s.loans)||!Array.isArray(s.projects)||!Array.isArray(s.ips)||!Array.isArray(s.grants)||!Array.isArray(s.commissionOffers)||!Array.isArray(s.commissionHistory)||!Array.isArray(s.coProductions)||!Array.isArray(s.coProductionOffers)||!Array.isArray(s.rightsOffers)||!Array.isArray(s.creativeApprovals)||!Array.isArray(s.ledger)||!Array.isArray(s.obligations)||!Array.isArray(s.royaltyAccounts)||!Array.isArray(s.escrows)||!Array.isArray(s.news)||!Array.isArray(s.inbox)||!Array.isArray(s.works)||!Array.isArray(s.reports)||!Number.isInteger(s.week)||!s.companies.some(c=>c.id===s.playerId)||![...s.companies,...s.backgroundFirms].every(c=>c.finance&&Number.isFinite(c.finance.cash)&&Number.isFinite(c.finance.prepaid)&&Number.isFinite(c.finance.receivable)&&Number.isFinite(c.finance.equity))||!Number.isInteger(s.rng))throw new Error('This is not a supported Studio Syndicate prototype save.');
  if(audit(s).length)throw new Error('Save integrity check failed: '+audit(s)[0]);return s;}