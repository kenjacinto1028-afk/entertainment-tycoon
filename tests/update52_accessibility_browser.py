"""Update52 native DOM/ARIA keyboard checks, with an explicit localStorage double.
Not an independent screen-reader test and not a real origin persistence test.
"""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for width in [1360,390]:
  ctx=browser.new_context(viewport={'width':width,'height':830});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  modal=page.get_by_role('dialog',name='Create your entertainment world')
  assert modal.count()==1 and modal.get_attribute('aria-modal')=='true'
  assert modal.get_by_role('textbox',name='COMPANY NAME').count()==1
  modal.locator('button').last.focus();page.keyboard.press('Tab')
  assert page.evaluate('document.activeElement.closest("#modal")!==null')
  page.locator('#new-game-form button[type="submit"]').click()
  assert page.get_by_role('dialog').count()==0
  # D6: Standard uses the 5-tab layout; Game & Saves lives under Company
  page.locator('#tab5 [data-tab5="company"]').click()
  page.locator('.subtabs5 [data-view="settings"]').click()
  page.get_by_role('button',name='Load campaign from slot 2').click()
  page.wait_for_function("()=>document.querySelector('#toast')?.textContent?.includes('Load slot failed')")
  assert page.get_by_role('alert').count()==1
  assert page.locator('#toast').get_attribute('aria-live')=='assertive'
  page.locator('#save-name-1').fill('Checkpoint with clear labels')
  page.get_by_role('button',name='Save campaign in slot 1').click()
  page.wait_for_function("()=>document.querySelector('#toast')?.textContent?.includes('Campaign saved')")
  assert page.get_by_role('status').count()==1
  assert page.locator('#toast').get_attribute('aria-live')=='polite'
  page.locator('[data-new-game]').first.click();assert page.get_by_role('dialog',name='Create your entertainment world').count()==1
  page.keyboard.press('Escape');assert page.get_by_role('dialog').count()==0
  assert page.evaluate('document.activeElement.hasAttribute("data-new-game")')
  assert not errors,errors
  print(f'PASS width={width}: dialog focus, named labels, critical alert, ordinary status, escape focus return',flush=True)
  ctx.close()
 browser.close()
print('NOTE: localStorage is a test double; independent NVDA/VoiceOver and native origin remain unverified.')
