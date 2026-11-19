"""Popup buttons work inside a sandboxed preview frame (no allow-forms / allow-modals), PC and phone."""
import os,sys,tempfile,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
tmp=Path(tempfile.mkdtemp())
shutil.copy(root/'Studio_Syndicate_Playable_Handoff.html',tmp/'game.html')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 for w,h in [(1360,830),(390,844)]:
  (tmp/'host.html').write_text('<body style="margin:0"><iframe id="f" sandbox="allow-scripts allow-same-origin" src="game.html" style="border:0;width:%dpx;height:%dpx"></iframe>'%(w,h))
  page=browser.new_page(viewport={'width':w,'height':h});page.set_default_timeout(5000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto((tmp/'host.html').as_uri());page.wait_for_timeout(800);fr=page.frames[1]
  fr.locator('#new-game-form button[type=submit]').click();fr.locator('#new-game-form').wait_for(state='detached')
  fr.locator('[data-project]').first.click();fr.locator('#project-form').wait_for()
  fr.locator('#project-form button[type=submit]').click()
  assert fr.locator('#project-form .field-error-msg').count()==1,'missing-field message'
  fr.fill('#project-form [name="title"]','Sandbox Book')
  fr.locator('#project-form button[type=submit]').click();fr.locator('#project-form').wait_for(state='detached')
  click="()=>{const b=document.createElement('button');b.setAttribute('data-gov-incorporate','');document.getElementById('content').appendChild(b);b.click();b.remove()}"
  fr.evaluate(click);assert 'again to confirm' in fr.locator('#toast').inner_text(),'confirm fallback'
  fr.evaluate(click);assert 'again to confirm' not in fr.locator('#toast').inner_text(),'confirm second click'
  assert not errors,errors
  print('PASS popup buttons in sandboxed frame',w,flush=True)
  page.close()
 browser.close()
shutil.rmtree(tmp,ignore_errors=True)
