
const originalFinance42=renderFinance,originalWorld42=renderWorld;
renderFinance=function(){return originalFinance42()+growthFinance42();};
renderWorld=function(){return originalWorld42()+growthWorld42();};
function open42Form(title,body,submitText='Confirm'){
 showModal(modalHead(title)+`<form id="update42-form">${body}<button class="btn btn-primary" type="submit">${esc(submitText)}</button></form>`);
}
let pending42=null;
document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-u42]');if(!b)return;const action=b.dataset.u42,id=b.dataset.id42,kind=b.dataset.kind42;
 try{
  if(action==='open-line'){
   const q=E.automaticLenderDecision(S,S.playerId,'revolver');open42Form('External bank commitment',`<input type="hidden" name="action" value="open-line"><p class="panel-sub">Limit ${fmt(q.limit)}. Bank fee: 1.25% today. Drawing the loan later creates cash and debt.</p><div class="form-field"><label>Bank facility maximum</label><input required name="amount" type="number" min="${CFG.forms.htmlValues.markup__min_007}" max="${q.limit}" step="${CFG.forms.htmlValues.markup__step_006}" value="${Math.floor(Math.min(q.limit,CFG.tuning_ui.documentEvents__017)/CFG.tuning_ui.documentEvents__018)*CFG.tuning_ui.documentEvents__019}"></div>`,'Sign and pay bank fee');return;
  }
  if(action==='draw-line'){const q=E.creditLineStatus(S,id);open42Form('Draw real bank principal',`<input type="hidden" name="action" value="draw-line"><input type="hidden" name="id" value="${esc(id)}"><p class="panel-sub">${fmt(q.available)} is available. Actual principal and monthly interest become payable.</p><div class="form-field"><label>Borrow amount</label><input required name="amount" type="number" min="${CFG.forms.htmlValues.markup__min_008}" max="${q.available}" step="${CFG.forms.htmlValues.markup__step_007}" value="${Math.floor(Math.min(q.available,CFG.tuning_ui.documentEvents__020)/CFG.tuning_ui.documentEvents__021)*CFG.tuning_ui.documentEvents__022}"></div>`,'Borrow funds');return;}
  if(action==='repay-line'){const l=S.loans.find(x=>x.id===id);open42Form('Pay back bank principal',`<input type="hidden" name="action" value="repay-line"><input type="hidden" name="id" value="${esc(id)}"><p class="panel-sub">Loan ${fmt(l?.principalOutstanding)} outstanding; an early principal payment consumes real cash.</p><div class="form-field"><label>Repayment</label><input required name="amount" type="number" min="${CFG.forms.htmlValues.markup__min_009}" step="${CFG.forms.htmlValues.markup__step_008}" max="${Math.min(E.player(S).finance.cash,l?.principalOutstanding||0)}" value="${Math.floor(Math.min(CFG.tuning_ui.documentEvents__023,l?.principalOutstanding||0)/CFG.tuning_ui.documentEvents__024)*CFG.tuning_ui.documentEvents__025}"></div>`,'Pay bank');return;}
  if(action==='new-division'){open42Form('Create management division',`<input type="hidden" name="action" value="new-division"><div class="form-field"><label>Legal company</label><select name="companyId">${E.controlledCompanies(S).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="form-field"><label>Division name</label><input name="name" required minlength="3" maxlength="${CFG.forms.htmlValues.markup__maxlength_003}" placeholder="Original Fiction"></div><p class="panel-sub">Management label only: no cash or IP changes ownership.</p>`,'Create division');return;}
  if(action==='invest'){open42Form('Recapitalize subsidiary',`<input type="hidden" name="action" value="invest"><input type="hidden" name="id" value="${esc(id)}"><div class="form-field"><label>Paid-in parent equity</label><input name="amount" type="number" min="${CFG.forms.htmlValues.markup__min_010}" step="${CFG.forms.htmlValues.markup__step_009}" value="${CFG.forms.htmlValues.markup__value_003}" required></div><p class="panel-sub">Parent cash becomes subsidiary paid-in equity. Old debt and creator rights are not extinguished.</p>`,'Invest cash');return;}
  if(action==='group-license'){const units=E.controlledCompanies(S),ownedIPs=S.ips.filter(x=>units.some(c=>c.id===x.ownerId)),licensed=ownedIPs.filter(i=>i.ownerId===S.playerId);open42Form('Intragroup IP license',`<input type="hidden" name="action" value="group-license"><div class="form-field"><label>Owned source IP</label><select name="ipId" required>${licensed.map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('')}</select></div><div class="form-field"><label>Licensed legal company</label><select name="holder" required>${units.slice(1).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="form-field"><label>Globally available medium</label><select name="medium">${Object.entries(E.SECTORS).filter(([k])=>E.available(k,S.week)).map(([k])=>`<option value="${esc(k)}">${esc(sectorName(k))}</option>`).join('')}</select></div><p class="panel-sub">52-week nonexclusive license, 800 real internal transfer, no permanent grant or external profit.</p>`,'License within group');return;}
  if(action==='diligence'){const done=(S.diligenceRecords||[]).some(x=>x.key==='company:'+id);if(!done&&!confirm('Pay 650 from your company for a real legal and debt inspection?'))return;
   safe(()=>{const d=E.acquisitionDiligence(S,{kind:'company',id},!done);showModal(modalHead('Acquisition diligence · '+E.company(S,id).name)+`<p class="panel-sub">${d.inspected?'Paid commercial inspection: known financial balances':'Public information only; no hidden balance sheet'}. Purchase does not cancel old obligations.</p>`+
     brief42('Debt',d.conditions.debt===null?'Not disclosed':fmt(d.conditions.debt))+brief42('Unpaid bills',d.conditions.unpaidBills===null?'Not disclosed':fmt(d.conditions.unpaidBills))+
     brief42('Cash',d.conditions.cash===null?'Not disclosed':fmt(d.conditions.cash))+brief42('Existing rights grants',d.conditions.activeGrants===null?'Not disclosed':String(d.conditions.activeGrants.length))+
     brief42('Registered source IP',d.conditions.ownedIPs===null?'Not disclosed':String(d.conditions.ownedIPs.length))+
     `<p class="panel-sub">${esc(d.risks.join('; ')||'No material restrictions disclosed in this inspection')}</p>`+btn('Close','data-close-modal','outline'));notify('Diligence review prepared; current costs paid exactly once.');});return;}
  if(action==='buy-company'){const q=E.companyPurchaseQuote(S,id);if(!confirm('Buy '+E.company(S,id).name+' for '+fmt(q.ask)+' paid to former shareholders? Existing debts, staff, contracts, vetoes and rights remain in the acquired company. Any shortfall needs an existing funded bank facility.'))return;
   safe(()=>{const r=E.acquireCompany(S,id,{financeWith:'line'});notify('Company purchased for '+fmt(r.price)+'. '+fmt(r.borrowed)+' bank financing; liabilities stay intact.');});return;}
  if(action==='buy-asset'){const q=E.assetPurchaseQuote(S,{type:'ip',id});if(!confirm('Pay '+fmt(q.price)+' for clean underlying IP '+q.title+'? Finished works remain with their current legal owners.'))return;
   safe(()=>{E.acquireAsset(S,{kind:'ip',id,financeWith:'line'});notify('Underlying IP purchased with clean-title checks.');});return;}
  if(action==='team-division'){const field=$('div42-'+id);safe(()=>{E.assignTeamDivision(S,id,field?.value||null);notify('Team reassigned; no cash or ownership changed.');});return;}
  if(action==='service'){const c=E.company(S,id);safe(()=>{E.setCentralService(S,kind,!c.sharedServices?.[kind],id);notify(c.name+' shared '+kind+' service '+(c.sharedServices[kind]?'enabled':'disabled')+'.');});return;}
  if(action==='close-line'){if(!confirm('Close this unused bank commitment? Any outstanding principal must be repaid first.'))return;safe(()=>{E.closeCreditLine(S,id);notify('Bank facility closed.');});return;}
  if(action==='delegation'){safe(()=>{const x=E.company(S,id),r=E.subsidiaryDelegation(S,id,x.delegatedProduction===false);notify(r.enabled?'Subsidiary productions delegated within its real cash limit.':'Automatic project launch paused; outstanding projects and contracts continue.');});return;}
  if(action==='integrate'){safe(()=>{E.integrateAcquisition(S,id,{choice:kind});notify('Group culture set to '+kind+'; legal obligations remain.');});return;}
 }catch(e){notify(e.message,'error');}
});
document.addEventListener('submit',event=>{const f=event.target;if(f.getAttribute('id')!=='update42-form')return;event.preventDefault();const d=Object.fromEntries(new FormData(f));
 safe(()=>{const n=Number(d.amount),action=d.action;
  if(action==='open-line'){const x=E.openCreditLine(S,S.playerId,n);notify('Real bank facility opened for '+fmt(x.limit)+'.');}
  else if(action==='draw-line'){const x=E.drawCreditLine(S,d.id,n);notify('Bank loan funded for '+fmt(x.originalPrincipal)+'.');}
  else if(action==='repay-line'){const x=E.repayLoan(S,d.id,n);notify('Bank paid '+fmt(x.principalPaid)+' principal plus interest.');}
  else if(action==='new-division'){const x=E.createDivision(S,d.name,d.companyId);notify('Division created: '+x.name+'.');}
  else if(action==='invest'){E.integrateAcquisition(S,d.id,{choice:'recapitalize',capital:n});notify('Real equity recapitalization recorded.');}
  else if(action==='group-license'){E.groupInternalLicense(S,d.ipId,d.holder,d.medium,CFG.tuning_ui.documentEvents__026,CFG.tuning_ui.documentEvents__027);notify('Intragroup license granted for 52 weeks and eliminated in group reporting.');}
  else throw new Error('Unknown Update 42 management action.');
  closeModal();
 });
});

// UPDATE 43 — Optional strategy depth, guided onboarding and funded contracts.
// UI uses the same state/engine checks as the rest of the game. All numbers
// and labels are rendered from actual current records, not illustrative data.
const originalNewGame43=newGameModal;
newGameModal=function(){originalNewGame43();const row=$('new-game-form')?.querySelector('.form-grid');
 if(row){const field=document.createElement('div');field.className='form-field';field.innerHTML=`<label>INITIAL STUDIO PROFILE</label><select name="startupProfile" id="startup-profile43"><option value="focused">Focused specialist · no extra cost</option><option value="team">Additional trained team · actual startup cost</option><option value="partner">Paid partner-ready entry · advanced eras only</option></select><small class="input-note">World industry debut years never change. Cash purchases real additional capacity.</small>`;row.appendChild(field);}
};