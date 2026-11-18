
function audit47A(s,problems){
 for(const e of s.escrows||[]){if(!e.review47)continue;
  const r=e.review47,p=s.projects.find(x=>x.id===e.projectId);
  if(!p||!Number.isInteger(r.week)||r.week> s.week||!['open','approved','remedied','cancelled','arbitrated'].includes(r.status)||
   !Number.isFinite(r.riskScore)||r.riskScore<1||r.riskScore>CFG.tuning_engine.audit47A__001||
   (r.status==='open'&&(e.settled||p.status!=='active'))||
   (r.status==='arbitrated'&&(!e.settled||p.status!=='cancelled'||money((r.refund||0)+(r.award||0))<0||Math.abs(money((r.refund||0)+(r.award||0)+e.advance+(e.milestonePaid||0)-e.fee))>CFG.tuning_engine.audit47A__002)))
     problems.push(e.id+': invalid contested milestone settlement');
 }
}
const _auditBefore47A=audit;
audit=function(s){const problems=_auditBefore47A(s);audit47A(s,problems);return problems;};


// Update 47 — one real lender workout for genuinely delinquent secured debt.
// No new lender cash, cancellation of principal, or disappearance of accrued interest.
function loanWorkoutQuote47(s,loanId){
 const loan=s.loans.find(l=>l.id===loanId),c=loan&&company(s,loan.debtorId);
 if(!c)throw new Error('Unknown borrower or lender claim.');
 const principal=money(loan.principalOutstanding),arrears=money(loan.interestArrears+loan.principalArrears);
 const collateral=money(Math.max(0,c.finance.cash)+Math.max(0,c.finance.receivable)*CFG.tuning_engine.collateral__001+
  Math.max(0,c.finance.inventory)*CFG.tuning_engine.collateral__002+Math.max(0,c.finance.investment)*CFG.tuning_engine.collateral__003);
 let reason='Conditional lender workout available.';
 if(!controlledCompanies(s).some(x=>x.id===c.id))reason='This loan belongs to another company.';
 else if(c.bankrupt||loan.status==='paid')reason='The borrower is bankrupt or the claim is already paid.';
 else if(loan.workout47)reason='Bank permits only one principal term extension.';
 else if(loan.status!=='delinquent')reason='Current loans do not qualify for distress protection.';
 else if(loan.missedPeriods>CFG.tuning_engine.loanWorkoutQuote47__001&&collateral<principal*CFG.tuning_engine.loanWorkoutQuote47__002)reason='Creditor declined: extended delinquency and insufficient recoverable collateral.';
 return {loanId,companyId:c.id,approved:reason==='Conditional lender workout available.',reason,
  outstandingPrincipal:principal,overduePrincipal:loan.principalArrears,overdueInterest:loan.interestArrears,
  termMonths:CFG.tuning_engine.loanWorkoutQuote47__003,oldAnnualRate:loan.interestRate,annualRate:money(Math.min(CFG.tuning_engine.loanWorkoutQuote47__004,Math.max(loan.interestRate,marketLoanRate(s,c.id))+CFG.tuning_engine.loanWorkoutQuote47__005)),
  collateralEstimate:collateral,source:'reviewed existing receivables and company assets; not a new capital injection'};
}
function restructureLoan47(s,loanId){
 requireExecutiveControl(s);
 const quote=loanWorkoutQuote47(s,loanId);
 if(!quote.approved)throw new Error(quote.reason);
 const loan=s.loans.find(l=>l.id===loanId),c=company(s,loan.debtorId);
 if(c.id===s.playerId)boardMandate(s,'restructuring',Math.min(CFG.tuning_engine.restructureLoan47__001,loan.principalOutstanding));
 const startPaid=loan.principalPaid,startPrincipal=loan.principalOutstanding,priorRate=loan.interestRate;
 loan.workout47={approvedWeek:s.week,principalAtStart:startPrincipal,principalPaidAtStart:startPaid,
   oldRate:priorRate,newRate:quote.annualRate,termMonths:CFG.tuning_engine.restructureLoan47__002,interestArrearsAtStart:loan.interestArrears,
   principalArrearsAtStart:loan.principalArrears};
 loan.installmentsDue=0;loan.principalArrears=0;loan.interestRate=quote.annualRate;
 // Unpaid interest stays legally payable; no fictional refinancing proceeds.
 loan.status=loan.interestArrears>0?'delinquent':'current';
 loan.missedPeriods=loan.status==='delinquent'?1:0;
 if(c.id===s.playerId)boardMandate(s,'restructuring',Math.min(CFG.tuning_engine.restructureLoan47__003,loan.principalOutstanding),true);
 news(s,'Lender modifies debt schedule for '+c.name,CFG.events.messages.restructureLoan47__001,'finance');
 return {...loan.workout47,loanId,principalOutstanding:loan.principalOutstanding,interestOutstanding:loan.interestArrears};
}
function audit47B(s,problems){
 for(const l of s.loans||[])if(l.workout47){
  const w=l.workout47;
  if(!Number.isInteger(w.approvedWeek)||w.approvedWeek<l.createdWeek||w.approvedWeek>s.week||w.termMonths!==CFG.tuning_engine.audit47B__001||
   w.principalAtStart<=0||w.principalPaidAtStart<0||
   Math.abs(money(w.principalAtStart+w.principalPaidAtStart-l.originalPrincipal))>CFG.tuning_engine.audit47B__002||
   !Number.isFinite(w.newRate)||w.newRate<w.oldRate||w.newRate>CFG.tuning_engine.audit47B__003||
   w.interestArrearsAtStart<0||w.principalArrearsAtStart<0)
    problems.push(l.id+': invalid lender restructuring records');
 }
}
const _auditBefore47B=audit;
audit=function(s){const problems=_auditBefore47B(s);audit47B(s,problems);return problems;};


// UPDATE 49 — regional game platform adoption and financed continuing support.
// No new industry or console-manufacturing enterprise: figures are aggregate
// eligible audiences, not real simulated devices or unlimited consumer wallets.
function gamePlatformMarket49(s,platform,region,week=s.week,generation=null){
 if(!GAME_PLATFORMS[platform])throw new Error('Unknown game platform.');
 const r=activeRegions(s).find(x=>x.name===region);
 if(!r)throw new Error('Unknown game market.');
 const debut=GAME_PLATFORMS[platform],year=yearAt(week);
 if(year<debut)return {platform,region,year,active:false,generation:0,installed:0,allGenerations:0,penetration:0,maturity:0,estimated:true};
 const current=gameGeneration(week,platform),g=generation===null?current:generation;
 if(!Number.isInteger(g)||g<1||g>current)throw new Error('Generation not commercially available.');
 const pace=ADOPTION_PACES[s.settings.adoptionPace]||1;
 const globalAge=Math.max(0,(week-(debut-1)*CFG.tuning_engine.globalAge__001)/CFG.tuning_engine.globalAge__002),genStart=(debut+(g-1)*CFG.tuning_engine.genStart__001-1)*CFG.tuning_engine.genStart__002;
 const age=Math.max(0,(week-genStart)/CFG.tuning_engine.age__001);
 // Platform addressable audience expands slowly even after its global debut.
 const regionalPopulation=Math.round(r.cash*CFG.tuning_engine.regionalPopulation__001*(s.settings.populationScale||1));
 const penetration=clamp(CFG.tuning_engine.penetration__001+CFG.tuning_engine.penetration__002*(1-Math.exp(-globalAge*pace/CFG.tuning_engine.penetration__003)),CFG.tuning_engine.penetration__004,CFG.tuning_engine.penetration__005);
 const allGenerations=Math.max(1,Math.floor(regionalPopulation*penetration));
 const generationAdoption=clamp(CFG.tuning_engine.generationAdoption__001+CFG.tuning_engine.generationAdoption__002*(1-Math.exp(-age*pace/CFG.tuning_engine.generationAdoption__003)),CFG.tuning_engine.generationAdoption__004,CFG.tuning_engine.generationAdoption__005);
 const retiredYears=Math.max(0,(week-(genStart+CFG.tuning_engine.retiredYears__001*CFG.tuning_engine.retiredYears__002))/CFG.tuning_engine.retiredYears__003);
 const retained=Math.exp(-retiredYears*CFG.tuning_engine.retained__001*pace);
 const installed=Math.min(allGenerations,Math.max(1,Math.floor(allGenerations*generationAdoption*retained)));
 return {platform,region,year,active:true,generation:g,currentGeneration:current,installed,allGenerations,
  penetration:Number(penetration.toFixed(CFG.tuning_engine.gamePlatformMarket49__001)),maturity:Number((generationAdoption*retained).toFixed(CFG.tuning_engine.gamePlatformMarket49__002)),estimated:true};
}
function gamePlatformDemand49(s,p,region){
 const g=p.videoGame;if(!g)return 1;
 const m=gamePlatformMarket49(s,g.platform,region,s.week,g.generation);
 if(!m.active)return 0;
 // Older generations keep niche sales, but active generations adopt gradually.
 return clamp(m.installed/Math.max(1,m.allGenerations)*CFG.tuning_engine.gamePlatformDemand49__001*(g.liveService49?.status==='active'?CFG.tuning_engine.gamePlatformDemand49__002:1),CFG.tuning_engine.gamePlatformDemand49__003,CFG.tuning_engine.gamePlatformDemand49__004);
}
function gamePlatformCapGross49(s,p,region,gross){
 const g=p.videoGame;if(!g||gross<=0)return gross;
 const m=gamePlatformMarket49(s,g.platform,region,s.week,g.generation);
 const price=g.model==='free-to-play'?CFG.tuning_engine.price__010:CFG.tuning_engine.price__011;
 // Paid units are unique purchasers of this title. Free-to-play units are a
 // weekly audience proxy, not lifetime unique users or a new spending pool.
 const acquired=g.model==='free-to-play'?0:Math.max(0,g.salesUnits[region]||0);
 const capacity=Math.max(0,m.installed-acquired);
 return money(Math.min(Math.floor(gross/price),capacity)*price);
}
function gamePlatformReport49(s,region=null){
 const regions=region?[region]:activeRegions(s).map(x=>x.name);
 return regions.flatMap(name=>Object.keys(GAME_PLATFORMS).filter(platform=>yearAt(s.week)>=GAME_PLATFORMS[platform]).map(platform=>gamePlatformMarket49(s,platform,name)));
}
function gameLiveService49(s,projectId,action='start'){
 requireExecutiveControl(s);
 const {p,c,g}=gameProject(s,projectId,false);
 if(p.status!=='released'||!['strategy','action','simulation'].includes(g.mechanic)||!['start','pause','resume','stop'].includes(action))
  throw new Error('A funded released competitive game is required for recurring support.');
 const live=g.liveService49||null;
 if(action==='start'&&live)throw new Error('This service has already been configured.');
 if(action!=='start'&&!live)throw new Error('No recurring service to manage.');
 if(action==='resume'&&live.status!=='paused')throw new Error('Only paused services can resume.');
 if(action==='pause'&&live.status!=='active'||action==='stop'&&live.status==='closed')throw new Error('Service already inactive.');
 const monthlyCost=CFG.tuning_engine.monthlyCost__001;
 if(action==='start'||action==='resume'){
  if(!gameDistributionAllowed(s,p,s.week))throw new Error('Publishing rights must remain effective for ongoing service.');
  if(c.finance.cash<monthlyCost+CFG.tuning_engine.gameLiveService49__001)throw new Error('Insufficient cash to fund service and retain an operating reserve.');
  expense(s,c,monthlyCost,'game-live-service','Competitive event and community hosting: '+p.title,p.id);
  p.directCost=money(p.directCost+monthlyCost);
  const rec=live||{status:'active',startedWeek:s.week,totalPaid:0,billed:0,history:[]};
  rec.status='active';rec.totalPaid=money(rec.totalPaid+monthlyCost);rec.billed++;
  rec.nextPeriod=yearAt(s.week)*CFG.tuning_engine.gameLiveService49__002+periodAt(s.week)+1;
  rec.history.push({week:s.week,kind:action,cost:monthlyCost});
  g.liveService49=rec;
 }else{
  live.status=action==='stop'?'closed':'paused';
  live.history.push({week:s.week,kind:action,cost:0});
 }
 return {...g.liveService49,history:g.liveService49.history.slice(-CFG.tuning_engine.gameLiveService49__003)};
}
function gameLiveServiceWeek49(s){
 const period=yearAt(s.week)*CFG.tuning_engine.period__001+periodAt(s.week);
 for(const p of s.projects){const live=p.videoGame?.liveService49;
  if(!live||live.status!=='active'||period<live.nextPeriod)continue;
  const c=company(s,p.companyId),cost=CFG.tuning_engine.cost__053;
  if(!c||c.bankrupt||p.status!=='released'||!gameDistributionAllowed(s,p,s.week)||c.finance.cash<cost+CFG.tuning_engine.gameLiveServiceWeek49__001){
   live.status='paused';live.history.push({week:s.week,kind:'automatic-pause',cost:0});
   if(c?.id===s.playerId)news(s,'Live service paused: '+p.title,CFG.events.messages.gameLiveServiceWeek49__001,'company');
  }else{
   expense(s,c,cost,'game-live-service','Monthly competitive event operations: '+p.title,p.id);
   p.directCost=money(p.directCost+cost);live.totalPaid=money(live.totalPaid+cost);live.billed++;
   live.history.push({week:s.week,kind:'monthly',cost});
  }
  live.nextPeriod=period+1;
  if(live.history.length>CFG.tuning_engine.gameLiveServiceWeek49__002)live.history.splice(0,live.history.length-CFG.tuning_engine.gameLiveServiceWeek49__003);
 }
}