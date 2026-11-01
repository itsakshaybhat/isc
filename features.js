/* INVESTSIGHT CAPITAL — extended feature module.
   Buildless. No API calls. Registers new client views used by app.js.

   The Analysis desk is the single research hub and hosts, as tabs:
   Dashboard (performance and market charts), Atlas, Stock screens
   (Screener.in-style ratio-gallery builder) and Compare. The assistant chat is a floating widget.
   Sectors (breadth, momentum map, thematic rotation, volume pulse, seasonality,
   rotation graph/RRG, sector lens), Tools (backtest, indicator edge, position
   sizing, trade analyzer, portfolio x-ray, calculators, analysis chat),
   a shared Pricing view, and a More hub.

   Stock screens and Comparison are NOT duplicated in the sidebar or Tools; the
   legacy #/screens and #/tools/{scanner,compare-stocks} routes redirect here.

   All functions return HTML strings and rely on helpers already defined in app.js
   (icon, link, action, badge, title, section, table, money, fixed, pct, esc,
   stockData, stock, scores, strategy, strategyList, state, persist, render, go,
   toast, showDialog, $, $$). This file loads before app.js so the symbols it
   defines are available when app.js builds its route switch. */

/* ------------------------------------------------------------------ *
 * 1. RATIO GALLERY (Screener.in parity) + SCREEN BUILDER STATE
 * ------------------------------------------------------------------ */

const RATIO_GROUPS = {
  'Most Used': [
    'Sales', 'OPM', 'Profit after tax', 'Market Capitalization',
    'Sales latest quarter', 'Profit after tax latest quarter',
    'YOY Quarterly sales growth', 'YOY Quarterly profit growth',
    'Price to Earning', 'Dividend yield', 'Price to book value',
    'Return on capital employed', 'Return on assets', 'Debt to equity',
    'Return on equity', 'EPS', 'Debt', 'Promoter holding',
    'Change in promoter holding', 'Earnings yield', 'Pledged percentage',
    'Industry PE', 'Sales growth', 'Profit growth', 'Current price',
    'Price to Sales', 'Price to Free Cash Flow', 'EV/EBITDA',
    'Enterprise Value', 'Current ratio', 'Interest Coverage Ratio',
    'PEG Ratio', 'Return over 3months', 'Return over 6months'
  ],
  'Annual P&L': ['Sales', 'Expenses', 'Operating profit', 'OPM', 'Other income', 'Interest', 'Depreciation', 'Profit before tax', 'Tax', 'Profit after tax', 'EPS'],
  'Quarter P&L': ['Sales latest quarter', 'Expenses latest quarter', 'Operating profit latest quarter', 'OPM latest quarter', 'Profit after tax latest quarter', 'YOY Quarterly sales growth', 'YOY Quarterly profit growth', 'EPS latest quarter'],
  'Balance Sheet': ['Equity capital', 'Reserves', 'Borrowings', 'Debt', 'Other liabilities', 'Fixed assets', 'CWIP', 'Investments', 'Other assets', 'Total assets', 'Working capital'],
  'Cash Flow': ['Cash from operations', 'Cash from investing', 'Cash from financing', 'Net cash flow', 'Free cash flow', 'Price to Free Cash Flow'],
  'Ratios': ['Return on equity', 'Return on capital employed', 'Return on assets', 'Debt to equity', 'Current ratio', 'Interest Coverage Ratio', 'Price to Earning', 'Price to book value', 'Price to Sales', 'PEG Ratio', 'EV/EBITDA', 'Dividend yield', 'Earnings yield', 'OPM'],
  'Price': ['Current price', 'Market Capitalization', 'Enterprise Value', 'Return over 3months', 'Return over 6months', 'Return over 1year', 'Return over 3years', 'Return over 5years', 'High price', 'Low price', '52w High', '52w Low']
};

const RATIO_RECENT = ['Sales', 'OPM', 'Profit after tax', 'Market Capitalization', 'Price to Earning', 'Return on equity'];

const RATIO_PRECEDING = [
  'Sales growth 3Years', 'Sales growth 5Years', 'Profit growth 3Years', 'Profit growth 5Years',
  'Average return on equity 5Years', 'Average return on equity 3Years',
  'Return over 1year', 'Return over 3years', 'Return over 5years'
];

const SCREEN_OPERATORS = ['+', '-', '/', '*', '>', '<', 'AND', 'OR'];

/* saved per-strategy screen draft text */
function screenState() {
  state.screens = state.screens || { query: {}, saved: [] };
  if (typeof state.screens.query[state.strategy] !== 'string')
    state.screens.query[state.strategy] = 'Market Capitalization > 500 AND\nPrice to Earning < 30 AND\nReturn on equity > 15';
  return state.screens;
}

const POPULAR_SCREENS = [
  { group: 'Popular themes', items: [
    ['Low on 10 year average earnings', 'Graham-style valuation using 10-year average earnings.'],
    ['Capacity expansion', 'Fixed assets doubled over 3 years, or up 50% in the last year.'],
    ['Debt reduction', 'Companies steadily reducing borrowings while expanding.'],
    ['Companies creating new high', 'Current price near the 52-week high.'],
    ['Growth without dilution', 'Less than 10% equity dilution over 10 years.'],
    ['FII Buying', 'Rising foreign institutional holding.']
  ]},
  { group: 'Popular formulas', items: [
    ['Piotroski Scan', 'Piotroski score of 9 — profitability, leverage and efficiency.'],
    ['Magic Formula', 'Joel Greenblatt ranking of earnings yield and return on capital.'],
    ['Coffee Can Portfolio', 'Consistent quality compounders, Saurabh Mukherjea style.']
  ]},
  { group: 'Price or Volume', items: [
    ['Darvas Scan', 'Within 10% of 52w high, volume > 100000, price > 10.'],
    ['Golden Crossover', '50 DMA crosses above 200 DMA from below.'],
    ['Bearish Crossover', '50 DMA cuts 200 DMA from above.'],
    ['RSI — Oversold Stocks', 'RSI below 30.']
  ]},
  { group: 'Quarterly results', items: [
    ['The Bull Cartel', 'Strong latest quarterly growth — set an alert.'],
    ['Quarterly Growers', 'Q0 > Q1 > Q2 > Q3 profit trend.'],
    ['Best of latest quarter', 'Best latest quarterly numbers.']
  ]},
  { group: 'Valuation screens', items: [
    ['Highest Dividend Yield', 'Consistent payers sorted by yield.'],
    ['Loss to Profit Companies', 'Turnaround — quarterly loss to profit.'],
    ['FCF Yield', 'Strong free-cash-flow yield and growth.']
  ]}
];

/* Build a ratio gallery panel (Screener.in right-rail parity). */
function ratioGallery() {
  const tabs = Object.keys(RATIO_GROUPS);
  const active = state.screens?.ratioTab && tabs.includes(state.screens.ratioTab) ? state.screens.ratioTab : 'Most Used';
  const ops = SCREEN_OPERATORS.map(o =>
    action(esc(o), 'screen-insert', 'ratio-op' + (['AND', 'OR'].includes(o) ? ' is-word' : ''), `data-token="${esc(o)}"`)).join('');
  const tabBtns = tabs.map(t =>
    action(esc(t), 'screen-ratio-tab', 'ratio-tab' + (t === active ? ' active' : ''), `data-tab="${esc(t)}"`)).join('');
  const ratioRow = name =>
    `<button type="button" class="ratio-item" data-action="screen-insert" data-token="${esc(name)}">${esc(name)}</button>`;
  return `<aside class="ratio-gallery" aria-label="Ratio gallery">
    <div class="ratio-gallery-head"><h3>Ratio Gallery</h3></div>
    <div class="ratio-ops" role="group" aria-label="Operators">${ops}</div>
    <div class="ratio-tabs" role="tablist">${tabBtns}</div>
    <form class="ratio-search" id="ratio-search" role="search">${icon('search')}
      <input name="q" id="ratio-search-input" placeholder="Search ratio e.g. sales" aria-label="Search ratio"></form>
    <div class="ratio-list" id="ratio-list">
      <div class="ratio-subhead">Recent</div>
      ${RATIO_RECENT.map(ratioRow).join('')}
      <div class="ratio-subhead">${esc(active)}</div>
      ${RATIO_GROUPS[active].map(ratioRow).join('')}
      <div class="ratio-subhead">Preceding · Historical</div>
      ${RATIO_PRECEDING.map(ratioRow).join('')}
    </div>
    <p class="ratio-hint">Can't find the ratio you want? ${action('Create a new ratio', 'screen-new-ratio', 'text-link')}</p>
  </aside>`;
}

/* Stock Screens now lives inside Analysis. This route redirects old/deep links
   (#/screens, #/screens/create, #/screens/saved) into Analysis → Stock screens. */
function stockScreens(tab) {
  state.screens = state.screens || {};
  state.screens.view = tab === 'create' ? 'builder' : tab === 'saved' ? 'saved' : 'directory';
  try { persist(); } catch (e) { /* ignore */ }
  setTimeout(() => { location.hash = '#/analysis/screens'; }, 0);
  return title('Opening Analysis → Stock screens…', 'Stock screens are part of the Analysis desk.', link('Go to Analysis', 'analysis/screens', 'btn primary'), 'ANALYSIS DESK');
}

function screenDirectory() {
  return `<form id="screen-search" class="filter-bar" role="search">${icon('search')}
    <input name="q" placeholder="Search screens…" aria-label="Search screens"></form>
    <div class="screen-directory">${POPULAR_SCREENS.map(g =>
      `<section class="screen-group"><h3>${esc(g.group)}</h3><div class="screen-cards">${g.items.map(([name, desc]) =>
        `<button type="button" class="screen-card" data-action="screen-load-template" data-name="${esc(name)}">
          <strong>${esc(name)}</strong><p>${esc(desc)}</p>
          <span class="screen-run">Run screen ${icon('arrow')}</span></button>`).join('')}</div></section>`).join('')}</div>`;
}

function savedScreens() {
  const saved = screenState().saved;
  if (!saved.length)
    return emptyBlock('No saved screens yet', 'Build a query and save it to reuse later.', action('Create new screen', 'screen-view', 'btn primary', 'data-view="builder"'));
  return `<div class="screen-cards">${saved.map((s, i) =>
    `<div class="screen-card saved"><strong>${esc(s.name)}</strong><pre class="screen-query-preview">${esc(s.query)}</pre>
      <div class="row wrap">${action('Open', 'screen-open-saved', 'btn small', `data-index="${i}"`)}${action('Delete', 'screen-delete-saved', 'text-link', `data-index="${i}"`)}</div></div>`).join('')}</div>`;
}

function screenBuilder() {
  const q = screenState().query[state.strategy];
  const matches = runScreen(q);
  return `<div class="screen-builder">
    <div class="screen-main">
      <section class="card screen-query-card">
        <div class="row between wrap"><h3>Query</h3>
          <div class="row wrap">${action('Run this query', 'screen-run', 'btn primary', '')}${action('Save screen', 'screen-save', 'btn small', '')}${action('Clear', 'screen-clear', 'text-link', '')}</div></div>
        <p class="field-help">Click ratios and operators on the right to build your query, or type it directly. Example: <code>Market Capitalization &gt; 500 AND Return on equity &gt; 15</code></p>
        <textarea class="field screen-query" id="screen-query" aria-label="Screen query" spellcheck="false">${esc(q)}</textarea>
      </section>
      <section class="card">
        <div class="row between wrap"><h3>Results</h3><span class="muted">${matches.length} companies · ${esc(state.exchange || 'NSE')} · ${strategy().name}</span></div>
        ${matches.length ? table(['Company', 'CMP', 'P/E', 'ROE %', 'Sales gr %', 'Debt/Eq', 'Model'],
          matches.map(c => `<tr>
            <td><a href="#/company/${c.id}/overview">${esc(c.name)}</a> <small class="muted">${esc(c.sector)}</small></td>
            <td>${fixed(c.price)}</td><td>${c.pe}</td><td>${c.roe}</td><td>${c.growth}</td>
            <td>${c.debt == null ? '—' : c.debt}</td><td>${scores(c).total}/100</td></tr>`))
          : emptyBlock('No companies match', 'Adjust the thresholds or operators in your query.', '')}
      </section>
    </div>
    ${ratioGallery()}
  </div>`;
}

/* Very small expression evaluator mapping ratio names to stockData fields.
   Supports: <ratio> <op> <number> joined by AND / OR. Unknown lines are ignored. */
const RATIO_FIELD = {
  'market capitalization': c => (c.price * 1000) / 1000, // synthetic Cr proxy
  'price to earning': c => c.pe,
  'return on equity': c => c.roe,
  'return on capital employed': c => c.roce,
  'return on assets': c => c.roce * 0.8,
  'sales growth': c => c.growth,
  'profit growth': c => c.growth * 0.9,
  'debt to equity': c => c.debt == null ? 0 : c.debt,
  'opm': c => c.margin,
  'current price': c => c.price,
  'eps': c => Math.round(c.price / c.pe),
  'dividend yield': c => Math.max(0, 4 - c.pe / 12),
  'rsi': c => c.rsi,
  'return over 3months': c => c.change * 6,
  'return over 6months': c => c.change * 11
};

function runScreen(query) {
  const lines = String(query || '').split(/\n|\bAND\b/i).map(s => s.trim()).filter(Boolean);
  const conds = [];
  for (const line of lines) {
    const m = line.replace(/\bOR\b/ig, '').match(/^(.+?)\s*([<>])\s*([\d.]+)$/);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const fn = RATIO_FIELD[key];
    if (!fn) continue;
    conds.push({ fn, op: m[2], val: Number(m[3]) });
  }
  if (!conds.length) return stockData.slice();
  return stockData.filter(c => conds.every(k => {
    const v = k.fn(c);
    return k.op === '>' ? v > k.val : v < k.val;
  }));
}

/* ------------------------------------------------------------------ *
 * 2. ANALYSIS WORKSPACE (Chartink-style)
 * ------------------------------------------------------------------ */

function analysisPage(tab) {
  // Chat now lives in the floating assistant; Scan engine and Charts were folded into Dashboard.
  tab = ['dashboard', 'atlas', 'screens', 'compare'].includes(tab) ? tab : 'dashboard';
  const nav = [
    ['Dashboard', 'analysis', 'dashboard'],
    ['Atlas', 'analysis/atlas', 'atlas'],
    ['Stock screens', 'analysis/screens', 'screens'],
    ['Compare', 'analysis/compare', 'compare']
  ].map(([label, route, key]) => link(label, route, tab === key ? 'active' : '')).join('');
  let body;
  if (tab === 'atlas') body = analysisAtlas();
  else if (tab === 'screens') body = analysisStockScreens();
  else if (tab === 'compare') body = analysisCompare();
  else body = analysisDashboard();
  return title('Analysis', 'Performance, market breadth, sector heatmaps, screens and comparison in one research desk.', '', 'ANALYSIS DESK') +
    `<nav class="subtabs scroll" aria-label="Analysis sections">${nav}</nav>` + body;
}

/* Sub-tab: full Screener.in-style stock screens (directory + ratio-gallery builder). */
function analysisStockScreens() {
  const view = state.screens?.view === 'directory' ? 'directory' : state.screens?.view === 'saved' ? 'saved' : 'builder';
  const seg = [['Builder', 'builder'], ['Popular screens', 'directory'], ['My screens', 'saved']]
    .map(([label, key]) => action(label, 'screen-view', 'seg-btn' + (view === key ? ' active' : ''), `data-view="${key}"`)).join('');
  let body;
  if (view === 'directory') body = screenDirectory();
  else if (view === 'saved') body = savedScreens();
  else body = screenBuilder();
  return `<div class="row between wrap" style="margin-bottom:16px"><div class="seg" role="group" aria-label="Screen view">${seg}</div>${action('Create new screen', 'screen-view', 'btn primary', 'data-view="builder"')}</div>` + body;
}


/* Sub-tab: comparison, reusing the app's own comparison workspace. */
function analysisCompare() {
  if (typeof compare === 'function') return compare();
  return section('Compare', 'Side-by-side comparison.', toolCompare());
}

const SECTORS = [
  ['Technology', 2.4, 72, 1.8], ['Financials', 1.1, 61, 1.3], ['Healthcare', 0.8, 58, 1.1],
  ['Industrials', 1.6, 66, 1.4], ['Energy', -0.4, 44, 0.9], ['Consumer', 0.3, 52, 1.0],
  ['Automobiles', 2.0, 69, 1.6], ['Metals', -1.2, 38, 0.7]
];

function analysisDashboard() {
  const symbol = stockData.some(c => c.id === state.analysisSymbol) ? state.analysisSymbol : ranked()[0].id, c = stock(symbol);
  const advancing = SECTORS.filter(s => s[1] > 0).length;
  const advTotal = 1284, decTotal = 892;
  const sectorBars = [...SECTORS].sort((x, y) => y[1] - x[1]).map(([name, chg]) => ({ label: esc(name), value: chg }));
  const breadth = [{ label: 'Advancing', value: advTotal, display: advTotal.toLocaleString('en-IN'), color: 'var(--positive)' }, { label: 'Declining', value: decTotal, display: decTotal.toLocaleString('en-IN'), color: 'var(--negative)' }];
  return `<div class="stack analysis-dashboard">
    <div class="grid four analysis-stats">
      ${analysisMetric('Advancing sectors', advancing + ' / ' + SECTORS.length, 'Breadth positive', 'pulse')}
      ${analysisMetric('Advance / decline', (advTotal / decTotal).toFixed(2) + '×', advTotal.toLocaleString('en-IN') + ' up · ' + decTotal.toLocaleString('en-IN') + ' down', 'chart')}
      ${analysisMetric('Market regime', marketRegime().label, `AI sizing ${Math.round(marketRegime().sizing * 100)}% of normal`, 'shield')}
      ${analysisMetric('India VIX', String(marketFixture.vix), `Nifty 50 ${pct(marketFixture.niftyChange)}`, 'portfolio')}
    </div>
    <div class="grid equal">
      ${section('Sector performance today', 'Percentage change by sector', barList(sectorBars, { signed: true, format: v => pct(v) }))}
      ${section('Market breadth', 'Advancing versus declining stocks', donutChart(breadth, (advTotal / (advTotal + decTotal) * 100).toFixed(1) + '%', 'advancing', 'Market breadth') + lines([['Above 20 EMA', '58%'], ['Above 50 SMA', '63%'], ['Above 200 SMA', '71%']]))}
    </div>
    <div class="grid equal">
      ${section('Model score leaders', `${strategy().name} · top six of ${stockData.length}`, riskScoreBarChart())}
      ${section('Index pulse & global cues', 'Benchmark momentum and inter-market context.', lines([
        ['Nifty 50', '22,936.75 · ' + pct(1.05)], ['Bank Nifty', '54,909.65 · ' + pct(1.18)], ['Nifty Midcap', pct(0.9)], ['Dow Jones', pct(0.4)], ['USD / INR', '83.12'], ['Brent crude', '$78.4']]))}
    </div>
    ${section('Drawdown history', 'Falls from earlier equity highs', riskDrawdownChart(), rangeControls())}
    <div class="card analysis-symbol-row"><label class="label" for="analysis-symbol-select">Price chart symbol</label><select class="field" id="analysis-symbol-select">${ranked().map(s => `<option value="${s.id}" ${s.id === c.id ? 'selected' : ''}>${esc(s.name)} · ${s.id}</option>`).join('')}</select>${link('Open research', `company/${c.id}/chart`, 'btn small')}</div>
    ${priceChart(c)}
  </div>`;
}

function analysisAtlas() {
  return section('Sector & industry heatmap', 'Market breadth by sector — green gains, red fades.',
    `<div class="heatmap">${SECTORS.map(([name, chg, breadth]) =>
      `<div class="heat-cell ${chg >= 0 ? 'up' : 'down'}" style="--w:${Math.min(100, breadth)}%">
        <strong>${esc(name)}</strong><span>${pct(chg)}</span><small>${breadth}% adv</small></div>`).join('')}</div>`) +
    `<div class="grid three">
      ${section('Market breadth', 'Advance / decline participation.', lines([
        ['Advance / decline', '1,284 / 892'], ['Above 20 EMA', '58%'], ['Above 50 SMA', '63%'], ['Above 200 SMA', '71%']]))}
      ${section('Global cues', 'Inter-market context.', lines([
        ['Dow Jones', pct(0.4)], ['USD / INR', '83.12'], ['Brent crude', '$78.4'], ['Gold', '₹72,140']]))}
      ${section('Index pulse', 'Benchmark momentum.', lines([
        ['Nifty 50', '22,936.75 ' + pct(1.05)], ['Bank Nifty', '54,909.65 ' + pct(1.18)], ['Nifty Midcap', pct(0.9)]]))}
    </div>`;
}


function miniSparkline() {
  const pts = Array.from({ length: 48 }, (_, i) => 60 + Math.sin(i / 3) * 18 + Math.sin(i / 7) * 10 + i * 0.4);
  const max = Math.max(...pts), min = Math.min(...pts);
  const d = pts.map((p, i) => `${(i / (pts.length - 1) * 100).toFixed(2)},${(100 - (p - min) / (max - min) * 92 - 4).toFixed(2)}`).join(' ');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="spark" aria-hidden="true"><polyline points="${d}" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;
}

function analysisMetric(label, value, sub, ico) {
  return `<div class="metric-card"><div class="feature-icon">${icon(ico)}</div><div class="metric-value">${esc(value)}</div><div class="metric-label">${esc(label)}</div><div class="metric-sub">${esc(sub)}</div></div>`;
}

/* ------------------------------------------------------------------ *
 * 3. SECTORS
 * ------------------------------------------------------------------ */

function sectorsPage(tab) {
  tab = SECTOR_TABS.some(([key]) => key === tab) ? tab : 'overview';
  const nav = SECTOR_TABS.map(([key, label, route]) => `<a class="${tab === key ? 'active' : ''}" href="#/${route}" ${tab === key ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  const body = { momentum: sectorMomentum, breadth: sectorBreadth, thematic: sectorThematic, volume: sectorVolume, seasonality: sectorSeasonality, rrg: sectorRRG, lens: sectorLens }[tab] || sectorOverview;
  return title('Sectors', `How each part of the market is moving · quotes ${asOf}`, '', 'SECTOR MAPS') +
    `<nav class="sector-tabs" aria-label="Sector sections">${nav}</nav><div class="stack">${body()}</div>`;
}
const SECTOR_TABS = [['overview', 'Overview', 'sectors'], ['momentum', 'Momentum', 'sectors/momentum'], ['breadth', 'Breadth', 'sectors/breadth'], ['thematic', 'Themes', 'sectors/thematic'], ['volume', 'Volume', 'sectors/volume'], ['seasonality', 'Seasonality', 'sectors/seasonality'], ['rrg', 'Rotation', 'sectors/rrg'], ['lens', 'Stocks by sector', 'sectors/lens']];

/* One derived row per sector so every tab shows the same numbers. */
function sectorRows() {
  const totalVol = SECTORS.reduce((sum, r) => sum + r[3], 0);
  return SECTORS.map(([name, change, breadth, rvol]) => {
    const momentum = Math.max(0, Math.min(100, Math.round(50 + change * 10)));
    const rsRatio = 100 + change * 1.5, rsMomentum = 100 + (breadth - 55) / 4;
    const quadrant = rsRatio >= 100 ? (rsMomentum >= 100 ? 'Leading' : 'Weakening') : (rsMomentum >= 100 ? 'Improving' : 'Lagging');
    const signal = change >= 1.5 && breadth >= 60 ? 'Strong' : change > 0 ? 'Positive' : change > -1 ? 'Weak' : 'Very weak';
    return { name, change, breadth, rvol, momentum, rsRatio, rsMomentum, quadrant, signal, share: rvol / totalVol * 100, turnover: rvol * 4200 };
  }).sort((a, b) => b.change - a.change);
}
const signalTone = s => s === 'Strong' || s === 'Positive' ? 'green' : s === 'Weak' ? 'amber' : 'red';
const quadrantTone = q => ({ Leading: 'green', Improving: 'amber', Weakening: 'amber', Lagging: 'red' })[q];
function sectorHow(text) { return `<p class="sector-how">${icon('info')}<span>${text}</span></p>`; }
function shareBar(value, scale, label) { return `<span class="mini-bar" role="img" aria-label="${label}"><i style="width:${Math.max(0, Math.min(100, value / scale * 100)).toFixed(1)}%"></i></span><b>${value.toFixed(value % 1 ? 1 : 0)}%</b>`; }

function sectorOverview() {
  const rows = sectorRows(), up = rows.filter(r => r.change > 0).length, avgBreadth = Math.round(rows.reduce((sum, r) => sum + r.breadth, 0) / rows.length);
  return `<div class="grid four">${metric('Sectors rising', `${up} of ${rows.length}`, `${rows.length - up} falling today`, 'pulse')}${metric('Strongest sector', esc(rows[0].name), `${pct(rows[0].change)} today`, 'arrow')}${metric('Weakest sector', esc(rows.at(-1).name), `${pct(rows.at(-1).change)} today`, 'chart')}${metric('Average breadth', avgBreadth + '%', 'of stocks rising in a sector', 'layers')}</div>
    ${section('Sector scoreboard', 'Every sector, ranked by today’s change.', sectorHow('<b>Today</b> is the price change. <b>Breadth</b> is the share of the sector’s stocks that are rising. <b>Rel. volume</b> is today’s volume ÷ the 20-day average (above 1.0× is busier than usual). <b>Momentum</b> is a 0–100 score; 60 or more is strong.') +
      `<div class="sector-table">${table(['#', 'Sector', 'Today', 'Breadth', 'Rel. volume', 'Momentum', 'Signal'], rows.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${esc(r.name)}</strong></td><td class="${toneClass(r.change)}">${pct(r.change)}</td><td class="bar-cell">${shareBar(r.breadth, 100, `${r.breadth}% of stocks rising`)}</td><td>${r.rvol.toFixed(1)}×</td><td>${r.momentum} / 100</td><td>${badge(r.signal, signalTone(r.signal))}</td></tr>`))}</div>`, '', 'flush')}`;
}

function sectorMomentum() {
  const rows = [...sectorRows()].sort((a, b) => b.momentum - a.momentum), band = m => m >= 60 ? 'strong' : m >= 40 ? 'neutral' : 'weak';
  return section('Momentum ranking', 'Relative momentum for each sector, strongest first.', sectorHow('Score from 0 to 100 based on price change. <b>60 or more</b> is strong, <b>40–59</b> neutral, <b>below 40</b> weak. The marker on each bar shows the 60 line.') +
    `<div class="momentum-list"><div class="momentum-row head"><span>Sector</span><span>Momentum</span><span class="num">Score</span><span class="num">Today</span></div>${rows.map(r => `<div class="momentum-row"><span class="momentum-name">${esc(r.name)}</span><span class="momentum-track" role="img" aria-label="${esc(r.name)} momentum ${r.momentum} of 100"><i class="${band(r.momentum)}" style="width:${r.momentum}%"></i><em></em></span><span class="num"><strong>${r.momentum}</strong></span><span class="num ${toneClass(r.change)}">${pct(r.change)}</span></div>`).join('')}</div>`);
}

function sectorBreadth() {
  const rows = [...sectorRows()].sort((a, b) => b.breadth - a.breadth);
  return `<div class="grid three">${metric('Net advancers', '+392', '1,284 rising − 892 falling', 'pulse')}${metric('New 52-week highs', '46', 'NSE cash market', 'arrow')}${metric('New 52-week lows', '12', 'NSE cash market', 'chart')}</div>` +
    section('Sector breadth', 'Share of stocks rising and falling in each sector, broadest first.', sectorHow('Green is the share of stocks rising, red the share falling. Above <b>60%</b> rising means broad participation; below <b>45%</b> means few stocks are joining the move.') +
    `<div class="breadth-list aligned"><div class="breadth-row head"><span>Sector</span><span>Rising vs falling</span><span class="num">Rising</span><span class="num">Falling</span></div>${rows.map(r => `<div class="breadth-row"><span class="breadth-name">${esc(r.name)}</span><span class="breadth-bar" role="img" aria-label="${r.breadth}% rising, ${100 - r.breadth}% falling"><span class="adv" style="width:${r.breadth}%"></span><span class="dec" style="width:${100 - r.breadth}%"></span></span><span class="num positive">${r.breadth}%</span><span class="num negative">${100 - r.breadth}%</span></div>`).join('')}</div>`);
}

const THEMES = [['EV & Mobility', 2.1], ['Defence', 1.7], ['Capex & Infrastructure', 1.5], ['Renewables', 1.2], ['Digital & SaaS', 0.9], ['Rural consumption', -0.3]];
function sectorThematic() {
  return section('Thematic rotation', 'Investment themes ranked by 1-month return.', sectorHow('<b>Leading</b>: 1-month return of +4% or more. <b>Improving</b>: 0% to +4%. <b>Fading</b>: negative.') +
    `<div class="sector-table">${table(['#', 'Theme', 'Status', '1 month', '3 months'], THEMES.map(([n, c], i) => { const m1 = c * 4, m3 = c * 9, st = m1 >= 4 ? 'Leading' : m1 >= 0 ? 'Improving' : 'Fading'; return `<tr><td>${i + 1}</td><td><strong>${esc(n)}</strong></td><td>${badge(st, st === 'Leading' ? 'green' : st === 'Improving' ? 'amber' : 'red')}</td><td class="${toneClass(m1)}">${pct(m1)}</td><td class="${toneClass(m3)}">${pct(m3)}</td></tr>`; }))}</div>`, '', 'flush');
}

function sectorVolume() {
  const rows = [...sectorRows()].sort((a, b) => b.share - a.share), total = rows.reduce((sum, r) => sum + r.turnover, 0);
  return section('Volume pulse', 'Where today’s trading money is going, largest first.', sectorHow('<b>Share of turnover</b> is the sector’s turnover ÷ total turnover. <b>vs 20-day average</b> shows how much busier (+) or quieter (−) today is than usual.') +
    `<div class="sector-table">${table(['Sector', 'Turnover (₹ Cr)', 'Share of turnover', 'vs 20-day average'], rows.map(r => `<tr><td><strong>${esc(r.name)}</strong></td><td>${Math.round(r.turnover).toLocaleString('en-IN')}</td><td class="bar-cell">${shareBar(Number(r.share.toFixed(1)), rows[0].share, `${r.share.toFixed(1)}% of turnover`)}</td><td class="${toneClass(r.rvol - 1)}">${pct((r.rvol - 1) * 100)}</td></tr>`).concat(`<tr class="table-total"><td><strong>Total</strong></td><td><strong>${Math.round(total).toLocaleString('en-IN')}</strong></td><td><strong>100%</strong></td><td></td></tr>`))}</div>`, '', 'flush');
}

function sectorSeasonality() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], now = new Date().getMonth();
  const rows = SECTORS.map(([n], si) => `<tr><th scope="row">${esc(n)}</th>${months.map((m, mi) => { const v = Math.sin((si + mi) * 1.3) * 4; return `<td class="season-val ${v >= 0 ? 'up' : 'down'}${mi === now ? ' now' : ''}" style="--i:${Math.min(1, Math.abs(v) / 4).toFixed(2)}" title="${esc(n)} · ${m}: ${pct(v)}">${(v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1)}</td>`; }).join('')}</tr>`).join('');
  return section('Seasonality map', 'Typical return for each sector in each calendar month.', sectorHow('Each cell is the average monthly return in %. Green months usually rise, red months usually fall; darker means a bigger move. The current month is outlined. Illustrative values until the history feed is connected — not a forecast.') +
    `<div class="table-wrap"><table class="season-table"><thead><tr><th scope="col">Sector</th>${months.map((m, mi) => `<th scope="col" class="${mi === now ? 'now' : ''}">${m}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`);
}

function sectorRRG() {
  const rows = sectorRows(), order = { Leading: 0, Weakening: 1, Lagging: 2, Improving: 3 };
  const dot = r => `<span class="rrg-dot ${quadrantTone(r.quadrant)}" style="left:${Math.max(6, Math.min(94, 50 + (r.rsRatio - 100) * 10)).toFixed(1)}%;top:${Math.max(6, Math.min(94, 50 - (r.rsMomentum - 100) * 8)).toFixed(1)}%" title="${esc(r.name)} · ${r.quadrant}"><em>${esc(r.name)}</em></span>`;
  return section('Relative rotation graph', 'Each sector’s strength and momentum against the Nifty 50.', sectorHow('Right of centre = stronger than the Nifty 50. Above centre = gaining strength. Sectors usually rotate clockwise: <b>Improving → Leading → Weakening → Lagging</b>.') +
    `<div class="rrg-layout"><div class="rrg"><div class="rrg-plane"><span class="rrg-axis-x"></span><span class="rrg-axis-y"></span><span class="rrg-label tl">Improving</span><span class="rrg-label tr">Leading</span><span class="rrg-label bl">Lagging</span><span class="rrg-label br">Weakening</span>${rows.map(dot).join('')}</div><div class="rrg-axes"><span>← Weaker than Nifty 50</span><span>Stronger →</span></div></div>
    <div class="sector-table">${table(['Sector', 'Quadrant', 'Strength', 'Momentum'], [...rows].sort((a, b) => order[a.quadrant] - order[b.quadrant] || b.rsRatio - a.rsRatio).map(r => `<tr><td><strong>${esc(r.name)}</strong></td><td>${badge(r.quadrant, quadrantTone(r.quadrant))}</td><td>${r.rsRatio.toFixed(1)}</td><td>${r.rsMomentum.toFixed(1)}</td></tr>`))}<p class="field-help">100 = in line with the Nifty 50.</p></div></div>`);
}

function sectorLens() {
  const groups = sectorRows().map(r => ({ r, list: stockData.filter(c => c.sector === r.name).sort((a, b) => scores(b).total - scores(a).total) })).filter(g => g.list.length);
  return section('Stocks by sector', `Companies in each sector, ranked by ${strategy().name} model score.`, sectorHow('The number on each company is its model score out of 100 for the selected strategy. Select a company to open its research.') +
    `<div class="lens-table">${groups.map(g => `<div class="lens-line"><div class="lens-sector"><strong>${esc(g.r.name)}</strong><span class="${toneClass(g.r.change)}">${pct(g.r.change)} today</span></div><div class="lens-row">${g.list.slice(0, 4).map(c => `<a class="lens-chip" href="#/company/${c.id}/overview">${esc(c.name)}<small>${scores(c).total}</small></a>`).join('')}</div><span class="lens-count">${g.list.length} ${g.list.length === 1 ? 'company' : 'companies'}</span></div>`).join('')}</div>`);
}

/* ------------------------------------------------------------------ *
 * 4. TOOLS
 * ------------------------------------------------------------------ */

function toolsPage(tab) {
  tab = tab || 'hub';
  const nav = [
    ['All tools', 'tools', 'hub'],
    ['Strategy Backtest', 'tools/backtest', 'backtest'], ['Indicator Edge', 'tools/indicators', 'indicators'],
    ['Position Sizing', 'tools/position-sizing', 'position-sizing'], ['Trade Analyzer', 'tools/trade-analyzer', 'trade-analyzer'],
    ['Portfolio X-ray', 'tools/portfolio-xray', 'portfolio-xray'],
    ['Calculators', 'tools/calculators', 'calculators']
  ].map(([label, route, key]) => link(label, route, tab === key ? 'active' : '')).join('');
  let body;
  switch (tab) {
    case 'scanner': setTimeout(() => { location.hash = '#/analysis/screens'; }, 0); body = title('Opening Analysis → Stock screens…', 'Screening is part of the Analysis desk.', link('Go to Stock screens', 'analysis/screens', 'btn primary'), 'ANALYSIS DESK'); break;
    case 'backtest': body = toolBacktest(); break;
    case 'indicators': body = toolIndicatorEdge(); break;
    case 'position-sizing': body = toolPositionSizing(); break;
    case 'trade-analyzer': body = toolTradeAnalyzer(); break;
    case 'compare-stocks': setTimeout(() => { location.hash = '#/analysis/compare'; }, 0); body = title('Opening Analysis → Compare…', 'Comparison is part of the Analysis desk.', link('Go to Compare', 'analysis/compare', 'btn primary'), 'ANALYSIS DESK'); break;
    case 'portfolio-xray': body = toolPortfolioXray(); break;
    case 'calculators': body = toolCalculators(); break;
    case 'chat': state.chatOpen = true; body = toolsHub(); break;
    default: body = toolsHub();
  }
  return title('Tools', 'Backtesting, risk utilities and quantitative calculators.', '', 'RESEARCH UTILITIES') +
    `<nav class="subtabs scroll" aria-label="Tool sections">${nav}</nav>` + body;
}

function toolsHub() {
  const cards = [
    ['Strategy Backtest', 'tools/backtest', 'history', 'Rule-based historical testing for your setups.'],
    ['Indicator Edge Explorer', 'tools/indicators', 'pulse', 'Win-rate and edge analysis for indicators.'],
    ['Position Sizing', 'tools/position-sizing', 'shield', 'Risk-based sizing from capital and stop-loss.'],
    ['Trade Analyzer', 'tools/trade-analyzer', 'chart', 'Performance metrics and execution review.'],
    ['Portfolio X-ray', 'tools/portfolio-xray', 'portfolio', 'Risk, sector exposure and overlap analysis.'],
    ['Calculators', 'tools/calculators', 'wallet', 'SIP, SWP, CAGR, EMI and more.']
  ];
  return `<div class="grid three">${cards.map(([a, r, i, d]) =>
    `<a class="card tool-card" href="#/${r}"><div class="feature-icon">${icon(i)}</div><h3>${esc(a)}</h3><p>${esc(d)}</p><span class="story-link">Open ${icon('arrow')}</span></a>`).join('')}</div>
    <p class="field-help" style="margin-top:16px">Looking for the stock screener or stock comparison? They live in the <a href="#/analysis">Analysis desk</a>. The assistant chat is the Chat button at the bottom right.</p>`;
}

function toolBacktest() {
  return section('Strategy backtest', 'Evaluate a rule-based setup against historical fixtures.',
    `<form id="tool-backtest" class="tool-form"><div class="grid two">
      <label class="inline-field"><span>Strategy</span><select class="field" name="strategy">${Object.entries(strategyList).map(([k, s]) => `<option value="${k}"${k === state.strategy ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      <label class="inline-field"><span>Period</span><select class="field" name="period"><option>1 year</option><option>3 years</option><option>5 years</option></select></label>
      <label class="inline-field"><span>Entry rule</span><input class="field" name="entry" value="Breakout + volume > 2x"></label>
      <label class="inline-field"><span>Exit rule</span><input class="field" name="exit" value="Close below 20 EMA"></label>
    </div><button class="btn primary" type="submit">Run backtest</button></form>
    <div id="backtest-result" class="grid four" style="margin-top:20px">
      ${analysisMetric('Win rate', '58%', 'Fixture', 'pulse')}${analysisMetric('Avg gain', '+6.4%', 'Per trade', 'chart')}
      ${analysisMetric('Max drawdown', '-9.2%', 'Fixture', 'shield')}${analysisMetric('Trades', '142', 'In period', 'history')}
    </div>
    <p class="field-help">Results are deterministic design fixtures, not measured strategy performance.</p>`);
}

function toolIndicatorEdge() {
  return section('Indicator edge explorer', 'Statistical edge and win-rate for a chosen indicator.',
    table(['Indicator', 'Signal', 'Win rate', 'Avg hold', 'Edge'], [
      ['RSI(14)', 'Cross above 30', '54%', '6d', '+2.1%'], ['EMA 20/50', 'Golden cross', '61%', '14d', '+3.4%'],
      ['MACD', 'Signal cross up', '57%', '9d', '+2.8%'], ['Volume', '2× surge', '52%', '4d', '+1.6%']
    ].map(r => `<tr>${r.map((c, i) => `<td class="${i === 4 ? 'positive' : ''}">${esc(c)}</td>`).join('')}</tr>`)), '', 'flush');
}

function toolPositionSizing() {
  return section('Position sizing', 'Size a position from capital at risk and stop distance.',
    `<form id="tool-sizing" class="tool-form"><div class="grid two">
      <label class="inline-field"><span>Account capital (₹)</span><input class="field" name="capital" type="number" value="500000"></label>
      <label class="inline-field"><span>Risk per trade (%)</span><input class="field" name="risk" type="number" value="1" step="0.1"></label>
      <label class="inline-field"><span>Entry price (₹)</span><input class="field" name="entry" type="number" value="1000"></label>
      <label class="inline-field"><span>Stop-loss price (₹)</span><input class="field" name="stop" type="number" value="960"></label>
    </div></form>
    <div id="sizing-result" class="grid three" style="margin-top:20px">
      ${analysisMetric('Risk amount', '₹5,000', '1% of capital', 'shield')}
      ${analysisMetric('Shares', '125', 'Whole shares', 'portfolio')}
      ${analysisMetric('Position value', '₹1,25,000', 'At entry', 'wallet')}
    </div>
    <p class="field-help">Type values above and the sizing updates live.</p>`);
}

function toolTradeAnalyzer() {
  return section('Trade analyzer', 'Review execution quality and performance metrics.',
    `<div class="grid four">
      ${analysisMetric('Total trades', '48', 'This period', 'history')}${analysisMetric('Win rate', '56%', '27 wins', 'pulse')}
      ${analysisMetric('Profit factor', '1.8', 'Gross', 'chart')}${analysisMetric('Avg R multiple', '1.4R', 'Per trade', 'shield')}
    </div>` +
    section('Add a trade', '', `<form id="tool-trade" class="tool-form row wrap">
      <input class="field" placeholder="Symbol" aria-label="Symbol"><input class="field" type="number" placeholder="Entry" aria-label="Entry">
      <input class="field" type="number" placeholder="Exit" aria-label="Exit"><input class="field" type="number" placeholder="Qty" aria-label="Quantity">
      <button class="btn primary" type="submit">Log trade</button></form>`, 'flush'));
}

function toolCompare() {
  const list = stockData.slice(0, 4);
  const rows = [['CMP', c => fixed(c.price)], ['P/E', c => c.pe], ['ROE %', c => c.roe], ['ROCE %', c => c.roce], ['Sales growth %', c => c.growth], ['Debt/Eq', c => c.debt == null ? '—' : c.debt], ['Margin %', c => c.margin], ['Model', c => scores(c).total + '/100']];
  return table(['Metric', ...list.map(c => c.name)], rows.map(([label, fn]) =>
    `<tr><td><strong>${esc(label)}</strong></td>${list.map(c => `<td>${fn(c)}</td>`).join('')}</tr>`));
}

function toolPortfolioXray() {
  const sectors = {};
  (typeof holdings === 'function' ? holdings() : []).forEach(h => { sectors[h.stock.sector] = (sectors[h.stock.sector] || 0) + h.qty * h.stock.price; });
  const total = Object.values(sectors).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(sectors).sort((a, b) => b[1] - a[1]);
  return section('Portfolio X-ray', 'Sector exposure, concentration and overlap for the current account.',
    rows.length ? `<div class="breadth-list">${rows.map(([s, v]) =>
      `<div class="breadth-row"><div class="breadth-name">${esc(s)}</div><div class="breadth-bar"><span class="adv" style="width:${(v / total * 100).toFixed(1)}%"></span></div><div class="breadth-nums">${(v / total * 100).toFixed(1)}%</div></div>`).join('')}</div>`
      : emptyBlock('No holdings to analyse', 'Holdings appear here once positions exist for the account.', ''), '', 'flush');
}

const CALCULATORS = [
  ['SIP Calculator', 'sip'], ['Step-up SIP', 'stepsip'], ['Lumpsum', 'lumpsum'], ['SWP', 'swp'],
  ['CAGR', 'cagr'], ['Compound Interest', 'ci'], ['FD', 'fd'], ['RD', 'rd'], ['PPF', 'ppf'],
  ['EMI', 'emi'], ['Retirement', 'retire'], ['Net Worth', 'networth'], ['Inflation', 'inflation'],
  ['Dividend', 'dividend'], ['Brokerage', 'brokerage']
];

function toolCalculators() {
  return `<div class="grid two">
    ${section('SIP calculator', 'Monthly investment future value.',
      `<form id="calc-sip" class="tool-form"><div class="grid two">
        <label class="inline-field"><span>Monthly amount (₹)</span><input class="field" name="amount" type="number" value="10000"></label>
        <label class="inline-field"><span>Expected return (% p.a.)</span><input class="field" name="rate" type="number" value="12" step="0.1"></label>
        <label class="inline-field"><span>Years</span><input class="field" name="years" type="number" value="10"></label>
      </div></form>
      <div id="sip-result" class="grid two" style="margin-top:18px">
        ${analysisMetric('Invested', '₹12,00,000', 'Total', 'wallet')}${analysisMetric('Future value', '₹23,23,391', 'At maturity', 'chart')}</div>`)}
    ${section('All calculators', 'The full calculator suite.',
      `<div class="calc-grid">${CALCULATORS.map(([n]) => `<button type="button" class="calc-chip" data-action="calc-open" data-calc="${esc(n)}">${esc(n)}</button>`).join('')}</div>`)}
  </div>`;
}

/* ------------------------------------------------------------------ *
 * 5. ANALYSIS CHAT (client-side calculation assistant)
 * ------------------------------------------------------------------ */

/* Floating assistant (bottom-right on every client page except Settings). */
const CHAT_SUGGESTIONS = ['Portfolio summary', 'Why did the AI do this?', 'What is the AI waiting to buy?', 'AI win rate vs Nifty', 'Market regime', 'How much cash can I use?', 'Risk status', 'CAGR 100000 to 180000 over 3 years'];
function chatWidget() {
  const open = !!state.chatOpen;
  state.chat = state.chat || [{ role: 'bot', text: 'Hi — ask me about your portfolio, cash, risk, or the stocks the AI is working on. I can also calculate CAGR, SIP, percentages, and position sizes.' }];
  return `<div class="chat-widget${open ? ' open' : ''}">${open ? `<section class="chat-panel" id="chat-panel" role="dialog" aria-label="InvestSight assistant">
      <header class="chat-panel-head"><span class="chat-avatar">${icon('pulse')}</span><div><strong>InvestSight assistant</strong><small>${esc(strategy().name)} workspace · answers stay on this device</small></div>${action(icon('close'), 'chat-toggle', 'btn icon-only small', 'aria-label="Close chat"')}</header>
      <div class="chat-pane" id="chat-pane" aria-live="polite">${state.chat.map(renderChatMsg).join('')}</div>
      <div class="chat-suggestions" role="group" aria-label="Suggested questions">${CHAT_SUGGESTIONS.map(s => `<button type="button" class="chat-chip" data-action="chat-suggest" data-text="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <form id="chat-form" class="chat-input"><input class="field" name="msg" id="chat-msg" placeholder="Ask or calculate…" autocomplete="off" aria-label="Chat message"><button class="btn primary icon-only" type="submit" aria-label="Send message">${icon('arrow')}</button></form>
    </section>` : ''}<button type="button" class="chat-fab" data-action="chat-toggle" aria-expanded="${open}" aria-controls="chat-panel" aria-label="${open ? 'Close assistant' : 'Open assistant chat'}">${icon(open ? 'close' : 'chat')}${open ? '' : '<span>Chat</span>'}</button></div>`;
}
function sendChat(text) {
  const q = String(text || '').trim();
  if (!q) return;
  state.chat = state.chat || [];
  state.chat.push({ role: 'user', text: q }, { role: 'bot', text: answerChat(q) });
  state.chat = state.chat.slice(-40);
  state.chatOpen = true;
  persist();
  const y = scrollY; render(); window.scrollTo(0, y);
  $('#chat-msg')?.focus?.({ preventScroll: true });
}

function renderChatMsg(m) {
  return `<div class="chat-msg ${m.role}">${m.role === 'bot' ? `<span class="chat-avatar">${icon('pulse')}</span>` : ''}<div class="chat-bubble">${esc(m.text)}</div></div>`;
}

/* Deterministic local assistant: calculations first, then questions about the active workspace. */
function answerChat(input) {
  const q = String(input || '').trim();
  const low = q.toLowerCase();
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  let m;
  // CAGR: "cagr 100000 to 180000 over 3 years"
  if ((m = low.match(/cagr\s+([\d.]+)\s*(?:to|->|→)\s*([\d.]+)\s*(?:over)?\s*([\d.]+)\s*year/))) {
    const [, a, b, y] = m;
    if (Number(a) <= 0 || Number(y) <= 0) return 'CAGR needs a starting value and a number of years above zero.';
    const cagr = (Math.pow(Number(b) / Number(a), 1 / Number(y)) - 1) * 100;
    return `CAGR from ${inr(a)} to ${inr(b)} over ${y} years = ${cagr.toFixed(2)}% per year.`;
  }
  // SIP: "sip 10000 12% 10 years"
  if ((m = low.match(/sip\s+([\d.]+)\D+([\d.]+)%?\D+([\d.]+)\s*year/))) {
    const [, amt, rate, yrs] = m, n = Number(yrs) * 12, i = Number(rate) / 100 / 12;
    const fv = i ? Number(amt) * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : Number(amt) * n;
    return `SIP of ${inr(amt)}/month at ${rate}% for ${yrs} years → future value ≈ ${inr(fv)} (invested ${inr(Number(amt) * n)}).`;
  }
  // position size: "position size 500000 1% 1000 960"
  if ((m = low.match(/position\s*siz\w*\s+([\d.]+)\D+([\d.]+)%?\D+([\d.]+)\D+([\d.]+)/))) {
    const [, cap, risk, entry, stop] = m, riskAmt = Number(cap) * Number(risk) / 100, per = Math.abs(Number(entry) - Number(stop));
    const shares = per ? Math.floor(riskAmt / per) : 0;
    return `Risk ${inr(riskAmt)} (${risk}% of ${inr(cap)}). Stop distance ${fixed(per)}. Buy ≈ ${shares} shares ≈ ${inr(shares * Number(entry))}.`;
  }
  // percentage: "15% of 2000"
  if ((m = low.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/))) {
    return `${m[1]}% of ${m[2]} = ${(Number(m[1]) / 100 * Number(m[2])).toLocaleString('en-IN')}.`;
  }
  // plain arithmetic (digits and operators only)
  if (/^[\d\s+\-*/().%]+$/.test(q)) {
    try {
      const safe = q.replace(/%/g, '/100');
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + safe + ')')();
      if (typeof val === 'number' && isFinite(val)) return `= ${Number(val.toFixed(4)).toLocaleString('en-IN')}`;
    } catch { /* ignore */ }
  }
  const a = account(), s = strategy().name;
  if (/kill|stop (the )?ai|halt/.test(low)) { const b = automationBlocked(); return b ? `${b}. The AI is not placing new orders. Open Risk & alerts to resume when you are ready.` : `The AI is running. Use the Kill switch in the top bar to stop every strategy instantly; it can also cancel pending orders and exit positions.`; }
  if (/why|reason|decision|explain/.test(low)) { const d = aiDecisions().filter(x => x.type !== 'guard').slice(0, 3); return d.length ? d.map(x => `${x.text} — ${x.why}`).join(' ') : 'No AI decisions yet for this strategy.'; }
  if (/market|regime|vix|volatil/.test(low)) { const r = marketRegime(); return `Market filter: ${r.label}. ${r.note}`; }
  if (/win rate|scorecard|performance|beat|nifty/.test(low)) { const c = aiScorecard(); return `${s}: win rate ${c.winRate.toFixed(0)}% over ${c.trades} closed trades, profit factor ${Number.isFinite(c.profitFactor) ? c.profitFactor.toFixed(2) : '—'}. ${c.range} return ${pct(c.aiReturn)} vs Nifty 50 ${pct(c.bench)}.`; }
  if (/wait|pending|going to buy|buy next|queued/.test(low)) {
    const w = stockActions().waiting;
    return w.length ? `${s}: the AI is waiting to enter ${w.map(x => `${x.stock.name} (${x.triggerLabel.toLowerCase()} ${fixed(x.trigger)}, ${x.qty} shares)`).join('; ')}.` : `${s}: every AI pick is already held, so nothing is waiting.`;
  }
  if (/exit|sold|closed/.test(low)) {
    const acts = stockActions();
    return `${s}: ${acts.exited.length} recent exits realized ${signedMoney(acts.realized)} before charges — ${acts.exited.map(x => `${x.stock.name} ${signedMoney(x.pnl)} (${x.reason.toLowerCase()})`).join('; ')}.`;
  }
  if (/cash|available|spend/.test(low)) return `${s}: ${inr(a.available)} is available to use. Total cash is ${inr(a.cash)}, of which ${inr(a.reserved)} is reserved for pending orders.`;
  if (/top|best|rank|strongest/.test(low)) { const c = ranked()[0]; return `${s}: ${c.name} ranks first at ${scores(c).total}/100. ${c.reason}`; }
  if (/risk|drawdown|concentrat|exposure/.test(low)) {
    const { largest, dd, dailyLoss } = riskSnapshot(), limit = strategyConfig().maxWeight;
    return `${s}: largest position is ${largest.stock.name} at ${largest.weight.toFixed(2)}% of equity (limit ${limit}%). Drawdown over ${state.range[state.strategy]} is ${dd.toFixed(2)}% (review limit 8%); loss from prior close is ${dailyLoss.toFixed(2)}%.`;
  }
  if (/profit|p&l|pnl|return|gain|loss/.test(low)) return `${s}: net P&L ${signedMoney(a.net)} (${pct(a.returnPct)} on ${inr(a.capital)} allocated) = realized ${signedMoney(a.realized)} + open ${signedMoney(a.unrealized)} − charges ${inr(a.charges)}.`;
  if (/portfolio|holding|summary|position|invest/.test(low)) return `${s}: account equity ${inr(a.equity)} — ${inr(a.invested)} invested across ${holdings().length} holdings and ${inr(a.cash)} cash. Net P&L ${signedMoney(a.net)} (${pct(a.returnPct)}).`;
  return 'Ask about your portfolio, cash, profit, risk, top-ranked stock, pending entries or exits — or calculate: "CAGR 100000 to 180000 over 3 years", "sip 10000 12% 10 years", "15% of 2000", or "position size 500000 1% 1000 960".';
}

/* ------------------------------------------------------------------ *
 * 6. PRICING + MORE
 * ------------------------------------------------------------------ */

const PRICING = [
  ['Starter', '₹0', 'Free forever', ['Public research', '3 strategy rankings', 'Basic screeners', 'Watchlist (10)'], false],
  ['Trader', '₹499', 'per month', ['Everything in Starter', 'Full screener + ratio gallery', 'All sector maps', 'Alerts & saved scans'], true],
  ['Professional', '₹1,299', 'per month', ['Everything in Trader', 'Strategy backtest', 'Analysis desk (Atlas/Charts)', 'Automated AI execution'], false],
  ['Institutional', 'Custom', 'contact us', ['Everything in Professional', 'Multi-seat access', 'Priority data feed', 'Dedicated support'], false]
];

function pricingTiers(heading, sub) {
  return section(heading || 'Pricing', sub || 'Choose a plan. Full access is free through 31 Dec 2026 — no payment details required.',
    `<div class="pricing-grid">${PRICING.map(([name, price, unit, feats, featured]) =>
      `<div class="pricing-card${featured ? ' featured' : ''}">${featured ? '<span class="pricing-flag">Most popular</span>' : ''}
        <h3>${esc(name)}</h3><div class="pricing-price">${esc(price)}<small>${esc(unit)}</small></div>
        <ul class="pricing-feats">${feats.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
        ${action(name === 'Institutional' ? 'Contact sales' : 'Choose ' + name, 'pricing-select', 'btn' + (featured ? ' primary' : ''), `data-plan="${esc(name)}"`)}</div>`).join('')}</div>
    <p class="field-help">Indicative pricing for layout only — final tiers and terms will be set before launch.</p>`);
}

function pricingPage() {
  return title('Pricing', 'Simple plans that scale with your research.', '', 'PLANS') + pricingTiers();
}

/* Resources panel shown inside Settings → More & resources. */
function resourcesPanel() {
  const cards = [
    ['App Tour', 'more/tour', 'play', 'A guided walkthrough of the workspace.'],
    ['Tutorials', 'more/tutorials', 'learn', 'Feature guides and how screeners work.'],
    ['Blog', 'more/blog', 'news', 'Market insights and strategy notes.'],
    ['Glossary', 'more/glossary', 'learn', 'VCP, RS, EMA, RRG and other terms.'],
    ['How we scan', 'more/how-we-scan', 'search', 'Methodology and rule execution.'],
    ["What's new", 'more/whats-new', 'pulse', 'Recent product changes.']
  ];
  return `<p>Product tour, learning and company information.</p>
    <div class="grid three" style="margin-top:14px">${cards.map(([a, r, i, d]) =>
      `<a class="card tool-card" href="#/${r}"><div class="feature-icon">${icon(i)}</div><h3>${esc(a)}</h3><p>${esc(d)}</p><span class="story-link">Open ${icon('arrow')}</span></a>`).join('')}</div>
    <div class="row wrap" style="margin-top:18px">${link('About us', 'about', 'btn')}${link('Contact', 'contact', 'btn')}</div>`;
}

function morePage(tab) {
  tab = tab || 'hub';
  const nav = [
    ['Overview', 'more', 'hub'], ['App Tour', 'more/tour', 'tour'], ['Tutorials', 'more/tutorials', 'tutorials'],
    ['Blog', 'more/blog', 'blog'], ['Glossary', 'more/glossary', 'glossary'], ['How we scan', 'more/how-we-scan', 'how-we-scan'],
    ["What's new", 'more/whats-new', 'whats-new'], ['About us', 'about', 'about'], ['Contact', 'contact', 'contact'], ['Back to Settings', 'settings/resources', 'back']
  ].map(([label, route, key]) => link(label, route, tab === key ? 'active' : '')).join('');
  let body;
  switch (tab) {
    case 'tour': body = section('App tour', 'A guided walkthrough of the workspace.', lines([['1. Choose a strategy', 'Long-term, Swing or Intraday in the header.'], ['2. Explore & screen', 'Explore stocks, then screen in Analysis → Stock screens.'], ['3. Analyse', 'Use the Analysis desk for scans, charts and comparison.'], ['4. Execute', 'Review the agreement, then run automated execution.']])); break;
    case 'tutorials': body = moreList('Tutorials', [['Scanners overview', 'How screener logic and formulas work.'], ['Indicators & patterns', 'The indicators and chart patterns tracked.'], ['Swing vs day', 'Choosing a trading timeframe.']]); break;
    case 'blog': body = moreList('Blog', [['Reading market breadth', 'What advance/decline tells you.'], ['Position sizing basics', 'Risk per trade and stop distance.'], ['Sector rotation 101', 'Using RRG in real markets.']]); break;
    case 'glossary': body = moreGlossary(); break;
    case 'how-we-scan': body = section('How we scan', 'Methodology and rule execution.', `<p>Scans apply explicit, deterministic rules to a cleaned universe. Each rule — such as a moving-average cross, a volume surge, or a valuation threshold — is evaluated per stock and combined with AND / OR logic. Results are research signals, not recommendations.</p>`); break;
    case 'whats-new': body = moreList("What's new", [['Stock screens + ratio gallery', 'Build queries from financial ratios.'], ['Analysis desk', 'Atlas, Screens, Charts and Dashboard.'], ['Automated AI execution', 'One-button execution for all three strategies.'], ['Sector maps', 'Breadth, momentum, RRG and more.']]); break;
    default: body = `<div class="grid three">${[['App Tour', 'more/tour', 'play'], ['Tutorials', 'more/tutorials', 'learn'], ['Blog', 'more/blog', 'news'], ['Glossary', 'more/glossary', 'learn'], ['How we scan', 'more/how-we-scan', 'search'], ["What's new", 'more/whats-new', 'pulse']].map(([a, r, i]) =>
      `<a class="card tool-card" href="#/${r}"><div class="feature-icon">${icon(i)}</div><h3>${esc(a)}</h3><span class="story-link">Open ${icon('arrow')}</span></a>`).join('')}</div>`;
  }
  return title('More', 'Product tour, learning and company information.', '', 'LEARN & COMPANY') +
    `<nav class="subtabs scroll" aria-label="More sections">${nav}</nav>` + body;
}

function moreList(heading, items) {
  return section(heading, '', `<div class="more-list">${items.map(([a, b]) =>
    `<div class="more-item"><strong>${esc(a)}</strong><p>${esc(b)}</p></div>`).join('')}</div>`, 'flush');
}

function moreGlossary() {
  const terms = [['VCP', 'Volatility Contraction Pattern — tightening price ranges before a breakout.'], ['RS', 'Relative Strength — a stock’s performance versus the market or sector.'], ['EMA', 'Exponential Moving Average — a weighted trend average.'], ['CPR', 'Central Pivot Range — a support/resistance band from the prior period.'], ['RRG', 'Relative Rotation Graph — maps assets through leading/lagging quadrants.'], ['OPM', 'Operating Profit Margin.']];
  return section('Glossary', 'Technical terminology.', `<dl class="glossary">${terms.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`);
}

/* ------------------------------------------------------------------ *
 * 7. SHARED SMALL HELPERS (self-contained, won't clash with app.js)
 * ------------------------------------------------------------------ */

function emptyBlock(heading, body, cta) {
  return `<div class="empty"><strong>${esc(heading)}</strong><p>${esc(body)}</p>${cta || ''}</div>`;
}

/* Keyboard shortcuts (bindings, table, and recording) live in settings-pro.js. */

/* ------------------------------------------------------------------ *
 * 8. LANDING PAGE EXTRAS (SwingEdge-style components, InvestSight vision)
 * ------------------------------------------------------------------ */
function welcomeExtras() {
  const grid = `<section class="public-section"><div class="eyebrow">YOUR WORKSPACE</div>
    <h2>Everything for research, in one connected desk.</h2>
    <p class="lp-lead">Explore companies, build a screen on your own criteria, read the market through sector maps, and act — all from a single workspace.</p>
    <div class="lp-feature-grid">${[
      ['Explore & research', 'search', 'Company fundamentals, valuation, growth and material events with source-linked context.'],
      ['Analysis desk', 'pulse', 'Performance and market charts, sector heatmaps, stock screens and comparison.'],
      ['Sector maps', 'globe', 'Breadth, momentum, thematic rotation, volume pulse, seasonality and RRG.'],
      ['Research utilities', 'flask', 'Backtests, indicator edge, position sizing, portfolio X-ray and calculators.'],
      ['Strategy-specific', 'strategy', 'Long-term, Swing and Intraday each have their own rankings and rules.'],
      ['Automated execution', 'play', 'Enter a budget and stop-loss, press Execute — the AI selects, enters and exits.']
    ].map(([h, i, p]) => `<article class="lp-feature"><span class="lp-feature-icon">${icon(i)}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}</div>
  </section>`;
  const steps = `<section class="public-section lp-steps-section"><div class="eyebrow">HOW IT WORKS</div>
    <h2>From understanding to action.</h2>
    <div class="lp-steps">${[
      ['01', 'Register', 'Create your account and, once approved, login and choose your broker.'],
      ['02', 'Research & screen', 'Study companies and build a screen from the ratio gallery or a popular theme.'],
      ['03', 'Analyse', 'Read sectors, compare names and inspect charts in the Analysis desk.'],
      ['04', 'Execute', 'Enter a budget and stop-loss; the AI handles entries and exits.']
    ].map(([n, h, p]) => `<div class="lp-step"><span class="lp-step-num">${n}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></div>`).join('')}</div>
  </section>`;
  const faq = `<section class="public-section"><div class="eyebrow">FREQUENTLY ASKED</div>
    <h2>Questions, answered.</h2>
    <div class="lp-faq">${[
      ['What is INVESTSIGHT CAPITAL?', 'A connected equity research platform. Research companies, screen on your own criteria, analyse sectors, and manage strategy-specific decisions — with research, risk and execution in one place.'],
      ['Can I create a custom stock screener?', 'Yes. Open the Analysis desk → Stock screens and build a query from the ratio gallery, or start from a popular theme.'],
      ['Who chooses the stocks?', 'The AI selects stocks from the model ranking for each strategy. You set the budget and stop-loss and can pause automation at any time.'],
      ['How does automated execution work?', 'For Long-term, Swing and Intraday you enter a budget and stop-loss and press Execute. The AI sizes each position, checks risk, enters on its trigger and exits at the stop-loss or target.']
    ].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </section>`;
  return grid + steps + faq;
}


/* ------------------------------------------------------------------ *
 * 9. ONE-CLICK AI EXECUTION
 *    The AI selects the stocks; the client enters only budget + stop-loss
 *    and presses a single Execute button. Everything else is automated.
 * ------------------------------------------------------------------ */

/* How many names the AI commits to per strategy. */
const AI_PICK_COUNT = { long: 5, swing: 4, intraday: 3 };

/* AI stock selection: top model-ranked names for the active strategy,
   filtered to those with workable technical alignment, capped per strategy. */
function aiPickStocks(key) {
  key = key || state.strategy;
  const n = AI_PICK_COUNT[key] || 4;
  const universe = (typeof state.exchange === 'string' ? state.exchange : 'NSE');
  // ranked() already sorts by model score for the strategy.
  const pool = (typeof ranked === 'function' ? ranked(key) : stockData.slice());
  // Prefer names with stronger technical alignment, then by model score.
  const ordered = pool.slice().sort((a, b) => {
    const sa = scores(a, key).total + (a.technical >= 80 ? 8 : 0);
    const sb = scores(b, key).total + (b.technical >= 80 ? 8 : 0);
    return sb - sa;
  });
  return { universe, picks: ordered.slice(0, n).map(c => c.id) };
}

/* Sizing plan: confidence-weighted, scaled by the market regime, capped by available cash and the stock weight limit. */
function aiPlan(key, ids, budget, stopPct) {
  key = key || state.strategy;
  stopPct = stopPct || defaultStop(key);
  const acct = account(key), available = Math.max(0, acct.available), maxWeight = strategyConfig(key).maxWeight, weightCap = acct.equity * maxWeight / 100;
  const regime = marketRegime(), deployable = Math.min(budget, available) * 0.96 * regime.sizing; // keep a small cash buffer
  const conf = ids.map(id => aiConfidence(stock(id), key)), confTotal = conf.reduce((a, b) => a + b, 0) || 1;
  let allocated = 0, capped = false;
  const target = targetPct(key, stopPct);
  const rows = ids.map((id, i) => {
    const c = stock(id), share = deployable * conf[i] / confTotal;
    if (share > weightCap) capped = true;
    const qty = Math.max(0, Math.floor(Math.min(share, weightCap) / c.price));
    const value = qty * c.price;
    allocated += value;
    const stopPx = c.price * (1 - stopPct / 100), targetPx = c.price * (1 + target / 100);
    return { c, qty, value, stopPx, targetPx, target, riskAmt: qty * (c.price - stopPx), confidence: conf[i] };
  });
  const limitedBy = regime.sizing === 0 ? 'market filter' : capped ? maxWeight + '% stock weight limit' : budget > available ? 'available cash' : regime.sizing < 1 ? `market filter (${Math.round(regime.sizing * 100)}% size)` : '';
  return { rows, allocated, cash: Math.max(0, budget - allocated), stopPct, available, limitedBy, sizing: regime.sizing };
}

/* Selected stocks panel: the client enters budget and stop-loss only; the AI chooses and sizes the stocks. */
function oneClickExecute() {
  const key = state.strategy, cfg = execSettings(key), blocked = automationBlocked(key), paused = !!blocked, onHold = !blocked && !!state.paused[key], sName = strategy().name;
  const { picks, fresh } = aiEntryCandidates(key);
  const held = new Map(holdings(key).map(h => [h.stock.id, h]));
  const plan = aiPlan(key, fresh, cfg.budget, cfg.stop);
  const planned = new Map(plan.rows.map(r => [r.c.id, r]));
  const tp = targetPct(key, cfg.stop), last = cfg.lastRun, paper = tradeMode(key) === 'paper', regime = marketRegime();
  const pickCards = picks.map(id => {
    const c = stock(id), r = planned.get(id), h = held.get(id);
    return `<div class="ai-pick${h ? ' is-held' : ''}"><div class="ai-pick-head">${stockMark(c)}<div><strong>${esc(c.name)}</strong><small>${esc(c.sector)} · ${fixed(c.price)}</small></div><span class="ai-pick-score" title="Model score out of 100">${scores(c, key).total}</span></div>
      ${confChip(aiConfidence(c, key))}
      <div class="ai-pick-nums">${h ? `<span>Held<b>${h.qty} sh</b></span><span>Avg cost<b>${fixed(h.cost)}</b></span>` : r ? `<span>Qty<b>${r.qty}</b></span><span>Value<b>${money(r.value)}</b></span>` : `<span>Qty<b>—</b></span><span>Value<b>—</b></span>`}<span>Stop<b>−${cfg.stop}%</b></span><span>Target<b>+${tp.toFixed(1)}%</b></span></div>
      ${badge(h ? 'Already held' : r ? 'Enters on trigger' : 'Position limit reached', h ? 'green' : r ? 'amber' : '')}</div>`;
  }).join('');
  const resume = blocked && !platformHalt().active ? action(icon('play') + 'Release kill switch', 'kill-resume', 'btn') : '';
  return section('Selected stocks', `${sName} · you enter two things, the AI does the rest`,
    `<div class="one-click${paused ? ' is-paused' : ''}">
      <form data-form="one-click" class="one-click-form">
        <div class="one-click-inputs">
          <label class="one-click-field"><span class="one-click-step">1</span><span class="one-click-label">Budget for ${esc(sName)}</span>
            <span class="one-click-input"><em>₹</em><input class="field" name="budget" type="number" min="1000" step="1" value="${cfg.budget}" required aria-label="Budget in rupees"></span>
            <small>Capital the AI may use for new entries.</small></label>
          <label class="one-click-field"><span class="one-click-step">2</span><span class="one-click-label">Stop-loss per position</span>
            <span class="one-click-input"><input class="field" name="stop" type="number" min="0.5" max="50" step="0.1" value="${cfg.stop}" required aria-label="Stop-loss percent"><em>%</em></span>
            <small>The stop-loss trails up as the price rises. Target is ${(tp / cfg.stop).toFixed(1)}× the stop-loss.</small></label>
        </div>
        <div class="one-click-actions">${resume}${action(icon('play') + 'Execute ' + sName + (paper ? ' · paper' : ''), 'one-click-execute', 'btn primary one-click-btn' + (paused ? ' disabled' : ''), paused ? 'disabled aria-disabled="true"' : '')}</div>
      </form>
      ${blocked ? info(`${blocked}. The AI will not place new entries until it is released.`, 'paused-status') : onHold ? info('New entries are on hold. Press Execute to resume; open positions keep their trailing stop-loss and target.', 'paused-status') : regime.sizing < 1 ? info(regime.note, regime.sizing === 0 ? 'paused-status' : 'warning') : ''}
      <div class="ai-selection">
        <div class="ai-selection-head"><span class="ai-chip">${icon('pulse')} AI-selected stocks · ${picks.length}</span>
          <span class="muted small">New entries use ${money(plan.allocated)} of ${money(cfg.budget)}${plan.limitedBy ? ` · capped by ${esc(plan.limitedBy)}${plan.limitedBy === 'available cash' ? ' (' + money(plan.available) + ')' : ''}` : ''} · higher confidence gets more capital</span></div>
        <div class="ai-pick-grid">${pickCards}</div>
      </div>
      ${last ? `<div class="auto-exec-log">${info(`Last run ${esc(last.time)} · ${last.count} ${last.count === 1 ? 'entry' : 'entries'} queued · budget ${money(last.budget)} · stop-loss ${last.stop}% · ${esc(last.universe || 'NSE')}${last.mode === 'paper' ? ' · paper' : ''}. ${link('See stock actions', 'plan/actions', 'text-link')}`, 'success')}</div>` : ''}
    </div>`);
}

/* Collect budget + stop-loss from the form and let the AI run everything else. */
function runOneClick(form) {
  const key = state.strategy;
  const data = new FormData(form);
  const budget = Number(data.get('budget'));
  const stop = Number(data.get('stop'));
  const blocked = automationBlocked(key);
  if (blocked) { toast(blocked + ' — release it before executing.'); return; }
  if (!Number.isFinite(budget) || budget < 1000) { toast('Enter a budget of at least ₹1,000.'); return; }
  if (!Number.isFinite(stop) || stop < 0.5 || stop > 50) { toast('Enter a stop-loss between 0.5% and 50%.'); return; }

  const { universe } = aiPickStocks(key);
  const { picks, fresh, held } = aiEntryCandidates(key);
  const plan = aiPlan(key, fresh, budget, stop), mode = tradeMode(key);

  // The AI commits the selection and run parameters; running Execute is the client's authorisation.
  state.selections[key] = picks.slice();
  state.budgets[key] = budget;
  state.accepted[key] = true;
  state.paused[key] = false;
  const ex = (state.autoExec = state.autoExec || {})[key] = state.autoExec[key] || {};
  ex.budget = budget; ex.stop = stop; ex.universe = universe;
  ex.lastRun = { time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST', count: fresh.length, budget, stop, universe, mode };
  try { persist(); } catch (e) { /* ignore */ }
  if (typeof recordAudit === 'function') recordAudit('Execution', 'One-click AI execution', strategy().name + ' · ' + fresh.length + ' AI-selected entries · ' + universe + ' · ' + mode);

  const heldPicks = picks.filter(id => held.has(id)).length;
  showDialog('AI execution started — ' + strategy().name + (mode === 'paper' ? ' (paper)' : ''),
    `<p>The AI queued ${fresh.length} ${fresh.length === 1 ? 'entry' : 'entries'} on your ${esc(universe)} account${heldPicks ? ` and keeps managing ${heldPicks} stock${heldPicks === 1 ? '' : 's'} you already hold` : ''}. Each entry fills only when its trigger is met${mode === 'paper' ? ', using virtual orders' : ''}.</p>
     ${plan.rows.length ? table(['Stock', 'Confidence', 'Qty', 'Price', 'Stop-loss', 'Target', 'Value'], plan.rows.map(r => `<tr><td>${esc(r.c.name)}</td><td>${r.confidence}%</td><td>${r.qty}</td><td>${fixed(r.c.price)}</td><td>${fixed(r.stopPx)}</td><td>${fixed(r.targetPx)}</td><td>${money(r.value)}</td></tr>`)) : '<p class="field-help">No new entries are needed — every pick is held or the open-position limit is reached.</p>'}
     <div class="one-click-summary">${lines([['Budget', money(budget)], ['Allocated to new entries', money(plan.allocated)], ['Sizing limit', plan.limitedBy ? 'Capped by ' + plan.limitedBy : 'Within budget'], ['Market filter', marketRegime().label], ['Stop-loss', stop + '%'], ['Mode', mode === 'paper' ? 'Paper' : 'Live'], ['Exchange', universe]])}</div>`,
    action('Done', 'close-dialog', 'btn') + link('View stock actions', 'plan/actions', 'btn primary', 'arrow'));

  const y = typeof scrollY === 'number' ? scrollY : 0;
  render(); if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, y);
}
