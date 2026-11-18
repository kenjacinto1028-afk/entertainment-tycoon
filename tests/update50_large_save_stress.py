"""Large-save encoded IndexedDB flow under explicit fake backend; not actual browser origin durability."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'Studio_Syndicate_Playable_Update_50.html').read_text()
marker='\ninit();\n})();'
assert marker in html
html=html.replace(marker,'\nwindow.__testReplace50=(json)=>{S=E.loadState(json);remember();render();};window.__savePending50=()=>pendingSave50;\ninit();\n})();',1)
shim="""<script>(function(){
 const local={};const idb=new Map();window.__store50=idb;
 Object.defineProperty(window,'localStorage',{configurable:true,value:{
  getItem(k){return local[k]??null},setItem(k,v){if(String(v).length>5000000)throw Error('QuotaExceededError');local[k]=String(v)},removeItem(k){delete local[k]}
 }});
 const db={objectStoreNames:{contains:()=>true},createObjectStore(){},transaction(){
  const tx={};tx.objectStore=()=>({
   get(key){const r={};queueMicrotask(()=>{r.result=idb.get(key);r.onsuccess?.()});return r;},
   put(value,key){queueMicrotask(()=>{idb.set(key,value);tx.oncomplete?.()});return {};}
  });return tx;
 }};
 Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){
  const req={result:db};queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});return req;
 }}});
})();</script>"""
source=json.loads((ROOT/'reports/UPDATE_49_CENTURY_publishing_final.checkpoint.json').read_text())['state']
assert len(source)>20000000
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':1365,'height':900});page=ctx.new_page();page.set_default_timeout(30000)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.on('dialog',lambda d:d.accept())
 print('STAGE mount',flush=True)
 page.set_content(html.replace('<head>','<head>'+shim,1),wait_until='domcontentloaded')
 page.wait_for_selector('#new-game-form')
 page.locator('#modal [data-close-modal]').first.click()
 # Use real, audited 100-year engine snapshot; the fake DB only supplies an opaque storage API.
 print('STAGE loaded startup, injecting 24MB',flush=True)
 page.evaluate('raw=>window.__testReplace50(raw)',source)
 print('STAGE injected, saving',flush=True)
 page.evaluate('() => window.__savePending50()')
 print('STAGE saved, checking pointer',flush=True)
 ptr=page.evaluate("localStorage.getItem('studio-syndicate-f1-autosave')")
 assert ptr=='@indexeddb-v50',ptr
 print('STAGE pointer okay, decompressing and audit',flush=True)
 result=page.evaluate("""async()=>{const p=window.StudioPersistence50;const raw=await p.get('autosave');const saved=window.__store50.get('autosave');return {len:raw.length,encoding:saved.format,blobSize:saved.data.size,valid:window.StudioEngine.audit(window.StudioEngine.loadState(raw)).length===0}}""")
 assert result['len']==len(source) and result['encoding']=='gzip' and result['blobSize']<4500000 and result['valid'],result
 print('STAGE audit okay, opening settings',flush=True)
 page.locator('[data-view="settings"]').first.click(timeout=12000)
 page.locator('#save-name-1').fill('Century backup')
 page.get_by_role('button',name='Save campaign in slot 1').click()
 page.wait_for_function("()=>{const v=localStorage.getItem('studio-syndicate-f1-slot-1');return v&&v.includes('@indexeddb-v50')}")
 assert page.evaluate("window.__store50.get('slot-1').format")=='gzip'
 page.locator('[data-advance="1"]').first.click()
 page.evaluate('() => window.__savePending50()')
 page.get_by_role('button',name='Load campaign from slot 1').click()
 page.wait_for_function("()=>document.querySelector('#content h1')?.textContent.includes('Good to see you')")
 assert not errs,errs
 print('PASS 24MB audited century save: gzip',result['blobSize'],'bytes, IndexedDB emulation, pointer, slot 1, load, browser audit')
 ctx.close();browser.close()
print('NOTE fake IndexedDB/localStorage quota in about:blank; this does NOT verify actual origin persistence')
