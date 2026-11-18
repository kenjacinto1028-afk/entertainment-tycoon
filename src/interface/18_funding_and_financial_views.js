
function gameFunding43(){if(industry!=='games'||!E.available('games',S.week))return '';
 const jobs=activeMine().filter(p=>p.sector==='games'&&p.route!=='contract'&&!p.gamePublisherDeal43),publishers=S.companies.filter(c=>!c.isPlayer&&!c.parentId&&!c.bankrupt&&c.capabilities.games);
 const deals=(S.gamePublisherDeals43||[]).filter(d=>d.studioId===S.playerId).slice(-CFG.tuning_ui.deals__001).reverse();
 return panel('Independent game publishing · funded advances',
 `<p class="panel-sub">Outside publisher cash is transferred as an unearned advance, then recognized only when the game releases. External sales produce a contracted share and actual settlements; the game IP is not sold.</p>`+
 (jobs.length&&publishers.length?`<form id="publisher43-form"><div class="form-grid"><div class="form-field"><label>ACTIVE GAME</label><select name="projectId">${jobs.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('')}</select></div><div class="form-field"><label>FUNDED PUBLISHER</label><select name="publisherId">${publishers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div></div><button type="submit" class="btn btn-outline">Review and sign funded deal</button></form>`:'<p class="panel-sub">Start an original game and find an independent, funded game publisher to negotiate.</p>')+
 deals.map(d=>`<div class="small-stat"><span>${esc(S.projects.find(p=>p.id===d.projectId)?.title||d.projectId)} · ${esc(d.status)} · advance ${fmt(d.advance)}</span><strong>Publisher share paid ${fmt(d.royaltyPaid)} / payable ${fmt(d.royaltyOpen)}</strong></div>`).join(''));
}
function technologyTrades43(){const targets=S.companies.filter(c=>c.id!==S.playerId&&!c.parentId&&!c.bankrupt&&c.research&&Object.entries(c.research).some(([k,t])=>E.available(k,S.week)&&t.level>=1&&E.player(S).capabilities[k]));
 const trade=(S.technologyTrades43||[]).slice(-CFG.tuning_ui.trade__001);
 return panel('Buy rival R&D · real technology transfer',
 `<p class="panel-sub">Acquiring technology costs actual cash and transfers existing company-funded know-how. This cannot create a world technology wave early or transfer third-party creative IP.</p>`+
 (targets.slice(0,CFG.tuning_ui.technologyTrades43__001).map(c=>Object.entries(c.research).filter(([k,t])=>E.available(k,S.week)&&t.level>=1&&E.player(S).capabilities[k]).map(([k,t])=>`<div class="small-stat"><span>${esc(c.name)} · ${esc(sectorName(k))} wave ${t.wave} level ${t.level}</span>${btn('Request R&D offer',`data-u43="tech-offer" data-id43="${esc(c.id)}" data-sector43="${esc(k)}"`,'outline')}</div>`).join('')).join('')||'<p class="item-sub">Rivals will develop funded proprietary technology over time; none is currently offered.</p>')+
 trade.map(t=>`<p class="item-sub">${weekLabel(t.week)} · ${esc(E.company(S,t.sellerId)?.name||'Seller')} · ${esc(sectorName(t.sector))} level ${t.level}, purchased ${fmt(t.price)}</p>`).join(''));
}
const baseRenderSettings43=renderSettings,baseRenderDashboard43=renderDashboard,baseRenderWorld43=renderWorld,baseRenderLibrary43=renderLibrary,baseRenderProductions43=renderProductions,baseRenderTeams43=renderTeams,baseCareer43=careerPanel;
// D2 — Game depth switch (UI only; engine setDepth does the work).
function depthPanelD2(){const cur=S.settings.depth||CFG.depth.DEFAULT;return panel('Game depth',`<p class="panel-sub" style="margin-bottom:12px">Changes how many decisions the game asks of you. You can switch at any time; your company and money are not affected.</p>${Object.keys(CFG.depth.LABELS).map(m=>{const L=CFG.depth.LABELS[m];return `<div class="small-stat"><span><strong>${esc(L.name)}</strong>${m===cur?' '+badge('Current','active'):''}<small class="item-sub">${esc(L.blurb)}</small></span><span>${m===cur?'':btn('Switch to '+esc(L.name),`data-depth-switch="${m}" aria-label="Switch game depth to ${esc(L.name)}"`,'outline')}</span></div>`}).join('')}`);}
renderSettings=function(){return baseRenderSettings43()+depthPanelD2()+managementPanel43()+onboardingPanel43();};
renderDashboard=function(){const counsel=E.adviser43(S);return baseRenderDashboard43()+onboardingPanel43()+erasPanel43();};
renderWorld=function(){return baseRenderWorld43()+erasPanel43()+eventArchive43()+technologyTrades43();};
renderLibrary=function(){return baseRenderLibrary43()+rightsPackagePanel43();};
renderProductions=function(){return baseRenderProductions43()+projectsDepth43()+gameFunding43();};
renderTeams=function(){return baseRenderTeams43()+teamDepth43();};
careerPanel=function(){return baseCareer43()+panel('Founder identity · retained through generations',`<div class="ss-identity43">${portrait43(S.founder.id,CFG.tuning_ui.topLevel__001)}<div><h3>${esc(S.founder.name)}</h3><p class="panel-sub">Portrait appearance remains stable across save/load. An executive transition never changes share or IP ownership by itself.</p></div></div>`);};
const baseRender43=render;
render=function(){if(S&&['dashboard','productions','library','finance','world','settings'].includes(view))E.visitTutorial43(S,view);return baseRender43();};
// D4: in Simple, "Advance to next decision" is the main (highlighted) button and the week buttons are secondary.
const baseRender43D4=render;
render=function(){if(S&&depthHide45('nav',view))view='dashboard';document.querySelectorAll('#main-nav [data-view],#secondary-nav [data-view]').forEach(b=>{b.hidden=!!S&&depthHide45('nav',b.dataset.view);});const r=baseRender43D4();const simple=S&&(S.settings.depth||CFG.depth.DEFAULT)==='simple',b=document.getElementById('advance-decision');
 if(b){b.classList.toggle('btn-primary',!!simple);b.classList.toggle('btn-outline',!simple);document.querySelectorAll('.turn-actions [data-advance]').forEach(x=>{x.classList.remove('btn-primary');x.classList.add('btn-outline');});
  if(!simple){const w=document.querySelector('.turn-actions [data-advance="13"]');if(w){w.classList.remove('btn-outline');w.classList.add('btn-primary');}}}
 return r;};
// Form and action handlers are local. They call engine safeguards and save.
document.addEventListener('click',event=>{const b=event.target.closest('button[data-u43]');if(!b)return;const action=b.dataset.u43,id=b.dataset.id43;
 if(action==='jump'){view=b.dataset.next43||'dashboard';render();remember();return;}
 if(action==='begin-tutorial'){safe(()=>{E.beginTutorial43(S);view='dashboard';notify('Guidance started. You can stop any time.');});return;}
 if(action==='end-tutorial'){safe(()=>{E.endTutorial43(S);notify('Optional guidance ended.');});return;}
 if(action==='goal'){safe(()=>{E.chooseObjective43(S,id,b.dataset.enable43==='true');notify('Optional goal updated.');});return;}
 if(action==='team-toggle'){safe(()=>{const cfg=E.managementStatus43(S),mode=cfg.teamModes[id]==='delegated'?'guided':'delegated';E.setManagement43(S,{scope:'team',id,mode});notify('Team control changed: '+mode);});return;}
 if(action==='project-toggle'){safe(()=>{const cfg=E.managementStatus43(S),mode=cfg.projectModes[id]==='delegated'?'guided':'delegated';E.setManagement43(S,{scope:'project',id,mode});notify('Production control changed: '+mode);});return;}
 if(action==='tech-offer'){safe(()=>{const o=E.technologyOffer43(S,id,b.dataset.sector43);if(!o.sellerConsent){notify('The independent owner declined to sell its funded research.');return;}if(!confirm('Acquire owned '+sectorName(o.sector)+' research for '+fmt(o.price)+'? The seller gives up this proprietary level.'))return;const r=E.acquireTechnology43(S,o.id);notify('Funded research transferred for '+fmt(r.price)+'.');});return;}
});
document.addEventListener('submit',event=>{const f=event.target;if(!['management43-form','rights43-form','publisher43-form'].includes(f.id))return;event.preventDefault();const d=Object.fromEntries(new FormData(f));
 if(f.id==='management43-form'){safe(()=>{E.setManagement43(S,{mode:d.mode,spendLimit:Number(d.cap)});notify('Corporate and project authority policy updated.');});return;}
 if(f.id==='rights43-form'){safe(()=>{
  const g=E.grantRightsPackage43(S,{ipId:d.ipId,holderId:d.holderId,media:d.media,territories:d.territory,weeks:Number(d.weeks),fee:Number(d.fee),royaltyRate:Number(d.royalty)/CFG.tuning_ui.g__001,parentGrantId:d.parentGrantId||null,
  exclusive:!!d.exclusive,sublicensable:!!d.sublicensable,approvalRequired:!!d.approvalRequired,continuationWeeks:Number(d.continuationWeeks)});
  notify('Rights package signed and paid: '+g.id+'.');});return;}
 if(f.id==='publisher43-form'){safe(()=>{
  const q=E.gamePublisherQuote43(S,d.projectId,d.publisherId);
  if(!q.willAccept)throw new Error('Publisher cannot fund this project or does not accept its quality/rights.');
  if(!confirm('Publisher will advance '+fmt(q.advance)+' of real cash and earn '+Math.round(q.share*CFG.tuning_ui.documentEvents__028)+'% of real external game receipts for 52 weeks after release. Sign?'))return;
  const deal=E.signGamePublisher43(S,d.projectId,d.publisherId);notify('Real cash advanced: '+fmt(deal.advance)+'.');});return;}
});

// Update 47 player-facing exceptions: client quality disputes and bank workouts.
// Routine jobs, taxes and monthly lender servicing remain fully delegated.
function fundedDisputes47(){
 const rows=S.projects.filter(p=>p.companyId===S.playerId&&p.route==='contract'&&p.status==='active'&&p.escrowId);
 return panel('Client delivery inspections · protected escrow',
 '<p class="panel-sub">Optional single inspection after substantive progress. A challenging client may hold the final protected tranche. Only consequential problems interrupt production; rework needs actual cash.</p>'+
 (rows.length?rows.map(p=>{const r=E.commissionDispute47(S,p.id),x=r.inspection,work=Math.round(p.weeksDone/Math.max(1,p.weeksTotal)*CFG.tuning_ui.work__001);
  const action=x?.status==='open'?btn('Fund rework',`data-u47="remedy" data-id47="${esc(p.id)}"`,'primary')+' '+btn('Cancel & refund',`data-u47="cancel" data-id47="${esc(p.id)}"`,'outline')+' '+btn('Neutral arbitration',`data-u47="arbitrate" data-id47="${esc(p.id)}"`,'outline'):
    (!x&&work>=CFG.tuning_ui.action__001&&work<CFG.tuning_ui.action__002?btn('Ask client for inspection',`data-u47="inspect" data-id47="${esc(p.id)}"`,'outline'):'' );
  return `<div class="small-stat" style="display:block"><strong>${esc(p.title)}</strong><p class="panel-sub">${work}% delivered · protected ${fmt(r.protected)} · ${esc(x?.status||'Uninspected')} · ${esc(x?.reason||'No required inspection')}</p>${action}</div>`;}).join(''):'<p class="panel-sub">No active funded client deliveries; this panel appears when you take contracted service work.</p>'));
}
function bankWorkouts47(){
 const rows=(S.loans||[]).filter(l=>l.debtorId===S.playerId&&l.status!=='paid');
 return panel('Lender crisis workout · real obligations',
 '<p class="panel-sub">A distressed borrower may request one bank-approved 24-month extension at a higher rate. Old unpaid interest survives, no debt is forgiven, and no new cash is created.</p>'+
 (rows.length?rows.map(l=>{const q=E.loanWorkoutQuote47(S,l.id);
 return `<div class="small-stat" style="display:block"><strong>Loan ${esc(l.id)} · ${esc(l.status)}</strong><p class="panel-sub">Principal ${fmt(q.outstandingPrincipal)} · overdue principal ${fmt(q.overduePrincipal)} · overdue interest ${fmt(q.overdueInterest)}</p><p class="item-sub">${esc(q.reason)}${l.workout47?' · Workout agreed Year '+E.yearAt(l.workout47.approvedWeek):''}</p>${q.approved?btn('Request 24-month bank workout',`data-u47="workout" data-id47="${esc(l.id)}"`,'primary'):''}</div>`;}).join(''):'<p class="panel-sub">No outstanding company bank loan.</p>'));
}
const originalRenderProductions47=renderProductions,originalRenderFinance47=renderFinance;
renderProductions=function(){return originalRenderProductions47()+fundedDisputes47();};
renderFinance=function(){return originalRenderFinance47()+bankWorkouts47();};// D6: 5-tab layout for Simple and Standard (tab map in config/depth.json TABS5). Very Complex keeps the left menu.
(function(){const prev=render,lastSub={};
 const modeOn=()=>!!S&&((S.settings&&S.settings.depth)||CFG.depth.DEFAULT)!=='veryComplex';
 const vis=t=>t.views.filter(v=>!depthHide45('nav',v));
 render=function(){
  const on=modeOn();document.body.classList.toggle('tabs5',on);
  const a=document.activeElement;let key=null;
  if(a&&a.dataset&&a.dataset.tab5)key='[data-tab5="'+a.dataset.tab5+'"]';else if(a&&a.closest&&a.closest('.subtabs5'))key='.subtabs5 [data-view="'+a.dataset.view+'"]';
  const r=prev.apply(this,arguments),nav=document.getElementById('tab5');if(!nav)return r;
  if(!on){nav.innerHTML='';return r;}
  const T=CFG.depth.TABS5,cur=T.tabs.find(t=>t.views.includes(view))||T.tabs[0];lastSub[cur.id]=view;
  const n=document.getElementById('inbox-count').textContent;
  nav.innerHTML=T.tabs.map(t=>`<button type="button" data-tab5="${t.id}"${t===cur?' class="active" aria-current="page"':''}><span class="nav-ico t5-ico" aria-hidden="true">${t.icon}</span><span>${esc(t.label)}</span>${t.id==='inbox'&&n&&n!=='0'?`<span class="nav-count" aria-label="${esc(n)} waiting">${esc(n)}</span>`:''}</button>`).join('');
  const vv=vis(cur);
  if(vv.length>1)document.getElementById('content').insertAdjacentHTML('afterbegin',`<div class="tabbar subtabs5" role="group" aria-label="${esc(cur.label)} sections">${vv.map(v=>`<button type="button" class="tab${v===view?' active':''}" data-view="${v}"${v===view?' aria-current="page"':''}>${esc(T.viewLabels[v]||v)}</button>`).join('')}</div>`);
  if(key){const el=document.querySelector(key);if(el)el.focus();}
  return r;};
 document.addEventListener('click',event=>{const b=event.target.closest('button[data-tab5]');if(!b||!S)return;
  const t=CFG.depth.TABS5.tabs.find(x=>x.id===b.dataset.tab5);if(!t)return;const v=vis(t);
  view=v.includes(lastSub[t.id])?lastSub[t.id]:(v[0]||'dashboard');render();remember();window.scrollTo(0,0);});
})();
