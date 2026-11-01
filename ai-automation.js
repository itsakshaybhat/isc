'use strict';
/* AI automation layer: kill switch, safety limits, market regime, confidence-weighted sizing,
   position management, the AI decision log and scorecard, and the administrator's Live operations desk.
   Interface only — the execution backend must enforce every limit shown here. */

const SQUARE_OFF_TIMES = ['15:00', '15:05', '15:10', '15:15', '15:20'];
/* Market inputs as of the quote timestamp (asOf). */
const marketFixture = { vix: 13.8, niftyChange: 1.05, breadth: 59 };
/* Nifty 50 reference return for each chart range, used by the AI scorecard. */
const benchmarkReturn = { '1D': 1.05, '1M': 1.6, '3M': 2.4, '6M': 3.4 };

function defaultGuard() { return { dailyLoss: 2, weeklyLoss: 5, maxTrades: 10, maxOpen: 8, squareOff: '15:15', vixPause: 22, niftyFallPause: 2, autoKill: true, trailing: true, partialBooking: true }; }
function guard() { return { ...defaultGuard(), ...(state.guard || {}) }; }
function killState() { return state.killSwitch || { active: false }; }
function platformHalt() { return state.admin?.halt || { active: false }; }
function killActive(key = state.strategy) { const k = killState(); return !!k.active && (k.scope === 'all' || k.scope === key); }
function automationBlocked(key = state.strategy) { return platformHalt().active ? 'Halted by administrator' : killActive(key) ? 'Kill switch on' : ''; }
function tradeMode(key = state.strategy) { return state.tradeMode?.[key] === 'paper' ? 'paper' : 'live'; }

function aiPolicy(key = state.strategy) {
  const cfg = strategyConfig(key).ai || {};
  return { defaultStop: cfg.defaultStop ?? (key === 'intraday' ? 1.5 : key === 'swing' ? 5 : 12), targetMultiple: cfg.targetMultiple ?? (key === 'intraday' ? 2 : 2.4), partialPct: cfg.partialPct ?? 50 };
}

/* Market regime decides how much of each normal position size the AI may use. */
function marketRegime() {
  const g = guard(), m = marketFixture;
  if (m.vix >= g.vixPause) return { label: 'High volatility', sizing: 0, tone: 'red', note: `India VIX ${m.vix} is at or above the ${g.vixPause} pause level — new entries paused.` };
  if (m.niftyChange <= -g.niftyFallPause) return { label: 'Market falling', sizing: 0, tone: 'red', note: `Nifty is down ${Math.abs(m.niftyChange)}% (pause at ${g.niftyFallPause}%) — new entries paused.` };
  if (m.vix >= 16 || m.breadth < 45) return { label: 'Neutral', sizing: 0.75, tone: 'amber', note: 'Mixed conditions — the AI uses 75% of normal position size.' };
  return { label: 'Risk-on', sizing: 1, tone: 'green', note: `India VIX ${m.vix} · Nifty ${pct(m.niftyChange)} · breadth ${m.breadth}% — full position size.` };
}

/* Confidence blends the model score with technical alignment and volume confirmation (30–97%). */
function aiConfidence(c, key = state.strategy) {
  const s = scores(c, key).total;
  return Math.max(30, Math.min(97, Math.round(30 + (s - 70) * 2.5 + (c.technical >= 85 ? 6 : 0) + (c.rvol >= 2 ? 4 : 0))));
}

/* Entry candidates respect the open-position limit. */
function aiEntryCandidates(key = state.strategy) {
  const held = new Set(holdings(key).map(h => h.stock.id)), picks = aiPickStocks(key).picks;
  const slots = Math.max(0, guard().maxOpen - held.size);
  return { picks, held, slots, fresh: picks.filter(id => !held.has(id)).slice(0, slots) };
}

/* Trailing stop-loss: always the stop-loss % below the highest price since entry. It rises with the price and never moves down.
   Partial booking is measured in units of the initial risk (R). */
function aiManage(r, key = state.strategy) {
  const g = guard(), p = aiPolicy(key), stopPct = execSettings(key).stop, initial = r.initialStop ?? r.stopPx;
  const peak = Math.max(r.entry, r.peak || 0, r.price), stopNow = Math.max(initial, peak * (1 - stopPct / 100));
  const risk = r.entry - initial || 1, R = (r.price - r.entry) / risk, trailed = stopNow > initial + 1e-9, locked = stopNow >= r.entry;
  const note = !trailed ? 'Initial stop-loss' : locked ? 'Stop above entry · profit locked' : 'Stop trailing up';
  const booked = g.partialBooking && R >= 1.5 ? p.partialPct : 0;
  return { R, peak, stopNow, trailed, locked, note: booked ? `${note} · ${booked}% booked` : note, next: `Peak ${fixed(peak)} · stop stays ${stopPct}% below it` };
}

function aiDecisions(key = state.strategy) {
  const acts = stockActions(key), regime = marketRegime(), g = guard(), p = aiPolicy(key), k = killState(), out = [];
  if (platformHalt().active) out.push({ type: 'kill', time: platformHalt().at, text: 'Automation halted by administrator', why: platformHalt().reason || 'Platform-wide halt.' });
  if (killActive(key)) out.push({ type: 'kill', time: k.at, text: 'Kill switch activated', why: [k.reason ? k.reason.replace(/[.!?]?$/, '.') : 'Stopped by you.', k.cancel ? 'Pending orders cancelled.' : '', k.exit ? 'Open positions queued to exit.' : ''].filter(Boolean).join(' ') });
  out.push({ type: 'guard', time: asOf, text: `Market regime: ${regime.label}`, why: regime.note });
  for (const w of acts.waiting) { const cancelled = w.status.startsWith('Cancelled'); out.push({ type: cancelled ? 'skip' : 'wait', time: cancelled ? 'Cancelled' : 'Pending', stock: w.stock, text: `${cancelled ? 'Cancelled order for' : 'Waiting to buy'} ${w.stock.name}`, why: cancelled ? `Kill switch cancelled the ${w.qty}-share entry at ${fixed(w.trigger)}.` : `${w.triggerLabel} ${fixed(w.trigger)} · ${w.qty} shares. Enters only when price confirms the setup.`, confidence: cancelled ? 0 : aiConfidence(w.stock, key) }); }
  for (const e of acts.entered) { if (e.exitQueued) { out.push({ type: 'exit', time: 'Queued', stock: e.stock, text: `Exiting ${e.qty} ${e.stock.name} at market`, why: `Kill switch exit · open ${signedMoney(e.pnl)} (${pct(e.retPct)}).` }); continue; } const m = aiManage(e, key); out.push({ type: m.trailed ? 'trail' : 'entry', time: 'Open position', stock: e.stock, text: m.trailed ? `${e.stock.name}: stop raised to ${fixed(m.stopNow)} from ${fixed(e.initialStop ?? e.stopPx)}` : `Holding ${e.qty} ${e.stock.name} from ${fixed(e.entry)}`, why: `${e.stock.catalyst}. Model ${scores(e.stock, key).total}/100 · ${m.next}.`, confidence: aiConfidence(e.stock, key) }); }
  const reasons = { 'Target reached': `Price reached the +${(acts.settings.stop * p.targetMultiple).toFixed(1)}% target set at entry.`, 'Trailing stop': 'Price fell back to the trailing stop after a gain — profit locked in.', 'Stop-loss hit': `Price fell ${acts.settings.stop}% below entry — the AI exited to cap the loss.`, 'Session close': `Intraday auto square-off at ${g.squareOff} IST.` };
  for (const x of acts.exited) out.push({ type: 'exit', time: x.date, stock: x.stock, text: `Sold ${x.qty} ${x.stock.name} at ${fixed(x.exit)} · ${signedMoney(x.pnl)}`, why: reasons[x.reason] || x.reason });
  const pickSet = new Set(aiPickStocks(key).picks), held = new Set(acts.entered.map(e => e.stock.id));
  ranked(key).slice(0, 8).filter(c => !pickSet.has(c.id) && !held.has(c.id)).slice(0, 2).forEach(c => out.push({ type: 'skip', time: asOf, stock: c, text: `Skipped ${c.name}`, why: c.technical < 80 ? `Technical alignment ${c.technical}/100 is below 80 — waiting for confirmation.` : 'Ranked below the selected picks for this strategy.', confidence: aiConfidence(c, key) }));
  return out;
}

function aiScorecard(key = state.strategy) {
  const ex = stockActions(key).exited, wins = ex.filter(x => x.pnl > 0), losses = ex.filter(x => x.pnl < 0);
  const gross = wins.reduce((a, x) => a + x.pnl, 0), lost = Math.abs(losses.reduce((a, x) => a + x.pnl, 0));
  const range = state.range[key], series = historySeries(key, range), aiReturn = (series.at(-1) / series[0] - 1) * 100, bench = benchmarkReturn[range] ?? 0;
  return { trades: ex.length, wins: wins.length, winRate: ex.length ? wins.length / ex.length * 100 : 0, avgWin: wins.length ? gross / wins.length : 0, avgLoss: losses.length ? lost / losses.length : 0, profitFactor: lost ? gross / lost : Infinity, range, aiReturn, bench, edge: aiReturn - bench };
}

/* ---------- Client interface pieces ---------- */
function confChip(value) { return `<span class="conf-chip" title="AI confidence"><i style="width:${value}%"></i><b>${value}%</b></span>`; }
function killSwitchButton() {
  const on = killActive() || platformHalt().active;
  return action(`${icon('power')}<span class="kill-label">${on ? 'Stopped' : 'Kill switch'}</span>`, on ? 'kill-resume' : 'kill-switch', 'btn kill-switch-btn' + (on ? ' is-on' : ''), `aria-label="${on ? 'Automation stopped — open resume options' : 'Kill switch: stop all AI automation'}" title="${on ? 'Automation stopped' : 'Stop all AI automation now'}"`);
}
function killBanner() {
  const h = platformHalt(), k = killState();
  if (h.active) return `<div class="kill-banner" role="alert">${icon('power')}<div><strong>Automation halted by the administrator</strong><span>${esc(h.reason || '')} · since ${esc(h.at || '')}. No new orders are placed.</span></div></div>`;
  if (k.active) return `<div class="kill-banner" role="alert">${icon('power')}<div><strong>Kill switch on · ${k.scope === 'all' ? 'all strategies' : esc(strategyList[k.scope]?.name || '')}</strong><span>Since ${esc(k.at || '')}${k.cancel ? ' · pending orders cancelled' : ''}${k.exit ? ' · open positions exiting' : ''}.</span></div>${action('Resume automation', 'kill-resume', 'btn small')}</div>`;
  return '';
}
function killSwitchDialog() {
  showDialog('Kill switch', `<form data-form="kill-switch" class="kill-form"><div class="kill-hero">${icon('power')}<div><strong>Stop the AI immediately</strong><p>Use this if anything looks wrong. The AI stops placing orders straight away.</p></div></div>
    <fieldset class="kill-fieldset"><legend>Stop automation for</legend>
      <label class="kill-option"><input type="radio" name="scope" value="all" checked><span><strong>All strategies</strong><small>Long-term, Swing and Intraday</small></span></label>
      <label class="kill-option"><input type="radio" name="scope" value="${state.strategy}"><span><strong>${esc(strategy().name)} only</strong><small>Other strategies keep running</small></span></label></fieldset>
    <fieldset class="kill-fieldset"><legend>What should happen</legend>
      <label class="check-line"><input type="checkbox" checked disabled><span>Stop all new entries</span></label>
      <label class="check-line"><input type="checkbox" name="cancel" checked><span>Cancel pending and waiting orders</span></label>
      <label class="check-line"><input type="checkbox" name="exit"><span>Exit all open positions at market price</span></label></fieldset>
    <div class="form-group"><label class="label" for="kill-reason">Reason (optional)</label><input class="field" id="kill-reason" name="reason" maxlength="200" placeholder="e.g. Market looks unstable"></div>
    <div class="form-group"><label class="label" for="kill-confirm">Type STOP to confirm</label><input class="field" id="kill-confirm" name="confirm" autocomplete="off" placeholder="STOP" required></div>
    <button class="btn danger-solid" type="submit">${icon('power')}Activate kill switch</button></form>`, action('Cancel', 'close-dialog'));
}
function killResumeDialog() {
  const h = platformHalt(), k = killState();
  if (h.active) { showDialog('Automation halted', `<p>The administrator has halted automation for every client${h.reason ? ': ' + esc(h.reason) : ''}. It resumes when the administrator lifts the halt.</p>`); return; }
  showDialog('Resume automation?', `<form data-form="kill-resume"><p>The AI will start placing new entries again for ${k.scope === 'all' ? 'all strategies' : esc(strategyList[k.scope]?.name || 'this strategy')}, within your budget, stop-loss and safety limits.</p>${lines([['Stopped since', esc(k.at || '—')], ['Reason', esc(k.reason || 'Not given')]])}<label class="check-line" style="margin-top:16px"><input type="checkbox" name="confirmed" required><span>I reviewed my positions and want the AI to resume.</span></label><button class="btn primary" type="submit">${icon('play')}Resume automation</button></form>`, action('Keep stopped', 'close-dialog'));
}
function limitMeter(label, value, limit, note) {
  const ratio = limit ? value / limit * 100 : 0, tone = ratio >= 100 ? 'red' : ratio >= 80 ? 'amber' : 'green';
  return `<div class="risk-gauge"><div class="row between wrap"><strong>${label}</strong>${badge(value + ' / ' + limit, tone)}</div><div class="risk-gauge-track" role="img" aria-label="${label}: ${value} of ${limit}"><span class="${tone}" style="width:${Math.max(0, Math.min(100, ratio))}%"></span><i></i></div><p>${note}</p></div>`;
}
function safetyPanel() {
  const g = guard(), k = killState(), h = platformHalt(), { dailyLoss } = riskSnapshot(), open = holdings().length, orders = orderList().length, regime = marketRegime();
  const field = (name, label, value, min, max, step, help) => `<label class="guard-field"><span>${label}</span><input class="field" name="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" required><small>${help}</small></label>`;
  const status = h.active ? ['Halted by administrator', 'red'] : k.active ? ['Kill switch on', 'red'] : state.paused[state.strategy] ? ['Paused', 'amber'] : ['AI running', 'green'];
  return section('Kill switch & safety limits', 'The AI stops itself when a limit is reached. You can also stop it instantly.', `<div class="safety-grid">
      <div class="kill-card${k.active || h.active ? ' is-active' : ''}"><span class="kill-card-icon">${icon('power')}</span><div><span class="eyebrow">AUTOMATION STATUS</span><h3>${status[0]}</h3><p>${h.active ? esc(h.reason || 'Platform-wide halt.') : k.active ? `Since ${esc(k.at)}${k.reason ? ' · ' + esc(k.reason) : ''}` : 'One tap stops new entries and can cancel orders and exit positions.'}</p></div>${k.active || h.active ? action(icon('play') + 'Resume automation', 'kill-resume', 'btn') : action(icon('power') + 'Activate kill switch', 'kill-switch', 'btn danger-solid')}</div>
      <div class="safety-gauges">${riskGauge('Daily loss', dailyLoss, g.dailyLoss, g.autoKill ? 'The kill switch triggers automatically at the limit.' : 'Automatic trigger is off — you will be alerted.')}${limitMeter('Orders today', orders, g.maxTrades, `${strategy().name} · new orders stop at the limit.`)}${limitMeter('Open positions', open, g.maxOpen, `${strategy().name} · no new entries beyond the limit.`)}<div class="regime-pill ${regime.tone}">${icon('pulse')}<span><strong>Market filter · ${regime.label}</strong><small>${regime.note}</small></span></div></div></div>
    <form data-form="guard" class="guard-form"><h3>Limits the AI must respect</h3><div class="guard-grid">
      ${field('dailyLoss', 'Daily loss limit (%)', g.dailyLoss, 0.5, 10, 0.1, 'Of account equity')}
      ${field('weeklyLoss', 'Weekly loss limit (%)', g.weeklyLoss, 1, 25, 0.1, 'Must be at least the daily limit')}
      ${field('maxTrades', 'Max orders per day', g.maxTrades, 1, 100, 1, 'Per strategy')}
      ${field('maxOpen', 'Max open positions', g.maxOpen, 1, 20, 1, 'Per strategy')}
      <label class="guard-field"><span>Intraday auto square-off</span><select class="field" name="squareOff">${SQUARE_OFF_TIMES.map(t => `<option ${t === g.squareOff ? 'selected' : ''}>${t}</option>`).join('')}</select><small>IST · closes every intraday position</small></label>
      ${field('vixPause', 'Pause when India VIX is above', g.vixPause, 10, 60, 0.5, `Now ${marketFixture.vix}`)}
      ${field('niftyFallPause', 'Pause when Nifty falls more than (%)', g.niftyFallPause, 0.5, 10, 0.1, `Today ${pct(marketFixture.niftyChange)}`)}
    </div><div class="guard-toggles">
      <label class="check-line"><input type="checkbox" name="autoKill" ${g.autoKill ? 'checked' : ''}><span>Trigger the kill switch automatically when a loss limit is hit</span></label>
      <label class="check-line"><input type="checkbox" name="partialBooking" ${g.partialBooking ? 'checked' : ''}><span>Book part of the profit at 1.5× the risk</span></label></div>
    <p class="field-help">The stop-loss always trails: it stays your stop-loss % below each position's highest price and never moves down.</p>
    <button class="btn primary" type="submit">Save safety limits</button></form>`);
}
function paperToggle(key = state.strategy) {
  const mode = tradeMode(key);
  return `<div class="mode-toggle" role="group" aria-label="Trading mode">${[['live', 'Live'], ['paper', 'Paper']].map(([m, label]) => `<button type="button" class="mode-btn${mode === m ? ' active' : ''}" data-action="trade-mode" data-mode="${m}" aria-pressed="${mode === m}">${label}</button>`).join('')}</div>`;
}
function aiBrainCard(key = state.strategy) {
  const regime = marketRegime(), g = guard(), p = aiPolicy(key), cfg = execSettings(key), { fresh, slots } = aiEntryCandidates(key);
  const avgConf = fresh.length ? Math.round(fresh.reduce((a, id) => a + aiConfidence(stock(id), key), 0) / fresh.length) : 0;
  const tiles = [
    ['pulse', 'Market filter', regime.label, regime.note, regime.tone],
    ['layers', 'Confidence-weighted sizing', fresh.length ? `${avgConf}% average` : 'No new entries', fresh.length ? `${fresh.length} new ${fresh.length === 1 ? 'entry' : 'entries'} · higher confidence gets more capital` : slots ? 'Every pick is already held' : `Open-position limit (${g.maxOpen}) reached`, ''],
    ['shield', 'Exit plan', `Trailing stop ${cfg.stop}% · target +${(cfg.stop * p.targetMultiple).toFixed(1)}%`, `The stop rises with every new high and never moves down${g.partialBooking ? ` · ${p.partialPct}% booked at 1.5R` : ''}`, ''],
    ['clock', key === 'intraday' ? 'Session control' : 'Review cycle', key === 'intraday' ? `Square-off ${g.squareOff} IST` : key === 'swing' ? 'Daily setup review' : 'Weekly thesis review', key === 'intraday' ? 'Every intraday position closes automatically' : 'Exits on invalidation, stop-loss or target', ''],
    ['power', 'Safety limits', `Daily loss ${g.dailyLoss}% · ${g.maxTrades} orders/day`, g.autoKill ? 'Kill switch triggers automatically at the limit' : 'Automatic kill switch is off', ''],
    ['orders', 'Order routing', tradeMode(key) === 'paper' ? 'Paper — virtual orders' : 'Live — your broker', automationBlocked(key) || 'Orders sent, reconciled and logged', automationBlocked(key) ? 'red' : '']
  ];
  return section('How the AI runs this strategy', 'Everything after Execute is automatic. These are the rules it follows right now.', `<div class="ai-brain">${tiles.map(([ico, name, value, note, tone]) => `<div class="ai-brain-tile ${tone}"><span>${icon(ico)}</span><div><small>${name}</small><strong>${value}</strong><p>${note}</p></div></div>`).join('')}</div>`, link('Safety limits', 'risk', 'text-link', 'shield'));
}
const aiLogIcons = { entry: 'check', exit: 'external', wait: 'clock', skip: 'close', trail: 'shield', guard: 'pulse', kill: 'power' };
function aiDecisionLog(key = state.strategy, limit = 0) {
  const all = aiDecisions(key), list = limit ? all.slice(0, limit) : all;
  return `<ol class="ai-log">${list.map(d => `<li class="ai-log-item ${d.type}"><span class="ai-log-icon">${icon(aiLogIcons[d.type] || 'info')}</span><div><div class="ai-log-head"><strong>${esc(d.text)}</strong><time>${esc(d.time || '')}</time></div><p>${esc(d.why)}</p>${d.confidence ? `<span class="ai-log-conf"><i style="width:${d.confidence}%"></i>Confidence ${d.confidence}%</span>` : ''}</div></li>`).join('')}</ol>`;
}
function aiScorecardView(key = state.strategy) {
  const s = aiScorecard(key);
  return `<div class="ai-scorecard">${[
    ['Win rate', s.winRate.toFixed(0) + '%', `${s.wins} of ${s.trades} closed trades`, ''],
    ['Profit factor', Number.isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '—', 'Gross profit ÷ gross loss', ''],
    ['Average win / loss', `${signedMoney(s.avgWin)} / ${signedMoney(-s.avgLoss)}`, 'Per closed trade', ''],
    [`AI vs Nifty 50 · ${s.range}`, `${pct(s.aiReturn)} vs ${pct(s.bench)}`, `${s.edge >= 0 ? 'Ahead' : 'Behind'} by ${Math.abs(s.edge).toFixed(2)} pts`, toneClass(s.edge)]
  ].map(([label, value, note, tone]) => `<div class="ai-score-tile"><span>${label}</span><strong class="${tone}">${value}</strong><small>${note}</small></div>`).join('')}</div>`;
}

/* ---------- Administrator: Live operations ---------- */
function opsRows() {
  const rows = [], client = state.admin.users.find(u => u.id === 'CLIENT-1042');
  if (client && client.status === 'Active') for (const key of Object.keys(strategyList)) {
    const acts = stockActions(key), status = automationBlocked(key) || (state.paused[key] ? 'Paused' : state.accepted[key] ? 'Running' : 'Ready');
    rows.push({ client, key, connected: true, mode: tradeMode(key), status, budget: acts.settings.budget, open: acts.entered.length, pnl: acts.open, last: acts.settings.lastRun?.time || 'No run yet' });
  }
  for (const u of state.admin.users.filter(x => x.status === 'Active' && x.id !== 'CLIENT-1042')) rows.push({ client: u, connected: false });
  return rows;
}
function adminOperations() {
  const h = platformHalt(), rows = opsRows(), live = rows.filter(r => r.connected), regime = marketRegime(), g = guard();
  const openTotal = live.reduce((a, r) => a + r.open, 0), pnlTotal = live.reduce((a, r) => a + r.pnl, 0), stopped = live.filter(r => /Kill|Halted/.test(r.status)).length;
  const safety = state.admin.audit.filter(e => e.area === 'Safety').slice(0, 8);
  const statusTone = s => /Kill|Halted/.test(s) ? 'red' : s === 'Paused' ? 'amber' : s === 'Running' ? 'green' : '';
  return title('Live operations', 'Watch AI automation across clients and stop it platform-wide when needed.', h.active ? action(icon('play') + 'Lift platform halt', 'ops-resume', 'btn primary') : action(icon('power') + 'Halt all automation', 'ops-halt', 'btn danger-solid'), 'PLATFORM CONTROL') + `<div class="stack">
    ${h.active ? `<div class="kill-banner" role="alert">${icon('power')}<div><strong>Platform halt active</strong><span>${esc(h.reason)} · since ${esc(h.at)}. No client automation places new orders.</span></div></div>` : ''}
    <div class="grid four">${metric('Automation', h.active ? 'Halted' : 'Running', h.active ? 'Platform halt in force' : (n => `${n} ${n === 1 ? 'strategy' : 'strategies'} running`)(live.filter(r => r.status === 'Running').length), 'power')}${metric('Open positions', openTotal, 'Across connected client strategies', 'layers')}${metric('Open Profit/Loss', `<span class="${toneClass(pnlTotal)}">${signedMoney(pnlTotal)}</span>`, 'Marked to the latest price', 'chart')}${metric('Stopped strategies', stopped, 'Kill switch or platform halt', 'shield')}</div>
    ${section('Client automation monitor', 'Every client strategy, its mode and what the AI last did.', rows.length ? table(['Client', 'Strategy', 'Mode', 'Status', 'Budget', 'Open', 'Open Profit/Loss', 'Last run'], rows.map(r => r.connected ? `<tr><td><strong>${esc(r.client.name)}</strong><small class="admin-cell-note">${esc(r.client.username)}</small></td><td>${strategyList[r.key].name}</td><td>${badge(r.mode === 'paper' ? 'Paper' : 'Live', r.mode === 'paper' ? 'amber' : 'green')}</td><td>${badge(r.status, statusTone(r.status))}</td><td>${money(r.budget)}</td><td>${r.open}</td><td class="${toneClass(r.pnl)}">${signedMoney(r.pnl)}</td><td>${esc(r.last)}</td></tr>` : `<tr><td><strong>${esc(r.client.name)}</strong><small class="admin-cell-note">${esc(r.client.username)}</small></td><td colspan="7" class="muted">Broker not connected yet — no automation.</td></tr>`)) : empty('No active clients', 'Approved clients appear here once they connect a broker.', link('Users & access', 'admin/users', 'btn')), '', 'flush')}
    <div class="grid equal">
      ${section('AI engines', 'Picks, confidence and sizing per strategy.', table(['Engine', 'Picks', 'Avg confidence', 'Sizing', 'Exit plan'], Object.keys(strategyList).map(key => { const picks = aiPickStocks(key).picks, conf = Math.round(picks.reduce((a, id) => a + aiConfidence(stock(id), key), 0) / Math.max(1, picks.length)), p = aiPolicy(key); return `<tr><td><strong>${strategyList[key].name}</strong></td><td>${picks.length}</td><td>${conf}%</td><td>${Math.round(regime.sizing * 100)}%</td><td>×${p.targetMultiple} target · trailing stop</td></tr>`; })), link('Strategy configuration', 'admin/strategies/long', 'text-link'), 'flush')}
      ${section('Market guard', 'Conditions that pause new entries for everyone.', `<div class="regime-pill ${regime.tone}">${icon('pulse')}<span><strong>${regime.label}</strong><small>${regime.note}</small></span></div>` + lines([['India VIX', marketFixture.vix + ' · pause at ' + g.vixPause], ['Nifty 50 today', pct(marketFixture.niftyChange) + ' · pause at −' + g.niftyFallPause + '%'], ['Market breadth', marketFixture.breadth + '% advancing'], ['Position sizing', Math.round(regime.sizing * 100) + '% of normal'], ['Quotes', asOf]]))}
    </div>
    ${section('Safety events', 'Kill switch, halts and limit changes — newest first.', safety.length ? adminAuditTable(safety) : '<p>No safety events recorded yet.</p>', link('Full audit history', 'admin/audit', 'text-link'))}
  </div>`;
}

/* ---------- Listeners ---------- */
document.addEventListener('click', event => {
  const b = event.target.closest('[data-action]'); if (!b) return;
  switch (b.dataset.action) {
    case 'kill-switch': if (state.signedIn) killSwitchDialog(); break;
    case 'kill-resume': if (state.signedIn) killResumeDialog(); break;
    case 'trade-mode': { if (!state.signedIn || !['live', 'paper'].includes(b.dataset.mode)) break; state.tradeMode = { ...(state.tradeMode || {}), [state.strategy]: b.dataset.mode }; persist(); recordAudit('Execution', 'Trading mode changed', strategy().name + ' · ' + b.dataset.mode); const y = scrollY; render(); window.scrollTo(0, y); toast(b.dataset.mode === 'paper' ? 'Paper mode: the AI places virtual orders only.' : 'Live mode: the AI places orders with your broker.'); break; }
    case 'ops-halt': if (!isAdmin()) { toast('Administrator access is required.'); break; } showDialog('Halt all automation', `<form data-form="ops-halt"><p>Every client strategy stops placing new orders immediately. Open positions keep their stop-loss and target.</p><div class="form-group"><label class="label" for="ops-halt-reason">Reason (shown to clients)</label><textarea class="field" id="ops-halt-reason" name="reason" required minlength="5" maxlength="300" placeholder="e.g. Exchange connectivity issue"></textarea></div><label class="check-line"><input type="checkbox" name="confirmed" required><span>I confirm a platform-wide halt.</span></label><button class="btn danger-solid" type="submit">${icon('power')}Halt all automation</button></form>`, action('Cancel', 'close-dialog')); break;
    case 'ops-resume': if (!isAdmin()) { toast('Administrator access is required.'); break; } showDialog('Lift the platform halt?', `<form data-form="ops-resume"><p>Client automation resumes. Clients with their own kill switch on stay stopped.</p><label class="check-line"><input type="checkbox" name="confirmed" required><span>Conditions are back to normal.</span></label><button class="btn primary" type="submit">${icon('play')}Lift halt</button></form>`, action('Cancel', 'close-dialog')); break;
  }
});
document.addEventListener('submit', event => {
  const f = event.target; if (!f.matches('form')) return;
  const name = f.dataset.form; if (!['kill-switch', 'kill-resume', 'guard', 'ops-halt', 'ops-resume'].includes(name)) return;
  event.preventDefault(); const data = new FormData(f), close = () => $('#dialog').open && $('#dialog').close();
  if (name === 'kill-switch') {
    if (!state.signedIn) return;
    const scope = data.get('scope') === 'all' ? 'all' : strategyList[data.get('scope')] ? data.get('scope') : null;
    if (!scope) { toast('Choose which strategies to stop.'); return; }
    if (String(data.get('confirm') || '').trim().toUpperCase() !== 'STOP') { toast('Type STOP to confirm the kill switch.'); return; }
    state.killSwitch = { active: true, scope, cancel: data.has('cancel'), exit: data.has('exit'), reason: String(data.get('reason') || '').trim().slice(0, 200), at: nowIST(), by: state.role === 'admin' ? 'Administrator' : 'Client' };
    for (const key of Object.keys(strategyList)) if (scope === 'all' || scope === key) state.paused[key] = true;
    persist(); recordAudit('Safety', 'Kill switch activated', (scope === 'all' ? 'All strategies' : strategyList[scope].name) + (state.killSwitch.cancel ? ' · orders cancelled' : '') + (state.killSwitch.exit ? ' · positions exiting' : '') + (state.killSwitch.reason ? ' · ' + state.killSwitch.reason : ''));
    close(); render(); toast('Kill switch on. The AI has stopped placing new orders.'); return;
  }
  if (name === 'kill-resume') {
    if (!state.signedIn || !data.has('confirmed')) { toast('Confirm that you want the AI to resume.'); return; }
    if (platformHalt().active) { toast('The administrator halt is still active.'); return; }
    const k = killState(); for (const key of Object.keys(strategyList)) if (k.scope === 'all' || k.scope === key) state.paused[key] = false;
    state.killSwitch = { active: false, lastAt: k.at, resumedAt: nowIST() };
    persist(); recordAudit('Safety', 'Automation resumed', 'Kill switch released'); close(); render(); toast('Automation resumed. All safety limits still apply.'); return;
  }
  if (name === 'guard') {
    if (!state.signedIn) return;
    const num = k => Number(data.get(k)), next = { dailyLoss: num('dailyLoss'), weeklyLoss: num('weeklyLoss'), maxTrades: num('maxTrades'), maxOpen: num('maxOpen'), squareOff: String(data.get('squareOff') || ''), vixPause: num('vixPause'), niftyFallPause: num('niftyFallPause'), autoKill: data.has('autoKill'), trailing: true, partialBooking: data.has('partialBooking') };
    const ok = next.dailyLoss >= 0.5 && next.dailyLoss <= 10 && next.weeklyLoss >= next.dailyLoss && next.weeklyLoss <= 25 && Number.isInteger(next.maxTrades) && next.maxTrades >= 1 && next.maxTrades <= 100 && Number.isInteger(next.maxOpen) && next.maxOpen >= 1 && next.maxOpen <= 20 && SQUARE_OFF_TIMES.includes(next.squareOff) && next.vixPause >= 10 && next.vixPause <= 60 && next.niftyFallPause >= 0.5 && next.niftyFallPause <= 10;
    if (!ok) { toast('Check the limits: weekly loss must be at least the daily loss, and whole numbers are needed for orders and positions.'); return; }
    state.guard = next; persist(); recordAudit('Safety', 'Safety limits saved', `Daily ${next.dailyLoss}% · weekly ${next.weeklyLoss}% · ${next.maxTrades} orders · ${next.maxOpen} positions · square-off ${next.squareOff}`);
    const y = scrollY; render(); window.scrollTo(0, y); toast('Safety limits saved. The AI follows them from the next decision.'); return;
  }
  if (!isAdmin()) { toast('Administrator access is required.'); return; }
  if (name === 'ops-halt') {
    const reason = String(data.get('reason') || '').trim();
    if (reason.length < 5 || !data.has('confirmed')) { toast('Add a reason and confirm the halt.'); return; }
    state.admin.halt = { active: true, reason, at: nowIST() }; persist(); recordAudit('Safety', 'Platform automation halted', reason); close(); render(); toast('All client automation halted.'); return;
  }
  if (name === 'ops-resume') {
    if (!data.has('confirmed')) { toast('Confirm that conditions are back to normal.'); return; }
    const was = platformHalt(); state.admin.halt = { active: false, lastReason: was.reason, liftedAt: nowIST() }; persist(); recordAudit('Safety', 'Platform halt lifted', was.reason || ''); close(); render(); toast('Platform halt lifted.');
  }
});
