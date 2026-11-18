#!/usr/bin/env python3
"""Deterministic zero-third-party-dependency Studio Syndicate build.

Authoritative source is in src/systems, src/interface and config/*.json.
Engine/UI compilation deliberately shares the historical closure scope, so
serialized state shape and the legacy API do not change during handoff.
"""
from pathlib import Path
import json,hashlib

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'src'
CFG=ROOT/'config'
DIST=ROOT/'dist'
DIST.mkdir(exist_ok=True)

def compose(kind):
    manifest=json.loads((SRC/f'{kind}_order.json').read_text())
    parts=[manifest['open'],*manifest['parts'],manifest['close']]
    for file in parts:
        assert (ROOT/file).is_file(),f'Missing {kind} module: {file}'
    return ''.join((ROOT/file).read_text(encoding='utf-8') for file in parts)

config_files=sorted(p for p in CFG.glob('*.json') if p.name not in ('compiled.json',) and not p.stem.endswith('_index'))
CONFIG={p.stem:json.loads(p.read_text(encoding='utf-8')) for p in config_files}
assert CONFIG['save']['SAVE_VERSION']==38,'Unexpected save schema version.'
assert set(CONFIG['world']['SECTORS'])=={'publishing','movie','tv','games'}
assert {k:v['year'] for k,v in CONFIG['world']['SECTORS'].items()}=={'publishing':1,'movie':4,'tv':7,'games':10}
(CFG/'compiled.json').write_text(json.dumps(CONFIG,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
engine=compose('engine')
ui=compose('ui')
assert 'const CFG = ' in engine and 'CONFIG:CFG,' in engine
assert 'const CFG = globalThis.StudioEngine.CONFIG' in ui
(DIST/'engine.js').write_text(engine,encoding='utf-8')
(DIST/'ui.js').write_text(ui,encoding='utf-8')

shell=(SRC/'shell.html').read_text(encoding='utf-8')
shell=shell.replace('Playable Update 41','Studio Syndicate Handoff').replace('PLAYABLE UPDATE 41','STUDIO SYNDICATE')
# Escape literal '<' to prevent closing an inline config script with malicious
# or accidental data content. There is no external fetch at play-time.
config_js=json.dumps(CONFIG,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
preload='<script>globalThis.__STUDIO_CONFIG__='+config_js+';</script>'
shell=shell.replace('<script>@@ENGINE@@</script>',preload+'<script>@@ENGINE@@</script>')
shell=shell.replace('<script>@@UI@@</script>','<script>'+ (SRC/'persistence50.js').read_text(encoding='utf-8')+'</script><script>\n@@UI@@</script>')
for token,data in [('@@STYLES@@',(SRC/'styles.css').read_text(encoding='utf-8')),('@@ENGINE@@',engine),('@@UI@@',ui)]:
    assert shell.count(token)==1,token
    shell=shell.replace(token,data)
out=ROOT/'Studio_Syndicate_Playable_Handoff.html'
out.write_text(shell,encoding='utf-8')
print(f'Built {out.name} ({out.stat().st_size:,} bytes); {len(config_files)} JSON config inputs; compiled engine SHA-256 {hashlib.sha256(engine.encode()).hexdigest()[:16]}; save v{CONFIG['save']['SAVE_VERSION']}')
