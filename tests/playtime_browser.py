"""Playtime counter: top-bar clock, Playtime panel, idle pause, slot label, overall total (UI)."""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
shim='''<script>(function(){const items={};Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return items[k]??null},setItem(k,v){items[k]=String(v)},removeItem(k){delete items[k]}}});})();</script>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 ctx=browser.new_context(viewport={'width':1360,'height':830});page=ctx.new_page();page.set_default_timeout(10000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.clock.install()
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 # The all-games total lives in its own browser key; pretend 5000 s were played in earlier games.
 page.evaluate("()=>localStorage.setItem('studio-syndicate-playtime-total','5000')")
 page.locator('#new-game-form button[type="submit"]').click()
 page.get_by_role('dialog').wait_for(state='detached')
 total=lambda:page.evaluate("()=>Number(localStorage.getItem('studio-syndicate-playtime-total'))")
 clock=lambda:page.locator('#top-playtime').inner_text().strip()
 page.mouse.click(5,400);page.clock.run_for(45000)
 assert 5040<=total()<=5050,total()
 assert page.locator('#top-playtime').is_visible() and clock().startswith('⏱ ') and clock().endswith('s'),clock()
 page.clock.run_for(20000);assert clock()=='⏱ 1m',clock()
 print('PASS clock counts while active and shows in the top bar',flush=True)
 # Idle: no input for longer than the idle limit -> stops counting; input resumes it.
 page.clock.run_for(10*60*1000);a=total();assert a<=5000+65+300+5,a
 page.clock.run_for(60000);assert total()==a,(a,total())
 page.mouse.click(5,400);page.clock.run_for(30000);assert total()>=a+25,(a,total())
 print('PASS pauses after idle limit and resumes on input',flush=True)
 # Playtime panel: this save (~6 min) vs all games (~1h 29m).
 page.locator('[data-view="settings"]').first.evaluate('b=>b.click()')
 this_save=page.locator('#playtime-save').inner_text();all_games=page.locator('#playtime-total').inner_text()
 assert this_save.endswith('m') and 'h' not in this_save,this_save
 assert all_games.startswith('1h '),all_games
 print('PASS Playtime panel shows this save and all games separately',(this_save,all_games),flush=True)
 page.locator('[data-save-slot="1"]').first.click();page.clock.run_for(2000)
 page.locator('[data-view="settings"]').first.evaluate('b=>b.click()')
 slot=page.evaluate("()=>JSON.parse(localStorage.getItem('studio-syndicate-f1-slot-1')).playtimeSec")
 assert slot>=300,slot
 assert 'played '+this_save in page.locator('main, body').first.inner_text(),'slot label missing'
 print('PASS save slot stores and shows its playtime',flush=True)
 assert not errors,errors
 ctx.close();browser.close()
