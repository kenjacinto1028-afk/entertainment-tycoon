#!/usr/bin/env python3
"""Rebuild and verify maintained Studio Syndicate handoff source (no game changes)."""
from pathlib import Path
import argparse, re, subprocess, sys, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--browser',action='store_true',help='Run optional Playwright browser-shim checks')
a=p.parse_args()
def call(args, timeout=90):
 r=subprocess.run(args,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
 if r.returncode:
  print(r.stdout);raise SystemExit(f'FAIL {" ".join(args)}')
 return r.stdout
print(call([sys.executable,'tools/build.py']).strip())
for name in ['engine','ui']:call(['node','--check',f'dist/{name}.js'])
suites=re.findall(r'^=== (\w+) ===$',(ROOT/'reports/UPDATE_52_FOCUSED_REGRESSION.txt').read_text(),re.M)
for i,suite in enumerate(suites,1):
 call(['node',f'tests/{suite}.test.js'])
 print(f'PASS {i}/{len(suites)} {suite}')
assert len(suites)==35
for t in sorted((ROOT/'tests').glob('depth_modes_*.test.js')):
 call(['node',f'tests/{t.name}'])
 print(f'PASS {t.stem}')
if a.browser:
 for script in ['tests/update52_accessibility_browser.py','tests/update52_recovery_browser.py','tests/depth_modes_d2_browser.py']:
  print(call([sys.executable,script],timeout=140).strip())
config=json.loads((ROOT/'config/compiled.json').read_text())
assert config['save']['SAVE_VERSION']==35
assert {k:v['year'] for k,v in config['world']['SECTORS'].items()}=={'publishing':1,'movie':4,'tv':7,'games':10}
print('PASS handoff source verification: 35 focused engine suites, engine/UI syntax, 4 debut gates, save v35')
print('PLAYABLE SHA-256',hashlib.sha256((ROOT/'Studio_Syndicate_Playable_Handoff.html').read_bytes()).hexdigest())
