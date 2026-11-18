
// Creating a new company is NOT purchasing an old firm's IP, shares or
// liabilities. The founding company legally owns 100% of new subsidiary equity.
// Cash decreases at the parent and increases at the child; the offset is a
// parent investment asset, not a made-up sale or production profit.
function foundSubsidiary(s,data={}){
  requireExecutiveControl(s);const owner=player(s),sector=String(data.sector||'publishing'),capital=money(Number(data.capital));
  if(!SECTORS[sector]||!available(sector,s.week))throw new Error('That industry has not debuted globally.');
  if(s.companies.filter(c=>c.parentId===owner.id).length>=CFG.tuning_engine.foundSubsidiary__001)throw new Error('Maximum five managed subsidiaries in this prototype.');
  if(!Number.isFinite(capital)||capital<SECTORS[sector].cost*CFG.tuning_engine.foundSubsidiary__002)throw new Error('Startup capital below sector operating requirements.');
  if(owner.finance.cash<capital+CFG.tuning_engine.foundSubsidiary__003)throw new Error('Insufficient parent cash after required operating reserve.');
  const name=String(data.name||'').trim().slice(0,CFG.tuning_engine.name__002);
  if(name.length<CFG.tuning_engine.foundSubsidiary__004||s.companies.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw new Error('Choose a distinct studio name of at least three characters.');
  boardMandate(s,'expansion',capital);
  const child=createCompany(s,{name,sector,cash:capital,capacity:1,foundYear:yearAt(s.week),foundedYear:yearAt(s.week),parentId:owner.id,reputation:CFG.tuning_engine.child__001,homeRegion:owner.homeRegion});
  boardMandate(s,'expansion',capital,true);
  transact(s,owner,'subsidiary-equity-contribution',{cash:-capital,investment:capital},'Capital invested in wholly owned new studio '+name);
  if(owner.corporate)governanceEvent(s,owner,'subsidiary-founded',{subsidiaryId:child.id,capital,sector});
  news(s,'New subsidiary founded: '+name,owner.name+' invested '+shortMoney(capital)+' in a newly established '+SECTORS[sector].name+' studio; existing rival assets and IP remain unchanged.','company');
  return child;
}
// Subsidiaries are separate legal entities. This prototype supports formation
// of wholly owned NEW companies only; acquisitions and outside shareholders
// must wait for their separately validated ownership logic.
function controlledCompanies(s,rootId=s.playerId){
  const root=company(s,rootId);if(!root||root.parentId)throw new Error('Choose a root company you control.');
  return [root,...s.companies.filter(c=>c.parentId===root.id)];
}
// Book a real intra-group charge for shared corporate services that the parent
// has already funded. This cannot be used to mint new money or consumer sales.
function chargeSharedServices(s,childId,amount){
  const child=company(s,childId);if(!child||!child.parentId)throw new Error('Only a wholly-owned subsidiary may receive parent services.');
  const parent=company(s,child.parentId);amount=money(Number(amount));
  if(!parent||child.bankrupt||parent.bankrupt||!Number.isFinite(amount)||amount<=0)throw new Error('Invalid shared-service participants or amount.');
  if(amount>(parent.finance.overheadBooked||0)-(parent.finance.internalRevenue||0)+EPS)throw new Error('Service charge exceeds documented shared costs.');
  if(child.finance.cash<amount+CFG.tuning_engine.chargeSharedServices__001)throw new Error('Subsidiary cannot fund this internal charge.');
  transact(s,child,'internal-service-expense',{cash:-amount,expense:amount},'Shared services provided by '+parent.name);
  transact(s,parent,'internal-service-revenue',{cash:amount,revenue:amount},'Shared services provided to '+child.name);
  child.finance.internalExpense=money((child.finance.internalExpense||0)+amount);
  parent.finance.internalRevenue=money((parent.finance.internalRevenue||0)+amount);
  return amount;
}
// Share capital invested in a subsidiary is an ASSET of the parent and equity
// of the subsidiary, but must disappear in a consolidated balance sheet.
// Linked intragroup service charges likewise must cancel out in group revenue
// and costs; only cash received from external customers creates group sales.
function consolidatedStatements(s,rootId=s.playerId){
  const members=controlledCompanies(s,rootId),root=members[0],f=members.map(c=>c.finance);
  const sum=key=>money(f.reduce((v,x)=>v+(x[key]||0),0));
  const internalRevenue=sum('internalRevenue'),internalExpense=sum('internalExpense');
  const consolidatedRevenue=money(sum('revenue')-internalRevenue);
  const consolidatedExpenses=money(sum('expense')-internalExpense);
  const net=money(consolidatedRevenue-consolidatedExpenses);
  const cash=sum('cash'),receivable=sum('receivable'),prepaid=sum('prepaid'),inventory=sum('inventory');
  const liabilities=money(sum('payable')+sum('deferred')+sum('loanBalance'));
  const assets=money(cash+receivable+prepaid+inventory); // eliminate all wholly owned equity investment assets
  const parentCapital=root.finance.equity;
  const equity=money(parentCapital+net);
  return {rootId,members:members.map(c=>({id:c.id,name:c.name,parentId:c.parentId,sector:c.sector,bankrupt:c.bankrupt})),
    income:{revenue:consolidatedRevenue,expenses:consolidatedExpenses,net,internalRevenueEliminated:internalRevenue,internalExpenseEliminated:internalExpense},
    balance:{cash,receivable,prepaid,inventory,loanBalance:sum('loanBalance'),assets,liabilities,parentCapital,retainedEarnings:net,equity,investmentEliminated:sum('investment'),subsidiaryCapitalEliminated:money(members.slice(1).reduce((n,c)=>n+(c.investedCapital||0),0)),difference:money(assets-liabilities-equity)}
  };
}
function hireTeam(s,specialty='Fantasy') {requireExecutiveControl(s);const c=player(s),cost=money(CFG.tuning_engine.cost__009*CAPABILITY_PACES[s.settings.capabilityPace||'standard']);if(!GENRES.includes(specialty))throw new Error('Choose a valid team specialization.');if(c.finance.cash<cost+CFG.tuning_engine.hireTeam__001)throw new Error('Insufficient funds to hire another project team.');expense(s,c,cost,'recruitment','Expand project team');c.capacity++;c.teamLevel++;const team=newTeam(s,c,c.teams.length,specialty);c.teams.push(team);news(s,CFG.events.messages.hireTeam__001,team.name+' specializes in '+specialty+'. Another project can now run concurrently; recurring weekly payroll rises.','company');return team;}
// Rights agreements: real bilateral funding, with counteroffers before any
// contract or cash movement. An AI's willingness depends on its own liquidity;
// it cannot be forced to accept an expensive option or renewal.
function rightsTerms(input={},medium='movie',week=0){
  if(!Number.isFinite(Number(input.fee??CFG.tuning_engine.rightsTerms__001))||!Number.isFinite(Number(input.exerciseFee??CFG.tuning_engine.rightsTerms__002)))throw new Error('Option fees must be finite amounts.');
  const fee=money(Number(input.fee??CFG.tuning_engine.fee__004));
  const exerciseFee=money(Number(input.exerciseFee??CFG.tuning_engine.exerciseFee__001));
  const royaltyRate=Number(input.royaltyRate??CFG.tuning_engine.royaltyRate__001);
  const optionWeeks=Number(input.optionWeeks??Math.max(CFG.tuning_engine.optionWeeks__001,((SECTORS[medium].year-1)*CFG.tuning_engine.optionWeeks__002-week)+CFG.tuning_engine.optionWeeks__003));
  const continuationWeeks=Number(input.continuationWeeks??0);
  if(!Number.isFinite(fee)||fee<CFG.tuning_engine.rightsTerms__003||fee>CFG.tuning_engine.rightsTerms__004||!Number.isFinite(exerciseFee)||exerciseFee<0||exerciseFee>CFG.tuning_engine.rightsTerms__005||
    !Number.isFinite(royaltyRate)||royaltyRate<0||royaltyRate>CFG.tuning_engine.rightsTerms__006||!Number.isInteger(optionWeeks)||optionWeeks<CFG.tuning_engine.rightsTerms__007||optionWeeks>CFG.tuning_engine.rightsTerms__008||
    !Number.isInteger(continuationWeeks)||continuationWeeks<0||continuationWeeks>CFG.tuning_engine.rightsTerms__009)
    throw new Error('Option terms exceed permitted fees, royalties, or dates.');
  return {fee,exerciseFee,royaltyRate,optionWeeks,continuationWeeks,approvalRequired:input.approvalRequired===true||input.approvalRequired==='true'};
}
function validateOptionParties(s,ipId,medium,licenseeId){
  const owner=player(s),ip=s.ips.find(x=>x.id===ipId),other=company(s,licenseeId);
  if(!ip||ip.ownerId!==owner.id)throw new Error('Only owned underlying IP may be optioned.');
  if(!SECTORS[medium]||medium==='publishing')throw new Error('Choose a film, TV or game medium.');
  if(!other||other.id===owner.id||other.bankrupt||other.parentId===owner.id)throw new Error('Choose a valid independent counterparty.');
  if(s.grants.some(g=>g.ipId===ipId&&g.media===medium&&g.exclusive&&g.endWeek>s.week))throw new Error('Exclusive rights already reserved in this medium.');
  return {owner,ip,other};
}
function createOption(s,ipId,medium,licenseeId,input={}){
  requireExecutiveControl(s);const {owner,ip,other}=validateOptionParties(s,ipId,medium,licenseeId);
  const terms=rightsTerms(input,medium,s.week),fee=terms.fee;
  if(other.finance.cash<fee+CFG.tuning_engine.createOption__001)throw new Error('Counterparty lacks the funds for this option.');
  // One real outside payment; fee is not deferred or replicated in later sales.
  expense(s,other,fee,'rights-option','Exclusive option fee: '+ip.name);
  revenue(s,owner,fee,'rights-option','Option fee: '+ip.name);
  ip.rightsIncome=money((ip.rightsIncome||0)+fee);
  const right={id:id(s,'grant'),ipId,grantorId:owner.id,holderId:other.id,media:medium,
    territory:'Worldwide',type:'option',startWeek:s.week,endWeek:s.week+terms.optionWeeks,
    optionExpiresWeek:s.week+terms.optionWeeks,exercisedWeek:null,exerciseFee:terms.exerciseFee,
    exerciseFeePaid:0,renewalHistory:[],approvalRequired:terms.approvalRequired,
    exclusive:true,allowsProduction:false,fee,royaltyRate:terms.royaltyRate,recoupableAdvance:0,
    royaltyHistoryComplete:true,continuationWeeks:terms.continuationWeeks};
  s.grants.push(right);
  news(s,'Rights option signed: '+ip.name,other.name+' secured a '+terms.optionWeeks+'-week exclusive '+SECTORS[medium].name+' option. No production before exercise.','deal');
  return right;
}
function optionWillingness(holder,terms){
  return !holder.bankrupt&&holder.finance.cash>=terms.fee+CFG.tuning_engine.optionWillingness__001&&
    terms.fee<=Math.min(CFG.tuning_engine.optionWillingness__002,Math.max(CFG.tuning_engine.optionWillingness__003,money(holder.finance.cash*CFG.tuning_engine.optionWillingness__004)))&&terms.royaltyRate<=CFG.tuning_engine.optionWillingness__005;
}