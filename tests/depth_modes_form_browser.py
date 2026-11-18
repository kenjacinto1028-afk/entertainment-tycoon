"""Depth modes: Greenlight form fields hidden per mode (UI only)."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
HIDDEN={'veryComplex':[],
 'standard':['leadCharacter','theme','targetAudience','positioning','flagship','productionRegion','teamId'],
 'simple':['leadCharacter','theme','targetAudience','positioning','flagship','productionRegion','teamId','format','marketing']}
SHOWN=['title','route','genre','size','direction','fundingMode']
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for depth in ['veryComplex','standard','simple']:
  ctx=browser.new_context(viewport={'width':1360,'height':830});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option(depth)
  page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  page.evaluate("document.querySelector('[data-project=publishing]').click()")
  page.locator('#project-form').wait_for()
  vis=lambda n:page.locator('#project-form [name="%s"]'%n).first.is_visible()
  for n in SHOWN:assert vis(n),(depth,'should show',n)
  for n in HIDDEN['veryComplex']+HIDDEN['simple']:
   assert vis(n)==(n not in HIDDEN[depth]),(depth,n,vis(n))
  page.fill('#project-form [name="title"]','Form Test '+depth)
  page.locator('#project-form button[type="submit"]').click();page.wait_for_timeout(300)
  assert page.locator('#project-form').count()==0 or not errors,(depth,'submit')
  assert not errors,errors
  print('PASS Greenlight form fields for',depth,flush=True)
  ctx.close()
 browser.close()
