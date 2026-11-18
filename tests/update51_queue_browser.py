"""Update51 queued save safety under simulated storage; NOT a native-origin test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Update_51.html').read_text()
assert '\ninit();\n})();' in html
html=html.replace('\ninit();\n})();', '''
window.__testQueue51=async()=>{
 S.__storageTestExtra='Z'.repeat(1400000);
 remember();
 delete S.__storageTestExtra;
 S.__storageTestLatest='newer';
 remember();
 await pendingSave50;
 return {queue:queuedSaves50, raw:window.__idbMock51.get('autosave'),pointer:localStorage.getItem(AUTOSAVE)};
};
init();
})();''',1)
mock='''<script>
(function(){const values={},db=new Map();window.__idbMock51=db;
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return values[k]??null},setItem(k,v){values[k]=String(v)},removeItem(k){delete values[k]}}});
})();
</script>'''
intercept='''<script>window.StudioPersistence50={
 async saveAutosave(raw){await new Promise(r=>setTimeout(r,180));window.__idbMock51.set('autosave',raw);},
 async save(k,raw){window.__idbMock51.set(k,raw)},async get(k){return window.__idbMock51.get(k)||null}
};</script>'''
marker='<script>\n/* Studio Syndicate — small browser controller.'
assert marker in html
html=html.replace('<head>','<head>'+mock,1).replace(marker,intercept+marker,1)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1200,'height':850});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded');page.locator('#new-game-form button[type="submit"]').click()
 r=page.evaluate('()=>window.__testQueue51()')
 assert r['queue']==0 and r['pointer']=='@indexeddb-v50',r
 assert '__storageTestLatest' in r['raw'] and '__storageTestExtra' not in r['raw'], 'stale large write overwrote newer small save'
 assert not errors,errors
 print('PASS simulated-browser in-flight large→small race: most recent snapshot wins; pointer and queue valid')
 ctx.close();browser.close()
print('NOTE simulated IndexedDB, not real origin persistence')
