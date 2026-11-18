"""Full browser-origin persistence verification for an UNRESTRICTED local Chromium.

Usage (local desktop, with Python and Playwright + Chromium installed):
    python tests/update52_real_origin_acceptance.py
    python tests/update52_real_origin_acceptance.py --chromium /path/to/chrome --headed

A temporary HTTP server binds to 127.0.0.1 only and a disposable browser profile
is created. No network service, login, remote sync, or uploaded data is required.
If the environment blocks navigation, exit 3; NEVER reinterpret mock storage as native.
Independent screen-reader use is a separate manual acceptance step.
"""
import argparse,hashlib,os,threading,tempfile,sys,json,shutil,traceback
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright,Error as PlaywrightError,TimeoutError as PlaywrightTimeoutError
ROOT=Path(__file__).resolve().parents[1]
DEFAULT_HTML=ROOT/'Studio_Syndicate_Playable_Handoff.html'
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass

CURRENT_STAGE='before browser launch'

def step(label):
    global CURRENT_STAGE
    CURRENT_STAGE=label
    print('CHECK:',label,flush=True)

def verify(condition,description):
    if not condition:
        raise AssertionError(f'{CURRENT_STAGE}: {description}')

def failure_diagnostics(page):
    print('FAILED STAGE:',CURRENT_STAGE,flush=True)
    if page is None:
        return
    try:
        details=page.evaluate('() => ({\n            url: location.href,\n            ready: document.readyState,\n            date: document.querySelector(\'#top-date\')?.textContent ?? null,\n            company: document.querySelector(\'#top-company\')?.textContent ?? null,\n            newGameForm: !!document.querySelector(\'#new-game-form\'),\n            dialogs: Array.from(document.querySelectorAll(\'[role="dialog"]\')).map(x => ({\n                label:x.getAttribute(\'aria-label\'),hidden:x.hidden,display:getComputedStyle(x).display\n            })),\n            toast: document.querySelector(\'#toast\')?.textContent ?? null,\n            savedSlot1: !!localStorage.getItem(\'studio-syndicate-f1-slot-1\'),\n            autosaveMarker:localStorage.getItem(\'studio-syndicate-f1-autosave\')?.slice(0,80) ?? null\n        })')
        print('BROWSER DIAGNOSTICS:',json.dumps(details,ensure_ascii=False),flush=True)
    except Exception as err:
        print('Browser diagnostics unavailable:',repr(err),flush=True)
    try:
        dest=ROOT/'gate06_failure_screenshot.png'
        page.screenshot(path=str(dest),full_page=True,timeout=2500)
        print('Failure screenshot:',str(dest),flush=True)
    except Exception as err:
        print('Screenshot unavailable:',repr(err),flush=True)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--chromium',default=os.environ.get('STUDIO_CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('google-chrome'))
    parser.add_argument('--headed',action='store_true',help='Run visible Chromium for manual assistive-technology testing')
    parser.add_argument('--html',type=Path,default=DEFAULT_HTML)
    parser.add_argument('--century-snapshot',type=Path,help='Optional actual exported century state for >5MB recovery verification')
    args=parser.parse_args()
    if not args.html.is_file() or args.html.resolve().parent!=ROOT.resolve():
        parser.error('HTML must be a present, local Studio Syndicate build in the project root')
    print('STUDIO GATE 06 — diagnostic native runner v2 (2026-11-18)',flush=True)
    print('SCRIPT:',str(Path(__file__).resolve()),flush=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_address[1]}/{quote(args.html.name)}'
    try:
        with tempfile.TemporaryDirectory(prefix='studio-native-profile-') as profile, sync_playwright() as pw:
            kw={'headless':not args.headed}
            if args.chromium:kw['executable_path']=args.chromium
            def open_browser():
                return pw.chromium.launch_persistent_context(profile,viewport={'width':1360,'height':900},**kw)
            step('Start disposable real Chromium profile')
            ctx=open_browser()
            page=None
            try:
                page=ctx.pages[0] if ctx.pages else ctx.new_page()
                page.set_default_timeout(15000)
                step('Navigate to real localhost game origin')
                try:page.goto(url,wait_until='domcontentloaded',timeout=12000)
                except PlaywrightError as exc:
                    if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
                        print('BLOCKED: this Chromium environment forbids local-origin navigation. Native persistence NOT VERIFIED.')
                        return 3
                    raise
                step('Verify fresh profile displays the new-game dialog')
                page.get_by_role('dialog',name='Create your entertainment world').wait_for(state='visible',timeout=15000)
                step('Start new game and confirm dialog closes')
                page.locator('#new-game-form button[type="submit"]').click()
                page.locator('#new-game-form').wait_for(state='detached',timeout=15000)
                step('Create named manual slot 1')
                page.locator('[data-view="settings"]').first.click()
                page.locator('#save-name-1').fill('Real origin checkpoint')
                page.get_by_role('button',name='Save campaign in slot 1').click()
                page.wait_for_function('''()=>{const v=localStorage.getItem('studio-syndicate-f1-slot-1');return v&&v.includes('Real origin checkpoint')}''')
                first=page.locator('#top-date').inner_text()
                step('Reload same tab and recover current autosave')
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function(
                    '''expected => !document.querySelector('#new-game-form') &&
                        document.querySelector('#top-date')?.textContent === expected''',
                    arg=first,timeout=20000)
                step('Advance one week and persist the changed date')
                page.locator('[data-view="dashboard"]').first.click()
                page.locator('[data-advance="1"]').first.click()
                page.wait_for_function(
                    "old => document.querySelector('#top-date')?.textContent !== old",
                    arg=first,timeout=20000)
                moved=page.locator('#top-date').inner_text()
                print('PASS native same-tab reload + live turn resume')
                step('Open second browser tab and recover latest saved turn')
                tab=ctx.new_page();tab.goto(url,wait_until='domcontentloaded')
                tab.wait_for_function(
                    "expected => document.querySelector('#top-date')?.textContent === expected",
                    arg=moved,timeout=20000)
                tab.close()
                print('PASS native same-origin new tab restore')
                # No test doubles. The actual IndexedDB implementation handles
                # a synthetic >5MB save, or an optional actual century snapshot.
                if args.century_snapshot:
                    doc=json.loads(args.century_snapshot.read_text())
                    large=doc.get('state',doc)
                    if not isinstance(large,str):large=json.dumps(large,separators=(',',':'))
                else:
                    large=json.dumps({'probe':'Update51 actual IndexedDB origin','payload':'z'*6_500_000})
                step('Round-trip >5 MB save through genuine IndexedDB')
                verify(len(large)>5_000_000,'snapshot is not larger than 5 MB')
                checksum=hashlib.sha256(large.encode()).hexdigest()
                r=page.evaluate('''async(raw)=>{
                    await StudioPersistence50.save('acceptance-large',raw);
                    const content=await StudioPersistence50.get('acceptance-large');
                    return {same:content===raw,size:content.length};
                }''',large)
                verify(r['same'] and r['size']==len(large),f'large save did not round-trip: {r!r}, expected={len(large)}')
                print('PASS native IndexedDB large-file write/read',len(large),'characters',checksum[:12])
            except Exception:
                failure_diagnostics(page)
                raise
            finally:
                ctx.close()
            step('Close all pages and restart browser with same profile')
            ctx=open_browser()
            page=None
            try:
                page=ctx.pages[0] if ctx.pages else ctx.new_page()
                step('Verify autosave survived full browser shutdown/start')
                page.goto(url,wait_until='domcontentloaded')
                page.wait_for_function(
                    "expected => document.querySelector('#top-date')?.textContent===expected",
                    arg=moved, timeout=15000)
                print('PASS native full browser restart restores autosave')
                step('Verify large IndexedDB record survived full browser restart')
                result=page.evaluate('''async()=>{
                    const v=await StudioPersistence50.get('acceptance-large');
                    return {value:v,length:v?.length};
                }''')
                verify(result['length']==len(large) and hashlib.sha256(result['value'].encode()).hexdigest()==checksum,
                       f'large save mismatch after restart: result_length={result["length"]!r}, expected={len(large)}')
                step('Roll back manual save slot after restart')
                page.locator('[data-view="settings"]').first.click()
                page.get_by_role('button',name='Load campaign from slot 1').click()
                # loadSlot() awaits IndexedDB. A click returns before that asynchronous
                # read finishes. Waiting for the restored date prevents a false FAIL.
                try:
                    page.wait_for_function(
                        "expected => document.querySelector('#top-date')?.textContent===expected",
                        arg=first, timeout=15000)
                except PlaywrightTimeoutError as exc:
                    current=page.locator('#top-date').inner_text()
                    toast=page.locator('#toast').inner_text()
                    slot=page.evaluate("localStorage.getItem('studio-syndicate-f1-slot-1')")
                    raise AssertionError(
                        f'manual slot rollback did not finish: expected={first!r}, '
                        f'actual={current!r}, notice={toast!r}, '
                        f'slot_present={bool(slot)}') from exc
                print('PASS native manual save-slot rollback after restart')
                # Loading a slot switches to Dashboard. Return to Settings before
                # looking for the New Game button, and accept its confirmation.
                step('Check new-game dialog keyboard close')
                page.locator('[data-view="settings"]').first.click()
                page.once('dialog',lambda prompt:prompt.accept())
                page.locator('[data-new-game]').first.click()
                page.get_by_role('dialog',name='Create your entertainment world').wait_for(state='visible',timeout=15000)
                page.keyboard.press('Escape')
                verify(page.get_by_role('dialog').count()==0,'dialog remained open after Escape')
                print('PASS native browser restart + large-save recovery + manual slot rollback + keyboard dialog')
                # Update52: The DB commit can survive while the localStorage
                # marker disappears (quota restriction/interrupted write). A
                # valid orphan must restore without a game reset.
                step('Restore IndexedDB orphan without autosave pointer')
                page.evaluate('''async()=>{
                  const s=StudioEngine.createGame({companyName:'Recovered Orphan Studio',seed:'u52-orphan',aiCount:2});
                  await StudioPersistence50.save('autosave',JSON.stringify(s));
                  localStorage.removeItem('studio-syndicate-f1-autosave');
                }''')
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function(
                    "expected => document.querySelector('#top-company')?.textContent===expected",
                    arg='Recovered Orphan Studio',timeout=15000)
                verify(page.evaluate("localStorage.getItem('studio-syndicate-f1-autosave')")=='@indexeddb-v50',
                       'missing autosave pointer was not repaired')
                print('PASS native missing-pointer IndexedDB recovery')
                # An invalid primary save with a valid recovery must never
                # reset the world silently or delete its broken bytes.
                step('Recover corrupt primary from valid backup without deleting primary')
                page.evaluate('''async()=>{
                  const s=StudioEngine.createGame({companyName:'Recovered Backup Studio',seed:'u52-backup',aiCount:2});
                  await StudioPersistence50.save('autosave','CORRUPT');
                  await StudioPersistence50.save('recovery',JSON.stringify(s));
                }''')
                page.reload(wait_until='domcontentloaded')
                page.wait_for_function(
                    "expected => document.querySelector('#top-company')?.textContent===expected",
                    arg='Recovered Backup Studio',timeout=15000)
                verify(page.evaluate("async()=>await StudioPersistence50.get('autosave')")=='CORRUPT',
                       'corrupt primary was erased instead of retained for diagnosis')
                print('PASS native corrupt-primary recovery without deleting evidence')
            except Exception:
                failure_diagnostics(page)
                raise
            finally:
                ctx.close()
        print('NATIVE-ORIGIN AUTOMATION PASS. Independent screen-reader QA remains separate.')
        return 0
    finally:server.shutdown();server.server_close()

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as e:
        print('FAIL real-origin acceptance at:',CURRENT_STAGE,file=sys.stderr)
        print('EXCEPTION:',repr(e),file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
