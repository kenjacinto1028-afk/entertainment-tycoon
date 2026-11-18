"""Playwright UI interaction checks on Update46. Navigation/storage restrictions disclosed.
Uses set_content with explicit per-document localStorage shim, not native origin persistence.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; HTML=(ROOT/'Studio_Syndicate_Playable_Update_46.html').read_text()
def mount(page,seed=None):
 stub='''<script>(function(){const db=JSON.parse(%s);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(db,k)?db[k]:null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]},clear(){Object.keys(db).forEach(k=>delete db[k])},dump(){return JSON.stringify(db)}}});})();</script>'''%json.dumps(json.dumps(seed or {}))
 patched=HTML.replace('\ninit();\n})();', '\nwindow.__testE=E;window.__testS=()=>S;\ninit();\n})();')
 assert patched!=HTML, 'UI test-handle injection missing'
 page.set_content(patched.replace('<head>','<head>'+stub,1),wait_until='domcontentloaded')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def setup(width=1440,seed=None):
  context=browser.new_context(viewport={'width':width,'height':920},accept_downloads=True);page=context.new_page();page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());mount(page,seed);return context,page,errors
 c,p,errors=setup();p.locator('#new-era').select_option('25');p.locator('#new-origin').select_option('established');p.locator('[name="startingCapital"]').select_option('funded');p.locator('#new-game-form button[type="submit"]').click()
 p.locator('[data-view="career"]').first.click()
 assert p.locator('[data-gov-incorporate]').count()==1
 p.locator('[data-gov-incorporate]').click()
 assert 'private-corporation' in p.locator('#content').inner_text()
 p.locator('[data-gov-board]').click();assert p.locator('#corporate-board-form').count()==1
 p.locator('#corporate-board-form [name="amount"]').fill('250000');p.locator('#corporate-board-form button[type="submit"]').click()
 assert p.evaluate("window.__testE.corporateStatus(window.__testS()).stage")=='private-corporation'
 assert p.evaluate("window.__testE.player(window.__testS()).corporate.resolutions.some(r=>!r.approved)")
 p.locator('[data-gov-ipo]').click();assert p.evaluate("window.__testE.corporateStatus(window.__testS()).stage")=='public-corporation'
 assert p.evaluate('window.__testE.audit(window.__testS())').__len__()==0
 assert not errors,errors;print('PASS desktop corporate readiness, rejected board vote, optional IPO and finance audit')
 # Create actual funded counteroffers in the same live game and approve from Inbox button.
 values=p.evaluate('''() => { const E=window.__testE, S=window.__testS(); const data={sector:'publishing',route:'contract',title:'Browser Client Batch',size:.65};const plan=E.previewProject(S,{...data,clientId:'auto',withForecast:false});const client=E.eligibleClients(S,plan.contractFee)[0];if(!client)throw Error('No funded client');const offer=E.requestCommission(S,{...data,clientId:client.id,fee:plan.contractFee*1.55});E.configureCommissionAuthority(S,{autoCounter:true,maxFee:30000,minMargin:.03});return {offerId:offer.id,status:offer.status,projects:S.projects.length,cash:E.player(S).finance.cash}; }''')
 assert values['status']=='counter'
 p.locator('[data-view="inbox"]').first.click();assert p.locator('[data-batch-counters]').count()==1
 p.locator('[data-batch-counters]').click()
 result=p.evaluate('''() => { const E=window.__testE, S=window.__testS(); return ({status:S.commissionOffers.find(o=>o.title==='Browser Client Batch').status,projects:S.projects.length,cash:E.player(S).finance.cash,errors:E.audit(S)}); }''')
 assert result['status']=='accepted' and result['projects']==values['projects'] and result['cash']==values['cash'] and result['errors']==[],result
 assert not errors,errors;print('PASS real browser batch authorizes limited terms but no project, fee, or IP transfer')
 c.close()
 c,p,errors=setup(390);p.locator('#modal [data-close-modal]').first.click();p.locator('#menu-toggle').click();p.locator('[data-view="dashboard"]').first.click();p.locator('#dashboard-focus').select_option('finance')
 assert p.locator('#dashboard-focus').input_value()=='finance';p.locator('#menu-toggle').click();p.locator('[data-view="settings"]').first.click()
 p.locator('#save-name-1').fill('Update46 mobile');p.locator('[data-save-slot="1"]').click();saved=json.loads(p.evaluate('localStorage.dump()'))
 c.close();c,p,errors=setup(390,seed=saved);assert p.locator('#new-game-form').count()==0
 p.locator('#menu-toggle').click();p.locator('[data-view="dashboard"]').first.click();assert p.locator('#dashboard-focus').input_value()=='finance'
 assert not errors,errors;print('PASS mobile dashboard layout survives a fresh document using explicit storage shim')
 c.close();browser.close()
print('UPDATE46 browser 3/3; real origin bound save persistence not tested')
