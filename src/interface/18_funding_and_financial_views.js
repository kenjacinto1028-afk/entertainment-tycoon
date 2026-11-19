
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
function depthPanelD2(){const cur=S.settings.depth||CFG.depth.DEFAULT;return panel('Game depth',`<p class="panel-sub" style="margin-bottom:12px">Changes how many decisions the game asks of you. You can switch at any time; your company and money are not affected.</p>${Object.keys(CFG.depth.LABELS).map(m=>{const L=CFG.depth.LABELS[m];return `<div class="small-stat"><span><strong>${esc(L.name)}</strong>${m===cur?' '+badge('Current','active'):''}<small class="item-sub">${esc(L.blurb)}</small></span><span>${m===cur?'':btn('Switch to '+esc(L.name),`data-depth-switch="${m}" aria-label="Switch game depth to ${esc(L.name)}"`,'outline')}</span></div>`}).join('')}${cur==='simple'&&CFG.depth.HIDE.heirNoteSimple?`<p class="panel-sub" style="margin-top:12px">${esc(CFG.depth.HIDE.heirNoteSimple)}</p>`:''}`);}
renderSettings=function(){return baseRenderSettings43()+depthPanelD2()+managementPanel43()+onboardingPanel43();};
const baseRenderSavesPlaytime=renderSaves;renderSaves=function(){return baseRenderSavesPlaytime()+playtimePanel();};
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

// Release History pages: industry (view 'history') and player company (view 'chistory'). Read-only; the engine does the filtering, sorting and paging (E.releaseHistory).
const histState={history:{},chistory:{}};
const TIER_LABEL={hit:'Hit',smash:'Smash',legendary:'Legendary'};
function renderReleaseHistory(v){const scope=v==='chistory'?'player':'industry',st=histState[v],q=E.releaseHistory(S,{scope,...st,page:st.page,pageSize:CFG.display_limits.HISTORY_PAGE.defaultSize}),L=q.lists,o=(val,label,cur)=>`<option value="${esc(val)}"${String(cur??'all')===String(val)?' selected':''}>${esc(label)}</option>`;
 const yrs=['',...L.years],tiers=[['all','All titles'],['any','Any Hit or better'],['hit','Hit'],['smash','Smash'],['legendary','Legendary']];
 const sorts=[['year','Year'],['title','Title'],['company','Company'],['quality','Quality'],['critic','Critic score'],['sales','Sales'],...(scope==='player'?[['revenue','Revenue'],['profit','Profit']]:[])];
 const fld=(label,id,inner)=>`<div class="form-field"><label for="hist-${id}">${label}</label>${inner}</div>`,sel=(id,inner)=>`<select id="hist-${id}" data-hist="${id}" data-hview="${v}">${inner}</select>`;
 const head=pageHeader(scope==='player'?'Company records':'Industry records',scope==='player'?'Company History':'Industry History',scope==='player'?'Every title your company has released, with results. Revenue and profit are your own books.':'Every title released by every company. Rival revenue is private, so rivals show public results only (sales, scores, reception). Pre-game historical titles have no recorded results.');
 const sm=q.summary,summary=`<div class="metrics" style="margin-bottom:14px"><div class="metric"><div class="metric-top">Titles</div><div class="metric-value">${sm.total}</div></div><div class="metric"><div class="metric-top">Hit or better</div><div class="metric-value">${sm.hits}</div><div class="metric-sub">${sm.legendary} Legendary</div></div>${scope==='player'?`<div class="metric"><div class="metric-top">Total revenue</div><div class="metric-value">${fmt(sm.revenue)}</div></div>`:''}<div class="metric"><div class="metric-top">Top-rated title</div><div class="metric-value" style="font-size:16px;white-space:normal">${esc(sm.best||'—')}</div></div></div>`;
 const filters=`<div class="form-grid" style="margin-bottom:14px">${fld('SEARCH TITLE','q',`<input class="search-input" id="hist-q" data-hist="query" data-hview="${v}" value="${esc(st.query||'')}" placeholder="Title..." aria-label="Search title">`)}`+
  (scope==='industry'?fld('COMPANY','c',sel('companyId',o('all','All companies',st.companyId)+L.companies.map(c=>o(c.id,c.name,st.companyId)).join(''))):'')+
  fld('MEDIUM','s',sel('sector',o('all','All media',st.sector)+L.sectors.map(x=>o(x,sectorName(x),st.sector)).join('')))+
  fld('GENRE','g',sel('genre',o('all','All genres',st.genre)+L.genres.map(x=>o(x,x,st.genre)).join('')))+
  fld('FROM YEAR','yf',sel('yearFrom',yrs.map(y=>o(y,y===''?'Any':'Year '+y,st.yearFrom??'')).join('')))+
  fld('TO YEAR','yt',sel('yearTo',yrs.map(y=>o(y,y===''?'Any':'Year '+y,st.yearTo??'')).join('')))+
  fld('LEVEL','t',sel('tier',tiers.map(t=>o(t[0],t[1],st.tier)).join('')))+
  fld('SORT BY','so',sel('sort',sorts.map(x=>o(x[0],x[1],st.sort||'year')).join('')))+
  fld('ORDER','d',sel('dir',o('desc','High to low / newest first',st.dir||'desc')+o('asc','Low to high / oldest first',st.dir||'desc')))+`</div>`;
 const n=x=>x==null?'—':x,cell=(lab,val)=>`<td data-label="${lab}">${val}</td>`;
 const rows=q.rows.map(r=>`<tr>${cell('Title',`<span class="item-name">${esc(r.title)}${r.contract?' <span class="item-sub" style="display:inline">(client job)</span>':''}</span><span class="item-sub">${esc(r.company)}${r.mine&&scope==='industry'?' · you':''}</span>`)}${cell('Year',r.year<=0?'Pre-game '+r.year:r.year)}${cell('Medium',esc(sectorName(r.sector))+(r.format?'<span class="item-sub">'+esc(r.format)+'</span>':''))}${cell('Genre',esc(r.genre||'—'))}${cell('Quality / critics / audience',r.historic?'Not recorded':n(r.quality)+' / '+n(r.critic)+' / '+n(r.audience))}${cell('Sales',r.historic?'Not recorded':fmt(r.sales))}${scope==='player'?cell('Revenue / profit',fmt(r.revenue)+' / '+fmt(r.profit)):''}${cell('Result',esc(r.reception||'—')+(r.tier?` <span class="status active">${TIER_LABEL[r.tier]}</span>`:''))}</tr>`).join('');
 const table=q.total?`<section class="panel"><table class="list-table hist-table"><thead><tr><th>Title</th><th>Year</th><th>Medium</th><th>Genre</th><th>Quality / critics / audience</th><th>Sales</th>${scope==='player'?'<th>Revenue / profit</th>':''}<th>Result</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="hist-pager"><button type="button" class="btn btn-outline btn-mini" data-hpage="${q.page-1}" data-hview="${v}"${q.page<=1?' disabled':''}>Previous</button><span aria-live="polite">Page ${q.page} of ${q.pages} · ${q.total} titles</span><button type="button" class="btn btn-outline btn-mini" data-hpage="${q.page+1}" data-hview="${v}"${q.page>=q.pages?' disabled':''}>Next</button></div></section>`:`<div class="empty"><strong>No titles match</strong>${scope==='player'?'Release a title, or loosen the filters.':'Loosen the filters.'}</div>`;
 st.page=q.page;return head+summary+filters+table;}
document.addEventListener('change',event=>{const t=event.target,v=t.dataset&&t.dataset.hview;if(!v||!t.dataset.hist||!S)return;const st=histState[v];st[t.dataset.hist]=t.value;st.page=1;render();const el=document.getElementById(t.id);if(el)el.focus();});
document.addEventListener('click',event=>{const b=event.target.closest('button[data-hpage]');if(!b||!S)return;histState[b.dataset.hview].page=Number(b.dataset.hpage);render();window.scrollTo(0,0);});

// Hall of Fame (view 'legends'): top titles, creators and franchises. Read-only from E.hallOfFame.
const hofState={};
function renderHallOfFame(){const st=hofState,q=E.hallOfFame(S,{...st,pageSize:10}),L=q.lists,pid=E.player(S).id,o=(val,label,cur)=>`<option value="${esc(val)}"${String(cur??'all')===String(val)?' selected':''}>${esc(label)}</option>`;
 const fld=(label,id,inner)=>`<div class="form-field"><label for="hof-${id}">${label}</label><select id="hof-${id}" data-hof="${id}">${inner}</select></div>`;
 const head=pageHeader('Legends','Hall of Fame','The industry\'s greatest titles, creators and franchises, across every company. Titles are ranked by how many times they earned back their cost. Rival money stays private; ranking uses public results.');
 const filters=`<div class="form-grid" style="margin-bottom:14px">`+fld('MEDIUM','s',o('all','All media',st.sector)+L.sectors.map(x=>o(x,sectorName(x),st.sector)).join(''))+fld('GENRE','g',o('all','All genres',st.genre)+L.genres.map(x=>o(x,x,st.genre)).join(''))+fld('COMPANY','c',o('all','All companies',st.companyId)+L.companies.map(c=>o(c.id,c.name,st.companyId)).join(''))+fld('LEVEL','t',[['any','Any Hit or better'],['hit','Hit'],['smash','Smash'],['legendary','Legendary']].map(t=>o(t[0],t[1],st.tier||'any')).join(''))+`</div>`;
 const cell=(lab,val)=>`<td data-label="${lab}">${val}</td>`,you=id=>id===pid||E.company(S,id)?.parentId===pid?' · you':'';
 const trows=q.titles.map((r,i)=>`<tr>${cell('Rank',(q.page-1)*q.pageSize+i+1)}${cell('Title',`<span class="item-name">${esc(r.title)}</span><span class="item-sub">${esc(r.company)}${you(r.companyId)}</span>`)}${cell('Year',r.year)}${cell('Medium',esc(sectorName(r.sector))+(r.genre?'<span class="item-sub">'+esc(r.genre)+'</span>':''))}${cell('Earned back',r.multiple+'x')}${cell('Level',`<span class="status active">${TIER_LABEL[r.tier]}</span>`)}</tr>`).join('');
 const titles=q.total?`<section class="panel"><h3>Top titles</h3><table class="list-table hist-table"><thead><tr><th>Rank</th><th>Title</th><th>Year</th><th>Medium</th><th>Earned back</th><th>Level</th></tr></thead><tbody>${trows}</tbody></table><div class="hist-pager"><button type="button" class="btn btn-outline btn-mini" data-hofpage="${q.page-1}"${q.page<=1?' disabled':''}>Previous</button><span aria-live="polite">Page ${q.page} of ${q.pages} · ${q.total} titles</span><button type="button" class="btn btn-outline btn-mini" data-hofpage="${q.page+1}"${q.page>=q.pages?' disabled':''}>Next</button></div></section>`:`<div class="empty"><strong>No legends yet</strong>A title needs to earn back 6x its cost to be a Hit. Loosen the filters or keep releasing.</div>`;
 const crows=q.creators.map((c,i)=>`<tr>${cell('Rank',i+1)}${cell('Creator',`<span class="item-name">${esc(c.name)}</span><span class="item-sub">${esc(c.company)}${you(c.companyId)}</span>`)}${cell('Best title',esc(c.best))}${cell('Hits',c.hits)}${cell('Awards',c.awards)}${cell('Points',c.points)}</tr>`).join('');
 const creators=`<section class="panel"><h3>Top creators</h3>${q.creators.length?`<table class="list-table hist-table"><thead><tr><th>Rank</th><th>Creator</th><th>Best title</th><th>Hits</th><th>Awards</th><th>Points</th></tr></thead><tbody>${crows}</tbody></table><p class="item-sub">Points: Hit 1, Smash 2, Legendary 4, yearly award 2. Titles with no named creator are not counted.</p>`:'<p class="item-sub">No credited creators with a Hit yet.</p>'}</section>`;
 const frows=(q.franchises||[]).map((f,i)=>`<tr>${cell('Rank',i+1)}${cell('Franchise',`<span class="item-name">${esc(f.name)}</span><span class="item-sub">${esc(f.company)}${you(f.companyId)}</span>`)}${cell('Releases',f.releases)}${cell('Hits',f.hits)}${cell('Awards',f.awards)}${cell('Legacy score',f.points)}</tr>`).join('');
 const fr=q.franchises?`<section class="panel"><h3>Top franchises</h3>${q.franchises.length?`<table class="list-table hist-table"><thead><tr><th>Rank</th><th>Franchise</th><th>Releases</th><th>Hits</th><th>Awards</th><th>Legacy score</th></tr></thead><tbody>${frows}</tbody></table><p class="item-sub">Legacy score: title points plus a small bonus for every extra release.</p>`:'<p class="item-sub">No franchise has a Hit yet.</p>'}</section>`:'';
 return head+filters+titles+creators+fr;}
document.addEventListener('change',event=>{const t=event.target,k=t.dataset&&t.dataset.hof;if(!k||!S)return;hofState[{s:'sector',g:'genre',c:'companyId',t:'tier'}[k]]=t.value;hofState.page=1;render();const el=document.getElementById(t.id);if(el)el.focus();});
document.addEventListener('click',event=>{const b=event.target.closest('button[data-hofpage]');if(!b||!S)return;hofState.page=Number(b.dataset.hofpage);render();window.scrollTo(0,0);});

// M1: phone polish. On phones, tall read-only panels fold behind "Show more" and plain tables stack as cards.
(function(){const prev=render;
 render=function(){const r=prev.apply(this,arguments);
  if(window.innerWidth>600)return r;
  document.querySelectorAll('#content table.list-table:not(.hist-table)').forEach(t=>{if(t.querySelector('[colspan],[rowspan]'))return;const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());if(!h.length)return;t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{if(h[i])td.setAttribute('data-label',h[i]);}));t.classList.add('m1-stack');});
  document.querySelectorAll('#content .panel').forEach(p=>{if(p.dataset.m1||p.querySelector('form,input,select,textarea'))return;if(p.scrollHeight<=720)return;p.dataset.m1='1';p.classList.add('m1-collapsed');p.insertAdjacentHTML('beforeend','<button type="button" class="btn btn-outline m1-more" aria-expanded="false">Show more</button>');});
  return r;};
 document.addEventListener('click',e=>{const b=e.target.closest('.m1-more');if(!b)return;const p=b.closest('.panel'),open=!p.classList.toggle('m1-collapsed');b.textContent=open?'Show less':'Show more';b.setAttribute('aria-expanded',String(open));});
})();
