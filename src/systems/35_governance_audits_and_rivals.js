
function auditGovernance(s,problems){if(!player(s)?.corporate)problems.push('Missing player company governance identity');
 if(!Number.isFinite(s.investorPool)||s.investorPool<-CFG.tuning_engine.auditGovernance__001||!Number.isFinite(s.investorPoolOpening)||
 !Array.isArray(s.governanceHistory)||!Array.isArray(s.personalMoneyHistory)||!Array.isArray(s.careerLineage)||!Number.isFinite(s.founderFunds)||s.founderFunds<-CFG.tuning_engine.auditGovernance__002||
 !['active','ended'].includes(s.runStatus)||!s.management||!['active','transition','removed'].includes(s.management.status)){
 problems.push('Invalid governance and career records');return;}
 let financing=0,usedShares=0;
 for(const c of s.companies){const g=c.corporate;if(!g)continue;
 const st=['founder','private-corporation','public-corporation'].includes(g.stage),sh=g.shares,
 sum=Object.values(sh||{}).reduce((n,x)=>n+x,0),founder=Number.isInteger(sh?.founder)&&sh.founder>=0;
 if(!st||!founder||!Number.isInteger(sh.investor)||sh.investor<0||!Number.isInteger(sh.public)||sh.public<0||sum<1||
 g.stage==='founder'&&g.board!==null||g.stage!=='founder'&&(!Array.isArray(g.board)||g.board.length!==CFG.tuning_engine.auditGovernance__003)||
 !g.policy||!Number.isInteger(g.policy.reviewLimit)||g.policy.reviewLimit<CFG.tuning_engine.auditGovernance__004||g.policy.minCashWeeks<CFG.tuning_engine.auditGovernance__005||g.policy.minCashWeeks>CFG.tuning_engine.auditGovernance__006||
 g.policy.maxDebtRatio<CFG.tuning_engine.auditGovernance__007||g.policy.maxDebtRatio>1||!Array.isArray(g.fundings)||!Array.isArray(g.shareSales)||!Array.isArray(g.dividends)||!Array.isArray(g.resolutions)||!Array.isArray(g.lineage))
 problems.push('Invalid corporate share ledger or governance board');
 let issued=0,netSaleShares=0,distribution=0;
 for(const f of g.fundings||[]){if(!['investor','public'].includes(f.kind)||!Number.isInteger(f.shares)||f.shares<=0||f.amount<CFG.tuning_engine.auditGovernance__008||f.week>s.week)problems.push('Invalid issued equity funding');issued=money(issued+f.amount);netSaleShares+=f.shares;}
 for(const f of g.shareSales||[]){if(!Number.isInteger(f.shares)||f.shares<1||f.proceeds<0||f.week>s.week)problems.push('Invalid personal share sale');}
 for(const d of g.dividends||[]){if(d.amount<=0||d.founderReceived<0||d.founderReceived>d.amount||d.week>s.week)problems.push('Invalid shareholder distribution');distribution=money(distribution+d.amount);}
 if(sum!==CFG.tuning_engine.auditGovernance__009+netSaleShares)problems.push('Invalid share issuance conservation');
 if(g.stage!=='founder'&&Math.abs(c.finance.equity-money(g.baselineEquity+issued-distribution))>CFG.tuning_engine.auditGovernance__010)problems.push('Invalid company paid-in equity bridge');
 for(const r of g.resolutions||[])if(!['expansion','financing','succession','ipo','investment','restructuring'].includes(r.kind)||r.expiresWeek!==r.week+CFG.tuning_engine.auditGovernance__011||r.week>s.week||!Array.isArray(r.votes)||r.votes.length!==CFG.tuning_engine.auditGovernance__012||r.approved!== (r.votes.filter(v=>v.vote==='yes').length>=CFG.tuning_engine.auditGovernance__013))problems.push('Invalid board resolution votes');
 financing+=issued;usedShares+=(g.shareSales||[]).reduce((n,x)=>n+x.proceeds,0);
 }
 if(Math.abs(money(s.investorPoolOpening-s.investorPool-financing-usedShares))>CFG.tuning_engine.auditGovernance__014)problems.push('Invalid investor capital pool conservation');
 if(!Number.isFinite(s.insurancePool)||s.insurancePool<-CFG.tuning_engine.auditGovernance__015||!Number.isFinite(s.insurancePoolOpening)||!Array.isArray(s.insuranceFlows))problems.push('Invalid funded insurance reserve');
 else {let balance=s.insurancePoolOpening;for(const f of s.insuranceFlows){
   const c=s.companies.find(c=>c.id===f.companyId);if(!c?.corporate?.insurance||!['premium','claim'].includes(f.kind)||f.amount<=0||f.week>s.week)problems.push('Invalid insurance claim or premium source');
   balance+=f.kind==='premium'?f.amount:-f.amount;}
 if(Math.abs(money(balance-s.insurancePool))>CFG.tuning_engine.auditGovernance__016)problems.push('Invalid insurer pool conservation');
 for(const c of s.companies)if(c.corporate?.insurance){const i=c.corporate.insurance;
  const prem=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='premium').reduce((n,f)=>n+f.amount,0)),
        claim=money(s.insuranceFlows.filter(f=>f.companyId===c.id&&f.kind==='claim').reduce((n,f)=>n+f.amount,0));
  if(Math.abs(prem-i.premiumsPaid)>CFG.tuning_engine.auditGovernance__017||Math.abs(claim-i.claimsPaid)>CFG.tuning_engine.auditGovernance__018||i.coveredCost<0||!Array.isArray(i.weeklyEvidence))problems.push('Invalid company insurance evidence');
 }}
 const personal=money(s.personalMoneyHistory.reduce((n,x)=>n+x.amount,0));
 if(Math.abs(personal-s.founderFunds)>CFG.tuning_engine.auditGovernance__019)problems.push('Invalid founder personal capital provenance');
 for(const h of s.careerLineage)if(!s.companies.some(c=>c.id===h.fromId)||!s.companies.some(c=>c.id===h.toId)||h.week>s.week)problems.push('Invalid company lineage');
}

// UPDATE 42A — living rivals. Corporate strategies spend existing funds;
// founder-funded new firms draw from a finite external capital pool.
const RIVAL_STYLES=CFG.rivals.RIVAL_STYLES;
const RIVAL_GOALS=CFG.rivals.RIVAL_GOALS;
function ensure42A(s){
 if(!Array.isArray(s.rivalEvents))s.rivalEvents=[];
 if(!Number.isFinite(s.entrepreneurPool))s.entrepreneurPool=money(CFG.tuning_engine.ensure42A__001*(s.settings.populationScale||1));
 if(!s.institutions)s.institutions={bank:'Civic Credit Consortium',agency:'Creators Guild Network',regulator:'Regional Commerce Authority',active:true,historyComplete:s.version>=CFG.tuning_engine.ensure42A__002};
 for(const c of s.companies){
  if(c.isPlayer||c.parentId===s.playerId)continue;
  if(!c.aiIdentity){const h=hash(s.seed+':persona:'+c.id);c.aiIdentity={style:RIVAL_STYLES[h%CFG.tuning_engine.ensure42A__003],risk:CFG.tuning_engine.ensure42A__004+(h%CFG.tuning_engine.ensure42A__005)*CFG.tuning_engine.ensure42A__006,specialty:GENRES[(h>>>CFG.tuning_engine.ensure42A__007)%GENRES.length],foundedBy:'Independent founders',historyComplete:!c.bankrupt};}
  if(!c.aiPlan)rivalAnnualPlan(s,c);
 }
}
function rivalAnnualPlan(s,c){
 if(!c.aiIdentity)return null;
 const age=yearAt(s.week)-c.foundedYear,style=c.aiIdentity.style;
 const goal=style==='cautious'?'specialize':style==='creator-led'?'technology':style==='expansionist'?'capacity':'partnerships';
 const cash=c.finance.cash,needed=SECTORS[c.sector].cost*CFG.tuning_engine.needed__002+weeklyOverhead(c,s)*CFG.tuning_engine.needed__003;
 const plan={issuedWeek:s.week,reviewWeek:s.week+CFG.tuning_engine.plan__003,endWeek:s.week+CFG.tuning_engine.plan__004*(CFG.tuning_engine.plan__005+(hash(c.id+':'+yearAt(s.week))%CFG.tuning_engine.plan__006)),
  goal,sector:c.sector,genre:c.aiIdentity.specialty,riskTolerance:c.aiIdentity.risk,
  budgetCeiling:money(Math.max(0,Math.min(cash*CFG.tuning_engine.plan__007,Math.max(0,cash-needed)))),
  source:'private-company-plan',forecastBasis:'own cash and prior sales; future market behavior uncertain',
  ageAtIssue:age};
 c.aiPlan=plan;return plan;
}
function rivalEvent(s,c,kind,detail){
 const e={id:id(s,'rival_event'),week:s.week,companyId:c.id,kind,detail};s.rivalEvents.push(e);
 if(s.rivalEvents.length>CFG.tuning_engine.rivalEvent__001)s.rivalEvents.splice(0,s.rivalEvents.length-CFG.tuning_engine.rivalEvent__002);
 return e;
}
function rivalQuarterly(s){
 if(s.week%CFG.tuning_engine.rivalQuarterly__001!==0)return;
 ensure42A(s);
 for(const c of s.companies){
  if(c.isPlayer||c.parentId===s.playerId||c.bankrupt||!c.aiIdentity)continue;
  if(s.week>=c.aiPlan.reviewWeek)rivalAnnualPlan(s,c);
  const p=c.aiPlan, cash=c.finance.cash,buffer=weeklyOverhead(c,s)*CFG.tuning_engine.buffer__002;
  if(p.goal==='capacity'&&c.capacity<CFG.tuning_engine.rivalQuarterly__002&&cash>SECTORS[c.sector].cost*CFG.tuning_engine.rivalQuarterly__003+buffer&&s.projects.filter(x=>x.companyId===c.id&&x.status==='active').length>=c.capacity-1){
   const price=money(CFG.tuning_engine.price__001*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);
   if(cash>price+buffer){expense(s,c,price,'rival-expansion','Cash-funded rival team expansion');
     c.capacity++;c.teamLevel++;const team=newTeam(s,c,c.teams.length,p.genre);c.teams.push(team);
     rivalEvent(s,c,'expansion',{teamId:team.id,cost:price});news(s,c.name+' opens another production team','The rival added funded capacity to its '+SECTORS[c.sector].name+' operation.','competitor');}
  }
  if(p.goal==='technology'&&cash>buffer+CFG.tuning_engine.rivalQuarterly__004){
   const tech=businessTechnology(s,c.id,c.sector);
   if(tech.canUpgrade&&tech.upgradeCost<=p.budgetCeiling){const adopted=adoptTechnologyForRival(s,c,c.sector);
     if(adopted)rivalEvent(s,c,'tech-investment',{sector:c.sector,cost:adopted.cost,wave:adopted.wave});}
  }
  if(p.goal==='partnerships'&&cash>buffer+CFG.tuning_engine.rivalQuarterly__005&&rand(s)<CFG.tuning_engine.rivalQuarterly__006){
   // Intent only; no unconsented license or transfer. Real contracts remain
   // exclusively governed by existing bilateral rights/commission engines.
   rivalEvent(s,c,'partner-search',{sector:c.sector});
  }
 }
}
function rivalYearlyPopulation(s){
 if(s.week%CFG.tuning_engine.rivalYearlyPopulation__001!==0)return;
 const alive=s.companies.filter(c=>!c.isPlayer&&!c.parentId&&!c.bankrupt);
 const wanted=Math.min(CFG.tuning_engine.wanted__001,Math.max(s.settings.aiCount||CFG.tuning_engine.wanted__002,CFG.tuning_engine.wanted__003));
 if(alive.length>=wanted||s.companies.length>=CFG.tuning_engine.rivalYearlyPopulation__002||s.entrepreneurPool<CFG.tuning_engine.rivalYearlyPopulation__003)return;
 const choices=Object.keys(SECTORS).filter(sec=>available(sec,s.week));
 const sec=choices[hash(s.seed+':entrants:'+yearAt(s.week))%choices.length];
 const capital=money(Math.min(s.entrepreneurPool,CFG.tuning_engine.capital__001+SECTORS[sec].cost*CFG.tuning_engine.capital__002));
 if(capital<CFG.tuning_engine.rivalYearlyPopulation__004)return;
 s.entrepreneurPool=money(s.entrepreneurPool-capital);
 const newcomer=createCompany(s,{name:'New Horizon '+yearAt(s.week)+' '+(s.sequence%CFG.tuning_engine.newcomer__001),sector:sec,foundedYear:yearAt(s.week),cash:capital,reputation:CFG.tuning_engine.newcomer__002,capacity:1,homeRegion:REGIONS[s.sequence%REGIONS.length].name});
 ensure42A(s);rivalEvent(s,newcomer,'founder-funded-entry',{capital,source:'finite-entrepreneur-equity'});
 news(s,newcomer.name+' enters '+SECTORS[sec].name,'A newly formed rival enters with '+shortMoney(capital)+' in finite founder capital, not free recurring income.','competitor');
}