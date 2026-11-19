"""Depth modes D6: 5-tab layout for Simple/Standard at widths 390 and 1360 (UI only)."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
TABS=['Dashboard','Projects','Market & Rivals','Company','Inbox']
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 def new_game(depth,width):
  ctx=browser.new_context(viewport={'width':width,'height':800});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option(depth)
  page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  return ctx,page,errors
 def tab(page,name):page.locator('#tab5 button',has_text=name).first.click();page.wait_for_timeout(100)
 def sub(page,name):page.locator('.subtabs5 button',has_text=name).first.click();page.wait_for_timeout(100)
 def current(page):return page.locator('#tab5 button[aria-current="page"]').get_attribute('data-tab5')
 for width in (390,1360):
  for depth in ('standard','simple'):
   ctx,page,errors=new_game(depth,width)
   names=[b.locator('span').nth(1).inner_text() for b in page.locator('#tab5 button').all()]
   assert [n.strip() for n in names][:5]==TABS,names
   assert page.locator('#tab5').is_visible() and not page.locator('.sidebar').is_visible()
   # no horizontal page scroll, tab bar inside the screen
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'h-scroll '+depth+str(width)
   box=page.locator('#tab5').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1
   # tabs reachable, sub-tabs work
   tab(page,'Projects');assert current(page)=='projects'
   subs=[b.inner_text() for b in page.locator('.subtabs5 button').all()]
   assert 'Productions' in subs and 'Teams' in subs,subs
   assert ('Library & Rights' in subs)==(depth=='standard'),subs
   sub(page,'Teams');assert page.locator('.subtabs5 button.active',has_text='Teams').count()==1
   tab(page,'Market');sub(page,'Industry News')
   tab(page,'Projects');assert page.locator('.subtabs5 button.active',has_text='Teams').count()==1,'remembers sub-tab'
   tab(page,'Company');subs=[b.inner_text() for b in page.locator('.subtabs5 button').all()]
   assert 'Financials' in subs and 'Settings' in subs and 'Saves' in subs,subs
   assert ('Career & Ownership' in subs)==(depth=='standard'),subs
   sub(page,'Settings');assert page.locator('[data-depth-switch]').count()>=1
   sub(page,'Saves');assert page.locator('[data-save-slot]').count()==3 and page.locator('[data-depth-switch]').count()==0
   # Top-right Settings and Saves buttons: visible on every screen, inside the window
   for v,h in (('saves','Saves'),('settings','Settings')):
    tb=page.locator(f'.top-actions [data-view="{v}"]');bb=tb.bounding_box();assert tb.is_visible() and bb['x']+bb['width']<=width,(v,bb)
    tb.click();page.wait_for_timeout(100);assert page.locator('#content h1').first.inner_text().startswith(h)
   tab(page,'Inbox');assert current(page)=='inbox' and page.locator('.subtabs5').count()==0
   tab(page,'Dashboard');assert current(page)=='dashboard'
   # advance button still reachable and not covered by the tab bar
   b=page.locator('#advance-decision');assert b.is_visible()
   bb=b.bounding_box();tb=page.locator('#tab5').bounding_box()
   assert not (width<=850 and bb['y']+bb['height']>tb['y']+1),'advance overlaps tabs'
   assert not errors,errors;ctx.close()
   print('PASS %s at %d'%(depth,width),flush=True)
 # Very Complex keeps today's menu; switching modes updates the layout at once
 ctx,page,errors=new_game('veryComplex',1360)
 assert page.locator('.sidebar').is_visible() and not page.locator('#tab5').is_visible() and page.locator('.subtabs5').count()==0
 page.locator('#main-nav [data-view="settings"],#secondary-nav [data-view="settings"]').first.click()
 page.locator('[data-depth-switch="standard"]').click();page.wait_for_timeout(200)
 assert page.locator('#tab5').is_visible() and not page.locator('.sidebar').is_visible()
 tab(page,'Company');sub(page,'Settings');page.locator('[data-depth-switch="veryComplex"]').click();page.wait_for_timeout(200)
 assert page.locator('.sidebar').is_visible() and not page.locator('#tab5').is_visible() and page.locator('.subtabs5').count()==0
 assert not errors,errors;ctx.close()
 print('PASS Very Complex keeps the left menu; live switching',flush=True)
 # keyboard: tab buttons reachable and keep focus after a click
 ctx,page,errors=new_game('standard',390)
 page.locator('#tab5 button',has_text='Projects').focus();page.keyboard.press('Enter');page.wait_for_timeout(100)
 assert page.evaluate("document.activeElement.dataset.tab5")=='projects'
 assert not errors,errors;ctx.close()
 print('PASS keyboard focus stays on tab',flush=True)
 browser.close()
