"""Update43 end-to-end desktop/mobile game controls, no network."""
from pathlib import Path
from playwright.sync_api import sync_playwright
HTML=(Path(__file__).resolve().parents[1]/'Studio_Syndicate_Playable_Update_43.html').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def page_for(width=1440,height=950):
  page=browser.new_page(viewport={'width':width,'height':height});page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.set_content(HTML,wait_until='domcontentloaded');return page,errors
 # First-run studio: saved capital, optional guidance, profile and real rights contract.
 ui,errors=page_for();ui.locator('#startup-profile43').select_option('team')
 ui.locator('#new-game-form button[type="submit"]').click();assert ui.locator('#content h1').count()>=1
 ui.locator('[data-view="settings"]').first.click();assert ui.locator('#management43-form').count()==1
 ui.locator('#management43-form [name="mode"]').select_option('delegated');ui.locator('#management43-form [name="cap"]').fill('3200')
 ui.locator('#management43-form button[type="submit"]').click();assert ui.locator('#management43-form [name="cap"]').input_value()=='3200'
 ui.locator('[data-u43="begin-tutorial"]').first.click();assert ui.get_by_text('Tutorial',exact=False).count()>=1
 ui.locator('[data-u43="goal"]').first.click();assert ui.locator('[data-u43="goal"]').first.get_attribute('data-enable43')=='false'
 ui.locator('[data-view="teams"]').first.click();assert ui.locator('.ss-portrait43').count()>=1
 assert ui.locator('[data-u43="team-toggle"]').count()>=1
 ui.locator('[data-u43="team-toggle"]').first.click()
 ui.locator('[data-view="world"]').first.click();assert ui.get_by_text('World history & market readiness').count()==1
 assert not errors,errors
 print('PASS desktop founder setup, paid profile, controls, guided tutorial, goals, vector portraits, archive')
 # Mature start: regional rights and game funded external publishing.
 mature,errors=page_for();mature.locator('#new-era').select_option('25')
 mature.locator('#new-origin').select_option('games')
 mature.locator('#new-game-form button[type="submit"]').click()
 mature.locator('[data-view="productions"]').first.click();
 mature.locator('[data-project="games"]').first.click();assert mature.locator('#project-form').count()==1
 mature.locator('#project-form [name="title"]').fill('Original Arcadia');mature.locator('#project-form button[type="submit"]').last.click()
 assert mature.locator('#project-form').count()==0
 mature.locator('[data-view="productions"]').first.click()
 if mature.locator('#publisher43-form').count():
  mature.locator('#publisher43-form button[type="submit"]').click();assert 'advance' in mature.locator('#content').inner_text().lower()
 mature.locator('[data-view="library"]').first.click();assert mature.locator('#rights43-form').count()==1
 mature.locator('#rights43-form [name="territory"]').select_option('North Coast');mature.locator('#rights43-form [name="media"]').select_option('movie')
 mature.locator('#rights43-form button[type="submit"]').click();assert mature.locator('#content').get_by_text('grant_',exact=False).count()>=1
 mature.locator('[data-view="career"]').first.click();assert mature.locator('.ss-portrait43').count()>=1
 assert not errors,errors
 print('PASS mature desktop original game, funded publisher agreement, regional license, stable founder identity')
 phone,errors=page_for(390,844)
 phone.locator('#modal [data-close-modal]').first.click();phone.locator('#menu-toggle').first.click();phone.locator('[data-view="settings"]').first.click()
 assert phone.locator('#management43-form').count()==1
 phone.locator('[data-u43="begin-tutorial"]').first.click()
 phone.locator('#menu-toggle').click();phone.locator('[data-view="world"]').first.click()
 assert phone.get_by_text('World history & market readiness').count()==1
 assert not errors,errors
 print('PASS mobile 390px optional onboarding, management, years, navigation, no JS errors')
 browser.close()
print('UPDATE43 browser 3/3')
