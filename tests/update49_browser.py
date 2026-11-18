"""Current Update49 browser UI. Storage is a SHIM; native-origin persistence is separately probed."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'Studio_Syndicate_Playable_Update_49.html').read_text()
shim='''<script>(function(){const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return db[k]??null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]}}});})();</script>'''
patched=HTML.replace('\ninit();\n})();','\nwindow.__testE=E;window.__testS=()=>S;window.__testRefresh=()=>render();\ninit();\n})();')
assert patched!=HTML
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for viewport in [1350,390]:
  c=b.new_context(viewport={'width':viewport,'height':900},accept_downloads=True);p=c.new_page();errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
  p.set_content(patched.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded');p.set_default_timeout(13000)
  p.locator('#new-era').select_option('25');p.locator('#new-origin').select_option('games');p.locator('[name="startingCapital"]').select_option('funded');p.locator('#new-game-form button[type="submit"]').click()
  games=p.evaluate('''() => {const E=window.__testE,S=window.__testS();let p=E.createProject(S,{sector:'games',title:'Browser Platform Finance',route:'original',size:.55});E.gameDesign(S,p.id,{platform:'pc',mechanic:'strategy',scope:'focused'});for(let i=0;i<100&&p.status==='active';i++)E.advance(S,1);if(p.status!=='released')throw Error('No game release');window.__testRefresh();return {id:p.id};}''')
  if viewport==390:p.locator('#menu-toggle').click()
  p.locator('[data-view="productions"]').first.click();p.locator('[data-industry="games"]').click()
  assert p.get_by_text('Platform installed audiences',exact=False).count()>=1
  assert p.get_by_text('Ongoing game community',exact=False).count()>=1
  assert p.locator('[data-u49-action="start"]').count()>=1
  p.locator('[data-u49-action="start"]').first.click()
  d=p.evaluate('''() => {const E=window.__testE,S=window.__testS();const g=S.projects.find(x=>x.title==='Browser Platform Finance').videoGame;return {status:g.liveService49?.status,paid:g.liveService49?.totalPaid,audit:E.audit(S)};}''')
  assert d['status']=='active' and d['paid']==1250 and d['audit']==[],d
  p.locator('[data-u49-action="pause"]').first.click()
  assert p.evaluate("window.__testS().projects.find(x=>x.title==='Browser Platform Finance').videoGame.liveService49.status")=='paused'
  p.locator('[data-u49-action="resume"]').first.click()
  p.locator('[data-u49-action="stop"]').first.click()
  result=p.evaluate('''() => {const E=window.__testE,S=window.__testS();const g=S.projects.find(x=>x.title==='Browser Platform Finance').videoGame;return {status:g.liveService49.status,paid:g.liveService49.totalPaid,audit:E.audit(S)};}''')
  assert result['status']=='closed' and result['paid']==2500 and result['audit']==[],result
  # Confirm visible buttons have useful accessible names for keyboard interaction.
  assert p.locator('[data-industry="games"]').get_attribute('role')=='tab'
  p.locator('[data-industry="games"]').focus()
  assert p.evaluate("document.activeElement.getAttribute('data-industry')")=='games'
  assert not errors,errors
  print('PASS Update49 browser',viewport,'platform cards, paid recurring event controls, keyboard tab focus, clean audit')
  c.close()
 b.close()
print('UPDATE49 BROWSER 2/2, explicit in-memory storage shim only')
