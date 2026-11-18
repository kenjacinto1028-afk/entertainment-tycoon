# TODO — unfinished items, placeholders and maintenance-only follow-ups

**No approved gameplay features are unfinished.** The source project catalog has 309/309 feature foundations and 29/29 original acceptance gates recorded as accepted. Do not interpret this checklist as authorization to design new features, widen scope or create a version roadmap. All items below are testing/documentation/technical maintenance, not new mechanics.

## Verification still prudent after this handoff refactor

- [x] (automation PASS 2026-11-18; 3 manual slots and JSON export/import not covered by script) **Independent native-browser restart** of the newly generated `Studio_Syndicate_Playable_Handoff.html`, including same tab/new tab/full Chrome or Edge restart, large IndexedDB snapshot, three manual slots, missing pointer/corrupt primary, portable JSON export and import. Original accepted Update 52 user test passed, but handoff HTML was not independently run on the user's computer.
- [x] (closed by owner 2026-11-18, NVDA done with ChatGPT) **Independent NVDA/VoiceOver walkthrough** of the generated handoff HTML. The original accepted Update 52 received user-confirmed NVDA tests, not a formal accessibility certification.
- [ ] **New post-refactor 100-year, multi-seed economic endurance** with world, rights, debt, AI, tax and succession audits (prior Update 49 runs passed two player-managed 100-year campaigns). Handoff baseline preserves deterministic engine state; do not falsely claim a newly run century.
- [x] (manual PASS 2026-11-18 in Chrome/Edge/Brave; power-loss and mobile not tested) **Quota and multi-browser storage durability:** test long saves / multiple slots in normal/private modes; intentionally low storage quota; app restart, power-loss scenario, JSON backup.
- [ ] **Large world / mobile performance profiling:** many rivals, many historic archive records, long sessions, memory growth and keyboard navigation at small viewport.
- [ ] **Post-config-edit validation:** when altering rates, region tastes, startup values or event tables, rerun the complete regression and update baseline intentional-difference notes; do not automatically regenerate expected snapshots for a behavioral change.
- [ ] **Re-run `HARD_CODED_VALUES.tsv` audit after source edits**; its source-line index is accurate for this delivery, not an automatic living report. Review remaining numeric prose/UI labels before moving them (changing player-facing wording can be a feature change).

## Code markers, unimplemented stubs and placeholders

- `TODO`/`FIXME` or `NotImplemented` in the **maintained** engine, UI and build script: **none found** by source scan at package time. Tests and historical reports may contain `TODO` text or placeholders as fixture labels.
- Intentionally abstracted real-world systems are **design decisions, not unfinished stubs**: fictional simple automatic tax, abstracted lenders/guilds/agencies/regulators, no console manufacturing, no independent music business, no forced victory or compulsory individual-chapter/task management.
- The build intentionally joins per-system source **sections** into the historical shared closure rather than independent importable packages. They are valid, maintained modules at the build/source organization level. Converting to ESM components would be a significant new architectural change and is **not part of this approved handoff**.
- Some game text, SVG portrait geometry and code-level predicates remain in JavaScript by design; see `DATA_INVENTORY.md` for a complete audit and `config/onboarding.json` for objective labels.
- No additional feature proposals or content are authorized in this handoff. Ask the owner for new scope approval before coding new game systems.

## Handoff history and precedence

Accepted design catalog → final acceptance progress → actual maintained modules/config → new reproducible test evidence. Preserve save v34 and worldwide sector debut years 1/4/7/10. Any mismatch between old reports and current source needs verified investigation, not automatic feature expansion.
