"""Try genuine origin-bound Chromium storage against a local HTTP server. Do not count shim as native."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import os,sys
ROOT=Path(__file__).resolve().parents[1]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
os.chdir(ROOT)
server=ThreadingHTTPServer(('127.0.0.1',0),H);Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/Studio_Syndicate_Playable_Update_49.html'
args_sets=[['--no-sandbox'],['--no-sandbox','--no-proxy-server','--proxy-bypass-list=*']]
with sync_playwright() as playwright:
 for args in args_sets:
  b=None
  try:
   b=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=args)
   context=b.new_context();p=context.new_page();p.goto(url,wait_until='domcontentloaded',timeout=8000)
   p.evaluate("localStorage.setItem('native-update49-probe','persisted')");p.reload(wait_until='domcontentloaded',timeout=8000)
   assert p.evaluate("localStorage.getItem('native-update49-probe')")=='persisted'
   q=context.new_page();q.goto(url,wait_until='domcontentloaded',timeout=8000)
   assert q.evaluate("localStorage.getItem('native-update49-probe')")=='persisted'
   print('PASS native origin reload + same-origin new tab',args)
   break
  except Exception as e:print('BLOCKED native origin mode',args,type(e).__name__,str(e).splitlines()[0])
  finally:
   if b:b.close()
server.shutdown()
