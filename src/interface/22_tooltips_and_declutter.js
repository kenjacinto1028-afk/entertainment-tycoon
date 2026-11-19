// Tooltips and decluttering. UI only: works on the drawn page, never touches the engine, saves or RNG.
// Text and fold lists live in config/tooltips.json.
const TIP_CFG=CFG.tooltips||{},TIP_TEXT=TIP_CFG.tips||{},TIP_RULES=TIP_CFG.declutter||{};
const TIP_FOLD_KEY='studio-syndicate-folds';
let tipOpenFolds=(()=>{try{const v=JSON.parse(localStorage.getItem(TIP_FOLD_KEY)||'[]');return new Set(Array.isArray(v)?v.map(String):[]);}catch(_){return new Set();}})();
function saveTipFolds(){try{localStorage.setItem(TIP_FOLD_KEY,JSON.stringify([...tipOpenFolds]));}catch(_){}}
function tipMode(){return (S&&S.settings&&S.settings.depth)||(CFG.depth&&CFG.depth.DEFAULT)||'standard';}
function tipClean(t){return String(t||'').toLowerCase().replace(/\s+/g,' ').replace(/^[^\p{L}\p{N}]+/u,'').trim();}
function tipFor(text){const n=tipClean(text);if(!n||n.length>90)return '';
 const a=n.split(' · ')[0].trim(),b=a.replace(/[^\p{L}&/' ,-].*$/u,'').replace(/[ ,:-]+$/,'').trim(),c=a.split(' (')[0].trim();
 for(const k of [n,a,b,c])if(k&&TIP_TEXT[k])return TIP_TEXT[k];return '';}
function tipOwnText(el){let t='';el.childNodes.forEach(n=>{if(n.nodeType===3||(n.nodeType===1&&!/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(n.tagName)&&!n.classList.contains('tip-i')))t+=n.textContent;});return t;}
const TIP_TARGETS='.metric-top span:first-child,.panel-heading,.page-title,.small-stat>span:first-child,.small-stat .subdued,th,label,button,.tab,.industry-pill,.modal-head h2';
function tipAddExtra(el,text){if(!el||!text)return;const prev=el.dataset.tipExtra||'';if(!prev.includes(text))el.dataset.tipExtra=(prev?prev+' ':'')+text;el.removeAttribute('data-tip-done');}
function declutterPass(root){
 const mode=tipMode();if(mode==='veryComplex')return;const min=Number(TIP_RULES.smallPrintMinChars)||60;
 // Long grey small print moves into the tooltip of the nearest heading.
 root.querySelectorAll('.panel-sub:not([data-tip-moved]),.page-sub:not([data-tip-moved]),.forecast-footnote:not([data-tip-moved]),.metric-sub:not([data-tip-moved])').forEach(el=>{
  const text=el.textContent.trim().replace(/\s+/g,' ');el.dataset.tipMoved='0';if(!text)return;
  const isMetric=el.classList.contains('metric-sub');if(isMetric?/\d/.test(text):text.length<min)return;
  const host=isMetric?el.closest('.metric')?.querySelector('.metric-top span:first-child'):el.classList.contains('page-sub')?el.closest('.page-head')?.querySelector('.page-title'):el.closest('.panel')?.querySelector('.panel-heading');
  if(!host)return;tipAddExtra(host,text);el.dataset.tipMoved='1';el.classList.add('tip-moved');});
 // Less-used panels fold behind a Show button. The player's choice is remembered in the browser.
 const F=TIP_RULES.fold||{},list=(F.standard||[]).concat(mode==='simple'?(F.simpleExtra||[]):[]);if(!list.length)return;
 root.querySelectorAll('.panel:not([data-fold-done])').forEach(p=>{p.dataset.foldDone='1';const h=p.querySelector('.panel-heading');if(!h)return;const title=tipOwnText(h).trim().replace(/\s+/g,' ');
  if(!list.some(t=>title.startsWith(t)))return;const head=h.closest('.panel-header')||h.parentElement;if(!head||head.parentElement!==p)return;
  const open=tipOpenFolds.has(title);p.classList.add('foldable');p.classList.toggle('is-folded',!open);
  const b=document.createElement('button');b.type='button';b.className='btn btn-outline btn-mini fold-toggle';b.dataset.foldToggle=title;b.setAttribute('aria-expanded',String(open));b.textContent=open?'Hide':'Show';head.appendChild(b);});
}
function tipPass(){
 const content=document.getElementById('content');if(content)declutterPass(content);
 document.querySelectorAll(TIP_TARGETS).forEach(el=>{if(el.dataset.tipDone)return;el.dataset.tipDone='1';if(el.closest('#tip-pop'))return;
  const own=(el.tagName==='LABEL'?tipOwnText(el):el.textContent),base=tipFor(own),extra=el.dataset.tipExtra||'',text=base&&extra?base+' '+extra:(base||extra);
  if(!text||el.classList.contains('fold-toggle')){el.removeAttribute('data-tip');return;}
  el.dataset.tip=text;const plain=!el.matches('button,a,select,input,label,.tab');el.classList.add(plain?'has-tip':'has-tip-btn');
  if(extra&&plain&&!el.closest('.metric-top')&&!el.querySelector('.tip-i'))el.insertAdjacentHTML('beforeend',' <span class="tip-i" aria-hidden="true">i</span>');});
}
let tipQueued=false;
const tipObserver=new MutationObserver(()=>{if(tipQueued)return;tipQueued=true;queueMicrotask(()=>{tipQueued=false;try{tipPass();}catch(_){}});});
tipObserver.observe(document.body,{childList:true,subtree:true});
try{tipPass();}catch(_){}
// One floating tooltip box: hover or keyboard focus on PC, tap on phone.
let tipBox=null,tipFor_=null,tipTimer=0;
function tipShow(el){const text=el&&el.dataset.tip;if(!text)return;if(!tipBox){tipBox=document.createElement('div');tipBox.id='tip-pop';tipBox.setAttribute('role','tooltip');document.body.appendChild(tipBox);}
 tipBox.textContent=text;tipBox.hidden=false;tipFor_=el;el.setAttribute('aria-describedby','tip-pop');
 const r=el.getBoundingClientRect(),w=Math.min(300,window.innerWidth-24);tipBox.style.maxWidth=w+'px';const bw=tipBox.offsetWidth,bh=tipBox.offsetHeight;
 let left=Math.max(12,Math.min(r.left,window.innerWidth-bw-12)),top=r.bottom+8;if(top+bh>window.innerHeight-8)top=Math.max(8,r.top-bh-8);
 tipBox.style.left=left+'px';tipBox.style.top=top+'px';}
function tipHide(){clearTimeout(tipTimer);if(tipBox)tipBox.hidden=true;if(tipFor_)tipFor_.removeAttribute('aria-describedby');tipFor_=null;}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=e.target.closest&&e.target.closest('[data-tip]');if(!el){if(tipFor_&&!(e.target.closest&&e.target.closest('#tip-pop')))tipHide();return;}if(el===tipFor_)return;clearTimeout(tipTimer);tipTimer=setTimeout(()=>tipShow(el),250);});
document.addEventListener('pointerout',e=>{if(e.pointerType==='touch')return;const el=e.target.closest&&e.target.closest('[data-tip]');if(el&&!el.contains(e.relatedTarget))tipHide();});
document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el&&e.target.matches(':focus-visible'))tipShow(el);else tipHide();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')tipHide();});
window.addEventListener('scroll',()=>tipHide(),{passive:true,capture:true});
document.addEventListener('click',e=>{
 const fold=e.target.closest&&e.target.closest('[data-fold-toggle]');
 if(fold){const p=fold.closest('.panel'),title=fold.dataset.foldToggle,open=p.classList.contains('is-folded');p.classList.toggle('is-folded',!open);fold.textContent=open?'Hide':'Show';fold.setAttribute('aria-expanded',String(open));if(open)tipOpenFolds.add(title);else tipOpenFolds.delete(title);saveTipFolds();return;}
 const el=e.target.closest&&e.target.closest('.has-tip');
 if(el){if(tipFor_===el)tipHide();else tipShow(el);return;}
 if(tipFor_&&!(e.target.closest&&e.target.closest('#tip-pop')))tipHide();
});
