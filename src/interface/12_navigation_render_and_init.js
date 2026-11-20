
function pendingRightsPanel(){
 const offers=(S.rightsOffers||[]).filter(o=>o.grantorId===S.playerId&&o.status==='counter');
 const approvals=(S.creativeApprovals||[]).filter(a=>a.grantorId===S.playerId&&a.status==='pending');
 if(!offers.length&&!approvals.length)return '';
 return panel('Contracts needing your decision',
  `<p class="panel-sub">The manager handles the rest; vetoes only apply when contracted. Rejecting never forces consent or generates a payment.</p>`+
  offers.map(o=>`<div class="inbox-item"><div><strong>${esc(o.kind==='renewal'?'Renewal counteroffer':'Rights counteroffer')}</strong><p>${esc(E.company(S,o.holderId)?.name||'Studio')} · ${esc(sectorName(o.media))}</p><button class="btn btn-outline btn-mini" data-counter="${esc(o.id)}">Review offer</button></div></div>`).join('')+
  approvals.map(a=>`<div class="inbox-item"><div><strong>Creator approval · ${esc(a.title)}</strong><p>${esc(a.genre)} · ${esc(E.company(S,a.holderId)?.name||'Studio')} seeks to use your licensed source IP.</p><button class="btn btn-outline btn-mini" data-approval="${esc(a.id)}" data-allow="false">Veto pitch</button> <button class="btn btn-primary btn-mini" data-approval="${esc(a.id)}" data-allow="true">Approve pitch</button></div></div>`).join(''));
}
function exportSave(){const bytes=JSON.stringify(S,null,CFG.tuning_ui.bytes__001);const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='studio-syndicate-Y'+E.yearAt(S.week)+'-save.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),CFG.tuning_ui.exportSave__001);notify('Backup exported.');}
async function saveSlot(n){try{
 const label=($('save-name-'+n)?.value||'').trim().slice(0,CFG.tuning_ui.label__001)||('Campaign slot '+n);
 if(!['1','2','3'].includes(String(n)))throw new Error('Invalid save slot.');
 if(E.audit(S).length)throw new Error('Cannot store an inconsistent campaign.');
 const raw=JSON.stringify(S),meta={label,name:E.player(S).name,year:E.yearAt(S.week),playtimeSec:S.playtimeSec||0};
 if(durableStore50){try{
  await durableStore50.save('slot-'+n,raw);
  localStorage.setItem(SLOT_PREFIX+n,JSON.stringify({...meta,data:DB_POINTER50}));
  notify('Campaign saved in slot '+n+'.');render();return;
 }catch(_) { /* Explicit legacy fallback for restricted browsers below. */ }}
 if(raw.length>CFG.tuning_ui.saveSlot__001)throw new Error('Large save needs IndexedDB. Export a JSON backup.');
 localStorage.setItem(SLOT_PREFIX+n,JSON.stringify({...meta,data:S}));
 notify('Campaign saved in slot '+n+'.');render();
 }catch(e){notify('Save slot failed: '+e.message,'error');}}
async function loadSlot(n){try{
 const raw=localStorage.getItem(SLOT_PREFIX+n);if(!raw)throw new Error('This slot is empty.');
 const item=JSON.parse(raw),payload=item.data===DB_POINTER50?await durableStore50.get('slot-'+n):item.data;
 if(!payload)throw new Error('Saved campaign data unavailable; use an exported JSON backup.');
 const loaded=E.loadState(payload);S=loaded;view='dashboard';remember();render();notify('Loaded campaign from slot '+n+'.');
 }catch(e){notify('Load slot failed: '+e.message,'error');}}
function toggleTheme(){document.body.classList.toggle('dark');try{localStorage.setItem('studio-syndicate-theme',document.body.classList.contains('dark')?'dark':'light');}catch(e){}}
async function init(){try{if(localStorage.getItem('studio-syndicate-theme')!=='light')document.body.classList.add('dark');}catch(e){document.body.classList.add('dark');}
 let raw=null,localPointer=null,orphanedDatabase=false;
 try{
  // Prefer a valid localStorage campaign when it is present: an old orphaned
  // database snapshot must never silently replace a newer in-browser save.
  try{localPointer=localStorage.getItem(AUTOSAVE);}catch(e){localPointer=null;}
  if(localPointer===DB_POINTER50){
   if(!durableStore50)throw new Error('IndexedDB unavailable');
   raw=await durableStore50.get('autosave');
   if(!raw)throw new Error('IndexedDB autosave pointer has no matching snapshot');
  }else if(localPointer){raw=localPointer;}
  else if(durableStore50){
   // The IndexedDB commit may succeed while the pointer write fails; recover
   // its durable bytes without requiring a stale localStorage marker.
   raw=await durableStore50.get('autosave');orphanedDatabase=!!raw;
  }
  if(raw){S=E.loadState(raw);initialized=true;
   if(orphanedDatabase){
    try{localStorage.setItem(AUTOSAVE,DB_POINTER50);}catch(_){}
    notify('Recovered a browser save whose storage pointer was missing. Export a JSON backup.');
   }
  }
 }catch(e){
  // Look for a previous *validated* snapshot rather than silently creating a
  // new world when an IndexedDB pointer is present but its data is missing.
  try{
   let backup=null;
   if((localPointer===DB_POINTER50||!localPointer)&&durableStore50){
    try{backup=await durableStore50.get('recovery');}catch(_){}
   }
   if(!backup){try{backup=localStorage.getItem(RECOVERY);}catch(_){}}
   if(!backup)throw new Error('No recoverable backup');
   S=E.loadState(backup);initialized=true;
   notify('Recovered the last valid autosave. Export a JSON backup.');
  }catch(_){
   notify('Autosave integrity failed. Use a manual slot or imported backup; the damaged data was not overwritten.','error');
  }
 }
 if(!S)S=E.createGame({});render();if(!initialized)newGameModal();}