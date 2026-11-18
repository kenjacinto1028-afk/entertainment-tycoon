"""Depth modes D2: new-game depth picker and Settings depth switch (UI only)."""
import os,sys
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
 # 1. Default: Standard preselected, game starts as Standard.
 ctx,page,errors=start(browser)
 sel=page.locator('#new-depth')
 assert sel.count()==1
 assert sel.input_value()=='standard'
 assert [o.get_attribute('value') for o in sel.locator('option').all()]==['simple','standard','veryComplex']
 page.locator('#new-game-form button[type="submit"]').click()
 page.get_by_role('dialog').wait_for(state='detached')
 page.locator('[data-view="settings"]').first.evaluate('b=>b.click()')  # D6: left menu is hidden in Simple/Standard
 assert page.locator('[data-depth-switch]').count()==2
 assert page.locator('[data-depth-switch="standard"]').count()==0
 assert not errors,errors
 print('PASS new game defaults to Standard; Settings shows two switch buttons',flush=True)
 # 2. Switch to Very Complex in Settings, then Simple.
 page.locator('[data-depth-switch="veryComplex"]').click()
 page.wait_for_function("()=>document.querySelector('#toast')?.textContent?.includes('Very Complex')")
 assert page.locator('[data-depth-switch="veryComplex"]').count()==0
 assert page.locator('[data-depth-switch="simple"]').count()==1
 page.locator('[data-depth-switch="simple"]').click()
 page.wait_for_function("()=>document.querySelector('#toast')?.textContent?.includes('Simple')")
 assert page.locator('[data-depth-switch="standard"]').count()==1
 assert not errors,errors
 print('PASS Settings switch to Very Complex and Simple',flush=True)
 ctx.close()
 # 3. Picking Simple on the new-game screen starts a Simple game.
 ctx,page,errors=start(browser)
 page.locator('#new-depth').select_option('simple')
 page.locator('#new-game-form button[type="submit"]').click()
 page.get_by_role('dialog').wait_for(state='detached')
 page.locator('[data-view="settings"]').first.evaluate('b=>b.click()')  # D6: left menu is hidden in Simple/Standard
 assert page.locator('[data-depth-switch="simple"]').count()==0
 assert page.locator('[data-depth-switch="standard"]').count()==1
 assert not errors,errors
 print('PASS new game with Simple starts as Simple',flush=True)
 ctx.close()
