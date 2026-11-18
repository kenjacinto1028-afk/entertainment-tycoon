
function corporateFinancePanel(){const c=E.player(S),r=E.corporateRisk(S),v=E.corporateValuation(S);
 return panel('Investment, ownership and downside review',`<div class="small-stat"><span>Estimated company value · not cash</span><strong>${fmt(v.expected)}</strong></div><div class="small-stat"><span>Operating runway</span><strong>${r.cashRunwayWeeks} weeks</strong></div><div class="small-stat"><span>Conservative 13-week cash stress</span><strong>${fmt(r.scenarios.conservative)}</strong></div><div class="small-stat"><span>Company status</span><strong>${esc(c.corporate.stage)}</strong></div><p class="panel-sub">External equity is shareholder financing, separate from bank principal, earned profit and consumer receipts. Corporate commitments may need board approval after incorporation.</p>`,btn('Review governance and ownership','data-gov-open'));
}
function companyLevelsPanel(){const group=E.controlledCompanies(S),chosen=group.find(c=>c.id===companyDetailId)||group[0],fin=E.financialStatements(S,chosen.id),projects=S.projects.filter(p=>p.companyId===chosen.id);
 return panel('Multi-level legal-company drilldown',`<p class="panel-sub">Root company, wholly owned subsidiaries, production teams and projects are separate operational and financial views. This is a read-only snapshot: selecting a division does not move cash or IP.</p>`+
 `<label for="entity-view">VIEW LEGAL COMPANY</label><select class="search-input" id="entity-view" aria-label="View legal company">${group.map(c=>`<option value="${esc(c.id)}" ${chosen.id===c.id?'selected':''}>${esc(c.name)} · ${esc(sectorName(c.sector))}</option>`).join('')}</select>`+
 `<div class="small-stat"><span>Cash</span><strong>${fmt(fin.balance.cash)}</strong></div><div class="small-stat"><span>Actual income</span><strong>${fmt(fin.income.revenue)}</strong></div><div class="small-stat"><span>Actual profit</span><strong>${signed(fin.income.net)}</strong></div><div class="small-stat"><span>Company bank debt</span><strong>${fmt(fin.balance.loanBalance)}</strong></div><div class="small-stat"><span>Named teams / projects</span><strong>${chosen.teams.length} / ${projects.length}</strong></div>`+
 chosen.teams.slice(0,CFG.tuning_ui.companyLevelsPanel__001).map(t=>`<div class="small-stat"><span>${esc(t.name)} · ${esc(t.specialty)}</span><strong>Skill ${t.skill}</strong></div>`).join('')+
 projects.slice(-CFG.tuning_ui.companyLevelsPanel__002).map(p=>`<div class="small-stat"><span>${esc(p.title)} · ${esc(p.sector)}</span><strong>${esc(p.status)}</strong></div>`).join(''));
}
const previousFinanceView=renderFinance,previousWorldView=renderWorld;
renderFinance=function(){return previousFinanceView()+corporateFinancePanel();};
renderWorld=function(){return previousWorldView()+companyLevelsPanel();};

// UPDATE 42 — player-facing strategic growth, finite credit and ownership UI.
// Retain the original app navigation: new work is in World & Rivals/Financials.
function brief42(label,value){return `<div class="small-stat"><span class="subdued">${esc(label)}</span><strong>${value}</strong></div>`;}
function growthFinance42(){
 const c=E.player(S),loan=E.automaticLenderDecision(S,c.id,'revolver'),lines=(S.creditLines||[]).filter(x=>x.companyId===c.id),group=E.groupFinanceReport(S),active=lines.filter(x=>E.creditLineStatus(S,x.id).open);
 const bank=panel('Revolving bank credit · actual debt',
   `<p class="panel-sub">Bank credit is underwritten from observed cash, repayment capacity and existing debt. Opening a facility costs 1.25% but creates no income. Drawing cash creates a real loan repaid through monthly closes.</p>`+
   brief42('Bank decision',loan.approved?badge('Eligible','active'):badge('Declined','warning'))+
   brief42('Maximum new commitment',fmt(loan.limit))+brief42('Rate on borrowed balance',(loan.annualRate*CFG.tuning_ui.bank__001).toFixed(1)+'% / year')+
   brief42('Bank assessment',esc(loan.reason))+
   (loan.approved?btn('Open credit facility','data-u42="open-line"','primary'):'')+
   lines.slice(-CFG.tuning_ui.bank__002).reverse().map(l=>{const v=E.creditLineStatus(S,l.id);return `<div class="small-stat"><span>${fmt(v.outstanding)} borrowed / ${fmt(v.limit)} committed · expires ${weekLabel(v.expiresWeek)} ${v.open?'':'· expired / closed'}</span><span>${v.open?btn('Draw','data-u42="draw-line" data-id42="'+esc(l.id)+'"','outline')+btn('Close','data-u42="close-line" data-id42="'+esc(l.id)+'"','outline'):''}</span></div>`}).join('')+
   (S.loans||[]).filter(l=>l.debtorId===c.id&&l.facilityId&&l.principalOutstanding>0).slice(-CFG.tuning_ui.bank__003).reverse().map(l=>`<div class="small-stat"><span>Draw · ${fmt(l.principalOutstanding)} outstanding · ${Math.round(l.interestRate*CFG.tuning_ui.bank__004)}% interest</span>${btn('Pay principal','data-u42="repay-line" data-id42="'+esc(l.id)+'"','outline')}</div>`).join(''));
 const profit=group.consolidated;
 const groupReport=panel('Legal entity + division reporting',
  `<p class="panel-sub">Each subsidiary retains its own treasury, debts, copyright and employment. The combined view excludes internal income and subsidiary investments; pre-acquisition earnings are not player income.</p>`+
  brief42('Consolidated external revenue',fmt(profit.income.revenue))+
  brief42('Group operating result',signed(profit.income.net))+
  brief42('Group cash / debt',fmt(profit.balance.cash)+' / '+fmt(profit.balance.loanBalance))+
  brief42('Internal sales eliminated',fmt(profit.income.internalRevenueEliminated))+
  brief42('Group book balance',profit.balance.difference===0?badge('Reconciled','active'):badge('Review required','warning'))+
  group.entities.map(e=>`<div class="small-stat"><span>${esc(e.name)} · ${e.divisions.length-1} divisions · ${e.services.length} services</span><strong>${fmt(e.financial.balance.cash)} cash · ${signed(e.financial.income.net)} result</strong></div>`).join(''));
 return bank+groupReport;
}
function growthWorld42(){
 const c=E.player(S),rivals=S.companies.filter(x=>!x.isPlayer&&!x.parentId&&!x.bankrupt&&(!x.corporate||x.corporate.stage==='founder')),owned=E.controlledCompanies(S),subs=owned.slice(1),visible=rivals.slice(0,CFG.tuning_ui.visible__001),assets=S.ips.filter(x=>x.ownerId!==c.id&&!owned.some(o=>o.id===x.ownerId)).slice(0,CFG.tuning_ui.assets__001);
 const rivalsPanel=panel('Strategic acquisition market · real independent companies',
   `<p class="panel-sub">Each price purchases shares from the previous owners, not the company's treasury. Existing rights, creator vetoes, employees and bank debt stay with the acquired legal company. Information marked “estimated” is not a secret balance sheet.</p>`+
   (visible.map(x=>{const intel=E.rivalIntelligence(S,x.id),q=E.companyPurchaseQuote(S,x.id),done=(S.diligenceRecords||[]).some(d=>d.key==='company:'+x.id);
     const range=intel.financialEstimate.annualSalesBand,strategic=intel.strategy;
     return `<div class="small-stat" style="display:block"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="item-name">${esc(x.name)}</span>${badge(esc(sectorName(x.sector)))}${badge(esc(strategic.style)+' · estimated','')}
        <strong style="margin-left:auto">Ask ${fmt(q.ask)}</strong></div>
        <div class="item-sub">${esc(strategic.likelyFocus)} (estimated) · Revenue ${range?fmt(range[0])+'–'+fmt(range[1])+' estimated':'unknown'} · Founder controlled</div>
        <div class="item-sub">Protected liquidity needed after purchase ${fmt(q.operatingReserve)} · Shortfall ${fmt(q.shortfall)}${done&&q.bookNetAssets!==null?' · Inspected book assets '+fmt(q.bookNetAssets):''}</div>
        <div style="margin-top:8px">${btn(done?'View diligence':'Inspect books · 650',`data-u42="diligence" data-id42="${esc(x.id)}"`,'outline')}
        ${btn('Acquire company',`data-u42="buy-company" data-id42="${esc(x.id)}"`,'primary')}</div></div>`}).join('')||empty('No independent sellers','Company listings return when independent studios enter the world.')));
 const assetPanel=panel('Clean IP assets · separate from finished-work rights',
   `<p class="panel-sub">Only assets with clean legal title are eligible for a quick purchase. An IP purchase does not move a finished work, and a finished-work purchase does not grant extra source-IP distribution rights.</p>`+
   (assets.map(ip=>{const q=E.assetPurchaseQuote(S,{type:'ip',id:ip.id});return `<div class="small-stat"><span><strong>${esc(ip.name)}</strong> · ${esc(E.company(S,ip.ownerId)?.name)} · ${q.allowed?'Clear title':'Encumbered / unavailable'} · ${fmt(q.price)}</span>${q.allowed?btn('Buy IP','data-u42="buy-asset" data-id42="'+esc(ip.id)+'"','outline'):badge('Rights restricted','warning')}</div>`;}).join('')||empty('No independent IP listed','Rival stories create new assets as production continues.')));
 const groupPanel=panel('Your group and restructuring',
  `<p class="panel-sub">Choose light-touch culture or recapitalize with actual owner cash. Recapitalization cannot erase creditors or rewrite old licenses. Ordinary startups keep these choices simple, without mandatory board meetings.</p>`+
  (subs.map(x=>`<div class="small-stat"><span><strong>${esc(x.name)}</strong> · ${esc(sectorName(x.sector))} · ${fmt(x.finance.cash)} cash · ${fmt(x.finance.loanBalance)} debt</span><span>${btn(x.delegatedProduction===false?'Resume automatic productions':'Pause automatic productions',`data-u42=\"delegation\" data-id42=\"${esc(x.id)}\"`,'outline')}${btn('Lean','data-u42="integrate" data-id42="'+esc(x.id)+'" data-kind42="lean"','outline')}${btn('Supportive','data-u42="integrate" data-id42="'+esc(x.id)+'" data-kind42="supportive"','outline')}${btn('Invest capital','data-u42="invest" data-id42="'+esc(x.id)+'"','outline')}</span></div>`).join('')||'<p class="panel-sub">Found a company below, or buy a funded, independent business above.</p>')+
  `${btn('Create internal division','data-u42="new-division"','outline')}`+
  owned.map(x=>{const services=x.sharedServices||{};
   return `<div style="padding-top:10px"><strong>${esc(x.name)} · optional shared services</strong><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${['finance','hr','legal'].map(k=>btn((services[k]?'✓ ':'')+caps(k),`data-u42="service" data-id42="${esc(x.id)}" data-kind42="${k}"`,'outline')).join('')}</div>`+
   `<p class="panel-sub">Recurring weekly costs: finance 90, HR 80, legal 110 · actual corporate overhead, not fictional service income.</p>`+
   (x.teams||[]).slice(0,CFG.tuning_ui.groupPanel__001).map(team=>{const opts=[{id:null,name:'Unassigned'},...(x.divisions||[])].map(d=>`<option value="${esc(d.id||'')}" ${team.divisionId===d.id?'selected':''}>${esc(d.name)}</option>`).join('');return `<div class="small-stat"><span>${esc(team.name)}</span><span><select class="search-input" style="max-width:175px" id="div42-${esc(team.id)}" aria-label="Assigned division">${opts}</select>${btn('Assign',`data-u42="team-division" data-id42="${esc(team.id)}"`,'outline')}</span></div>`;}).join('')+
  '</div>';}).join('')+
  (subs.length&&S.ips.some(i=>owned.some(c=>c.id===i.ownerId))?btn('License group IP','data-u42="group-license"','outline'):'')
 );
 const inst=E.institutionsReport(S);const instPanel=panel('Bank, talent agencies and regional regulator',
  brief42('Automated bank',esc(inst.names.bank))+brief42('Talent institutions',esc(inst.names.agency))+brief42('Fictional regulator',esc(inst.names.regulator))+
  `<p class="panel-sub">${esc(inst.paperwork)} Contracts need real bilateral consent; rival cash is always limited.</p>`);
 return rivalsPanel+assetPanel+groupPanel+instPanel;
}