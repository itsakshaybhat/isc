'use strict';

/* The research views share the existing score model and selected review history. */
const modelFocusByStrategy = {};
const modelComponentNames = ['Business quality', 'Valuation', 'Technicals', 'Events & sentiment'];

function modelResultsData(key = state.strategy) {
  const timeline = timelineConfig(key), weights = [...strategyConfig(key).weights];
  const rows = stockData.map(company => ({ company, score: scoreAt(company, key, timeline.current.offset) }))
    .sort((a, b) => b.score.total - a.score.total);
  const focus = rows.find(row => row.company.id === modelFocusByStrategy[key]) || rows[0];
  const mean = rows.length ? rows.reduce((sum, row) => sum + row.score.total, 0) / rows.length : 0;
  const bins = Array.from({ length: 10 }, (_, index) => ({ low: index * 10, high: (index + 1) * 10, count: 0 }));
  rows.forEach(row => bins[Math.min(9, Math.floor(row.score.total / 10))].count++);
  const components = focus ? componentScores(focus.company, key, timeline.current.offset).map((value, i) => ({
    name: modelComponentNames[i], score: value, weight: weights[i], contribution: Number((value * weights[i] / 100).toFixed(2))
  })) : [];
  const history = focus ? timeline.points.slice(0, timeline.position + 1).map(point => ({
    ...point,
    value: scoreAt(focus.company, key, point.offset).total,
    mean: stockData.reduce((sum, company) => sum + scoreAt(company, key, point.offset).total, 0) / stockData.length
  })) : [];
  return { rows, weights, focus, mean, bins, components, history, timeline };
}

function modelScoreBandLabel(bin) { return bin.high === 100 ? `${bin.low}–100` : `${bin.low}–<${bin.high}`; }

function modelChartFrame(id, label, body, width, height, description) {
  return `<svg class="model-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(label)}</title><desc id="${id}-desc">${esc(description)}</desc>${body}</svg>`;
}

function modelHistoryChart(data) {
  const width = isMobileViewport() ? 340 : 560, height = 220;
  const left = 36, right = width - 18, top = 14, bottom = 180;
  const points = data.history, first = points[0], last = points.at(-1);
  if (!first) return '<p class="model-note">No review history is available.</p>';
  const span = first.offset - last.offset;
  const x = point => span ? left + (first.offset - point.offset) / span * (right - left) : (left + right) / 2;
  const y = value => bottom - value / 100 * (bottom - top);
  let body = [0, 25, 50, 75, 100].map(value => `<line class="model-gridline" x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}"/><text x="${left - 9}" y="${y(value) + 4}" text-anchor="end">${value}</text>`).join('');
  const path = field => points.map((point, i) => `${i ? 'L' : 'M'}${x(point).toFixed(2)},${y(point[field]).toFixed(2)}`).join(' ');
  body += `<path class="model-mean-line" d="${path('mean')}"/><path class="model-focus-line" d="${path('value')}"/>`;
  if (points.length === 1) body += `<circle class="model-focus-dot" cx="${x(first)}" cy="${y(first.value)}" r="3"/>`;
  const labelCount = isMobileViewport() ? 3 : 4;
  const indices = [...new Set(Array.from({ length: Math.min(labelCount, points.length) }, (_, i) => Math.round(i * (points.length - 1) / Math.max(1, Math.min(labelCount, points.length) - 1))))];
  body += indices.map((index, i) => `<text x="${x(points[index])}" y="205" text-anchor="${i === 0 ? 'start' : i === indices.length - 1 ? 'end' : 'middle'}">${esc(state.strategy === 'intraday' ? points[index].time : points[index].date)}</text>`).join('');
  body += points.map(point => `<circle class="model-hover-point" tabindex="0" cx="${x(point)}" cy="${y(point.value)}" r="6" aria-label="${esc(point.full)}: ${point.value.toFixed(1)} out of 100"><title>${esc(point.full)} · ${point.value.toFixed(1)}/100 · universe ${point.mean.toFixed(1)}/100</title></circle>`).join('');
  return modelChartFrame('model-history', `${data.focus.company.name} model score history`, body, width, height,
    `${points.length} reviews through ${last.full}. Selected company ${last.value.toFixed(1)} out of 100; universe average ${last.mean.toFixed(1)}. The vertical scale is zero to 100. Scores are research assessments, not investment returns.`);
}

function modelDistributionChart(data) {
  const width = isMobileViewport() ? 340 : 560, height = 220, left = 30, right = width - 10, top = 14, bottom = 180;
  const step = Math.max(1, Math.ceil((Math.max(...data.bins.map(bin => bin.count), 0) + 1) / 4)), max = step * 4;
  const pitch = (right - left) / 10;
  let body = Array.from({ length: 5 }, (_, i) => i * step).map(value => {
    const y = bottom - value / max * (bottom - top);
    return `<line class="model-gridline" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="${left - 8}" y="${y + 4}" text-anchor="end">${value}</text>`;
  }).join('');
  body += data.bins.map((bin, index) => {
    const barHeight = bin.count / max * (bottom - top);
    return `<rect class="model-distribution-bar" x="${left + index * pitch + 4}" y="${bottom - barHeight}" width="${pitch - 8}" height="${barHeight}"><title>${esc(modelScoreBandLabel(bin))}: ${bin.count} companies</title></rect>${index % 2 === 0 ? `<text x="${left + index * pitch + pitch / 2}" y="205" text-anchor="middle">${esc(modelScoreBandLabel(bin))}</text>` : ''}`;
  }).join('');
  return modelChartFrame('model-distribution', 'Company count by model score band', body, width, height,
    data.bins.map(bin => `${modelScoreBandLabel(bin)}: ${bin.count} companies`).join('; ') + '. Horizontal scale: model score out of 100. Vertical scale: company count. The final band includes 100.');
}

function modelRankingChart(data) {
  return `<div class="model-rank-list">${data.rows.slice(0, 6).map((row, index) => `<button type="button" class="model-rank-row" data-action="model-focus" data-id="${row.company.id}" aria-pressed="${row.company.id === data.focus.company.id}"><span class="model-rank-label"><span>${index + 1}. ${row.company.name}</span><strong>${row.score.total.toFixed(1)}<small> /100</small></strong></span><span class="model-score-track" aria-hidden="true"><span style="width:${row.score.total}%"></span></span></button>`).join('')}</div><div class="model-scale"><span>0</span><span>Model score</span><span>100</span></div>`;
}

function modelContributionChart(data) {
  return `<div class="model-contributions">${data.components.map(component => `<div><div class="model-component-label"><span>${component.name}</span><strong>${component.contribution.toFixed(2)} <small>points</small></strong></div><div class="model-weight-track" role="img" aria-label="${component.name}: ${component.score}/100 times ${component.weight}% weight equals ${component.contribution.toFixed(2)} points"><span class="model-weight-cap" style="width:${component.weight}%"></span><span class="model-weight-earned" style="width:${component.contribution}%"></span></div><div class="model-component-context"><span>${component.score}/100 × ${component.weight}% weight</span><span>of ${component.weight} possible points</span></div></div>`).join('')}</div>`;
}

function renderModelResults() {
  const data = modelResultsData();
  if (!data.focus) return title('Model results', strategy().name) + empty('No company assessments', 'No scored research is available for this strategy.');
  const lead = data.rows[0], focus = data.focus, focusRank = data.rows.indexOf(focus) + 1;
  const weighted = data.components.reduce((sum, component) => sum + component.contribution, 0);
  const topComponent = [...data.components].sort((a, b) => b.contribution - a.contribution)[0];
  const leadGap = lead.score.total - (data.rows[1]?.score.total ?? lead.score.total);
  const previous = data.history.length > 1 ? data.history.at(-2).value : null;
  const delta = previous === null ? null : Number((focus.score.total - previous).toFixed(1));
  const numeric = value => `<td class="model-numeric">${value}</td>`;
  return `<div class="model-results">${title('Model results', `${strategy().name} · ${lead.company.name} leads at ${lead.score.total.toFixed(1)}/100.`, action('Download scores', 'model-export', 'btn small', '') + link('Ranking history', 'explore', 'btn small'))}
    <p class="model-review-stamp">Ranking review: ${esc(snapshotLabel())} · Quotes: ${asOf}</p>
    <div class="model-summary" aria-label="Research universe summary"><div><span>Highest score</span><strong>${lead.score.total.toFixed(1)}<small> /100</small></strong><p>${lead.company.id}</p></div><div><span>Universe average</span><strong>${data.mean.toFixed(1)}<small> /100</small></strong><p>${data.rows.length} assessed companies</p></div><div><span>Lead over second</span><strong>${leadGap.toFixed(1)}<small> pts</small></strong><p>Same strategy and review</p></div><div><span>Current policy</span><strong>v${esc(String(strategyConfig().version ?? '1.0'))}</strong><p>Weights total ${data.weights.reduce((sum, weight) => sum + weight, 0)}%</p></div></div>
    <div class="model-focus-control"><label for="model-company">Inspect company</label><select class="field" id="model-company">${data.rows.map((row, i) => `<option value="${row.company.id}" ${row === focus ? 'selected' : ''}>${i + 1}. ${row.company.name} · ${row.score.total.toFixed(1)}/100</option>`).join('')}</select>${action('Explain result', 'model-breakdown', 'btn small', `data-id="${focus.company.id}"`)}</div>
    <div class="model-analysis-grid">${section('Highest-ranked companies', 'Six leading assessments · score scale 0–100', modelRankingChart(data))}
    ${section('What drives the score', `${focus.company.name} · rank ${focusRank} of ${data.rows.length}`, modelContributionChart(data) + `<p class="model-finding"><strong>${weighted.toFixed(2)} weighted points.</strong> ${topComponent.name} contributes the most at ${topComponent.contribution.toFixed(2)} points.</p><p class="model-note">Filled bars show earned points; the background shows the component’s maximum weight. Every bar uses the same 0–100 point scale.</p>`)}</div>
    <div class="model-analysis-grid">${section('Score through review history', `${focus.company.name} · ${data.history.length} selected reviews`, `<div class="model-chart-key"><span><i class="model-series-focus"></i>${focus.company.id}</span><span><i class="model-series-mean"></i>Universe average</span></div>${modelHistoryChart(data)}<p class="model-note">${delta === null ? 'Only one review is selected; no previous-review change is available.' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} points versus the previous review (${previous.toFixed(1)}/100).`} History ends at the selected ranking review.</p><details class="model-data-disclosure"><summary>Review values</summary>${table(['Review', 'Company /100', 'Universe /100'], data.history.map(point => `<tr><td>${esc(point.full)}</td>${numeric(point.value.toFixed(1))}${numeric(point.mean.toFixed(1))}</tr>`))}</details>`)}
    ${section('Score distribution', `${data.rows.length} companies · ten score bands`, modelDistributionChart(data) + `<p class="model-note">Company count in each band. Higher scores mean stronger alignment with this strategy’s inputs.</p><details class="model-data-disclosure"><summary>Counts by score band</summary>${table(['Score band', 'Companies'], data.bins.map(bin => `<tr><td>${esc(modelScoreBandLabel(bin))}</td>${numeric(bin.count)}</tr>`))}</details>`)}</div>
    <div class="model-analysis-grid">${section('Evidence and opposing risks', focus.company.name, `<div class="model-evidence"><h3>Research case</h3><p>${esc(rationale(focus.company))}</p><h3>Material event</h3><p>${esc(focus.company.catalyst)}</p><h3>What could change the view</h3><p>${esc(focus.company.risk)}</p>${link('Open company research', `company/${focus.company.id}/overview`, 'text-link', 'arrow')}</div>`)}
    ${section('Calculation and interpretation', 'Weighted assessment, not a return forecast', `<p class="model-note">Each component is scored from 0 to 100. Its contribution is component score × policy weight ÷ 100. Contributions sum to the weighted assessment, rounded to one decimal for ranking.</p>${table(['Component', 'Score', 'Weight', 'Points'], data.components.map(component => `<tr><td>${component.name}</td>${numeric(component.score)}${numeric(component.weight + '%')}${numeric(component.contribution.toFixed(2))}</tr>`))}<p class="model-note">A score is neither a probability nor a measured success rate. A high rank does not publish a recommendation or authorize an order. Rankings use the selected review; quote freshness is reported separately.</p>`)}</div>
    ${section('All model assessments', `${data.rows.length} companies · highest weighted score first`, table(['Rank', 'Company', 'Quality', 'Valuation', 'Technicals', 'Events', 'Score /100', 'Review'], data.rows.map((row, i) => `<tr>${numeric(i + 1)}<td>${company(row.company)}</td>${numeric(row.score.quality)}${numeric(row.score.value)}${numeric(row.score.technical)}${numeric(row.score.event)}${numeric(`<strong>${row.score.total.toFixed(1)}</strong>`)}<td>${action('Explain result', 'model-breakdown', 'text-link', `data-id="${row.company.id}"`)}</td></tr>`)), '', 'flush')}
    </div>`;
}

function exportModelScores() {
  const data = modelResultsData();
  const rows = [['Strategy', strategy().name], ['Ranking review', snapshotLabel()], ['Quote timestamp', asOf],
    ['Rank', 'Company', 'Symbol', 'Quality', 'Valuation', 'Technicals', 'Events', 'Weighted score /100', 'Quality weight %', 'Valuation weight %', 'Technicals weight %', 'Events weight %'],
    ...data.rows.map((row, i) => [i + 1, row.company.name, row.company.id, row.score.quality, row.score.value, row.score.technical, row.score.event, row.score.total.toFixed(1), ...data.weights])];
  downloadFile(`INVESTSIGHT-${state.strategy}-model-scores.csv`, csv(rows), 'text/csv;charset=utf-8');
}
