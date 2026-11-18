# STUDIO SYNDICATE — Complete Feature & Gameplay Design Catalog

**Document type:** Project reference / implementation-scope baseline for review  
**Status:** Design decisions assembled from 28 interview rounds and later approved simplifications. **Not a statement that anything is already implemented or tested.** The game specification still requires explicit user signoff before a version roadmap; code requires separate authorization.  
**Design goal:** A deep, living entertainment business simulation that feels like a game—not an accounting, tax, legal, or task-clicking simulator.

## How to read this document

- **Feature** = functionality intended for the game; **Design** = what it does; **Gameplay interaction** = the decision it creates or the other system it influences.
- **Default interaction policy:** Automate routine work; display a readable summary; allow optional detail/manual overrides. Ask for decisions only when they materially change money, rights, strategy, solvency, succession or production outcomes.
- **Priority of instructions:** Latest explicit player decision > earlier confirmed decision > the player's later blanket acceptance of *simplified* recommended defaults > older open proposals. This document uses that order; it deliberately does **not** bring back superseded features.
- Numbers, thresholds, rates and formulas not specifically approved are **balancing parameters**, not fixed promises. Industry debut years and starting-era presets **are fixed decisions**.

## A. Product identity and core rules

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| A01 — Entertainment tycoon sandbox | Single-player, browser-based, fictional entertainment company simulator. | Choose a company strategy and guide it across many decades. |
| A02 — Four core industries | Publishing; Movies; Television & Streaming; Video Games. | One company may eventually work across all four or specialize indefinitely. |
| A03 — Publishing-first default | Start as an Independent Publisher in a literature-centered world. | Learn books, contracts and cash flow before complex sectors emerge. |
| A04 — No compulsory victory | Open-ended play with optional scenarios, objectives and achievements. | Set your own goals: prestige, fortune, IP empire, or specialty business. |
| A05 — Hands-on or delegated | Select management depth at project, team and corporate levels. | Control interesting decisions; avoid busywork as the company scales. |
| A06 — Distinct outcomes | Financial profit, quality, critic reputation, audience loyalty and prestige differ. | A cult classic can lose money; a hit can receive poor reviews. |
| A07 — Original and contract work | Creating owned IP and delivering paid work for others are viable paths. | Decide whether to build a catalog or earn steadier contract revenue. |
| A08 — Shared rules, distinct industries | One economy and company model, specialized production mechanics for each medium. | Studio strategy transfers across divisions without making all productions identical. |
| A09 — All four can originate IP | Books, films, series and games can each create original franchises. | A hit game can be adapted into books or films, not just vice versa. |

## B. World timeline, progression and starting eras

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| B01 — World Year 1: Publishing | Publishing is the only commercially available production industry. | All entertainment production companies begin publishing-focused in chronological mode. |
| B02 — World Year 4: Movies | Cinema becomes commercially available globally. | Film startups form; publishers can license, co-produce or enter film. |
| B03 — World Year 7: Television | Television production and broadcasting begin. | Networks and episodic projects create new demands for IP and talent. |
| B04 — World Year 10: Video Games | Early game development becomes commercially available. | Game developers, platforms and new distribution markets emerge. |
| B05 — Industry growth after debut | Debut unlocks an opportunity, not a mature industry overnight. | Workforce, equipment, audiences, theaters, platforms and broadcasters mature gradually. |
| B06 — Later streaming evolution | Streaming appears after supporting technologies and consumer adoption develop. | TV companies pivot business models; distribution windows and subscriber economics change. |
| B07 — Default chronological campaign | Starts in Year 1 with normal global Year 4/7/10 debuts. | New players encounter industries sequentially and avoid early overload. |
| B08 — Advanced era presets | Optional world starts at Years **1, 4, 7, 10 and 25**. | Experienced players can join an already developed fictional industry. |
| B09 — Mature Entertainment Age | World Year 25 is the mature-industry preset. | Begin amid established film/TV/game rivals, catalogs and market institutions. |
| B10 — Newly founded advanced studios | In a valid advanced era, start a **new** movie, TV or game studio. | Choice of industry changes startup pressures; no free inherited mature firm's assets. |
| B11 — Four publishing origins | Independent Publisher, Comics/Manga Studio, Contract Editorial Services, Established Publisher. | Each has different initial staff, capital, commitments and operating focus. |
| B12 — Company age vs world age | World Year and company founding age are tracked separately. | A new Year 10 game studio has no fictional ten-year company history. |
| B13 — Global industry gate | No commercial production before a sector's scheduled debut. | Future adaptation options can be signed, but cannot bypass the debut year. |
| B14 — Company capability unlock | Hiring, skills, funds, licenses, equipment and know-how determine market entry. | Year 4 doesn't automatically give a publisher its own film operation. |
| B15 — Soft access to capabilities | Outsourcing, commissioned partnerships, licensing and acquisition can substitute for in-house capability. | Smaller firms can enter markets without immediately building entire departments. |
| B16 — Progression and milestone signals | Useful capability milestones guide players without arbitrary level requirements. | Unlock screens and management choices only when relevant. |
| B17 — Configurable progression pace | Selected setup settings can adjust company capabilities and technology pace. | Tailor difficulty and tempo without changing the default chronological industry dates. |
| B18 — Publishing-only initial prehistory | Default Year 1 generates 5–10 years of literary backstory. | Existing publishers, authors, rights and awards form a believable starting market. |
| B19 — Advanced-era historical generation | Backfill consistent industry/company history up to the chosen era. | Year 10 histories contain prior movies/TV but no commercially released games before Year 10. |
| B20 — Industry debut announcements | Meaningful previews and news announce approaching sectors. | Prepare funding, talent and binding future-media options ahead of time. |

## C. New-game setup and onboarding

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| C01 — Founder creation | Set background, age, skills, traits and career orientation. | Changes early strengths, learning and succession horizon. |
| C02 — Starting capital | Select opening cash/resources within configurable scenarios. | Determines launch scale and financial risk. |
| C03 — World maturity | Configure how developed the fictional world and markets are. | Affects pre-existing companies, audiences, institutions and competitive intensity. |
| C04 — Starting company capabilities | Separate selection of initial staff, infrastructure and operational abilities. | Prevents confusing market maturity with player-company readiness. |
| C05 — AI company count | Set the initial number of active rivals. | Changes competition, contract buyers, recruiting, partnerships and performance load. |
| C06 — World population | Set consumer market scale. | Affects potential demand and industry economics; not limitless spending. |
| C07 — Geographic/world scale | Configure regions, audiences and overall simulated world size. | Changes regional strategy, competition and browser workload. |
| C08 — Difficulty presets | Simple choices for challenge, plus advanced modifiers. | Tune competitive skill and financial conditions without forcing more micromanagement. |
| C09 — AI fairness | Rivals obey the same broad money/rights/capacity rules. | Harder modes affect AI skill and starting conditions, never magic unlimited funds. |
| C10 — Technology discovery pace | Separate control for how quickly technologies are discovered. | Changes investment opportunities and the arrival of later capabilities. |
| C11 — Technology adoption pace | Separate control for how fast businesses/consumers adopt discovered tools. | A discovered medium can take years to become profitable or widespread. |
| C12 — Reproducible world seed | Optional setup seed for generating the starting world. | Replay comparable starting conditions; decisions can drive different futures. |
| C13 — Extreme setup warnings | Flexible customization with balance and performance warnings. | Allow experimentation without disguising risks of enormous worlds. |
| C14 — Optional interactive tutorial | Guided demonstrations of core workflows, without compulsory quests. | Teaches contracts, publishing projects, staff and finances as needed. |
| C15 — Contextual help and adviser | Tooltips and a management adviser explain current decisions. | Reduce reliance on external manuals while preserving depth. |
| C16 — Optional objectives and achievements | Self-selected goals alongside sandbox progression. | Supports guided challenges without a forced campaign ending. |

## D. Production systems shared across industries

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| D01 — Unified project record | Stores title, source IP, owner, team, budget, deadlines, milestones and rights. | Links all production work to contracts, costs and industry history. |
| D02 — Project creation/commissioning | Start owned originals, licensed adaptations or client-funded productions. | Different rights and financing routes create distinct risks and rewards. |
| D03 — Structured creative decisions | Choose themes, genres, concepts, audience and direction without freeform text parsing. | Meaningful creativity without requiring endless written prompts or micromanagement. |
| D04 — Project phases and milestones | Advance projects through distinct stages and checkpoints. | Delays, rework and scope changes have cash and release effects. |
| D05 — Weekly production turns | Work advances weekly based on assigned team capacity. | Plan deadlines, wages, staffing and competing project schedules. |
| D06 — Team workload/capacity | Departments and people have finite work capacity. | Overcommitting employees delays projects or worsens quality and morale. |
| D07 — Individual overrides | Optionally assign specific specialists to critical tasks. | Reserve unique talent for high-risk productions without managing every task. |
| D08 — Creative versus technical quality | Multiple quality dimensions influence production outcomes. | A strong story can be undermined by bugs, poor execution or weak presentation. |
| D09 — Budget and cash tracking | Costs, committed funding and projected completion spend update during production. | A company may have profitable projects but still face insolvency. |
| D10 — Project risks and interventions | Problems can trigger delay, redesign, rescue, cancellation or sale. | Player reacts to material issues instead of every minor operational event. |
| D11 — Marketing and positioning | Set market positioning, regional marketing and launch timing. | Reaches audience cohorts but consumes finite money and attention. |
| D12 — Release competition | Competing content, seasonality and regional conditions affect releases. | Scheduling matters independently from creative quality. |
| D13 — Post-release lifecycle | Catalog items keep earning, costing money or affecting brand after release. | Manage long-tail sales, renewals, updates and promotion. |
| D14 — Major-project postmortems | Automatically compare forecast and result for strategically important releases. | Learn from budget, market, talent, quality and timing outcomes. |
| D15 — Minor-project reviews | Optional compact postmortem for smaller releases. | Keep information available without crowding the inbox. |
| D16 — Major-release criteria | Relative budget, expected audience reach or strategic importance qualify a release. | A small company's flagship project can matter even if its budget is small globally. |

## E. Books, Comics & Publishing — first playable industry

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| E01 — Novels and nonfiction | Distinct written publishing products with audiences and research/editorial needs. | Build a differentiated catalog and work with specialized writers. |
| E02 — Comics/manga/graphic novels | Illustration-heavy, sequential projects with issue/volume workflows. | Balances writers, artists, release cadence and production costs. |
| E03 — Web serial fiction | Serialized chapters and subscriber/reader momentum. | Fast release schedules can build loyalty but strain staff. |
| E04 — Audiobooks | Narration, recording, mastering and voice talent needs. | Exploit audio rights and reach new consumers at additional cost. |
| E05 — Ebooks/digital publishing | Digital editions and delivery channels. | Trade printing inventory risk for platform/distribution fees. |
| E06 — Manuscript acquisition | Commission new work or acquire manuscripts/IP. | Decide on advances, editorial fit and long-term ownership. |
| E07 — Author and agent negotiation | Set advances, royalties, rights, deadlines and creator approvals. | Star talent attracts sales but increases cost and bargaining pressure. |
| E08 — Editorial analysis | Editors assess craft, market fit and development needs. | Improve projects through informed changes rather than one quality slider. |
| E09 — Revision rounds | Choose rewriting/editing depth, budget and schedule. | More revisions may improve the work but delay launch and spend cash. |
| E10 — Cover/art/layout | Assign creative staff to visual and physical/digital presentation. | Affects appeal, production cost and audience expectations. |
| E11 — Flexible serialization detail | Manage chapters/issues directly or delegate entire arcs/volumes. | Preserve hands-on control without forcing it across large catalogs. |
| E12 — Printing and print runs | Choose manufacturing volume and suppliers. | Large print runs lower some unit costs but risk unsold stock. |
| E13 — Inventory and returns | Track sold stock, returns, warehouse and write-offs. | Unsold copies tie up cash and affect profit. |
| E14 — Digital platforms and distribution | Select bookstores, distributors, online channels and owned outlets. | Compare coverage, royalties/fees and payment timing. |
| E15 — Advance recoupment and royalties | Account for author advances, royalty bases and statements. | Contract terms determine real margins and liabilities. |
| E16 — Weekly unit sales | Track sales by region, channel and audience. | Monitor campaigns, readership and market changes. |
| E17 — Reviews and bestseller charts | Critical/audience response and sales rankings evolve independently. | Prestigious books can have modest sales and vice versa. |
| E18 — Preorders and demand forecasts | Measure interest with uncertain forecasts. | Adjust marketing, print decisions and launch risk. |
| E19 — Backlist and reprints | Existing works can earn over many years. | Manage catalog value instead of relying only on new releases. |
| E20 — Licensing and translations | License available rights, formats or territories through valid contracts. | Reach new markets without necessarily producing internally. |
| E21 — Publishing services contracts | Perform editing/design/production for clients. | Earn fees without owning the underlying IP. |
| E22 — Publishing imprints | Create brands with focused genres, leaders and separate budgets. | Grow portfolios while tracking business-unit performance. |
| E23 — Talent development | Find and develop emerging writers and artists. | Build future franchises with uncertain costs and payoffs. |
| E24 — Publishing platform operations | Operate allowed digital/physical content distribution services. | Gain channel control but take on operational and customer costs. |

## F. Movies — globally available from World Year 4

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| F01 — Original films and adaptations | Build film IP or adapt existing stories when licensed. | Decide between ownership, franchise synergy and adaptation obligations. |
| F02 — Screenplay development | Write, commission, revise and approve scripts. | Creative direction and revision costs affect later shooting. |
| F03 — Financing and budgets | Fund films internally, externally or through co-production. | Exposes the company to risk proportional to ownership and contracts. |
| F04 — Deep casting and auditions | Compare actors' skills, reputation, chemistry and cost. | Talent influences production quality, marketing and schedules. |
| F05 — Talent availability/exclusivity | Contracts limit when stars and crews can work. | Coordination across simultaneous projects matters. |
| F06 — Phased production | Preproduction, filming, editing and completion have different needs. | Each phase consumes time, staff and cash. |
| F07 — Owned/rented/outsource facilities | Choose production space, equipment and external suppliers. | Trade capital cost against flexibility and dependence on partners. |
| F08 — Locations and logistics | Choose regions, production sites and operational plans. | Budgets, talent access, availability and automatic incentives differ. |
| F09 — Production disruptions | Delays, staff issues and scheduling problems can arise. | Choose whether to spend more, change scope or delay release. |
| F10 — Test screenings | Early audiences provide imperfect feedback. | Decide whether edits or reshoots justify the expense. |
| F11 — Rewrites, reshoots, editing | Manage creative interventions with quality/cost tradeoffs. | Fix weaknesses at a price; avoid guaranteed quality improvements. |
| F12 — Live-action, animation and hybrid | Film-making methods inside Movies, not separate industries. | Different staff and production budgets serve different stories. |
| F13 — Theatrical distribution | Self-distribute, hire distributors, license or co-distribute. | Trade control, distribution expense, fees and reach. |
| F14 — Regional weekly box office | Track attendance and gross across territories and weeks. | Screens, competition, audience taste and marketing affect earnings. |
| F15 — Release windows | Plan theater, digital and licensing windows under contracts. | Affects short- and long-run cash flow and audience capture. |
| F16 — Festivals and premieres | Enter eligible fictional events with campaign and premiere decisions. | Gain awards exposure, reputation and potential distribution interest. |
| F17 — Film awards | Nominations and wins influence prestige and commercial opportunities. | Successful talent may demand higher compensation. |
| F18 — Content classifications | Age/content ratings influence eligible audiences and outlets. | Distinct from review scores and film quality. |
| F19 — Critic/audience reviews | Separate professional and audience reactions. | Long-term attendance and franchise reputation can diverge. |
| F20 — Profit participation | Talent and partners can receive contractual backend payments. | A successful box-office result doesn't mean all proceeds belong to the studio. |

## G. Television & Streaming — TV opens in World Year 7

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| G01 — Original series and adaptations | Develop original programs or license source material. | TV creates/uses IP under the same rights system as books and film. |
| G02 — Season-based management | Plan episode orders, seasons and production blocks. | Manage broad schedules without mandatory episode microcontrol. |
| G03 — Optional episode editing | Dive into important episodes and creative decisions. | Rescue key moments while delegating ordinary episodes. |
| G04 — Writers' rooms and showrunners | Build ongoing writing leadership and production teams. | Consistency, quality and costs evolve across seasons. |
| G05 — Recurring cast contracts | Manage raises, renegotiations, availability and departures. | Successful shows become more expensive to renew. |
| G06 — Broadcast networks and schedules | Choose channels, time slots and audience targets. | Scheduling competes with rival programs and local viewing habits. |
| G07 — Regional TV ratings | Track viewership by region and demographics. | Programs may succeed with one audience but fail commercially overall. |
| G08 — Advertising economics | Sell ad inventory using demand and viewer fit. | High ratings aren't always equal to high advertiser revenue. |
| G09 — Commissioning/licensing | Produce for networks or sell program rights under contract. | Earn reliable contract revenue or retain valuable ownership. |
| G10 — Renewals and cancellations | Decide whether to extend series, change budgets or end them. | Ratings, rising cast costs and reputation affect expected returns. |
| G11 — Syndication and catalog | Older seasons can be licensed under distribution windows. | A show may remain valuable long after first broadcast. |
| G12 — Streaming service launch | Operate an owned streaming platform when technology permits. | Requires fixed operating cost, content library and customer acquisition. |
| G13 — Subscribers and churn | Track subscriber additions, losses, acquisition and retention. | Expensive originals only pay off if they improve service economics. |
| G14 — Subscription tiers/pricing | Offer price and supported advertising mixes. | Revenue per subscriber trades against churn and audience growth. |
| G15 — Original and licensed catalog | Acquire rights or produce exclusive content. | Rights expirations can reduce library strength and drive churn. |
| G16 — International streaming | Enter regional markets with local demand and currencies. | Scale brings subscribers, licensing costs and regional operating risks. |
| G17 — Film/TV resource sharing | Share production staff, facilities and corporate services. | Cross-division workloads and cost allocation matter. |
| G18 — TV awards and classifications | Eligible series receive ratings/award recognition separately from age classification. | Helps audience trust, talent prestige and distribution fit. |

## H. Video Games — globally available from World Year 10

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| H01 — Original games/adaptations | Produce new IP or adapt licensed franchises. | Game successes can later drive books, films and series. |
| H02 — Major design choices | Choose genre, theme, core mechanics, scope and target audience. | Meaningful product differentiation without mandatory feature-by-feature setup. |
| H03 — Prototypes and preproduction | Explore concepts before committing to full production. | Learn about risks while spending time and development budget. |
| H04 — Milestone development | Assign design, art, engineering, audio and QA capacity by phase. | Team strengths, crunch and timing influence output. |
| H05 — Bugs and technical stability | Model engineering quality and defects separately from creative appeal. | A promising game can fail due to a flawed launch. |
| H06 — Proprietary engines | Build and maintain engines where feasible. | Spend R&D capital to gain control and future capabilities. |
| H07 — Engine/tool licensing | Use third-party engines, middleware and vendor tools. | Get faster access at contract/license costs. |
| H08 — Technology acquisition | Acquire rights or firms with useful production technology. | Speeds capability growth but consumes capital and integration effort. |
| H09 — Fictional platform ecosystems | PC, console, handheld, mobile and future platforms have distinct users. | Genre/platform fit changes attainable demand and production costs. |
| H10 — Platform generations | Hardware capabilities, installed bases and requirements evolve. | New tech may boost quality but force ports and staff training. |
| H11 — Publishing and funding deals | Self-publish or use an external game publisher. | Exchange rights/revenue share for marketing or production funding. |
| H12 — Commissioned development | Build games or software content for clients. | Earn fees without necessarily owning the final IP. |
| H13 — Co-development | Share work, costs, control and contract rights with partners. | Specialist studios can participate in major projects. |
| H14 — Platform exclusivity | Negotiate timed or permanent exclusives, grants and marketing support. | Funding comes at opportunity cost of other platform sales. |
| H15 — Demos, beta tests, preorders | Measure interest and technical readiness before launch. | Decide whether to improve, delay or ship. |
| H16 — Certification and regional launch | Meet requirements and schedule region/platform releases. | Certification failures or launch congestion can delay revenue. |
| H17 — Business models | Premium sales, DLC, subscriptions and later eligible free-to-play. | Monetization affects retention, player sentiment and continuing spend. |
| H18 — Postlaunch support | Patches, balance, expansions, ports and live support consume staff. | Protect reputation and grow long-tail sales at real cost. |
| H19 — Player communities and modding | Support fan feedback and appropriate mod/community tools. | Influence retention and word of mouth, with moderation/support costs. |
| H20 — Optional esports | Competitive events for suitable titles. | Potential audience upside but meaningful operational/marketing expense. |
| H21 — Separate critic/user responses | Critics, player sentiment and technical stability use distinct metrics. | A launch fix can help confidence, not magically erase past failure. |
| H22 — Digital storefronts | Own a third-party and first-party game sales platform. | Earn commissions but fund infrastructure, discovery and consumer support. |
| H23 — Game subscriptions | Offer access to a catalog as technology supports it. | Balance content deals, subscriptions, retention and operating costs. |
| H24 — Digital distribution networks | Distribute licensed third-party games as well as owned content. | Extends revenue without requiring all projects to be developed internally. |

## I. IP, licensing, contracts and franchise management

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| I01 — Unified IP registry | Single authoritative record of each work, franchise and source IP. | Ensures every industry's projects reference consistent ownership and history. |
| I02 — Underlying versus derivative rights | Distinguish franchise ownership, completed production and adaptation permissions. | Buying a film need not include rights to write its source novel's sequel. |
| I03 — Rights packages | Scope by medium, territory, term, exclusivity and sublicensing. | Companies can buy exactly the access they need. |
| I04 — Binding pre-debut options | Secure future-medium rights with price, deadline and conditions. | Prepare Year 4/7/10 adaptations without producing before sector debut. |
| I05 — Option exercise and expiry | Track reservation payments and exercise deadlines. | Rights revert when unused options expire under negotiated terms. |
| I06 — License and distribution clocks | Separate adaptation authorization, exploitation windows and royalties. | Expiry need not erase already earned payments or valid separate windows. |
| I07 — Contract-defined continuation | No implied perpetual distribution or automatic sell-off grace period. | Existing releases stop or continue according to effective agreements. |
| I08 — Automatic rights validation | Reject incompatible exclusive grants or production beyond owned authority. | Prevents double-licensing and unauthorized adaptations by player or AI. |
| I09 — Negotiated contracts | Offers/counteroffers set payments, milestones, participation and penalties. | Better deals require bargaining and create real operating obligations. |
| I10 — Creative approvals/vetoes | Binding rights-holder approvals apply only when contractually granted. | A franchise manager cannot simply override legally protected creator rights. |
| I11 — Consent-aware renewals | Managers negotiate small renewals within spending/authority limits. | Major or contested renewals escalate; neither side can force consent. |
| I12 — Rights calendar | Track upcoming option, license and window deadlines. | Warn before a critical project loses authorization. |
| I13 — Acquisition due diligence | Summarize available IP, restrictive deals, debt, royalties and title history. | Avoid purchasing a famous franchise whose key rights are unavailable. |
| I14 — Corporate and asset purchases differ | Company purchase can include liabilities; an IP deal covers only agreed rights. | Evaluate scope and existing encumbrances before buying. |
| I15 — Franchises and cross-media branches | Maintain originals, sequels, spin-offs, reboots and adaptations. | One property grows across books, films, TV and games. |
| I16 — Main and alternate canon | Organize main chronology, alternate timelines and derivative stories. | Creative inconsistencies may affect audience response. |
| I17 — Auto-populated Franchise Bible | Automatically link works, characters, canon, rights and approvals. | See the franchise narrative without manually creating a lore encyclopedia. |
| I18 — Optional Bible editing | Edit branches, names, continuity rules and creative references. | Hands-on creative users can shape the fictional universe. |
| I19 — Franchise/release coordination | Managers align sequels, adaptations, marketing and releases. | Avoid conflicts and exploit cross-media promotion. |
| I20 — Franchise audience feedback | Adaptation quality changes interest in other works. | A film can raise book demand or harm fan trust. |
| I21 — Licensing externally | Earn fees and royalties rather than producing in-house. | Monetize IP without building a new studio. |
| I22 — Internal cross-division licenses | Account for group-internal licenses without fictitious group income. | Division reporting remains meaningful; consolidated profit eliminates internal trades. |
| I23 — Royalty obligations | Track payable terms, statements, recoupment and unpaid balances. | Earnings promised to talent/rights-holders remain enforceable after release or acquisition. |

## J. Investment analysis, profitability and postmortems

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| J01 — Three linked profit views | Report production, franchise and company profitability. | See whether a hit title supports—or drains—the wider business. |
| J02 — Direct project contribution | Show direct revenue/cost contribution per production. | Assess projects without disguising their own performance. |
| J03 — Separately disclosed overhead | Show allocated company services in a separate line. | Understand full economics without obscuring direct production results. |
| J04 — Group consolidation | Eliminate internal transfers/royalties when viewing group results. | Prevent fake profits between owned divisions or subsidiaries. |
| J05 — Cash versus accounting profit | Distinguish earned revenue, receivables, payables and actual cash. | Avoid bankruptcy despite an apparently profitable catalog. |
| J06 — Four investment strategies | Compare make internally, license out, co-produce or wait. | Choose the strategy that fits rights, resources and goals. |
| J07 — Three forecast scenarios | Conservative, expected and optimistic financial outcomes. | Compare upside, downside and uncertainty instead of a guaranteed number. |
| J08 — Downside cash warnings | Model financing shortages and liquidity risk. | A profitable long-term project may be unaffordable today. |
| J09 — Opportunity cost | Account for money, workers and rights committed elsewhere. | Choosing one franchise can postpone another. |
| J10 — Forecast evidence | Research, previous titles, audiences and competitors inform estimates. | Better intelligence reduces uncertainty but never grants foreknowledge. |
| J11 — Automatic major postmortems | Explain forecast deviations after major releases. | Identify timing, creative, staffing, technical and marketing impacts. |
| J12 — Optional minor postmortems | Provide requested explanations for smaller work. | Avoid report overload in a large back catalog. |
| J13 — Long-run franchise contribution | Aggregate permitted external revenue and costs across adaptations. | Decide whether to expand, sell, license or rest an IP. |
| J14 — Historical comparison | Compare projected and realized returns over years. | Improve strategies and compare leaders or divisions. |

## K. Employees, culture, organization and delegation

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| K01 — Named direct employees | Persist staff identity, age, skills, traits and contract/career records. | Form long-term teams that develop across productions. |
| K02 — Significant external talent | Simulate notable authors, actors, directors, creators and executives individually. | Rivals compete for scarce specialized talent. |
| K03 — Recruitment and interviews | Evaluate candidates, negotiate compensation and hire. | Personnel decisions matter most when the company is small. |
| K04 — Skills/specialties | Role-specific strengths and development. | Talent-project matching affects quality and workload efficiency. |
| K05 — Traits and relationships | People differ in temperament, morale, collaboration and bargaining. | Strong teams can outperform collections of isolated stars. |
| K06 — Salaries and contracts | Set employment terms, bonuses and availability restrictions. | Payroll, retention and schedules affect cash and capacity. |
| K07 — Training/mentorship | Develop staff and prospective successors. | Invest now for better future output and leadership. |
| K08 — Performance and reviews | Track work outcomes and employee development. | Reward, reassign, promote or let staff leave. |
| K09 — Retention and exits | Employees can resign, retire, be dismissed or join rivals. | Loss of key talent changes projects, culture and competition. |
| K10 — Aging and generations | Careers evolve over decades; new cohorts of talent enter. | Industry prestige, pay demands and succession shift naturally. |
| K11 — Team-first workload | Allocate work to groups with optional person-level overrides. | Preserve finite labor capacity without task-clicking fatigue. |
| K12 — Custom departments/divisions | Define organizational structure and reporting relationships. | Change operations as the company diversifies. |
| K13 — Subsidiaries | Run legal business units with separate management and finances. | Support acquisitions and regional/media specialization. |
| K14 — Publishing imprints | Run brands with separate editorial goals and reporting. | Distinguish genres without creating unnecessary legal entities. |
| K15 — Shared corporate services | Pool HR, finance, legal, technology and other central resources. | Reduce duplication; allocate overhead transparently. |
| K16 — Delegated HR | Optional hiring/training/recruitment automation with limits. | Keep scaling organizations playable. |
| K17 — Manager authority | Assign spending caps, contract permissions and escalation thresholds. | Delegate ordinary work while preserving strategic control. |
| K18 — Employee/company culture | Policies affect autonomy, working conditions, retention and creative output. | Cost cutting may undermine morale and quality. |
| K19 — Leadership personalities | Executives bring competencies, ambitions and imperfect judgment. | Managers may succeed or need intervention. |
| K20 — Multi-level management views | Switch between individual project, division/subsidiary and company. | Work hands-on where desired while seeing the big picture. |

## L. Accounting, finance, ownership, risk and taxation

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| L01 — Monthly close | Reconcile company finances after weekly operations. | View reliable monthly results while weeks remain the production tick. |
| L02 — Income statements | Revenue, expenses, margin and profit for relevant entities. | Know which activities create actual operating earnings. |
| L03 — Balance sheets | Cash, receivables, inventory, IP, debt and liabilities. | Acquisitions and growth change the company's financial position. |
| L04 — Cash-flow statements | Track actual inflows and outflows. | Avoid cash crises hidden by paper profits. |
| L05 — Budgets versus actuals | Track planned/committed expenditure and variance. | Spot overruns and redirect funds. |
| L06 — Cash runway/solvency | Display available liquidity and financing pressure. | Decide whether to delay, refinance or sell assets. |
| L07 — Loans and revolving credit | Borrow within realistic lending constraints. | Fund growth but incur interest, covenant and repayment risks. |
| L08 — Automated lenders | Routine lending decisions happen without paperwork gameplay. | Major financing choices and crises remain player-relevant. |
| L09 — Equity investors | Outside investment may dilute ownership and change authority. | Raise cash at a governance/ownership price. |
| L10 — Project/co-financing | Finance individual productions with partners or milestones. | Share budget risk and future receipts. |
| L11 — Investment committees | Optional management oversight with authority thresholds. | Large groups prioritize competing divisions without constant player approval. |
| L12 — Acquisition financing | Evaluate price, debt, rights, employees and integration costs. | Buying firms can accelerate expansion or create solvency trouble. |
| L13 — Integration/restructuring | Resolve inherited contracts, staff overlaps and operating changes. | Acquisitions are not instant bonus assets. |
| L14 — Financial distress | Refinancing, cost cuts, disposals, restructurings and bankruptcy. | Failure can create market opportunities or end company control. |
| L15 — Risk policies | Set liquidity limits, insurance and stress-test policies. | Protect the company against some shocks at a cost. |
| L16 — Intragroup transfer pricing | Attribute internal services/licenses to relevant business units. | Compare division results while preserving consolidated accuracy. |
| L17 — Simple stable regional taxes | Automatic straightforward profit taxes and relevant sales/payroll charges. | Region choices affect net profit; no tax filing minigame. |
| L18 — Automatic eligible incentives | Apply qualifying production/R&D/region benefits automatically. | Financial comparisons account for incentives without paperwork. |
| L19 — Tax cash visibility | Show tax expense, payable and cash-due forecasts. | Understand obligations without manual compliance. |
| L20 — Profit versus valuation | Company value depends on assets, risk, future cash and market outlook. | Use valuation in investments, financing and acquisitions. |
| L21 — Simplified optional public markets | Optional IPO/equity ownership—not a stock trading simulator. | Raises capital but changes shareholders and governance. |

## M. Founder, ownership, corporate transition and succession

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| M01 — Player founder identity | Founder skills/reputation progress through work and decisions. | You develop as the business develops. |
| M02 — Founder, entity and shares differ | Person, company, owner, votes and executive authority are separate. | Retirement does not grant a successor someone else's IP or assets. |
| M03 — Optional corporation readiness | Practical finance, administrative and leadership checklist; no rigid size gate. | Transition when prepared, not automatically at a revenue threshold. |
| M04 — Corporation-only board governance | Binding board/shareholder controls activate only at the valid corporation stage. | A tiny publishing startup never receives compulsory board bureaucracy. |
| M05 — Private-company continuation | Remain private and founder-led indefinitely if viable. | Scale without being forced to IPO or incorporate for game progression. |
| M06 — Optional IPO | Separately choose simplified public equity where eligible. | Raise capital but face ownership dilution and public governance. |
| M07 — Board power and votes | Corporate votes constrain executives within legal authority. | Loss of an executive role can have real consequences. |
| M08 — Advance succession planning | Designate/mentor a potential successor where legally feasible. | Reduce disruption from retirement or founder death. |
| M09 — Lawful succession choice | Select an eligible successor or authorized role at a transition. | Continue playing without inventing ownership transfer. |
| M10 — Loss of control | Owners, shareholders and boards can constrain/remove management. | Player must seek another legitimate role, not bypass governance. |
| M11 — Fresh-company continuation | If no authorized role exists, offer a properly financed new firm where possible. | Continue the world without stealing the former company's resources. |
| M12 — Run conclusion | Ending the run is an available lawful outcome. | Preserve historic accomplishments without arbitrary rescue. |
| M13 — Configurable failure severity | Difficulty can change consequences and continuation availability. | Challenge scales while rights and ownership remain internally consistent. |

## N. Fictional world, consumers, competitors and institutions

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| N01 — Regional markets | Fictional regions with populations, demographics, currencies and taste profiles. | Different content strategies succeed in different locations. |
| N02 — Consumer spending budgets | Audiences have finite purchasing power and competing entertainment choices. | Film/game adoption can draw attention and money away from books. |
| N03 — Demographic/genre cohorts | Age/income/taste/format preferences shape demand. | Marketing and creative decisions target reachable audiences. |
| N04 — Macroeconomic variables | Inflation, wages, employment, interest rates, FX and demand. | Recessions impact staffing, sales and debt service. |
| N05 — Global cycles, regional effects | Shared economic trends produce different regional outcomes. | Diversification can mitigate or amplify risk. |
| N06 — Occasional external shocks | Plausible disruptions affect resources or consumer demand. | React to changing conditions, not arbitrary income multipliers. |
| N07 — Technology discoveries | New capabilities arise through research, investment and world evolution. | R&D can generate advantage once the sector exists. |
| N08 — Technology adoption | Businesses and customers adopt at configurable rates. | Early entry creates opportunity but not immediate mass demand. |
| N09 — Technology obsolescence | New tools can displace older methods without instantly eliminating niches. | Decide when to upgrade versus serve mature markets. |
| N10 — AI corporate identities | Rivals have distinct personalities, specialization and risk tolerance. | Competitors do not all copy the same strategy. |
| N11 — Multi-year AI planning | Rivals plan, review annually and react to crises. | Prepare for expansion, defensive moves and market shifts. |
| N12 — Constrained AI forecasting | Rivals use imperfect information and real budgets. | AI may overinvest, misjudge demand or miss opportunities. |
| N13 — AI projects/hiring/bids | Competitors develop content, recruit and negotiate contracts. | Talent, rights and distribution have genuine alternative buyers. |
| N14 — AI strategic partnerships | Firms license, co-produce and share funding/distribution. | Cooperation competes with outright acquisition and internal buildout. |
| N15 — Dynamic company population | Startups, spin-offs, acquisitions and bankruptcy change the rival roster. | A minor competitor may become a future major studio. |
| N16 — Organic market concentration | Dominant corporations can endure but face innovation, scale costs and rivalry. | No artificial market-share rubber bands or rescues. |
| N17 — Mostly abstract institutions | Banks, agencies, guilds and regulators impose material rules, not bureaucracy. | Important disputes and financing events can still require a choice. |
| N18 — Public and private competitor data | Public facts plus researched estimates of private strategies/finances. | Industry intelligence improves decisions without omniscience. |
| N19 — Trust for major contracts | Significant counterparties develop negotiation/reliability histories. | Failed delivery or good partnerships influence future offers. |
| N20 — Festivals and awards bodies | Fictional institutions rank and recognize eligible work. | Reputation and creator careers connect across industries. |

## O. Reporting, rankings, news and historical records

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| O01 — Monthly economic briefings | Short market, price, talent and demand updates. | Help revise near-term production and spending decisions. |
| O02 — Quarterly economic reports | In-depth explanations, forecasts and drill-downs. | Identify recession risks, emerging markets and competitive shifts. |
| O03 — Company financial reports | Monthly financial packages at company/division/project levels. | Compare operational results, cash needs and profitability. |
| O04 — Financial rankings | Revenue, profit, valuation and market-share leaderboards. | Benchmark your company against disclosed or estimated rival results. |
| O05 — Creative rankings | Critic awards, creator prestige, acclaimed work and quality records. | Prestige strategies get meaningful success measures beyond money. |
| O06 — Audience rankings | Sales, box office, TV ratings, subscribers and game reception. | Monitor industry leadership and cultural change. |
| O07 — All-time records | Career, production, franchise and company achievements. | Long-term play produces an inspectable entertainment history. |
| O08 — Region/era/industry filters | Rankings can be filtered by place, time and medium. | See whether a studio dominates a niche or global market. |
| O09 — Industry news | Event-driven articles about actual releases, deals, tech and crises. | Observe rivals without omniscient internal access. |
| O10 — News search/archive | Search a dedicated history of actual fictional events. | Investigate past deals, breakthroughs and major competitors. |
| O11 — Historical company lineage | Track changes in name, ownership, divisions and continuity. | Acquired or defunct firms remain part of the world story. |
| O12 — Creator careers and awards | Preserve key work, achievements, transfers and reputation. | Generational staff/talent storylines continue after retirement. |
| O13 — Franchise histories | Record works, adaptations, rights changes and financial results. | A long-lived IP retains a coherent legacy. |
| O14 — Annual finance snapshots | Preserve year-end financial and market data. | Compare company performance decades later without all weekly transactions. |
| O15 — Generated versus played history | Distinguish pre-game backstory from decisions made during a run. | Advanced starts feel grounded while remaining auditable. |
| O16 — Actual vs estimate vs forecast | Explicitly distinguish known figures, researched estimates and projections. | Avoid misleading players about rival private data and projected returns. |

## P. Interface and player controls

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| P01 — High-contrast modern UI | Readable business-management interface with polish and clarity. | Large information volumes remain approachable. |
| P02 — Light and dark themes | User-selectable accessible visual modes. | Comfortable long gameplay sessions. |
| P03 — Left sidebar/subtabs | Persistent navigation with contextual detail. | Keep company, industry, finance, people and news easy to locate. |
| P04 — One Productions hub | Four subtabs: Publishing, Movies, TV/Streaming, Video Games. | Display relevant sectors only as the world's timeline allows. |
| P05 — Adaptive dashboards | KPIs and concise summaries with drilldowns. | Understand critical issues quickly and investigate when needed. |
| P06 — Saved dashboard layouts | Customize views per company, subsidiary, imprint or project. | Tailor screens to specialized management roles. |
| P07 — Searchable/sortable tables | Filter employee, project, financial and roster data. | Manage growing organizations without scrolling endlessly. |
| P08 — Split list/detail workspaces | Keep record lists alongside the selected detailed profile. | Compare projects and staff efficiently. |
| P09 — Stylized cartoon portraits | Reusable portrait artwork for notable people. | Make careers and company history memorable. |
| P10 — Management Inbox | Show decisions, expiring rights, solvency warnings and approvals. | Surface consequential choices without routine spam. |
| P11 — Delegation/batch approvals | Group safe routine tasks under authority thresholds. | Reduce repetitive clicks. |
| P12 — Pause rules | Configure which events stop multiweek advance. | Prevent missed rights deadlines or catastrophic decisions. |
| P13 — Simulation control bar | Advance weekly, skip multiple weeks, pause and inspect history. | Match play speed to current management complexity. |
| P14 — Dedicated news page/widget | Informational industry reporting separate from action inbox. | Keep strategic intelligence distinct from required decisions. |
| P15 — IP tree/timeline/rights views | Explore franchise works, ownership, licenses and profitability. | Diagnose conflicts and cross-media opportunities. |
| P16 — Corporation-stage governance screens | Only show board/shareholder UI once a valid corporate setup exists. | Preserve simple startup experience. |
| P17 — Mobile companion | Prioritize news, alerts, approvals, summaries and monitoring. | Handle light decisions on a smaller screen; desktop remains full UI. |
| P18 — Accessible status communication | Use labels, icons and readable numbers as well as colors. | Avoid misreading forecasts, alerts and contract statuses. |

## Q. Simulation engine, archives, saves and quality goals

| Feature | Short design description | How it interacts with gameplay |
|---|---|---|
| Q01 — Weekly world progression | Single consistent sequence of production, demand and company events. | All sectors follow the same clock and scheduled debuts. |
| Q02 — Monthly financial settlement | Recognize income, spend, royalties, tax and obligations accurately. | Financial results reconcile across systems. |
| Q03 — Major-vs-background AI fidelity | Detailed major actors; aggregated minor firms/market labor. | Make large worlds feasible in the browser. |
| Q04 — Aggregated consumer markets | Simulate cohorts, budgets and release curves rather than each buyer. | Sales remain realistic without millions of consumer objects. |
| Q05 — Stable IDs and ownership records | Preserve identity of people, IP, companies, contracts and projects. | History and acquisitions cannot silently change owners. |
| Q06 — Precise active obligations | Live licenses, loans, royalties and appointments stay exact. | Fast-forward and history compaction never erase outstanding liabilities. |
| Q07 — Compact settled older activity | Retain critical events/annual snapshots, summarize routine old weeks. | Keep long saves manageable. |
| Q08 — Multiple manual save slots | Support named saved campaigns and backups. | Experiment with strategies without losing an established world. |
| Q09 — Autosaves and recovery | Protect against interruption or browser failure. | Preserve continuity during long play sessions. |
| Q10 — Export/import saves | File-based backups and restoration. | Keep portable copies of long-running worlds. |
| Q11 — Versioned save compatibility | Tag save format and validate/migrate compatible saves when feasible. | Reduce update-related corruption risk. |
| Q12 — Finance/rights integrity checks | Audit balances, valid rights, settlements, taxes and consolidation. | Catch impossible states before they distort business outcomes. |
| Q13 — Cross-system event consistency | Trigger news, archives, reports and actions from actual world events. | A bankruptcy appears consistently everywhere. |
| Q14 — Repeatable seed baseline | Same seed/settings and simulator version reproduce initial conditions. | Compare start strategies; future choices can cause divergence. |
| Q15 — Performance-aware simulation | Balance depth, speed and save size, with setup warnings. | Avoid unplayable century-long browser saves. |
| Q16 — 100-year automated tests | Future acceptance goal across seeds, difficulties and AI approaches. | Validate successions, company churn, financial invariants and world continuity. |
| Q17 — No untested claims | No simulation code or tests exist yet; target results must be demonstrated. | Keep expectations accurate until builds and benchmarks are available. |

## R. System integration — six end-to-end gameplay examples

1. **Publishing to cinema (Years 2–4).** An original novel is developed, edited, released and earns money. Before Year 4 a rival buys a **binding option** for future movie rights. On Year 4 only legally authorized film development becomes available. Fees/royalties settle under contract; resulting film reactions affect book demand. The franchise page, financial statements, rankings and news agree.
2. **Produce versus license.** A fantasy IP owner compares doing a film internally, licensing it out, co-producing it or waiting. Investment reports show conservative/expected/optimistic cash flows, staff availability and existing rights. A manager can act on routine terms, but significant rights transfers escalate.
3. **Cross-division platform ownership.** A group owns a game studio and digital storefront. Its studio's internal listing/commission allocations appear in divisional reports but are eliminated in consolidated results. External consumer sales are not counted twice; customer budgets constrain demand.
4. **Streaming acquisition and license expiry.** A streamer licenses a successful series and initially gains subscribers. The license expires according to its stated windows; there is no automatic perpetual distribution. A Rights Manager warns of the issue, negotiates renewal within permitted limits, and the service forecasts subscriber churn if the catalog title disappears.
5. **Creator career and succession.** A publishing founder hires a writer who becomes an industry star. Decades later the founder retires. The player's eligible successor assumes management but does not magically acquire the writer's rights or company shares. The company, founder and creator histories remain searchable.
6. **Recession and acquisition.** Regional entertainment spending falls, a film competitor misses loan payments and sells rights. Your company reviews acquisition diligence, including encumbrances and existing royalties. AI lenders, contracts and rankings update from the same underlying transactions; no competitor receives an arbitrary bailout.

## S. Practical defaults: simplify the player's work, not the rules

| Area | Default player action | Deeper option |
|---|---|---|
| Project development | Pick meaningful creative, budget and timeline choices. | Edit stage staffing, serialized work or individual decisions. |
| Hiring | Recruit critical staff and choose team leaders. | Inspect full skills, contracts, relationships and workload. |
| Legal/rights | Read one-page offer, approve major deals. | Inspect title chains, restrictions and expiration calendars. |
| Production analysis | Read brief important-project postmortems. | Drill down to causal factors and forecast variance. |
| Finance | Read cash, profit, runway, return and major risk indicators. | Inspect full income/balance/cash-flow statements and allocations. |
| Taxes | Automatic, stable fictional rates and clear liabilities. | See simple regional costs; no filing/compliance minigames. |
| AI/institutions | Observe relevant rivals, news and meaningful disputes. | Research available private estimates and industry rankings. |
| Governance | No board in non-corporate startup; optional corporate transition. | Exercise lawful executive/board/shareholder processes. |
| Succession | Brief successor/role selection and impact summary. | Review ownership, voting and appointment details. |

## T. Intentional exclusions / decisions that must not be reversed accidentally

- **No fifth or sixth standalone industry.** Music/record labels are out; soundtracks/music licensing remain project inputs. Animation remains a technique within film/TV.
- **No console hardware manufacturing** (but games on fictional consoles, digital storefronts, game distribution and subscriptions are in scope).
- **No complex tax law, tax filing, international tax planning or manual tax bookkeeping gameplay.** Taxes are automatic and easy to understand.
- **No deep management bureaucracy for banks, regulators or guilds.** Their economically meaningful effects remain.
- **No corporate board/shareholder gameplay for ordinary non-corporate startups.** Corporation transition is voluntary and separate from an IPO.
- **No instant access to locked industries, even through a future adaptation option.** Option rights do not grant premature production.
- **No automatic perpetual distribution after rights expire.** Follow contract-defined release/exploitation windows.
- **No mandatory chapter, episode, feature-task, payroll, or employee-by-employee micromanagement.** Detail must be optional and delegation must work.
- **No omniscient AI, infinite funds, arbitrary company rescues, fake intercompany profit, or unlimited consumer spending.** Fairness is a core rule.
- **No mandatory fixed win condition, forced company diversification, required IPO, or mandatory mobile full-management parity.**
- **No asserted cloud sync:** multi-save export/import and mobile companion are confirmed; actual cross-device sync is not promised.

## U. Remaining work is specification signoff, calibration and feasibility—not more feature discovery

**Conceptual scope:** Confirmed decisions plus the player's approved simplified recommendations are assembled here. This catalog is the agreed *design direction*, **not a promise that every mechanic is already built or independently feasible in one release**. The next distinct approvals are (1) user approves the feature/design specification, (2) user later approves a separate phased/versioned roadmap, and (3) user authorizes implementation. Do **not** infer (2) or (3) from a request to package features into a Project.

**Balance later:** Starting capital defaults, tax percentages, wage rates, market size, difficulty numerical multipliers, major-release thresholds, year-25 market maturity, exact technology names/timing after sector debuts, staff limits, AI tier counts, save size and simulation performance ceilings. Each should be grounded in eventual prototypes/tests and should not silently change confirmed game rules.

**Before an implementation is considered complete:** Verify rights/contract invariants, coherent money flows, founder versus company ownership, global debut schedule, effective delegation, news/history consistency, consistent save/load and the future 100-year seeded endurance test. All are currently **unimplemented and untested**.

### Source documents

- `studio_syndicate_design_notes.md` — original design interviews, later follow-ups, confirmed vs older proposals.
- `studio_syndicate_design_spec_review.md` — earlier consolidated review and **latest superseding simplified signoff addendum**.

*End of complete feature catalog.*
