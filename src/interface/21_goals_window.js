// Pinned goals window: a small card that stays on screen on every page. UI only; goal state lives in the existing objectives43 save data.
const GOALS_DOCK_KEY='studio-syndicate-goals-dock';
let goalsDockOpen=(()=>{try{const v=localStorage.getItem(GOALS_DOCK_KEY);if(v==='open')return true;if(v==='closed')return false;}catch(_){}return window.innerWidth>850;})();
let goalsDockAll=false;
function goalsDockHtml(){
 const goals=E.objectiveStatus43(S),picked=goals.filter(o=>o.selected),done=picked.filter(o=>o.complete).length,advisor=E.adviser43(S);
 const showAll=goalsDockAll||!picked.length,list=showAll?goals:picked;
 const row=o=>`<div class="gd-row${o.complete?' gd-done':''}"><span class="gd-mark" aria-hidden="true">${o.complete?'✓':o.selected?'○':'·'}</span><span class="gd-text"><strong>${esc(o.name)}</strong><small>${o.complete?'Done':esc(o.hint)}</small></span>${showAll?`<button type="button" class="gd-pin" data-goal-pin="${esc(o.key)}" data-goal-on="${!o.selected}" aria-label="${o.selected?'Unpin':'Pin'} ${esc(o.name)}">${o.selected?'Unpin':'Pin'}</button>`:''}</div>`;
 return `<button type="button" class="gd-head" id="goals-dock-toggle" aria-expanded="${goalsDockOpen}" aria-controls="goals-dock-body"><span>🎯 Goals${picked.length?` ${done}/${picked.length}`:''}</span><span class="gd-fold" aria-hidden="true">${goalsDockOpen?'–':'+'}</span></button>`+
  `<div class="gd-body" id="goals-dock-body"${goalsDockOpen?'':' hidden'}>`+
  (picked.length?'':'<p class="gd-note">Pin a goal to keep it here.</p>')+list.map(row).join('')+
  (picked.length?`<button type="button" class="gd-link" data-goal-all="1">${goalsDockAll?'Done choosing':'Choose goals'}</button>`:'')+
  `<div class="gd-next"><small>Adviser: next step</small><button type="button" class="gd-link" data-goal-jump="${esc(advisor.screen)}">${esc(advisor.headline)} →</button></div></div>`;
}
function placeGoalsDock(){
 const d=document.getElementById('goals-dock');if(!d)return;
 const bar=document.querySelector('.turnbar'),top=bar?bar.getBoundingClientRect().top:window.innerHeight;
 d.style.bottom=Math.max(8,Math.round(window.innerHeight-top+8))+'px';
}
function renderGoalsDock(){
 let d=document.getElementById('goals-dock');
 if(!S){if(d)d.remove();return;}
 if(!d){d=document.createElement('aside');d.id='goals-dock';d.className='goals-dock';d.setAttribute('aria-label','Goals');document.body.appendChild(d);}
 try{d.innerHTML=goalsDockHtml();}catch(_){d.remove();return;}
 d.classList.toggle('gd-closed',!goalsDockOpen);placeGoalsDock();
}
(function(){const prev=render;render=function(){const r=prev.apply(this,arguments);renderGoalsDock();return r;};})();
window.addEventListener('resize',placeGoalsDock);
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('#goals-dock button');if(!b||!S)return;
 if(b.id==='goals-dock-toggle'){goalsDockOpen=!goalsDockOpen;try{localStorage.setItem(GOALS_DOCK_KEY,goalsDockOpen?'open':'closed');}catch(_){}renderGoalsDock();return;}
 if(b.dataset.goalAll){goalsDockAll=!goalsDockAll;renderGoalsDock();return;}
 if(b.dataset.goalJump){view=b.dataset.goalJump||'dashboard';render();remember();window.scrollTo(0,0);if(window.innerWidth<=850){goalsDockOpen=false;renderGoalsDock();}return;}
 if(b.dataset.goalPin){safe(()=>{E.chooseObjective43(S,b.dataset.goalPin,b.dataset.goalOn==='true');notify(b.dataset.goalOn==='true'?'Goal pinned.':'Goal unpinned.');});return;}
});
