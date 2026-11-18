
function update43CWeek(s){gamePublisherWeek43(s);rivalResearch43(s);boardRepWeek(s);repMilestoneWeek(s);}

// B4 — Reputation from title levels (Hit/Smash/Legendary) and studio milestones. Config: depth.json REPUTATION.
function repGain(s,c,n){c.reputation=Math.round(clamp(c.reputation+n,CFG.tuning_engine.recognizeCreativeAwards__001,CFG.tuning_engine.recognizeCreativeAwards__002));}
function repMilestoneWeek(s){const c=player(s);if(!c||c.bankrupt)return;const R=CFG.depth.REPUTATION,sm=s.studioMilestones||(s.studioMilestones={});
 if(!Array.isArray(s.legends))s.legends=[];
 let releases=0;
 for(const p of s.projects){if(p.companyId!==c.id||p.status!=='released'||p.route==='contract')continue;releases++;
  if(!(p.directCost>0))continue;const m=p.repMilestones||(p.repMilestones={}),x=p.directRevenue/p.directCost;
  for(const L of R.TITLE_LEVELS){if(m[L.key]||x<L.multiple)continue;
   if(L.minScore&&Math.max(p.quality||0,p.criticScore||0)<L.minScore)continue;
   m[L.key]=true;repGain(s,c,L.reputation);
   if(L.key==='legendary'){s.legends.push({projectId:p.id,title:p.title,companyId:c.id,sector:p.sector,week:s.week,multiple:Math.round(x*10)/10,quality:Math.round(p.quality||0)});
    if(s.legends.length>R.LEGENDS_KEEP)s.legends.splice(0,s.legends.length-R.LEGENDS_KEEP);
    news(s,p.title+' is a Legendary title','A once-in-a-generation success for '+c.name+': '+(Math.round(x*10)/10)+'x its cost at quality '+Math.round(p.quality||0)+'. Reputation +'+L.reputation+'.','award');}
   else news(s,p.title+' is a '+L.label,c.name+' title earned '+L.multiple+'x its cost. Reputation +'+L.reputation+'.','company');}}
 const mile=(key,label)=>{if(sm[key])return;sm[key]=s.week;repGain(s,c,R.STUDIO_MILESTONE_REPUTATION);news(s,c.name+' milestone: '+label,'Reputation +'+R.STUDIO_MILESTONE_REPUTATION+'.','company');};
 for(const n of R.RELEASE_COUNTS)if(releases>=n)mile('releases'+n,n+' releases');
 if((s.creativeAwards||[]).some(a=>a.companyId===c.id))mile('firstAward','first yearly award');
 if(s.legends.some(l=>l.companyId===c.id))mile('firstLegendary','first Legendary title');}

// B1 — Board Reputation (depth modes step 2). Tuning lives in config/depth.json BOARD.
function boardRepNew(s){return {value:CFG.depth.BOARD.START,target:null,history:[],overrides:0,blocks:0,promise:false,sinceWeek:s.week,lastReviewYear:yearAt(s.week)};}
function boardRepChange(s,c,delta,why){const B=CFG.depth.BOARD,r=c.corporate?.boardRep;if(!r||!delta)return 0;
 const before=r.value;r.value=clamp(Math.round(r.value+delta),B.MIN,B.MAX);
 r.history.push({week:s.week,delta:r.value-before,why,value:r.value});if(r.history.length>B.HISTORY_KEEP)r.history.splice(0,r.history.length-B.HISTORY_KEEP);
 return r.value-before;}
function boardRepStatus(s,c=player(s)){const r=c?.corporate?.boardRep;if(!r)return null;
 return {value:r.value,target:r.target?{...r.target}:null,history:r.history.slice(-10),overrides:r.overrides,blocks:r.blocks,promise:r.promise};}
function boardRepWeek(s){const c=player(s),r=c?.corporate?.boardRep;if(!c||!r||c.bankrupt)return;
 const B=CFG.depth.BOARD,year=yearAt(s.week);
 if(r.lastReviewYear<year){ // yearly review, first week of the new year
  r.lastReviewYear=year;const snap=[...s.snapshots].reverse().find(x=>x.companyId===c.id&&x.year===year-1);
  if(snap&&snap.annualProfit!==null){
   const bits=[];let total=0;
   if(r.target&&r.target.year===year-1){const hit=snap.annualProfit>0&&snap.annualRevenue>=r.target.minRevenue;
    total+=boardRepChange(s,c,hit?B.TARGET_HIT:B.TARGET_MISS,hit?'Board target met':'Board target missed');bits.push(hit?'The board\'s target was met.':'The board\'s target was missed.');}
   total+=boardRepChange(s,c,snap.annualProfit>0?B.PROFIT_YEAR:B.LOSS_YEAR,snap.annualProfit>0?'Profitable year':'Loss-making year');bits.push(snap.annualProfit>0?'The studio made a profit.':'The studio made a loss.');
   news(s,c.name+' board reviews the year','Board Reputation '+(total>=0?'+':'')+total+' to '+r.value+'. '+bits.join(' '),'company');
  }
  r.target={year,minRevenue:snap&&snap.annualRevenue!==null?money(snap.annualRevenue*B.TARGET_REVENUE_GROWTH):0};
 }
 for(const p of s.projects){ // release effects: Hit and Flop, once per title
  if(p.companyId!==c.id||p.status!=='released'||p.route==='contract'||p.releaseWeek===null||p.releaseWeek<r.sinceWeek||!(p.directCost>0))continue;
  const m=p.repMilestones||(p.repMilestones={});
  if(!m.boardHit&&!m.boardFlop&&p.directRevenue>=p.directCost*B.HIT_MULTIPLE){m.boardHit=true;boardRepChange(s,c,B.RELEASE_HIT,'Hit: '+p.title);news(s,p.title+' is a hit with the board','Board Reputation +'+B.RELEASE_HIT+'.','company');}
  else if(!m.boardFlop&&!m.boardHit&&s.week-p.releaseWeek>=B.FLOP_AGE_WEEKS&&p.directRevenue<p.directCost*B.FLOP_FRACTION){m.boardFlop=true;boardRepChange(s,c,B.RELEASE_FLOP,'Flop: '+p.title);news(s,p.title+' disappoints the board','Board Reputation '+B.RELEASE_FLOP+'.','company');}
 }}

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
// Depth modes D3 — yearly Inbox decision-card limit per mode (config/depth.json INBOX/PRIORITY).
// Every new Inbox item is triaged: shown as a card, or filed and settled by policy. Urgent items
// are always shown. Very Complex has no limit, so it only counts cards. No RNG is used here.
function inboxRulesD3(s){return CFG.depth.INBOX[s.settings?.depth]||CFG.depth.INBOX.veryComplex;}
function inboxPriorityD3(key){const P=CFG.depth.PRIORITY,hit=list=>list.some(p=>key.startsWith(p));
 return hit(P.urgent)?'urgent':hit(P.low)?'low':'normal';}
function decisionYearD3(s){const y=yearAt(s.week);
 if(!s.decisionCards||s.decisionCards.year!==y)s.decisionCards={year:y,cards:0,low:0,auto:0};return s.decisionCards;}
function triageInboxItemD3(s,item){
 const log=decisionYearD3(s),rules=inboxRulesD3(s),priority=inboxPriorityD3(item.key);
 const dispute=item.key.startsWith('commission-dispute-')&&rules.autoDisputes;
 const show=!dispute&&(priority==='urgent'||rules.yearlyCards===null||
  (log.cards<rules.yearlyCards&&(priority==='normal'||log.cards<rules.lowPriorityCards)));
 if(show){log.cards++;if(priority==='low')log.low++;item.depthTriage='card';return;}
 item.open=false;item.depthTriage='auto';log.auto++;
}
// Settles one filed item. Returns a short outcome, or throws if the decision could not be made.
function settleInboxItemD3(s,item){
 const k=item.key,ref=prefix=>k.slice(prefix.length);
 if(k.startsWith('commission-counter-')){const o=s.commissionOffers.find(x=>x.id===ref('commission-counter-'));
  if(!o||o.status!=='counter')return 'already handled';
  // Accepting only agrees terms (no production starts), so any counter that keeps the policy margin is taken.
  const ok=o.counterFee>=o.baseCost*(1+s.commissionPolicy.minMargin);
  if(ok)try{answerCommissionOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerCommissionOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('co-offer-')){const o=s.coProductionOffers.find(x=>x.id===ref('co-offer-'));
  if(!o||o.status!=='counter'||s.week>o.expiresWeek)return 'already handled';
  const ok=o.commitment<=s.coProductionPolicy.maxCommitment&&o.counterShare<=s.coProductionPolicy.maxShare;
  if(ok)try{answerCoProductionOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerCoProductionOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('rights-counter-')){const o=s.rightsOffers.find(x=>x.id===ref('rights-counter-'));
  if(!o||o.status!=='counter')return 'already handled';
  try{answerRightsOffer(s,o.id,true);return 'counteroffer accepted';}catch(e){}
  answerRightsOffer(s,o.id,false);return 'counteroffer declined';}
 if(k.startsWith('approval-')){const a=s.creativeApprovals.find(x=>x.id===ref('approval-'));
  if(!a||a.status!=='pending')return 'already handled';decideCreativeApproval(s,a.id,true);return 'creator request approved';}
 if(k.startsWith('commission-dispute-'))return autoResolveDisputeD3(s,ref('commission-dispute-'));
 return 'filed';
}
function autoResolveDisputeD3(s,projectId){
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 if(!e||e.settled||e.review47?.status!=='open')return 'already handled';
 try{commissionResolve47(s,projectId,'rework');return 'dispute settled with paid rework';}
 catch(err){commissionResolve47(s,projectId,'arbitrate');return 'dispute settled by neutral arbitration';}
}
function settleFiledInboxD3(s){
 for(const item of [...s.inbox].reverse()){if(item.depthTriage!=='auto')continue;
  try{const outcome=settleInboxItemD3(s,item);item.depthTriage='settled';
   if(outcome!=='already handled')news(s,'Handled automatically: '+item.title,'Your '+CFG.depth.LABELS[s.settings.depth].name+' policy: '+outcome+'.','company');}
  catch(err){item.depthTriage='card';item.open=true;decisionYearD3(s).cards++;}// could not decide safely: hand it to the player
 }
}
const _alertBeforeD3=alert;
alert=function(s,key,title,body,kind='critical'){const before=s.inbox[0];_alertBeforeD3(s,key,title,body,kind);
 const item=s.inbox[0];if(item&&item!==before&&item.key===key)triageInboxItemD3(s,item);};
const _singleWeekBeforeD3=singleWeek;
singleWeek=function(s){settleFiledInboxD3(s);_singleWeekBeforeD3(s);settleFiledInboxD3(s);};
const _commissionInspectionBeforeD3=commissionInspection47;
commissionInspection47=function(s,projectId){const r=_commissionInspectionBeforeD3(s,projectId);
 if(r.status!=='open'||!inboxRulesD3(s).autoDisputes)return r;
 settleFiledInboxD3(s);
 const p=s.projects.find(x=>x.id===projectId),e=p&&s.escrows.find(x=>x.id===p.escrowId);
 return {...(e?.review47||r),autoResolved:true};};
function decisionCardLog(s){const y=yearAt(s.week),d=s.decisionCards?.year===y?s.decisionCards:{year:y,cards:0,low:0,auto:0};
 return {...d,limit:inboxRulesD3(s).yearlyCards,lowLimit:inboxRulesD3(s).lowPriorityCards};}
// Depth modes D7 — pace rules per mode (config/depth.json PACE_RULES). Very Complex has every rule off.
// No RNG and no new save fields: cards are ordinary Inbox items and go through D3 triage.
function paceRulesD7(s){return CFG.depth.PACE_RULES[s.settings?.depth]||CFG.depth.PACE_RULES.veryComplex;}
function cashWarningD7(key){return key.startsWith('liquidity-')||key.startsWith('cash-stress-');}
// One cash warning at a time: the "low cash" and "cash stress" warnings merge, and a paused (furloughed)
// studio gets at most one every cashWarningWeeks weeks.
const _alertBeforeD7=alert;
alert=function(s,key,title,body,kind='critical'){const rules=paceRulesD7(s);
 if(rules.cashWarningWeeks&&cashWarningD7(key)){
  const last=s.inbox.filter(a=>cashWarningD7(a.key)).reduce((m,a)=>Math.max(m,a.week),-Infinity);
  const gap=player(s)?.operating44?.furloughed?rules.cashWarningWeeks:rules.mergeCashWeeks;
  if(s.week-last<gap)return;}
 _alertBeforeD7(s,key,title,body,kind);};
// Release reports for every original release (not just major ones).
const _reviewReleasesBeforeD7=reviewReleases;
reviewReleases=function(s){const rules=paceRulesD7(s);
 const due=rules.allPostmortems?s.projects.filter(p=>p.companyId===s.playerId&&p.status==='released'&&!p.review&&!p.major&&p.route!=='contract'):[];
 _reviewReleasesBeforeD7(s);
 for(const p of due)if(p.review)alert(s,'postmortem-'+p.id,'Release report: '+p.title,
  p.review.assessment+' after the first 13 sales weeks. Direct contribution '+shortMoney(p.review.actualDirect)+'. Open Productions for details.','advisory');};
// "Project finished" card: each player release asks what to make next.
const _singleWeekBeforeD7=singleWeek;
singleWeek=function(s){const rules=paceRulesD7(s);
 const active=rules.releaseCards?s.projects.filter(p=>p.companyId===s.playerId&&p.status==='active'):[];
 _singleWeekBeforeD7(s);
 for(const p of active)if(p.status==='released')alert(s,'project-done-'+p.id,'Released: '+p.title,
  'This project is finished and on sale. Your team is free: greenlight your next project in Productions.','advisory');};
