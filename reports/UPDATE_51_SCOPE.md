# Studio Syndicate — Update 51 scope (2026-11-17)

Baseline: Update 50, save format v34; 309/309 feature foundations and 27/29 full acceptance gates. Gate 06 (native browser save persistence + assistive technology) and Gate 29 (final whole-game acceptance dependent on 06) are open. Latest verified current-engine century evidence is Update49, with two player-managed 100-year campaigns; Update50 adds 102 cross-era simulated years and browser storage-double tests.

| Workstream | Gameplay / reliability impact | Dependencies and edge cases | Acceptance evidence | Model effort |
|---|---|---|---|---|
| Save/recovery hardening | Prevent irreversible loss or confusion after interrupted large autosaves | IndexedDB failures, quota, prior valid snapshot, asynchronous writes, compatibility with v34 and manual slots | Force failures, read back prior state, verify recoverability | GPT-6 High |
| Genuine-origin acceptance kit | Makes native autosave, reload/new tab/restart, keyboard and accessible labels independently reproducible | Requires unrestricted desktop Chromium, origin with real storage; cannot spoof browser with about:blank | Executable harness and clearly recorded environment limitation | GPT-6 High |
| Regression/integrity review | Avoid rights/finance/succession regressions while changing persistence | Identical simulation engine, same sector gates, no new IP rights, no schema changes | Focused engine suite, browser workflows, long-save roundtrip and archive integrity | GPT-6 High |

**Gate policy:** Only mark Gate 06 accepted after a genuine native-origin lifecycle AND independent assistive-technology checks. Gate 29 requires Gate 06 plus final multi-seed whole-game evidence; otherwise retain 27/29.
