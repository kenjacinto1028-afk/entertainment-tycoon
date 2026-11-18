
function ipoQuote(s,floatPct=CFG.depth.IPO.DEFAULT_FLOAT){const c=corporationOnly(s),I=CFG.depth.IPO,f=Number(floatPct);
 if(!Number.isFinite(f)||f<I.MIN_FLOAT-1e-9||f>I.MAX_FLOAT+1e-9)throw new Error('Float must be between '+Math.round(I.MIN_FLOAT*100)+'% and '+Math.round(I.MAX_FLOAT*100)+'%.');
 const g=c.corporate,total=g.shares.founder+g.shares.investor+g.shares.public,valuation=corporateValuation(s).expected;
 const raise=money(valuation*f/(1-f)),shares=Math.max(1,Math.ceil(total*f/(1-f))),fee=money(Math.max(I.MIN_FEE,raise*I.FEE_RATE));
 return {floatPct:f,valuation,raise,fee,newShares:shares,founderShareAfter:g.shares.founder/(total+shares),net:money(raise-fee)};}
function launchIPO(s,floatPct=CFG.depth.IPO.DEFAULT_FLOAT){requireExecutiveControl(s);const c=corporationOnly(s);
 if(c.corporate.stage==='public-corporation')throw new Error('Company is already publicly listed.');
 if(yearAt(s.week)<CFG.tuning_engine.launchIPO__002)throw new Error('Simplified public markets do not mature until World Year 25.');
 if(!c.teams.length||c.reputation<CFG.tuning_engine.launchIPO__003||c.bankrupt)throw new Error('Company is not eligible for public listing.');
 if(s.runStatus!=='active')throw new Error('Resolve executive control before issuing equity.');
 const q=ipoQuote(s,floatPct);
 const approval=boardVote(s,'ipo',Math.min(q.raise,CFG.tuning_engine.boardVote__001));if(!approval.approved)throw new Error('Board rejected public listing.');
 if(c.finance.cash<q.fee+CFG.tuning_engine.launchIPO__004)throw new Error('Cannot finance the listing and maintain operating reserves.');
 expense(s,c,q.fee,'public-listing-fee','Underwriting and simplified disclosure expenses');
 // Public-market investors pay the company treasury: paid-in equity, NOT sales.
 transact(s,c,'outside-equity-contribution',{cash:q.raise,equity:q.raise},'Public listing capital received (not revenue)');
 // Public money is new to the world: grow the pool opening by the same amount (pool conservation holds).
 s.investorPoolOpening=money(s.investorPoolOpening+q.raise);
 c.corporate.shares.public+=q.newShares;c.corporate.fundings.push({week:s.week,amount:q.raise,shares:q.newShares,kind:'public'});
 c.corporate.stage='public-corporation';
 governanceEvent(s,c,'equity-raised',{amount:q.raise,shares:q.newShares,kind:'public'});
 governanceEvent(s,c,'public-listing',{cost:q.fee,amount:q.raise});
 if(corporateStatus(s).ownership.founderShare<CFG.tuning_engine.issueShares__004&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {...q,amount:q.raise,stage:c.corporate.stage};}
function sellFounderShares(s,count){const c=corporationOnly(s),shares=Number(count),g=c.corporate;
 if(s.runStatus==='ended'||!Number.isInteger(shares)||shares<1||shares>g.shares.founder)throw new Error('Founder may sell only valid personally held shares.');
const price=money(corporateValuation(s).expected/(g.shares.founder+g.shares.investor+g.shares.public));const proceeds=money(price*shares);
 if(proceeds>s.investorPool)throw new Error('External investors lack the funds to buy this equity.');
 // Investor buys EXISTING founder shares: no proceeds go to the company.
 g.shares.founder-=shares;g.shares.investor+=shares;s.investorPool=money(s.investorPool-proceeds);
 s.founderFunds=money(s.founderFunds+proceeds);g.shareSales.push({week:s.week,shares,price,proceeds});
 s.personalMoneyHistory.push({week:s.week,kind:'share-sale',amount:proceeds,companyId:c.id});
 governanceEvent(s,c,'founder-share-sale',{shares,proceeds});
 if(corporateStatus(s).ownership.founderShare<CFG.tuning_engine.sellFounderShares__001&&s.management.personId===s.founder.id)contestExecutiveControl(s);
 return {shares,proceeds,founderVoteShare:corporateStatus(s).ownership.founderShare};}
function payDividend(s,amount){requireExecutiveControl(s);const c=corporationOnly(s),f=c.finance,q=money(Number(amount)),g=c.corporate;
 if(!Number.isFinite(Number(amount))||q<CFG.tuning_engine.payDividend__001||companyProfit(c)<q||f.cash<q+weeklyOverhead(c,s)*CFG.tuning_engine.payDividend__002)throw new Error('Dividend requires distributable lifetime profit and cash reserves.');
 const sum=g.shares.founder+g.shares.investor+g.shares.public,personal=money(q*g.shares.founder/sum);
 transact(s,c,'paid-equity-distribution',{cash:-q,equity:-q},'Cash distributed to all shareholders in legal proportion');
 s.founderFunds=money(s.founderFunds+personal);g.dividends.push({week:s.week,amount:q,founderReceived:personal});
 s.personalMoneyHistory.push({week:s.week,kind:'dividend',amount:personal,companyId:c.id});
 governanceEvent(s,c,'dividend',{amount:q,founderReceived:personal});return {total:q,founderReceived:personal};}
function planLeadership(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=CFG.tuning_engine.planLeadership__001||e.skill<CFG.tuning_engine.planLeadership__002||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Only an eligible current team leader may be nominated.');
 s.management.plannedSuccessorId=e.id;governanceEvent(s,c,'successor-nominated',{personId:e.id});return {nomineeId:e.id,name:e.name,eligible:true};}
function chooseLeader(s,employeeId){const c=rootGoverned(s),e=(s.employees||[]).find(x=>x.id===employeeId&&x.employerId===c.id&&x.status==='employed');
 if(!e||e.age>=CFG.tuning_engine.chooseLeader__001||e.skill<CFG.tuning_engine.chooseLeader__002||!c.teams.some(t=>t.leaderId===e.id))throw new Error('Successor must be a legally eligible employed leader.');
 if(c.corporate.stage!=='founder'&&!boardVote(s,'succession',0).approved)throw new Error('Corporate board rejected executive appointment.');
 s.management.personId=e.id;s.management.role='appointed-executive';s.management.status='active';s.management.plannedSuccessorId=null;
 governanceEvent(s,c,'executive-appointed',{personId:e.id});
 news(s,'Executive succession at '+c.name,e.name+' takes the management role. All shares, voting rights, underlying IP, contracts and liabilities stay legally unchanged.','company');
 return {...s.management};}
function stepDown(s){const c=rootGoverned(s);s.management.status='transition';governanceEvent(s,c,'executive-vacancy',{personId:s.management.personId});
 alert(s,'career-transition-'+c.id,CFG.events.messages.stepDown__001,CFG.events.messages.stepDown__002,'critical');
 return {...s.management};}
function contestExecutiveControl(s){const c=corporationOnly(s),own=corporateStatus(s).ownership;
 if(s.management.status==='removed')return {...s.management};
 if(own.founderShare>=CFG.tuning_engine.contestExecutiveControl__001)throw new Error('Founder voting control has not been lost.');
 s.management.status='removed';governanceEvent(s,c,'shareholder-removal',{formerManagerId:s.management.personId});
 alert(s,'management-control-'+c.id,CFG.events.messages.contestExecutiveControl__001,CFG.events.messages.contestExecutiveControl__002,'critical');
 return {...s.management};}
function startFreshCompany(s,data={}){const old=rootGoverned(s),capital=money(Number(data.capital)),sector=String(data.sector||'publishing'),name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__003);
 if(s.runStatus==='ended'||!['removed','transition'].includes(s.management.status))throw new Error('A lawful exit or loss of management control is required before a new-company continuation.');
 if(!SECTORS[sector]||!available(sector,s.week))throw new Error('New company cannot predate its worldwide industry.');
 const severityReserve=s.settings.difficulty==='challenging'?CFG.tuning_engine.severityReserve__001:s.settings.difficulty==='casual'?CFG.tuning_engine.severityReserve__002:CFG.tuning_engine.severityReserve__003;
 if(!Number.isFinite(Number(data.capital))||capital<SECTORS[sector].cost*severityReserve||capital>s.founderFunds||capital<=0)throw new Error('New firm requires independently documented founder funds and difficulty-adjusted sector startup reserves.');
 if(name.length<CFG.tuning_engine.startFreshCompany__001||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct new-company name.');
 if(s.founder.age>=CFG.tuning_engine.startFreshCompany__002)throw new Error('Founder is no longer legally available to manage a new company.');
 const neu=createCompany(s,{name,sector,origin:'Independent continuation',cash:capital,capacity:1,foundedYear:yearAt(s.week),homeRegion:old.homeRegion,isPlayer:true});
 old.isPlayer=false;s.playerId=neu.id;s.founderFunds=money(s.founderFunds-capital);
 s.personalMoneyHistory.push({week:s.week,kind:'new-company-capital',amount:-capital,companyId:neu.id});
 neu.corporate={stage:'founder',baselineEquity:capital,shares:{founder:CFG.tuning_engine.startFreshCompany__003,investor:0,public:0},board:null,
  policy:{minCashWeeks:CFG.tuning_engine.startFreshCompany__004,reviewLimit:CFG.tuning_engine.startFreshCompany__005,maxDebtRatio:CFG.tuning_engine.startFreshCompany__006},fundings:[],shareSales:[],dividends:[],resolutions:[],lineage:[{week:s.week,kind:'new-independent-company',companyId:neu.id}],historyComplete:true};
 s.careerLineage.push({week:s.week,fromId:old.id,toId:neu.id,capital,kind:'fresh-company'});
 s.management={personId:s.founder.id,role:'founder-manager',status:'active',plannedSuccessorId:null,historyComplete:true};
 s.runStatus='active';governanceEvent(s,neu,'independent-continuation',{fromId:old.id,capital});
 news(s,'New independent company: '+name,'Personally funded start with no asset, title, team, contract or liability transfer from '+old.name+'.','company');return neu;}
function endRun(s){if(s.runStatus==='ended')throw new Error('Run already concluded.');const c=rootGoverned(s);s.runStatus='ended';governanceEvent(s,c,'run-ended',{personId:s.management.personId});return {status:'ended',companyId:c.id,year:yearAt(s.week)};}
function careerHistory(s){return {runStatus:s.runStatus,founder:{...s.founder},executive:{...s.management},personalFunds:s.founderFunds,
 events:s.governanceHistory.slice(-CFG.tuning_engine.careerHistory__001),continuations:s.careerLineage.slice(),difficulty:s.settings.difficulty};}
function reviewFounderTransition(s){
 if(!s.management||s.runStatus==='ended'||s.management.status!=='active')return;
 if(s.management.personId!==s.founder.id){
  const executive=(s.employees||[]).find(e=>e.id===s.management.personId&&e.status==='employed'&&e.employerId===s.playerId);
  if(!executive){s.management.status='transition';alert(s,'executive-departure-'+s.playerId,CFG.events.messages.reviewFounderTransition__001,
    CFG.events.messages.reviewFounderTransition__002,'critical');
    governanceEvent(s,player(s),'executive-departed',{personId:s.management.personId});}
  return;
 }

 const threshold=s.settings.difficulty==='challenging'?CFG.tuning_engine.threshold__001:s.settings.difficulty==='casual'?CFG.tuning_engine.threshold__002:CFG.tuning_engine.threshold__003;
 if(s.founder.age>=threshold){s.management.status='transition';alert(s,'successor-due-'+s.playerId,CFG.events.messages.reviewFounderTransition__003,
 CFG.events.messages.reviewFounderTransition__004,'critical');
 governanceEvent(s,player(s),'succession-due',{age:s.founder.age});}}