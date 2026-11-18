# Studio Syndicate — Claude notes

Read the project's WORKING_RULES.md and PROGRESS.md first. Full detail lives in HANDOFF.md; open only the section you need.

## Rules
- One chat per feature. Edits only, never full-file rewrites.
- Edit only `src/` and `config/*.json`. Never edit `dist/`, `config/compiled.json`, or `Studio_Syndicate_Playable_Handoff.html` (generated).
- Never reorder `src/engine_order.json` / `src/ui_order.json`.
- Engine: no `Math.random` (use `rand(s)`), money via `money(...)`, don't rewrite ledger transaction legs.
- Don't change save fields/RNG flow without a migration + test (save schema v35).
- No new features unless the user approves.

## Build & test
- Build: `python tools/build.py`
- Engine tests: `python tools/verify.py` (Python 3.10+, Node 18+)
- Browser tests: `python tools/verify.py --browser` (needs Playwright)

## Where things are
- Engine: `src/systems/NN_*.js` (44 ordered sections, one closure)
- UI: `src/interface/NN_*.js` (19 sections)
- Data/tuning: `config/*.json`; leftover hardcoded values: `DATA_INVENTORY.md`, `HARD_CODED_VALUES.tsv`
- Status: `KNOWN_BUGS.md`, `TODO.md`, `BALANCE_NOTES.md`
- Ignore for normal work: `reports/`, `historical/`, `reference/`, `tests/update4x_*` logs
