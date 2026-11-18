# Studio Syndicate — Update 45 acceptance matrix

**Date:** 2026-11-17 · **Build:** Update 45 · **Save schema:** v34 · **Feature foundations:** 309/309 · **Full acceptance gates:** **6/29**, **23 still open**.

All **26** workstreams previously open were reviewed; **3 newly accepted** (04,05,07), **23 remain open**. Accepted is based on focused integration, economic/rights invariants, current-source regressions and relevant browser coverage—not API or screen existence.

| Step | Workstream | Gate | Evidence and outstanding acceptance work |
|---:|---|---|---|
| 01 | Engine performance/recovery | Accepted previously | Two Update43 engine centuries + two Update44 player-managed centuries; Update45 4x12yr and 2x20yr regressions retained |
| 02 | Identity, chronology and sector access | Accepted previously | Four hard sector gates and deterministic Year1/4/7/10/25 setups tested across Update42-45 |
| 03 | Finance integrity and obligations | Accepted previously | Update45 312 monthly/group reconciliations, 2474 entity statements, 12 reloads; loans and acquisition preservation |
| 04 | Seeded world, demand and technology | **Accepted Update45** | Max 12 AI/4 regions, independent discovery/adoption speed, launch gating, 4x12yr 192 quarterly audits, repeatable seeds, regional cohort wallet caps and 16 reloads (`tests/update45_world_production.test.js`, `tests/update45_multiseed.test.js`) |
| 05 | Production, capacity and delegation | **Accepted Update45** | Three simultaneous teams, denied double booking, finite slots and cash, paid revision intervention, pause interrupts, four distinct medium launches and preserved saves (`tests/update45_world_production.test.js`, `tests/update44_cross_system.test.js`, `tests/update43a.test.js`) |
| 06 | UX, action inbox, saves and onboarding | Open | 3/3 Chromium workflows via explicit localStorage shim; real origin-bound reload prevented by environment security, full accessibility and automated onboarding UX still need acceptance |
| 07 | Rights, licensing and contract clocks | **Accepted Update45** | 6/6 rights/adversarial checks: exclusive region/media distribution, creator veto, parent-scoped sublicensing, legal renewal and consent, expiry, no false IP royalty income; prior funded royalty settlement/option and acquired obligations; save migration v33→v34 |
| 08 | Funded commissions and counterparties | Open | 4 media contract escrow/delivery, cancellation refund, unfunded buyer rejection and funded publisher passes; still test bankruptcy/disputed milestones/early-default escalations |
| 09 | Founder, staff and long careers | Open | Lawful executive selection and 2 managed centuries with 5 appointments retained; career recruitment, exits, mentorship, long-run morale, GUI coverage incomplete |
| 10 | Publishing editorial | Open | Publishing releases, format and promo tested; full creator rights, revision quality, arc vs chapter management and manuscript acquisition comparisons incomplete |
| 11 | Publishing formats, sales and inventory | Open | Paid marketing, print run 2445, sold 1927, returns, writeoff, translation pass; multi-format audiobook/digital/reprint royalty and cash reconciliation matrix missing |
| 12 | Autonomous competitors and institutions | Open | Funded entrants, 4x12yr AI histories, organic company failures and private estimates; multi-year cash-planning, competitor negotiation/partnership and crisis-responses insufficiently tested |
| 13 | Investment, scenarios and postmortems | Open | Read-only four alternatives, conservative/expected/optimistic and a 13-week major-release variance test pass; causal attribution and historical comparisons for failed/small releases incomplete |
| 14 | Film casting, production and finance | Open | Legal film shoots, project financing, film release and box office; calendar clashes, locations, script revision, live-action/animation resource and backend participation stress missing |
| 15 | Film marketing, windows and awards | Open | Regional ticket sales, premiere, classifications versus critic ratings tested; stacked release windows, major awards/festivals and nuanced ages/territories acceptance missing |
| 16 | TV seasons, casts and resources | Open | Season commissioning, writers, optional episode edit and cast renewal pass; prolonged cast exclusivity, dual-series workloads and contract renegotiation insufficient |
| 17 | Broadcast TV advertising and syndication | Open | Ratings and renewals pass; advertiser budget conservation, syndication-rights expiry and cancellation economics under several networks incomplete |
| 18 | Video game production and QA | Open | Prototypes, QA, defects, certification, patch, scores tested; engine ownership/licensing, tool obsolescence, beta and regional cert risks require comparisons |
| 19 | Platforms and ongoing games | Open | Game release and QA plus publisher advance accounting pass; platform installed base, exclusive contracts, live-service/eSports/community long-run costs still missing |
| 20 | Streaming and subscribers | Open | New multi-operator shared subscription wallet test: 3 independently funded services x 80 region-weeks, peak 88.6% of cap; cross-service catalog expiry/churn and multiregion price migration still needed |
| 21 | Digital storefronts and subscriptions | Open | Earlier platform accounting tests retained; simultaneous first/third-party sales, internal service elimination, refund/expiry and game subscriptions deep stress missing |
| 22 | Credit, investments and valuation | Open | Credit draws, repayment, real interest, lender affordability and acquisition cash checks pass; distressed covenant/refinancing, investor voting and valuation edgecases untested |
| 23 | Cross-media franchise/rights coordination | Open | Four medium IP issuance and scoped licenses verified; multi-decade franchise canon branching, rights histories, promotion spillover and consolidation not end-to-end accepted |
| 24 | Purchases and restructuring | Open | Funded acquisition, inherited rights, contracts and company-level separate balances pass; chained deals, distressed integrations, company/share/asset distinctions full UI validation missing |
| 25 | Optional corporate votes/IPO | Open | No startup forced board and lawful ownership transfers pass; corporate vote deadlock, opposition, IPO and share-authority effects not comprehensively verified |
| 26 | Retirement and generational management | Open | Two 100-year actively managed worlds, 5 lawful appointments, 99.96%/99.94% authorized weeks; insolvent transition and genuinely fresh-company/ending flows need browser acceptance |
| 27 | News, rankings and historical archive | Open | Linked releases/rights event audits, rival known vs estimated, archive real events pass; awards lineage, sort/filter and long-term compaction retrieval remain |
| 28 | Layouts and authority-safe bulk delegation | Open | Dashboard focus persists through in-memory storage/browser tests, manager spend caps pass; batch approval scaling and unauthorized mixed batches not fully tested |
| 29 | Whole-game multiseed acceptance | Open | Two managed centuries retained; 4x12yr and 2x20yr newer runs pass; 23 dependency gates open and real origin-bound saves/complete gameplay difficulty tuning remain unaccepted |

## Current-source verification

- **Retained focused:** 61/61 (Update42A/B/C, Update43A/B/C, Update44A and cross-system).
- **New focused:** 23/23 (world 4, rights 6, funded business 6, publishing/movie/TV/game/forecast/history 6, streaming shared wallet 1).
- **Seeded progression:** 3×8-year historical integration; 2×20-year stress; four additional 12-year worlds (192 quarterly audits, 16 save/reloads) spanning publishing, film, TV and games.
- **Accounting:** 312 period reconciliations, 2,474 company statements and 312 consolidated group statements; 12 reloads.
- **Chromium:** 3/3 desktop/mobile flows using explicitly disclosed storage shim. The environment blocks file/HTTP-origin navigation, so **native browser origin persistence is unverified**.
- **Retained long run:** Two Update44 100-year player-managed campaigns with 5 valid appointments, 200 annual audits, 20 checkpoint reloads. Not re-executed under Update45 build; current build instead uses shorter mixed-era regressions.

## Fixes in Update45

1. Respect exclusive grants in actual distribution, not just adaptation-production access; block grants that strand active same-sector work.
2. Enforce a shared finite regional subscription budget for multiple funded streaming services.
3. Recognize legally authorized sublicense renewal by parent-license holder and prevent terms beyond parent; preserve consent and accurate holder-only fee income.

## Acceptance boundary

309/309 indicates **foundation behaviors**, not feature-by-feature final balance/performance signoff. Do not mark steps 06,08–29 accepted until their identified gaps are exercised; do not infer native storage persistence from shim tests.
