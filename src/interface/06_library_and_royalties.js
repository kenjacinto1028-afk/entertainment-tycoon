
function renderLibrary(){const ips=ownIPs();const grants=S.grants.filter(g=>ips.some(ip=>ip.id===g.ipId));return pageHeader('Intellectual property','Library & Rights','Underlying IP ownership, adaptations and time-limited rights are separate. Options never allow premature production.')+
  `<div class="section-note">One rights ledger across all four industries. Exclusive options reserve future media; licenses need effective production permission and have strict expiration dates.</div><div class="metrics">${metric('OWNED SOURCE IP',String(ips.length),'Original properties','◇')}${metric('LICENSES & OPTIONS',String(grants.length),'Signed rights packages','▤')}${metric('RELEASED WORKS',String(releasedMine().filter(p=>p.route!=='contract').length),'Adaptations and originals','▣')}${metric('RIGHTS EXPIRING',String(grants.filter(g=>g.endWeek>S.week&&g.endWeek-S.week<=CFG.tuning_ui.renderLibrary__001).length),'Within 12 weeks','!')}</div>`+
  pendingRightsPanel()+rightsCalendarPanel()+royaltyStatementPanel('creditor')+
  panel('Franchise shelf',ips.length?`<div class="world-list">${ips.map(ip=>{const p=S.projects.filter(x=>x.ipId===ip.id),rg=S.grants.filter(g=>g.ipId===ip.id),fin=E.franchiseFinancial(S,ip.id);return `<article class="record"><div class="card-tag">OWNED ORIGINAL · ${esc(sectorName(ip.sourceSector))}</div><h3>${esc(ip.name)}</h3><p>${esc(ip.description)} · ${p.length} linked works/projects</p><div class="small-stat"><span class="subdued">Underlying owner</span><strong>${esc(E.company(S,ip.ownerId)?.name||'Unknown')}</strong></div><div class="small-stat"><span class="subdued">Owned works · direct contribution</span><strong>${signed(fin.directContribution)}</strong></div><div class="small-stat"><span class="subdued">Included source licensing income</span><strong>${fmt(fin.recognizedOwnerLicensingIncome)}</strong></div><div class="small-stat"><span class="subdued">Shared overhead attributed separately</span><strong>${fmt(fin.allocatedOverhead)}</strong></div><p class="panel-sub">${fin.isComplete?'Includes current lifetime tracked activity.':'Historical license/overhead breakdown was not available in an imported older save; shown since tracking began.'} External licensee sales are excluded from owner direct revenue.</p>${rg.map(g=>`<p>${badge(g.type==='option'?'Reservation only':g.endWeek>S.week?'Production licensed':'Expired license',g.endWeek>S.week?'active':'locked')} ${esc(sectorName(g.media))} · ${esc(E.company(S,g.holderId)?.name||'Unknown')} · expires ${weekLabel(g.endWeek)}${g.continuationWeeks?' · explicit continuation '+g.continuationWeeks+' weeks':''}</p>`).join('')||'<p>No external grants</p>'}<div class="franchise-works"><strong>Linked productions</strong>${p.map(w=>`<p>${esc(w.title)} · ${esc(sectorName(w.sector))} · ${w.status==='released'?'Released':'In progress'} · ${esc(E.company(S,w.companyId)?.name||'Unknown work owner')}</p>`).join('')}</div><div class="actions">${btn('Franchise Bible & schedule',`data-franchise="${esc(ip.id)}"`,'primary')} ${btn('Offer future-media option',`data-option="${esc(ip.id)}"`,'outline')}</div></article>`;}).join('')}</div>`:empty('No owned IP yet','Start an original project to build your franchise library.','◇'))+
  panel('Rights agreements',grants.length?`<table class="list-table"><thead><tr><th>Source property</th><th>Counterparty</th><th>Media and permission</th><th>Expiry</th></tr></thead><tbody>${grants.map(g=>`<tr><td>${esc(S.ips.find(i=>i.id===g.ipId)?.name)}</td><td>${esc(E.company(S,g.holderId)?.name)}</td><td>${esc(sectorName(g.media))} · ${esc(g.type)}${g.allowsProduction?' · production authorized':' · reservation only'}</td><td>${esc(weekLabel(g.endWeek))} ${g.endWeek<=S.week?badge('Expired','warning'):badge('Timed','active')}${g.endWeek>S.week?' '+btn('Offer renewal',`data-renew=\"${esc(g.id)}\"`,'outline'):''}</td></tr>`).join('')}</tbody></table>`:empty('No external agreements','You can grant exclusive future-film, TV or game options on owned IP.'));
}
function treasuryPanel(plan){
 const risk=plan.status==='critical'?'Very short':plan.status==='watch'?'Monitor':'Covered for 13 weeks';
 const row=([label,value])=>`<div class="small-stat"><span class="subdued">${label}</span><strong>${value}</strong></div>`;
 const four=plan.timeline.slice(0,CFG.tuning_ui.four__001);
 return panel('Cash runway · committed-only scenario',[
  ['Cash available now',fmt(plan.startingCash)],
  ['Projected cash in 4 weeks',signed(plan.cashAt4)],
  ['Projected cash in 13 weeks',signed(plan.endingCash)],
  ['Conservative runway',plan.runwayWeeks===null?'More than 13 weeks':plan.runwayWeeks+' weeks'],
  ['Known distributor collections',fmt(plan.totalKnownReceipts)],
  ['Estimated active production spend',fmt(plan.totalProduction)],
  ['Scheduled bank service',fmt(plan.totalLoanService)],
  ['Existing tax, royalty and vendor bills',fmt(plan.totalScheduledBills)]
 ].map(row).join('')+
 `<div class="section-note ${plan.status==='covered'?'neutral':'warn'}" style="margin:12px 0">${risk}. This is a liquidity stress view, not a guaranteed cash outcome: future sales, new projects, new loans and future tax on unknown earnings are excluded.</div>`+
 `<div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Week</th><th>Known receipts</th><th>Commitments</th><th>Cash stress</th></tr></thead><tbody>${four.map(x=>`<tr><td>${esc(weekLabel(x.week))}</td><td>${fmt(x.knownReceipts)}</td><td>${fmt(x.outflows)}</td><td>${signed(x.endingCash)}</td></tr>`).join('')}</tbody></table></div>`);
}
function monthlyReconciliationPanel(reports){
 const ready=reports.filter(r=>r.cashFlow&&r.balance);
 if(!ready.length)return panel('Monthly close reconciliation',empty('No complete monthly snapshots yet','Advance past a monthly boundary for automatic income, balance and cash movement reports.'));
 return panel('Monthly close reconciliation',`<div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Closed month</th><th>Earned profit</th><th>Operating cash</th><th>Investing</th><th>Bank financing</th><th>Ending cash</th></tr></thead><tbody>${ready.slice(0,CFG.tuning_ui.monthlyReconciliationPanel__001).map(r=>`<tr><td><strong>${esc(r.name)} · Y${r.year}</strong>${r.historyComplete?'':'<span class="item-sub">Partial pre-migration period</span>'}</td><td>${signed(r.net)}</td><td>${r.historyComplete?signed(r.cashFlow.operating):'—'}</td><td>${r.historyComplete?signed(r.cashFlow.investing):'—'}</td><td>${r.historyComplete?signed(r.cashFlow.financing):'—'}</td><td>${fmt(r.cash)}</td></tr>`).join('')}</tbody></table></div><p class="panel-sub">Direct cash movements and the indirect profit/working-capital bridge are reconciled at each close. Interest and taxes affect profit; loan principal and subsidiary funding do not. Earlier save periods are not reconstructed.</p>`);
}
function closedBudgetPanel(reports){
 const monthly=reports.filter(r=>r.budget);
 return panel('Monthly production budget · approved versus actual',monthly.length?
   `<p class="panel-sub">Actual production spending is already included in company expenses. Estimated remaining costs are future commitments, not an extra payable.</p><div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Close</th><th>Plan this month</th><th>Actual this month</th><th>Variance</th><th>Remaining estimate</th></tr></thead><tbody>${monthly.slice(0,CFG.tuning_ui.closedBudgetPanel__001).map(r=>`<tr><td>${esc(r.name)} Y${r.year}${r.budget.historyComplete?'':' · partial'}</td><td>${r.budget.historyComplete?fmt(r.budget.plannedPeriod):'—'}</td><td>${r.budget.historyComplete?fmt(r.budget.spentPeriod):'—'}</td><td>${r.budget.historyComplete?signed(r.budget.variancePeriod):'—'}</td><td>${r.budget.historyComplete?fmt(r.budget.estimatedRemaining):'—'}</td></tr>`).join('')}</tbody></table></div>`:
   empty('No closed production budgets yet','Complete a month with active production to compare approved spend and actual costs.'));
}
function subsidiaryClosePanel(){
 const subs=E.controlledCompanies(S).slice(1);
 if(!subs.length)return '';
 const rows=subs.map(c=>({c,r:S.reports.find(r=>r.companyId===c.id)}));
 return panel('Subsidiary financial closes · separate legal books',`<p class="panel-sub">Each company closes its own cash, balance, tax and rights obligations. Their cash is not automatically available to the parent.</p>${rows.map(({c,r})=>`<div class="small-stat"><span class="subdued">${esc(c.name)} · ${esc(c.homeRegion||'North Coast')}</span><strong>${r?esc(r.name)+' Y'+r.year+' · '+fmt(r.cash)+' cash':'No monthly close yet'}</strong></div>`).join('')}`);
}
function closedSettlementPanel(rows){
 const ready=rows.filter(r=>r.verified);
 return panel('Closed-period statutory and rights settlements',
 rows.length?`<p class="panel-sub">${ready.length}/${rows.length} retained monthly closes have verified settlement snapshots. Missing historical snapshots are never estimated.</p><div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Month</th><th>Tax expense / paid</th><th>Royalties expense / paid</th><th>Interest expense / paid</th></tr></thead><tbody>${rows.slice(0,CFG.tuning_ui.closedSettlementPanel__001).map(r=>`<tr><td>${esc(r.period)} Y${r.year}${r.verified?'':' · partial'}</td>${['tax','royalty','interest'].map(k=>`<td>${r.verified?fmt(r[k].expense)+' / '+fmt(r[k].cashPaid):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="panel-sub">Expenses are recognized separately from settlement payments; closing liabilities remain outstanding until paid. These are stored closing snapshots, not recreated from old balances.</p>`:empty('No monthly closes yet','Advance through a monthly boundary to see settlement history.'));
}
// Update 23: optional accounting drilldown, not mandatory paperwork.
function balanceSheetDetailPanel(){
 const d=E.balanceSheetDetails(S),a=d.assets,l=d.liabilities,g=d.group;
 const entry=(title,value)=>`<div class="small-stat"><span class="subdued">${title}</span><strong>${fmt(value)}</strong></div>`;
 return panel('Legal balance sheet · full components',
  `<p class="panel-sub">Reconciled legal-company statement; only externally held debt counts as an obligation, not future project forecasts.</p>`+
  `<div class="section-note neutral">Assets</div>${entry('Cash',a.cash)}${entry('Distributor receivables',a.receivable)}${entry('Prepaid client and partner commitments',a.prepaid)}${entry('Printed stock at cost',a.inventory)}${entry('Ownership stakes in new subsidiaries',a.investment)}${entry('TOTAL ASSETS',a.total)}`+
  `<div class="section-note neutral">Liabilities and equity</div>${entry('Trade/vendor payable',l.trade)}${entry('Tax payable',l.tax)}${entry('Rights royalties payable',l.royalty)}${entry('Bank interest payable',l.interest)}${entry('Unearned client advances',l.deferred)}${entry('Bank loan principal',l.principal)}${entry('TOTAL LIABILITIES',l.total)}${entry('Contributed capital',d.equity.contributed)}${entry('Cumulative earned profit / losses',d.equity.retainedEarnings)}${entry('TOTAL EQUITY',d.equity.total)}`+
  `<p class="panel-sub">${d.intellectualProperty.ownedCount} legally owned source IP${d.intellectualProperty.ownedCount===1?'':'s'} · ${d.externallyLicensedCount} active third-party licenses. Internally developed IP has no invented book valuation; rights ownership is tracked in Library.</p>`+
  (g.members.length>1?`<div class="section-note neutral">Legal-company group rollup</div>${g.members.map(row=>`<div class="small-stat"><span class="subdued">${esc(row.name)} · standalone assets</span><strong>${fmt(row.assets.total)}</strong></div>`).join('')}${entry('Eliminated parent investment',g.eliminatedInvestment)}${entry('Group consolidated assets',g.consolidatedAssets)}${entry('Group liabilities',g.consolidatedLiabilities)}${entry('Group equity',g.consolidatedEquity)}`:'')+
  `<div class="section-note ${d.difference||(g&&g.difference)?'warn':'neutral'}">${d.difference||(g&&g.difference)?'Reconciliation needs review.':'Assets = liabilities + equity. Group eliminations reconcile.'}</div>`);
}
function activeObligationPanel(){
 const r=E.activeObligationRegister(S);
 const names={'tax-payable':'Tax authority','bank-interest':'Bank interest','loan-principal':'External bank principal','royalty':'Named rights holder','trade-payable':'Trade/vendor cost','unearned-client-advance':'Service owed to client'};
 return panel('Active obligations · contract and counterparty register',
  `<p class="panel-sub">Amounts remain legally payable even after historical transaction journals are compacted. Rights expirations are deadlines, not automatic cash charges.</p>`+
  (r.debts.length?`<div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Type</th><th>Amount</th><th>Counterparty/source</th></tr></thead><tbody>${r.debts.slice(0,CFG.tuning_ui.activeObligationPanel__001).map(d=>`<tr><td>${esc(names[d.kind]||d.kind)}</td><td>${fmt(d.amount)}</td><td>${esc(E.company(S,d.creditorId)?.name||d.sourceId||d.creditorId)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="panel-sub">No booked debts or unearned advances.</p>')+
  `<div class="small-stat"><span class="subdued">All booked liabilities (including principal)</span><strong>${fmt(r.totals.allLiabilities)}</strong></div>`+
  `<p class="panel-sub">${r.escrows.length} live funded client escrow agreement(s); reserved delivery funds are not additional studio cash. ${r.reconciliation.difference?'Ledger discrepancies need review.':'All amounts reconcile to existing balance-sheet accounts.'}</p>`);
}
function royaltyStatementPanel(side){
 const report=E.royaltyStatements(S);
 const owner=side==='creditor',rows=owner?report.receivableAccounts:report.accounts;
 const summary=owner?report.creditorTotals:report.totals;
 const heading=owner?'Licensing royalties · owed to your IP':'Royalty statements · licensed productions';
 return panel(heading,
  `<p class="panel-sub">${owner?'A counterparty owes these contract royalties. Unpaid sums are not presented as extra consumer revenue or available studio cash.':'Royalty calculations use actual licensed-work sales, contractual rates and only explicitly recoupable option consideration.'} ${rows.some(r=>!r.historyComplete)?'Imported historical activity is partial; no transactions were reconstructed.':'Figures reflect exact tracked activity.'}</p>`+
  `<div class="small-stat"><span class="subdued">${owner?'Royalties collected from licensees':'Royalties paid to rights owners'}</span><strong>${fmt(owner?summary.paid:report.totals.paid)}</strong></div>`+
  `<div class="small-stat"><span class="subdued">${owner?'Royalties still owed to you':'Royalties remaining payable'}</span><strong>${fmt(owner?summary.unpaid:report.totals.outstanding)}</strong></div>`+
  `<div class="small-stat"><span class="subdued">Advance offsets applied</span><strong>${fmt(summary.recouped)}</strong></div>`+
  (rows.length?`<div style="overflow-x:auto"><table class="list-table"><thead><tr><th>IP / production</th><th>${owner?'Licensee':'Licensor'}</th><th>Accrued</th><th>Paid</th><th>Unpaid</th></tr></thead><tbody>${rows.slice(0,CFG.tuning_ui.royaltyStatementPanel__001).map(r=>`<tr><td>${esc(r.sourceTitle)}<span class="item-sub">${esc(r.projectTitle)}${r.historyComplete?'':' · tracked period only'}</span></td><td>${esc(owner?r.debtorName:E.company(S,r.creditorId)?.name||'Rights holder')}</td><td>${fmt(r.accrued)}</td><td>${fmt(r.paid)}</td><td>${fmt(r.outstanding)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="panel-sub">No licensed production has generated tracked royalties yet.</p>')+
  (!owner&&report.reconciliation.difference?'<p class="panel-sub">Royalty claims require reconciliation.</p>':''));
}