"""Depth modes D5: screens and panels hidden per depth mode (UI only)."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 def new_game(depth):
  ctx=browser.new_context(viewport={'width':1360,'height':830});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option(depth)
  page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  return ctx,page,errors
 def go(page,v):
  page.locator('#main-nav [data-view="%s"],#secondary-nav [data-view="%s"]'%(v,v)).first.evaluate('b=>{b.hidden=false;b.click()}')
  page.wait_for_timeout(100)
 def has(page,text):return page.locator('#content h2.panel-heading',has_text=text).count()>0
 def nav_visible(page,v):return page.locator('#main-nav [data-view="%s"]'%v).is_visible()
 # Very Complex: everything shown
 ctx,page,errors=new_game('veryComplex')
 assert nav_visible(page,'library') and nav_visible(page,'career')
 go(page,'finance');assert has(page,'Active obligations'),'VC finance'
 go(page,'settings');assert has(page,'Decision depth') and has(page,'Game depth')
 print('PASS Very Complex shows everything',flush=True)
 # switch to Simple mid-game
 go(page,'settings')
 page.locator('[data-depth-switch="simple"]').click();page.wait_for_timeout(200)
 assert not nav_visible(page,'library') and not nav_visible(page,'career')
 assert not has(page,'Decision depth') and has(page,'Game depth')
 go(page,'finance');assert not has(page,'Active obligations') and not has(page,'Balance sheet')
 print('PASS switching to Simple updates screens at once',flush=True)
 # hidden view falls back to Overview
 page.evaluate("view='library';render()") if False else None
 page.locator('[data-view="library"]').first.evaluate('b=>b.click()');page.wait_for_timeout(100)
 assert page.locator('#main-nav [data-view="dashboard"][aria-current="page"]').count()==1
 print('PASS hidden screen falls back to Overview',flush=True)
 # back to Very Complex
 go(page,'settings');page.locator('[data-depth-switch="veryComplex"]').click();page.wait_for_timeout(200)
 assert nav_visible(page,'library') and has(page,'Decision depth')
 go(page,'finance');assert has(page,'Active obligations')
 print('PASS back to Very Complex restores everything',flush=True)
 assert not errors,errors;ctx.close()
 # Standard
 ctx,page,errors=new_game('standard')
 assert nav_visible(page,'library') and nav_visible(page,'career')
 go(page,'finance');assert not has(page,'Active obligations') and not has(page,'Subsidiary financial closes')
 go(page,'settings');assert not has(page,'Decision depth') and has(page,'Game depth')
 assert not errors,errors;ctx.close()
 print('PASS Standard hides very detailed panels, keeps menu',flush=True)
 ctx,page,errors=new_game('simple')
 assert not nav_visible(page,'library') and nav_visible(page,'productions') and nav_visible(page,'finance')
 assert not errors,errors;ctx.close()
 print('PASS Simple menu',flush=True)
 browser.close()
