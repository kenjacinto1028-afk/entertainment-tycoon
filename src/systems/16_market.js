
// Read-only account statements by legal debtor; pre-migration activity is
// marked incomplete instead of reconstructed from compacted cash journals.
function royaltyStatements(s,companyId=s.playerId){
  if(!company(s,companyId))throw new Error('Unknown company for royalty statements.');
  const accounts=s.royaltyAccounts.filter(a=>a.debtorId===companyId).map(a=>{
    const grant=s.grants.find(g=>g.id===a.grantId),project=s.projects.find(p=>p.id===a.projectId);
    return {...a,grantMedia:grant?.media||null,sourceTitle:s.ips.find(ip=>ip.id===grant?.ipId)?.name||'Unknown source',
      projectTitle:project?.title||'Unknown production',rate:grant?.royaltyRate||0};
  });
  const sum=k=>money(accounts.reduce((n,a)=>n+(a[k]||0),0));
  const due=outstandingRoyaltyDebt(s,companyId),outstanding=sum('outstanding');
  // Receipts due TO a rights owner are external counterparties' claims,
  // not an invented booked asset or the owner's second consumer sale.
  const receivableAccounts=s.royaltyAccounts.filter(a=>a.creditorId===companyId).map(a=>{
    const grant=s.grants.find(g=>g.id===a.grantId),project=s.projects.find(p=>p.id===a.projectId);
    return {...a,sourceTitle:s.ips.find(ip=>ip.id===grant?.ipId)?.name||'Unknown source',
      projectTitle:project?.title||'Unknown production',debtorName:company(s,a.debtorId)?.name||'Unknown licensee'};
  });
  const ownerSum=k=>money(receivableAccounts.reduce((n,a)=>n+(a[k]||0),0));
  return {companyId,accounts,receivableAccounts,
    creditorTotals:{paid:ownerSum('paid'),unpaid:ownerSum('outstanding'),recouped:ownerSum('recouped'),
      historyComplete:receivableAccounts.every(a=>a.historyComplete)},
    totals:{salesBase:sum('salesBase'),accrued:sum('accrued'),recouped:sum('recouped'),paid:sum('paid'),outstanding,
    unverifiedOpening:sum('openingOutstanding')},historyComplete:accounts.every(a=>a.historyComplete),
    reconciliation:{bookedPayable:due,statementPayable:outstanding,difference:money(due-outstanding)}};
}
function outstandingRoyaltyDebt(s,companyId){
  return money(s.obligations.reduce((sum,o)=>sum+(o.debtorId===companyId?o.amount:0),0));
}
function settleRoyaltyObligations(s,c) {
  for(const o of s.obligations) {
    if(o.debtorId!==c.id||o.amount<=0||c.finance.cash<=0)continue;
    const creditor=company(s,o.creditorId),paid=money(Math.min(o.amount,c.finance.cash,c.finance.payable));
    if(paid<=0)continue;
    transact(s,c,'settle-royalty',{cash:-paid,payable:-paid},'Outstanding royalty settled',o.projectId);
    if(creditor){revenue(s,creditor,paid,'royalty-recovery','Outstanding royalty received',o.projectId);const p=s.projects.find(p=>p.id===o.projectId);const ip=s.ips.find(i=>i.id===p?.ipId);if(ip)ip.rightsIncome=money((ip.rightsIncome||0)+paid);
      const g=s.grants.find(g=>g.id===o.grantId);if(g?.agentRate>0){const cut=money(paid*g.agentRate);if(cut){expense(s,creditor,cut,'author-agency','Agency share of recovered royalty',o.projectId);g.agentFeesPaid=money((g.agentFeesPaid||0)+cut);}}}
    if(o.accountId){const account=s.royaltyAccounts.find(a=>a.id===o.accountId);
      if(!account)throw new Error('Royalty recovery has no source account.');
      account.paid=money(account.paid+paid);account.outstanding=money(account.outstanding-paid);account.updatedWeek=s.week;}
    o.amount=money(o.amount-paid);
  }
  s.obligations=s.obligations.filter(o=>o.amount>CFG.tuning_engine.settleRoyaltyObligations__001);
}
// R2: book buyers are split into print, digital and audio groups (config
// depth.json FORMAT_POOLS). Full releases reach every group; digital-only and
// audio-only formats sell to their own group. Shares always sum to 1, so the
// capped publishing wallet is unchanged.
function formatPoolShares(s,week=s.week){
  const F=CFG.depth.FORMAT_POOLS,y=yearAt(week),at=pts=>{if(y<=pts[0][0])return pts[0][1];
    for(let i=1;i<pts.length;i++)if(y<=pts[i][0]){const [a,va]=pts[i-1],[b,vb]=pts[i];return va+(vb-va)*(y-a)/(b-a);}return pts[pts.length-1][1];};
  const digital=at(F.shares.digital),audio=y>=CFG.tuning_engine.publishingFormatAvailable__001?at(F.shares.audio):0;
  return {print:1-digital-audio,digital,audio};
}
function formatReach(format){return CFG.depth.FORMAT_POOLS.reach[format]||null;}
function formatReachShare(s,format,week=s.week){const r=formatReach(format);if(!r)return 1;const sh=formatPoolShares(s,week);return r.reduce((n,k)=>n+sh[k],0);}
// R4 genre fatigue (config depth.json GENRE_FATIGUE). Recent same-genre,
// same-medium releases sold in a region lower that genre's demand there for
// everyone alike. Worked out from release history known at s.week (no save
// field, no RNG). Returns {region:{genre:pressure}}.
function genreFatiguePressure(s,sector,week=s.week){
  const F=CFG.depth.GENRE_FATIGUE,W=F.windowWeeks,known=Math.min(week,s.week),out={};
  if(!F.modes.includes(s.settings?.depth))return out;
  const regions=activeRegions(s);for(const r of regions)out[r.name]={};
  const add=(region,genre,w)=>{if(w>0)out[region][genre]=(out[region][genre]||0)+w;};
  for(const p of s.projects){
    if(p.sector!==sector||p.status!=='released'||p.route==='contract'||!(p.releaseWeek<=known))continue;
    const age=week-p.releaseWeek;if(age<0||age>=W)continue;
    for(const r of regions)if(canDistribute43(s,p,r.name,p.releaseWeek))add(r.name,p.genre,1-age/W);
  }
  for(const b of s.backgroundFirms){if(b.sector!==sector)continue;
    for(const x of b.releases){if(!(x.releaseWeek<=known))continue;const age=week-x.releaseWeek;if(age<0||age>=W)continue;
      for(const r of regions)add(r.name,x.genre,F.backgroundWeight*(1-age/W));}}
  return out;
}
function genreFatigueMult(sector,pressure){
  const F=CFG.depth.GENRE_FATIGUE;
  return Math.max(F.floor,1-F.perPoint[sector]*Math.max(0,(pressure||0)-F.free[sector]));
}
// Player-facing view: demand multiplier per genre now, averaged over active regions.
function genreFatigue(s,sector,week=s.week){
  const P=genreFatiguePressure(s,sector,week),regions=activeRegions(s),res={};
  for(const g of GENRES){const m=regions.map(r=>genreFatigueMult(sector,P[r.name]?.[g]));res[g]=Math.round(m.reduce((a,b)=>a+b,0)/Math.max(1,m.length)*1000)/1000;}
  return res;
}
function weekSales(s) {
  s.weeklyConsumerSpend=money((s.streamingWeeklyTotal||0)+Object.values(s.gameMarketReserved||{}).reduce((a,b)=>a+b,0));
  for(const [sector,info] of Object.entries(SECTORS)) {
    if(!available(sector,s.week))continue;
    const titles=s.projects.filter(p=>p.sector===sector&&p.status==='released'&&p.route!=='contract'&&s.week-p.releaseWeek<CFG.tuning_engine.titles__001&&s.week>=p.releaseWeek&&(!p.grantId||s.grants.some(g=>g.id===p.grantId&&g.type==='license'&&g.startWeek<=s.week&&g.endWeek+g.continuationWeeks>s.week)));
    if(!titles.length&&!s.backgroundFirms.some(b=>b.sector===sector&&b.releases.length))continue;
    // Old single-pool maths whenever no format-limited title is selling, so
    // worlds without ebooks/audiobooks/web serials keep identical numbers.
    const pools=sector==='publishing'&&titles.some(p=>formatReach(p.format))?formatPoolShares(s):null;
    const fatigue=genreFatiguePressure(s,sector);
    for(const region of activeRegions(s)) {
      const budget=Math.max(0,money(worldMarketBudget(s,sector,region.name)-(sector==='tv'?(s.streamingWeeklyReserved?.[region.name]||0):sector==='games'?(s.gameMarketReserved?.[region.name]||0):0)));
      const background=backgroundWeights(s,sector,region,fatigue[region.name]);
      const cohortShares=audienceCohorts(s,region.name);
      const weights=titles.map(()=>0),minorShares=background.map(()=>0);
      for(const cohort of cohortShares){
        const titleWeights=titles.map(p=>{
          if(!canDistribute43(s,p,region.name,s.week))return 0;
          const age=s.week-p.releaseWeek,decay=Math.exp(-age/((p.sector==='publishing'?CFG.tuning_engine.decay__003:CFG.tuning_engine.decay__004)*receptionLegs(p)));
          return ((p.quality/CFG.tuning_engine.titleWeights__001)**CFG.tuning_engine.titleWeights__002)*region.tastes[p.genre]*genreFatigueMult(sector,fatigue[region.name]?.[p.genre])*cohort.tastes[p.genre]*(1+CFG.tuning_engine.titleWeights__003*(p.marketingBudget/Math.max(p.budget,1)))*decay*audienceAffinity(p,cohort)*franchiseMomentum(s,p,s.week)*receptionMult(p)*
           (p.sector==='movie'&&p.cinema?filmDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='tv'&&p.television?tvDemandMultiplier(p,s.week,region.name):1)*
           (p.sector==='games'&&p.videoGame?gameDemandMultiplier(p,s.week,region.name)*gamePlatformDemand49(s,p,region.name):1)*
           (p.sector==='publishing'?(p.translations?.some(t=>t.region===region.name)?CFG.tuning_engine.titleWeights__004:1)*
             (company(s,p.companyId)?.imprints?.some(i=>i.id===p.imprintId&&i.genre===p.genre)?CFG.tuning_engine.titleWeights__005:1)*
             (p.preorderCampaign&&age<CFG.tuning_engine.titleWeights__006?CFG.tuning_engine.titleWeights__007:1)*
             (p.format==='Web Serial'?(p.serialReaderMomentum||1):1):1);
        });
        const minorWeights=background.map(b=>b.weight*cohort.tastes[b.genre]);
        if(!pools){
        const denominator=CFG.tuning_engine.denominator__001+titleWeights.reduce((a,b)=>a+b,0)+minorWeights.reduce((a,b)=>a+b,0);
        for(let i=0;i<weights.length;i++)weights[i]+=cohort.share*titleWeights[i]/denominator;
        for(let i=0;i<minorShares.length;i++)minorShares[i]+=cohort.share*minorWeights[i]/denominator;
        }else for(const [pool,share] of Object.entries(pools)){
          if(share<=0)continue;const inPool=titles.map(p=>{const r=formatReach(p.format);return !r||r.includes(pool);});
          const denominator=CFG.tuning_engine.denominator__001+titleWeights.reduce((a,b,i)=>a+(inPool[i]?b:0),0)+minorWeights.reduce((a,b)=>a+b,0);
          for(let i=0;i<weights.length;i++)if(inPool[i])weights[i]+=share*cohort.share*titleWeights[i]/denominator;
          for(let i=0;i<minorShares.length;i++)minorShares[i]+=share*cohort.share*minorWeights[i]/denominator;
        }
      }
      for(let i=0;i<titles.length;i++) {
        const p=titles[i],targetGross=money(budget*weights[i]);
        const c=company(s,p.companyId);let gross=p.sector==='games'&&p.videoGame?gamePlatformCapGross49(s,p,region.name,targetGross):targetGross,fee=money(gross*(p.sector==='publishing'?(p.publishingChannel==='owned'?CFG.tuning_engine.fee__007:p.publishingChannel==='direct'?CFG.tuning_engine.fee__008:p.publishingChannel==='digital'?CFG.tuning_engine.fee__009:CFG.tuning_engine.fee__010):CFG.tuning_engine.fee__011));
        const price=p.sector==='publishing'?publishingUnitPrice(p):0;let soldUnits=0;
        if(p.printStock){
          const book=p.printStock;
          // Wholesale partners fulfill 60% of a new edition's physical demand
          // without stock entering our warehouse. Their larger fee pays for
          // printing/retailer service; remaining 40% uses our own copies.
          // Both channels compete for the SAME capped consumer budget.
          const wholesaleShare=p.publishingChannel==='direct'?CFG.tuning_engine.wholesaleShare__001:p.publishingChannel==='wholesale'?CFG.tuning_engine.wholesaleShare__002:CFG.tuning_engine.wholesaleShare__003;
          const partnerGross=money(Math.floor(targetGross*wholesaleShare/book.price)*book.price),managedDemand=money(targetGross-partnerGross);
          p.stats.weeklyPrintDemand=(p.stats.weeklyPrintDemand||0)+Math.floor(managedDemand/book.price);
          const units=Math.min(book.stock,Math.floor(managedDemand/book.price));
          const directGross=money(units*book.price);
          gross=money(partnerGross+directGross);soldUnits=Math.floor(partnerGross/book.price)+units;
          fee=money(partnerGross*CFG.tuning_engine.weekSales__001+directGross*(p.publishingChannel==='owned'?CFG.tuning_engine.weekSales__002:CFG.tuning_engine.weekSales__003));
          if(units>0){
            const cogs=money(units*book.unitCost);
            transact(s,c,'printed-copies-sold',{inventory:-cogs,expense:cogs},'Cost of '+units+' printed copies: '+p.title,p.id);
            book.stock-=units;book.sold+=units;book.cogs=money(book.cogs+cogs);p.stats.weeklyPrintUnits=(p.stats.weeklyPrintUnits||0)+units;
            book.partnerGross=money((book.partnerGross||0)+partnerGross);
            book.directGross=money((book.directGross||0)+directGross);
            p.directCost=money(p.directCost+cogs);
          }else book.partnerGross=money((book.partnerGross||0)+partnerGross);
        }
        if(p.sector==='publishing'&&!p.printStock){soldUnits=Math.floor(targetGross/price);gross=money(soldUnits*price);fee=money(gross*(p.publishingChannel==='owned'?CFG.tuning_engine.weekSales__004:p.publishingChannel==='direct'?CFG.tuning_engine.weekSales__005:p.publishingChannel==='digital'?CFG.tuning_engine.weekSales__006:CFG.tuning_engine.weekSales__007));}
        if(gross<CFG.tuning_engine.weekSales__008)continue;
        if(p.sector==='publishing'){
          p.salesByRegion ||= {};p.salesByChannel ||= {};
          p.salesByRegion[region.name]=money((p.salesByRegion[region.name]||0)+gross);
          const channel=p.publishingChannel||'mixed';
          p.salesByChannel[channel]=money((p.salesByChannel[channel]||0)+gross);
          p.salesUnitsByRegion ||= {};p.salesUnitsByChannel ||= {};p.publishingUnitHistory ||= [];
          p.salesUnitsByRegion[region.name]=(p.salesUnitsByRegion[region.name]||0)+soldUnits;
          p.salesUnitsByChannel[channel]=(p.salesUnitsByChannel[channel]||0)+soldUnits;
          p.salesUnitsByAudience ||= {};
          for(const [cohort,units] of Object.entries(estimatePublishingAudienceUnits(s,region.name,p,soldUnits)))
            p.salesUnitsByAudience[cohort]=(p.salesUnitsByAudience[cohort]||0)+units;
          const weekRec=p.publishingUnitHistory.find(x=>x.week===s.week&&x.region===region.name&&x.channel===channel);
          if(weekRec){weekRec.units+=soldUnits;weekRec.gross=money(weekRec.gross+gross);}
          else p.publishingUnitHistory.push({week:s.week,region:region.name,channel,units:soldUnits,gross});
          if(p.publishingUnitHistory.length>CFG.tuning_engine.weekSales__009)p.publishingUnitHistory.splice(0,p.publishingUnitHistory.length-CFG.tuning_engine.weekSales__010);
          if(channel==='owned'&&s.publishingOutlet?.active){s.publishingOutlet.customerGross=money(s.publishingOutlet.customerGross+gross);s.publishingOutlet.distributionFees=money(s.publishingOutlet.distributionFees+fee);}
        }
        if(p.sector==='tv'&&p.television){
          const t=p.television;const age=s.week-p.releaseWeek,channel=age<CFG.tuning_engine.channel__001?'first-run':'syndication';
          t.regionalAdGross[region.name]=money((t.regionalAdGross[region.name]||0)+gross);
          t.channelGross[channel]=money((t.channelGross[channel]||0)+gross);
          const viewers=Math.floor(gross/(t.network==='premium'?CFG.tuning_engine.viewers__001:CFG.tuning_engine.viewers__002));
          t.estimatedViewers[region.name]=(t.estimatedViewers[region.name]||0)+viewers;
          const cohort=audienceCohorts(s,region.name),weights=cohort.map(x=>x.share*x.tastes[p.genre]*audienceAffinity(p,x));
          const all=weights.reduce((n,x)=>n+x,0)||1;let remaining=viewers;
          for(let j=0;j<cohort.length;j++){const count=j===cohort.length-1?remaining:Math.min(remaining,Math.floor(viewers*weights[j]/all));
           t.viewersByCohort[cohort[j].name]=(t.viewersByCohort[cohort[j].name]||0)+count;remaining-=count;}
          t.weeklyRatings.push({week:s.week,region:region.name,gross,estimatedViewers:viewers,channel});
          if(t.weeklyRatings.length>CFG.tuning_engine.weekSales__011){t.weeklyRatings.shift();t.ratingsHistoryComplete=false;}
          fee=money(gross*(channel==='syndication'?CFG.tuning_engine.weekSales__012:t.network==='premium'?CFG.tuning_engine.weekSales__013:t.network==='public'?CFG.tuning_engine.weekSales__014:CFG.tuning_engine.weekSales__015));
        }
        if(p.sector==='movie'){
          p.cinema.boxOffice[region.name]=money((p.cinema.boxOffice[region.name]||0)+gross);
          const channel=filmWindowChannel(p,s.week);
          const old=p.cinema.channels[channel]||0;p.cinema.channels[channel]=money(old+gross);
          const tickets=Math.floor(gross/CFG.tuning_engine.tickets__001);p.cinema.admissions[region.name]=(p.cinema.admissions[region.name]||0)+tickets;
          const weekly=p.cinema.weeklyBoxOffice.find(r=>r.week===s.week&&r.region===region.name);
          if(weekly){weekly.gross=money(weekly.gross+gross);weekly.estimatedAdmissions+=tickets;}
          else p.cinema.weeklyBoxOffice.push({week:s.week,region:region.name,channel,gross,estimatedAdmissions:tickets});
          if(p.cinema.weeklyBoxOffice.length>CFG.tuning_engine.weekSales__016){p.cinema.weeklyBoxOffice.splice(0,p.cinema.weeklyBoxOffice.length-CFG.tuning_engine.weekSales__017);p.cinema.boxOfficeHistoryComplete=false;}
          // Participation is an external talent expense from the producer's real receipts.
          const bonus=money(gross*(p.cinema.castShare||0));
          if(bonus>0){expense(s,c,bonus,'film-cast-backend','Contracted cast backend: '+p.title,p.id);p.directCost=money(p.directCost+bonus);p.cinema.castPaid=money(p.cinema.castPaid+bonus);}
          fee=money(gross*({wide:CFG.tuning_engine.weekSales__018,independent:CFG.tuning_engine.weekSales__019,limited:CFG.tuning_engine.weekSales__020}[p.cinema.distribution]||CFG.tuning_engine.weekSales__021));
        }
        if(p.sector==='games'&&p.videoGame){
          const split=gameMarketSplit(s,p,gross,region.name);
          fee=split.fee;
          if(split.fee>0){p.videoGame.platformFees=money(p.videoGame.platformFees+split.fee);p.videoGame.platformGross=money(p.videoGame.platformGross+gross);fee=split.fee;}
          p.videoGame.regionalGross[region.name]=money((p.videoGame.regionalGross[region.name]||0)+gross);
          p.videoGame.salesUnits[region.name]=(p.videoGame.salesUnits[region.name]||0)+Math.floor(gross/(p.videoGame.model==='free-to-play'?CFG.tuning_engine.weekSales__022:CFG.tuning_engine.weekSales__023));
          p.videoGame.weeklySales.push({week:s.week,region:region.name,gross,channel:split.channel});
          if(p.videoGame.weeklySales.length>CFG.tuning_engine.weekSales__024){p.videoGame.weeklySales.shift();p.videoGame.historyComplete=false;}
        }
        bookConsumerReceipt(s,c,gross,'consumer-sales',region.name+(p.sector==='tv'?' broadcast and syndication receipts: ':' earned sales: ')+p.title,p.id);
        if(p.sector==='games'&&p.videoGame&&p.videoGame.lastStoreOwnerId&&p.videoGame.lastStoreOwnerId!==p.companyId){
          const operator=company(s,p.videoGame.lastStoreOwnerId);
          const payable=money(Math.max(0,Math.min(fee, c.finance.cash-CFG.tuning_engine.payable__001)));
          if(operator&&payable>0){expense(s,c,payable,'game-store-service','Actual store service settlement: '+p.title,p.id);revenue(s,operator,payable,'game-store-commission','Store service fee earned: '+p.title,p.id);}
          const remaining=money(fee-payable);if(remaining>0)expense(s,c,remaining,'distribution','External game distribution balance: '+p.title,p.id);
        }else if(fee>0)expense(s,c,fee,'distribution','Distribution fees: '+p.title,p.id);

        const salesDuty=money(gross*region.salesTaxRate);
        expense(s,c,salesDuty,'automatic-sales-tax','Regional sales levy: '+p.title,p.id);
        p.directRevenue=money(p.directRevenue+gross);p.directCost=money(p.directCost+fee+salesDuty);p.audience=money(p.audience+gross);p.stats.weeklySales=money(p.stats.weeklySales+gross);p.stats.totalSales=money(p.stats.totalSales+gross);
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
        if(p.grantId){const g=s.grants.find(x=>x.id===p.grantId);if(g)settleRoyalty(s,p,g,gross*g.royaltyRate,gross);}
        settlePartnerShare(s,p,gross);
        gamePublisherSale43(s,p,gross);
      }
      // Aggregate competitor income is sourced from the same finite wallet;
      // it does not multiply world spending or create market-share bailouts.
      for(let j=0;j<background.length;j++){
        const item=background[j];const gross=money(budget*minorShares[j]);if(gross<CFG.tuning_engine.weekSales__025)continue;
        const b=item.firm;bookConsumerReceipt(s,b,gross,'minor-consumer-sales','Regional minor-firm original receipts',null);
        expense(s,b,money(gross*(sector==='publishing'?CFG.tuning_engine.weekSales__026:CFG.tuning_engine.weekSales__027)),'minor-distribution','Background distribution fees');
        expense(s,b,money(gross*region.salesTaxRate),'automatic-sales-tax','Regional background-sales levy');
        s.weeklyConsumerSpend=money(s.weeklyConsumerSpend+gross);
      }
    }
  }
}