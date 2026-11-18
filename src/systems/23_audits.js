

// IDs and authority must survive century compaction and portable save/load.
// Inspect live records (not historical cash journals) to reject silent identity
// collisions or orphaned titles/contracts before a corrupt save can be played.
function auditIdentities(s,problems){
  const ids=new Set();let highest=0;
  const record=(object,label)=>{
    if(!object||typeof object.id!=='string'||!object.id) {problems.push(label+': missing stable ID');return;}
    if(ids.has(object.id))problems.push(label+': duplicate ID '+object.id);
    ids.add(object.id);
    const match=object.id.match(/_(\d+)$/);
    if(match)highest=Math.max(highest,Number(match[1]));
  };
  const companyIds=new Set(s.companies.map(c=>c.id));
  const ipIds=new Set(s.ips.map(ip=>ip.id));
  const projectIds=new Set(s.projects.map(p=>p.id));
  const grantIds=new Set(s.grants.map(g=>g.id));
  const workIds=new Set(s.works.map(w=>w.id));
  const escrowIds=new Set(s.escrows.map(e=>e.id));
  record(s.founder,'founder');
  if(!FOUNDER_BACKGROUNDS.includes(s.founder.background)||!FOUNDER_FOCUSES.includes(s.founder.focus)||!Number.isFinite(s.founder.age)||s.founder.age<CFG.tuning_engine.auditIdentities__001||s.founder.age>CFG.tuning_engine.auditIdentities__002)problems.push('Invalid founder career profile');
  if(!Array.isArray(s.employees)||!Array.isArray(s.candidates))problems.push('Missing staff personnel registers');
  for(const e of [...(s.employees||[]),...(s.candidates||[])]){
    record(e,'employee');
    if(!STAFF_TRAITS.includes(e.trait)||!GENRES.includes(e.specialty)||!Number.isFinite(e.skill)||e.skill<CFG.tuning_engine.auditIdentities__003||e.skill>CFG.tuning_engine.auditIdentities__004||!Number.isFinite(e.weeklySalary)||e.weeklySalary<CFG.tuning_engine.auditIdentities__005||e.weeklySalary>CFG.tuning_engine.auditIdentities__006||!Number.isInteger(e.age)||e.age<CFG.tuning_engine.auditIdentities__007||e.age>CFG.tuning_engine.auditIdentities__008||!Number.isInteger(e.enteredWeek)||e.enteredWeek>s.week||!Number.isFinite(e.morale)||e.morale<0||e.morale>CFG.tuning_engine.auditIdentities__009||!Array.isArray(e.history)||e.history.some(h=>h.week>s.week))problems.push(e.id+': invalid employee identity, compensation or history');
    if(e.status==='employed'){const owner=company(s,e.employerId),t=owner?.teams.find(t=>t.id===e.teamId);
      if(!owner||!t||t.leaderId!==e.id||e.contractEndWeek<=s.week||!Number.isInteger(e.hiredWeek))problems.push(e.id+': invalid employee active team or contract');}
    else if(e.employerId||e.teamId)problems.push(e.id+': employee without job still owns a team');
  }
  for(const c of s.companies){
    if(!Array.isArray(c.imprints)||c.imprints.some((i,j)=>i.companyId!==c.id||!GENRES.includes(i.genre)||
      typeof i.name!=='string'||i.name.length<CFG.tuning_engine.auditIdentities__010||i.createdWeek>s.week||i.startFee!==CFG.tuning_engine.auditIdentities__011||
      c.imprints.slice(0,j).some(x=>x.name===i.name)))problems.push(c.id+': invalid publishing imprint');
  }
  for(const c of s.companies)if(!CULTURES.includes(c.culture)||!c.staffPolicy||typeof c.staffPolicy.autoFill!=='boolean'||!Number.isFinite(c.staffPolicy.maxSalary)||c.staffPolicy.maxSalary<CFG.tuning_engine.auditIdentities__012||c.staffPolicy.maxSalary>CFG.tuning_engine.auditIdentities__013)problems.push(c.id+': invalid culture or delegated payroll policy');
  if(!s.talentPolicy||typeof s.talentPolicy.autoBook!=='boolean'||!Number.isFinite(s.talentPolicy.maxFee)||s.talentPolicy.maxFee<CFG.tuning_engine.auditIdentities__014||s.talentPolicy.maxFee>CFG.tuning_engine.auditIdentities__015)problems.push('Invalid freelance delegation authority');
  if(!Array.isArray(s.creatorScouting)||s.creatorScouting.some(x=>!Number.isInteger(x.week)||x.week>s.week||
     !s.specialists.some(t=>t.id===x.personId&&['writer','artist'].includes(t.creatorRole))||x.fee!==CFG.tuning_engine.auditIdentities__016)||
     new Set(s.creatorScouting.map(x=>x.personId)).size!==s.creatorScouting.length)problems.push('Invalid emerging creator scouting provenance');
  for(const t of s.specialists||[]){
   if(![null,'writer','artist'].includes(t.creatorRole)||!Array.isArray(t.mentorshipHistory)||
      t.mentorshipHistory.some((h,i)=>!Number.isInteger(h.week)||h.week<t.enteredWeek||h.week>s.week||h.cost!==CFG.tuning_engine.auditIdentities__017||
        !Number.isFinite(h.oldSkill)||!Number.isFinite(h.newSkill)||h.newSkill!==Math.min(CFG.tuning_engine.auditIdentities__018,h.oldSkill+CFG.tuning_engine.auditIdentities__019)||
        t.mentorshipHistory.slice(0,i).some(x=>yearAt(x.week)===yearAt(h.week))))problems.push('Invalid emerging creator fellowship history');
  }
  for(const t of s.specialists||[]){record(t,'external specialist');if(!SPECIALIST_DISCIPLINES.includes(t.discipline)||!Number.isFinite(t.skill)||t.skill<CFG.tuning_engine.auditIdentities__020||t.skill>CFG.tuning_engine.auditIdentities__021||!Number.isFinite(t.fee)||t.fee<=0||!Number.isInteger(t.enteredWeek)||t.enteredWeek>s.week||t.enteredWeek<0||!Number.isInteger(t.completed)||t.completed<0)problems.push(t.id+': invalid specialist identity/fee/history');
   if(t.assignedProjectId){const p=s.projects.find(p=>p.id===t.assignedProjectId);if(!p||p.status!=='active'||p.specialistId!==t.id)problems.push(t.id+': invalid active specialist assignment');}}
  for(const c of s.companies){record(c,'company');for(const t of c.teams||[]){record(t,'team');
   if(t.leaderId&&!s.employees?.some(e=>e.id===t.leaderId&&e.employerId===c.id&&e.teamId===t.id&&e.status==='employed'))problems.push(t.id+': orphaned team employee');
   if(!GENRES.includes(t.specialty)||!Number.isFinite(t.skill)||t.skill<CFG.tuning_engine.auditIdentities__022||t.skill>CFG.tuning_engine.auditIdentities__023||!Array.isArray(t.trainingHistory)||!Array.isArray(t.performanceHistory)||
      t.trainingHistory.some(h=>!Number.isInteger(h.week)||h.week<0||h.week>s.week||!['mentorship','specialize'].includes(h.focus)||!Number.isFinite(h.cost)||h.cost<=0||!GENRES.includes(h.newSpecialty)||!Number.isFinite(h.newSkill)||h.newSkill>CFG.tuning_engine.auditIdentities__024)||
      t.performanceHistory.some(h=>!projectIds.has(h.projectId)||!Number.isInteger(h.week)||h.week> s.week||!SECTORS[h.sector]||!GENRES.includes(h.genre)||h.quality<1||h.quality>CFG.tuning_engine.auditIdentities__025))problems.push(t.id+': invalid training or performance record');
  }}
  for(const b of s.backgroundFirms){
    record(b,'background company');
    if(!SECTORS[b.sector]||b.foundedYear<SECTORS[b.sector].year)problems.push(b.id+': background founding predates medium');
    if(b.active){record(b.active,'background active job');if(!available(b.sector,s.week))problems.push(b.id+': premature minor production');}
    for(const work of b.releases){record(work,'background original');if(work.releaseWeek<(SECTORS[b.sector].year-1)*CFG.tuning_engine.auditIdentities__026)problems.push(work.id+': premature minor release');}
  }
  for(const ip of s.ips){
    record(ip,'IP');
    if(!companyIds.has(ip.ownerId))problems.push(ip.id+': missing legal IP owner');
    for(const workId of ip.works||[])if(!workIds.has(workId))problems.push(ip.id+': missing catalog work '+workId);
  }
  for(const m of s.manuscripts||[]){
    record(m,'manuscript');const ip=s.ips.find(ip=>ip.id===m.ipId);
    if(!ip||ip.ownerId!==m.ownerId||!company(s,m.ownerId)||!Number.isInteger(m.createdWeek)||m.createdWeek>s.week||
      !['available','licensed'].includes(m.status)||!Number.isFinite(m.advance)||m.advance<=0||
      !Number.isFinite(m.royaltyRate)||m.royaltyRate<=0||m.royaltyRate>CFG.tuning_engine.auditIdentities__027||
      !Number.isFinite(m.agencyRate)||m.agencyRate<0||m.agencyRate>CFG.tuning_engine.auditIdentities__028||typeof m.creatorApprovalRequired!=='boolean'||
      (m.status==='licensed'&&!s.grants.some(g=>g.id===m.licenseId&&g.ipId===m.ipId&&g.holderId===s.playerId)))
      problems.push(m.id+': invalid manuscript rights provenance');
  }
  for(const o of s.manuscriptOffers||[]){
    record(o,'manuscript offer');const m=s.manuscripts?.find(m=>m.id===o.manuscriptId);
    if(!m||o.ownerId!==m.ownerId||o.buyerId!==s.playerId||
      !['agreed','counter','signed','declined'].includes(o.status)||o.createdWeek>s.week||o.expiresWeek<o.createdWeek||
      [o.proposal,o.counter].filter(Boolean).some(t=>!Number.isFinite(t.agencyRate)||t.agencyRate<0||t.agencyRate>CFG.tuning_engine.auditIdentities__029||typeof t.approvalRequired!=='boolean')||
      o.status==='signed'&&!s.grants.some(g=>g.id===o.grantId&&g.manuscriptId===m.id))
      problems.push(o.id+': invalid manuscript offer provenance');
  }
  if(s.publishingOutlet){
    const o=s.publishingOutlet;record(o,'publishing outlet');
    if(o.companyId!==s.playerId||typeof o.active!=='boolean'||!Number.isInteger(o.createdWeek)||o.createdWeek>s.week||
       !Array.isArray(o.catalog)||o.monthlyCost!==CFG.tuning_engine.auditIdentities__030||![o.startupSpent,o.operatingSpent,o.customerGross,o.distributionFees].every(x=>Number.isFinite(x)&&x>=0)||
       o.distributionFees>o.customerGross+CFG.tuning_engine.auditIdentities__031||
       o.catalog.some((x,i)=>!s.projects.some(p=>p.id===x.projectId&&p.sector==='publishing'&&p.companyId===o.companyId&&p.route!=='contract')||
          !Number.isInteger(x.listedWeek)||x.listedWeek> s.week||o.catalog.slice(0,i).some(y=>y.projectId===x.projectId))||
       o.customerGross>money(s.projects.filter(p=>p.companyId===o.companyId).reduce((n,p)=>n+(p.salesByChannel?.owned||0),0))+CFG.tuning_engine.auditIdentities__032)
      problems.push('Invalid owned publishing outlet cash, fees or catalog rights');
  }
  for(const p of s.projects){
    record(p,'project');
    if(!companyIds.has(p.companyId))problems.push(p.id+': missing production company');
    if(p.ipId&&!ipIds.has(p.ipId))problems.push(p.id+': missing source IP');
    if(p.grantId&&!grantIds.has(p.grantId))problems.push(p.id+': missing underlying rights grant');
    if(p.escrowId&&!escrowIds.has(p.escrowId))problems.push(p.id+': missing funded commission escrow');
    if(p.sector==='publishing'&&(!Number.isFinite(p.serialReaderMomentum)||p.serialReaderMomentum<CFG.tuning_engine.auditIdentities__033||p.serialReaderMomentum>CFG.tuning_engine.auditIdentities__034||
      !Array.isArray(p.serialEngagementHistory)||p.serialEngagementHistory.some(h=>h.week>s.week||h.momentum<CFG.tuning_engine.auditIdentities__035||h.momentum>CFG.tuning_engine.auditIdentities__036||h.observedGross<0)||
      !Array.isArray(p.serialArcDecisions)||p.serialArcDecisions.some((h,i)=>!['tighten','expand'].includes(h.choice)||h.week<p.startWeek||h.week>s.week||h.cost!==(h.choice==='expand'?CFG.tuning_engine.auditIdentities__037:CFG.tuning_engine.auditIdentities__038)||i>0)||
      !Array.isArray(p.publishingFormatHistory)||!Array.isArray(p.translations)||
      p.publishingFormatHistory.some((h,i)=>!PUBLISHING_TREATMENTS[h.focus]||PUBLISHING_TREATMENTS[h.focus].format!==p.format||
        !Number.isFinite(h.cost)||h.cost!==PUBLISHING_TREATMENTS[h.focus].cost||h.week<p.startWeek||h.week>s.week||
        p.publishingFormatHistory.slice(0,i).some(x=>x.focus===h.focus))||
      p.translations.some((t,i)=>!activeRegions(s).some(r=>r.name===t.region)||!Number.isInteger(t.week)||t.week> s.week||t.cost!==CFG.tuning_engine.auditIdentities__039||
        p.translations.slice(0,i).some(x=>x.region===t.region))||
      (p.preorderCampaign&&(!Number.isInteger(p.preorderCampaign.week)||p.preorderCampaign.week<p.startWeek||p.preorderCampaign.week>s.week||
        p.preorderCampaign.cost!==CFG.tuning_engine.auditIdentities__040||p.preorderCampaign.paidDeposits!==0||p.preorderCampaign.kind!=='nonbinding-reader-interest'))||
      (p.imprintId&&!company(s,p.companyId)?.imprints?.some(i=>i.id===p.imprintId))||
      !PUBLISHING_CHANNELS.includes(p.publishingChannel)||!['steady','fast','polished',null].includes(p.serialCadence)||
      !p.salesByRegion||!p.salesByChannel||Object.values(p.salesByRegion).some(x=>!Number.isFinite(x)||x<0)||Object.values(p.salesByChannel).some(x=>!Number.isFinite(x)||x<0)||
      !p.salesUnitsByRegion||!p.salesUnitsByChannel||!p.salesUnitsByAudience||!Array.isArray(p.publishingUnitHistory)||typeof p.publishingUnitHistoryComplete!=='boolean'||typeof p.audienceUnitHistoryComplete!=='boolean'||
      [...Object.values(p.salesUnitsByRegion),...Object.values(p.salesUnitsByChannel),...Object.values(p.salesUnitsByAudience)].some(x=>!Number.isInteger(x)||x<0)||
      (p.audienceUnitHistoryComplete?Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0)!==Object.values(p.salesUnitsByAudience).reduce((a,b)=>a+b,0):Object.values(p.salesUnitsByAudience).reduce((a,b)=>a+b,0)>Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0))||
      Object.values(p.salesUnitsByRegion).reduce((a,b)=>a+b,0)!==Object.values(p.salesUnitsByChannel).reduce((a,b)=>a+b,0)||
      p.publishingUnitHistory.some(h=>!Number.isInteger(h.week)||h.week> s.week||!Number.isInteger(h.units)||h.units<0||!Number.isFinite(h.gross)||h.gross<0||!activeRegions(s).some(r=>r.name===h.region)||!PUBLISHING_CHANNELS.includes(h.channel))||
      (p.publishingChannel==='owned'&&(!s.publishingOutlet?.active||!s.publishingOutlet.catalog.some(x=>x.projectId===p.id)))))problems.push(p.id+': invalid publishing channel or sales provenance');
    if(p.clientId&&!companyIds.has(p.clientId))problems.push(p.id+': missing contract client');
    if(p.holdUntilWeek!==null&&(!Number.isInteger(p.holdUntilWeek)||p.holdUntilWeek<p.startWeek||p.holdUntilWeek>s.week+CFG.tuning_engine.auditIdentities__041||(p.status==='released'&&p.releaseWeek<p.holdUntilWeek)||p.route==='contract'))problems.push(p.id+': invalid launch hold');
    if(p.specialistId&&!s.specialists?.some(t=>t.id===p.specialistId&&t.assignedProjectId===p.id))problems.push(p.id+': invalid specialist assignment');
    if(p.specialistAppointments?.length>1||p.specialistAppointments?.some(a=>!s.specialists?.some(t=>t.id===a.specialistId)||!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||!Number.isFinite(a.fee)||a.fee<=0||!SPECIALIST_DISCIPLINES.includes(a.discipline)))problems.push(p.id+': invalid specialist contract history');
    if(!Array.isArray(p.editorialHistory)||typeof p.editorialHistoryComplete!=='boolean'||
      p.editorialHistory.some((h,i)=>!EDITORIAL_ACTIONS[h.kind]||!Number.isInteger(h.week)||h.week<p.startWeek||h.week>s.week||
        h.cost<=0||!Number.isFinite(h.cost)||!Number.isFinite(h.creativeQuality)||!Number.isFinite(h.technicalQuality)||
        h.creativeQuality<1||h.creativeQuality>CFG.tuning_engine.auditIdentities__042||h.technicalQuality<1||h.technicalQuality>CFG.tuning_engine.auditIdentities__043||
        p.editorialHistory.slice(0,i).some(r=>r.kind===h.kind)||p.sector!=='publishing'))
      problems.push(p.id+': invalid editorial activity history');
    if(!Array.isArray(p.creatorCredits)||p.creatorCredits.some(x=>!['team lead','editorial specialist','technical specialist','production specialist'].includes(x.role)||
       ![...s.employees,...(s.specialists||[])].some(e=>e.id===x.personId))||
       (p.status!=='released'&&p.creatorCredits.length>0))problems.push(p.id+': forged creator release credits');
    if(p.releasePlanHistory?.some(a=>!Number.isInteger(a.week)||a.week<p.startWeek||a.week>s.week||(a.targetWeek!==null&&(!Number.isInteger(a.targetWeek)||a.targetWeek<a.week||a.targetWeek>a.week+CFG.tuning_engine.auditIdentities__044))))problems.push(p.id+': invalid release planning history');
  }

  for(const p of s.projects){
    const c=company(s,p.companyId),used=new Set();
    if(p.status==='active'&&p.teamId&&c?.teams&&!c.teams.some(t=>t.id===p.teamId))problems.push(p.id+': active project has no owned team');
    for(const e of p.interventions||[]){
      if(!['revision','polish','scope'].includes(e.kind)||used.has(e.kind)||!Number.isInteger(e.week)||e.week<p.startWeek||e.week>s.week||
        !Number.isFinite(e.spend)||e.spend<0||!Number.isFinite(e.originalBudget)||e.originalBudget<=0||
        !Number.isFinite(e.newBudget)||e.newBudget<=0||!Number.isFinite(e.weeksTotal)||e.weeksTotal<=0||
        !Number.isFinite(e.creativeQuality)||e.creativeQuality<1||e.creativeQuality>CFG.tuning_engine.auditIdentities__045||
        !Number.isFinite(e.technicalQuality)||e.technicalQuality<1||e.technicalQuality>CFG.tuning_engine.auditIdentities__046||
        (e.kind==='scope'&&e.spend!==0)||(e.kind!=='scope'&&e.spend<=0))problems.push(p.id+': invalid intervention history');
      used.add(e.kind);
    }
    for(const t of p.teamChanges||[])if(!Number.isInteger(t.week)||t.week<p.startWeek||t.week>s.week||
      !c?.teams?.some(x=>x.id===t.fromTeamId)||!c.teams.some(x=>x.id===t.toTeamId)||t.fromTeamId===t.toTeamId)
      problems.push(p.id+': invalid team assignment history');
    if(p.teamChanges?.length&&p.status==='active'&&p.teamChanges.at(-1).toTeamId!==p.teamId)
      problems.push(p.id+': latest team assignment disagrees with active project');
  }

  for(const [ipId,note] of Object.entries(s.franchiseNotes||{})){
    const ip=s.ips.find(x=>x.id===ipId);
    if(!ip||!note||typeof note.summary!=='string'||note.summary.length>CFG.tuning_engine.auditIdentities__047||!['strict','flexible'].includes(note.continuity)||(note.displayTitle!==undefined&&(typeof note.displayTitle!=='string'||note.displayTitle.length>CFG.tuning_engine.auditIdentities__048)))
      problems.push(ipId+': invalid optional Franchise Bible note');
  }
  for(const p of s.projects){
    if(p.leadCharacter!==undefined&&(typeof p.leadCharacter!=='string'||p.leadCharacter.length>CFG.tuning_engine.auditIdentities__049))problems.push(p.id+': invalid character history');
    if(p.franchiseBranchEditedWeek!==undefined&&(!Number.isInteger(p.franchiseBranchEditedWeek)||p.franchiseBranchEditedWeek<p.startWeek||p.franchiseBranchEditedWeek>s.week))problems.push(p.id+': invalid canon edit timestamp');
    if(p.franchiseHistoryComplete===true&&p.route!=='contract'&&!FRANCHISE_BRANCHES.includes(p.franchiseBranch))
      problems.push(p.id+': invalid franchise branch');
    if(p.franchiseHistoryComplete===false&&p.franchiseBranch!==null)
      problems.push(p.id+': fabricated legacy canon branch');
  }
  for(const work of s.works){
    record(work,'released work');
    if(!projectIds.has(work.projectId)||!ipIds.has(work.ipId)||!companyIds.has(work.ownerId))problems.push(work.id+': invalid work ownership or source');
  }
  for(const g of s.grants){
    record(g,'rights grant');
    if(!ipIds.has(g.ipId)||!companyIds.has(g.grantorId)||!companyIds.has(g.holderId))problems.push(g.id+': invalid rights owner or holder');
  }
  for(const r of s.remittances){record(r,'distributor remittance');if(!(companyIds.has(r.companyId)||s.backgroundFirms.some(b=>b.id===r.companyId)))problems.push(r.id+': invalid remittance company');}
  for(const e of s.escrows){record(e,'escrow');if(!projectIds.has(e.projectId))problems.push(e.id+': missing commission project');}
  for(const d of s.coProductions||[])record(d,'co-production');
  for(const x of s.coProductionOffers||[])record(x,'negotiated co-production offer');
  for(const o of s.obligations){record(o,'obligation');if(o.projectId&&!projectIds.has(o.projectId))problems.push(o.id+': missing obligation project');}
  for(const a of s.royaltyAccounts||[])record(a,'royalty account');
  for(const o of s.rightsOffers||[])record(o,'negotiated rights offer');
  for(const o of s.commissionOffers||[])record(o,'client commission offer');
  for(const h of s.commissionHistory||[])record(h,'client commission history');
  for(const a of s.creativeApprovals||[])record(a,'creative approval');
  for(const l of s.loans||[]){record(l,'external loan');if(!companyIds.has(l.debtorId))problems.push(l.id+': loan borrower missing');}
  for(const n of s.news)record(n,'news');
  for(const n of s.archivedNews||[])record(n,'archived news');
  for(const a of s.inbox)record(a,'inbox');
  for(const r of s.reports)record(r,'report');
  for(const j of s.ledger)record(j,'journal');
  if(!Number.isInteger(s.sequence)||s.sequence<highest)problems.push('Global ID sequence is behind live records');
}