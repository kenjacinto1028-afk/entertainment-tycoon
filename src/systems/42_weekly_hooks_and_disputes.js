
function update43CWeek(s){gamePublisherWeek43(s);rivalResearch43(s);}

// UPDATE 44A — fair sector-entrant financing and funded payroll work.
// New industry competitors use the SAME finite entrepreneur reserve as later
// startups. A studio that cannot pay workers cannot indefinitely complete new
// projects merely by adding unpaid payroll to the liability ledger.
function ensure44A(s){
 if(!Number.isFinite(s.entrepreneurPool))ensure42A(s);
 if(!s.hardening44)s.hardening44={startedWeek:s.week,entrepreneurOpening:money(s.entrepreneurPool||0),debutCommitted:0,seededVersion:s.version};
 if(!Array.isArray(s.debutFundings44))s.debutFundings44=[];
 for(const c of s.companies||[])if(!c.operating44)c.operating44={unfundedWeeks:0,furloughed:false,startWeek:null,resumptions:0};
}
function industryDebutFirm44(s,sector,year,name){
 ensure44A(s);
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('Industry competitor must wait for worldwide debut.');
 const minCapital=money(Math.max(CFG.tuning_engine.minCapital__001,SECTORS[sector].cost*CFG.tuning_engine.minCapital__002));
 // Deterministic but affordable. When external founder capital is exhausted,
 // market entry is deferred, not secretly subsidized.
 const proposed=money(CFG.tuning_engine.proposed__001+rand(s)*CFG.tuning_engine.proposed__002);
 if(s.entrepreneurPool<minCapital){
  s.hardening44.deferredEntrants=(s.hardening44.deferredEntrants||0)+1;
  return null;
 }
 const capital=money(Math.min(proposed,s.entrepreneurPool));
 if(capital<minCapital)return null;
 s.entrepreneurPool=money(s.entrepreneurPool-capital);
 const firm=createCompany(s,{name,sector,foundedYear:year,cash:capital,reputation:CFG.tuning_engine.firm__007+Math.floor(rand(s)*CFG.tuning_engine.firm__008)});
 s.debutFundings44.push({companyId:firm.id,sector,week:s.week,capital,source:'finite-entrepreneur-pool'});
 s.hardening44.debutCommitted=money(s.hardening44.debutCommitted+capital);
 rivalEvent(s,firm,'funded-industry-debut',{capital,sector,source:'finite-entrepreneur-pool'});
 return firm;
}
function fundedPayroll44(s,c){
 ensure44A(s);
 const state=c.operating44,weekly=weeklyOverhead(c,s),cash=c.finance.cash;
 if(state.furloughed){
  // The company must have liquidity for at least four funded work-weeks plus
  // sufficiently manageable outstanding obligations before resuming payroll.
  if(cash>=weekly*CFG.tuning_engine.fundedPayroll44__001&&c.finance.payable<=cash+weekly*CFG.tuning_engine.fundedPayroll44__002){
   state.furloughed=false;state.unfundedWeeks=0;state.resumptions++;
   if(c.isPlayer)news(s,'Operations resume at '+c.name,CFG.events.messages.fundedPayroll44__001,'company');
  }else return false;
 }
 if(cash<weekly*CFG.tuning_engine.fundedPayroll44__003){state.unfundedWeeks++;
  if(state.unfundedWeeks>=CFG.tuning_engine.fundedPayroll44__004){
   state.furloughed=true;state.startWeek=s.week;
   if(c.isPlayer){
    alert(s,'unpaid-labor-'+c.id,CFG.events.messages.fundedPayroll44__002,
     CFG.events.messages.fundedPayroll44__003,'critical');
    news(s,CFG.events.messages.fundedPayroll44__004,c.name+' furloughed its teams. No new production output will be claimed without funded labor.','company');
   }
   return false;
  }
 }else state.unfundedWeeks=0;
 return true;
}
function operatingStatus44(s,companyId=s.playerId){
 const c=company(s,companyId);if(!c)throw new Error('Unknown company.');ensure44A(s);
 return {companyId:c.id,weeklyPayroll:weeklyOverhead(c,s),cash:c.finance.cash,payable:c.finance.payable,
  ...c.operating44,explanation:'A furlough pauses production without erasing existing payroll, royalty, tax, credit or other obligations.'};
}
function audit44A(s,problems){
 ensure44A(s);const d=s.hardening44;
 if(!Number.isFinite(d.entrepreneurOpening)||d.entrepreneurOpening<0||!Number.isFinite(s.entrepreneurPool)||s.entrepreneurPool<-CFG.tuning_engine.audit44A__001||
  !Number.isFinite(d.debutCommitted)||d.debutCommitted<0||d.debutCommitted>d.entrepreneurOpening+CFG.tuning_engine.audit44A__002||
  d.debutCommitted>d.entrepreneurOpening-s.entrepreneurPool+CFG.tuning_engine.audit44A__003)
  problems.push('Update44 unfunded industry entrant capital');
 const seen=new Set();let booked=0;
 for(const row of s.debutFundings44){
  if(seen.has(row.companyId)||!s.companies.some(c=>c.id===row.companyId&&c.foundedYear===yearAt(row.week)&&c.finance.equity>=row.capital-CFG.tuning_engine.audit44A__004)||
   !SECTORS[row.sector]||row.week>s.week||yearAt(row.week)<SECTORS[row.sector].year||row.capital<=0)problems.push('Update44 invalid industry debut funding record');
  seen.add(row.companyId);booked=money(booked+row.capital);
 }
 if(Math.abs(booked-d.debutCommitted)>CFG.tuning_engine.audit44A__005)problems.push('Update44 founder-funding ledger mismatch');
 for(const c of s.companies){const w=c.operating44;
  if(!w||!Number.isInteger(w.unfundedWeeks)||w.unfundedWeeks<0||typeof w.furloughed!=='boolean'||
    !Number.isInteger(w.resumptions)||w.resumptions<0||w.startWeek!==null&&w.startWeek>s.week)
    problems.push('Update44 invalid company payroll state');
 }
}
const _create44A=createGame;
createGame=function(input){const s=_create44A(input);ensure44A(s);return s;};
const _load44A=loadState;
loadState=function(raw){const s=_load44A(raw);ensure44A(s);return s;};
const _audit44A=audit;
audit=function(s){const errs=_audit44A(s);audit44A(s,errs);return errs;};


// Update 45 — exclusive distribution and outstanding production safeguards.
// Exclusive licenses must restrict their grantor's ongoing exploitation in the
// licensed medium/territory. Neither pre-debut options nor licensing a distinct
// medium silently curtail existing sales.
const _canDistributeBefore45=canDistribute43;
canDistribute43=function(s,p,region,week=s.week){
 if(!_canDistributeBefore45(s,p,region,week))return false;
 const ip=s.ips.find(x=>x.id===p.ipId);
 if(!ip||ip.ownerId!==p.companyId||!['publishing','movie','tv','games'].includes(p.sector))return true;
 return !s.grants.some(g=>g.ipId===p.ipId&&g.media===p.sector&&g.type==='license'&&g.exclusive&&
   g.holderId!==p.companyId&&g.startWeek<=week&&g.endWeek>week&&regionScope43(g).includes(region));
};
const _grantRightsPackageBefore45=grantRightsPackage43;
grantRightsPackage43=function(s,terms){
 if(terms?.exclusive){
  const regions=normalizeRegions43(terms.territories??['North Coast']);
  const grantor=terms.parentGrantId?s.playerId:s.ips.find(i=>i.id===terms.ipId)?.ownerId;
  const conflict=s.projects.some(p=>p.status==='active'&&p.companyId===grantor&&p.ipId===terms.ipId&&p.sector===terms.media&&
    (!Array.isArray(p.territories43)||p.territories43.some(r=>regions.includes(r))));
  if(conflict)throw new Error('Finish or legally re-scope existing active productions before granting exclusive rights in the same medium and territory.');
 }
 return _grantRightsPackageBefore45(s,terms);
};


// Update 47 — client-delivery disputes; all monetary movements use reserved escrow.
// Reviews are optional unless explicitly requested, never a mandatory weekly task.
function commissionInspection47(s,projectId){
 requireExecutiveControl(s);
 const p=s.projects.find(x=>x.id===projectId&&x.companyId===s.playerId&&x.route==='contract'&&x.status==='active');
 const e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47||p.weeksDone<p.weeksTotal*CFG.tuning_engine.commissionInspection47__001||p.weeksDone>=p.weeksTotal)
   throw new Error('Client inspection is available once during active, substantively started contract work.');
 const challenged=p.quality<CFG.tuning_engine.challenged__001||(hash(s.seed+':delivery-review:'+p.id)%CFG.tuning_engine.challenged__002===0);
 e.review47={week:s.week,status:challenged?'open':'approved',reason:challenged?'Client challenges quality or agreed delivery scope.':'Client accepted inspected work.',riskScore:p.quality,settlement:null};
 if(challenged){
  alert(s,'commission-dispute-'+p.id,'Client disputes delivery: '+p.title,
   CFG.events.messages.commissionInspection47__001,'critical');
  news(s,'Client requests remedy: '+p.title,CFG.events.messages.commissionInspection47__002,'company');
 }
 return {...e.review47};
}
function commissionDispute47(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 return e?{projectId,escrowId:e.id,fee:e.fee,earned:money(e.advance+(e.milestonePaid||0)),protected:e.held,
   inspection:e.review47?{...e.review47}:null}:null;
}
const _cancelProjectBefore47=cancelProject;
cancelProject=function(s,projectId){const p=_cancelProjectBefore47(s,projectId),e=s.escrows.find(x=>x.projectId===projectId);
 if(e?.review47?.status==='open'){e.review47.status='cancelled';e.review47.settlement='protected-refund';}
 return p;
};
function commissionResolve47(s,projectId,decision){
 requireExecutiveControl(s);
 const p=s.projects.find(x=>x.id===projectId&&x.companyId===s.playerId&&x.status==='active');
 const e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47?.status!=='open')throw new Error('No outstanding funded client dispute.');
 if(!['rework','cancel','arbitrate'].includes(decision))throw new Error('Choose rework, cancellation or contract arbitration.');
 if(decision==='cancel'){const before=e.held;cancelProject(s,projectId);return {decision,refunded:before,sellerAward:0};}
 if(decision==='rework'){
  const seller=company(s,e.sellerId),cost=money(Math.max(CFG.tuning_engine.cost__051,p.budget*CFG.tuning_engine.cost__052));
  if(seller.finance.cash<cost+weeklyOverhead(seller,s)*CFG.tuning_engine.commissionResolve47__001)throw new Error('Remedial work is not funded; use arbitration or cancel.');
  expense(s,seller,cost,'contract-remediation','Client-approved corrective work: '+p.title,p.id);
  p.directCost=money(p.directCost+cost);p.productionSpend=money((p.productionSpend||0)+cost);
  p.weeksTotal+=CFG.tuning_engine.commissionResolve47__002;e.review47.status='remedied';e.review47.settlement='paid-rework';e.review47.cost=cost;
  news(s,'Client approves paid remedy: '+p.title,CFG.events.messages.commissionResolve47__001,'production');
  const notice=s.inbox.find(a=>a.key==='commission-dispute-'+p.id);if(notice)notice.open=false;
  return {decision,cost,extraWeeks:CFG.tuning_engine.commissionResolve47__003,protected:e.held};
 }
 // Fictional neutral arbitration splits only the *unearned reserved balance*.
 // Earned advance/milestones stay earned. No third-party cash is invented.
 const buyer=company(s,e.buyerId),seller=company(s,e.sellerId),held=e.held;
 const award=money(held*clamp(CFG.tuning_engine.award__002+p.quality/CFG.tuning_engine.award__003,CFG.tuning_engine.award__004,CFG.tuning_engine.award__005)),refund=money(held-award),earned=money(e.advance+(e.milestonePaid||0));
 transact(s,buyer,'client-arbitration',{cash:refund,prepaid:-e.fee,expense:money(e.fee-refund)},'Neutral commission settlement and protected refund',p.id);
 transact(s,seller,'service-arbitration',{cash:award,deferred:-earned,revenue:money(earned+award)},'Neutral contract settlement of earned work',p.id);
 p.directRevenue=money(p.directRevenue+earned+award);e.held=0;e.settled=true;e.cancelled=true;e.closedWeek=s.week;
 e.review47.status='arbitrated';e.review47.settlement='neutral-award';e.review47.refund=refund;e.review47.award=award;
 recordCommissionOutcome(s,p,'cancelled');releaseProjectSpecialist(s,p);p.status='cancelled';p.cancelledWeek=s.week;
 const notice=s.inbox.find(a=>a.key==='commission-dispute-'+p.id);if(notice)notice.open=false;
 news(s,'Arbitration settled: '+p.title,CFG.events.messages.commissionResolve47__002,'company');
 return {decision,refunded:refund,sellerAward:award,earned};
}