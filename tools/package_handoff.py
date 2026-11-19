#!/usr/bin/env python3
"""Package *complete* Studio Syndicate handoff, manifest, integrity and extraction test.

No gameplay code is generated or altered here (other than the deterministic file map).
"""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,subprocess,tempfile,sys
ROOT=Path(__file__).resolve().parents[1]
ZIP=ROOT.parent/'Studio_Syndicate_Complete_Handoff.zip'
MAN=ROOT/'PACKAGE_MANIFEST_Handoff.json'
REQUIRED=['HANDOFF.md','README.md','KNOWN_BUGS.md','TODO.md','BALANCE_NOTES.md','DATA_INVENTORY.md','HARD_CODED_VALUES.tsv','HARD_CODED_STRINGS.tsv','Studio_Syndicate_Playable_Handoff.html','src/engine_order.json','src/ui_order.json','src/shell.html','src/persistence50.js','src/styles.css','config/save.json','config/world.json','config/compiled.json','dist/engine.js','dist/ui.js','tools/build.py','tools/verify.py','tools/package_handoff.py','TASK_STATE.md']
def hash_bytes(raw):return hashlib.sha256(raw).hexdigest()
def files():
 return sorted([x for x in ROOT.rglob('*') if x.is_file() and x!=MAN and '__pycache__' not in x.parts and x.suffix!='.pyc' and x.name!='gate06_failure_screenshot.png'],key=lambda p:p.relative_to(ROOT).as_posix())

# Refresh map after files/logs and before hashing.
subprocess.run([sys.executable,'tools/generate_file_map.py'],cwd=ROOT,check=True)
items=files();paths={p.relative_to(ROOT).as_posix() for p in items}
for p in REQUIRED:
 assert p in paths,f'Important runtime or handoff artifact missing: {p}'
assert len([p for p in items if p.relative_to(ROOT).as_posix().startswith('src/systems/') and p.suffix=='.js'])==44
assert len([p for p in items if p.relative_to(ROOT).as_posix().startswith('src/interface/') and p.suffix=='.js'])==19
config=json.loads((ROOT/'config/compiled.json').read_text());assert config['save']['SAVE_VERSION']==39
expected={'publishing':1,'movie':4,'tv':7,'games':10}
assert {k:v['year'] for k,v in config['world']['SECTORS'].items()}==expected
checks=[{'file':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hash_bytes(p.read_bytes())} for p in items]
MAN.write_text(json.dumps({'project':'Studio Syndicate','handoff':'Modular/config-only source for testing and future maintenance, no new features','save_version':39,'sector_debuts':expected,'generated_manifest_excludes_self':True,'file_count_including_manifest':len(checks)+1,'files':checks},indent=2)+'\n')
allfiles=[*items,MAN]
with ZipFile(ZIP,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for p in allfiles:z.write(p,p.relative_to(ROOT).as_posix())
with ZipFile(ZIP) as z:
 assert z.testzip() is None,'ZIP CRC check failed'
 assert len(z.namelist())==len(allfiles)
 assert len(set(z.namelist()))==len(allfiles)
 assert set(z.namelist())=={p.relative_to(ROOT).as_posix() for p in allfiles}
 recorded=json.loads(z.read('PACKAGE_MANIFEST_Handoff.json'))
 assert recorded['file_count_including_manifest']==len(allfiles)
 for entry in recorded['files']:
  data=z.read(entry['file']);assert len(data)==entry['bytes'] and hash_bytes(data)==entry['sha256'],f'ZIP byte mismatch: {entry["file"]}'
 # Validate extracted artifact is sufficient to run the game and build without the original worktree.
 with tempfile.TemporaryDirectory(prefix='studio_handoff_extract_') as temp:
  z.extractall(temp);r=Path(temp)
  result=subprocess.run([sys.executable,'tools/build.py'],cwd=r,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=40)
  assert result.returncode==0,f'Extracted project cannot build: {result.stdout}'
  assert hash_bytes((r/'Studio_Syndicate_Playable_Handoff.html').read_bytes())==hash_bytes(z.read('Studio_Syndicate_Playable_Handoff.html')),'Extracted build differs from packaged game'
  result=subprocess.run(['node','tests/update45_rights.test.js'],cwd=r,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=45)
  assert result.returncode==0,f'Extracted game cannot run rights suite: {result.stdout}'
  print('EXTRACTED BUILD PASS:',result.stdout.strip().splitlines()[-1])
print('ZIP COMPLETE',ZIP,'FILES',len(allfiles),'SIZE',ZIP.stat().st_size,'SHA256',hash_bytes(ZIP.read_bytes()))
