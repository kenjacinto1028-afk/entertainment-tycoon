# Studio Syndicate — refactored handoff verification

## Scope

This report covers only the **handoff refactor** (split maintained source into ordered system/interface sections; externalize game data and numeric tuning; no feature additions). It must **not** be presented as a completely new formal acceptance of browser-origin durability or 100-year balance. Original accepted Update 52 game is preserved under `historical/` and its prior test evidence remains under `reports/`.

## Verification actually performed on the handoff source

| Verification | Result | Evidence |
|---|---|---|
| Python build from standalone modules+JSON | PASS, generated self-contained `Studio_Syndicate_Playable_Handoff.html` + `dist/engine.js`, `dist/ui.js`, `config/compiled.json` | `tools/build.py` |
| Node parse checks of generated engine/UI | PASS | `node --check dist/engine.js`, `node --check dist/ui.js` |
| Retained focused engine suites | **35/35 PASS** from compiled, refactored engine | `reports/handoff/FOCUSED_REGRESSION_FINAL.log`, `reports/handoff/FOCUSED_SUMMARY_FINAL.json` |
| Chromium dialog/field/error/focus checks | **2/2 PASS** (desktop 1360px and mobile 390px) | `reports/handoff/UI_ACCESSIBILITY_FINAL.log` |
| Browser recovery acceptance with injected storage | **7/7 PASS**, missing pointers, corrupt records, valid fallback, fresh start | `reports/handoff/RECOVERY_BROWSER_FINAL.log` |
| Three originally recorded 78-week seeded state signatures | **3/3 identical game-state SHA-256** against accepted Update 52, checked during conversion | `tests/fixtures/baseline_signatures.json`; `TASK_STATE.md` |
| Save format and hard global sector clock | **v34**, publishing Y1, movies Y4, television Y7, games Y10 | `tools/build.py`, `config/save.json`, `config/world.json` |
| Hardcoded numeric audit | **1,850 JS literal positions; all 0 or 1**, 2,234 nontrivial engine/UI numeric tunings in JSON | `HARD_CODED_VALUES.tsv`, `DATA_INVENTORY.md` |
| Original accepted Update 52 unmodified preserved | PASS, historic HTML retained for diffs | `historical/Studio_Syndicate_Accepted_Update_52.html` |
| ZIP file completeness/CRC/hash/extracted rebuilt game | See `PACKAGE_MANIFEST_Handoff.json` and `README.md`; generated during final packaging | distribution verification |

## Original-project acceptance evidence retained (not re-executed during this refactor)

- 309/309 feature foundations and 29/29 full acceptance workstreams approved in previous project tests; `reports/FINAL_ACCEPTANCE_MATRIX.md`.
- Earlier two **actively managed 100-year** worlds, yearly finance/succession audits, multi-seed 8/12/20-year runs, banking/rights and industry regressions.
- User independently ran the **original accepted Update52** Playwright browser test on Windows with output `NATIVE-ORIGIN AUTOMATION PASS`, exercising real reload, browser restart, large IndexedDB, manual slots and recovery.
- User independently confirmed eight NVDA checks on **original accepted Update52** UI. This is user-confirmed accessibility testing, *not* formal accessibility certification.

## Known unverified areas after source organization

1. Real Chrome/Edge reload/restart and native IndexedDB save of the **handoff-generated HTML**, not just the original accepted HTML. The Chromium checks above use a simulated storage origin; do not misstate them.
2. NVDA or VoiceOver on the **handoff-generated HTML**. Automated focus/ARIA checks are green but do not duplicate independent screen-reader QA.
3. New 100-year, multi-seed play after the new config bundling. Exact fixed-seed equivalence and focused suites significantly reduce risk but cannot substitute for a newly run century.
4. Very large saves and private/quota-constrained browsers remain subject to environment limits.

**No new features, financial rules, rights scope or save format changes were intentionally made.** The accepted game remains a technically accepted release candidate for its originally tested build; this refactor should be independently smoke-tested before replacing that build for users.
