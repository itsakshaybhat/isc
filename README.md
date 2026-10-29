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
