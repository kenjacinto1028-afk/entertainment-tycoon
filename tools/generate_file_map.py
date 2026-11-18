#!/usr/bin/env python3
"""Rebuild HANDOFF.md's complete one-file-per-line map from the handoff tree."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
HAN=ROOT/'HANDOFF.md'
START='<!-- FILE_MAP_BEGIN -->';END='<!-- FILE_MAP_END -->'

def desc(path):
 p=path.as_posix();name=path.name
 if p=='HANDOFF.md':return 'Comprehensive engineering handoff, system contracts, formulas, conventions and complete file map.'
 if p=='README.md':return 'Entry-point instructions, build/test commands and package status.'
 if p=='KNOWN_BUGS.md':return 'Current verified defects, unresolved verification risks and previously fixed bugs.'
 if p=='TODO.md':return 'Unfinished verification/maintenance work and explicit no-new-feature boundary.'
 if p=='BALANCE_NOTES.md':return 'Tested economic behavior, likely balance sensitivity and config knobs.'
 if p=='DATA_INVENTORY.md':return 'Every authored/generated config JSON and the line-level literal inventories.'
 if p=='HARD_CODED_VALUES.tsv':return 'Every retained numeric-bearing literal with source file, line, column and context.'
 if p=='HARD_CODED_STRINGS.tsv':return 'Every retained string/template literal or indexed HTML label with file and line.'
 if p=='TASK_STATE.md':return 'Atomic recovery checklist documenting the handoff build/validation/package checkpoints.'
 if p=='TEST_REPORT_Handoff.md':return 'Verification performed on the newly refactored source and its limits.'
 if name.startswith('TEST_REPORT_'):return 'Retained accepted-release test evidence and caveats.'
 if name.startswith('STUDIO_SYNDICATE_MASTER_PROGRESS'):return 'Prior accepted 309-feature tracker snapshot; historical, not runtime config.'
 if name.startswith('MASTER_FEATURE_STATUS'):return 'Machine-readable feature-catalog acceptance snapshot.'
 if name.startswith('PACKAGE_MANIFEST'):return 'Per-file hash/byte manifest for source archive integrity; not gameplay input.'
 if p=='Studio_Syndicate_Playable_Handoff.html':return 'Fully standalone playable game; generated from maintained modules and embedded JSON.'
 if p.startswith('historical/'):
  return 'Original accepted Update 52 game/report kept for comparison and regression.'
 if p.startswith('config/'):
  if name=='compiled.json':return 'Build-generated aggregate JSON loaded by Node engine and embedded in standalone HTML.'
  if name.endswith('_index.json'):return 'Numeric/input-form extraction provenance and original code-context mapping; metadata, not runtime config.'
  return 'Authoritative playable configuration for '+name.removesuffix('.json').replace('_',' ')+'; see DATA_INVENTORY.md.'
 if p.startswith('src/systems/'):
  return 'Maintained engine section: '+re.sub(r'^\d+_','',name).removesuffix('.js').replace('_',' ')+'; concatenated in manifest order.'
 if p.startswith('src/interface/'):
  return 'Maintained UI section: '+re.sub(r'^\d+_','',name).removesuffix('.js').replace('_',' ')+'; concatenated in manifest order.'
 if p.startswith('src/engine_bootstrap/'):return 'Engine closure wrapper '+name+'; preserves CommonJS and browser API scope.'
 if p.startswith('src/ui_bootstrap/'):return 'UI closure wrapper '+name+'; preserves shared UI state.'
 if p=='src/engine_order.json':return 'Authoritative ordered engine section/source manifest for builder.'
 if p=='src/ui_order.json':return 'Authoritative ordered UI section/source manifest for builder.'
 if p=='src/persistence50.js':return 'Native browser save/recovery/IndexedDB/gzip implementation loaded between engine and UI.'
 if p=='src/styles.css':return 'Maintained responsive, contrast and keyboard-focus style rules.'
 if p=='src/shell.html':return 'Maintained standalone HTML skeleton with builder engine/UI/styles placeholders.'
 if p.startswith('dist/'):
  return 'Build-generated '+name.removesuffix('.js')+' JS bundle for Node/browser testing; do not edit.'
 if p=='tools/build.py':return 'Zero-third-party-dependency builder reading source/JSON and writing standalone HTML/compiled JS.'
 if p=='tools/verify.py':return 'Repeatable 35-suite engine verification, syntax and optional simulated browser tests.'
 if p=='tools/generate_file_map.py':return 'Regenerates this one-line-per-file map after source/docs change.'
 if p.startswith('tests/fixtures/'):
  return ('Original 78-week seeded world-signature fixtures.' if 'baseline_signatures' in name else 'Old v30 engine fixture used only for save migration compatibility tests.')
 if p.startswith('tests/'):
  if name.endswith('.test.js'):return 'Historical or retained focused Node engine test for '+name.removesuffix('.test.js').replace('_',' ')+'.'
  if name.endswith('.py'):return 'Browser/UI/storage or acceptance test for '+name.removesuffix('.py').replace('_',' ')+'.'
  return 'Test asset and supporting fixture for regression coverage.'
 if p.startswith('reference/'):
  return 'Approved 309-feature catalog / historical design source for maintenance decisions.'
 if p.startswith('reports/handoff/'):
  return 'Actual handoff-run verification log or provenance record: '+name.replace('_',' ')+'.'
 if p.startswith('reports/'):
  if name.endswith('.json'):return 'Retained earlier test result or acceptance data, not runtime gameplay configuration.'
  if name.endswith('.txt') or name.endswith('.log'):return 'Retained earlier simulation/regression/browser output and acceptance evidence.'
  if name.endswith('.md'):return 'Retained earlier accepted evidence, matrix, accessibility checklist or run notes.'
  return 'Retained earlier test artifact for traceability.'
 return 'Historical or handoff source/support artifact; see name and original file content.'

files=[p.relative_to(ROOT) for p in ROOT.rglob('*') if p.is_file() and not p.name.endswith('.pyc') and '__pycache__' not in p.parts]
if Path('PACKAGE_MANIFEST_Handoff.json') not in files:files.append(Path('PACKAGE_MANIFEST_Handoff.json'))
files.sort(key=lambda x:x.as_posix())
rows=['| File | One-line purpose |','|---|---|']
for f in files:
 rows.append(f'| `{f.as_posix()}` | {desc(f)} |')
s=HAN.read_text();assert START in s and END in s
s=s[:s.index(START)+len(START)]+'\n\n'+'\n'.join(rows)+'\n\n'+s[s.index(END):]
HAN.write_text(s)
print(f'File map updated: {len(files)} files, exactly one line per file')
