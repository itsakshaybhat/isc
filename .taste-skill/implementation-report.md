# Model results and control states

25 October 2026. Applied the installed `design-taste-frontend` app-screen guidance.

Style: data-terminal, seed 2005354075. Kept the existing brand palette, system font, and labelled navigation to preserve the established app. No direction redraw. The product's face is the green research series and its signature is the four-component weighted score explanation.

## Data and jobs

- Twelve named research companies, each with quality, valuation, technical, and event scores on a 0–100 scale.
- Long-term, Swing, and Intraday are separate strategy scopes.
- Effective administrator policy supplies four weights totaling 100% and a version.
- Ranking review history and quote timestamps describe different times.
- Selected review position limits the history; later reviews are excluded.
- Component contribution equals score × weight ÷ 100, in score points.
- Ranking, mean, distribution, contribution, and CSV use the same inputs.
- The user selects a company, compares it to the universe, reads supporting and opposing evidence, then opens its research.
- Pausing stops new entries for the current strategy and remains distinct from orders and holdings.
- Theme choices are preferences, not independent palette scopes.

Screen question: Why does a company rank here under the current policy?

Finding: the leading company and its score appear in the title; the selected company's largest score contribution appears beside its breakdown.

## Verification

- Existing offline suite passes: 157 linked screens, 36 strategy screens, 11 admin screens, and 18 dialog checks.
- Added model checks: full ranking agreement (including tied scores), count reconciliation, contribution totals, current policy weights, selected-company changes, one-review history, zero-weight components, and CSV contents.
- Added theme-option palette isolation and per-strategy pause-indicator checks.
- Taste lint on the new model files: 0 failures, 0 warnings.
- Static server confirmed serving asset version 9 over HTTP 200.
- Final browser screenshots and interaction review remain pending: the tab entered a connection-error page, and browser URL policy blocked further control. Requested a user refresh. No visual score or inspector measurements are claimed. The skill's native browser inspector was not used as an alternate browser-control path.

The input companies, scores and historical series remain the existing deterministic local project fixtures described in README. The new graphs do not claim measured model accuracy, realized returns, or backtest results. Production data still needs its existing integration work.
