"""Update44 desktop/mobile Chromium workflows and emulated durable browser storage.
Real navigation is administratively blocked in this tool environment (both local server and
file://); use a transparent localStorage shim and separately validate save import/export.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'Studio_Syndicate_Playable_Update_44.html').read_text()
# Mock only browser origin storage. UI, engine and export blob behavior are real Chromium JS.
def mount(page, seed=None):
 stub='''<script>(function(){const db=JSON.parse(%s);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(db,k)?db[k]:null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]},clear(){Object.keys(db).forEach(k=>delete db[k])},dump(){return JSON.stringify(db)}}});})();</script>'''%json.dumps(json.dumps(seed or {}))
 page.set_content(HTML.replace('<head>', '<head>'+stub,1), wait_until='domcontentloaded')

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def make(width=1440,height=950,seed=None):
  c=browser.new_context(accept_downloads=True,viewport={'width':width,'height':height});p=c.new_page();p.set_default_timeout(15000)
  err=[];p.on('pageerror',lambda e:err.append(str(e)));p.on('dialog',lambda d:d.accept());mount(p,seed)
  return c,p,err
 context,page,errors=make()
 page.locator('#new-game-form button[type="submit"]').click()
 assert page.locator('#top-date').inner_text().startswith('YEAR 1')
 page.locator('[data-view="settings"]').first.click()
 page.locator('#save-name-1').fill('Origin durability')
 page.locator('[data-save-slot="1"]').click()
 assert 'Origin durability' in page.evaluate('localStorage.getItem("studio-syndicate-f1-slot-1")')
 before=page.evaluate('JSON.parse(localStorage.getItem("studio-syndicate-f1-autosave")).week')
 page.locator('[data-view="dashboard"]').first.click();page.locator('[data-advance="1"]').first.click()
 after=page.evaluate('JSON.parse(localStorage.getItem("studio-syndicate-f1-autosave")).week')
 assert after>before,(before,after)
 saved=json.loads(page.evaluate('localStorage.dump()'))
 context.close()
 context,page,errors2=make(seed=saved); errors+=errors2
 assert page.locator('#new-game-form').count()==0, 'saved state did not restore'
 assert page.evaluate('JSON.parse(localStorage.getItem("studio-syndicate-f1-autosave")).week')==after
 page.locator('[data-view="settings"]').first.click()
 page.locator('[data-load-slot="1"]').click()
 assert page.evaluate('JSON.parse(localStorage.getItem("studio-syndicate-f1-autosave")).week')==before
 page.locator('[data-view="settings"]').first.click()
 with page.expect_download() as transfer:
  page.locator('[data-export]').first.click()
 download=transfer.value
 exported=ROOT/'reports'/'UPDATE_44_BROWSER_EXPORTED_SAVE.json'
 download.save_as(exported)
 assert exported.stat().st_size>10000 and 'version' in exported.read_text()[:2000]
 page.locator('#import-file').set_input_files(str(exported))
 assert page.locator('#content h1').count()>0
 page.locator('[data-view="settings"]').first.click()
 page.locator('#theme-in-settings').click()
 assert page.evaluate('localStorage.getItem("studio-syndicate-theme")') in ('light','dark')
 assert not errors,errors
 print('PASS simulated durable storage across new document, named save rollback, real JSON backup/export/import, theme, no JS errors')
 context.close()

 context,phone,errs=make(390,844)
 phone.locator('#modal [data-close-modal]').first.click();phone.locator('#menu-toggle').click()
 phone.locator('[data-view="settings"]').first.click()
 assert phone.locator('#management43-form').count()==1
 phone.locator('#menu-toggle').click();phone.locator('[data-view="world"]').first.click()
 assert 'World' in phone.locator('#content h1').first.inner_text()
 assert not errs,errs
 print('PASS mobile 390px drawer, settings controls, world, no JS errors')
 context.close()

 context,keyboard,errs=make()
 keyboard.locator('#modal [data-close-modal]').first.click()
 keyboard.keyboard.press('Tab')
 focused=keyboard.evaluate('document.activeElement && document.activeElement.tagName')
 assert focused in ('BUTTON','A','INPUT','SELECT'), focused
 keyboard.locator('[data-view="settings"]').first.click()
 assert keyboard.locator('#save-name-1').get_attribute('aria-label')
 assert not errs,errs
 print('PASS keyboard focus, labelled save slots and accessible navigation basics')
 context.close();browser.close()
print('UPDATE44 browser 3/3; origin-bound persistence cannot be measured in this restricted environment')
