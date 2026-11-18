# Update 52 — Evidence-led recovery and accessibility pass

Baseline: Update51 v34, 309/309 feature foundations, 27/29 full acceptance gates. `src/engine.js` hash: `45f71b7892e34883a858772a187e2c528d16442a7461c86c32e58ac9ec4c0c46`; no Git repository.

## Verified constraints
- Chromium is managed with `URLBlocklist: ["*"]` in the current runtime. Local or external origin navigation must **not** be bypassed; genuine native browser reload/restart persistence cannot be claimed here.
- Native origin and independent NVDA/VoiceOver QA are hard Gate06 acceptance requirements. Gate29 depends on Gate06.
- Existing IndexedDB and localStorage have backward-compatible v34 saves. In current `init()`, a valid IDB recovery is skipped if the IDB autosave pointer returns null rather than throwing. A write that commits to IndexedDB but cannot commit its localStorage pointer may be lost on next startup.

## Update 52 focus and gameplay risk
1. Recover a missing/corrupt IDB autosave from recovery, and locate a committed IDB autosave when the localStorage pointer is absent. Prefer a valid localStorage save if present; do not let an older orphaned IDB save override it. Never silently overwrite bad save bytes.
2. Ensure critical save failure is announced as an alert (not a transient success notice), while routine notifications remain status messages. Preserve keyboard accessibility.
3. Add explicit adversarial browser tests using declared storage doubles and re-run retained regressions. Provide unrestricted local-browser runner and screen-reader evidence requirements without misrepresenting simulated tests.

## Acceptance decision
Do not accept Gate06 or 29 without actual unrestricted-browser and independent assistive-technology evidence. Keep save format v34 and no cross-industry rule changes.
