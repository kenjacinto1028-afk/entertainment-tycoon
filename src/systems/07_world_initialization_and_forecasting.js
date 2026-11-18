

function createGame(input={}) {
  const era=[1,CFG.tuning_engine.era__001,CFG.tuning_engine.era__002,CFG.tuning_engine.era__003,CFG.tuning_engine.era__004].includes(Number(input.era))?Number(input.era):1;
  let origin=ORIGINS[input.origin]?input.origin:'publisher';
  if(SECTORS[ORIGINS[origin].sector].year>era)origin='publisher';
  const seed=String(input.seed||'STUDIO-114');const s={version:SAVE_VERSION,seed,rng:hash(seed),sequence:0,week:(era-1)*CFG.tuning_engine.s__001,startedYear:era,playerId:null,settings:{difficulty:['casual','standard','challenging'].includes(input.difficulty)?input.difficulty:'standard',era,origin,
    worldScale:WORLD_SCALES[Number(input.worldScale)]?Number(input.worldScale):1,
    startingCapital:CAPITAL_PRESETS[input.startingCapital]?input.startingCapital:'standard',
    worldMaturity:WORLD_MATURITY[input.worldMaturity]?input.worldMaturity:'standard',
    aiCount:Number.isInteger(Number(input.aiCount))&&input.aiCount!==undefined&&String(input.aiCount)!==''?clamp(Number(input.aiCount),1,CFG.tuning_engine.s__002):DEFAULT_RIVAL_COUNTS[era],
    populationScale:POPULATION_SCALES.includes(Number(input.populationScale))?Number(input.populationScale):1,
    regionCount:[CFG.tuning_engine.s__003,CFG.tuning_engine.s__004,CFG.tuning_engine.s__005].includes(Number(input.regionCount))?Number(input.regionCount):CFG.tuning_engine.s__006,
    discoveryPace:TECH_PACES[input.discoveryPace]?input.discoveryPace:'standard',
    adoptionPace:ADOPTION_PACES[input.adoptionPace]?input.adoptionPace:'standard',
    capabilityPace:CAPABILITY_PACES[input.capabilityPace]?input.capabilityPace:'standard'},
    regionalEconomy:Object.fromEntries(REGIONS.map(r=>[r.name,{confidence:1,inflation:CFG.tuning_engine.s__007,employment:1,fxRate:r.baseFx,wageIndex:1,interestIndex:1}])),economicShocks:[],technology:{historyComplete:true},marketBriefs:[],quarterlyMarketReports:[],companies:[],backgroundFirms:[],employees:[],candidates:[],specialists:[],creativeAwards:[],creatorRelations:[],creatorScouting:[],creatorHistoryComplete:true,filmActors:[],filmHonors:[],gameStores:[],gameStoreOffers:[],gameStoreWindows:[],gameMarketReserved:{},gameCommunityHistory:[],gameExclusiveOffers:[],tvHonors:[],tvCastRelations:[],streamingServices:[],streamingWindows:[],streamingOffers:[],streamingWeeklyReserved:{},streamingWeeklyTotal:0,talentPolicy:{autoBook:false,maxFee:CFG.tuning_engine.s__008},remittances:[],loans:[],projects:[],manuscripts:[],manuscriptOffers:[],ips:[],franchiseNotes:{},grants:[],rightsOffers:[],creativeApprovals:[],rightsPolicy:{autoRenew:false,maxFee:CFG.tuning_engine.s__009,extensionWeeks:CFG.tuning_engine.s__010},commissionPolicy:{autoCounter:false,maxFee:CFG.tuning_engine.s__011,minMargin:CFG.tuning_engine.s__012},commissionOffers:[],commissionHistory:[],coProductions:[],coProductionOffers:[],coProductionPolicy:{autoCounter:false,maxCommitment:CFG.tuning_engine.s__013,maxShare:CFG.tuning_engine.s__014},works:[],obligations:[],royaltyAccounts:[],escrows:[],news:[],archivedNews:[],inbox:[],ledger:[],reports:[],snapshots:[],dashboardFocus:'operations',pausePolicy:{stopForAdvisory:false},macroeconomy:1,weeklyConsumerSpend:0,founder:{id:'founder_0',name:(String(input.founder||'Alex Morgan').trim().slice(0,CFG.tuning_engine.s__015)||'Alex Morgan'),age:clamp(Number(input.age)||CFG.tuning_engine.s__016,CFG.tuning_engine.s__017,CFG.tuning_engine.s__018),ageAtEntry:clamp(Number(input.age)||CFG.tuning_engine.s__019,CFG.tuning_engine.s__020,CFG.tuning_engine.s__021),enteredWeek:(era-1)*CFG.tuning_engine.s__022,background:FOUNDER_BACKGROUNDS.includes(input.background)?input.background:'editorial',focus:FOUNDER_FOCUSES.includes(input.founderFocus)?input.founderFocus:'creative',experience:0,retirementNoted:false},worldStory:[]};
  const config=ORIGINS[origin],cash=money(config.cash * CAPITAL_PRESETS[s.settings.startingCapital] * (s.settings.difficulty==='casual'?CFG.tuning_engine.cash__001:s.settings.difficulty==='challenging'?CFG.tuning_engine.cash__002:1));
  const c=createCompany(s,{name:String(input.companyName||'Syndicate Works').trim().slice(0,CFG.tuning_engine.c__004)||'Syndicate Works',sector:config.sector,origin:config.name,cash,reputation:config.reputation,capacity:origin==='established'?CFG.tuning_engine.c__005:CFG.tuning_engine.c__006,foundedYear:era,homeRegion:input.homeRegion,isPlayer:true});s.playerId=c.id;
  // The four publishing origins change early staffing, payroll commitments and
  // creative focus without inheriting another company's property or rights.
  c.originWeeklyCommitment=config.weeklyCommitment||0;
  c.preferredFormat=config.preferredFormat||FORMATS[config.sector][0];
  if(config.teamGenres)for(let i=0;i<c.teams.length;i++){
    c.teams[i].specialty=config.teamGenres[i%config.teamGenres.length];
    c.teams[i].skill=Math.min(CFG.tuning_engine.createGame__001,c.teams[i].skill+(origin==='comics'||origin==='contract'?CFG.tuning_engine.createGame__002:0));
  }
  s.founder.id=id(s,'person');
  initialGovernance(s);
  seedRivals(s,era);
  for(const sec of Object.keys(SECTORS))if(available(sec,s.week))addBackgroundFirms(s,sec,era);
  if(era>1){
    for(const [sector,info] of Object.entries(SECTORS)) if(info.year<=era) {
      const label='Y'+info.year+': '+info.name+' emerged';s.worldStory.push({year:info.year,text:label,source:'Generated prehistory'});
    }
    s.worldStory.push({year:era,text:c.name+' founded independently in '+config.sector,source:'Played history'});
  }
  news(s,'Welcome to '+c.name,era===1?'A small literary firm opens its doors in a publishing-first world. Make your mark, one release at a time.':'A new studio launches into an established Year '+era+' entertainment market. It has no inherited rival assets.','company');
  if(era===1)news(s,CFG.events.messages.createGame__001,CFG.events.messages.createGame__002,'world');
  seedSpecialists(s);
  seedCandidates(s,CFG.tuning_engine.createGame__003);
  prepare43World(s,input);
  setDepth(s,DEPTH_MODES.includes(input.depth)?input.depth:CFG.depth.DEFAULT);
  s.decisionCards={year:yearAt(s.week),cards:0,low:0,auto:0};
  s.studioMilestones={};s.legends=[];
  return s;
}
function seedRivals(s,era) {
  const categories=CFG.world.RIVAL_INITIAL_SECTOR_WEIGHTS;
  const availableCategories=categories.filter(sector=>SECTORS[sector].year<=era);
  const limit=s.settings.aiCount||DEFAULT_RIVAL_COUNTS[era];
  for(let i=0;i<limit;i++) {
    const sector=availableCategories[i%availableCategories.length],start=SECTORS[sector].year,originYear=Math.max(start,era-Math.floor(rand(s)*CFG.tuning_engine.originYear__001));
    const cash=money((CFG.tuning_engine.cash__003+rand(s)*(sector==='publishing'?CFG.tuning_engine.cash__004:CFG.tuning_engine.cash__005))*WORLD_MATURITY[s.settings.worldMaturity]);
    const c=createCompany(s,{name:AI_NAMES[i]||('Fictional Studio '+(i+1)),sector,foundedYear:originYear,cash,reputation:clamp(Math.round((CFG.tuning_engine.c__007+rand(s)*CFG.tuning_engine.c__008)*WORLD_MATURITY[s.settings.worldMaturity])+(s.settings.difficulty==='challenging'?CFG.tuning_engine.c__009:s.settings.difficulty==='casual'?-CFG.tuning_engine.c__010:0),CFG.tuning_engine.c__011,CFG.tuning_engine.c__012),capacity:1+Math.floor(rand(s)*CFG.tuning_engine.c__013),homeRegion:REGIONS[i%REGIONS.length].name});
    if(era>1)s.worldStory.push({year:originYear,text:c.name+' founded ('+SECTORS[sector].name+')',source:'Generated prehistory'});
  }
}
function sectorCost(sector,size=1,format='') {
  const factor=format==='Web Serial'?CFG.tuning_engine.factor__001:format==='Comic / Manga'?CFG.tuning_engine.factor__002:format==='Nonfiction'?CFG.tuning_engine.factor__003:format==='Ebook'?CFG.tuning_engine.factor__004:format==='Audiobook'?CFG.tuning_engine.factor__005:format==='Animated Film'?CFG.tuning_engine.factor__006:format==='Miniseries'?CFG.tuning_engine.factor__007:format==='Indie Game'?CFG.tuning_engine.factor__008:1;
  return Math.round(SECTORS[sector].cost*factor*size/CFG.tuning_engine.sectorCost__001)*CFG.tuning_engine.sectorCost__002;
}

function weeklyOverhead(c,s) {const base=(c.isPlayer?CFG.tuning_engine.base__004:CFG.tuning_engine.base__005)+(c.teamLevel-1)*CFG.tuning_engine.base__006+(c.capacity-CFG.tuning_engine.base__007)*CFG.tuning_engine.base__008+(c.originWeeklyCommitment||0);
 const leaders=(c.teams||[]).map(t=>(s.employees||[]).find(e=>e.id===t.leaderId&&e.status==='employed')).filter(Boolean);
 const namedWages=leaders.reduce((sum,e)=>sum+e.weeklySalary,0);
 const culture=(c.culture||'balanced')==='supportive'?CFG.tuning_engine.culture__001*(c.teams||[]).length:(c.culture||'balanced')==='lean'?-CFG.tuning_engine.culture__002*(c.teams||[]).length:0;
 return money(Math.max(CFG.tuning_engine.weeklyOverhead__001,base-CFG.tuning_engine.weeklyOverhead__002*(c.teams||[]).length+namedWages+culture)*(s?.regionalEconomy?.[taxRegion(c).name]?.wageIndex||1));}
// A read-only, imperfect forecast from published releases and known market spending.
// It does not inspect secret rival pipelines, draw randomness, or guarantee sales.
function forecastProject(s,data,plan,c) {
  const route=['original','adaptation','contract'].includes(data.route)?data.route:'original';
  const horizonWeeks=CFG.tuning_engine.horizonWeeks__001;
  const candidate={sector:plan.sector,genre:GENRES.includes(data.genre)?data.genre:'Fantasy',quality:clamp(CFG.tuning_engine.candidate__001+c.reputation*CFG.tuning_engine.candidate__002+plan.size*CFG.tuning_engine.candidate__003,CFG.tuning_engine.candidate__004,CFG.tuning_engine.candidate__005),budget:plan.budget,marketingBudget:plan.marketing,pitch:pitchFrom(data)};
  const stocked=plan.initialPrintCash>0;
  const printMarginal=plan.format==='Comic / Manga'?CFG.tuning_engine.printMarginal__001/CFG.tuning_engine.printMarginal__002:CFG.tuning_engine.printMarginal__003/CFG.tuning_engine.printMarginal__004;
  const distRate=stocked?CFG.tuning_engine.distRate__001*CFG.tuning_engine.distRate__002+CFG.tuning_engine.distRate__003*(CFG.tuning_engine.distRate__004+printMarginal):(plan.sector==='publishing'?CFG.tuning_engine.distRate__005:CFG.tuning_engine.distRate__006);
  let royaltyRate=0;
  if(route==='adaptation') {
    const permission=canUseIp(s,c,data.ipId,plan.sector);
    if(permission.grantId)royaltyRate=s.grants.find(g=>g.id===permission.grantId)?.royaltyRate||0;
  }
  const observations=projectEvidence(s,{companyId:c.id,sector:plan.sector,genre:candidate.genre,limit:CFG.tuning_engine.observations__001});
  // Previous 13-week launches inform market-fit uncertainty, not future
  // prophecy. Blend toward neutral when sample is small; cap correction.
  const comparable=observations.rows.filter(r=>r.expectedGross>0&&r.actualGross>=0);
  const averageRatio=comparable.length?comparable.reduce((n,r)=>n+clamp(r.actualGross/r.expectedGross,CFG.tuning_engine.averageRatio__001,CFG.tuning_engine.averageRatio__002),0)/comparable.length:1;
  const marketCalibration=money(clamp(1+(averageRatio-1)*comparable.length/(comparable.length+CFG.tuning_engine.marketCalibration__001),CFG.tuning_engine.marketCalibration__002,CFG.tuning_engine.marketCalibration__003));
  const revenueByScenario={};
  for(const [scenario,qualityShift,marketShift] of [['conservative',-CFG.tuning_engine.forecastProject__001,CFG.tuning_engine.forecastProject__002],['expected',0,1],['optimistic',CFG.tuning_engine.forecastProject__003,CFG.tuning_engine.forecastProject__004]]) {
    let gross=0;
    if(route!=='contract')for(let i=0;i<horizonWeeks;i++) {
      const futureWeek=s.week+plan.weeks+i;
      for(const region of activeRegions(s)) {
        const budget=worldMarketBudget(s,plan.sector,region.name,futureWeek)*marketShift*(plan.sector==='publishing'?formatReachShare(s,plan.format,futureWeek):1);
        const decay=Math.exp(-i/(plan.sector==='publishing'?CFG.tuning_engine.decay__001:CFG.tuning_engine.decay__002));
        const reach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(candidate,k),0);
        const weight=((clamp(candidate.quality+qualityShift,CFG.tuning_engine.weight__006,CFG.tuning_engine.weight__007)/CFG.tuning_engine.weight__008)**CFG.tuning_engine.weight__009)*region.tastes[candidate.genre]*(1+CFG.tuning_engine.weight__010*(candidate.marketingBudget/Math.max(candidate.budget,1)))*decay*reach;
        const knownCompetition=s.projects.filter(p=>p.sector===plan.sector&&p.status==='released'&&p.releaseWeek<=futureWeek&&futureWeek-p.releaseWeek<CFG.tuning_engine.knownCompetition__001&&p.route!=='contract'&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=futureWeek&&g.endWeek+g.continuationWeeks>futureWeek))).reduce((sum,p)=>{
          const competingAge=futureWeek-p.releaseWeek;
          const rivalReach=audienceCohorts(s,region.name).reduce((total,k)=>total+k.share*audienceAffinity(p,k),0);
          return sum+((p.quality/CFG.tuning_engine.knownCompetition__002)**CFG.tuning_engine.knownCompetition__003)*region.tastes[p.genre]*receptionMult(p)*(1+CFG.tuning_engine.knownCompetition__004*(p.marketingBudget/Math.max(p.budget,1)))*Math.exp(-competingAge/(p.sector==='publishing'?CFG.tuning_engine.knownCompetition__005:CFG.tuning_engine.knownCompetition__006))*rivalReach;
        },0);
        gross+=budget*weight/(CFG.tuning_engine.forecastProject__005+weight+knownCompetition);
      }
    }
    gross=money(gross*(route==='contract'?1:marketCalibration));
    const receipts=route==='contract'?plan.contractFee:gross;
    revenueByScenario[scenario]={gross:money(gross),revenue:money(receipts),directContribution:money(receipts-gross*(distRate+royaltyRate)-plan.grandTotal)};
  }
  const committed=s.projects.filter(p=>p.companyId===c.id&&p.status==='active').reduce((sum,p)=>sum+Math.max(0,p.budget*(1-p.weeksDone/p.weeksTotal)),0);
  const advance=route==='contract'?plan.contractFee*CFG.tuning_engine.advance__002:0;
  // Stress-case liquidity before any new consumer sales, not an accounting profit forecast.
  const noSalesCashFloor=money(c.finance.cash+advance-plan.grandTotal-(plan.initialPrintCash||0)-committed-weeklyOverhead(c,s)*plan.weeks-c.finance.payable);
  return {horizonWeeks,estimatedAtWeek:s.week,estimatedQuality:money(candidate.quality),evidenceSampleSize:comparable.length,marketCalibration,scenario:revenueByScenario,royaltyRate,initialPrintCash:plan.initialPrintCash||0,noSalesCashFloor,
downsideWarning:noSalesCashFloor<0?'Possible cash shortfall before release. Other income or financing may be needed.':noSalesCashFloor<weeklyOverhead(c,s)*CFG.tuning_engine.forecastProject__006?'Thin pre-release cash buffer: leave room for operating expenses.':null,
    basis:route==='contract'?'Fixed client delivery fee, subject to completing the work.':stocked?'Estimated first 13 sales weeks; includes expected print COGS/wholesale fees, but retailer returns and stockouts can change results.':'Estimated first 13 sales weeks; future rivals, changing taste and economic shocks are uncertain.'};
}