"""Guided tutorial + Help button (UI only, no save fields): offer after a new game, steps tick off from real actions, per-mode text, Help modal."""
import os,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text(encoding='utf-8')
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
def card(page):return page.locator('#guide-card').inner_text()
def step(page):m=re.search(r'STEP (\d+) OF 10',card(page)) or re.search(r'Tutorial (\d+)/10',card(page));return int(m.group(1)) if m else 0
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for depth,width in [('standard',1360),('veryComplex',1360),('simple',390)]:
  ctx=browser.new_context(viewport={'width':width,'height':844});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  page.locator('#new-depth').select_option(depth);page.locator('#new-game-form button[type="submit"]').click()
  page.get_by_role('dialog').wait_for(state='detached')
  assert 'New to Studio Syndicate' in card(page)
  page.click('#guide-card [data-guide="start"]');assert 'STEP 1 OF 10' in card(page)
  page.click('#guide-card [data-guide="ack"]');assert 'STEP 2 OF 10' in card(page)
  assert page.locator('.guide-glow[data-project]').count()==1
  page.click('.guide-glow');page.fill('#project-form [name="title"]','Guide Book');page.click('#project-form button[type="submit"]')
  assert 'STEP 3 OF 10' in card(page);page.click('#advance-decision');assert 'STEP 4 OF 10' in card(page)
  assert ('left menu' in card(page))==(depth=='veryComplex'),depth
  page.click('.guide-glow');n=step(page);assert n>=5,card(page)  # a long advance may already have released the book
  page.click('#guide-card [data-guide="minimize"]');assert step(page)==n
  page.click('#guide-card [data-guide="expand"]');page.click('#guide-card [data-guide="stop"]');assert page.locator('#guide-card').count()==0
  page.click('#guide-help-btn');assert page.get_by_role('dialog').locator('text=The basics').count()==1
  page.click('#modal [data-guide="start"]');assert 'STEP 1 OF 10' in card(page);page.click('#guide-card [data-guide="ack"]');assert 'STEP 3 OF 10' in card(page),'restart skips the finished first-project step'
  assert not errors,errors;ctx.close()
  print('PASS guide',depth,width,flush=True)
 browser.close()
