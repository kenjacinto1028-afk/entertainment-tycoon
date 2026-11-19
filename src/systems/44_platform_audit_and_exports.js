
function audit49(s,problems){
 for(const p of s.projects){if(p.sector!=='games'||!p.videoGame)continue;
  const g=p.videoGame,live=g.liveService49;
  if(yearAt(p.startWeek)<GAME_PLATFORMS[g.platform]||g.generation<1||
   g.salesUnits&&Object.values(g.salesUnits).some(x=>!Number.isInteger(x)||x<0))
   problems.push(p.id+': invalid platform debut or game units');
  if(!live)continue;
  if(!['active','paused','closed'].includes(live.status)||!Number.isInteger(live.startedWeek)||live.startedWeek> s.week||
   !Number.isInteger(live.billed)||live.billed<1||!Number.isFinite(live.totalPaid)||
   Math.abs(live.totalPaid-CFG.tuning_engine.audit49__001*live.billed)>CFG.tuning_engine.audit49__002||!Number.isInteger(live.nextPeriod)||
   !Array.isArray(live.history)||live.history.some(h=>h.week>s.week||!['start','resume','pause','stop','monthly','automatic-pause'].includes(h.kind)||h.cost<0||h.cost>CFG.tuning_engine.audit49__003))
   problems.push(p.id+': unfunded or invalid ongoing games service');
 }
}
// Release history (read-only). One row per released title, any company; filters, sort and paging done here so the
// UI never builds thousands of rows. Rival money stays private: only the player's own rows carry revenue/profit.
// Rival rows show public results only (sales, scores, reception, tier). Generated prehistory titles have no results.
function releaseHistory(s,o={}){
 const T=CFG.depth.REPUTATION.TITLE_LEVELS,me=s.playerId,own=c=>c===me||company(s,c)?.parentId===me;
 const tierOf=p=>{if(p.route==='contract'||!(titleBaseCost(p)>0))return null;const x=titleMultiple(p);let t=null;for(const L of T){if(x>=L.multiple&&(!L.minScore||Math.max(p.quality||0,p.criticScore||0)>=L.minScore))t=L.key;}return t;};
 const rows=[];
 for(const p of s.projects){if(p.status!=='released'||p.releaseWeek==null)continue;
  const mine=own(p.companyId),c=company(s,p.companyId);
  rows.push({id:p.id,ipId:p.ipId||null,multiple:Math.round(titleMultiple(p)*10)/10,title:p.title,companyId:p.companyId,company:c?c.name:'Unknown',mine,year:yearAt(p.releaseWeek),week:p.releaseWeek,sector:p.sector,genre:p.genre||'',format:p.format||'',
   quality:Math.round(p.quality||0),critic:p.criticScore==null?null:Math.round(p.criticScore),audience:p.audienceScore==null?null:Math.round(p.audienceScore),
   sales:money(p.stats?.totalSales||0),revenue:mine?money(p.directRevenue||0):null,profit:mine?money((p.directRevenue||0)-(p.directCost||0)):null,
   reception:p.reception?.label||null,tier:tierOf(p),contract:p.route==='contract',historic:false});}
 if(o.includeHistoric!==false)for(const w of s.prehistoryWorks||[])rows.push({id:w.id,title:w.title,companyId:w.companyId,company:w.companyName,mine:false,year:w.year,week:null,sector:w.sector,genre:'',format:'',quality:null,critic:null,audience:null,sales:null,revenue:null,profit:null,reception:null,tier:null,contract:false,historic:true});
 const scope=o.scope==='player'?r=>r.mine:()=>true;
 const base=rows.filter(scope);
 const lists={companies:[...new Map(base.map(r=>[r.companyId||r.company,r.company])).entries()].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name)),
  sectors:[...new Set(base.map(r=>r.sector))].sort(),genres:[...new Set(base.map(r=>r.genre).filter(Boolean))].sort(),years:[...new Set(base.map(r=>r.year))].sort((a,b)=>a-b)};
 const f=base.filter(r=>(!o.companyId||o.companyId==='all'||(r.companyId||r.company)===o.companyId)&&(!o.sector||o.sector==='all'||r.sector===o.sector)&&(!o.genre||o.genre==='all'||r.genre===o.genre)&&
  (o.yearFrom==null||o.yearFrom===''||r.year>=Number(o.yearFrom))&&(o.yearTo==null||o.yearTo===''||r.year<=Number(o.yearTo))&&
  (!o.tier||o.tier==='all'||(o.tier==='any'?!!r.tier:r.tier===o.tier))&&(!o.query||r.title.toLowerCase().includes(String(o.query).toLowerCase())));
 const keys=['year','title','company','quality','critic','sales','revenue','profit'],key=keys.includes(o.sort)?o.sort:'year',dir=o.dir==='asc'?1:-1;
 f.sort((a,b)=>{let x=a[key],y=b[key];if(x==null&&y==null)return a.title.localeCompare(b.title);if(x==null)return 1;if(y==null)return -1;
  const d=typeof x==='string'?x.localeCompare(y):x-y;return d*dir||(b.week||0)-(a.week||0)||a.title.localeCompare(b.title);});
 const HP=CFG.display_limits.HISTORY_PAGE,size=clamp(Math.floor(Number(o.pageSize))||HP.defaultSize,HP.minSize,HP.maxSize),pages=Math.max(1,Math.ceil(f.length/size)),page=clamp(Math.floor(Number(o.page))||1,1,pages);
 const sum={total:f.length,hits:f.filter(r=>r.tier).length,legendary:f.filter(r=>r.tier==='legendary').length,
  revenue:o.scope==='player'?money(f.reduce((a,r)=>a+(r.revenue||0),0)):null,best:f.filter(r=>!r.historic).sort((a,b)=>(b.critic??b.quality)-(a.critic??a.quality))[0]?.title||null};
 return {rows:o.all?f:f.slice((page-1)*size,page*size),total:f.length,page,pages,pageSize:size,lists,summary:sum};
}

// Hall of Fame (Legends). Read-only, derived from release history; no save data. Titles ranked by success multiple;
// creators and franchises by points (config depth.json HALL). Simple mode leaves franchises out.
function hallOfFame(s,o={}){
 const H=CFG.depth.HALL,top=o.top||H.TOP,all=releaseHistory(s,{scope:'industry',includeHistoric:false,all:true,tier:'any',sector:o.sector,genre:o.genre,companyId:o.companyId}).rows;
 const lv=o.tier&&o.tier!=='all'&&o.tier!=='any'?all.filter(r=>r.tier===o.tier):all;
 const titles=[...lv].sort((a,b)=>b.multiple-a.multiple||(b.quality||0)-(a.quality||0)||a.title.localeCompare(b.title));
 const size=clamp(Math.floor(Number(o.pageSize))||10,5,50),pages=Math.max(1,Math.ceil(titles.length/size)),page=clamp(Math.floor(Number(o.page))||1,1,pages);
 const byId=new Map(s.projects.map(p=>[p.id,p])),awards=s.creativeAwards||[],people=new Map([...s.employees,...(s.specialists||[])].map(e=>[e.id,e]));
 const awardRows=awards.map(a=>({a,p:byId.get(a.projectId)})).filter(x=>x.p);
 const cr=new Map();
 const bump=(pid,r,pts,tag)=>{let c=cr.get(pid);if(!c){const e=people.get(pid);if(!e)return;c={id:pid,name:e.name,company:r.company,companyId:r.companyId,hits:0,awards:0,points:0,best:r.title,bestMult:-1};cr.set(pid,c);}
  c.points+=pts;if(tag==='award')c.awards++;else c.hits++;if(tag!=='award'&&r.multiple>c.bestMult){c.bestMult=r.multiple;c.best=r.title;c.company=r.company;c.companyId=r.companyId;}};
 for(const r of all){const p=byId.get(r.id);for(const x of p?.creatorCredits||[])bump(x.personId,r,H.POINTS[r.tier]||0,'title');}
 for(const {a,p} of awardRows)for(const pid of a.creatorIds||[])bump(pid,{title:p.title,company:company(s,p.companyId)?.name||'Unknown',companyId:p.companyId,multiple:-1},H.AWARD_POINTS,'award');
 const creators=[...cr.values()].filter(c=>c.points>0).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)).slice(0,top).map(({bestMult,...c})=>c);
 let franchises=null;
 if(((s.settings&&s.settings.depth)||CFG.depth.DEFAULT)!=='simple'||o.forceFranchises){
  const fr=new Map(),rel=new Map();
  for(const p of s.projects)if(p.status==='released'&&p.ipId&&p.route!=='contract')rel.set(p.ipId,(rel.get(p.ipId)||0)+1);
  for(const r of all){if(!r.ipId)continue;let f=fr.get(r.ipId);if(!f){const ip=s.ips.find(i=>i.id===r.ipId);f={ipId:r.ipId,name:ip?.name||r.title,company:r.company,companyId:r.companyId,hits:0,awards:0,releases:rel.get(r.ipId)||0,points:0};fr.set(r.ipId,f);}f.hits++;f.points+=H.POINTS[r.tier]||0;}
  for(const {a,p} of awardRows){const f=p.ipId&&fr.get(p.ipId);if(f){f.awards++;f.points+=H.AWARD_POINTS;}}
  franchises=[...fr.values()].map(f=>({...f,points:Math.round((f.points+Math.max(0,f.releases-1)*H.RELEASE_POINT)*100)/100})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)).slice(0,top);}
 return {titles:titles.slice((page-1)*size,page*size),total:titles.length,page,pages,pageSize:size,creators,franchises,
  lists:{companies:[...new Map(all.map(r=>[r.companyId||r.company,r.company])).entries()].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name)),sectors:[...new Set(all.map(r=>r.sector))].sort(),genres:[...new Set(all.map(r=>r.genre).filter(Boolean))].sort()}};
}

const _auditBefore49=audit;
audit=function(s){const problems=_auditBefore49(s);audit49(s,problems);return problems;};


return {CONFIG:CFG,addPlaytime,ipoQuote,rivalMarketConcentration,rivalIntelligence,institutionsReport,automaticLenderDecision,openCreditLine,creditLineStatus,drawCreditLine,closeCreditLine,createDivision,assignTeamDivision,divisionPerformance,setCentralService,groupFinanceReport,companyPurchaseQuote,assetPurchaseQuote,acquisitionDiligence,acquireCompany,acquireAsset,integrateAcquisition,groupInternalLicense,subsidiaryDelegation,STARTUP_PROFILES,eraOverview43,capabilityReadiness43,managementStatus43,setManagement43,productionPath43,OBJECTIVE_DEFS43,TUTORIAL_STEPS43,beginTutorial43,endTutorial43,visitTutorial43,tutorialStatus43,chooseObjective43,objectiveStatus43,adviser43,portraitTraits43,syncWorldEvents43,worldEvents43,rightsPackageReport43,grantRightsPackage43,canDistribute43,gamePublisherQuote43,signGamePublisher43,gamePublisherReport43,technologyOffer43,acquireTechnology43,canUseIp,rivalResearch43,operatingStatus44,commissionInspection47,commissionDispute47,commissionResolve47,loanWorkoutQuote47,restructureLoan47,gamePlatformMarket49,gamePlatformReport49,gameLiveService49,corporateStatus,corporateReadiness,corporateValuation,corporateRisk,setRiskPolicy,setInsurance,insuranceStatus,groupInvestmentReview,renameCompany,investmentCommittee,incorporateStudio,boardVote,raiseEquity,launchIPO,sellFounderShares,payDividend,planLeadership,chooseLeader,stepDown,contestExecutiveControl,startFreshCompany,endRun,careerHistory,SAVE_VERSION,GAME_PLATFORMS,GAME_MECHANICS,GAME_MODELS,gameOfferExclusive,gameAnswerExclusive,gameBookExclusive,gameDesign,gamePrototype,gameBuildEngine,gameChooseEngine,gameQA,gameBeta,gameCertify,gameSetModel,gameCommunity,gameSupport,gameReadiness,openGameStore,gameStoreOffer,gameAnswerStoreOffer,gameListStore,gameSelectStore,gameSubscribeStore,gameStoreReport,gameWindows,requestStreamingLicense,answerStreamingLicense,TV_NETWORKS,TV_SLOTS,STREAM_TIERS,tvPlanSeason,tvWritersRoom,tvEditEpisode,tvCast,tvSchedule,tvUseBacklot,tvRatings,tvRenewSeason,tvEndSeries,streamingReady,launchStreamingService,setStreamingTier,licenseStreamingTitle,streamingCatalog,streamingReport,FILM_METHODS,buildFilmBacklot,useFilmBacklot,filmPremiere,filmActorPool,filmAudition,filmChooseCast,filmDecision,filmDistribution,filmBoxOffice,PUBLISHING_PRICES,openPublishingOutlet,listPublishingOutlet,closePublishingOutlet,publishingOutletReport,requestManuscriptApproval,reviewSerialArc,publishingFormatAvailable,publishingFormatTreatment,translatePublishingEdition,createPublishingImprint,assignPublishingImprint,publishingImprintReport,openPublishingPreorders,manuscriptMarket,negotiateManuscript,answerManuscript,publishingInterest,setPublishingChannel,setSerialCadence,publishingSalesReport,editorialAssessment,editorialDecision,creatorCareer,creativeAwards,worldHistory,scoutEmergingCreator,developEmergingCreator,publishingCharts,candidatePool,employeeRoster,hireCandidate,renewEmployee,releaseEmployee,setCompanyCulture,configureStaffDelegation,configureTalentAuthority,delegateSpecialists,trainTeam,teamPerformance,availableSpecialists,bookSpecialist,setFranchiseReleaseTarget,coordinateFranchiseReleases,franchiseMomentum,franchiseAudienceSignals,routineCounterQueue,batchApproveRoutineCounters,captureAnnualSnapshots,historicalCompanyFinances,portfolioRankings,portfolioRecords,searchNewsArchive,dismissRoutineAdvisories,setPausePolicy,setDepth,DEPTH_MODES,boardRepStatus,receptionRoll,receptionUnit,formatPoolShares,formatReach,formatReachShare,genreFatigue,genreFatiguePressure,genreFatigueMult,titleMultiple,boardGate,boardBlockAnswer,boardPressureAnswer,boardOverrideCost,decisionCardLog,setDashboardFocus,SECTORS,THEMES,TARGET_AUDIENCES,CREATIVE_DIRECTIONS,MARKET_POSITIONINGS,coProductionQuote,investmentComparison,proposeCoProduction,answerCoProductionOffer,configureCoProductionAuthority,startCoProduction,coProductionStatement,requestCommission,answerCommissionOffer,configureCommissionAuthority,cancelProject,counterpartyTrust,WORLD_SCALES,activeRegions,regionalEconomyReport,audienceCohorts,estimateWeeklyPayroll,marketLoanRate,applyEconomicShock,businessTechnology,investResearch,adoptTechnology,technologyReport,worldMarketBudget,worldSetupWarnings,economicBrief,quarterlyMarketHistory,GENRES,FORMATS,MONTHS,ORIGINS,REGIONS,createGame,player,company,previewProject,createProject,franchiseBible,editFranchiseBible,editFranchiseBranch,franchiseSchedule,franchiseOverview,FRANCHISE_BRANCHES,changeProjectTeam,interveneProduction,projectEvidence,projectHistory,canUseIp,createOption,offerRights,offerRenewal,answerRightsOffer,exerciseLicensedOption,requestCreativeApproval,decideCreativeApproval,configureRightsAuthority,enterSector,capabilityCost,hireTeam,eligibleClients,contractTier,contractSizeLockMessage,advance,advanceToDecision,available,yearAt,yearWeek,periodAt,periodLabel,dismissAlert,companyProfit,companyBalance,currentProjectProfit,projectBudget,orderPrintRun,setPrintPolicy,writeOffPrintStock,productionFinancial,franchiseFinancial,financialStatements,settlementEvidence,groupSettlementEvidence,closedSettlementHistory,closedSettlementAudit,obligationExposure,groupObligationIntegrity,portfolioBudget,balanceSheetDetails,activeObligationRegister,rightsCalendar,royaltyStatements,liquidityForecast,loanLimit,borrowLoan,repayLoan,foundSubsidiary,controlledCompanies,chargeSharedServices,consolidatedStatements,audit,loadState,transactionsFor,shortMoney,releaseHistory,hallOfFame};
