# STUDIO SYNDICATE — COMPLETE ENGINEERING HANDOFF

**Scope:** handoff of the already finished game, for testing, bug fixes and future maintenance. **No features were added here.** Original project catalog: `reference/studio_syndicate_feature_catalog.md`; authoritative acceptance records: `reports/FINAL_ACCEPTANCE_MATRIX.md` and `STUDIO_SYNDICATE_MASTER_PROGRESS_Final_Acceptance.md`. Do not invent new approved features, a version roadmap or new mechanics. Always distinguish original acceptance evidence from tests actually executed after the refactor.

## 1. At a glance

Studio Syndicate is an offline, local-save, single-player fictional entertainment management/tycoon game. The player starts an independent company, develops original IP, takes funded client commissions, licenses/adapts rights, manages teams, finances, distribution and strategy, and interacts with cash-constrained autonomous competitors. Enjoyable strategic choices, delegated routine management and executive-level summaries take priority over mandatory micromanagement.

**Exactly four commercial industries:** Books/Comics/Publishing (global Year 1), Movies (Year 4), Television & Streaming (Year 7), Video Games (Year 10). Streaming and game distribution mature later. No independent music-label/animation-industry/console-manufacturing business. Animation is a film/TV method; music is soundtrack/licensing input. Game storefronts, subscriptions and distribution are included. A company need not diversify.

**Default:** World Year 1, Independent Publisher. Other publishing origins include Comic/Manga Studio, Contract Publishing/Editorial Services and Established Publishing House. Optional advanced-world starts in Years 1, 4, 7, 10 and 25 (subject to sector eligibility) found a **new** company without inherited rival assets. Era-dependent prehistory is fictional, consistent and explicitly not invented live cash/rights. The world's age differs from company age.

**Time:** 52 weekly turns/year; 12 fictional months with repeating **4,4,5-week** periods each quarter, as in `config/world.json`. A week advances work, payroll, competitor actions, consumers, technology and news; month-end closes finances, bank interest, taxes and reporting; quarters produce expanded market briefs. Skip multiple weeks until a consequential interrupt. Manual detail, staff/team schedules and thresholds are optional. The UI has a separate action Inbox and event-driven News, four-tab Productions hub, IP/franchise pages, reports, search/sort and responsive lightweight monitoring.

**Win/lose:** there is **no forced win condition or end year**. Optional objectives measure progress but confer no free income. Distress can interrupt operations and produce a company bankruptcy. A retiring or removed executive must take a legally eligible role, lawfully found a different company or end the run; succession does **not** move shares, IP or debt by magic. Boards/shareholder voting apply only after optional corporation readiness or an eligible corporate scenario; IPO is separate and optional. Corporate governance does not apply to an ordinary startup.

**Core loop:** (1) read executive dashboard, cash runway, opportunities and critical Inbox; (2) choose original IP, commissioned work, licensing/adaptation, partnership or wait; (3) verify worldwide industry time gate **and** actual company capability, permitted IP scope, available team and cash; (4) budget/create/fund work, choose optional delegated or manual interventions; (5) advance/skip weeks while markets, rivals and teams evolve; (6) release, distribute, settle real spending and royalties, monitor results, archive reviews and repeat. Every major choice should compare **produce/license/co-produce/wait** with conservative/expected/optimistic cases and downside cash warning.

## 2. Run and dependencies

| Task | Command / method | Dependencies |
|---|---|---|
| Play | Double-click `Studio_Syndicate_Playable_Handoff.html`, use Chrome/Edge | Modern desktop Chromium browser; no server, database account, npm or internet |
| Rebuild editable source | `python tools/build.py` (from project root) | Python 3.10+ standard library only |
| Engine focused regression | `python tools/verify.py` | Python 3.10+ and Node.js 18+; no npm install needed |
| Browser shim checks | `python tools/verify.py --browser` | Above plus `pip install playwright` and `python -m playwright install chromium` |
| Native browser restart acceptance | `python tests/update52_real_origin_acceptance.py` | Unrestricted local Chromium/Playwright; see test script. The shipped diagnostic runner targets the handoff HTML by default; the user previously ran this same corrected runner on **accepted Update 52**, not yet the refactor. |
| JSON backup | Game's export/import controls | Browser file download/open support |

Stack: plain ECMAScript JavaScript, HTML, CSS, browser `localStorage` for compact snapshots/metadata, IndexedDB + native `CompressionStream`/`DecompressionStream` for large snapshots, Node CommonJS for headless engine tests, Python standard-library build script and optional Playwright tests. No React, bundler dependency, external cloud service or installable web server. Browser APIs must run in a suitable browser (not Node tests).

### Build/source architecture — important

- `src/systems/01_*.js` … `44_*.js` are **ordered domain source sections**, grouped by system, combined into **one shared historical engine closure** in `dist/engine.js`. They are *not* separate independently-importable ESM packages. This ordering preserves original function visibility, RNG progression, API and v34 saves.
- `src/interface/01_*.js` … `19_*.js` are ordered UI source sections similarly combined into `dist/ui.js`. UI is separate from the pure/mostly deterministic simulation engine, but all UI sections share a closure.
- `src/engine_order.json` and `src/ui_order.json` explicitly define order. Never alphabetize it silently; change order only after proving initialization remains correct.
- `src/engine_bootstrap/` and `src/ui_bootstrap/` contain the wrapper open/close sections.
- The generator reads all authoritative `config/*.json` **excluding** `compiled.json` and `*_index.json`; creates `config/compiled.json`, `dist/engine.js`, `dist/ui.js`, and self-contained `Studio_Syndicate_Playable_Handoff.html`. Config is embedded at build time. **Edits to JSON require rebuilding the standalone HTML.** No runtime network fetch.
- In Node, the engine reads `require('../config/compiled.json')`. In the browser, it reads `globalThis.__STUDIO_CONFIG__`, embedded before the engine script. UI reads `StudioEngine.CONFIG`. The named tuning keys `functionName__NNN` are implementation-facing stable references; their pre-refactor origins appear in `config/tuning_engine_index.json` and `config/tuning_ui_index.json`.
- **Always modify maintained `src/` or authoritative `config/`, not `dist/`, `config/compiled.json`, or the generated playable HTML.** Run build → regression → browser → save validation before shipping.
- The original accepted Update 52 HTML is immutable comparison material under `historical/Studio_Syndicate_Accepted_Update_52.html`. Historic reporting and test files are evidence/fixtures, not extra running game files.

## 3. Systems and gameplay effects

| System | State, behavior and important connections | Primary maintained modules / config |
|---|---|---|
| Calendar / world | Weekly tick, 4/4/5 monthly close, year/sector gates, advanced era, history, interruptions | `01`, `07`, `18`, `38` engine sections; `world.json` |
| Regions / audiences | Four fictional regions/currencies, three cohorts, genre tastes, finite weekly entertainment wallets; world/population settings change available demand | `01`, `02`, `16`, `17`; `regions.json`, `world.json` |
| Technology / unlocks | Independent discovery and adoption speeds; cannot produce before worldwide debut even with binding pre-debut option; after debut still need paid staff/knowledge, partner or acquisition | `01`, `39`, `41`; `world.json`, `tuning_engine.json` |
| Supply/demand and prices | Product genre/quality, target cohort, release age, marketing, distribution channel, rival share and platform installed base affect shares of *existing* customer wallets. No unlimited purchases | `16`, `26`–`31`, `43`; `regions.json`, `publishing.json`, `games.json` |
| Companies / production capacity | Team slots, wages, real paid staff, specialist scheduling, management/delegation thresholds; no free parallel assignment or indefinite unpaid labor | `02`, `03`, `10`, `12`, `13`, `18`, `19`, `39`; `starting.json`, `tuning_engine.json` |
| Project pipeline | Preview budget/timeline then original/adaptation/contract/co-production, production phases, paid revisions, launch and weekly postlaunch sales | `05`–`12`, `26`–`31`, `39`–`43`; `world.json`, individual media JSON |
| Books/comics | Manuscript offers, advance and author approval, editorial/serial decisions, imprints, translations, preorders, ebook/audiobook, actual stock, returns, write-offs, royalties | `08`–`12`, `16`; `publishing.json`, `creativity.json` |
| Movies | Casting availability/fee, screenplay, production facilities, screening, reshoots, premiere/regional windows, content rating vs reviews, ticket income and festivals | `26`–`27`; `film.json` |
| Television/streaming | Series/episodes, casting, writer room, broadcasting time slots, renewals, syndication; streaming licensed catalogs, tier price, churn, bounded shared subscriber spending | `27`–`29`, `16`–`17`; `television.json` |
| Video games | Design, prototype, engine, QA/bugs, beta/certification, ratings, launch, platform generations installed-base adoption, storefronts, subscriptions, esports/live-service paid maintenance | `29`–`31`, `41`–`44`; `games.json`, `tuning_engine.json` |
| IP/rights/adaptation | **One rights ledger** for owner, source IP, work, medium, region, exclusivity, options, sublicensing, approvals, term, continuation, royalty obligations. Permission checked for production and distribution. No implied lifetime sale rights | `14`–`15`, `19`–`21`, `28`, `40`–`41`; `creativity.json`, finance config |
| Contracts | Client offers funded by third-party escrow, earned milestone releases, rework/arbitration/cancel/refund; real co-production cost/revenue sharing | `05`–`06`, `21`, `42`; `finance.json` and tuning |
| Finance & cash flow | Book income/expense, direct vs separately allocated overhead, cash ≠ profit, partner prepaid/deferred, sales/royalty/tax/interest payable; company and consolidated statements eliminate internal trades | `06`, `13`, `16`–`17`, `21`–`24`; `finance.json`, `regions.json` |
| Taxes/incentives | Fictional simple per-region profit and sales taxes plus payroll levy; qualifying automatic incentives offset tax, not create cash; no tax-filing minigame | `16`–`17`, `22`–`24`; `regions.json` |
| Banks/interest | Funded lender term loans and revolvers; eligibility/collateral, fees, monthly debt service, arrears, delinquency and one bank-consented workout. Debt remains after bankruptcy | `13`, `17`, `36`, `43`; `tuning_engine.json` |
| Inflation/macro/FX | Quarterly confidence, employment, cost/FX and interest index affect budgets, wages, pricing feasibility, credit and forecast, not arbitrary new cash | `01`–`02`, `17`–`18`; `regions.json`, `world.json` |
| Autonomous competitors | Rival identity/plans and personality, grounded funded entry, project capacity, same consumer wallet and rights, co-production, deals, bankruptcy; public/estimated/forecast labels for intelligence | `03`, `07`, `17`–`18`, `35`–`38`; `rivals.json` |
| Acquisitions / corporations / succession | Diligence, purchase own money, subsidiary/legal ownership preserved; boards only post-incorporation, optional IPO, votes/shares distinct from management; succession lawful or new company/end run | `14`, `32`–`38`; `finance.json`, `starting.json` |
| Forecasts / archives | Read-only investment scenarios, liquidity alarms, financial statements, postmortems, awards, rankings, historical archive; no post hoc invented cash, rights or precise rival secrets | `07`, `16`–`18`, `22`, `24`–`28`, `40`; `events.json` |
| Interface / onboarding | Desktop tabs, projects, searchable views, dashboards, optional tutorial/adviser/goals, accessible modals/alerts, responsive smaller viewport, saved customization | `src/interface/01`–`19`, `src/styles.css`; `onboarding.json`, `forms.json`, `tuning_ui.json` |
| Saves | Seed, RNG, week, projects, companies, finance, rights and histories serialized as v34 JSON; browser autosave/recovery slots and user file import/export | `25_saves.js`, `src/persistence50.js`, `src/interface/01,09,12,16`; `save.json` |

**Connections:** Setup/settings → world year/technology/regions → finite sector wallets → rival + player competing titles/cohorts → distribution/price/window/installed-base limits → customer gross receipts (exactly once) → company fees/royalty/tax and other obligations → cash/asset/liability journals → staffed production and secured loans → monthly close/quarterly forecasts → adviser/Inbox/news → player decisions. Rights and sector clocks gate production; sublicenses and expiry gate subsequent distribution. Corporate ownership and IP title are different ledgers. Acquisitions and succession never bypass either ledger.

## 4. Economy: actual formulas, named config sources, and consequences

The formulas below summarize the implementation, not a promise of a real-world economy. Every numeric coefficient mentioned is in JSON; **`DATA_INVENTORY.md` lists all remaining exceptions**, and `HARD_CODED_VALUES.tsv` has exhaustive source location.

**Global sector debut and startup project anchor** (`config/world.json:SECTORS`):

| Sector | First global year | Nominal base project cost | Base work weeks |
|---|---:|---:|---:|
| Publishing | 1 | 11,500 | 12 |
| Movies | 4 | 52,000 | 25 |
| Television | 7 | 34,500 | 21 |
| Video Games | 10 | 44,000 | 29 |

`sectorCost = round(SECTORS[sector].cost × formatFactor × size / sectorCost__001) × sectorCost__002` (see `07_world_initialization_and_forecasting.js` and `config/tuning_engine.json`).

`previewProject` (`09_publishing.js`): `base = sectorCost × REGIONS[productionRegion].productionCost`; `budget = rounded(base × (partnerCapability ? budget__001 : 1))`; `weeks = max(weeks__003, round(SECTORS[sector].weeks × (weeks__004 + size × weeks__005)))`; `marketing` uses marketing percentage and configured rounding; `grandTotal = budget + marketing`; physical publishing editions also reserve/pay print stock. Contract work must have funded customer/escrow and a valid accepted offer. All inputs in `config/regions.json`, `config/world.json` and `config/tuning_engine.json`.

**Regional wallet:** `worldMarketBudget` (`02_staff_and_careers.js`) computes, after the sector's actual global launch:

```
weeklyWallet = roundMoney(
  region.cash × sectorDemandFactor × sectorMaturity × globalMacroIndex
  × populationScale × regionConfidence × regionalFX
  × clamp(regionalEmployment, 0.75, 1.15)
  × (1 + 0.12 × sectorTechnologyAdoption))
sectorMaturity = clamp(0.48 + 0.17 × yearsSinceDebut, 0.48, 1.42)
sectorDemandFactor = {publishing:1, movie:1.26, tv:1.03, games:1.17}
```

Exact keys: `config/tuning_engine.json` `maturity__001..004`, `worldMarketBudget__001..006`; region `.cash`, `.baseFx`, `.productionCost`, `.tastes` and `COHORT_TASTES` in `config/regions.json`; global macro and technology from world state. `money` rounds to two decimal places using `money__001, money__002`. This is a **demand ceiling**, not a deposit to anyone's bank.

**Share and sales** (`16_market.js`): Each eligible title's share is proportional to `quality^titleWeights__002 × regionalGenreTaste × cohortGenreTaste × marketingBoost × releaseAgeDecay × audienceAffinity × franchiseMomentum × industrySpecificMultiplier`. Background rivals and an outside option are included in the denominator (`denominator__001`); each title receives at most `weeklyWallet × normalizedShare`. TV streaming reservations and game subscriptions/market reservations reduce the remaining wallet first. Licensing, distribution eligibility, platform installed base and publish stock further cap gross. Fees/agent/royalty obligations are charged on actual receipts; never count a storefront pass-through as a second consumer purchase. Config: `tuning_engine.json`, `regions.json`, `publishing.json`, `games.json`. Sales continue after rights expiry *only* under explicitly recorded continuation weeks.

**Game platform installed base** (`43_games.js`): Regional population proxy `round(region.cash × regionalPopulation__001 × populationScale)`; platform-wide penetration `penetration__001 + penetration__002 × (1 - exp(-globalAge × adoptionPace / penetration__003))` clamped to `penetration__004..005`; generation adoption uses an analogous exponential `generationAdoption__001..005`; older-generation retention `exp(-retiredYears × retained__001 × adoptionPace)`; installed base = min(allGenerations, floored population × generationAdoption × retention). Paid game units cannot exceed remaining install-base buyers; free-to-play units proxy weekly active audience, not a new unlimited wallet. Platform first-year rules from `games.json:GAME_PLATFORMS`; all numeric coefficients from `tuning_engine.json`.

**Loans and interest** (`01`, `13`, `17`, `36`):

```
annualRate = clamp(difficultyBase × homeRegion.interestIndex, 0.035, 0.22)
difficultyBase = casual 0.08, standard 0.10, challenging 0.13
monthlyInterest = roundMoney(principalOutstanding × annualRate × weeksInMonth / 52)
principalScheduled = cumulative original principal × installmentsDue / 24
```

`marketLoanRate` uses `base__001..003`, `marketLoanRate__001..002`; `serviceLoans` uses `interest__002`, `serviceLoans__001`, `scheduled__004..006`, all in `config/tuning_engine.json`. Arrears survive the monthly close, principal payment reduces *debt and cash* rather than profit, and consensual workout preserves outstanding principal plus additional contractual cost. Revolvers use borrowing limits and funding fees, not revenue.

**Company payroll** (`07_world_initialization_and_forecasting.js`): `weeklyOverhead = roundMoney(max(minPayroll, companyBase + team/capacity surcharge + original-origin weekly obligations + named staff salaries + culture adjustment - double-counted team baseline) × regional.wageIndex)` using `config/tuning_engine.json` keys `base__004..008`, `weeklyOverhead__001..002`, `culture__001..002`. Teams cannot continue productive work indefinitely when unfunded.

**Tax close** (`17_finance.js`, `config/regions.json`): `periodProfit = periodRevenue − periodExpense`; `taxBeforeCredits = roundMoney(max(0,periodProfit) × companyTaxRate)`; `usedCredit = min(taxBeforeCredits, creditCarry + periodCreditEarned)`; `taxDue = taxBeforeCredits − usedCredit`. Region profit rates are 10%–13%, sales tax 1.5%–3%, payroll levy 0.4%–0.7%; eligible incentives 2%–5% of qualifying expenses/transactions, not perpetual cash grants. Tax credit leftovers expire at year end without refund. Region company `profitTaxRate`, `salesTaxRate`, `payrollLevyRate`, `incentiveRate` are in `config/regions.json`, with specific transaction coefficients in `tuning_engine.json`. Liabilities remain until actually paid; monthly close also services bank interest before profit tax.

**Postmortems** (`17_finance.js`): each released player project receives a 13-week observation report at `week − releaseWeek >= 12`; `variance = actualDirectContribution − expectedScenarioDirectContribution`, with known total costs, cash receipts, actual gross and caveated attribution. `reviewReleases__001=12`, `reviewReleases__002=13` live in `tuning_engine.json`. Major reports raise alerts; ordinary reports are optional to inspect.

**Cash/financial accounting**: Use `transact` for double-entry-like signed cash/receivable/prepaid/payable/loan/equity bridges; `revenue` and `expense` are not the same as cash movement, and `groupFinanceReport/consolidatedStatements` eliminate *internal* trade at group level. `audit`, `closedSettlementAudit`, `groupObligationIntegrity`, project/royalty statements and ledger retention enforce consistency. `config/finance.json` declares duty kinds/central services and `EPS` tolerance. Do not casually rewrite transaction legs to improve profitability.

## 5. State, saves, migrations and browser durability

- Save schema **v34** comes from `config/save.json:SAVE_VERSION` and is checked at build time. `StudioEngine.createGame` creates a deterministic seeded world; `StudioEngine.advance(s,n)` changes time, and `StudioEngine.loadState` validates/migrates JSON. `StudioEngine.audit(s)` returns integrity problems. Historically supported older saves are migrated by `src/systems/25_saves.js`; keep `tests/fixtures/engine41.js` for v30 upgrade coverage.
- JSON is the complete serializable world state: `version`, `seed`, RNG `rng`, unique `sequence`, world `week`, settings, regional economy/technology, companies/subsidiaries, employee/specialist/AI data, projects/works/IP/rights/grants, cash ledger and tax/bank/royalty obligations, sales, reports, rival archives, news and Inbox, founder/governance and management preferences. Serialized state is **not** a compact replay log. Do not drop historical fields to cut size without migration tests.
- Browser `src/persistence50.js` uses localStorage for small saves and/or pointers and IndexedDB (`studio-syndicate-local-v50`, object store `campaigns`) for large snapshots. Browser-native gzip is enabled for large enough JSON (threshold lives in infrastructure code). Autosave saves current and prior recovery in **one IndexedDB transaction**, handles missing pointers and corrupt primaries. Three manual slots and a portable downloaded JSON export/import are available. A save is never trusted solely because a pointer exists.
- Original accepted Update 52 was independently tested by the user on Windows Chromium: **NATIVE-ORIGIN AUTOMATION PASS** (same tab/new tab/full restart/manual rollback/large IndexedDB/missing-pointer/corrupt recovery), plus user-confirmed NVDA screen-reader checks. The **new handoff-generated HTML** passes simulated recovery, UI focus and source-equivalence checks here but **native browser restart and NVDA must be repeated before asserting independent refactor acceptance**.
- Save v34 compatibility is unchanged in the refactor. If any code/config change alters stored fields or RNG flow, create explicit migration/test fixtures and disclose that change. Browser storage quota is implementation dependent; advise users to export important long-lived campaigns.

## 6. Coding conventions and maintenance guardrails

- Naming: `s` = mutable world state; `c` = company; `p` = production/project; `f` = finance; `ip` = underlying intellectual property; `g` = grant. `CFG` references externally defined JSON values. Functions often use `nounAction` or `verbNoun`; UI state is in its own closure and calls `StudioEngine` API, not internal engine functions.
- Data mutation: only validated engine actions should change world state; report/quote/forecast methods are read-only; monetary values use `money(...)`, never raw unrestricted floating-point; randomness uses `rand(s)` with saved `s.rng`, **not** `Math.random` in the engine.
- Ledger: external cash source/destination, payable and royalty owner are separate; sector gates/rights/capacity/approvals checked on both deal and execution; when rights expire distribution stops unless the contract's recorded term expressly continues.
- UI: escape user-authored strings before HTML injection, preserve high-contrast keyboard-focus and named-dialog semantics, avoid blocking required actions in inaccessible tabs. UI source sections are grouped by screen and actions; they are not independent ES modules.
- Config: keep *economic parameters and names* in descriptive JSON or `tuning_*` JSON; keys `function__NNN` preserve literal-order extraction and can be renamed only with paired JS edits and full regressions; no JavaScript predicates in JSON (`OBJECTIVE_TESTS43` are intentionally code, while objective labels/thresholds are config).
- Tests: reproduce baseline fixed-seed signatures, run every focused suite, browser accessibility/recovery, 8/20/100-year multi-seed audits for changes affecting money/rights/world timing/succession, migration/save import/export and a native browser restart for changed persistence code. Historic suite reports **do not** substitute for a newly run test.
- Workflow: inspect `TASK_STATE.md` first, run git status/log if repository is present, make one atomic change, save checkpoint, commit if in Git, disclose uncertain behavior; avoid unapproved roadmap/features.

## 7. Status and known caveats

- The original project’s recorded acceptance was **29/29 workstreams and 309/309 feature foundations**. This handoff is a source/data organization change, not new final design signoff.
- **Refactor verification performed:** 35/35 retained engine suites; two injected Chromium keyboard/accessibility widths; 7/7 browser recovery checks with simulated storage; fixed-seed game-state hash equivalence against original Update 52 (three scenarios, each 78 weekly actions); Node engine/UI syntax; full rebuild. Native restart/screen reader **not retested on generated handoff HTML**; see `TODO.md`.
- `KNOWN_BUGS.md` records currently known defects and resolved historic bugs; `BALANCE_NOTES.md` separates measured results from unproven long-run judgments; `TODO.md` inventories remaining test tasks and scans for stubs without proposing new features.
- `DATA_INVENTORY.md` describes every JSON/config file, authored/generated distinction, and the exhaustive `HARD_CODED_VALUES.tsv` line inventory.

## 8. Complete file and folder map

This section is generated from the delivery file tree **after documentation**, with **one row per packaged file**. Generated artifacts, historic tests and reference evidence are included; users only need the standalone HTML to play. The next assistant should consult `PACKAGE_MANIFEST_Handoff.json` to verify contents and hashes. Every path below is relative to the ZIP root (this directory).

<!-- FILE_MAP_BEGIN -->

| File | One-line purpose |
|---|---|
| `BALANCE_NOTES.md` | Tested economic behavior, likely balance sensitivity and config knobs. |
| `DATA_INVENTORY.md` | Every authored/generated config JSON and the line-level literal inventories. |
| `HANDOFF.md` | Comprehensive engineering handoff, system contracts, formulas, conventions and complete file map. |
| `HARD_CODED_STRINGS.tsv` | Every retained string/template literal or indexed HTML label with file and line. |
| `HARD_CODED_VALUES.tsv` | Every retained numeric-bearing literal with source file, line, column and context. |
| `KNOWN_BUGS.md` | Current verified defects, unresolved verification risks and previously fixed bugs. |
| `MASTER_FEATURE_STATUS_Final_Acceptance.json` | Machine-readable feature-catalog acceptance snapshot. |
| `MASTER_FEATURE_STATUS_Update_52.json` | Machine-readable feature-catalog acceptance snapshot. |
| `PACKAGE_MANIFEST_Final_Acceptance.json` | Per-file hash/byte manifest for source archive integrity; not gameplay input. |
| `PACKAGE_MANIFEST_Handoff.json` | Per-file hash/byte manifest for source archive integrity; not gameplay input. |
| `README.md` | Entry-point instructions, build/test commands and package status. |
| `README_Final_Acceptance.md` | Historical or handoff source/support artifact; see name and original file content. |
| `README_Update_52.md` | Historical or handoff source/support artifact; see name and original file content. |
| `STUDIO_SYNDICATE_MASTER_PROGRESS_Final_Acceptance.md` | Prior accepted 309-feature tracker snapshot; historical, not runtime config. |
| `STUDIO_SYNDICATE_MASTER_PROGRESS_Update_52.md` | Prior accepted 309-feature tracker snapshot; historical, not runtime config. |
| `Studio_Syndicate_Playable_Handoff.html` | Fully standalone playable game; generated from maintained modules and embedded JSON. |
| `TASK_STATE.md` | Atomic recovery checklist documenting the handoff build/validation/package checkpoints. |
| `TEST_REPORT_Final_Acceptance.md` | Retained accepted-release test evidence and caveats. |
| `TEST_REPORT_Handoff.md` | Verification performed on the newly refactored source and its limits. |
| `TEST_REPORT_Update_52.md` | Retained accepted-release test evidence and caveats. |
| `TODO.md` | Unfinished verification/maintenance work and explicit no-new-feature boundary. |
| `config/compiled.json` | Build-generated aggregate JSON loaded by Node engine and embedded in standalone HTML. |
| `config/creativity.json` | Authoritative playable configuration for creativity; see DATA_INVENTORY.md. |
| `config/events.json` | Authoritative playable configuration for events; see DATA_INVENTORY.md. |
| `config/film.json` | Authoritative playable configuration for film; see DATA_INVENTORY.md. |
| `config/finance.json` | Authoritative playable configuration for finance; see DATA_INVENTORY.md. |
| `config/forms.json` | Authoritative playable configuration for forms; see DATA_INVENTORY.md. |
| `config/forms_index.json` | Numeric/input-form extraction provenance and original code-context mapping; metadata, not runtime config. |
| `config/games.json` | Authoritative playable configuration for games; see DATA_INVENTORY.md. |
| `config/onboarding.json` | Authoritative playable configuration for onboarding; see DATA_INVENTORY.md. |
| `config/publishing.json` | Authoritative playable configuration for publishing; see DATA_INVENTORY.md. |
| `config/regions.json` | Authoritative playable configuration for regions; see DATA_INVENTORY.md. |
| `config/rivals.json` | Authoritative playable configuration for rivals; see DATA_INVENTORY.md. |
| `config/save.json` | Authoritative playable configuration for save; see DATA_INVENTORY.md. |
| `config/starting.json` | Authoritative playable configuration for starting; see DATA_INVENTORY.md. |
| `config/television.json` | Authoritative playable configuration for television; see DATA_INVENTORY.md. |
| `config/tuning_engine.json` | Authoritative playable configuration for tuning engine; see DATA_INVENTORY.md. |
| `config/tuning_engine_index.json` | Numeric/input-form extraction provenance and original code-context mapping; metadata, not runtime config. |
| `config/tuning_ui.json` | Authoritative playable configuration for tuning ui; see DATA_INVENTORY.md. |
| `config/tuning_ui_index.json` | Numeric/input-form extraction provenance and original code-context mapping; metadata, not runtime config. |
| `config/world.json` | Authoritative playable configuration for world; see DATA_INVENTORY.md. |
| `dist/engine.js` | Build-generated engine JS bundle for Node/browser testing; do not edit. |
| `dist/ui.js` | Build-generated ui JS bundle for Node/browser testing; do not edit. |
| `historical/PACKAGE_MANIFEST_Update_52.json` | Per-file hash/byte manifest for source archive integrity; not gameplay input. |
| `historical/README_original_Update_52.md` | Original accepted Update 52 game/report kept for comparison and regression. |
| `historical/Studio_Syndicate_Accepted_Update_52.html` | Original accepted Update 52 game/report kept for comparison and regression. |
| `reference/studio_syndicate_feature_catalog.md` | Approved 309-feature catalog / historical design source for maintenance decisions. |
| `reports/BASELINE_41.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/FINAL_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/GATE06_INDEPENDENT_NVDA_RESULTS.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/GATE06_NATIVE_WINDOWS_PASS_EVIDENCE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/GATE29_FINAL_GAME_REVIEW.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/REFACTOR_GENERATION_NOTE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_42A_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_42B_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_42C_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_42_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_42_INTEGRATION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_42_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_42_STRESS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43A_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43B_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43C_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43_CENTURY.exit` | Retained earlier test artifact for traceability. |
| `reports/UPDATE_43_CENTURY.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_43_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_44A_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_44_BALANCE.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_44_BALANCE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_BALANCE_SUMMARY.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_44_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_BROWSER_EXPORTED_SAVE.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_44_CROSS_SYSTEM.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_DEBUG_GAME.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_DEBUG_LONG.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_DIFFICULTY_PAIRS.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_44_DIFFICULTY_PAIRS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_FINANCE_GATE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_FULL_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_PLAYER_CENTURY.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_44_PLAYER_CENTURY.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_PLAYER_CENTURY_DEBUG.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_44_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_44_SUCCESSION_DIAGNOSTIC.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_45_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_BROWSER_EXPORTED_SAVE.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_45_BUSINESS_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_FULL_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_INDUSTRY_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_LONG_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_MULTISEED.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_45_MULTISEED.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_PLAN.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_45_RELEASE_MANIFEST.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_45_RIGHTS_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_STREAMING_WALLET.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_45_WORLD_TESTS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_46_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_BROWSER_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_FINANCE_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_FULL_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_LONG_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_MULTISEED.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_46_MULTISEED.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_46_STRESS_RETRY.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_47_BASELINE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_CAREERS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_DISPUTES.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_EDITORIAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_LENDERS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_LONGRUN_ACCEPTANCE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_MULTISEED.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_47_MULTISEED_RUN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_RETAINED_DETAILS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_RETAINED_RUN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_RIVALS.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_47_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_47_SUCCESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_48_ARCHIVE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_BASELINE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_BUILD.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_BUILD_LOG.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_FILM.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_FOCUSED_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_FRANCHISE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_FULL_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_GAMES.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_GAMES_PRE_FIX.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_MULTISEED.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_48_MULTISEED.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_NATIVE_ORIGIN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_PACKAGE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_48_STORE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_STORE_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_STORE_PRE_FIX.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_48_TV.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_49_ALL_FOCUSED.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_ALL_FOCUSED_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_BASELINE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_BROWSER_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_CENTURY_RUN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_CENTURY_games.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_49_CENTURY_games_final.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_49_CENTURY_publishing.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_49_CENTURY_publishing_final.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_49_FINAL_CENTURIES.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_LONG_PLATFORM.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_NATIVE_ORIGIN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_PLATFORM_GATE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_RETAINED_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_RETAINED_OUTPUT.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_49_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_50_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_50_ACCESSIBILITY.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_ACCESSIBILITY_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_BROWSER_EXPORTED_SAVE.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_50_FOCUSED_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_FOCUSED_RUN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_LARGE_SAVE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_LARGE_SAVE_CORE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_LARGE_SAVE_DEBUG.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_LARGE_SAVE_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_MULTISEED.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_MULTISEED_EVIDENCE.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_50_MULTISEED_EVIDENCE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_50_NATIVE_ORIGIN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_RECOVERY_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_50_SEED5.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_SEED6.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_50_u50-y25-mature-broad.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_50_u50-y25-small-publisher.summary.json` | Retained earlier test result or acceptance data, not runtime gameplay configuration. |
| `reports/UPDATE_51_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_51_BROWSER_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_BUILD.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_FOCUSED_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_MANUAL_AT_CHECKLIST.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_51_NATIVE_ORIGIN.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_PACKAGE_FINAL.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_QUEUE_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_51_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_51_STORAGE_ATOMIC.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_ACCEPTANCE_MATRIX.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_52_ACCESSIBILITY_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_FOCUSED_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_LARGE_SAVE_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_MANUAL_AT_CHECKLIST.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_52_MULTISEED_ENGINE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_NATIVE_ORIGIN_PROBE.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_RECOVERY_BROWSER.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/UPDATE_52_SCOPE.md` | Retained earlier accepted evidence, matrix, accessibility checklist or run notes. |
| `reports/UPDATE_52_STORAGE_AND_UI_REGRESSION.txt` | Retained earlier simulation/regression/browser output and acceptance evidence. |
| `reports/handoff/FOCUSED_REGRESSION.log` | Actual handoff-run verification log or provenance record: FOCUSED REGRESSION.log. |
| `reports/handoff/FOCUSED_REGRESSION_FINAL.log` | Actual handoff-run verification log or provenance record: FOCUSED REGRESSION FINAL.log. |
| `reports/handoff/FOCUSED_SUMMARY.json` | Actual handoff-run verification log or provenance record: FOCUSED SUMMARY.json. |
| `reports/handoff/FOCUSED_SUMMARY_FINAL.json` | Actual handoff-run verification log or provenance record: FOCUSED SUMMARY FINAL.json. |
| `reports/handoff/HARDCODE_AUDIT_COUNTS.json` | Actual handoff-run verification log or provenance record: HARDCODE AUDIT COUNTS.json. |
| `reports/handoff/RECOVERY_BROWSER.log` | Actual handoff-run verification log or provenance record: RECOVERY BROWSER.log. |
| `reports/handoff/RECOVERY_BROWSER_FINAL.log` | Actual handoff-run verification log or provenance record: RECOVERY BROWSER FINAL.log. |
| `reports/handoff/UI_ACCESSIBILITY.log` | Actual handoff-run verification log or provenance record: UI ACCESSIBILITY.log. |
| `reports/handoff/UI_ACCESSIBILITY_FINAL.log` | Actual handoff-run verification log or provenance record: UI ACCESSIBILITY FINAL.log. |
| `reports/handoff/VERIFY_Handoff.log` | Actual handoff-run verification log or provenance record: VERIFY Handoff.log. |
| `src/engine_bootstrap/close.js` | Engine closure wrapper close.js; preserves CommonJS and browser API scope. |
| `src/engine_bootstrap/open.js` | Engine closure wrapper open.js; preserves CommonJS and browser API scope. |
| `src/engine_order.json` | Authoritative ordered engine section/source manifest for builder. |
| `src/interface/01_ui_state_and_utilities.js` | Maintained UI section: ui state and utilities; concatenated in manifest order. |
| `src/interface/02_dashboard_and_streaming.js` | Maintained UI section: dashboard and streaming; concatenated in manifest order. |
| `src/interface/03_games.js` | Maintained UI section: games; concatenated in manifest order. |
| `src/interface/04_publishing.js` | Maintained UI section: publishing; concatenated in manifest order. |
| `src/interface/05_staff_and_people.js` | Maintained UI section: staff and people; concatenated in manifest order. |
| `src/interface/06_library_and_royalties.js` | Maintained UI section: library and royalties; concatenated in manifest order. |
| `src/interface/07_rights_and_research.js` | Maintained UI section: rights and research; concatenated in manifest order. |
| `src/interface/08_portfolio_finance_world_settings.js` | Maintained UI section: portfolio finance world settings; concatenated in manifest order. |
| `src/interface/09_saves_and_production_forms.js` | Maintained UI section: saves and production forms; concatenated in manifest order. |
| `src/interface/10_production_form_handlers.js` | Maintained UI section: production form handlers; concatenated in manifest order. |
| `src/interface/11_corporate_and_contract_modals.js` | Maintained UI section: corporate and contract modals; concatenated in manifest order. |
| `src/interface/12_navigation_render_and_init.js` | Maintained UI section: navigation render and init; concatenated in manifest order. |
| `src/interface/13_click_action_handlers.js` | Maintained UI section: click action handlers; concatenated in manifest order. |
| `src/interface/14_forms_and_career.js` | Maintained UI section: forms and career; concatenated in manifest order. |
| `src/interface/15_world_and_corporate_panels.js` | Maintained UI section: world and corporate panels; concatenated in manifest order. |
| `src/interface/16_setup_and_start_screen.js` | Maintained UI section: setup and start screen; concatenated in manifest order. |
| `src/interface/17_portraits_and_rights.js` | Maintained UI section: portraits and rights; concatenated in manifest order. |
| `src/interface/18_funding_and_financial_views.js` | Maintained UI section: funding and financial views; concatenated in manifest order. |
| `src/interface/19_game_service_handlers.js` | Maintained UI section: game service handlers; concatenated in manifest order. |
| `src/persistence50.js` | Native browser save/recovery/IndexedDB/gzip implementation loaded between engine and UI. |
| `src/shell.html` | Maintained standalone HTML skeleton with builder engine/UI/styles placeholders. |
| `src/styles.css` | Maintained responsive, contrast and keyboard-focus style rules. |
| `src/systems/01_world_calendar_and_setup.js` | Maintained engine section: world calendar and setup; concatenated in manifest order. |
| `src/systems/02_staff_and_careers.js` | Maintained engine section: staff and careers; concatenated in manifest order. |
| `src/systems/03_companies_and_teams.js` | Maintained engine section: companies and teams; concatenated in manifest order. |
| `src/systems/04_news_and_relationships.js` | Maintained engine section: news and relationships; concatenated in manifest order. |
| `src/systems/05_client_contracts_and_coproduction.js` | Maintained engine section: client contracts and coproduction; concatenated in manifest order. |
| `src/systems/06_project_finance_and_cancellation.js` | Maintained engine section: project finance and cancellation; concatenated in manifest order. |
| `src/systems/07_world_initialization_and_forecasting.js` | Maintained engine section: world initialization and forecasting; concatenated in manifest order. |
| `src/systems/08_publishing.js` | Maintained engine section: publishing; concatenated in manifest order. |
| `src/systems/09_publishing.js` | Maintained engine section: publishing; concatenated in manifest order. |
| `src/systems/10_publishing.js` | Maintained engine section: publishing; concatenated in manifest order. |
| `src/systems/11_project_creation_and_royalties.js` | Maintained engine section: project creation and royalties; concatenated in manifest order. |
| `src/systems/12_production.js` | Maintained engine section: production; concatenated in manifest order. |
| `src/systems/13_staff_capability_and_loans.js` | Maintained engine section: staff capability and loans; concatenated in manifest order. |
| `src/systems/14_governance.js` | Maintained engine section: governance; concatenated in manifest order. |
| `src/systems/15_rights_deals_and_royalties.js` | Maintained engine section: rights deals and royalties; concatenated in manifest order. |
| `src/systems/16_market.js` | Maintained engine section: market; concatenated in manifest order. |
| `src/systems/17_finance.js` | Maintained engine section: finance; concatenated in manifest order. |
| `src/systems/18_reporting_and_world_time.js` | Maintained engine section: reporting and world time; concatenated in manifest order. |
| `src/systems/19_archive_and_talent_rights.js` | Maintained engine section: archive and talent rights; concatenated in manifest order. |
| `src/systems/20_talent_rights_and_franchise.js` | Maintained engine section: talent rights and franchise; concatenated in manifest order. |
| `src/systems/21_obligations_and_project_budgets.js` | Maintained engine section: obligations and project budgets; concatenated in manifest order. |
| `src/systems/22_financial_reporting.js` | Maintained engine section: financial reporting; concatenated in manifest order. |
| `src/systems/23_audits.js` | Maintained engine section: audits; concatenated in manifest order. |
| `src/systems/24_audits.js` | Maintained engine section: audits; concatenated in manifest order. |
| `src/systems/25_saves.js` | Maintained engine section: saves; concatenated in manifest order. |
| `src/systems/26_film.js` | Maintained engine section: film; concatenated in manifest order. |
| `src/systems/27_television.js` | Maintained engine section: television; concatenated in manifest order. |
| `src/systems/28_rights.js` | Maintained engine section: rights; concatenated in manifest order. |
| `src/systems/29_television.js` | Maintained engine section: television; concatenated in manifest order. |
| `src/systems/30_games.js` | Maintained engine section: games; concatenated in manifest order. |
| `src/systems/31_games.js` | Maintained engine section: games; concatenated in manifest order. |
| `src/systems/32_governance.js` | Maintained engine section: governance; concatenated in manifest order. |
| `src/systems/33_corporate_risk_and_equity.js` | Maintained engine section: corporate risk and equity; concatenated in manifest order. |
| `src/systems/34_corporate_ipo_and_succession.js` | Maintained engine section: corporate ipo and succession; concatenated in manifest order. |
| `src/systems/35_governance_audits_and_rivals.js` | Maintained engine section: governance audits and rivals; concatenated in manifest order. |
| `src/systems/36_ai_rivals_and_divisions.js` | Maintained engine section: ai rivals and divisions; concatenated in manifest order. |
| `src/systems/37_governance.js` | Maintained engine section: governance; concatenated in manifest order. |
| `src/systems/38_corporate_services_and_era.js` | Maintained engine section: corporate services and era; concatenated in manifest order. |
| `src/systems/39_capability_unlocks_and_adviser.js` | Maintained engine section: capability unlocks and adviser; concatenated in manifest order. |
| `src/systems/40_portraits_and_rights_packages.js` | Maintained engine section: portraits and rights packages; concatenated in manifest order. |
| `src/systems/41_games.js` | Maintained engine section: games; concatenated in manifest order. |
| `src/systems/42_weekly_hooks_and_disputes.js` | Maintained engine section: weekly hooks and disputes; concatenated in manifest order. |
| `src/systems/43_games.js` | Maintained engine section: games; concatenated in manifest order. |
| `src/systems/44_platform_audit_and_exports.js` | Maintained engine section: platform audit and exports; concatenated in manifest order. |
| `src/ui_bootstrap/close.js` | UI closure wrapper close.js; preserves shared UI state. |
| `src/ui_bootstrap/open.js` | UI closure wrapper open.js; preserves shared UI state. |
| `src/ui_order.json` | Authoritative ordered UI section/source manifest for builder. |
| `tests/fixtures/baseline_signatures.json` | Original 78-week seeded world-signature fixtures. |
| `tests/fixtures/engine41.js` | Old v30 engine fixture used only for save migration compatibility tests. |
| `tests/run46_regression.sh` | Test asset and supporting fixture for regression coverage. |
| `tests/run50_regression.sh` | Test asset and supporting fixture for regression coverage. |
| `tests/run51_regression.sh` | Test asset and supporting fixture for regression coverage. |
| `tests/update42_browser.py` | Browser/UI/storage or acceptance test for update42 browser. |
| `tests/update42_integration.test.js` | Historical or retained focused Node engine test for update42 integration. |
| `tests/update42_stress.test.js` | Historical or retained focused Node engine test for update42 stress. |
| `tests/update42a.test.js` | Historical or retained focused Node engine test for update42a. |
| `tests/update42b.test.js` | Historical or retained focused Node engine test for update42b. |
| `tests/update42c.test.js` | Historical or retained focused Node engine test for update42c. |
| `tests/update43_browser.py` | Browser/UI/storage or acceptance test for update43 browser. |
| `tests/update43_century.test.js` | Historical or retained focused Node engine test for update43 century. |
| `tests/update43a.test.js` | Historical or retained focused Node engine test for update43a. |
| `tests/update43b.test.js` | Historical or retained focused Node engine test for update43b. |
| `tests/update43c.test.js` | Historical or retained focused Node engine test for update43c. |
| `tests/update44_balance.test.js` | Historical or retained focused Node engine test for update44 balance. |
| `tests/update44_browser.py` | Browser/UI/storage or acceptance test for update44 browser. |
| `tests/update44_cross_system.test.js` | Historical or retained focused Node engine test for update44 cross system. |
| `tests/update44_difficulty_pairs.test.js` | Historical or retained focused Node engine test for update44 difficulty pairs. |
| `tests/update44_finance_gate.test.js` | Historical or retained focused Node engine test for update44 finance gate. |
| `tests/update44_player_century.test.js` | Historical or retained focused Node engine test for update44 player century. |
| `tests/update44_succession_diagnostic.js` | Test asset and supporting fixture for regression coverage. |
| `tests/update44a.test.js` | Historical or retained focused Node engine test for update44a. |
| `tests/update45_browser.py` | Browser/UI/storage or acceptance test for update45 browser. |
| `tests/update45_business.test.js` | Historical or retained focused Node engine test for update45 business. |
| `tests/update45_industry.test.js` | Historical or retained focused Node engine test for update45 industry. |
| `tests/update45_multiseed.test.js` | Historical or retained focused Node engine test for update45 multiseed. |
| `tests/update45_rights.test.js` | Historical or retained focused Node engine test for update45 rights. |
| `tests/update45_streaming_wallet.test.js` | Historical or retained focused Node engine test for update45 streaming wallet. |
| `tests/update45_world_production.test.js` | Historical or retained focused Node engine test for update45 world production. |
| `tests/update46_acquisitions_gate.test.js` | Historical or retained focused Node engine test for update46 acquisitions gate. |
| `tests/update46_browser.py` | Browser/UI/storage or acceptance test for update46 browser. |
| `tests/update46_commissions_gate.test.js` | Historical or retained focused Node engine test for update46 commissions gate. |
| `tests/update46_delegation_gate.test.js` | Historical or retained focused Node engine test for update46 delegation gate. |
| `tests/update46_finance_gate.test.js` | Historical or retained focused Node engine test for update46 finance gate. |
| `tests/update46_governance_gate.test.js` | Historical or retained focused Node engine test for update46 governance gate. |
| `tests/update46_investments_gate.test.js` | Historical or retained focused Node engine test for update46 investments gate. |
| `tests/update46_multiseed.test.js` | Historical or retained focused Node engine test for update46 multiseed. |
| `tests/update46_publishing_gate.test.js` | Historical or retained focused Node engine test for update46 publishing gate. |
| `tests/update46_streaming_gate.test.js` | Historical or retained focused Node engine test for update46 streaming gate. |
| `tests/update47_browser.py` | Browser/UI/storage or acceptance test for update47 browser. |
| `tests/update47_careers_gate.test.js` | Historical or retained focused Node engine test for update47 careers gate. |
| `tests/update47_disputes_gate.test.js` | Historical or retained focused Node engine test for update47 disputes gate. |
| `tests/update47_editorial_gate.test.js` | Historical or retained focused Node engine test for update47 editorial gate. |
| `tests/update47_lenders_gate.test.js` | Historical or retained focused Node engine test for update47 lenders gate. |
| `tests/update47_longrun_acceptance.test.js` | Historical or retained focused Node engine test for update47 longrun acceptance. |
| `tests/update47_rivals_gate.test.js` | Historical or retained focused Node engine test for update47 rivals gate. |
| `tests/update47_succession_gate.test.js` | Historical or retained focused Node engine test for update47 succession gate. |
| `tests/update48_archive_gate.test.js` | Historical or retained focused Node engine test for update48 archive gate. |
| `tests/update48_browser.py` | Browser/UI/storage or acceptance test for update48 browser. |
| `tests/update48_film_gate.test.js` | Historical or retained focused Node engine test for update48 film gate. |
| `tests/update48_franchise_gate.test.js` | Historical or retained focused Node engine test for update48 franchise gate. |
| `tests/update48_games_gate.test.js` | Historical or retained focused Node engine test for update48 games gate. |
| `tests/update48_multiseed.test.js` | Historical or retained focused Node engine test for update48 multiseed. |
| `tests/update48_store_browser.py` | Browser/UI/storage or acceptance test for update48 store browser. |
| `tests/update48_store_gate.test.js` | Historical or retained focused Node engine test for update48 store gate. |
| `tests/update48_tv_gate.test.js` | Historical or retained focused Node engine test for update48 tv gate. |
| `tests/update49_browser.py` | Browser/UI/storage or acceptance test for update49 browser. |
| `tests/update49_century_segment.test.js` | Historical or retained focused Node engine test for update49 century segment. |
| `tests/update49_long_platform.test.js` | Historical or retained focused Node engine test for update49 long platform. |
| `tests/update49_native_origin_probe.py` | Browser/UI/storage or acceptance test for update49 native origin probe. |
| `tests/update49_platform_gate.test.js` | Historical or retained focused Node engine test for update49 platform gate. |
| `tests/update50_accessibility.py` | Browser/UI/storage or acceptance test for update50 accessibility. |
| `tests/update50_browser.py` | Browser/UI/storage or acceptance test for update50 browser. |
| `tests/update50_large_save.py` | Browser/UI/storage or acceptance test for update50 large save. |
| `tests/update50_large_save_stress.py` | Browser/UI/storage or acceptance test for update50 large save stress. |
| `tests/update50_multiseed.test.js` | Historical or retained focused Node engine test for update50 multiseed. |
| `tests/update50_native_probe.py` | Browser/UI/storage or acceptance test for update50 native probe. |
| `tests/update50_recovery_browser.py` | Browser/UI/storage or acceptance test for update50 recovery browser. |
| `tests/update51_large_save.py` | Browser/UI/storage or acceptance test for update51 large save. |
| `tests/update51_queue_browser.py` | Browser/UI/storage or acceptance test for update51 queue browser. |
| `tests/update51_real_origin_acceptance.py` | Browser/UI/storage or acceptance test for update51 real origin acceptance. |
| `tests/update51_storage_atomic.test.js` | Historical or retained focused Node engine test for update51 storage atomic. |
| `tests/update52_accessibility_browser.py` | Browser/UI/storage or acceptance test for update52 accessibility browser. |
| `tests/update52_large_save.py` | Browser/UI/storage or acceptance test for update52 large save. |
| `tests/update52_real_origin_acceptance.py` | Browser/UI/storage or acceptance test for update52 real origin acceptance. |
| `tests/update52_recovery_browser.py` | Browser/UI/storage or acceptance test for update52 recovery browser. |
| `tools/build.py` | Zero-third-party-dependency builder reading source/JSON and writing standalone HTML/compiled JS. |
| `tools/generate_file_map.py` | Regenerates this one-line-per-file map after source/docs change. |
| `tools/package_handoff.py` | Historical or handoff source/support artifact; see name and original file content. |
| `tools/verify.py` | Repeatable 35-suite engine verification, syntax and optional simulated browser tests. |

<!-- FILE_MAP_END -->
