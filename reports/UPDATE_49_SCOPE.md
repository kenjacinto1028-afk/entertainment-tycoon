# Update 49 — acceptance plan (2026-11-17)

| Gate | Work | Gameplay impact | Dependencies/edge conditions | Acceptance evidence | Effort |
|---|---|---|---|---|---|
| 19 | Installed bases, slow generational adoption and credible player-selected support budgets | Game sales tied to reachable platform audience; older platforms retain a niche; esports is an ongoing investment instead of a one-time buff | Fixed Y10/12/15/18 platform debuts, Y7 generation cadence, regional consumer wallets, legal release regions, paid studio operations | Early/late market comparisons, zero pre-debut installs, cap sales, payments stop on insufficient funds, saved and audited history | GPT-6 High |
| 06 | Native-origin saved campaign recovery and keyboard/accessibility review | Trustworthy local saves and readable controls | Security policy may block navigation; shim not accepted as native proof; avoid changing existing save format | Chromium native localStorage across reload and fresh tab, export/import, input labels and keyboard checks; explicit blocker if unavailable | GPT-6 Medium |
| 29 | Full-game current-build cross-media endurance | Confidence in long-lived gameplay | Must run after engine modifications; money, rights, succession, save integrity, cycles and platform economy | 2+ distinct 100-year player-managed seeds with yearly audits and decade reloads, bounded save size, no integrity errors | GPT-6 High |

No code changes unrelated to these dependencies; numerical multipliers are testable calibration rather than locked design.
