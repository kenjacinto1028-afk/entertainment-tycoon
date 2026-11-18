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
 page.locator('#new-game-form button[type="submit"]').click()
 page.locator('[data-view="settings"]').first.click()
 page.locator('#save-name-1').fill('IndexedDB slot')
 page.get_by_role('button',name='Save campaign in slot 1').click()
 page.wait_for_function("()=>{const v=localStorage.getItem('studio-syndicate-f1-slot-1');return v&&v.includes('@indexeddb-v50')}")
 assert page.evaluate("window.__store50.get('slot-1').format")=='plain'
 page.get_by_role('button',name='Load campaign from slot 1').click()
 page.wait_for_function("()=>document.querySelector('#content h1')?.textContent.includes('Good to see you')")
 # 100-year production snapshot, saved and restored by real Chromium gzip APIs
 # with explicit fake IndexedDB transaction plumbing (NOT native origin persistence).
 result=page.evaluate("""async(raw)=>{
  const p=window.StudioPersistence50;
  await p.saveAutosave(raw,'legacy checkpoint');
  await p.save('slot-3',raw);
  const restored=await p.get('slot-3'), autosave=await p.get('autosave'), recovery=await p.get('recovery');
  const saved=window.__store50.get('slot-3');
  return {len:restored.length,encoding:saved.format,blobSize:saved.data.size,
    matches:restored===raw && autosave===raw && recovery==='legacy checkpoint'};
 }""",source)
 assert result['len']==len(source) and result['encoding']=='gzip' and result['blobSize']<4500000 and result['matches'],result
 assert not errs,errs
 print('PASS 24MB audited century snapshot: Chromium gzip',result['blobSize'],'bytes, fake-IDB roundtrip/recovery, real UI manual slot',flush=True)
 ctx.close();browser.close()
print('NOTE fake IndexedDB/localStorage quota in about:blank; this does NOT verify actual origin persistence')
