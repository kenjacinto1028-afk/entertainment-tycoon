
function offerRights(s,ipId,medium,licenseeId,terms={}){
  requireExecutiveControl(s);const {owner,other}=validateOptionParties(s,ipId,medium,licenseeId);
  const proposed=rightsTerms(terms,medium,s.week);
  const accepted=optionWillingness(other,proposed);
  const row={id:id(s,'rightsoffer'),kind:'option',ipId,grantId:null,grantorId:owner.id,
    holderId:other.id,media:medium,createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',
    proposal:proposed,counter:accepted?null:rightsTerms({fee:CFG.tuning_engine.row__005,exerciseFee:proposed.exerciseFee,
      royaltyRate:Math.min(proposed.royaltyRate,CFG.tuning_engine.row__006),optionWeeks:proposed.optionWeeks,
      continuationWeeks:proposed.continuationWeeks,approvalRequired:proposed.approvalRequired},medium,s.week)};
  if(accepted)row.grantId=createOption(s,ipId,medium,licenseeId,proposed).id;
  s.rightsOffers.push(row);
  return row;
}
function fulfillRenewal(s,grant,terms){
  if(grant.endWeek<=s.week)throw new Error('Expired contract must be renegotiated as a new grant.');
  const owner=company(s,grant.grantorId),holder=company(s,grant.holderId),ip=s.ips.find(x=>x.id===grant.ipId);
  if(!owner||!holder||!ip||!validGrantor43(s,{...grant,endWeek:grant.endWeek+terms.extensionWeeks},ip)||holder.bankrupt||holder.finance.cash<terms.fee+CFG.tuning_engine.fulfillRenewal__001)
    throw new Error('Renewal parties or funding are unavailable.');
  const proposedEnd=grant.endWeek+terms.extensionWeeks;
  if(s.grants.some(g=>g.id!==grant.id&&g.ipId===grant.ipId&&g.media===grant.media&&
    rightsConflict43(s,{...grant,endWeek:proposedEnd},g)))
    throw new Error('Renewal would overlap another exclusive contract.');
  expense(s,holder,terms.fee,'rights-renewal','Mutually agreed rights renewal');
  revenue(s,owner,terms.fee,'rights-renewal','Rights renewal income');
  if(ip.ownerId===owner.id)ip.rightsIncome=money((ip.rightsIncome||0)+terms.fee);
  grant.endWeek=proposedEnd;
  if(grant.type==='option')grant.optionExpiresWeek=proposedEnd;
  news(s,'Rights renewed: '+ip.name,owner.name+' and '+holder.name+' agreed to extend '+SECTORS[grant.media].name+' rights.','deal');
}
function renewalTerms(input={}){
  if(!Number.isFinite(Number(input.fee??CFG.tuning_engine.renewalTerms__001)))throw new Error('Renewal fee must be finite.');
  const fee=money(Number(input.fee??CFG.tuning_engine.fee__005)),extensionWeeks=Number(input.extensionWeeks??CFG.tuning_engine.extensionWeeks__001);
  if(!Number.isFinite(fee)||fee<CFG.tuning_engine.renewalTerms__002||fee>CFG.tuning_engine.renewalTerms__003||!Number.isInteger(extensionWeeks)||extensionWeeks<CFG.tuning_engine.renewalTerms__004||extensionWeeks>CFG.tuning_engine.renewalTerms__005)
    throw new Error('Renewal terms are outside permitted limits.');
  return {fee,extensionWeeks};
}
function offerRenewal(s,grantId,input={}){
  const grant=s.grants.find(g=>g.id===grantId);
  if(!grant||grant.grantorId!==s.playerId||grant.endWeek<=s.week)throw new Error('Only valid, unexpired owned rights may be offered for renewal.');
  const holder=company(s,grant.holderId),proposed=renewalTerms(input);
  if(!holder||holder.bankrupt)throw new Error('Holder is no longer available to consent.');
  const accepted=holder.finance.cash>=proposed.fee+CFG.tuning_engine.accepted__001&&
    proposed.fee<=Math.min(CFG.tuning_engine.accepted__002,Math.max(CFG.tuning_engine.accepted__003,money(holder.finance.cash*CFG.tuning_engine.accepted__004)));
  const row={id:id(s,'rightsoffer'),kind:'renewal',ipId:grant.ipId,grantId,
    grantorId:grant.grantorId,holderId:grant.holderId,media:grant.media,
    createdWeek:s.week,updatedWeek:s.week,status:accepted?'accepted':'counter',proposal:proposed,
    counter:accepted?null:renewalTerms({fee:CFG.tuning_engine.row__007,extensionWeeks:Math.min(CFG.tuning_engine.row__008,proposed.extensionWeeks)})};
  if(accepted){fulfillRenewal(s,grant,proposed);grant.renewalHistory.push(row.id);}
  s.rightsOffers.push(row);return row;
}
function answerRightsOffer(s,offerId,accept){
  const row=s.rightsOffers.find(x=>x.id===offerId);
  if(!row||row.status!=='counter'||row.grantorId!==s.playerId)throw new Error('Only pending owner counteroffers may be decided.');
  if(accept!==true&&accept!==false)throw new Error('Choose to accept or decline.');
  if(!accept){row.status='declined';row.updatedWeek=s.week;return row;}
  if(row.kind==='option'){
    // Re-check rights conflicts and the actual debtor cash at signature time.
    const parties=validateOptionParties(s,row.ipId,row.media,row.holderId);
    if(!optionWillingness(parties.other,row.counter))throw new Error('Counterparty cannot honor these terms.');
    row.grantId=createOption(s,row.ipId,row.media,row.holderId,row.counter).id;
  }else{
    const g=s.grants.find(g=>g.id===row.grantId),holder=company(s,row.holderId);
    if(!g||g.grantorId!==s.playerId||!holder||holder.finance.cash<row.counter.fee+CFG.tuning_engine.answerRightsOffer__001)
      throw new Error('Renewal is no longer legally or financially available.');
    fulfillRenewal(s,g,row.counter);g.renewalHistory.push(row.id);
  }
  row.status='accepted';row.updatedWeek=s.week;
  return row;
}
// Delegation is opt-in: small contracts only, and the other company must
// independently accept. Larger, contested or unbudgeted deals escalate.
function configureRightsAuthority(s,policy={}){
  const maxFee=money(Number(policy.maxFee??s.rightsPolicy.maxFee));
  const extensionWeeks=Number(policy.extensionWeeks??s.rightsPolicy.extensionWeeks);
  if(typeof policy.autoRenew!=='boolean'||!Number.isFinite(Number(policy.maxFee??s.rightsPolicy.maxFee))||
     maxFee<CFG.tuning_engine.configureRightsAuthority__001||maxFee>CFG.tuning_engine.configureRightsAuthority__002||![CFG.tuning_engine.configureRightsAuthority__003,CFG.tuning_engine.configureRightsAuthority__004].includes(extensionWeeks))
    throw new Error('Delegated renewals require a valid opt-in and minor-deal limits.');
  s.rightsPolicy={autoRenew:policy.autoRenew,maxFee,extensionWeeks};
  return s.rightsPolicy;
}
function delegateRightsRenewals(s){
  if(!s.rightsPolicy?.autoRenew)return;
  for(const g of s.grants)if(g.grantorId===s.playerId&&g.endWeek>s.week&&g.endWeek-s.week<=CFG.tuning_engine.delegateRightsRenewals__001&&
    g.renewalAutoAttemptedEnd!==g.endWeek){
    const currentEnd=g.endWeek;
    g.renewalAutoAttemptedEnd=currentEnd;
    try{
      const offer=offerRenewal(s,g.id,{fee:s.rightsPolicy.maxFee,extensionWeeks:s.rightsPolicy.extensionWeeks});
      if(offer.status==='counter')alert(s,'rights-counter-'+offer.id,CFG.events.messages.delegateRightsRenewals__001,
        CFG.events.messages.delegateRightsRenewals__002,'critical');
    }catch(e){alert(s,'rights-delegation-'+g.id+'-'+currentEnd,CFG.events.messages.delegateRightsRenewals__003,
      'An automatic renewal did not complete: '+e.message,'critical');}
  }
}
function exerciseOption(s,g){
  if(g.type!=='option'||g.endWeek<=s.week||!available(g.media,s.week))return false;
  const c=company(s,g.holderId),owner=company(s,g.grantorId),fee=money(g.exerciseFee??CFG.tuning_engine.fee__006);
  if(!c||!owner||c.bankrupt||c.finance.cash<fee+CFG.tuning_engine.exerciseOption__001)return false;
  expense(s,c,fee,'rights-license','Exercise '+g.media+' rights option');
  revenue(s,owner,fee,'rights-license','Option exercised for '+g.media);
  const sourceIp=s.ips.find(i=>i.id===g.ipId);if(sourceIp)sourceIp.rightsIncome=money((sourceIp.rightsIncome||0)+fee);
  g.optionExpiresWeek=g.endWeek;g.exercisedWeek=s.week;g.exerciseFeePaid=fee;
  g.type='license';g.startWeek=s.week;g.endWeek=s.week+CFG.tuning_engine.exerciseOption__002;g.allowsProduction=true;
  news(s,CFG.events.messages.exerciseOption__001,c.name+' licensed '+SECTORS[g.media].name+' production rights in '+(sourceIp?.name||'an IP')+'.','deal');return true;
}
function exerciseLicensedOption(s,grantId){const g=s.grants.find(x=>x.id===grantId);return !!g&&exerciseOption(s,g);}
function requestCreativeApproval(s,grantId,{title='Untitled adaptation',genre='Fantasy'}={}){
  const g=s.grants.find(g=>g.id===grantId);
  if(!g||g.type!=='license'||!g.approvalRequired||g.endWeek<=s.week||!g.allowsProduction)
    throw new Error('This grant has no active binding creative approval clause.');
  title=String(title).trim().slice(0,CFG.tuning_engine.requestCreativeApproval__001);if(!title||!GENRES.includes(genre))throw new Error('Valid title and genre required for approval.');
  const row={id:id(s,'pitchapproval'),grantId:g.id,grantorId:g.grantorId,holderId:g.holderId,
    title,genre,status:'pending',requestedWeek:s.week,decidedWeek:null,decidedBy:null};
  s.creativeApprovals.push(row);
  if(g.grantorId===s.playerId)alert(s,'approval-'+row.id,CFG.events.messages.requestCreativeApproval__001,
    company(s,g.holderId).name+' seeks approval for '+title+' ('+genre+'). Review the Library before production can start.','critical');
  return row;
}
function decideCreativeApproval(s,approvalId,allow){
  const row=s.creativeApprovals.find(x=>x.id===approvalId);
  if(!row||row.status!=='pending'||row.grantorId!==s.playerId||typeof allow!=='boolean')
    throw new Error('Only the contracted rights holder may accept or veto this proposal.');
  row.status=allow?'approved':'rejected';row.decidedBy=s.playerId;row.decidedWeek=s.week;
  const notice=s.inbox.find(a=>a.key==='approval-'+row.id);if(notice)notice.open=false;
  return row;
}
// One account per licensed production; amounts are exact contracted royalties,
// not extra consumer sales. Recoupment may offset only paid, explicitly agreed
// option consideration; by default all royalty rates are nonrecoupable.
function royaltyAccount(s,p,g){
  let account=s.royaltyAccounts.find(a=>a.grantId===g.id&&a.projectId===p.id);
  if(!account){account={id:id(s,'royaltyaccount'),grantId:g.id,projectId:p.id,
    debtorId:p.companyId,creditorId:g.grantorId,createdWeek:s.week,updatedWeek:s.week,
    openingOutstanding:0,salesBase:0,accrued:0,recouped:0,paid:0,outstanding:0,
    historyComplete:g.royaltyHistoryComplete===true};s.royaltyAccounts.push(account);}
  return account;
}
function settleRoyalty(s,p,g,royalty,gross){
  const payer=company(s,p.companyId),recipient=company(s,g.grantorId);
  if(!payer||!recipient||payer.id===recipient.id)return;
  royalty=money(royalty);if(!royalty)return;
  const account=royaltyAccount(s,p,g);
  const available=money(Math.max(0,(g.recoupableAdvance||0)-s.royaltyAccounts.filter(a=>a.grantId===g.id).reduce((n,a)=>n+a.recouped,0)));
  const recouped=money(Math.min(royalty,available)),due=money(royalty-recouped);
  const paid=money(Math.min(due,Math.max(0,payer.finance.cash)));
  // All cash/expense recognition continues through the existing legal-company
  // journal; an offset is not new cash or another income event.
  if(due)expense(s,payer,due,'royalty','Adaptation royalty due',p.id);
  if(paid>0){revenue(s,recipient,paid,'royalty','Adaptation royalty received',p.id);
    const ip=s.ips.find(i=>i.id===p.ipId);if(ip)ip.rightsIncome=money((ip.rightsIncome||0)+paid);
    if(g.agentRate>0){const cut=money(paid*g.agentRate);if(cut){expense(s,recipient,cut,'author-agency','Representing agent commission: '+p.title,p.id);g.agentFeesPaid=money((g.agentFeesPaid||0)+cut);}}}
  account.salesBase=money(account.salesBase+(gross||0));
  account.accrued=money(account.accrued+royalty);
  account.recouped=money(account.recouped+recouped);
  account.paid=money(account.paid+paid);
  account.outstanding=money(account.outstanding+due-paid);
  account.updatedWeek=s.week;
  if(paid<due)s.obligations.push({id:id(s,'obligation'),debtorId:payer.id,creditorId:recipient.id,
    projectId:p.id,grantId:g.id,accountId:account.id,kind:'royalty',amount:money(due-paid),createdWeek:s.week});
  p.royaltyCost=money(p.royaltyCost+due);
}