"""R4 genre fatigue: greenlight form shows the crowded-genre note when demand is cut, and hides it otherwise."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for width in (1360,390):
  page=browser.new_page(viewport={'width':width,'height':830});page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option('standard')
  page.locator('#new-game-form button[type="submit"]').click();page.get_by_role('dialog').wait_for(state='detached')
  opener=page.locator('[data-project="publishing"]').first
  def open_form():
   page.evaluate("document.querySelector('[data-project=\"publishing\"]').click()");page.locator('#project-form').wait_for()
   page.locator('#forecast-panel .forecast-section').first.wait_for()
  open_form()
  assert page.locator('#genre-fatigue-note').count()==0,'note shown in a quiet world'
  page.locator('#project-form .modal-close, #project-form ~ * .modal-close, .modal-close').first.click()
  # Make every genre crowded by lowering the free allowance in the shared config.
  page.evaluate("StudioEngine.CONFIG.depth.GENRE_FATIGUE.free.publishing=-100")
  open_form()
  note=page.locator('#genre-fatigue-note');note.wait_for()
  text=note.text_content();assert 'Crowded genre' in text and '30% less demand' in text,text
  assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),'horizontal scroll'
  page.locator('#project-form [name="route"]').select_option('contract');page.wait_for_timeout(300)
  assert page.locator('#genre-fatigue-note').count()==0,'note shown for a client job'
  assert not errors,errors
  print('PASS greenlight crowded-genre note at width',width,flush=True)
  page.close()
 browser.close()
print('R4 browser 2/2')
