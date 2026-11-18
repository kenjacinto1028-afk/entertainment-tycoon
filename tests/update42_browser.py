"""Chromium UI checks (in-memory HTML; this harness cannot test origin-bound localStorage)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

html=(Path(__file__).resolve().parents[1]/'Studio_Syndicate_Playable_Update_42.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    def new_page(width=1440,height=900):
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_default_timeout(7000)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(html,wait_until='domcontentloaded')
        assert not errors,errors
        return page,errors

    desktop,errors=new_page()
    desktop.locator('#new-game-form button[type="submit"]').click()
    desktop.locator('[data-view="finance"]').first.click()
    assert desktop.get_by_text('Revolving bank credit').count()==1
    desktop.locator('[data-u42="open-line"]').first.click()
    assert desktop.locator('#update42-form').count()==1
    desktop.locator('#update42-form [name="amount"]').fill('12000')
    desktop.locator('#update42-form button[type="submit"]').click()
    assert desktop.get_by_text('borrowed /',exact=False).count()>=1
    desktop.locator('[data-u42="draw-line"]').first.click()
    desktop.locator('#update42-form [name="amount"]').fill('5000')
    desktop.locator('#update42-form button[type="submit"]').click()
    assert desktop.get_by_text('outstanding',exact=False).count()>=1
    desktop.locator('[data-view="world"]').first.click()
    assert desktop.locator('[data-u42="new-division"]').count()==1
    desktop.locator('[data-u42="new-division"]').click()
    desktop.locator('#update42-form [name="name"]').fill('Regional Originals')
    desktop.locator('#update42-form button[type="submit"]').click()
    assert desktop.locator('#content').get_by_text('Regional Originals').count()>=1
    assert not errors,errors
    print('PASS desktop chronological bank draw, division creation, navigation, no JS errors')

    mature,errors=new_page()
    mature.locator('#new-era').select_option('25')
    mature.locator('#new-game-form [name="startingCapital"]').select_option('funded')
    mature.locator('#new-game-form button[type="submit"]').click()
    mature.locator('[data-view="world"]').first.click()
    assert mature.locator('[data-u42="diligence"]').count()>=2
    mature.locator('[data-u42="diligence"]').first.click()
    assert 'Paid commercial inspection' in mature.locator('#modal').inner_text()
    mature.locator('#modal [data-close-modal]').first.click()
    mature.locator('[data-view="finance"]').first.click()
    mature.locator('[data-u42="open-line"]').click()
    mature.locator('#update42-form [name="amount"]').fill('25000')
    mature.locator('#update42-form button[type="submit"]').click()
    mature.locator('[data-view="world"]').first.click()
    mature.locator('[data-u42="buy-company"]').first.click()
    assert mature.locator('[data-u42="delegation"]').count()>=1
    mature.locator('[data-u42="delegation"]').first.click()
    assert mature.locator('[data-u42="delegation"]').first.count() == 1
    mature.locator('[data-view="finance"]').first.click()
    assert 'Reconciled' in mature.locator('#content').inner_text()
    assert not errors,errors
    print('PASS mature desktop funded acquisition, inspection, delegation and consolidated reporting')

    phone,errors=new_page(390,844)
    phone.locator('#modal [data-close-modal]').first.click()
    phone.locator('#menu-toggle').click()
    phone.locator('[data-view="world"]').first.click()
    assert phone.get_by_text('Your group and restructuring').count()==1
    assert phone.locator('#content h1').first.inner_text()=='World & Rivals'
    assert not errors,errors
    print('PASS mobile 390px lightweight navigation, management panel, no JS errors')
    browser.close()
print('Update42 browser checks 3/3 passed (autosave storage not tested in in-memory origin)')
