from playwright.sync_api import sync_playwright
from pathlib import Path
p=Path('/mnt/data/studio_syndicate_work')
html='<html><head><title>Native probe</title></head><body>origin native probe</body></html>'
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for name,url,route in [('intercept-http','http://127.0.0.1:7544/game',True),('intercept-https','https://studio.test/game',True),('intercept-public','https://example.com/studio',True),('file-origin','file://'+str(p/'Studio_Syndicate_Playable_Update_49.html'),False),('about-blank','about:blank',False),('data-url','data:text/html,'+html,False)]:
  c=b.new_context();page=c.new_page()
  if route: page.route('**/*',lambda r:r.fulfill(status=200,body=html,content_type='text/html'))
  try:
   page.goto(url,wait_until='domcontentloaded',timeout=5000)
   result=page.evaluate('''() => {try{localStorage.setItem('studio50','yes');return [location.origin,localStorage.getItem('studio50')]}catch(e){return [location.origin,e.message]}}''')
   print(name,'LOADED',result,flush=True)
  except Exception as exc:print(name,'BLOCKED',str(exc).splitlines()[0],flush=True)
  c.close()
 b.close()
