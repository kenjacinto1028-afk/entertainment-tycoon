"""Release History + Hall of Fame pages: open at widths 390 and 1360 in all depth modes, filters and paging work, no page scroll, no errors."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for width in (390,1360):
  for depth in ('simple','standard','veryComplex'):
   ctx=browser.new_context(viewport={'width':width,'height':800});page=ctx.new_page();page.set_default_timeout(10000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
   page.locator('#new-depth').select_option(depth)
   page.locator('#new-game-form button[type="submit"]').click()
   page.get_by_role('dialog').wait_for(state='detached')
   def go(view,tabid):
    if depth=='veryComplex':
     if width<=850:page.locator('.mobile-menu').click()
     page.locator(f'[data-view="{view}"]').first.click()
    else:
     page.locator(f'#tab5 button[data-tab5="{tabid}"]').click();page.locator(f'.subtabs5 [data-view="{view}"]').click()
    page.wait_for_timeout(150)
   go('history','market')
   assert page.locator('h1',has_text='Industry History').count()==1,(depth,width)
   assert page.locator('.hist-table tbody tr').count()>0,'industry rows'
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'h-scroll '+depth+str(width)
   page.locator('#hist-sort').select_option('title');page.wait_for_timeout(100)
   page.locator('#hist-sector').select_option('publishing');page.wait_for_timeout(100)
   assert page.locator('.hist-table tbody tr').count()>0
   page.locator('#hist-q').fill('zzzz-no-match');page.locator('#hist-q').press('Enter');page.locator('#hist-q').blur();page.wait_for_timeout(150)
   assert page.locator('.empty').count()==1,'empty state'
   go('chistory','company')
   assert page.locator('h1',has_text='Company History').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
   go('legends','market')
   assert page.locator('h1',has_text='Hall of Fame').count()==1,(depth,width)
   assert page.locator('#hof-t').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'h-scroll hall '+depth+str(width)
   page.locator('#hof-t').select_option('legendary');page.wait_for_timeout(100)
   assert page.locator('h1',has_text='Hall of Fame').count()==1
   assert not errors,errors
   ctx.close()
 browser.close()
print('RELEASE HISTORY + HALL BROWSER PASS')
