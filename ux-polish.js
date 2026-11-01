'use strict';
/* Display polish after every render: numeric table columns are right-aligned with tabular figures,
   so amounts, percentages and scores line up. Runs only in a real browser. */
(function () {
  const NUMBER = /^[−+\-–]?(?:₹|\$)?[−+\-]?\d[\d,]*(?:\.\d+)?(?:%|×|x|L|Cr|sh|pts|R)?$/;
  const cellText = cell => [...cell.childNodes].filter(n => !(n.nodeType === 1 && n.tagName === 'SMALL')).map(n => n.textContent).join(' ').replace(/\u00a0/g, ' ').trim();
  const numeric = text => { const parts = text.split(/\s*[\/·]\s*|\s+/).filter(Boolean); return parts.length > 0 && parts.length <= 3 && parts.every(p => NUMBER.test(p)); };
  function alignTable(table) {
    const rows = [...table.tBodies].flatMap(b => [...b.rows]).filter(r => ![...r.cells].some(c => c.colSpan > 1));
    if (!rows.length) return;
    const cols = Math.max(...rows.map(r => r.cells.length));
    for (let i = 1; i < cols; i++) {
      let filled = 0, nums = 0;
      for (const r of rows) { const c = r.cells[i]; if (!c) continue; const t = cellText(c); if (!t || t === '—' || t === '-') continue; filled++; if (numeric(t)) nums++; }
      if (!filled || nums / filled < 0.6) continue;
      for (const r of rows) r.cells[i]?.classList.add('num');
      const head = table.tHead?.rows[0]?.cells[i]; if (head) head.classList.add('num');
    }
  }
  function polish(root) { root.querySelectorAll('table').forEach(alignTable); }
  if (typeof MutationObserver !== 'function' || typeof document.getElementById !== 'function') return;
  const start = () => { const app = document.getElementById('app'); if (!app) return; polish(app); new MutationObserver(() => polish(app)).observe(app, { childList: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
