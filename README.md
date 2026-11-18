# Studio Syndicate — complete AI handoff

**Start with [HANDOFF.md](HANDOFF.md).** This is the completed, standalone, single-player fictional entertainment management game. This handoff **adds no gameplay features** and preserves the accepted Save v34 engine and four original industries.

- **Play immediately:** open `Studio_Syndicate_Playable_Handoff.html` in Chrome or Edge. It embeds its own JavaScript, styles and JSON. No web server or npm installation is required to play.
- **Modify/source:** edit `src/systems/`, `src/interface/`, `src/styles.css`, `src/persistence50.js` or the authoritative `config/*.json` inputs (not `compiled.json` and not `*_index.json`). Run `python tools/build.py` to rebuild. Do **not** edit the generated HTML or `dist/` directly.
- **Validate:** `python tools/verify.py` (requires Node.js); optionally `python tools/verify.py --browser` (requires Python Playwright and Chromium).
- **Status:** 309/309 planned feature foundations and 29/29 original acceptance gates approved based on original Update 52 evidence plus user-supplied native browser and NVDA tests. Refactored build passes 35/35 retained engine suites and simulated browser checks; its real-origin restart and independent NVDA sessions **have not been repeated** on the handoff-generated HTML.
- **For the next assistant:** read `HANDOFF.md`, `KNOWN_BUGS.md`, `TODO.md`, `BALANCE_NOTES.md` and `DATA_INVENTORY.md`, then `HARD_CODED_VALUES.tsv`; preserve the original game specification and never infer a new feature or version roadmap from this handoff.

The original accepted unchanged Update 52 playable HTML is kept under `historical/` for comparison. Historical reports and feature tracking are included for auditability. See `PACKAGE_MANIFEST_Handoff.json` for every packaged file hash.
