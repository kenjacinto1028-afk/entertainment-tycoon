# BALANCE_NOTES — measured behavior, risks and tuning map

This report is **not** a list of newly invented balance bugs. It identifies validated safeguards and risks worth checking when playtesting. Handoff refactor must not silently rebalance the previously accepted simulation. Tuning is externalized in `config/`; source-specific keys and their original value/context are in the matching `*_index.json` files.

## Verified safeguards retained

| Area | Recorded evidence | What still merits human playtesting |
|---|---|---|
| Consumer demand | Finite regional and cohort wallets audited in multi-seed cases (`update45_world_production`, `update45_streaming_wallet`, `update48_store_gate`). Multiple streaming services and game stores no longer create extra customer spending. | Can a player discover disproportionately profitable marketing/distribution loops? Pricing and title release pacing may feel too easy/hard at some world ages. |
| Rival fairness | Autonomous firms incur funded entrants, staff/capacity, contract and royalty obligations; income/market share tracked from actual sales; cash-constrained AI deals observed (`update47_rivals_gate`, `update45_business`). | Do rivals compete in an interesting, understandable way over 20–100 years without repetitive personalities or runaway concentration? |
| Cash and debt | Close-of-month tax, interest, prepaids, royalties and group consolidation reconcile in retained suite; distressed loan workouts preserve principal, arrears and interest (`update47_lenders_gate`). | Can a player cycle credit/IPO/sell-assets to obtain cash that outpaces realistic servicing? Stress with no sales or simultaneous crises. |
| Production | Staff/teams have finite slots; insolvent production pauses; project gross and cost separate (`update44a`, `update45_business`, `update46_publishing_gate`). | Are publishing print runs too lucrative vs ebook, film ticket income vs expenses, TV renewal/syndication too stable, games QA/certification too cheap? Assess actual play before adjusting. |
| Rights and franchise | The unified ledger enforces term, territory, media, sublicensing, author veto, exclusivity, resale, and acquisition preservation (`update45_rights`, `update48_franchise_gate`). | Do legitimate deal offers arise often enough? Do expiration/renewal decisions meaningfully affect player strategy without too much inbox work? |
| Long-run play | Original Update 49 passed two 100-year player-managed worlds; Update 50 six varied campaigns totalled 102 years; current refactor 35/35 focused engine suites and exact 78-week save-state signatures. | These results are not universal proof of hundred-year optimal balance or equal fun among all origins, difficulties, eras and settings. A fresh refactor-specific multi-seed century audit remains outstanding. |
| Saves / UI | Accepted original Update 52 passed independent Windows native restart and user NVDA; refactored HTML passed Chromium accessibility/recovery with simulated storage only. | Real browser storage quota, NVDA on new build, very long historic lists and mobile responsiveness under load. |

## Specific economy knobs and potential symptoms

| Symptom to investigate (not confirmed defect) | Configuration / controlling system | Safe validation |
|---|---|---|
| Starts too rich/poor | `config/starting.json:ORIGINS`, `CAPITAL_PRESETS`; `config/world.json:WORLD_MATURITY`; difficulty multiplier in `config/tuning_engine.json` | Cash runway at Weeks 1, 13, 26, 52 by origin and difficulty; do not change company equity silently. |
| Runaway sales or depleted regional wallets | `regions.json:REGIONS.cash`, tastes/cohorts; `tuning_engine.json:maturity__001..004`, `worldMarketBudget__001..006`, `titleWeights*`, `denominator*`; `16_market.js` | Compare weekly sum of all companies/background streaming/game store share vs each region/sector wallet, including platform caps. |
| Easy bank leverage / loan spiral | `tuning_engine.json:base__001..003`, `marketLoanRate__001..002`, `serviceLoans*`, `scheduled*`; regional `.interestIndex` | No-sales repayment stress, refinance denial, lender insolvency and accrued interest through save/load. |
| Inflation/FX unpredictability | `regions.json` starting FX/productionCost; regional economy update in `01_*` and `02_*` engine sections; `tuning_engine.json` keys for economic shocks | Repeat same seed with slow/fast technology, different population, several shocks, month-by-month regional briefs. |
| Movie/TV/game break-even imbalance | `world.json:SECTORS.cost,weeks`; `film.json`, `television.json`, `games.json`; `tuning_engine.json` per-medium prices, royalties and revenue decay | Compare median completed-project *cash* ROI and *accounting* contribution, separate allocated overhead, by media and release year. |
| Too little succession pressure / succession gaps | `starting.json` founder/employee inputs and `32..38` governance, `18` year/career hooks | 100-year weekly actively managed run; ensure lawful successor or authorized new-company continuation is possible but not guaranteed. |
| Unstable service/storefront profitability | `television.json:STREAM_TIERS`, `games.json:GAME_MODELS/PLATFORMS`, `tuning_engine.json` platform penetration/price/weekly live costs | Three competing subscription services and independent first-party/third-party catalog; verify no double-counting, cost paid monthly. |

## Non-negotiable invariants when tuning

1. Consumer money can only be earned **once**; no internal trade counted again in consolidated revenue.
2. No global sector debut bypass, even if an option/license exists for a future medium.
3. Rights/creator veto and contract/loan/royalty obligations remain binding after company acquisitions, bankruptcy and succession.
4. AI firms obey same cash, demand and capacity rules, with no hidden unlimited bailouts or rubber-band shares.
5. Taxes are fictional, stable and automatic; not a compliance minigame. Cash ≠ profit and loans are liabilities, not income.
6. No mandatory individual-chapter/episode/employee or legal/tax micromanagement; consequential choices should escalate, routine operations delegate.

## Intentional retune 2026-11-18 (owner-approved, config only)

Post-refactor century audit found print/film/TV almost never lost money and late-game wallets grew ~3×. Changed: `tuning_engine.json` `maturity__004` 1.42→1.00, `worldMarketBudget__003` 1.17→1.40, `factor__004` 0.78→0.95, `weekSales__012` 0.23→0.32, `weekSales__018..021` .37/.32/.24/.32→.42/.36/.28/.36; `world.json` `SECTORS.cost` publishing 11500→15000, movie 52000→66000, tv 34500→45000. Median direct ROI over the u49+u50 century states: print 120%→78%, film 95%→38%, TV 124%→59%, games 93%→78%. All invariants above still hold (35/35, u45/u46/u48/u50, both u49 centuries PASS). Multiseed/century numbers in `reports/` predate this retune. Test fixtures adjusted: round-to-cents comparisons in `update45_business`, `update46_commissions_gate`, `update47_disputes_gate`; new seed in `update45_streaming_wallet`; new-firm capital 27000 in `update47_succession_gate` (reserve scales with sector cost).

**Size/performance baseline:** Historic 100-year saves were around 16–24 MB uncompressed; an earlier 24.4 MB original save compressed to ~2.26 MB in a simulated database. Those are observed prior releases, **not** a guaranteed size or native-origin quota acceptance for this refactor.

## R1 release reception roll 2026-11-18 (owner-approved, all modes)

Each original title (player and AI, not contract jobs) rolls Flop / Weak / Solid / Strong / Breakout at release (`config/depth.json` RECEPTION: odds .18/.22/.36/.16/.08, demand x0.35/0.7/1/1.4/3, sales fade speed x0.6/0.85/1/1.25/1.8; quality shifts the roll ±0.12; film softened with SPREAD 0.7, i.e. multipliers^0.7). The roll is hashed from world seed + project id, so `s.rng` is untouched. Sales still split the same capped regional wallet. Save v38 (`p.reception`, `p.releaseCost`; older titles stay neutral).

Loss share (revenue < direct cost, titles at least 2 years old), 6 u50 worlds in Standard, before → after: print 2→19%, film 7→~15–21%, TV 5→22%, games 12→28%.

Hit measure changed with R1 (owner-approved): plain receipts / direct cost could never pass ~3x because direct cost grows with sales (store fees, printed copies). B1/B4 now use the success multiple = (receipts − sales costs after launch) / cost up to launch (`p.releaseCost`); pre-v38 titles keep the old measure. Thresholds Hit 3→6, Smash 6→12, Legendary 8→16 (+ quality 85), board Hit 3→6. Result (Standard, 6 u50 worlds, pooled): about 12% Hits, 3.5% Smashes, 0.3% Legendary (before: 0% at every level). All invariants hold.

## R2 format sub-wallets 2026-11-18 (owner-approved)

Book spending in each region is split into print / digital / audio buyers (`config/depth.json` FORMAT_POOLS; digital 8% → 10% at year 10 → 25% at 30 → 35% from 60; audio 0 before year 4, 3% → 9% at 30 → 15% from 60; print = rest). Novel, Nonfiction and Comic / Manga are full releases that reach every group (unchanged sales); Ebook and Web Serial reach digital only, Audiobook audio only. Each group's money is a share of the same capped publishing wallet, so total spending is unchanged. When no limited-format title is selling the old single-pool maths runs, so worlds without them are bit-identical (u50 multiseed and 15-year state hashes match pre-R2). Cost factors cut to match the smaller reach: `tuning_engine.json` `factor__001` (Web Serial) 0.73→0.41, `factor__004` (Ebook) 0.95→0.41, `factor__005` (Audiobook) 1.36→0.17. No save change, no RNG use. Author-approved manuscripts now default to a Novel (was Ebook once available).

Controlled player probe (same world/week/title id, only format differs, Standard, size 1, 3 years of sales), median direct ROI before → after:
- Year 10 (n=20): Novel 142%; Ebook 185→50%, Audiobook 154→29%, Web Serial 209→49% (digital still young).
- Year 25 (n=20): Novel 146–149%; Ebook 196→134%, Audiobook 165→114%, Web Serial 220→133%.
- Year 65 (n=12): Novel 106%; Ebook 140→109%, Audiobook 105→110%, Web Serial 170→109%.

## R3 rival format mix 2026-11-18 (awaiting owner OK to merge)

Rivals now pick a format for each new original title from `config/rivals.json` `RIVAL_FORMAT_MIX` (before, they always took the first format: 0 Ebook / Audiobook / Indie Game). Publishing: Novel 56, Nonfiction 12, Comic 10, Web Serial 30, Ebook 45, Audiobook 45; Web Serial and Ebook weights are multiplied by the R2 digital buyer share, Audiobook by the audio share, so they grow with the world. Games: Premium 78, Indie 22. Formats not yet available are skipped. Film and TV unchanged. The pick is hashed from seed + company + week (`rivalFormat` in `17_finance.js`), no `s.rng`, no save change. Probe (6 worlds, 15 years, Standard, rival originals): before Novel 1412, Film 267, Series 280, Premium 96; after Novel 799, Nonfiction 176, Comic 147, Web Serial 56, Ebook 63, Audiobook 26, Film 265, Series 298, Premium 61, Indie 23. Loss share (titles 2+ years old) before to after: publishing 15 to 16%, movie 8 to 9%, tv 14 to 15%, games 23 to 21%. Tests: `tests/depth_modes_r3.test.js`; the R2 old-path check now limits rivals to full releases.
