# Studio Syndicate — Update 52 Test Report

**Date:** 2026-11-17 · **Build:** Update 52 · **Save format:** v34 unchanged · **Feature foundations:** 309/309 · **Accepted workstream gates:** **27/29** (06 and 29 remain open).

## Gameplay-safe changes

- **Orphaned saves:** On launch, a valid IndexedDB autosave is recovered when a localStorage pointer is missing. The pointer is restored if the browser permits it. A valid localStorage campaign is never replaced by an older orphaned database snapshot.
- **Broken primary save:** An IndexedDB pointer without data now enters verified recovery rather than silently treating the user as a new campaign. Invalid primary data can fall back to a valid recovery snapshot; broken bytes remain untouched when no recovery is available. Manual slot and JSON import remain available.
- **Accessible failures:** Save failures and other consequential errors use `role="alert"`/assertive live announcements; ordinary success messages use `role="status"`/polite announcements. The modal focus rules, named forms, sidebar and industry tab navigation remain in place.
- `src/engine.js` SHA-256 **45f71b7892e34883a858772a187e2c528d16442a7461c86c32e58ac9ec4c0c46**, identical to Update51; no economic, chronology, rights, succession, or save-schema changes.

## Current-source verification

| Check | Result | Important limitation |
|---|---|---|
| Retained focused engine suites | **35/35 passed** in three bounded runs | Not substitute for full accessibility acceptance |
| Atomic IndexedDB transaction tests | **4/4 passed** | Test double, not native storage |
| Concurrent large-to-small autosave race | **1/1 passed** | Test double |
| Startup orphan/corrupt/backup recovery | **7/7 passed** | Browser with simulated persistent storage |
| Desktop/mobile accessible dialogs and status/errors | **2/2 passed** | No independent screen reader |
| 24.4 MB real century snapshot gzip/restore | **Passed**, ~2.26 MB compressed | Chromium-native gzip with explicit fake IndexedDB |
| Two seeded eight-year campaigns | **2/2 passed**, 64 quarterly audits and 8 reload checkpoints | Engine verification (in-process serialization) |
| Real native browser origin/restart | **BLOCKED (exit 3)** | Managed Chromium URLBlocklist forbids all navigation; not a pass |
| Independent NVDA/VoiceOver inspection | **Not performed** | Requires unrestricted computer with assistive technology |

Regression logs: `reports/UPDATE_52_FOCUSED_REGRESSION.txt`, `reports/UPDATE_52_STORAGE_AND_UI_REGRESSION.txt`, `reports/UPDATE_52_LARGE_SAVE_BROWSER.txt`, `reports/UPDATE_52_MULTISEED_ENGINE.txt`, `reports/UPDATE_52_NATIVE_ORIGIN_PROBE.txt`.

## Next verification steps

Run `python tests/update52_real_origin_acceptance.py` on an unrestricted computer with Playwright and Chromium. It tests actual localStorage and IndexedDB across reload/new tab/browser restart, large-save integrity, missing-pointer recovery, and broken-current recovery. Optionally provide a real century checkpoint with `--century-snapshot <path>`. Record its output alongside independent NVDA/VoiceOver inspection using `reports/UPDATE_52_MANUAL_AT_CHECKLIST.md`.

**Gate06 remains open until both native persistence and independent assistive technology are demonstrated. Gate29 remains open because it depends on Gate06.** Continue using exported JSON backups: browser storage can be cleared, evicted, or unavailable. No cloud sync is promised.
