
function shortMoney(n){return '$'+Math.round(n).toLocaleString('en-US');}
function singleWeek(s) {
  const priorWeek=s.week,priorYear=yearAt(priorWeek),priorPeriod=periodAt(priorWeek);
  const nextWeek=priorWeek+1;
  // Close the COMPLETED month before recording the first transaction of the
  // next one. Previously week 5's sales/payroll were included in month 1.
  if(priorPeriod!==periodAt(nextWeek)||priorYear!==yearAt(nextWeek))closePeriod(s,priorWeek);
  s.week++;
  collectRemittances(s);
  settlePartnerReceipts(s);
  const year=yearAt(s.week),period=periodAt(s.week);
  if(year!==priorYear){
    recognizeTvHonors(s,priorYear);
    captureAnnualSnapshots(s,priorYear);
    recognizeCreativeAwards(s,priorYear);
    recognizeFilmHonors(s,priorYear);
    annualCareers(s);
    reviewFounderTransition(s);
    for(const [sec,info] of Object.entries(SECTORS))if(info.year===year&&sec!=='publishing') {news(s,info.name+' industry debuts',CFG.events.messages.singleWeek__001,'breakthrough');alert(s,'industry-'+sec,CFG.events.messages.singleWeek__002,info.name+' has globally debuted. You can remain a specialist or invest in an entry capability.','advisory');newEntrants(s,year);}
  }
  for(const [sec,info]of Object.entries(SECTORS))if(info.year>1&&s.week===(info.year-1)*CFG.tuning_engine.singleWeek__001-CFG.tuning_engine.singleWeek__002){
    news(s,'Industry outlook: '+info.name+' approaches','Worldwide debut expected in World Year '+info.year+'. Binding future-media options may be negotiated now; production remains prohibited before debut.','breakthrough');
    alert(s,'preview-'+sec,'Prepare for '+info.name,'The global '+info.name+' sector debuts in 26 weeks. Compare optional partners and rights; there is no mandatory expansion.','advisory');
  }
  s.macroeconomy=clamp(s.macroeconomy+(rand(s)-CFG.tuning_engine.singleWeek__003)*CFG.tuning_engine.singleWeek__004-(s.macroeconomy-1)*CFG.tuning_engine.singleWeek__005,CFG.tuning_engine.singleWeek__006,CFG.tuning_engine.singleWeek__007);
  updateRegionalEconomy(s);
  if(s.week%CFG.tuning_engine.singleWeek__008===0)recruitVacancies(s);
  for(const [sector,t] of Object.entries(technologyReport(s)))if(t.discovered&&t.discoveryWeek===s.week){
    news(s,SECTORS[sector].name+' technology breakthrough',CFG.events.messages.singleWeek__003,'breakthrough');
  }
  // Only the proportion of payroll serving live productions is attributed
  // to projects. Idle-team/company overhead remains a separate unallocated
  // company expense; allocations NEVER cause a second book entry.
  const activeByCompany=new Map();
  for(const p of s.projects)if(p.status==='active'){
    if(!activeByCompany.has(p.companyId))activeByCompany.set(p.companyId,[]);
    activeByCompany.get(p.companyId).push(p);
  }
  for(const c of s.companies){if(c.bankrupt)continue;
    if(!fundedPayroll44(s,c))continue;
    const overhead=weeklyOverhead(c,s);
    expense(s,c,overhead,'payroll-overhead','Weekly team payroll and shared corporate overhead');
    accumulateInsurancePayroll(s,c,overhead);
    expense(s,c,money(overhead*taxRegion(c).payrollLevyRate),'automatic-payroll-levy','Automatic regional employer levy');
    const inFlight=activeByCompany.get(c.id)||[];
    let attributed=0;
    for(const p of inFlight){
      const allocated=money(Math.min(overhead-attributed,overhead/Math.max(1,c.capacity)));
      p.overheadAttributed=money((p.overheadAttributed||0)+allocated);
      attributed=money(attributed+allocated);
    }
    c.finance.overheadAttributed=money((c.finance.overheadAttributed||0)+attributed);
  }
  delegateSpecialists(s);
  for(const p of s.projects)if(p.status==='active')projectWork(s,p);
  backgroundProgress(s);
  for(const p of s.projects)if(p.status==='released')p.stats.weeklySales=0;
  for(const g of s.grants)if(g.type==='option'&&g.endWeek>s.week&&available(g.media,s.week)){
    if(exerciseOption(s,g)) {const c=company(s,g.holderId);if(c&&!c.capabilities[g.media]&&c.finance.cash>=capabilityCost(g.media,'partner')+CFG.tuning_engine.singleWeek__009){expense(s,c,capabilityCost(g.media,'partner'),'capability','Partner adaptation production capability');c.capabilities[g.media]='partner';}const ip=s.ips.find(x=>x.id===g.ipId);
      const pitchTitle=(ip?.name||'New Story')+': Adapted';
      if(g.approvalRequired){
        requestCreativeApproval(s,g.id,{title:pitchTitle,genre:GENRES[0]});
      }else try{createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,title:pitchTitle,genre:GENRES[0],size:CFG.tuning_engine.singleWeek__010});}catch(e) {/* Counterparty retains rights but may defer production. */}

    }
  }
  for(const approval of s.creativeApprovals||[])if(approval.status==='approved'&&!approval.launched){
    const g=s.grants.find(g=>g.id===approval.grantId),c=company(s,approval.holderId);
    if(!g||g.type!=='license'||g.endWeek<=s.week||!c||c.bankrupt||c.id===s.playerId)continue;
    if(!c.capabilities[g.media])continue;
    try{const production=createProject(s,{companyId:c.id,sector:g.media,route:'adaptation',ipId:g.ipId,
      title:approval.title,genre:approval.genre,size:CFG.tuning_engine.production__001,approvalId:approval.id});approval.launched=production.id;}
    catch(e){/* Pending capacity/cash; approved terms remain valid until the actual expiry. */}
  }
  streamingWeek(s);
  gameStoreWeek(s);
  gameLiveServiceWeek49(s);
  gamePublisherWeek43(s);
  weekSales(s);
  // Serialized reader momentum reacts only to ACTUAL current-week purchases.
  // It reallocates share within the same consumer wallets in following weeks.
  const weeklyPublishingWallet=activeRegions(s).reduce((n,r)=>n+worldMarketBudget(s,'publishing',r.name),0);
  for(const p of s.projects)if(p.sector==='publishing'&&p.format==='Web Serial'&&p.status==='released'){
    const observed=(p.stats.weeklySales||0)/Math.max(1,weeklyPublishingWallet);
    const target=clamp(CFG.tuning_engine.target__004+observed*CFG.tuning_engine.target__005,CFG.tuning_engine.target__006,CFG.tuning_engine.target__007);
    p.serialReaderMomentum=money(clamp((p.serialReaderMomentum||1)*CFG.tuning_engine.singleWeek__011+target*CFG.tuning_engine.singleWeek__012,CFG.tuning_engine.singleWeek__013,CFG.tuning_engine.singleWeek__014));
    p.serialEngagementHistory.push({week:s.week,momentum:p.serialReaderMomentum,observedGross:money(p.stats.weeklySales||0)});
    if(p.serialEngagementHistory.length>CFG.tuning_engine.singleWeek__015)p.serialEngagementHistory.shift();
  }
  settlePrintLifecycle(s);
  autoReplenishPrint(s);
  reviewReleases(s);
  if(s.week%CFG.tuning_engine.singleWeek__016===0){for(const c of s.companies){if(c.isPlayer||c.bankrupt)continue;if(rand(s)<(s.settings.difficulty==='challenging'?CFG.tuning_engine.singleWeek__017:s.settings.difficulty==='casual'?CFG.tuning_engine.singleWeek__018:CFG.tuning_engine.singleWeek__019))launchAI(s,c);}}
  if(s.week%CFG.tuning_engine.singleWeek__020===0)for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash>SECTORS[c.sector].cost*CFG.tuning_engine.singleWeek__021){
    const t=businessTechnology(s,c.id,c.sector);
    if(t.canUpgrade&&rand(s)<CFG.tuning_engine.singleWeek__022)try{adoptTechnologyForRival(s,c,c.sector);}catch(e){/* A real competitor can defer an upgrade. */}
  }
  for(const c of s.companies)if(!c.isPlayer&&!c.bankrupt&&c.finance.cash<=0&&c.finance.payable>SECTORS[c.sector].cost*CFG.tuning_engine.singleWeek__023){c.bankrupt=true;news(s,c.name+' closes its doors','The financially distressed '+SECTORS[c.sector].name+' firm could not meet ongoing obligations.','competitor');}
  managementWeek43(s);
  update43CWeek(s);
  update43BWeek(s);
  ensureAlerts(s);
}
// Year end captures actual legal-entity books after the completed final month,
// before the first transaction in the new year. No double booking or fake
// financial history is generated for imported older campaigns.
function captureAnnualSnapshots(s,year){
  for(const c of s.companies){
    const f=c.finance,base=c.annualBaseline,complete=!!(base&&Number.isFinite(base.revenue)&&Number.isFinite(base.expense));
    s.snapshots.push({year,companyId:c.id,sector:c.sector,region:c.homeRegion||taxRegion(c).name,
      cash:money(f.cash),reputation:c.reputation,completed:s.projects.filter(p=>p.companyId===c.id&&p.status==='released'&&yearAt(p.releaseWeek)===year).length,
      revenue:money(f.revenue),expense:money(f.expense),profit:companyProfit(c),
      annualRevenue:complete?money(f.revenue-base.revenue):null,
      annualExpense:complete?money(f.expense-base.expense):null,
      annualProfit:complete?money((f.revenue-base.revenue)-(f.expense-base.expense)):null,
      receivable:money(f.receivable||0),payable:money(f.payable||0),
      deferred:money(f.deferred||0),debt:money(f.loanBalance||0),
      inventory:money(f.inventory||0),equity:money(f.equity||0),
      historyComplete:complete,source:'booked-entity-close'});
    c.annualBaseline={revenue:money(f.revenue),expense:money(f.expense)};
  }
  if(s.snapshots.length>CFG.tuning_engine.captureAnnualSnapshots__001)s.snapshots.splice(0,s.snapshots.length-CFG.tuning_engine.captureAnnualSnapshots__002);
}
function historicalCompanyFinances(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for yearly financial history.');
  return s.snapshots.filter(x=>x.companyId===companyId).sort((a,b)=>b.year-a.year).map(x=>({...x}));
}
// Rival financial books are private. Only rough bands, explicitly tagged as
// estimates, may appear in the player's intelligence views; ownership group
// companies and actual public release results are shown accurately.
function portfolioRankings(s,{type='finance',metric=null,sector='all',region='all',year='all',limit=CFG.tuning_engine.portfolioRankings__001}={}){
  if(!['finance','audience','prestige'].includes(type))throw new Error('Unknown ranking type.');
  if(sector!=='all'&&!SECTORS[sector])throw new Error('Unknown ranking sector.');
  if(region!=='all'&&!activeRegions(s).some(r=>r.name===region))throw new Error('Unknown ranking region.');
  if(year!=='all'&&(!Number.isInteger(Number(year))||Number(year)<1||Number(year)>yearAt(s.week)))throw new Error('Invalid ranking year.');
  const yearNum=year==='all'?null:Number(year),max=clamp(Number(limit)||CFG.tuning_engine.max__001,1,CFG.tuning_engine.max__002);
  if(type==='finance'){
    const metrics=['cash','profit','revenue','annualRevenue','annualProfit','debt'];
    metric=metric||'profit';if(!metrics.includes(metric))throw new Error('Unknown financial leaderboard metric.');
    const rows=s.companies.flatMap(c=>{
      if(sector!=='all'&&c.sector!==sector)return [];
      if(region!=='all'&&c.homeRegion!==region)return [];
      const h=yearNum?s.snapshots.find(x=>x.companyId===c.id&&x.year===yearNum):null;
      if(yearNum&&!h)return [];
      const value=yearNum?h[metric]:metric==='annualRevenue'||metric==='annualProfit'?null:metric==='cash'?c.finance.cash:metric==='revenue'?c.finance.revenue:metric==='debt'?c.finance.loanBalance:companyProfit(c);
      if(value===null||!Number.isFinite(value))return [];
      const actual=c.isPlayer||c.parentId===s.playerId;
      const shown=actual?money(value):money(Math.round(value/CFG.tuning_engine.shown__001)*CFG.tuning_engine.shown__002);
      return [{id:c.id,name:c.name,sector:c.sector,region:c.homeRegion,value:shown,source:actual?'actual':'estimated',year:yearNum,historyComplete:yearNum?!!h.historyComplete:true}];
    });
    return rows.sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,max);
  }
  const rows=s.projects.filter(p=>p.status==='released'&&p.releaseWeek!==null&&
      (sector==='all'||p.sector===sector)&&(yearNum===null||yearAt(p.releaseWeek)===yearNum)&&
      (region==='all'||p.productionRegion===region)).map(p=>({
      id:p.id,name:p.title,sector:p.sector,region:p.productionRegion,
      value:type==='audience'?money(p.stats?.totalSales||0):Number(p.criticScore??p.quality??0),
      source:'actual',year:yearAt(p.releaseWeek),historyComplete:true,companyId:p.companyId}));
  return rows.sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,max);
}
function portfolioRecords(s,{sector='all',year='all'}={}){
  const titles=portfolioRankings(s,{type:'audience',sector,year,limit:CFG.tuning_engine.titles__002});
  const acclaim=portfolioRankings(s,{type:'prestige',sector,year,limit:CFG.tuning_engine.acclaim__001});
  const entries=s.projects.filter(p=>p.status==='released'&&p.releaseWeek!==null&&(sector==='all'||p.sector===sector)&&
    (year==='all'||yearAt(p.releaseWeek)===Number(year)));
  return {topAudience:titles[0]||null,topCritic:acclaim[0]||null,
    releasedCount:entries.length,franchiseCount:new Set(entries.map(p=>p.ipId).filter(Boolean)).size,
    note:'Played releases only; gross audience sales and critic scores are not accounting profit.'};
}