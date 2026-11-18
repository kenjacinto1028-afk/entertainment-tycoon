"""Full browser-origin persistence verification for an UNRESTRICTED local Chromium.

Usage (local desktop, with Python and Playwright + Chromium installed):
    python tests/update51_real_origin_acceptance.py
    python tests/update51_real_origin_acceptance.py --chromium /path/to/chrome --headed

A temporary HTTP server binds to 127.0.0.1 only and a disposable browser profile
is created. No network service, login, remote sync, or uploaded data is required.
If the environment blocks navigation, exit 3; NEVER reinterpret mock storage as native.
Independent screen-reader use is a separate manual acceptance step.
"""
import argparse,hashlib,os,threading,tempfile,sys,json
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright,Error as PlaywrightError
ROOT=Path(__file__).resolve().parents[1]
DEFAULT_HTML=ROOT/'Studio_Syndicate_Playable_Update_51.html'
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--chromium',default=os.environ.get('STUDIO_CHROMIUM_PATH'))
    parser.add_argument('--headed',action='store_true',help='Run visible Chromium for manual assistive-technology testing')
    parser.add_argument('--html',type=Path,default=DEFAULT_HTML)
    parser.add_argument('--century-snapshot',type=Path,help='Optional actual exported century state for >5MB recovery verification')
    args=parser.parse_args()
    if not args.html.is_file() or args.html.resolve().parent!=ROOT.resolve():
        parser.error('HTML must be a present, local Studio Syndicate build in the project root')
    server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_address[1]}/{quote(args.html.name)}'
    try:
        with tempfile.TemporaryDirectory(prefix='studio-native-profile-') as profile, sync_playwright() as pw:
            kw={'headless':not args.headed}
            if args.chromium:kw['executable_path']=args.chromium
            def open_browser():
                return pw.chromium.launch_persistent_context(profile,viewport={'width':1360,'height':900},**kw)
            ctx=open_browser()
            try:
                page=ctx.pages[0] if ctx.pages else ctx.new_page()
                page.set_default_timeout(15000)
                try:page.goto(url,wait_until='domcontentloaded',timeout=12000)
                except PlaywrightError as exc:
                    if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
                        print('BLOCKED: this Chromium environment forbids local-origin navigation. Native persistence NOT VERIFIED.')
                        return 3
                    raise
                assert page.get_by_role('dialog',name='Create your entertainment world').count()==1
                page.locator('#new-game-form button[type="submit"]').click()
                assert page.locator('#new-game-form').count()==0
                page.locator('[data-view="settings"]').first.click()
                page.locator('#save-name-1').fill('Real origin checkpoint')
                page.get_by_role('button',name='Save campaign in slot 1').click()
                page.wait_for_function('''()=>{const v=localStorage.getItem('studio-syndicate-f1-slot-1');return v&&v.includes('Real origin checkpoint')}''')
                first=page.locator('#top-date').inner_text()
                page.reload(wait_until='domcontentloaded')
                assert page.locator('#new-game-form').count()==0,'autosave lost on same-tab reload'
                assert page.locator('#top-date').inner_text()==first
                page.locator('[data-view="dashboard"]').first.click()
                page.locator('[data-advance="1"]').first.click()
                moved=page.locator('#top-date').inner_text()
                assert moved!=first
                print('PASS native same-tab reload + live turn resume')
                tab=ctx.new_page();tab.goto(url,wait_until='domcontentloaded')
                assert tab.locator('#top-date').inner_text()==moved,'new tab failed native restore'
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
                assert len(large)>5_000_000
                checksum=hashlib.sha256(large.encode()).hexdigest()
                r=page.evaluate('''async(raw)=>{
                    await StudioPersistence50.save('acceptance-large',raw);
                    const content=await StudioPersistence50.get('acceptance-large');
                    return {same:content===raw,size:content.length};
                }''',large)
                assert r['same'] and r['size']==len(large)
                print('PASS native IndexedDB large-file write/read',len(large),'characters',checksum[:12])
            finally:
                ctx.close()
            ctx=open_browser()
            try:
                page=ctx.pages[0] if ctx.pages else ctx.new_page()
                page.goto(url,wait_until='domcontentloaded')
                assert page.locator('#top-date').inner_text()==moved,'autosave lost after browser restart'
                result=page.evaluate('''async()=>{
                    const v=await StudioPersistence50.get('acceptance-large');
                    return {value:v,length:v?.length};
                }''')
                assert result['length']==len(large) and hashlib.sha256(result['value'].encode()).hexdigest()==checksum
                page.locator('[data-view="settings"]').first.click()
                page.get_by_role('button',name='Load campaign from slot 1').click()
                assert page.locator('#top-date').inner_text()==first,'slot rollback failed after restart'
                page.locator('[data-new-game]').first.click()
                assert page.get_by_role('dialog',name='Create your entertainment world').count()==1
                page.keyboard.press('Escape')
                assert page.get_by_role('dialog').count()==0
                print('PASS native browser restart + large-save recovery + manual slot rollback + keyboard dialog')
            finally:
                ctx.close()
        print('NATIVE-ORIGIN AUTOMATION PASS. Independent screen-reader QA remains separate.')
        return 0
    finally:server.shutdown();server.server_close()

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as e:
        print('FAIL real-origin acceptance:',repr(e),file=sys.stderr)
        sys.exit(1)
