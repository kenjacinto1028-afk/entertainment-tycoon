# Recovered Update 41 baseline — 2026-11-17

- Authoritative prior status: `STUDIO_SYNDICATE_MASTER_PROGRESS_Update_41.txt`: 273/309 foundation-verified; 17 partial and 19 unbuilt; save version 30. Only steps 01–02 workstream gates accepted.
- Previous build recovered from Project Library `Studio_Syndicate_Playable_Update_41.html` through six line-window *text* exports (raw-byte download unavailable). Rejoined into a self-contained HTML and separated two scripts and styles. Text reconstruction is 685,274 bytes; library's original listed length was 685,286 bytes (12-byte normalization difference). Not claimed byte-identical.
- `node --check` passed for recovered engine/UI; `createGame(seed, Year 1)`, `advance(4)`, and initial/end `audit()` passed without errors.
- There is no verified update 41 source ZIP in the mounted workspace. Update 03 source pack is older and was NOT used to replace Update 41 engine.
- Current work proceeds from reconstructed Update 41, preserving save-v30 data and implementing a compatible successor format.
