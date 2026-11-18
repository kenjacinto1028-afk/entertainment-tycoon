"""Depth modes D2: new-game depth picker and Settings depth switch (UI only)."""
import os,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
def start(browser):
 ctx=browser.new_context(viewport={'width':1360,'height':830});page=ctx.new_page();page.set_default_timeout(10000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 return ctx,page,errors
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 def new_game(depth):
  ctx,page,errors=start(browser)
  page.locator('#new-depth').select_option(depth)
  page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  return ctx,page,errors
 def week(page):
  m=re.search(r'YEAR (\d+) . WEEK (\d+)',page.locator('#top-date').text_content());return (int(m.group(1))-1)*52+int(m.group(2))
 # 1. Simple: new button is the main (highlighted) one and sits first.
 ctx,page,errors=new_game('simple')
 btn=page.locator('#advance-decision')
 assert btn.count()==1 and btn.is_visible()
 assert 'btn-primary' in btn.get_attribute('class')
 assert page.locator('.turn-actions [data-advance="13"].btn-primary').count()==0
 print('PASS Simple: Advance to next decision is the primary button',flush=True)
 # 2. Click: it moves forward (cap 52) and reports why it stopped.
 w0=week(page);btn.click()
 page.wait_for_function("()=>/stopped|decision needs you/.test(document.querySelector('#turn-msg').textContent)")
 moved=week(page)-w0;assert 1<=moved<=52,moved
 msg=page.locator('#turn-msg').text_content();assert 'No decisions for' in msg or 'decision needs you' in msg,msg
 print('PASS click advances',moved,'weeks:',msg,flush=True)
 # 3. Stops when a decision card opens: keep clicking until one does.
 for _ in range(12):
  if 'decision needs you' in page.locator('#turn-msg').text_content():break
  btn.click();page.wait_for_timeout(50)
 assert 'decision needs you' in page.locator('#turn-msg').text_content()
 assert page.locator('#turn-msg').text_content().count('Advanced')==1
 print('PASS stops when a decision card opens',flush=True)
 assert not errors,errors
 ctx.close()
 # 5. Standard: button present but not the primary one; +13 stays primary.
 ctx,page,errors=new_game('standard')
 btn=page.locator('#advance-decision')
 assert btn.is_visible() and 'btn-primary' not in btn.get_attribute('class')
 assert page.locator('.turn-actions [data-advance="13"].btn-primary').count()==1
 assert not errors,errors
 print('PASS Standard: button available, +13 weeks stays primary',flush=True)
 ctx.close()
 # 6. Narrow phone width: button still visible and reachable.
 ctx=browser.new_context(viewport={'width':390,'height':780});page=ctx.new_page();page.set_default_timeout(10000)
 page.on('dialog',lambda d:d.accept())
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 page.locator('#new-depth').select_option('simple')
 page.locator('#new-game-form button[type="submit"]').click()
 page.get_by_role('dialog').wait_for(state='detached')
 b=page.locator('#advance-decision');assert b.is_visible()
 box=b.bounding_box();assert box and box['x']>=-1 and box['x']+box['width']<=391,box
 print('PASS width 390: button fits on screen',flush=True)
 ctx.close()
