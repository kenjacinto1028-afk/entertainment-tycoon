"""Mobile M1: phone polish at widths 360, 390 and 768 (UI only)."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 def new_game(depth,width):
  ctx=browser.new_context(viewport={'width':width,'height':780},has_touch=True);page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option(depth)
  page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  return ctx,page,errors
 for width in (360,390,768):
  for depth in ('standard','simple','veryComplex'):
   ctx,page,errors=new_game(depth,width)
   views=[('dashboard',None)]
   if depth!='veryComplex':
    for t in page.locator('#tab5 button').all()[:5]:
     name=t.get_attribute('data-tab5');page.locator('#tab5 button[data-tab5="%s"]'%name).click()
     n=page.locator('.subtabs5 button').count()
     for i in range(max(n,1)):
      if n:page.locator('.subtabs5 button').nth(i).click()
      page.wait_for_timeout(80)
      assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'h-scroll %s %s %d %d'%(depth,name,i,width)
      if width<=600:
       small=page.evaluate("[...document.querySelectorAll('#content .btn,#content .panel-link,#content .tab')].filter(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.height<43.5}).map(e=>e.textContent.trim().slice(0,20))")
       assert not small,('small tap targets',depth,name,small)
   # bottom bar: advance buttons tall enough and not covered by the tab bar
   if width<=600:
    for s in ('#advance-decision','[data-advance="1"]','[data-advance="4"]','[data-advance="13"]'):
     bb=page.locator(s).bounding_box();assert bb['height']>=43.5,(s,bb)
    if depth!='veryComplex':
     tb=page.locator('#tab5').bounding_box();bar=page.locator('.turnbar').bounding_box()
     assert bar['y']+bar['height']<=tb['y']+1,'turn bar overlaps tabs'
   assert not errors,errors;ctx.close()
   print('PASS %s at %d'%(depth,width),flush=True)
 # folded panel opens on tap
 ctx,page,errors=new_game('standard',390)
 page.locator('#tab5 button[data-tab5="market"]').click();page.wait_for_timeout(150)
 assert page.locator('.m1-more').count()>=1,'no folded panels'
 h0=page.locator('.m1-more').first.evaluate('e=>e.closest(".panel").offsetHeight')
 page.locator('.m1-more').first.click();page.wait_for_timeout(100)
 h1=page.locator('.panel',has=page.locator('.m1-more')).first.evaluate('e=>e.offsetHeight')
 assert h1>h0,(h0,h1);assert not errors,errors;ctx.close()
 # toast sits above the bottom bars
 ctx,page,errors=new_game('standard',390)
 page.evaluate("(()=>{const t=document.getElementById('toast');t.textContent='Test message';t.className='toast visible'})()");page.wait_for_timeout(100)
 tb=page.locator('#toast').bounding_box();bar=page.locator('.turnbar').bounding_box()
 assert tb['y']+tb['height']<=bar['y']+1,'toast covers bottom bar';ctx.close()
 print('PASS folded panels and toast',flush=True)
 browser.close()
