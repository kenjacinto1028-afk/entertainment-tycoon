
// GUIDE — guided first-year tutorial and the "?" Help button (texts in config/onboarding.json GUIDE).
// UI only: reads real game state to tick steps off and never changes the save or the simulation.
// Progress is remembered per campaign in browser storage; losing it only means the tour restarts.
(function(){
 const G=CFG.onboarding.GUIDE;if(!G)return;
 let memory={};
 const load=()=>{try{const raw=localStorage.getItem(G.storageKey);if(raw)memory=JSON.parse(raw)||{};}catch(_){}return memory;};
 const store=()=>{try{localStorage.setItem(G.storageKey,JSON.stringify(memory));}catch(_){}};
 load();
 const campaignKey=()=>S?[S.seed,S.founder&&S.founder.id,S.startedYear,S.playerId].join('|'):null;
 const state=()=>{const k=campaignKey();if(!k)return null;return memory[k]||null;};
 const mode=()=>(S&&S.settings&&S.settings.depth)||CFG.depth.DEFAULT;
 const stepText=st=>st[mode()]||st.text;
 const CHECKS={
  ack:(g,st)=>g.acked.includes(st.key),
  firstProject:()=>myProjects().length>=1,
  advanced:g=>S.week>g.startWeek,
  seenInbox:g=>g.seen.includes('inbox'),
  firstRelease:()=>releasedMine().length>=1,
  twoProjects:()=>myProjects().length>=2,
  seenFinance:g=>g.seen.includes('finance'),
  seenWorld:g=>g.seen.includes('world'),
  goalPicked:()=>!!(S.objectives43&&S.objectives43.selected&&S.objectives43.selected.length)
 };
 const isDone=(g,st)=>{try{return !!(CHECKS[st.check]||CHECKS.ack)(g,st);}catch(_){return false;}};
 const currentIndex=g=>{const i=G.steps.findIndex(st=>!isDone(g,st));return i<0?G.steps.length:i;};
 function startGuide(){if(!S)return;const k=campaignKey();load();
  memory[k]={on:true,done:false,min:false,startWeek:S.week,seen:[],acked:[]};store();view='dashboard';render();}
 function stopGuide(done){const g=state();if(!g)return;g.on=false;g.done=!!done;store();clearGlow();drawCard();}
 function clearGlow(){document.querySelectorAll('.guide-glow').forEach(el=>el.classList.remove('guide-glow'));}
 function glow(targets){clearGlow();for(const sel of targets||[]){const el=[...document.querySelectorAll(sel)].find(x=>x.offsetParent!==null||x.getClientRects().length);if(el){el.classList.add('guide-glow');return;}}}
 function newCard(){const card=document.createElement('aside');card.id='guide-card';card.className='guide-card';card.setAttribute('role','region');card.setAttribute('aria-label','Tutorial');document.body.appendChild(card);return card;}
 function drawCard(){let card=$('guide-card');const g=state();
  if(S&&g&&g.offer&&!g.on){if(!card)card=newCard();card.classList.remove('guide-min');clearGlow();
   card.innerHTML=`<div class="guide-top"><span class="guide-count">TUTORIAL</span></div><h3>${esc(G.offerTitle)}</h3><p>${esc(G.offerText)}</p><div class="guide-actions">${btn('Yes, guide me','data-guide="start"','primary btn-mini')}${btn('No thanks','data-guide="decline"','outline btn-mini')}</div>`;return;}
  if(!S||!g||!g.on){if(card)card.remove();clearGlow();return;}
  const i=currentIndex(g);
  if(i>=G.steps.length){g.on=false;g.done=true;store();if(card)card.remove();clearGlow();notify('Tutorial complete. Press ? Help any time.');return;}
  const st=G.steps[i];
  if(!card)card=newCard();
  card.classList.toggle('guide-min',!!g.min);
  const goThere=st.view&&view!==st.view?btn('Take me there',`data-guide="goto" data-guide-view="${esc(st.view)}"`,'outline btn-mini'):'';
  card.innerHTML=g.min?`<button type="button" class="guide-pill" data-guide="expand" aria-label="Show tutorial step ${i+1} of ${G.steps.length}">Tutorial ${i+1}/${G.steps.length} ▴</button>`:
   `<div class="guide-top"><span class="guide-count">TUTORIAL · STEP ${i+1} OF ${G.steps.length}</span><button type="button" class="guide-x" data-guide="minimize" aria-label="Hide tutorial card">▾</button></div>`+
   `<div class="guide-bar"><i style="width:${Math.round(i/G.steps.length*100)}%"></i></div>`+
   `<h3>${esc(st.title)}</h3><p>${esc(stepText(st))}</p>`+
   `<div class="guide-actions">${st.check==='ack'?btn(i===G.steps.length-1?'Finish':'Got it',`data-guide="ack" data-guide-key="${esc(st.key)}"`,'primary btn-mini'):'<span class="guide-wait">Ticks off when you do it</span>'}${goThere}${btn('Stop tutorial','data-guide="stop"','outline btn-mini')}</div>`;
  if(g.min)clearGlow();else glow(st.targets);
 }
 // Track screens the player has opened and redraw the card after every screen update.
 const prevRender=render;
 render=function(){const r=prevRender.apply(this,arguments);
  try{const g=state();if(g&&g.on&&!g.seen.includes(view)){g.seen.push(view);store();}
   document.querySelectorAll('[data-u43="begin-tutorial"]').forEach(b=>{b.textContent='Start guided tutorial';});
   drawCard();}catch(_){}
  return r;};
 function helpModal(){
  const H=G.help,label=(CFG.depth.TABS5.viewLabels||{})[view]||view,g=state(),running=g&&g.on;
  showModal(`${modalHead('Help')}`+
   `<div class="section-note"><strong>${esc(label)}:</strong> ${esc(H.views[view]||H.views.dashboard)}</div>`+
   `<h3 class="guide-h">The basics</h3><ul class="guide-list">${H.basics.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`+
   `<p class="panel-sub">${esc(G.pdfNote)}</p>`+
   `<div class="modal-bottom"><p>${running?'The guided tutorial is running.':'New here? The guided tutorial walks you through your first year.'}</p>${btn(running?'Restart tutorial':'Start guided tutorial','data-guide="start"','primary')}</div>`);
 }
 // "?" Help button in the top bar, next to the theme toggle.
 const top=document.querySelector('.top-actions');
 if(top&&!$('guide-help-btn')){const b=document.createElement('button');b.type='button';b.id='guide-help-btn';b.className='theme-btn guide-help';b.textContent='?';b.title='Help and tutorial';b.setAttribute('aria-label','Help and tutorial');top.insertBefore(b,$('theme-toggle')||top.firstChild);}
 // Offer the tutorial right after a new studio is founded (capture phase: runs before the game swaps in the new studio).
 document.addEventListener('submit',event=>{const f=event.target;if(!f||f.id!=='new-game-form')return;const before=S;
  setTimeout(()=>{if(!S||S===before)return;const k=campaignKey();load();if(memory[k])return;memory[k]={offer:true,on:false,done:false,min:false,startWeek:S.week,seen:[],acked:[]};store();drawCard();},0);},true);
 document.addEventListener('click',event=>{
  if(event.target.closest&&event.target.closest('#guide-help-btn')){if(S)helpModal();return;}
  const old=event.target.closest&&event.target.closest('[data-u43="begin-tutorial"]');
  if(old){event.preventDefault();event.stopImmediatePropagation();closeModal();startGuide();notify('Guided tutorial started. Follow the card at the corner of the screen.');return;}
  const b=event.target.closest&&event.target.closest('[data-guide]');if(!b||!S)return;
  const a=b.dataset.guide,g=state();
  if(a==='start'){closeModal();startGuide();return;}
  if(!g)return;
  if(a==='decline'){g.offer=false;store();drawCard();notify('No problem. Press ? Help any time to start the tutorial.');return;}
  if(a==='ack'){if(!g.acked.includes(b.dataset.guideKey))g.acked.push(b.dataset.guideKey);store();drawCard();return;}
  if(a==='minimize'){g.min=true;store();drawCard();return;}
  if(a==='expand'){g.min=false;store();drawCard();return;}
  if(a==='goto'){view=b.dataset.guideView;render();window.scrollTo(0,0);return;}
  if(a==='stop'){stopGuide(false);notify('Tutorial stopped. Restart it from ? Help.');}
 },true);
})();
