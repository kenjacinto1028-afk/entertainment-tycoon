
document.addEventListener('input',event=>{if(event.target.id==='production-search'){projectSearch=event.target.value;const pos=event.target.selectionStart;render();const input=$('production-search');input?.focus();input?.setSelectionRange(pos,pos);return;}if(event.target.closest('#project-form'))updatePreview();if(event.target.id==='news-search'){newsQuery=event.target.value;const pos=event.target.selectionStart;render();const input=$('news-search');input?.focus();input?.setSelectionRange(pos,pos);}});
document.addEventListener('change',event=>{if(event.target.id==='entity-view'){companyDetailId=event.target.value;render();return;}if(event.target.id==='production-sort'){projectSort=event.target.value;render();return;}
 if(event.target.id==='dashboard-focus'){safe(()=>E.setDashboardFocus(S,event.target.value));return;}
 if(event.target.id==='news-kind'){newsKind=event.target.value;render();return;}
 if(event.target.id==='news-year'){newsYear=event.target.value;render();return;}
 if(event.target.id==='rank-type'){rankType=event.target.value;render();return;}
 if(event.target.id==='rank-sector'){rankSector=event.target.value;render();return;}
 if(event.target.id==='rank-region'){rankRegion=event.target.value;render();return;}
 if(event.target.id==='rank-year'){rankYear=event.target.value;render();return;}
 if(event.target.id==='rank-metric'){rankMetric=event.target.value;render();return;}
if(event.target.id==='sub-sector'){const i=Number(event.target.selectedOptions[0].dataset.min);$('sub-capital').min=i;$('sub-capital').value=String(Math.ceil(i/CFG.tuning_ui.documentEvents__015)*CFG.tuning_ui.documentEvents__016);}
 if(event.target.id==='new-era'){$('new-origin').innerHTML=originOptions(Number(event.target.value));}
 if(event.target.id==='import-file'&&event.target.files?.[0]){event.target.files[0].text().then(text=>{const next=E.loadState(text);if(confirm('Replace the current game with this imported campaign?')){S=next;view='dashboard';remember();render();notify('Imported campaign successfully.');}}).catch(e=>notify('Invalid import: '+e.message,'error'));}
});
document.addEventListener('submit',event=>{const form=event.target;
 if(!['corporate-raise-form','corporate-board-form','corporate-risk-form','corporate-fresh-form','corporate-rename-form'].includes(form.id))return;
 event.preventDefault();const v=Object.fromEntries(new FormData(form));safe(()=>{
  if(form.id==='corporate-raise-form'){E.raiseEquity(S,Number(v.amount));notify('Outside shareholder capital funded without new sales.');}
  if(form.id==='corporate-board-form'){const r=E.boardVote(S,v.kind,Number(v.amount));notify(r.approved?'Board approved one material commitment.':'Independent board directors rejected this commitment.');}
  if(form.id==='corporate-risk-form'){E.setRiskPolicy(S,{minCashWeeks:Number(v.minCashWeeks),reviewLimit:Number(v.reviewLimit),maxDebtRatio:Number(v.maxDebtRatio)});notify('Company risk thresholds saved.');}
  if(form.id==='corporate-rename-form'){E.renameCompany(S,v.name);notify('Company legal name updated. IP and contracts remain with the same entity.');}
  if(form.id==='corporate-fresh-form'){E.startFreshCompany(S,{name:v.name,sector:v.sector,capital:Number(v.capital)});notify('Independent studio funded only from founder personal proceeds.');}
  closeModal();view='career';
 });
});
document.addEventListener('submit',event=>{const form=event.target;if(!['manuscript-pitch-form','new-game-form','project-form','commission-form','option-form','renew-form','hire-team-form','subsidiary-form','bank-loan-form','bank-repay-form','print-form','franchise-note-form','team-development-form','staff-hire-form','staff-contract-form','manuscript-form','imprint-form','game-design-form'].includes(form.id))return;event.preventDefault();const data=Object.fromEntries(new FormData(form));
 if(form.id==='game-design-form'){safe(()=>{const result=E.gameDesign(S,data.projectId,data);notify('Game direction approved: '+result.mechanic+' / '+result.platform+'.');});return;}
 if(form.id==='manuscript-pitch-form'){safe(()=>{const x=E.requestManuscriptApproval(S,data.grantId,data);closeModal();view='productions';industry='publishing';notify(x.status==='approved'?'Independent creator approved the exact title and genre. You may greenlight it.':'Creator vetoed the proposed change. Consider a pitch in the source genre.');});return;}
 if(form.id==='manuscript-form'){safe(()=>{const o=E.negotiateManuscript(S,data.manuscriptId,data);closeModal();view='productions';industry='publishing';notify(o.status==='counter'?'Rights owner countered the offer; review terms on Publishing.':'Rights terms agreed; approve signing separately.');});return;}
 if(form.id==='imprint-form'){safe(()=>{const i=E.createPublishingImprint(S,data);closeModal();view='productions';industry='publishing';notify(i.name+' founded within the current legal company.');});return;}
 if(form.id==='staff-hire-form'){safe(()=>{const e=E.hireCandidate(S,data.candidateId,data.teamId);closeModal();view='teams';notify(e.name+' recruited with real fee and salaried contract.');});return;}
 if(form.id==='staff-contract-form'){safe(()=>{const e=E.renewEmployee(S,data.employeeId,Number(data.weeklySalary));closeModal();view='teams';notify(e.name+' renewed employment by consent; new wage affects payroll.');});return;}
 if(form.id==='team-development-form'){safe(()=>{E.trainTeam(S,data.teamId,data.focus,data.specialty);closeModal();notify('Team development paid and recorded; skill affects future production.');});return;}
 if(form.id==='franchise-note-form'){safe(()=>{E.editFranchiseBible(S,data.ipId,{summary:data.summary,continuity:data.continuity,displayTitle:data.displayTitle});closeModal();view='library';notify('Franchise Bible notes saved; legal rights are unchanged.');});return;}
 if(form.id==='new-game-form'){safe(()=>{S=E.createGame(data);industry=E.player(S).sector;view='dashboard';closeModal();notify('Welcome to '+E.player(S).name+'.');});return;}
 if(form.id==='commission-form'){safe(()=>{const o=E.requestCommission(S,data);closeModal();view='productions';industry=o.sector;notify(o.status==='counter'?'Client counteroffer received; review on Productions.':'Client signed a fee offer; you can start it on Productions.');});return;}
 if(form.id==='project-form'){safe(()=>{if(data.fundingMode==='co'&&data.route!=='contract'){
   const offer=E.proposeCoProduction(S,data);closeModal();view='productions';industry=offer.sector;
   if(offer.status==='counter')notify('Partner countered your offer. Review and accept or decline on Productions. No money was moved.');
   else notify('Partner agreed to your proposal. Approve project funding on Productions.');
  }else{const p=E.createProject(S,data);closeModal();view='productions';industry=p.sector;notify(p.title+' approved for production.');}});return;}
 if(form.id==='option-form'){safe(()=>{const r=E.offerRights(S,data.ipId,data.medium,data.licenseeId,{...data,royaltyRate:Number(data.royaltyRate)});view='library';
   if(r.status==='counter')counterOfferModal(r.id);else closeModal();notify(r.status==='counter'?'Counteroffer received.':'Option signed with real funds.');});}
 if(form.id==='renew-form'){safe(()=>{const r=E.offerRenewal(S,data.grantId,data);view='library';
   if(r.status==='counter')counterOfferModal(r.id);else closeModal();notify(r.status==='counter'?'Renewal counteroffer received.':'Rights renewed by consent.');});}
 if(form.id==='hire-team-form'){safe(()=>{const t=E.hireTeam(S,data.specialty);closeModal();view='teams';notify(t.name+' hired.');});}
 if(form.id==='subsidiary-form'){safe(()=>{const c=E.foundSubsidiary(S,data);closeModal();view='world';notify(c.name+' founded as a wholly owned studio.');});}
 if(form.id==='bank-loan-form'){safe(()=>{const l=E.borrowLoan(S,data.amount);closeModal();view='finance';notify('Loan funded: '+fmt(l.originalPrincipal)+'. Monthly repayments automated.');});}
 if(form.id==='bank-repay-form'){safe(()=>{const result=E.repayLoan(S,data.loanId,data.amount);closeModal();view='finance';notify('Bank paid: '+fmt(result.principalPaid)+' principal and '+fmt(result.interestPaid)+' accrued interest.');});}
 if(form.id==='print-form'){safe(()=>{const q=Number(data.quantity);const result=data.action==='writeoff'?E.writeOffPrintStock(S,data.projectId,q):E.orderPrintRun(S,data.projectId,q);closeModal();view='productions';industry='publishing';notify((data.action==='writeoff'?'Disposed ':'Ordered ')+result.copies+' printed copies.');});}
});
document.addEventListener('keydown',event=>{
 const host=$('modal');
 if(host.classList.contains('open')){
  if(event.key==='Escape'){event.preventDefault();closeModal();return;}
  if(event.key==='Tab'){
   const controls=[...host.querySelectorAll('button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(x=>x.getClientRects().length>0&&x.tabIndex>=0);
   if(controls.length){const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&(document.activeElement===first||!host.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!host.contains(document.activeElement))){event.preventDefault();first.focus();}}
  }
  return;
 }
 if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)&&event.target?.matches?.('[data-industry][role="tab"]')){
  const tabs=[...document.querySelectorAll('[data-industry][role="tab"]')];const i=tabs.indexOf(event.target);
  if(i<0)return;event.preventDefault();
  const j=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[j].click();
 }
});
// UPDATE 41: career & capital authority UI. Board details are generated ONLY
// after the optional corporation transition; ordinary startups show readiness.
let companyDetailId='';
function careerPanel(){
 const c=E.player(S),status=E.corporateStatus(S),ready=E.corporateReadiness(S),risk=E.corporateRisk(S),
  val=E.corporateValuation(S),crew=E.employeeRoster(S).active,history=E.careerHistory(S);
 const incorporated=status.stage!=='founder';
 const row=(label,value)=>`<div class="small-stat"><span class="subdued">${label}</span><strong>${value}</strong></div>`;
 const leadership=panel('Leadership, ownership and continuity',
  row('Current legal company',esc(c.name))+
  row('Acting manager',esc(S.management.personId===S.founder.id?S.founder.name:(S.employees.find(e=>e.id===S.management.personId)?.name||'Vacant')))+
  row('Authority',esc(S.management.role+' · '+S.management.status))+
  row('Founder age',String(S.founder.age))+
  row('Founder personally funded savings',fmt(history.personalFunds))+
  row('Company equity and ownership',esc(status.stage))+ 
  `<p class="panel-sub">Executive authority, shares, legal company title and IP rights are separate. No assets are transferred merely because a founder retires.</p>`+
  (S.management.status==='active'?btn('Plan a successor','data-gov-plan','outline')+btn('Step down / transition','data-gov-step-down'):'')+
  (S.management.status!=='active'?btn('Open new independent firm','data-gov-fresh','outline'):'')+
  btn('Conclude this campaign','data-gov-end','outline')+
  (crew.length?`<div class="small-stat"><span class="subdued">Eligible successors · employed team leaders</span><strong>${crew.filter(x=>x.age<CFG.tuning_ui.leadership__001&&x.skill>=CFG.tuning_ui.leadership__002).length}</strong></div>`:'')+
  crew.filter(x=>x.age<CFG.tuning_ui.leadership__003&&x.skill>=CFG.tuning_ui.leadership__004).slice(0,CFG.tuning_ui.leadership__005).map(x=>`<div class="small-stat"><span>${esc(x.name)} · skill ${x.skill}${S.management.plannedSuccessorId===x.id?' · nominated':''}</span><span>${btn('Nominate',`data-gov-nominate="${esc(x.id)}"`,'outline')} ${btn('Appoint',`data-gov-appoint="${esc(x.id)}"`,'outline')}</span></div>`).join(''));
 const readiness=panel('Optional corporation readiness',Object.entries(ready.checks).map(([k,v])=>row(esc(k),v?'Ready':'Not yet')).join('')+
 `<p class="panel-sub">Practical finances, ledgers and leadership are required; no arbitrary minimum company size. This is not an IPO.</p>`+
 (status.stage==='founder'?btn('Incorporate this company',`data-gov-incorporate ${ready.eligible?'':'disabled'}`,'primary'):
 row('Incorporation',esc(status.stage))));
 const board=incorporated?panel('Board and shareholder authority',
  row('Founder voting share',Math.round(status.ownership.founderShare*CFG.tuning_ui.board__001)/CFG.tuning_ui.board__002+'%')+
  row('Founder / private investors / public shares',`${status.ownership.founder} / ${status.ownership.investor} / ${status.ownership.public}`)+
  row('Board seats',status.board.map(x=>esc(x.role)).join(' · '))+
  row('Board review limit',fmt(status.policy.reviewLimit))+
  row('Outside investor capital remaining',fmt(S.investorPool))+
  `<p class="panel-sub">Board authorization is binding for large new subsidiary investments and new loans. Vote once, then make the actual funded decision. Investor shares never receive automatic IP ownership.</p>`+
  btn('Propose a board vote','data-gov-board','outline')+btn('Raise outside equity','data-gov-raise','outline')+
  btn('Sell 100 personal shares','data-gov-sell-shares','outline')+
  (status.stage==='private-corporation'&&E.yearAt(S.week)>=CFG.tuning_ui.board__003?btn('Consider optional IPO','data-gov-ipo','outline'):'')+
  (status.ownership.founderShare<CFG.tuning_ui.board__004&&S.management.status==='active'?btn('Resolve loss of control','data-gov-contest','outline'):'')+
  (E.companyProfit(c)>=CFG.tuning_ui.board__005?btn('Declare cash dividend','data-gov-dividend','outline'):'')+
  `<p class="panel-sub">Corporate board resolutions: ${c.corporate.resolutions.slice(-CFG.tuning_ui.board__006).map(x=>esc(x.kind)+' '+(x.approved?'approved':'rejected')+(x.used?' · used':'')).join(' · ')||'No resolutions yet'}</p>`):'';
 const valuation=panel('Company valuation and cash risk',row('Conservative / expected / optimistic',`${fmt(val.conservative)} / ${fmt(val.expected)} / ${fmt(val.optimistic)}`)+
 row('Observed tangible net value',fmt(val.tangibleAssets))+
 row('Cash runway at existing payroll',risk.cashRunwayWeeks+' weeks')+
 row('Conservative 13-week cash stress',fmt(risk.scenarios.conservative))+
 row('Loan principal to value',(risk.loanToValue*CFG.tuning_ui.valuation__001).toFixed(1)+'%')+
 `<p class="panel-sub">Forecast valuation is not company cash. Bank and shareholder liabilities are not combined with sales revenue. Risk limits are optional and enforceable for major board commitments.</p>`+
 row('Active supply shock policy',E.insuranceStatus(S).active?'Covered':'Not covered')+
 row('Insurance premium / month',fmt(E.insuranceStatus(S).monthlyPremium))+
 btn('Adjust risk limits','data-gov-risk','outline')+btn(E.insuranceStatus(S).active?'Cancel insurance':'Insure supply shocks','data-gov-insurance','outline')+
 btn('Review major investment','data-gov-committee','outline')+btn('Compare group investments','data-gov-group-review','outline')+btn('Rename this studio','data-gov-rename','outline'));
 const chronology=panel('Company and founder lineage',status.recent.slice(-CFG.tuning_ui.chronology__001).reverse().map(x=>`<div class="small-stat"><span class="subdued">${weekLabel(x.week)} · ${esc(x.kind.replace(/-/g,' '))}</span><strong>${x.amount!==undefined?fmt(x.amount):esc(x.newName||x.personId||x.fromId||'Recorded')}</strong></div>`).join('')+
 history.continuations.map(x=>`<div class="small-stat"><span>${esc(x.fromId)} → ${esc(x.toId)}</span><strong>${fmt(x.capital)} personal capital</strong></div>`).join('')+
 `<p class="panel-sub">Titles, liabilities, creator permissions, and contracts stay with their actual legal owners after an executive change or fresh-company continuation.</p>`);
 return pageHeader('Founder journey','Career & Ownership','Optional corporate rules; the simplest publisher can remain private and founder-run forever.')+
 `<div class="dashboard-grid"><div class="stack">${leadership}${readiness}${chronology}</div><div class="stack">${board}${valuation}</div></div>`;
}