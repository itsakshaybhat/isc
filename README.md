# INVESTSIGHT CAPITAL — interface project

Open `index.html` in a browser. Keep the files and `assets` directory together. No installation or internet connection is required.

## Main journey

1. Public company website: platform information, about, contact, Login and Request access.
2. Request access → password validation → pending administrator review. Login represents an existing approved account → choose a broker → confirm account permissions → Dashboard.
3. Use Long-term, Swing, or Intraday above the main toolbar.
4. Explore stocks → research → comparison → Execution (individual selection → allocation → agreement → monitoring).
5. Portfolio, Orders, and Risk & alerts are in the main navigation by default. More tools opens a panel beside the sidebar for Watchlist, News, Performance, Reports, Broker & capital, Model results, and Activity history. Settings stays below More tools.

The client header reads left to right: Long-term / Swing / Intraday → search → broker account / automation → theme, notifications, and profile. Public pages do not expose strategy navigation or client-page links.

## Administrator login and journey

Use the same public Login page:

- Email / username: `admin@investsightcapital.com` (or `admin`)
- Local interface password: `InvestSight@Admin2026`

This is a deliberately public, hardcoded local UI credential. It is not an actual account or a production authentication mechanism. It must not be reused for a real account or deployed as access control. Password form entries are not saved in preferences or logs; this demonstration password is necessarily readable in `admin.js`.

Clients open broker setup and then their Dashboard. The administrator opens a separate Admin overview without needing a broker. Admin navigation contains Users & access, Strategy configuration, Recommendation review, Data health, Background jobs, Audit history, Screen map, and Admin settings. Open client workspace enters the client layout while retaining a visible administrator return link; it asks for broker selection when needed.

Try this review workflow:

1. Request access with a username from the public page. The record appears in Users & access.
2. Login as administrator, review the request, add a reason, and confirm approval or suspension.
3. The request-status page reflects that decision. Pending and suspended usernames cannot complete the local client login transition; approved usernames can continue to broker setup. Existing client sign-in is still a presentation transition, not password verification.
4. Open Recommendation review. Initial research candidates are drafts, not published recommendations. Review the evidence, entry/exit rules, and risk; add a public review note and confirm publication.
5. The approved recommendation appears on the client Dashboard and Recommendations page for its strategy. Tracking it creates a waiting-for-review marker, never an order or holding. Stock details distinguish platform research from the portfolio record.
6. Withdraw research with a reason and confirmation. The client can still see the withdrawn record and history. Tracking becomes stopped; existing holdings and orders are untouched.
7. Save a policy change with weights totaling 100%, valid limits, entry/exit text, and a confirmed reason. A version record is created, current publications are withdrawn for review, accepted client agreements are invalidated, and new entries are paused. Republishing requires a fresh administrator decision.

The audit history records actual interactions in this browser with actor, IST time, area, event, reason, and outcome. It retains up to 250 events. Search and CSV export are provided. Data health reports the available dataset, missing values, source connections, and password-free diagnostics. Refresh status never advances the quote timestamp. Workers and external APIs are not connected: job monitoring shows definitions and an empty run history, and retry stays disabled until a worker integration exists. No failure, heartbeat, CPU load, or live-provider status is fabricated.

The screen map is inside Admin → Screen map (`#/admin/screens`). It defines the shared entry, client/admin navigation, screen purpose and permissions, loading/empty/error/stale/success/confirmation states, first-release interface scope, and unresolved/later product choices. Additional staff roles, live data providers, BSE coverage, real versus virtual trade ledgers, transaction costs, benchmark methodology, and worker services are left explicit rather than inferred.

Client refinements include onboarding preferences (`#/onboarding`), followed strategies, research-only mode, NSE labels, watchlist research signals, published-recommendation filters (strategy, industry, status, publication date), sorting, six-row pagination, recommendation history, and data-freshness/entry/exit notifications. Portfolio source is explicitly an account snapshot. Strategy rules are linked from Dashboard and show the current policy. A session-ended screen and an access-denied screen are included.

## Included functionality

- Distinct strategy rankings, metrics, portfolio allocations, comparison lists, and explanations.
- Twelve ranked research companies per strategy; ranking never automatically selects or buys them.
- A dedicated Comparison page immediately below Orders in the default sidebar arrangement. Drag ranked securities into three slots, replace or reorder them by dropping, or search and add them with buttons. Comparison selections remain separate per strategy; no comparison rail occupies other pages.
- Chart-first company research: market price → chart → AI assessment → financial and technical ratios.
- Editable ranking history: Intraday trading day and full/morning/afternoon session with 15-minute steps; Swing daily reviews within an editable date range; Long-term weekly, monthly, or yearly reviews with editable period count and end date. The slider updates rank movements and model scores. Historical ranking times remain separate from the displayed quote timestamp.
- Industry-grouped watchlists with an Add companies search-and-select dialog. Existing selections are marked; duplicates are prevented.
- News filters for company / keyword / industry / event. My holdings news shows updates for owned stocks in the active strategy. Refresh news clears the filters and restores all available local updates, newest first.
- Twelve searchable broker choices: Zerodha, Dhan, Upstox, Angel One, FYERS, ICICI Direct, Kotak Neo, Alice Blue, 5paisa, Shoonya, Samco, and Motilal Oswal.
- Account visibility is separate from optional order, modification/cancellation, and automation permissions. Order access is off by default; dependent permissions switch off with it. Choices are saved per broker. Switching brokers clears accepted strategy agreements. Settings and automation controls show the selected authority.
- A top-left button collapses the desktop sidebar and opens/closes mobile navigation. More tools opens sideways in a separate panel, leaving the main sidebar list in place. Click outside, press Escape, or navigate to close it. On mobile it uses a contained sheet. Strategies has been removed from that menu.
- The planning-horizon control and extra context strip are removed. The quote timestamp sits at the right of the Dashboard heading. Ranking history controls remain inside Explore stocks, including long-term week/month/year and Swing daily date selection.
- Execution replaces the visible My Plan naming; existing `#/plan/...` links remain compatible.
- Risk has three distinct panels: Overview contains status, threshold gauges, and first actions; Details contains issue causes, evidence, priority filters, and alert rules; Analysis contains position weights, Profit/Loss contribution, drawdown history, industry exposure, and calculation definitions. Tabs support arrow keys, Home, and End. Response workflows show interrupted connections, delayed quotes, and loss-limit breaches without changing the underlying account figures.
- Settings → Workspace tools supports saved sidebar ordering with drag-and-drop or Up/Down buttons. Pin tools to the sidebar or move pages into More tools. Research first, Trading first, and Portfolio first presets are provided, along with Restore default. Dashboard remains in the main navigation and Settings stays anchored at the bottom. Arrangement changes affect navigation only.
- Dashboard includes a dismissible three-step introduction and a Quick guide button. The guide is also accessible from Workspace tools and links directly to relevant pages.
- Shared account calculations across Dashboard, Portfolio, Performance, Reports, CSV, and PDF.
- Branded two-page PDF exports with embedded logo, vector equity chart, exact account totals, position or order details, twelve rankings, and a research summary. Print / Save as PDF and detailed CSV are also available.
- The selected broker identity carries through client pages and report snapshots.
- Responsive full-width workspace pages, contained table scrolling, and a mobile navigation bar.
- More tools stays immediately above Settings at the bottom of the sidebar. Workspace tools, Learn, and Help & support are inside Settings.
- Three appearance choices: Light, Dark, and Pure dark. A custom, keyboard-accessible theme menu keeps option text and backgrounds consistent. Dark backgrounds use a white logo backing so the original emblem remains readable.
- Open-position gain is labelled Profit/Loss throughout the UI and report exports.

## Implementation boundary

This remains the frontend-only project requested by the owner. Login and broker selection are local UI transitions, not secure authentication or actual broker authorization. The public/client route gate is for presentation and is not a security boundary. Request access creates only a local pending-status record with masked email, never an administrator notification or real account. No passwords are persisted. Broker names are interface choices, not implemented integrations or assertions of provider-specific API capabilities. No account, order, data-provider, news-provider, or AI API is contacted. Notifications and saved alerts do not run background monitoring.

Admin route and action guards are browser-side UI checks only. Local storage, audit records, and role flags are editable by anyone controlling the browser. Production FastAPI endpoints must independently verify sessions, roles, account ownership, CSRF protections, publication policy versions, and confirmations. Suggested server boundaries are authenticated identity/session endpoints; administrator-only users/access, strategy-version, recommendation-decision, provider-health, job-retry, and audit endpoints; and client endpoints scoped to that client's holdings, preferences, and research tracking. A page guard or hidden navigation must never substitute for these backend checks. Password hashing, recovery delivery, real expiry, rate limiting, immutable server audit storage, and separate account state are not implemented here.

Displayed companies, events, model inputs, price histories, account ledgers, and account identifiers are deterministic local design fixtures. They are not actual financial statements, measured model results, current market data, or realized client performance. Production deployment needs real authenticated APIs, licensed data, calculation validation, and approved operating terms. At the owner's request these implementation notes are not repeated as labels inside the product interface.

Risk review thresholds (15% position weight, 2% daily position loss, 8% historical drawdown) are design policy fixtures, not approved client limits. Daily position loss uses the marked change from prior-close prices on current holdings and excludes realized trading and charges. Response workflows are explicit UI states, not detected outages or measured loss breaches. Refresh news resets the local list; it does not request live headlines.

Reference patterns: the public access journey was informed by `https://algo.investsightcapital.com/signup`. The local `Other docs/Repository Reference/old-quant/frontend/src/ui.jsx` and `Dashboard.jsx` informed threshold gauges, status indicators, and contribution charts. These were adapted into the existing buildless UI. No authentication, WebSocket, API, or trading code was imported from that repository.

The report graph and return reconciliation are driven by the same account model. PDF downloads are generated fully in the browser, including the supplied logo; no upload or server is involved. The report-generation timestamp uses India Standard Time.

## Extended workspace (29 October 2026)

New capabilities were added in `features.js` / `features.css`, wired into the existing hash router, navigation, header, and settings. All remain frontend-only with no network calls.

- Landing page: reworked hero — InvestSight vision and taglines, a market-snapshot panel (Nifty 50 / Bank Nifty with status), quick links, a connected-workspace feature grid, a four-step "how it works" row, and an FAQ accordion.
- Analysis desk (`#/analysis`) is the single research hub. Clicking **Analysis** in the sidebar opens the **Chat** (analysis calculation assistant) by default. Its tabs are: Chat · Dashboard · Atlas · Stock screens (Screener.in-style builder with the full Ratio Gallery, popular-theme directory, saved screens) · Scan engine (Chartink-style AND/OR logic) · Charts · Compare (stock comparison workspace).
- No redundancy: Stock screens, Comparison and the Analysis chat live only inside Analysis — not as separate sidebar or Tools items. Legacy deep links redirect: `#/screens*` → Analysis → Stock screens; `#/tools/scanner` → Analysis → Scan engine; `#/tools/compare-stocks` → Analysis → Compare; `#/tools/chat` → Analysis → Chat. The standalone `#/compare` route still resolves.
- Sectors (`#/sectors`): Overview, Momentum Map, Sector Breadth (advance/decline bars), Thematic Rotation, Volume Pulse, Seasonality Map, Rotation Graph (RRG), and Sector Lens.
- Tools (`#/tools`): Strategy Backtest, Indicator Edge Explorer, Position Sizing (live), Trade Analyzer, Portfolio X-ray and a calculator suite. Screener/scan/compare/chat are not duplicated here — the hub links to the Analysis desk.
- More & resources and Pricing moved into Settings. Settings now has: Profile, Security, Notifications, Display, Keyboard shortcuts, Agreements & permissions, Privacy, Workspace tools, **More & resources** (App Tour, Tutorials, Blog, Glossary, How we scan, What's new, About, Contact), **Pricing & plans**, Learn, and Help & support. There is no separate "More" or "Pricing" sidebar item. The public `#/pricing` page for visitors remains and shares the same `pricingTiers` code (no duplication); the `more/*` routes still resolve and link back to Settings.
- NSE / BSE exchange toggle in the client header; the choice persists and is shown on screener and scan result headers (`state.exchange`).
- Keyboard shortcuts: a Settings → Keyboard shortcuts tab and a global handler. `/` focuses search, `?` opens the overlay, `g` then `d/e/a/s/c/k/t/p` navigates (including `g s` → Analysis stock screens, `g c` → Analysis compare), `e` opens Execution, `1/2/3` switch strategies, `t` cycles theme, `Esc` closes dialogs.
- Fully automated, one-click AI execution: the Execution page (`#/plan/selections`) leads with a **One-click AI execution** panel. The client enters only two things — **budget** and **stop-loss (%)** — and presses one **Execute** button. The AI does everything else: it selects the stocks (top model-ranked names for the active strategy — 5 long / 4 swing / 3 intraday), sizes each position to the budget, applies the stop-loss, sets a reward-to-risk target, keeps a small cash buffer, records an audit event, and shows a queued-orders confirmation with per-stock quantity/entry/stop/target. The selection is shown as "AI-selected stocks" cards before and after running, so the client sees what the model chose without having to pick anything. When automation is paused the panel is blocked. The previous step-by-step manual flow (selection → budget → agreement → monitoring) is retained under an "Advanced" disclosure for anyone who wants it. As with the rest of the project this is a presentation flow — no real order is placed.

Offline checks were extended: `verify-interface.cjs` loads `features.js` and expects 17 navigation routes. `node verify-interface.cjs` passes (192 linked screens, 36 strategy screens, 11 admin screens, 18 dialogs, 77 handled actions, 0 network calls). Asset version is bumped to 17; use Ctrl+F5 to refresh cached files.

## Files

- `index.html` — entry point.
- `theme-init.js` — restores saved appearance before loading styles to avoid a light flash.
- `styles.css` — shared components and print styles.
- `workspace-v3.css` — current header, sidebar, ranking timeline, drag-and-drop Comparison, logo contrast, and third theme.
- `workspace-v4.css` — accessible theme menu, collapsible sidebar, access-request form, twelve-broker permissions layout, risk charts, watchlist picker, and holdings news.
- `workspace-v5.css` — Dashboard quote placement, sideways More tools, sidebar organizer, introduction, and distinct risk views.
- `workspace-v6.css` — refined public workflow panel, metrics-first Dashboard, compact recommendation empty state, shared typography, navigation, theme treatment, and mobile spacing.
- `app.js` — views, href navigation, strategy/account model, local interactions.
- `model-results.js` — focused company assessments, score contribution and ranking bars, review-history line graph, score distribution, accessible data tables, and CSV export.
- `model-results.css` — research analytics layout, uniform theme-dropdown choices, and red paused-automation states.
- `admin.js` — local admin credential, shared role-routing helpers, access review, policy versions, research publication, health/jobs, audit, and screen map.
- `client-research.js` — recommendation list/detail/tracking, onboarding, strategy-policy explanations, and expanded notifications.
- `admin.css` — administrator layout and shared research components in all three themes.
- `pdf-export.js` — self-contained PDF writer and embedded brand image.
- `features.js` — extended workspace views: landing-page extras, stock screens + ratio gallery, analysis desk, sector maps, tools and calculators, analysis chat, pricing, more hub, and keyboard-shortcut data.
- `features.css` — styles for all extended-workspace components, using the shared design tokens.
- `ai-automation.js` — kill switch, safety limits, market filter, confidence sizing, position management, AI decision log and scorecard, paper mode, and admin Live operations.
- `workspace-v8.css` — styles for the kill switch, safety panel, AI cards, decision log, scorecard, and admin status strip.
- `assets/investsight-logo.png` — supplied company logo, preserved as provided.
- `verify-interface.cjs` — offline structure, route, calculation, and state-transition checks.
- `verify-admin.cjs` — admin/client route and action checks, approval/suspension flow, publication/withdrawal, history, tracking isolation, policy validation, audit, and session-ending checks; called by `verify-interface.cjs`.
- `verification-results.json` — latest check results.

Run `node verify-interface.cjs` from this folder. The earlier command `node verify-prototype.cjs` remains as a compatibility entry point.

Visual review on 24 October 2026 used the Codex browser with a local preview server. Reviewed the public homepage and client Dashboard at desktop size, Light and Pure dark dashboard themes, and both pages in 390px-wide iframe previews. The existing offline checks passed (157 linked screens, 36 strategy screens, 11 admin screens, and 18 dialogs). This visual pass does not cover every route or replace real-device testing. The automated checks themselves do not inspect browser layout.

The UI pass brings account figures directly below the Dashboard heading, places recommendations after performance, reduces the empty-state footprint, and replaces the homepage emblem panel with a three-step process explanation. Existing local data and account calculations are retained.

Editable Figma design companion: https://www.figma.com/design/iCio1vM6Ttfz5PYEOsnEp5 . It includes dashboard hierarchy and homepage process layouts, reusable metrics, color variables, and text styles. It is a design companion, not a full application export: the browser capture could not upload. Figma uses Inter because Segoe UI is unavailable there; the application retains its system-font stack. Final browser screenshots are in `review/`.

Local preferences use `investsight-ui-v2`. Sign out to restart the Login → broker → Dashboard journey. Use Ctrl+F5 after opening the updated files to refresh cached assets.

Dark-theme correction (24 October 2026): document-scoped, complete Light/Dark/Pure dark palettes, consistent dark form controls, and asset version 8 to refresh the earlier cached styles. Existing offline checks pass. Browser policy blocked access to the current preview during this correction, so this follow-up has not been visually reverified.

UI follow-up (25 October 2026): installed `Leonxlnx/taste-skill` as `design-taste-frontend` in `.agents/skills/` using the requested skills CLI. Its app-screen guidance informed the data-terminal analysis composition; existing brand, type and navigation remain in use. Theme choices now use `data-theme-choice` so the options never create competing page palettes. Paused automation is red in the header, controls dialog and entry-monitoring notice, with an explicit Paused label. Model results uses the existing local score inputs and effective administrator weights. Scores, counts, history, contributions and CSV reconcile; it does not infer backtest performance, probabilities or a measured success rate. Asset version 9 refreshes the updated code. The skill is installed for subsequent turns as well.

## Revision (1 November 2026)

This revision supersedes the matching items above. Asset version is 18 and `workspace-v7.css` holds the new styles.

- Public header: Register comes before Login. Login offers Continue with Google (interface transition only, no OAuth is wired), an email field with the placeholder "Enter email", and no Request access link.
- Broker setup: Account visibility is removed. Execution access has an Allow all checkbox, and the authorization statement uses a larger font.
- Recommendations are removed from the client (navigation, Dashboard, company page, notifications) and from the admin (navigation, overview, global search, settings, jobs). Old `#/recommendations` links open the Dashboard; `#/admin/recommendations` opens the admin overview.
- Search is plain-word matching: every typed word must appear. AND/OR/NOT, parentheses, and /regex/ were removed along with their help text.
- Dashboard: Quick guide and Strategy rules buttons removed (Quick guide stays in Settings → Workspace tools). Adds KPI sparklines, an equity allocation donut, Profit/Loss by position, and an automation summary for all three strategies.
- Explore stocks: the Select column, Select all visible, and Choose columns were removed.
- Execution has two tabs. Selected stocks takes only budget and stop-loss; the AI selects and sizes positions, capped at available cash and the stock weight limit. Stock actions lists Entered, Waiting, and Exited stocks. Budget, agreement, and monitoring steps were removed; pressing Execute authorizes automation.
- Portfolio adds charts below the holdings list: capital allocation donut, industry exposure bars (industries plus cash = 100%), entry and exit tracker (stop-loss → entry → now → target), Profit/Loss by position, and pending entries and exits.
- Risk & alerts adds Alert delivery for WhatsApp, Telegram, and email with validation and a confirmation-request status; each alert can choose its channels. No message is actually sent.
- Analysis sits after Risk & alerts. Its tabs are Dashboard, Atlas, Stock screens, and Compare; the Chat, Scan engine, and Charts tabs were removed. Dashboard shows account performance, sector performance, breadth, allocation, drawdown, Profit/Loss, model leaders, and a price chart.
- The chat is a floating assistant at the bottom right on every client page except Settings. It answers portfolio, cash, risk, profit, pending-entry, and exit questions from workspace data and does calculations.
- Model results: focus-company hero with score ring, stacked contribution bar, colour-coded components, and a heat-shaded assessments table.
- Calculation fixes:
  - Profit/Loss is signed (losses show −₹).
  - Industry exposure is aggregated by sector.
  - Portfolio X-ray NaN is fixed.
  - Sector volume share now sums to 100%.
  - 1M, 3M, and 6M chart date labels are evenly spaced.
  - SIP at 0% no longer divides by zero.
  - AI exits reconcile exactly with each strategy's realized P&L.

`node verify-interface.cjs` passes with updated checks for all of the above.

## Revision 7: kill switch, AI execution, Live operations (1 November 2026)

Asset version is 19. New files: `ai-automation.js` (logic and views) and `workspace-v8.css` (styles). Scope covers Long-term, Swing and Intraday only; F&O is not included. Every item is interface-only: the backend must enforce each limit and place, cancel, and exit the orders.

- Kill switch:
  - The red header button is on every client page; it also appears in the automation dialog, on the Dashboard, and in Risk & alerts.
  - It stops all strategies or only the current one, optionally cancels waiting orders and exits open positions, and requires typing STOP.
  - While it is on, a banner shows, Execute is disabled, Pause cannot be lifted, waiting entries show "Cancelled · kill switch", positions show "Exit queued", and an audit entry is recorded.
  - Resume requires confirmation.
- Safety limits (Risk & alerts → Overview):
  - Limits: daily and weekly loss %, maximum orders per day, maximum open positions, intraday auto square-off time, a pause when India VIX is above a level, and a pause when Nifty falls more than a set %.
  - Toggles: automatic kill switch, trailing stop, and partial booking.
  - The panel shows live gauges and validates every value.
- AI execution:
  - A market filter scales sizing to 100%, 75%, or 0% from India VIX, Nifty change, and breadth.
  - Sizing is weighted by each pick's confidence (30–97%), then capped by available cash and the stock weight limit.
  - The open-position limit applies to new entries.
  - The trailing stop moves to breakeven at +1R and to +1R at +2R; 50% of the position is booked at 1.5R.
  - "How the AI runs this strategy" card.
  - AI decision log (entries, waits, trails, exits, skips, and kill events, each with a reason and confidence).
  - AI performance scorecard (win rate, profit factor, average win and loss, AI return vs Nifty 50 for the selected range).
  - Paper/Live mode for each strategy.
  - The chat answers "why", kill switch, market, and win-rate questions.
- Administrator:
  - Redesigned Overview: status strip with platform halt, live totals, client-access donut, decision queue, and engine score bars.
  - New Live operations page: platform-wide halt and lift, a client automation monitor with per-strategy pause, AI engines, market guard, and safety events.
  - "AI execution policy" in Strategy configuration (default stop-loss, target multiple, trailing start, partial booking), versioned with the policy.
  - AI execution and square-off background jobs.
  - Halted pill in the header and icons on the sidebar's bottom items.
- The market inputs (`marketFixture`) and Nifty reference returns (`benchmarkReturn`) are fixtures; replace them with live feeds.

`node verify-interface.cjs` passes, including the new kill switch, safety-limit, market-filter, trailing, scorecard, paper-mode, and platform-halt checks.

## Revision 8: trailing stop, one stop control, fewer duplicates (1 November 2026)

Asset version is 20. This supersedes the matching points in Revision 7.

- Trailing stop-loss: the stop always sits at the stop-loss % below each position's highest price since entry. It rises with the price and never moves down or below the initial stop. Stock actions shows the current trailing stop with its starting level. The trailing toggle (Risk & alerts) and "Trailing starts at (R)" (admin AI policy) were removed because trailing is always on. The backend should send each position's high-water mark as `peak`.
- One stop control:
  - The kill switch is the only way to stop the AI. The header Automation button, the Automation controls dialog, the Pause/Resume entries buttons, and the per-client Pause on Live operations were removed.
  - Stopping one strategy is the kill switch's "this strategy only" option.
  - When entries are on hold for other reasons (an admin policy change or a broker permission change), pressing Execute resumes them.
- Risk & alerts has two tabs, Overview and Details; the Analysis tab was removed. The duplicate daily-loss gauge was removed, since the safety panel shows it against the user's own limit.
- Duplicates removed:
  - Dashboard: allocation donut and Profit/Loss by position (both remain in Portfolio).
  - Portfolio: entry & exit tracker and "What the AI is working on" (both remain in Stock actions).
  - Analysis: account performance, AI performance, allocation, Profit/Loss by position, and saved scans. Analysis is now market-focused, and its Market regime and India VIX figures come from the same market filter the AI uses.
  - Admin Overview: duplicated live totals, engine score comparison, and leading-engine panels. Live operations owns halt and live positions.

## Revision 9: Sectors, Settings, keyboard shortcuts, Dashboard line graph (1 November 2026)

Asset version is 21. New files: `settings-pro.js` (loaded after `ai-automation.js`) and `workspace-v9.css`.

- Dashboard: the account performance chart is always a line graph. The Candlestick/Line choice in Settings applies to company price charts only.
- Sectors (More tools):
  - All eight tabs fit without sideways scrolling.
  - Every tab has a "how to read this" note.
  - Numbers are right-aligned in fixed columns, and every tab uses the same derived figures (`sectorRows()`).
  - Overview has four summary figures and a single ranked scoreboard; the old Leaders and Laggards tables are gone (Laggards listed sectors that were up).
  - Momentum: ranked bars with the 60 line marked.
  - Breadth: rising vs falling, broadest first.
  - Themes: status thresholds stated.
  - Volume: share bars and a total row. "vs 20-day average" is corrected so that 1.8× reads +80%.
  - Seasonality: numeric cells, with the current month outlined.
  - Rotation: the quadrant maths is fixed (Technology was shown as Improving; it now plots as Leading), and a table lists each sector's quadrant.
  - Stocks by sector: aligned rows.
- Settings: each section has a one-line description and editable, validated fields.
  - Profile: name, mobile, read-only sign-in email and IST market hours, start page, default strategy, default exchange.
  - Security: two-step verification, idle sign-out after 15/30/60/120 minutes, and a password change form. The password is never stored; the backend completes the change.
  - Notifications: an event × channel matrix; channels unlock once verified in Risk & alerts. Safety alerts always appear in-app. Daily summary time and quiet hours.
  - Display (asset version 22): every option applies and saves the moment it is chosen; there is no Save button. Options are theme, density, stock chart type, indicator, chart period (all strategies together), reduce motion, and show/hide the chat. The selected option is filled with the brand colour, a "How it looks" panel shows the current chart type, indicator, period, and density, and Compact visibly tightens spacing. Restore defaults lists the defaults it returns to.
  - Agreements & permissions: a status table per strategy. The old "Stop automation" button is removed; the kill switch remains the only stop control.
- Keyboard shortcuts:
  - Every shortcut can be changed: press Change, then a key or `g` followed by a key.
  - Conflicts and browser combinations (Ctrl, Alt, ⌘) are rejected.
  - There is a per-shortcut Default button, Reset all, and an on/off switch.
  - New shortcuts: Orders, Risk & alerts, Settings, chat, and kill switch (it opens the confirmation dialog only).
- Backend contract: store `state.prefs` (profile, security, notification routing, display) and `state.shortcuts` per user. Enforce the session timeout and two-step verification server-side, and route notifications by `prefs.notify`.

## UX pass with Oxfords (1 November 2026)

Asset version is 24. New files: `workspace-v10.css` (UX floor, loaded last), `ux-polish.js` (right-aligns numeric table columns after each render), `DESIGN.md` (design rules), and `keep.txt` (labels the pass had to keep). Skills installed in `.agents/skills/`: `oxfords` (arhamhi/oxfords), plus `ui-design` and `web-design-guidelines` (PyModel/react-frontend-skills). Scope: Evolve. Routes, labels, data, and brand are unchanged; Oxfords `keep.mjs` confirmed every link, nav label, field, and figure on 12 rendered pages.

- Header no longer breaks at 761–1250px; all seven sidebar destinations fit on short screens.
- Text floor of 11px (112 declarations raised; the logo wordmark is unchanged).
- Visible focus rings on search, budget, and password fields.
- Numbers right-aligned with tabular figures in every table.
- Quiet status chips: dot + text for normal states; only amber and red are tinted.
- Page-title eyebrows and the dashboard greeting removed; no coloured side rails; no hover jumps; the system reduce-motion setting is honoured.
- Oxfords checker: 51 fails down to 3, all in the logo wordmark, a recorded exception.
