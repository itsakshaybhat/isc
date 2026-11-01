'use strict';
/* Settings: editable preferences, notification routing, session timeout, and re-bindable keyboard shortcuts.
   Interface only — the backend must store these preferences and enforce security settings. */

const SETTINGS_INFO = {
  profile: 'Your name, contact number, and what opens after you sign in.',
  security: 'Password, two-step verification, and how long an idle session stays open.',
  notifications: 'Choose which events notify you and on which channel.',
  display: 'Theme, charts, layout density, motion, and the chat assistant.',
  shortcuts: 'Change any shortcut key, or turn shortcuts off.',
  permissions: 'What the AI may do on your broker account, and the status of each strategy.',
  privacy: 'What this browser stores, and how to download or clear it.',
  workspace: 'Sidebar order and setup preferences.',
  resources: 'Guides, references, and other resources.',
  pricing: 'Your plan and what it includes.',
  learn: 'Short explanations of the terms used in the workspace.',
  support: 'Search help articles or contact support.'
};
const START_PAGES = [['home', 'Dashboard'], ['plan/selections', 'Execution'], ['portfolio', 'Portfolio'], ['analysis', 'Analysis']];
const SESSION_TIMEOUTS = [15, 30, 60, 120];
const SUMMARY_TIMES = ['15:45', '16:00', '17:00', '18:00'];
const NOTIFY_CHANNELS = [['inapp', 'In-app'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['telegram', 'Telegram']];
const NOTIFY_EVENTS = [
  ['fills', 'AI entries & exits', 'When the AI fills an entry, books profit, or exits a position.'],
  ['stops', 'Stop-loss & target hits', 'When a trailing stop-loss or target closes a position.'],
  ['safety', 'Kill switch & safety limits', 'Kill switch, loss limits, market pause, and administrator halts.'],
  ['summary', 'Daily AI summary', 'End-of-day summary of AI decisions and Profit/Loss.'],
  ['alerts', 'Price & score alerts', 'Alerts you create in Risk & alerts.'],
  ['news', 'Company research & news', 'Updates for companies you hold or follow.']
];

function defaultNotify() {
  return Object.fromEntries(NOTIFY_EVENTS.map(([id]) => [id, { inapp: true, email: ['safety', 'summary'].includes(id), whatsapp: false, telegram: false }]));
}
function defaultPrefs() {
  return { mobile: '', startPage: 'home', defaultStrategy: 'long', defaultExchange: 'NSE', sessionTimeout: 30, twoStep: 'off', density: 'comfortable', reduceMotion: false, showChat: true, dailySummary: '16:00', quiet: { on: false, from: '22:00', to: '07:00' } };
}
function prefs() {
  const p = state.prefs || {}, n = defaultNotify(), saved = p.notify || {};
  for (const id of Object.keys(n)) n[id] = { ...n[id], ...(saved[id] || {}) };
  if (!saved.news && state.notifications === false) n.news.inapp = false;
  n.safety.inapp = true; // safety events always reach the workspace
  return { ...defaultPrefs(), ...p, notify: n, quiet: { ...defaultPrefs().quiet, ...(p.quiet || {}) } };
}
function savePrefs(patch) { state.prefs = { ...prefs(), ...patch }; persist(); }
function startPage() { const p = prefs().startPage; return START_PAGES.some(([r]) => r === p) ? p : 'home'; }
function channelReady(key) { return key === 'inapp' || !!state.alertChannels?.[key]?.on; }
function accountEmail() { return state.admin?.users?.find(u => u.id === state.sessionUser)?.email || ''; }

/* ---------- Section bodies ---------- */
function settingsProfile() {
  const p = prefs(), email = accountEmail();
  const opt = (list, value) => list.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`).join('');
  return `<form data-form="settings-profile" class="settings-form">
    <div class="settings-grid">
      <div class="form-group"><label class="label" for="display-name">Display name</label><input class="field" id="display-name" name="name" value="${esc(state.displayName)}" minlength="2" maxlength="40" required><small class="field-help">Shown in the workspace greeting. 2–40 characters.</small></div>
      <div class="form-group"><label class="label" for="profile-mobile">Mobile number <span class="muted">(optional)</span></label><input class="field" id="profile-mobile" name="mobile" type="tel" value="${esc(p.mobile)}" placeholder="+91 98765 43210"><small class="field-help">Used for account recovery only.</small></div>
      <div class="form-group"><label class="label">Sign-in email</label><div class="settings-readonly">${email ? esc(email) : 'Managed by your sign-in provider'}</div><small class="field-help">Contact support to change it.</small></div>
      <div class="form-group"><label class="label">Time zone</label><div class="settings-readonly">India Standard Time (UTC+05:30)</div><small class="field-help">NSE and BSE cash market: 09:15–15:30 IST.</small></div>
    </div>
    <h3 class="settings-subhead">After you sign in</h3>
    <div class="settings-grid three">
      <div class="form-group"><label class="label" for="profile-start">Start page</label><select class="field" id="profile-start" name="startPage">${opt(START_PAGES, p.startPage)}</select></div>
      <div class="form-group"><label class="label" for="profile-strategy">Default strategy</label><select class="field" id="profile-strategy" name="defaultStrategy">${opt(Object.entries(strategyList).map(([k, s]) => [k, s.name]), p.defaultStrategy)}</select></div>
      <div class="form-group"><label class="label" for="profile-exchange">Default exchange</label><select class="field" id="profile-exchange" name="defaultExchange">${opt([['NSE', 'NSE'], ['BSE', 'BSE']], p.defaultExchange)}</select></div>
    </div>
    <button type="submit" class="btn primary">Save profile</button></form>`;
}

function settingsSecurity() {
  const p = prefs();
  return `<div class="stack">
    <form data-form="settings-security" class="settings-form"><div class="settings-grid">
      <div class="form-group"><label class="label" for="sec-2fa">Two-step verification</label><select class="field" id="sec-2fa" name="twoStep">${[['off', 'Off'], ['app', 'Authenticator app'], ['sms', 'SMS code to mobile']].map(([v, l]) => `<option value="${v}" ${p.twoStep === v ? 'selected' : ''}>${l}</option>`).join('')}</select><small class="field-help">${p.twoStep === 'off' ? 'Recommended: adds a code after your password.' : 'Requested · setup completes on your next sign-in.'}</small></div>
      <div class="form-group"><label class="label" for="sec-timeout">Sign out after inactivity</label><select class="field" id="sec-timeout" name="sessionTimeout">${SESSION_TIMEOUTS.map(m => `<option value="${m}" ${p.sessionTimeout === m ? 'selected' : ''}>${m < 60 ? m + ' minutes' : m / 60 + (m === 60 ? ' hour' : ' hours')}</option>`).join('')}</select><small class="field-help">The AI keeps running after you are signed out.</small></div>
    </div><button type="submit" class="btn primary">Save security settings</button></form>
    <form data-form="settings-password" class="settings-form settings-card"><h3 class="settings-subhead">Change password</h3><div class="settings-grid three">
      <div class="form-group"><label class="label" for="pw-current">Current password</label><input class="field" id="pw-current" name="current" type="password" autocomplete="current-password" required></div>
      <div class="form-group"><label class="label" for="pw-new">New password</label><input class="field" id="pw-new" name="next" type="password" autocomplete="new-password" minlength="8" required><small class="field-help">At least 8 characters, with a letter and a number.</small></div>
      <div class="form-group"><label class="label" for="pw-confirm">Confirm new password</label><input class="field" id="pw-confirm" name="confirm" type="password" autocomplete="new-password" required></div>
    </div><button type="submit" class="btn">Change password</button></form>
    <div class="settings-card"><h3 class="settings-subhead">Sessions</h3>${lines([['This browser', 'Signed in now'], ['Broker connection', state.broker ? broker().name + ' •• 1042' : 'Not connected']])}<div class="row wrap" style="margin-top:16px">${action('Sign out of other devices', 'signout-others', 'btn')}${link('Broker permissions', 'settings/permissions', 'text-link')}</div></div>
  </div>`;
}

function settingsNotifications() {
  const p = prefs();
  const head = `<tr><th scope="col">Event</th>${NOTIFY_CHANNELS.map(([k, l]) => `<th scope="col" class="center">${l}${channelReady(k) ? '' : '<small>Not set up</small>'}</th>`).join('')}</tr>`;
  const rows = NOTIFY_EVENTS.map(([id, label, note]) => `<tr><td><strong>${label}</strong><small class="muted settings-note">${note}</small></td>${NOTIFY_CHANNELS.map(([k, l]) => {
    const locked = id === 'safety' && k === 'inapp', ready = channelReady(k);
    if (locked) return `<td class="center"><span class="always-on" title="Safety alerts always appear in the workspace">Always</span></td>`;
    return `<td class="center"><input type="checkbox" name="n-${id}-${k}" aria-label="${label} by ${l}" ${p.notify[id][k] && ready ? 'checked' : ''} ${!ready ? 'disabled' : ''}></td>`;
  }).join('')}</tr>`).join('');
  return `<form data-form="settings-notify" class="settings-form">
    <div class="table-wrap"><table class="notify-matrix"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
    <p class="field-help">Kill switch and safety alerts always appear in-app. Email, WhatsApp, and Telegram need a verified contact — ${link('set them up in Risk & alerts', 'risk', 'text-link')}.</p>
    <div class="settings-grid three">
      <div class="form-group"><label class="label" for="n-summary">Daily summary time</label><select class="field" id="n-summary" name="dailySummary">${SUMMARY_TIMES.map(t => `<option ${t === p.dailySummary ? 'selected' : ''}>${t}</option>`).join('')}</select><small class="field-help">IST, after the market closes.</small></div>
      <div class="form-group"><label class="label" for="n-quiet-from">Quiet hours from</label><input class="field" id="n-quiet-from" name="quietFrom" type="time" value="${p.quiet.from}"></div>
      <div class="form-group"><label class="label" for="n-quiet-to">Quiet hours until</label><input class="field" id="n-quiet-to" name="quietTo" type="time" value="${p.quiet.to}"></div>
    </div>
    <label class="check-line"><input type="checkbox" name="quietOn" ${p.quiet.on ? 'checked' : ''}><span>Hold email, WhatsApp, and Telegram messages during quiet hours (safety alerts still send)</span></label>
    <button type="submit" class="btn primary">Save notifications</button></form>`;
}

/* Display options apply and save the moment they change; there is no separate Save step. */
const DISPLAY_OPTIONS = { theme: ['light', 'dark', 'pure-dark'], density: ['comfortable', 'compact'], chartStyle: ['candle', 'line'], indicator: ['none', 'ema', 'rsi'], range: ['1D', '1M', '3M', '6M'] };
function displayPreview() {
  const line = state.chartStyle === 'line', pts = [62, 58, 64, 60, 70, 66, 74, 71, 80, 77, 86, 83], x = i => 12 + i * 23, y = v => 92 - (v - 50) * 1.9;
  const body = line ? `<path d="${pts.map((v, i) => (i ? 'L' : 'M') + x(i) + ',' + y(v).toFixed(1)).join(' ')}" class="chart-line"/>` : pts.map((v, i) => { const o = i ? pts[i - 1] : v - 3, up = v >= o, top = y(Math.max(o, v)), h = Math.max(3, Math.abs(y(o) - y(v))); return `<path d="M${x(i)} ${(top - 6).toFixed(1)}V${(top + h + 6).toFixed(1)}" stroke="${up ? 'var(--positive)' : 'var(--negative)'}"/><rect x="${x(i) - 4}" y="${top.toFixed(1)}" width="8" height="${h.toFixed(1)}" rx="1" fill="${up ? 'var(--positive)' : 'var(--negative)'}"/>`; }).join('');
  const ema = state.indicator === 'ema' ? `<path d="${pts.map((v, i) => (i ? 'L' : 'M') + x(i) + ',' + (y(v) + 9).toFixed(1)).join(' ')}" fill="none" stroke="#c59448" stroke-width="1.5" stroke-dasharray="4 3"/>` : '';
  const label = { none: 'Price only', ema: 'EMA (20)', rsi: 'RSI (14) panel below the chart' }[state.indicator] || 'Price only';
  return `<div class="display-preview" aria-label="How the current display settings look"><div class="display-preview-head"><strong>How it looks</strong><span class="muted small">${line ? 'Line' : 'Candlestick'} · ${esc(label)} · ${state.range[state.strategy]} · ${prefs().density === 'compact' ? 'Compact' : 'Comfortable'}</span></div><svg viewBox="0 0 280 110" role="img" aria-label="Sample ${line ? 'line' : 'candlestick'} chart">${body}${ema}</svg>${state.indicator === 'rsi' ? '<div class="display-preview-rsi"><span style="width:62%"></span></div>' : ''}</div>`;
}
function settingsDisplay() {
  const p = prefs(), radio = (name, label, list, value) => `<fieldset class="segmented-field"><legend class="label">${label}</legend><div class="segmented">${list.map(([v, l]) => `<label class="segmented-option"><input type="radio" name="${name}" value="${v}" ${v === value ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>`;
  return `<form data-form="settings-display" class="settings-form display-form">
    <p class="display-autosave" role="status" aria-live="polite">${icon('check')}Changes apply and save as soon as you choose them.</p>
    <div class="display-layout"><div class="settings-grid">
      ${radio('theme', 'Theme', [['light', 'Light'], ['dark', 'Dark'], ['pure-dark', 'Pure dark']], state.theme)}
      ${radio('density', 'Layout density', [['comfortable', 'Comfortable'], ['compact', 'Compact']], p.density)}
      <div class="form-group">${radio('chartStyle', 'Stock price chart', [['candle', 'Candlestick'], ['line', 'Line']], state.chartStyle === 'line' ? 'line' : 'candle')}<small class="field-help">Company charts. The Dashboard always shows a line graph.</small></div>
      <div class="form-group"><label class="label" for="disp-indicator">Chart indicator</label><select class="field" id="disp-indicator" name="indicator">${[['none', 'Price only'], ['ema', 'EMA (20) · trend'], ['rsi', 'RSI (14) · momentum']].map(([v, l]) => `<option value="${v}" ${state.indicator === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="form-group"><label class="label" for="disp-range">Chart period</label><select class="field" id="disp-range" name="range">${DISPLAY_OPTIONS.range.map(r => `<option ${state.range[state.strategy] === r ? 'selected' : ''}>${r}</option>`).join('')}</select><small class="field-help">Sets Long-term, Swing and Intraday together.</small></div>
    </div>${displayPreview()}</div>
    <fieldset class="display-toggles"><legend class="label">Comfort</legend>
      <label class="check-line"><input type="checkbox" name="reduceMotion" ${p.reduceMotion ? 'checked' : ''}><span><strong>Reduce motion</strong><small>Turns off animations, such as the pulsing kill switch.</small></span></label>
      <label class="check-line"><input type="checkbox" name="showChat" ${p.showChat ? 'checked' : ''}><span><strong>Floating chat assistant</strong><small>Shown on every page except Settings.</small></span></label>
    </fieldset>
    <div class="row wrap">${action('Restore defaults', 'reset-display', 'btn')}<span class="muted small">Light theme · comfortable · candlestick · EMA (20) · motion on · chat on</span></div></form>`;
}
function applyDisplay(form, changed) {
  const data = new FormData(form), get = k => String(data.get(k) || '');
  const valid = Object.entries(DISPLAY_OPTIONS).every(([k, list]) => list.includes(get(k)));
  if (!valid) { toast('Choose each display option from the lists.'); return false; }
  state.theme = get('theme'); state.chartStyle = get('chartStyle'); state.indicator = get('indicator');
  for (const k of Object.keys(strategyList)) state.range[k] = get('range');
  savePrefs({ density: get('density'), reduceMotion: data.has('reduceMotion'), showChat: data.has('showChat') });
  if (!data.has('showChat')) state.chatOpen = false;
  const y = scrollY; render(); window.scrollTo(0, y);
  if (changed) (changed.type === 'radio' ? $(`[data-form="settings-display"] input[name="${changed.name}"][value="${changed.value}"]`) : $(`[data-form="settings-display"] [name="${changed.name}"]`))?.focus?.({ preventScroll: true });
  return true;
}
document.addEventListener('change', event => {
  const form = event.target.closest?.('[data-form="settings-display"]');
  if (form && state.signedIn) applyDisplay(form, event.target);
});

function settingsPermissions() {
  const status = key => automationBlocked(key) || (state.paused[key] ? 'On hold · press Execute' : state.accepted[key] ? 'Running' : 'Not started');
  const tone = s => /Kill|Halted|hold/i.test(s) ? 'red' : s === 'Running' ? 'green' : 'amber';
  return permissionSummary() + section('Strategies on this account', 'Each strategy starts when you press Execute and stops only with the kill switch.', table(['Strategy', 'Mode', 'Status', 'Budget', 'Stop-loss'], Object.keys(strategyList).map(k => { const s = status(k), cfg = execSettings(k); return `<tr><td><strong>${strategyList[k].name}</strong></td><td>${badge(tradeMode(k) === 'paper' ? 'Paper' : 'Live', tradeMode(k) === 'paper' ? 'amber' : 'green')}</td><td>${badge(s, tone(s))}</td><td>${money(cfg.budget)}</td><td>${cfg.stop}% trailing</td></tr>`; })), '', 'flush') + `<div class="row wrap" style="margin-top:20px">${link('Open execution', 'plan/selections', 'btn primary')}${link('Safety limits', 'risk', 'btn')}${killSwitchButton()}</div>`;
}

/* ---------- Keyboard shortcuts ---------- */
const SHORTCUT_ACTIONS = [
  { id: 'search', group: 'General', label: 'Focus the search bar', key: '/' },
  { id: 'help', group: 'General', label: 'Show keyboard shortcuts', key: '?' },
  { id: 'theme', group: 'General', label: 'Switch theme', key: 't' },
  { id: 'chat', group: 'General', label: 'Open or close the chat assistant', key: 'c' },
  { id: 'kill', group: 'Automation', label: 'Open the kill switch', key: 'x' },
  { id: 'execution', group: 'Automation', label: 'Open Execution', key: 'e' },
  { id: 'long', group: 'Strategy', label: 'Switch to Long-term', key: '1' },
  { id: 'swing', group: 'Strategy', label: 'Switch to Swing', key: '2' },
  { id: 'intraday', group: 'Strategy', label: 'Switch to Intraday', key: '3' },
  { id: 'go-home', group: 'Go to', label: 'Dashboard', key: 'g d', route: 'home' },
  { id: 'go-explore', group: 'Go to', label: 'Explore stocks', key: 'g e', route: 'explore' },
  { id: 'go-portfolio', group: 'Go to', label: 'Portfolio', key: 'g p', route: 'portfolio' },
  { id: 'go-orders', group: 'Go to', label: 'Orders', key: 'g o', route: 'orders' },
  { id: 'go-risk', group: 'Go to', label: 'Risk & alerts', key: 'g r', route: 'risk' },
  { id: 'go-analysis', group: 'Go to', label: 'Analysis', key: 'g a', route: 'analysis' },
  { id: 'go-screens', group: 'Go to', label: 'Stock screens', key: 'g s', route: 'analysis/screens' },
  { id: 'go-compare', group: 'Go to', label: 'Compare', key: 'g c', route: 'analysis/compare' },
  { id: 'go-sectors', group: 'Go to', label: 'Sectors', key: 'g k', route: 'sectors' },
  { id: 'go-tools', group: 'Go to', label: 'Tools', key: 'g t', route: 'tools' },
  { id: 'go-settings', group: 'Go to', label: 'Settings', key: 'g ,', route: 'settings/profile' }
];
const SHORTCUT_KEY = /^[a-z0-9\/?.,;'\[\]\-=`]$/;
let shortcutPrefixAt = 0, recordPrefix = false;

function shortcutState() { return { enabled: state.shortcuts?.enabled !== false, keys: { ...(state.shortcuts?.keys || {}) } }; }
function shortcutBindings() { const s = shortcutState(); return Object.fromEntries(SHORTCUT_ACTIONS.map(a => [a.id, s.keys[a.id] || a.key])); }
function normKey(k) { if (typeof k !== 'string' || k.length !== 1) return ''; const v = k.toLowerCase(); return SHORTCUT_KEY.test(v) ? v : ''; }
function keyLabel(combo) { return combo.split(' ').map(k => `<kbd>${esc(k)}</kbd>`).join(' <span class="muted">then</span> '); }
function shortcutConflict(id, combo) { const b = shortcutBindings(); const other = SHORTCUT_ACTIONS.find(a => a.id !== id && b[a.id] === combo); return other ? `${keyLabel(combo)} is already used by “${esc(other.label)}”.` : ''; }
function validShortcut(combo) { const parts = combo.split(' '); return parts.length === 1 ? parts[0] !== 'g' && SHORTCUT_KEY.test(parts[0]) : parts.length === 2 && parts[0] === 'g' && parts[1] !== 'g' && SHORTCUT_KEY.test(parts[1]); }
function setShortcut(id, combo) {
  const def = SHORTCUT_ACTIONS.find(a => a.id === id); if (!def) return 'Unknown shortcut.';
  if (!validShortcut(combo)) return 'Use a letter, number, or symbol key — or g followed by one. Ctrl, Alt, and ⌘ combinations are kept for the browser.';
  const clash = shortcutConflict(id, combo); if (clash) return clash;
  const s = shortcutState(); if (combo === def.key) delete s.keys[id]; else s.keys[id] = combo;
  state.shortcuts = s; persist(); return '';
}

function shortcutsTable() {
  const b = shortcutBindings(), on = shortcutState().enabled;
  const groups = [...new Set(SHORTCUT_ACTIONS.map(a => a.group))];
  return `<table class="data-table shortcuts-table"><thead><tr><th>Shortcut</th><th>Action</th></tr></thead><tbody>${groups.map(g => `<tr class="shortcut-group"><th colspan="2" scope="rowgroup">${g}</th></tr>` + SHORTCUT_ACTIONS.filter(a => a.group === g).map(a => `<tr><td>${keyLabel(b[a.id])}</td><td>${a.group === 'Go to' ? 'Go to ' : ''}${esc(a.label)}</td></tr>`).join('')).join('')}<tr><td><kbd>Esc</kbd></td><td>Close dialog or panel</td></tr></tbody></table>${on ? '' : '<p class="field-help">Shortcuts are turned off in Settings.</p>'}`;
}

function settingsShortcuts() {
  const b = shortcutBindings(), s = shortcutState(), rec = state.shortcutRecording, err = state.shortcutError;
  const groups = [...new Set(SHORTCUT_ACTIONS.map(a => a.group))];
  return `<div class="stack">
    <div class="shortcut-toolbar"><label class="check-line"><input type="checkbox" data-action="shortcuts-toggle" ${s.enabled ? 'checked' : ''}><span>Keyboard shortcuts on</span></label><span class="muted small">Press <kbd>?</kbd> anywhere to see this list. Shortcuts never fire while you type in a field.</span>${action('Reset all to defaults', 'shortcuts-reset', 'btn small')}</div>
    ${groups.map(g => `<div class="shortcut-group-card"><h3>${g}</h3>${SHORTCUT_ACTIONS.filter(a => a.group === g).map(a => {
      const recording = rec === a.id, changed = b[a.id] !== a.key;
      return `<div class="shortcut-row${recording ? ' is-recording' : ''}"><span class="shortcut-label">${a.group === 'Go to' ? 'Go to ' : ''}${esc(a.label)}</span><span class="shortcut-keys">${recording ? `<span class="kbd-recording" role="status">${recordPrefix ? '<kbd>g</kbd> then…' : 'Press a key…'} <small>Esc to cancel</small></span>` : keyLabel(b[a.id])}</span><span class="shortcut-actions">${recording ? action('Cancel', 'shortcut-cancel', 'btn small') : action('Change', 'shortcut-record', 'btn small', `data-id="${a.id}" aria-label="Change shortcut for ${esc(a.label)}"`)}${changed && !recording ? action('Default', 'shortcut-default', 'btn small text', `data-id="${a.id}" aria-label="Restore default for ${esc(a.label)}" title="Default: ${esc(a.key)}"`) : ''}</span>${err && err.id === a.id ? `<p class="shortcut-error" role="alert">${err.msg}</p>` : ''}</div>`;
    }).join('')}</div>`).join('')}
    <div class="shortcut-group-card"><h3>Fixed</h3><div class="shortcut-row"><span class="shortcut-label">Close dialog or panel</span><span class="shortcut-keys"><kbd>Esc</kbd></span><span class="shortcut-actions muted small">Cannot be changed</span></div></div>
    <p class="field-help">A shortcut is one key (letter, number, or symbol), or <kbd>g</kbd> followed by one key. Each key can be used once.</p>
  </div>`;
}

function runShortcut(a) {
  switch (a.id) {
    case 'search': $('#global-search input,[name="q"]')?.focus(); return;
    case 'help': showDialog('Keyboard shortcuts', shortcutsTable(), link('Change shortcuts', 'settings/shortcuts', 'btn')); return;
    case 'theme': state.theme = ({ light: 'dark', dark: 'pure-dark', 'pure-dark': 'light' })[state.theme] || 'light'; persist(); render(); return;
    case 'chat': if (!prefs().showChat) { toast('The chat assistant is turned off in Settings → Display.'); return; } state.chatOpen = !state.chatOpen; render(); return;
    case 'kill': (killActive() || platformHalt().active ? killResumeDialog : killSwitchDialog)(); return;
    case 'execution': go('plan/selections'); render(); return;
    case 'long': case 'swing': case 'intraday': state.strategy = a.id; persist(); render(); return;
    default: if (a.route) { go(a.route); render(); }
  }
}

function finishRecording(msg) { const id = state.shortcutRecording; state.shortcutRecording = null; recordPrefix = false; state.shortcutError = msg ? { id, msg } : null; render(); $(`[data-action="shortcut-record"][data-id="${id}"]`)?.focus?.(); }

document.addEventListener('keydown', event => {
  if (state.shortcutRecording) {
    event.preventDefault();
    if (event.key === 'Escape') { finishRecording(''); return; }
    if (event.metaKey || event.ctrlKey || event.altKey) { finishRecording('Ctrl, Alt, and ⌘ combinations are kept for the browser.'); return; }
    if (['Shift', 'CapsLock'].includes(event.key)) return;
    const k = normKey(event.key);
    if (!k) { finishRecording('That key cannot be used. Choose a letter, number, or symbol.'); return; }
    if (k === 'g' && !recordPrefix) { recordPrefix = true; render(); return; }
    const combo = recordPrefix ? 'g ' + k : k, id = state.shortcutRecording, msg = setShortcut(id, combo);
    if (!msg) toast(`Shortcut saved: ${combo.replace(' ', ' then ')}.`);
    finishRecording(msg); return;
  }
  const t = event.target || {}, tag = (t.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable || event.metaKey || event.ctrlKey || event.altKey) return;
  if ($('#dialog')?.open || !shortcutState().enabled) return;
  const k = normKey(event.key); if (!k) return;
  let combo = k;
  if (shortcutPrefixAt && Date.now() - shortcutPrefixAt < 1200) { combo = 'g ' + k; shortcutPrefixAt = 0; }
  else if (k === 'g') { shortcutPrefixAt = Date.now(); return; }
  const b = shortcutBindings(), def = SHORTCUT_ACTIONS.find(a => b[a.id] === combo);
  if (!def || (!state.signedIn && !['search', 'help'].includes(def.id))) return;
  event.preventDefault(); runShortcut(def);
});

/* ---------- Idle sign-out (the backend must also expire the session) ---------- */
let lastActivity = Date.now();
['click', 'keydown', 'pointermove', 'touchstart'].forEach(type => document.addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true }));
if (typeof setInterval === 'function') setInterval(() => {
  if (!state.signedIn || Date.now() - lastActivity < prefs().sessionTimeout * 60000) return;
  state.signedIn = false; state.role = 'client'; state.sessionUser = null; persist(); location.hash = '#/session-expired';
}, 30000);

/* ---------- Listeners ---------- */
document.addEventListener('click', event => {
  const b = event.target.closest('[data-action]'); if (!b || !state.signedIn) return;
  switch (b.dataset.action) {
    case 'shortcut-record': if (SHORTCUT_ACTIONS.some(a => a.id === b.dataset.id)) { state.shortcutRecording = b.dataset.id; state.shortcutError = null; recordPrefix = false; render(); } break;
    case 'shortcut-cancel': finishRecording(''); break;
    case 'shortcut-default': { const s = shortcutState(), def = SHORTCUT_ACTIONS.find(a => a.id === b.dataset.id); if (!def) break; const clash = shortcutConflict(def.id, def.key); if (clash) { state.shortcutError = { id: def.id, msg: clash + ' Change that shortcut first.' }; render(); break; } delete s.keys[def.id]; state.shortcuts = s; state.shortcutError = null; persist(); render(); toast('Default restored.'); break; }
    case 'shortcuts-toggle': { const on = !!b.checked; state.shortcuts = { ...shortcutState(), enabled: on }; persist(); toast(on ? 'Keyboard shortcuts on.' : 'Keyboard shortcuts off.'); break; }
    case 'shortcuts-reset': showDialog('Reset all shortcuts?', '<p>Every shortcut returns to its default key.</p>', action('Cancel', 'close-dialog') + action('Reset shortcuts', 'shortcuts-reset-confirm', 'btn primary')); break;
    case 'shortcuts-reset-confirm': state.shortcuts = { enabled: shortcutState().enabled, keys: {} }; state.shortcutError = null; persist(); $('#dialog').open && $('#dialog').close(); render(); toast('Shortcuts reset to defaults.'); break;
    case 'signout-others': recordAudit('Access', 'Other sessions signed out', 'Requested from Settings → Security'); toast('Other devices will be signed out. This browser stays signed in.'); break;
  }
});
document.addEventListener('submit', event => {
  const f = event.target; if (!f.matches('form')) return;
  const name = f.dataset.form; if (!['settings-profile', 'settings-security', 'settings-password', 'settings-notify', 'settings-display'].includes(name)) return;
  event.preventDefault(); if (!state.signedIn) return;
  const data = new FormData(f), str = k => String(data.get(k) || '').trim();
  if (name === 'settings-profile') {
    const nameVal = str('name'), mobile = str('mobile');
    if (nameVal.length < 2 || nameVal.length > 40) { toast('Enter a display name of 2–40 characters.'); return; }
    if (mobile && !/^\+?[0-9][0-9\s-]{9,15}$/.test(mobile)) { toast('Enter a valid mobile number, e.g. +91 98765 43210.'); return; }
    const startPageVal = str('startPage'), strat = str('defaultStrategy'), exch = str('defaultExchange');
    if (!START_PAGES.some(([r]) => r === startPageVal) || !strategyList[strat] || !['NSE', 'BSE'].includes(exch)) { toast('Choose a start page, strategy, and exchange from the lists.'); return; }
    state.displayName = nameVal; savePrefs({ mobile, startPage: startPageVal, defaultStrategy: strat, defaultExchange: exch });
    recordAudit('Preferences', 'Profile saved', `Start page ${startPageVal} · ${strategyList[strat].name} · ${exch}`); render(); toast('Profile saved.'); return;
  }
  if (name === 'settings-security') {
    const twoStep = str('twoStep'), timeout = Number(data.get('sessionTimeout'));
    if (!['off', 'app', 'sms'].includes(twoStep) || !SESSION_TIMEOUTS.includes(timeout)) { toast('Choose a verification method and a timeout from the lists.'); return; }
    if (twoStep === 'sms' && !prefs().mobile) { toast('Add a mobile number in Profile before choosing SMS codes.'); return; }
    savePrefs({ twoStep, sessionTimeout: timeout }); recordAudit('Security', 'Security settings saved', `Two-step ${twoStep} · timeout ${timeout} min`); render(); toast('Security settings saved.'); return;
  }
  if (name === 'settings-password') {
    const cur = String(data.get('current') || ''), next = String(data.get('next') || ''), confirm = String(data.get('confirm') || '');
    if (cur.length < 8) { toast('Enter your current password.'); return; }
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) { toast('Use at least 8 characters with a letter and a number.'); return; }
    if (next === cur) { toast('The new password must be different from the current one.'); return; }
    if (next !== confirm) { toast('The new passwords do not match.'); return; }
    f.reset?.(); recordAudit('Security', 'Password change requested', 'Submitted from Settings → Security'); toast('Password change submitted. This browser never stores passwords.'); return;
  }
  if (name === 'settings-notify') {
    const notify = defaultNotify();
    for (const [id] of NOTIFY_EVENTS) for (const [k] of NOTIFY_CHANNELS) notify[id][k] = channelReady(k) && data.has(`n-${id}-${k}`);
    notify.safety.inapp = true;
    const from = str('quietFrom'), to = str('quietTo'), on = data.has('quietOn'), summary = str('dailySummary');
    if (on && (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || from === to)) { toast('Quiet hours need different start and end times.'); return; }
    if (!SUMMARY_TIMES.includes(summary)) { toast('Choose a daily summary time from the list.'); return; }
    savePrefs({ notify, dailySummary: summary, quiet: { on, from: from || '22:00', to: to || '07:00' } }); state.notifications = notify.news.inapp; persist();
    recordAudit('Preferences', 'Notification preferences saved', `${NOTIFY_EVENTS.filter(([id]) => Object.values(notify[id]).some(Boolean)).length} event types on`); render(); toast('Notification preferences saved.'); return;
  }
  if (name === 'settings-display') { if (applyDisplay(f)) toast('Display settings saved.'); }
});
