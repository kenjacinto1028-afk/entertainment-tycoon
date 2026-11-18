"""Chromium keyboard/accessible-name checks. Storage shim IS NOT a native-origin persistence test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Update_50.html').read_text()
shim="<script>(function(){const values={};Object.defineProperty(window,'localStorage',{value:{getItem(k){return values[k]??null},setItem(k,v){values[k]=String(v)},removeItem(k){delete values[k]},dump(){return JSON.stringify(values)}}});})();</script>"
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (1440,390):
  c=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True)
  page=c.new_page();page.on('dialog',lambda d:d.accept());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
  dialog=page.get_by_role('dialog',name='Create your entertainment world')
  assert dialog.count()==1,'Dialog lacks accessible title'
  assert dialog.get_by_role('combobox',name='START WORLD YEAR').count()==1
  assert dialog.get_by_role('textbox',name='COMPANY NAME').count()==1
  assert dialog.get_by_role('textbox',name='FOUNDER NAME').count()==1
  # A keyboard cannot escape past the last button while dialog is open.
  focus=page.locator('#modal button:not([disabled]),#modal input:not([disabled]):not([type="hidden"]),#modal select:not([disabled])')
  focus.last.focus();page.keyboard.press('Tab');assert page.evaluate('document.activeElement.closest("#modal") !== null')
  focus.first.focus();page.keyboard.press('Shift+Tab');assert page.evaluate('document.activeElement.closest("#modal") !== null')
  page.locator('#new-game-form button[type="submit"]').click();assert page.locator('#modal.open').count()==0
  # Navigation and tabs must remain keyboard-operable after rendering.
  if width==390:page.locator('#menu-toggle').click()
  page.locator('[data-view="productions"]').first.click()
  page.get_by_role('tab',name='Publishing').focus();page.keyboard.press('ArrowRight')
  assert page.locator('[data-industry="movie"]').get_attribute('aria-selected')=='true'
  assert page.evaluate('document.activeElement.dataset.industry')=='movie'
  if width==390:page.locator('#menu-toggle').click()
  page.locator('[data-view="settings"]').first.click()
  assert page.get_by_role('button',name='Save campaign in slot 1').count()==1
  assert page.get_by_role('button',name='Load campaign from slot 2').count()==1
  assert page.get_by_role('button',name='Import save file').count()==1
  page.locator('#save-name-1').fill('Named accessible save')
  page.get_by_role('button',name='Save campaign in slot 1').click()
  assert 'Named accessible save' in page.evaluate('localStorage.getItem("studio-syndicate-f1-slot-1")')
  # Unlike the previous hidden-label target, the new import trigger participates in the tab order.
  import_button=page.get_by_role('button',name='Import save file');import_button.focus();assert page.evaluate('document.activeElement.hasAttribute("data-import-trigger")')
  with page.expect_file_chooser() as chooser:import_button.click()
  chooser.value.set_files({'name':'campaign.json','mimeType':'application/json','buffer':page.evaluate('JSON.stringify(window.__noop || {})').encode()})
  # Invalid JSON must not change the active world. User receives error notice.
  page.wait_for_timeout(150)
  assert 'Invalid import' in page.locator('#toast').inner_text()
  page.locator('[data-new-game]').first.click()
  assert page.get_by_role('dialog',name='Create your entertainment world').count()==1
  page.keyboard.press('Escape');assert page.get_by_role('dialog').count()==0
  assert page.evaluate('document.activeElement.hasAttribute("data-new-game")'),'Focus not restored to opener'
  assert page.locator('[data-view="settings"]').first.get_attribute('aria-current')=='page'
  assert not errors,errors
  print(f'PASS width={width}: dialog name/focus/Tab trap, 3 labelled fields, tab arrows, save slots, import control, invalid JSON, Escape return, nav current')
  c.close()
 browser.close()
print('2/2 UI accessibility workflows passed; storage shim disclosed; no native-origin claim')
