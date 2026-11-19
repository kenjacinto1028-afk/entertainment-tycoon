"""Tooltips and decluttering (UI only): tips appear on hover and tap, small print moves into tips, panels fold and remember, Very Complex shows everything."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
def start(pw,browser,mode,phone=False):
 ctx=browser.new_context(**pw.devices['iPhone 13']) if phone else browser.new_context(viewport={'width':1360,'height':830})
 page=ctx.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 page.locator('#new-depth').select_option(mode);page.locator('#new-game-form button[type="submit"]').click()
 page.get_by_role('dialog').wait_for(state='detached')
 return ctx,page,errors
def go(page,v):page.locator(f'[data-view="{v}"]').first.evaluate('b=>b.click()');page.wait_for_timeout(100)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 ctx,page,errors=start(pw,browser,'standard')
 assert page.locator('#content [data-tip]').count()>=15
 page.locator('#content .metric-top .has-tip').first.hover();page.wait_for_selector('#tip-pop:not([hidden])')
 assert 'Money' in page.locator('#tip-pop').text_content()
 go(page,'finance')
 assert page.locator('#content .tip-moved').count()>0
 assert page.locator('#content .is-folded').count()>0
 assert page.locator('[data-borrow]').count()==1
 title=page.locator('#content .fold-toggle').first.get_attribute('data-fold-toggle')
 page.locator('#content .fold-toggle').first.click()
 go(page,'dashboard');go(page,'finance')
 assert page.locator(f'#content .fold-toggle[data-fold-toggle="{title}"]').text_content()=='Hide'
 assert not errors,errors
 print('PASS Standard: hover tips, small print moved, panels fold and remember, one loan button',flush=True)
 ctx.close()
 ctx,page,errors=start(pw,browser,'veryComplex');go(page,'finance')
 assert page.locator('#content .tip-moved').count()==0 and page.locator('#content .is-folded').count()==0
 assert page.locator('#content [data-tip]').count()>=15
 assert not errors,errors
 print('PASS Very Complex: tips on, nothing hidden or folded',flush=True)
 ctx.close()
 ctx,page,errors=start(pw,browser,'simple',phone=True)
 page.locator('#content .metric-top .has-tip').first.tap();page.wait_for_selector('#tip-pop:not([hidden])')
 page.locator('#content .metric-top .has-tip').first.tap();page.wait_for_selector('#tip-pop[hidden]',state='attached')
 assert not errors,errors
 print('PASS Simple phone: tap shows and hides a tip',flush=True)
 ctx.close();browser.close()
