"""Current-source desktop/mobile browser UI workflows. Storage is an explicit shim, NOT native origin persistence."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'Studio_Syndicate_Playable_Update_48.html').read_text()
def mount(page,seed=None):
 stub='''<script>(function(){const db=JSON.parse(%s);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(db,k)?db[k]:null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]},clear(){Object.keys(db).forEach(k=>delete db[k])},dump(){return JSON.stringify(db)}}});})();</script>'''%json.dumps(json.dumps(seed or {}))
 patched=HTML.replace('\ninit();\n})();','\nwindow.__testE=E;window.__testS=()=>S;window.__testRefresh=()=>render();\ninit();\n})();')
 assert patched!=HTML, 'UI test handle not installed'
 page.set_content(patched.replace('<head>','<head>'+stub,1),wait_until='domcontentloaded')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def setup(width=1440,seed=None):
  context=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True)
  p=context.new_page();p.set_default_timeout(13000)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept());mount(p,seed);return context,p,errors
 def start(p):
  p.locator('#new-era').select_option('25');p.locator('#new-origin').select_option('established');p.locator('[name="startingCapital"]').select_option('funded');p.locator('#new-game-form button[type="submit"]').click()
 c,p,errors=setup();start(p)
 # Actual funded service job; deliberately simulate a weak quality deliverable (not a balance/rights mutation).
 detail=p.evaluate('''() => {const E=window.__testE,S=window.__testS(); const data={sector:'publishing',route:'contract',title:'UI Inspection Commission',size:.6,clientId:'auto'};
  const quote=E.previewProject(S,{...data,withForecast:false}),cl=E.eligibleClients(S,quote.contractFee)[0];if(!cl)throw Error('Missing funded client');
  const offer=E.requestCommission(S,{...data,clientId:cl.id});if(offer.status!=='accepted')throw Error('Client offer not accepted');
  const project=E.createProject(S,{...data,clientId:cl.id,offerId:offer.id});
  for(let i=0;i<100 && project.weeksDone<project.weeksTotal*.40;i++)E.advance(S,1);
  if(project.status!=='active')throw Error('Project no longer active');project.quality=50; // controlled adverse test fixture
  window.__testRefresh();return {projectId:project.id,cash:E.player(S).finance.cash};}''')
 p.locator('[data-view="productions"]').first.click()
 assert 'Client delivery inspections' in p.locator('#content').inner_text()
 assert p.locator('button[data-u47="inspect"]').count()>0
 p.locator('button[data-u47="inspect"]').first.click()
 assert p.locator('button[data-u47="remedy"]').count()>0
 contested=p.evaluate('''() => {const E=window.__testE,S=window.__testS(),p=S.projects.find(p=>p.title==='UI Inspection Commission');return {status:E.commissionDispute47(S,p.id).inspection.status,audit:E.audit(S)};}''')
 assert contested['status']=='open' and contested['audit']==[],contested
 p.locator('button[data-u47="remedy"]').first.click()
 resolved=p.evaluate('''() => {const E=window.__testE,S=window.__testS(),p=S.projects.find(p=>p.title==='UI Inspection Commission');return {status:E.commissionDispute47(S,p.id).inspection.status,cash:E.player(S).finance.cash,audit:E.audit(S)};}''')
 assert resolved['status']=='remedied' and resolved['cash']<detail['cash'] and resolved['audit']==[],resolved
 assert not errors,errors;print('PASS desktop funded client inspection, contested protected tranche, paid remedy and audit')
 c.close()
 c,p,errors=setup();start(p)
 eligibility=p.evaluate('''() => {const E=window.__testE,S=window.__testS(),c=E.player(S);const l=E.borrowLoan(S,20000);
 while(c.finance.cash>28000)E.investResearch(S,'publishing',25000);
 for(let k=0;k<95 && l.status!=='delinquent' && !c.bankrupt;k++)E.advance(S,1);
 if(l.status!=='delinquent')throw Error('No real bank distress');window.__testRefresh();return {loanId:l.id,cash:c.finance.cash,outstanding:l.principalOutstanding,interest:l.interestArrears};}''')
 p.locator('[data-view="finance"]').first.click()
 assert 'Lender crisis workout' in p.locator('#content').inner_text()
 p.locator('button[data-u47="workout"]').first.click()
 done=p.evaluate('''() => {const E=window.__testE,S=window.__testS(),l=S.loans.find(l=>l.debtorId===S.playerId);return {cash:E.player(S).finance.cash,outstanding:l.principalOutstanding,interest:l.interestArrears,workout:!!l.workout47,audit:E.audit(S)};}''')
 assert done['workout'] and done['cash']==eligibility['cash'] and done['outstanding']==eligibility['outstanding'] and done['interest']==eligibility['interest'] and done['audit']==[],done
 assert not errors,errors;print('PASS desktop authentic bank delinquency, consent-confirmed 24-month workout, debt and cash audit')
 c.close()
 c,p,errors=setup();start(p)
 original=p.evaluate('''() => {const E=window.__testE,S=window.__testS(),c=E.player(S);const p=E.createProject(S,{sector:'publishing',route:'original',title:'Pre-continuation company IP',size:.55});
 E.incorporateStudio(S);const sale=E.sellFounderShares(S,600);if(sale.proceeds<25000)throw Error('No personally funded new-company capital');
 window.__testRefresh();return {companyId:c.id,ipId:p.ipId,oldCash:c.finance.cash,personal:S.founderFunds};}''')
 p.locator('[data-view="career"]').first.click();assert p.locator('[data-gov-fresh]').count()==1
 p.locator('[data-gov-fresh]').click();assert p.locator('#corporate-fresh-form').count()==1
 p.locator('#corporate-fresh-form [name="name"]').fill('Second Studio Horizon')
 p.locator('#corporate-fresh-form [name="sector"]').select_option('publishing')
 p.locator('#corporate-fresh-form [name="capital"]').fill('25000')
 p.locator('#corporate-fresh-form button[type="submit"]').click()
 successor=p.evaluate('''() => {const E=window.__testE,S=window.__testS();return {id:S.playerId,previous:S.careerLineage.at(-1)?.fromId,founderCash:S.founderFunds,oldIp:S.ips.find(ip=>ip.name==='Pre-continuation company IP')?.ownerId,errors:E.audit(S)}}''')
 assert successor['id']!=original['companyId'] and successor['previous']==original['companyId'] and successor['oldIp']==original['companyId'] and successor['founderCash']==original['personal']-25000 and successor['errors']==[],successor
 p.locator('[data-gov-end]').click();assert p.evaluate('window.__testS().runStatus')=='ended'
 assert not errors,errors;print('PASS browser lawful cash-funded independent continuation, old IP preserved, final run closure')
 c.close()
 c,p,errors=setup(390)
 p.locator('#modal [data-close-modal]').first.click()
 p.locator('#menu-toggle').click();p.locator('[data-view="dashboard"]').first.click();p.locator('#dashboard-focus').select_option('finance')
 p.locator('#menu-toggle').click();p.locator('[data-view="settings"]').first.click()
 p.locator('#save-name-1').fill('Update48 mobile');p.locator('[data-save-slot="1"]').click()
 seed=json.loads(p.evaluate('localStorage.dump()'));assert seed
 c.close();c,p,errors=setup(390,seed=seed)
 assert p.locator('#new-game-form').count()==0
 p.locator('#menu-toggle').click();p.locator('[data-view="dashboard"]').first.click()
 assert p.locator('#dashboard-focus').input_value()=='finance'
 assert not errors,errors;print('PASS mobile saved dashboard recovery in fresh document with disclosed storage shim')
 c.close();browser.close()
print('UPDATE48 browser 4/4; actual origin-bound persistence still unverified (admin navigation restriction)')
