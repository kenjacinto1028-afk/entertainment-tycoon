# Update 51 — independent browser and assistive-technology checklist

**Automated native acceptance command (on an unrestricted computer)**

Install Python Playwright and Chromium as needed, then from the project directory run:

```bash
python -m pip install playwright
python -m playwright install chromium
python tests/update51_real_origin_acceptance.py
```

The test uses a temporary local-only web server and a disposable browser profile. It checks native localStorage and IndexedDB across a same-tab reload, a second tab and a full browser restart. It verifies a >5 MB compressed save and manually named slot rollback. A `BLOCKED` result is **not** a pass. To test the long-run actual snapshot, add `--century-snapshot /path/to/checkpoint.json` when that file is available.

**Independent accessibility inspection (NVDA or VoiceOver, normal browser):**

- Launch the game with keyboard only; announce the labelled new-game dialog and all required form fields.
- In a dialog, Tab and Shift+Tab remain inside it; Escape closes it and returns focus to the opener.
- Navigate the sidebar and four industry tabs; verify announced selection and industry debut restrictions.
- Open Settings; confirm each save slot has a distinct, spoken Save/Load name and label.
- Export and import a JSON backup using only the keyboard; invalid imports announce an error without replacing the game.
- Switch mobile viewport and test navigation, Inbox warning announcements and critical approvals without colour-only information.
- Open a production and inspect forecasts: cash, profit, known/estimated status and rights restrictions should remain distinguishable.

Record screen reader/browser versions, tested date, any focus/announcement problems, and native automated test output in `reports/UPDATE_51_INDEPENDENT_RESULTS.md`. **Do not mark Gate06/29 complete until the real results exist.**
