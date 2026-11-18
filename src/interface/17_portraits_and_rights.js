
function portrait43(personId,dimensions=CFG.tuning_ui.portrait43__001){
 let p;try{p=E.portraitTraits43(S,personId)}catch(_){return '';}const key=esc(personId),d=Math.max(CFG.tuning_ui.d__001,Math.min(CFG.tuning_ui.d__002,dimensions));
 const hair=['M24 41 Q15 20 28 17 Q42 9 55 23 L57 42 Q47 24 41 25 Q32 27 24 41',
 'M22 42 Q12 9 40 15 Q68 13 59 43 Q49 30 40 26 Q31 32 22 42',
 'M23 42 Q8 21 30 16 Q49 12 56 29 L57 45 Q43 30 30 29 Z',
 'M21 39 Q19 16 42 16 Q61 18 57 41 Q48 24 39 26 Q29 29 21 39'][p.hairstyle];
 return `<svg class="ss-portrait43" data-portrait43="${key}" role="img" aria-label="Cartoon portrait of ${esc(p.name)}" width="${d}" height="${d}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" rx="16" fill="${p.background}"/><path d="M6 80 Q13 57 40 58 Q67 57 74 80Z" fill="${p.shirt}"/><rect x="34" y="51" width="12" height="16" rx="5" fill="${p.skin}"/><ellipse cx="40" cy="38" rx="20" ry="24" fill="${p.skin}"/><path d="${hair}" fill="${p.hair}"/><circle cx="33" cy="40" r="1.65" fill="#24313a"/><circle cx="47" cy="40" r="1.65" fill="#24313a"/><path d="M34 50 Q40 54 46 50" fill="none" stroke="#965d4a" stroke-width="1.9" stroke-linecap="round"/>${p.glasses?'<rect x="27" y="34" width="13" height="12" rx="5" fill="none" stroke="#324051" stroke-width="2"/><rect x="41" y="34" width="13" height="12" rx="5" fill="none" stroke="#324051" stroke-width="2"/><path d="M40 40h2" stroke="#324051" stroke-width="2"/>':''}</svg>`;
}
function smallOption43(text,value,active){return `<option value="${esc(value)}" ${active===value?'selected':''}>${esc(text)}</option>`;}
function onboardingPanel43(){
 const tutorial=E.tutorialStatus43(S),advisor=E.adviser43(S),goals=E.objectiveStatus43(S);
 return panel('Optional adviser, goals and tutorial',
 `<div class="ss-identity43">${portrait43(S.founder.id,CFG.tuning_ui.onboardingPanel43__001)}<div><strong>${esc(S.founder.name)}</strong><p class="panel-sub">${esc(advisor.headline)} · ${esc(advisor.reason)}</p></div></div>`+
 (tutorial.enabled?`<p class="section-note">Tutorial ${tutorial.step+1}/${tutorial.total}: ${esc(tutorial.current.title)} · ${esc(tutorial.current.instructions)}</p>`+btn('Open tutorial step',`data-u43="jump" data-next43="${esc(tutorial.current.screen)}"`,'primary')+btn('End tutorial','data-u43="end-tutorial"'):
 `<p class="panel-sub">${tutorial.completed?'Tutorial completed.':'Guided learning is optional. Follow real studio actions; there are no artificial quest rewards.'}</p>`+btn('Start optional tutorial','data-u43="begin-tutorial"','outline'))+
 btn('Follow adviser',`data-u43="jump" data-next43="${esc(advisor.screen)}"`,'outline')+
 `<div class="ss-goals43">${goals.map(o=>`<div class="small-stat"><span>${o.complete?'✓ ':''}${esc(o.name)}<small class="item-sub"> · ${esc(o.hint)}</small></span><span>${btn(o.selected?'Remove goal':'Set goal',`data-u43="goal" data-id43="${esc(o.key)}" data-enable43="${!o.selected}"`,'outline')}</span></div>`).join('')}</div>`);
}
function erasPanel43(){const ov=E.eraOverview43(S),c=E.player(S);
 return panel('World history & market readiness',`<p class="panel-sub">World Year ${ov.worldYear}; your company is ${ov.companyAge} years old. Historic releases are fictional archives, not pretend earnings, options or property you inherited.</p>`+
 Object.entries(ov.industryStages).map(([key,x])=>`<div class="small-stat"><span>${esc(sectorName(key))} · global debut Year ${x.debut}</span><strong>${esc(x.maturity)}</strong></div>`).join('')+
 `<p class="panel-sub">${ov.archives} chronologically consistent historic reference entries; this campaign's actions have separate live ledger transactions.</p>`+
 (S.prehistoryWorks||[]).slice(-CFG.tuning_ui.erasPanel43__001).reverse().map(x=>`<p class="item-sub">Year ${x.year} · ${esc(x.title)} · ${esc(sectorName(x.sector))} · generated archive, not booked</p>`).join('')+
 btn('Review capability details','data-u43="jump" data-next43="productions"','outline'));
}
function eventArchive43(){const events=E.worldEvents43(S).slice(0,CFG.tuning_ui.events__001);
 return panel('Traceable world event archive',events.length?events.map(x=>`<div class="small-stat" style="display:block"><strong>${esc(x.title||x.kind)}</strong><p class="item-sub">${weekLabel(x.week)} · ${esc(x.kind)}${x.companyId?' · '+esc(E.company(S,x.companyId)?.name||x.companyId):''}</p></div>`).join(''):'<p class="panel-sub">New releases, licensed deals and recorded company events appear when they actually happen. Generated prehistory remains separate.</p>');
}
function managementPanel43(){const cfg=E.managementStatus43(S),c=E.player(S);return panel('Decision depth · studio management',
 `<p class="panel-sub">Choose how much to delegate. Routine actions still pay real costs and cannot override creator consent, legal rights or cash buffers.</p>`+
 `<form id="management43-form"><div class="form-grid"><div class="form-field"><label>GLOBAL MANAGEMENT MODE</label><select name="mode">${['guided','delegated','manual'].map(x=>smallOption43(x[0].toUpperCase()+x.slice(1),x,cfg.corporate)).join('')}</select></div><div class="form-field"><label>AUTHORITY SPEND CAP</label><input name="cap" type="number" min="${CFG.forms.htmlValues.managementPanel43__min_001}" max="${CFG.forms.htmlValues.managementPanel43__max_001}" step="${CFG.forms.htmlValues.managementPanel43__step_001}" value="${cfg.autoSpendLimit}"></div></div><button type="submit" class="btn btn-outline">Update decision policy</button></form>`+
 `<p class="item-sub">Executed delegated actions (all funded): ${cfg.actions.length}. This is independent of optional formal corporate governance.</p>`);
}
function teamDepth43(){const c=E.player(S),cfg=E.managementStatus43(S);return panel('Team autonomy & creator identity',
 `<p class="panel-sub">Team-first staffing; no chapter or individual task micromanagement required.</p>`+
 c.teams.slice(0,CFG.tuning_ui.teamDepth43__001).map(t=>`<div class="small-stat"><span class="ss-identity43">${t.leaderId?portrait43(t.leaderId,CFG.tuning_ui.teamDepth43__002):''}<span>${esc(t.name)} · skill ${t.skill}</span></span><span>${btn(cfg.teamModes[t.id]==='delegated'?'Delegated ✓':'Delegate mentor',`data-u43="team-toggle" data-id43="${esc(t.id)}"`,'outline')}</span></div>`).join(''));
}
function projectsDepth43(){const jobs=activeMine(),cfg=E.managementStatus43(S),c=E.player(S);const ready=E.capabilityReadiness43(S,industry);const path=E.productionPath43(S,industry);
 return panel('Industry-specific production path & autonomy',
 `<p class="panel-sub">${esc(ready.reason)} · ${ready.freeSlots} free team slots. ${esc(sectorName(industry))} stages: ${path.phases.map(esc).join(' → ')}. New sectors require valid world gates AND paid company capability.</p>`+
 jobs.filter(p=>p.sector===industry).map(p=>`<div class="small-stat"><span>${esc(p.title)} · ${esc(p.phase||'scheduled')}</span><span>${btn(cfg.projectModes[p.id]==='delegated'?'Delegated ✓':'Auto-polish',`data-u43="project-toggle" data-id43="${esc(p.id)}"`,'outline')}</span></div>`).join(''));
}
function rightsPackagePanel43(){const allIps=S.ips.filter(ip=>!!E.company(S,ip.ownerId)&&!E.company(S,ip.ownerId).bankrupt),ours=S.ips.filter(ip=>ip.ownerId===S.playerId);
 const independent=S.companies.filter(c=>c.id!==S.playerId&&!c.parentId&&!c.bankrupt);
 if(!independent.length||!allIps.length)return panel('Territory licensing packages','<p class="panel-sub">Create original IP and meet other studios to negotiate license packages.</p>');
 const medium=Object.entries(E.SECTORS).filter(([k])=>E.available(k,S.week));
 const grants=ours.flatMap(ip=>E.rightsPackageReport43(S,ip.id).filter(g=>g.kind==='license')).slice(-CFG.tuning_ui.grants__001).reverse();
 const sublicenses=S.grants.filter(g=>g.type==='license'&&g.holderId===S.playerId&&g.sublicensable43&&g.endWeek>S.week);
 return panel('Commercial rights by medium, territory and term',
 `<p class="panel-sub">Real bilateral fees. Underlying title remains with its lawful owner. Overlapping exclusive territories are rejected. Creator approvals, resale permissions and expiry remain binding.</p>`+
 `<form id="rights43-form"><div class="form-grid"><div class="form-field"><label>IP PROPERTY · OWNED OR LICENSE IN</label><select name="ipId">${allIps.slice(-CFG.tuning_ui.rightsPackagePanel43__001).map(ip=>`<option value="${esc(ip.id)}">${esc(ip.name)} · ${esc(E.company(S,ip.ownerId).name)}</option>`).join('')}</select></div>`+
 `<div class="form-field"><label>RIGHTS BUYER / LICENSEE</label><select name="holderId">${independent.slice(0,CFG.tuning_ui.rightsPackagePanel43__002).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}<option value="${esc(S.playerId)}">Our company (license in)</option></select></div>`+
 `<div class="form-field"><label>MEDIUM</label><select name="media">${medium.map(([k])=>`<option value="${k}">${esc(sectorName(k))}</option>`).join('')}</select></div>`+
 `<div class="form-field"><label>REGIONAL RIGHTS</label><select name="territory"><option value="Worldwide">Worldwide</option>${E.REGIONS.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('')}</select></div>`+
 `<div class="form-field"><label>PARENT LICENSE FOR SUBLICENSE</label><select name="parentGrantId"><option value="">Direct owner grant</option>${sublicenses.map(g=>`<option value="${esc(g.id)}">${esc(g.id)} · ${esc(g.media)} · ${esc(S.ips.find(x=>x.id===g.ipId)?.name||'IP')}</option>`).join('')}</select></div>`+
 `<div class="form-field"><label>LENGTH · WEEKS</label><input type="number" min="${CFG.forms.htmlValues.rightsPackagePanel43__min_001}" max="${CFG.forms.htmlValues.rightsPackagePanel43__max_001}" name="weeks" value="${CFG.forms.htmlValues.rightsPackagePanel43__value_001}" required></div>`+
 `<div class="form-field"><label>UPFRONT FEE</label><input type="number" min="${CFG.forms.htmlValues.rightsPackagePanel43__min_002}" max="${CFG.forms.htmlValues.rightsPackagePanel43__max_002}" step="${CFG.forms.htmlValues.rightsPackagePanel43__step_001}" name="fee" value="${CFG.forms.htmlValues.rightsPackagePanel43__value_002}" required></div>`+
 `<div class="form-field"><label>ROYALTY ON SALES %</label><input type="number" min="${CFG.forms.htmlValues.rightsPackagePanel43__min_003}" max="${CFG.forms.htmlValues.rightsPackagePanel43__max_003}" step="${CFG.forms.htmlValues.rightsPackagePanel43__step_002}" name="royalty" value="${CFG.forms.htmlValues.rightsPackagePanel43__value_003}" required></div>`+
 `<div class="form-field"><label>CONTINUATION AFTER EXPIRY</label><select name="continuationWeeks">${smallOption43('None · hard expiry',0,0)}${smallOption43('4 contracted weeks',CFG.tuning_ui.rightsPackagePanel43__003,0)}${smallOption43('12 contracted weeks',CFG.tuning_ui.rightsPackagePanel43__004,0)}</select></div>`+
 `<div class="form-field"><label><input type="checkbox" name="exclusive"> Exclusive grant</label></div><div class="form-field"><label><input type="checkbox" name="sublicensable"> Permit sublicensing</label></div><div class="form-field"><label><input type="checkbox" name="approvalRequired"> Creator sign-off required</label></div></div><button type="submit" class="btn btn-outline">Negotiate funded package</button></form>`+
 `<p class="panel-sub">For sublicensing, an outgoing license must have a valid parent explicitly permitting sublicenses; existing rights are never silently upgraded.</p>`+
 grants.map(g=>`<div class="small-stat"><span>${esc(g.id)} · ${esc(sectorName(g.medium))} · ${g.regions.map(esc).join(', ')}${g.exclusive?' · exclusive':''}${g.sublicense?' · may sublicense':''}</span><strong>expires ${weekLabel(g.endWeek)}</strong></div>`).join(''));
}