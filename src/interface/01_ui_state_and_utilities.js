
'use strict';
// Same shared data model as engine; UI does not own separate economy numbers.
const CFG = globalThis.StudioEngine.CONFIG;

const E=globalThis.StudioEngine;
if(!E)throw new Error('StudioEngine must load first.');
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>E.shortMoney(n||0);
const hireQuote=()=>Math.round(CFG.tuning_ui.hireQuote__001*({deliberate:CFG.tuning_ui.hireQuote__002,standard:1,accelerated:CFG.tuning_ui.hireQuote__003}[S?.settings?.capabilityPace]||1)*CFG.tuning_ui.hireQuote__004)/CFG.tuning_ui.hireQuote__005;
const signed=n=>(n<0?'-':'')+fmt(Math.abs(n));
const suffix=(n)=>Number(n||0).toLocaleString('en-US');
const caps=s=>s.charAt(0).toUpperCase()+s.slice(1);
const sectorName=key=>E.SECTORS[key]?.name||key;
const sectorLabel=key=>key==='tv'?'TV & Streaming':sectorName(key);
const weekLabel=w=>'Y'+E.yearAt(w)+' · W'+E.yearWeek(w);
const activeMine=()=>S.projects.filter(p=>p.companyId===S.playerId&&p.status==='active');
const releasedMine=()=>S.projects.filter(p=>p.companyId===S.playerId&&p.status==='released');
const ownIPs=()=>S.ips.filter(i=>i.ownerId===S.playerId);
const myAlerts=()=>S.inbox.filter(a=>a.open);
const myProjects=()=>S.projects.filter(p=>p.companyId===S.playerId);
const badge=(label,type='')=>`<span class="status ${type}">${esc(label)}</span>`;
const empty=(head,detail,icon='✦')=>`<div class="empty"><span class="empty-icon">${icon}</span><strong>${esc(head)}</strong>${esc(detail)}</div>`;
const pageHeader=(eyebrow,title,sub,buttons='')=>`<section class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div><div class="head-actions">${buttons}</div></section>`;
function depthHide45(kind,name){try{const m=S&&S.settings&&S.settings.depth||CFG.depth.DEFAULT,H=CFG.depth.HIDE;if(!H||m==='veryComplex')return false;if(kind==='nav')return (H.nav[m]||[]).includes(name);const l=m==='simple'?H.panels.standard.concat(H.panels.simpleExtra):H.panels.standard;return l.some(t=>String(name).startsWith(t));}catch(e){return false;}}
function depthFormHide(form){try{const m=S&&S.settings&&S.settings.depth||CFG.depth.DEFAULT,F=CFG.depth.HIDE&&CFG.depth.HIDE.forms&&CFG.depth.HIDE.forms[form];return m==='veryComplex'||!F?[]:(F[m]||[]);}catch(e){return [];}}
function hideFormFields(names){names.forEach(n=>{document.querySelectorAll('#modal [name="'+n+'"]').forEach(el=>{const f=el.closest('.form-field');if(f)f.style.display='none';});});}
const panel=(title,body,extra='',sub='')=>depthHide45('panel',title)?'':`<section class="panel"><div class="panel-header"><div><h2 class="panel-heading">${title}</h2>${sub?`<p class="panel-sub">${sub}</p>`:''}</div>${extra}</div>${body}</section>`;
const btn=(text,attrs='',type='outline')=>`<button type="button" class="btn btn-${type}" ${attrs}>${text}</button>`;
const timeTag=w=>`<time>${weekLabel(w)}</time>`;
let S,view='dashboard',industry='publishing',newsQuery='',newsKind='all',newsYear='all',rankType='finance',rankMetric='profit',rankSector='all',rankRegion='all',rankYear='all',projectSearch='',projectSort='latest',selectedProjectId=null,toastTimeout,initialized=false;
const AUTOSAVE='studio-syndicate-f1-autosave';
const RECOVERY='studio-syndicate-f1-autosave-recovery';
let lastTrustedAutosave=null;
const SLOT_PREFIX='studio-syndicate-f1-slot-',DB_POINTER50='@indexeddb-v50';
const durableStore50=globalThis.StudioPersistence50;
let pendingSave50=Promise.resolve(), queuedSaves50=0;
function remember(){try{
  const current=JSON.stringify(S),previous=localStorage.getItem(AUTOSAVE);
  // Tiny worlds and legacy saves retain synchronous compatibility. Large worlds use
  // durable IndexedDB, never three 25 MB localStorage slots beyond browser quota.
  if(current.length<CFG.tuning_ui.remember__001&&previous!==DB_POINTER50&&queuedSaves50===0){
   if(previous){try{if(previous!==lastTrustedAutosave)E.loadState(previous);localStorage.setItem(RECOVERY,previous);}catch(_) {/* Keep valid recovery. */}}
   localStorage.setItem(AUTOSAVE,current);lastTrustedAutosave=current;return;
  }
  queuedSaves50++;
  pendingSave50=pendingSave50.catch(()=>{}).then(async()=>{
   if(!durableStore50)throw new Error('Durable browser storage unavailable');
   const former=localStorage.getItem(AUTOSAVE),legacy=former&&former!==DB_POINTER50?former:null;
   await durableStore50.saveAutosave(current,legacy);
   localStorage.setItem(AUTOSAVE,DB_POINTER50);lastTrustedAutosave=DB_POINTER50;
   try{localStorage.removeItem(RECOVERY);}catch(_){}
  }).catch(e=>notify('Autosave could not be stored. Export a JSON backup. '+e.message,'error')).finally(()=>{queuedSaves50--;});
 }catch(e){notify('Could not autosave. Please export a backup.','error');}}
window.addEventListener('beforeunload',event=>{if(queuedSaves50>0){event.preventDefault();event.returnValue='';}});
function notify(text,kind='ok'){const n=$('toast');const isError=kind==='error';n.setAttribute('role',isError?'alert':'status');n.setAttribute('aria-live',isError?'assertive':'polite');n.setAttribute('aria-atomic','true');n.textContent=text;n.className='toast visible'+(isError?' error':'');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>n.className='toast',CFG.tuning_ui.notify__001);}
function safe(fn){try{fn();remember();render();}catch(error){notify(error.message||String(error),'error');}}
function render(){if(!S)return;const c=E.player(S),f=c.finance;
  $('top-company').textContent=c.name;$('top-subtitle').textContent=c.origin;$('company-avatar').textContent=c.name[0].toUpperCase();$('top-date').textContent='YEAR '+E.yearAt(S.week)+' · WEEK '+E.yearWeek(S.week);$('top-cash').textContent=fmt(f.cash);$('top-cash').classList.toggle('negative',f.cash<CFG.tuning_ui.render__001);$('inbox-count').textContent=myAlerts().length;
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  let html;switch(view){case 'productions':html=renderProductions();break;case 'library':html=renderLibrary();break;case 'teams':html=renderTeams();break;case 'finance':html=renderFinance();break;case 'career':html=careerPanel();break;case 'world':html=renderWorld();break;case 'inbox':html=renderInbox();break;case 'news':html=renderNews();break;case 'history':case 'chistory':html=renderReleaseHistory(view);break;case 'legends':html=renderHallOfFame();break;case 'settings':html=renderSettings();break;default:html=renderDashboard();}
  $('content').innerHTML=html;
  labelControls50($('content'));
  document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
}
function projectRows(items,compact=false){if(!items.length)return empty('No productions yet','Greenlight a project to begin building your studio.','▣');
  return `<div style="overflow-x:auto"><table class="list-table"><thead><tr><th>Production</th><th>Status</th><th>${compact?'Schedule':'Investment'}</th><th>${compact?'Progress':'Direct result'}</th></tr></thead><tbody>${items.map(p=>`<tr><td><span class="item-name">${esc(p.title)}</span><span class="item-sub">${esc(p.genre)} · ${esc(sectorName(p.sector))} · ${esc(p.format)}${p.reception?' · Reception: '+esc(p.reception.label):''}</span><span class="item-sub">${p.teamId?'Team: '+esc(E.company(S,p.companyId)?.teams?.find(t=>t.id===p.teamId)?.name||'Historical team'):'Legacy production'}${p.clientId?' · Client: '+esc(E.company(S,p.clientId)?.name||'Unknown'):''}</span>${p.pitch?`<span class="item-sub">${esc(p.pitch.theme)} · ${esc(p.pitch.targetAudience)} audience · ${esc(p.pitch.direction)} creative · ${esc(p.pitch.positioning)} positioning</span>`:''}${p.phase?`<span class="item-sub">Milestone: ${esc(p.phase)}${p.creativeQuality!==null&&p.technicalQuality!==null?' · Creative / technical '+p.creativeQuality+' / '+p.technicalQuality:''}</span>`:''}${p.criticScore!==null&&p.criticScore!==undefined?`<span class="item-sub">Critics ${p.criticScore}/100 · Audience ${p.audienceScore}/100</span>`:''}${p.printStock?`<span class="item-sub">Print stock: ${p.printStock.stock.toLocaleString()} copies · ${fmt(p.printStock.stock*p.printStock.unitCost)} asset · ${p.printStock.sold.toLocaleString()} sold · ${p.printStock.returned} returned · ${p.printStock.writtenOff} written off</span><button class="btn btn-outline btn-mini" data-print-order="${esc(p.id)}">Manage copies</button> <button class="btn btn-outline btn-mini" data-print-policy="${esc(p.id)}" data-enabled="${p.printStock.autoReprint?'false':'true'}">${p.printStock.autoReprint?'Auto-reprint: On':'Auto-reprint: Off'}</button>`:''}${p.review?`<button class="btn btn-outline btn-mini review-button" data-review="${esc(p.id)}">13-week review</button>`:''}<button class="btn btn-outline btn-mini" data-project-detail="${esc(p.id)}">Details</button>${p.status==='active'&&p.companyId===S.playerId?`<button class="btn btn-outline btn-mini" data-cancel-project="${esc(p.id)}">Cancel work</button>`:''}</td><td>${badge(p.status==='active'?'In production':p.status==='cancelled'?'Cancelled':'Released',p.status==='active'?'active':p.status==='cancelled'?'warning':'release')}</td><td>${compact?`${Math.ceil(Math.max(0,p.weeksTotal-p.weeksDone))} work units left`:`${fmt(p.directCost)} spent`}</td><td>${compact?`<div class="progress" title="${p.weeksDone}/${p.weeksTotal} weeks"><i style="width:${Math.round(p.weeksDone/p.weeksTotal*CFG.tuning_ui.projectRows__001)}%"></i></div>`:`<strong class="${E.currentProjectProfit(p)<0?'negative':'positive'}">${signed(E.currentProjectProfit(p))}</strong><span class="item-sub">Budget: ${fmt(E.projectBudget(S,p.id).plannedTotal)} · Forecast total: ${E.projectBudget(S,p.id).historyComplete?fmt(E.projectBudget(S,p.id).estimatedTotal):'History unavailable'}</span><span class="item-sub">Cost variance: ${E.projectBudget(S,p.id).historyComplete?signed(E.projectBudget(S,p.id).projectedVariance):'History unavailable'} ${p.status==='released'?'actual':'estimated'} · Shared overhead: ${fmt(E.productionFinancial(S,p.id).allocatedOverhead)}${p.overheadHistoryComplete?'':' · recent only'}</span>`}</td></tr>`).join('')}</tbody></table></div>`;}
function feed(news,count=CFG.tuning_ui.feed__001){const list=news.slice(0,count);return list.length?list.map(n=>`<div class="feed-item"><span class="feed-dot"></span><div style="flex:1;min-width:0"><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p></div>${timeTag(n.week)}</div>`).join(''):empty('Quiet newsdesk','Industry events will appear as the world progresses.');}
function alertRows(items,count=CFG.tuning_ui.alertRows__001){const list=items.slice(0,count);return list.length?list.map(a=>`<div class="inbox-item"><span class="flag">${a.kind==='critical'?'!':'✦'}</span><div style="flex:1"><h3>${esc(a.title)} ${a.kind==='critical'?badge('Needs attention','warning'):badge('Information')}</h3><p>${esc(a.body)}</p>${a.boardBlock&&a.boardBlock.status==='open'?`<button class="btn btn-primary btn-mini" data-board-block="${esc(a.id)}" data-override="true">Override (−${a.boardBlock.cost} Board Reputation)</button> <button class="btn btn-outline btn-mini" data-board-block="${esc(a.id)}" data-override="false">Accept block</button>`:a.boardPressure==='open'?`<button class="btn btn-primary btn-mini" data-board-pressure="${esc(a.id)}" data-choice="dividend">Pay goodwill dividend</button> <button class="btn btn-outline btn-mini" data-board-pressure="${esc(a.id)}" data-choice="promise">Promise results</button>`:`<button class="btn btn-outline btn-mini" data-dismiss="${esc(a.id)}">Mark reviewed</button>`}</div></div>`).join(''):empty('All clear','No decisions require your attention right now.','✓');}
function metric(title,value,sub,ico='◈',kind=''){return `<div class="metric"><div class="metric-top"><span>${title}</span><span class="metric-icon">${ico}</span></div><div class="metric-value ${kind}">${value}</div><div class="metric-sub">${sub}</div></div>`;}