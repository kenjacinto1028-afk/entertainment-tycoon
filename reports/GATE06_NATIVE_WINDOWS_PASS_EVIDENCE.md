# Gate 06 — Independent Windows native-origin persistence evidence

**Date:** 2026-11-18. **Game:** Update 52 playable HTML (save format v34). **Origin:** user-run Playwright Chromium on Windows PC; results supplied as terminal screenshot in conversation, **not run in this managed container**.

## Native checks observed as PASS

- `PASS native same-tab reload + live turn resume`
- `PASS native same-origin new tab restore`
- `PASS native IndexedDB large-file write/read 6500060 characters 2552dd5f32ea`
- `PASS native full browser restart restores autosave`
- `PASS native manual save-slot rollback after restart`
- `PASS native browser restart + large-save recovery + manual slot rollback + keyboard dialog`
- `PASS native missing-pointer IndexedDB recovery`
- `PASS native corrupt-primary recovery without deleting evidence`
- Final line: **`NATIVE-ORIGIN AUTOMATION PASS. Independent screen-reader QA remains separate.`**

Prior failing test scripts had timing/diagnostic issues; the corrected diagnostic runner v2 was used for the independent run. The screenshot does not provide a 100-year actual-snapshot test or Chrome/NVDA version, and does not substitute for separate accessibility evidence. No cloud-sync assertions are made.
