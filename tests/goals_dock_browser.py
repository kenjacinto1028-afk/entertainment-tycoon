"""Pinned goals window: visible on every screen, PC and phone, never covers the turn bar or tab bar."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
def below(a,b):return a['y']+a['height']<=b['y']+1
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for width,height in ((1360,860),(390,780),(768,1024)):
  for depth in ('standard','simple','veryComplex'):
   ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=True);page=ctx.new_page();page.set_default_timeout(10000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
   page.locator('#new-depth').select_option(depth)
   page.locator('#new-game-form button[type="submit"]').click()
   page.get_by_role('dialog').wait_for(state='detached')
   dock=page.locator('#goals-dock');dock.wait_for()
   phone=width<=850
   assert ('gd-closed' in dock.get_attribute('class'))==phone,('default fold',width,depth)
   if phone:page.locator('#goals-dock-toggle').click()
   assert page.locator('#goals-dock-body').is_visible()
   # nothing picked yet: all goals listed with Pin buttons
   assert page.locator('[data-goal-pin]').count()==5,'five goals listed'
   page.locator('[data-goal-pin="first_release"]').click()
   assert 'Goals 0/1' in page.locator('#goals-dock-toggle').inner_text()
   assert page.locator('[data-goal-pin]').count()==0,'only picked goals once one is pinned'
   assert 'First release' in page.locator('#goals-dock-body').inner_text()
   # dock stays above the turn bar (and the phone tab bar) and inside the screen
   bb=dock.bounding_box();bar=page.locator('.turnbar').bounding_box()
   assert below(bb,bar),('dock covers turn bar',width,depth,bb,bar)
   assert bb['x']>=0 and bb['x']+bb['width']<=width+1,('dock off screen',bb)
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'h-scroll'
   # stays on screen after moving to another screen and advancing a week
   page.locator('[data-goal-jump]').click()
   page.locator('[data-advance="1"]').click();page.wait_for_timeout(150)
   if phone:  # on phones following the adviser folds the card so the new screen is visible
    assert not page.locator('#goals-dock-body').is_visible();page.locator('#goals-dock-toggle').click()
   assert page.locator('#goals-dock-body').is_visible() and 'Goals 0/1' in page.locator('#goals-dock-toggle').inner_text()
   # fold and unfold
   page.locator('#goals-dock-toggle').click()
   assert not page.locator('#goals-dock-body').is_visible() and page.locator('#goals-dock-toggle').get_attribute('aria-expanded')=='false'
   page.locator('#goals-dock-toggle').click();assert page.locator('#goals-dock-body').is_visible()
   # choose more goals, unpin
   page.locator('[data-goal-all]').click();page.locator('[data-goal-pin="first_release"]').click()
   assert page.locator('[data-goal-pin]').count()==5
   assert not errors,errors
   ctx.close()
 browser.close()
print('PASS goals dock: PC 1360, phone 390, tablet 768 x simple/standard/veryComplex')
