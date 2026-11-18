"""Current Update48 store buttons on real Chromium, explicit storage shim, no origin-persistence claim."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];html=(root/'Studio_Syndicate_Playable_Update_48.html').read_text()
shim='''<script>(function(){const db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return db[k]??null},setItem(k,v){db[k]=String(v)},removeItem(k){delete db[k]}}});})();</script>'''
testhtml=html.replace('\ninit();\n})();','\nwindow.__testE=E;window.__testS=()=>S;window.__testRefresh=()=>render();\ninit();\n})();')
assert testhtml!=html
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':1360,'height':900});p=c.new_page()
 issues=[];p.on('pageerror',lambda e:issues.append(str(e)));p.on('dialog',lambda d:d.accept());p.set_content(testhtml.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 p.locator('#new-era').select_option('25');p.locator('#new-origin').select_option('games');p.locator('[name="startingCapital"]').select_option('funded');p.locator('#new-game-form button[type="submit"]').click()
 data=p.evaluate('''() => {const E=window.__testE,s=window.__testS();const own=E.createProject(s,{sector:'games',title:'UI First Party',route:'original',size:.6});for(let i=0;i<90&&own.status==='active';i++)E.advance(s,1);if(own.status!=='released')throw Error('No game release');window.__testRefresh();return {own:own.id,cash:E.player(s).finance.cash};}''')
 p.locator('[data-view="productions"]').first.click();p.locator('[data-industry="games"]').click()
 assert p.locator('[data-game-open-store]').count()==1
 p.locator('[data-game-open-store]').click();assert p.locator('[data-game-list-owned]').count()==1
 p.locator('[data-game-list-owned]').first.click();assert 'first party' in p.locator('#content').inner_text().lower()
 details=p.evaluate('''() => {const E=window.__testE,s=window.__testS(),p=s.projects.find(x=>x.title==='UI First Party');const old=p.videoGame.platformFees;E.gameSelectStore(s,p.id,s.gameStores[0].id);E.advance(s,1);return {oldFee:old,newFee:p.videoGame.platformFees,gross:p.stats.totalSales,audit:E.audit(s)};}''')
 assert details['oldFee']==details['newFee'] and details['gross']>0 and details['audit']==[],details
 p.locator('[data-game-subscribe]').click();assert p.evaluate('window.__testS().gameStores[0].subscribed') is True
 assert not issues,issues
 print('PASS Update48 Chromium: launch real-money game store, list first-party work, book no fake commission, enable subscriptions and audit')
 c.close();b.close()
