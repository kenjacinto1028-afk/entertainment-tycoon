"""Adversarial startup recovery for Update52 (simulated localStorage/IndexedDB).
This does NOT demonstrate persistence across a real browser origin or restart.
"""
import os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'Studio_Syndicate_Playable_Handoff.html').read_text()
marker='<script>\n/* Studio Syndicate — small browser controller.'
assert html.count(marker)==1
localmock='''<script>
const __storage52={};
Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem(k){return __storage52[k]??null},setItem(k,v){__storage52[k]=String(v)},removeItem(k){delete __storage52[k]}
}});
</script>'''
setup_template='''<script>
const __db52=new Map();
const mk=(name)=>JSON.stringify(StudioEngine.createGame({companyName:name,seed:name,aiCount:2}));
const active=mk('Active Publisher'),old=mk('Older Publisher'),backup=mk('Recovered Publisher');
window.StudioPersistence50={
 async get(k){return __db52.get(k)||null;},
 async save(k,v){__db52.set(k,v)},
 async saveAutosave(v){__db52.set('autosave',v)}
};
{SETUP}
</script>'''
scenarios=[
 ('pointer has no autosave; use database recovery',"__storage52['studio-syndicate-f1-autosave']='@indexeddb-v50';__db52.set('recovery',backup);",'Recovered Publisher','@indexeddb-v50',False),
 ('pointer missing; use orphaned committed database state',"__db52.set('autosave',active);",'Active Publisher','@indexeddb-v50',False),
 ('valid localStorage must outrank stale database state',"__storage52['studio-syndicate-f1-autosave']=active;__db52.set('autosave',old);",'Active Publisher','valid',False),
 ('corrupt indexed current; use valid database recovery',"__storage52['studio-syndicate-f1-autosave']='@indexeddb-v50';__db52.set('autosave','broken');__db52.set('recovery',backup);",'Recovered Publisher','@indexeddb-v50',False),
 ('missing pointer, corrupt database current, valid recovery',"__db52.set('autosave','broken');__db52.set('recovery',backup);",'Recovered Publisher',None,False),
 ('current pointer missing data and no recovery preserves pointer',"__storage52['studio-syndicate-f1-autosave']='@indexeddb-v50';",'Syndicate Works','@indexeddb-v50',True),
 ('no existing saves displays new world dialog',"",'Syndicate Works',None,True),
]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['STUDIO_CHROMIUM_PATH']} if os.environ.get('STUDIO_CHROMIUM_PATH') else {}),args=['--no-sandbox'] if sys.platform.startswith('linux') else [])
 ctx=browser.new_context(viewport={'width':1240,'height':800})
 for i,(label,setup,expected,pointer,dialog) in enumerate(scenarios,1):
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html.replace('<head>','<head>'+localmock,1).replace(marker,setup_template.replace('{SETUP}',setup)+marker,1),wait_until='domcontentloaded')
  page.wait_for_function("()=>document.querySelector('#top-company')?.textContent?.length>0")
  actual=page.locator('#top-company').inner_text();assert actual==expected,(label,actual,expected)
  assert page.get_by_role('dialog',name='Create your entertainment world').count()==int(dialog),label
  stored=page.evaluate("localStorage.getItem('studio-syndicate-f1-autosave')")
  if pointer=='valid':assert stored and 'Active Publisher' in stored,label
  else:assert stored==pointer,(label,stored,pointer)
  assert not errors,(label,errors)
  print(f'PASS {i}/{len(scenarios)}: {label}',flush=True)
  page.close()
 ctx.close();browser.close()
print('NOTE: browser document injection uses simulated storage; native browser-origin persistence still unverified.')
