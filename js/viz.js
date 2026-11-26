/* Power BI Quest — moteur de visuels : requêtes, agrégations, cartes, tableaux, graphiques, segments, volets */
(function () {
'use strict';
const PBI = window.PBI;
const { h, esc, fr, eur, nfmt, dfr, $, $$, clone, shake } = window.PBQ;
const NB = ' ';
const P_ = PBI.prototype;
const NUM = ['int', 'dec', 'fixed', 'pct'];

/* ───────── Agrégations ───────── */
const AGG = { sum: 'Somme', avg: 'Moyenne', min: 'Minimum', max: 'Maximum', count: 'Nombre', countd: 'Nombre (distinct)', none: 'Ne pas résumer', first: 'Premier', last: 'Dernier' };
const aggOptions = t => NUM.includes(t) ? ['sum', 'avg', 'min', 'max', 'count', 'countd', 'none'] : ['first', 'last', 'count', 'countd', 'none'];
function aggregate(vals, agg, t) {
  const nn = vals.filter(v => v !== null && v !== undefined && v !== '' && !(typeof v === 'object'));
  switch (agg) {
    case 'sum': { if (!nn.length) return null; const s = nn.reduce((a, b) => a + Math.round(b * 1e4), 0); return s / 1e4; }
    case 'avg': return nn.length ? nn.reduce((a, b) => a + b, 0) / nn.length : null;
    case 'min': return nn.length ? nn.reduce((a, b) => (b < a ? b : a)) : null;
    case 'max': return nn.length ? nn.reduce((a, b) => (b > a ? b : a)) : null;
    case 'count': return nn.length || null;
    case 'countd': return nn.length ? new Set(nn.map(String)).size : null;
    case 'first': return nn.length ? [...nn].sort(cmp)[0] : null;
    case 'last': return nn.length ? [...nn].sort(cmp)[nn.length - 1] : null;
    default: return nn[0] ?? null;
  }
}
const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b), 'fr', { numeric: true });
const fieldLabel = f => f.as || (f.agg === 'none' || !f.agg ? f.c : f.agg === 'countd' ? `Nombre distinct de ${f.c}` : `${AGG[f.agg]} de ${f.c}`);

/* ───────── Filtres ───────── */
function rowOk(r, f) {
  if (f.kind === 'range') {
    const v = r[f.c];
    if ((f.min != null || f.max != null) && (v === null || v === undefined || v === '')) return false;
    if (f.min != null && (f.minOp === 'gt' ? !(v > f.min) : f.minOp === 'eq' ? v !== f.min : v < f.min)) return false;
    if (f.max != null && (f.maxOp === 'lt' ? !(v < f.max) : v > f.max)) return false;
    return true;
  }
  if (!f.values || !f.values.length) return true;
  const x = f.hier && typeof r[f.c] === 'string' ? r[f.c].slice(0, 4) : r[f.c];
  return f.invert ? !f.values.includes(x) : f.values.includes(x);
}
/* Tous les filtres qui s'appliquent au visuel v : rapport, page, visuel, segments, sélection croisée */
P_.filtersFor = function (v, page) {
  const P = this.P, pg = page || P.pages.find(p => p.visuals.includes(v)) || this.page();
  const out = [];
  (P.filters || []).forEach(f => out.push(f));
  (pg.filters || []).forEach(f => out.push(f));
  (v.filters || []).forEach(f => out.push(f));
  for (const s of [...pg.visuals, ...(P.syncSlicers || [])]) {
    if (s === v || s.type !== 'slicer' || !s.f.values[0]) continue;
    if (s.sync && s.sync.length && !s.sync.includes(pg.id) && !pg.visuals.includes(s)) continue;
    if (!pg.visuals.includes(s) && !(s.sync || []).includes(pg.id)) continue;
    const fl = s.f.values[0];
    if (this.inter(s, v) === 'none') continue;
    if (s.sel && s.sel.kind === 'range') out.push({ t: fl.t, c: fl.c, kind: 'range', min: s.sel.min, max: s.sel.max, from: s.id });
    else if (s.sel && s.sel.values && s.sel.values.length) out.push({ t: fl.t, c: fl.c, kind: 'basic', values: s.sel.values, from: s.id, hier: fl.hier && colType(P, fl) === 'date' });
  }
  if (v.type !== 'slicer') {
    const xs = this.st && this.st.xsel;
    const src = xs && xs.page === pg.id && xs.vis !== v.id && pg.visuals.find(o => o.id === xs.vis);
    if (src) {
      const inter = this.inter(src, v);
      if (inter !== 'none') out.push({ t: xs.t, c: xs.c, kind: 'basic', values: [xs.value], from: xs.vis, hl: inter === 'highlight', extra: xs.extra });
    }
  }
  return out;
};
const tableOf = (P, id) => P.tables.find(t => t.id === id);
const colType = (P, f) => { const t = tableOf(P, f.t); const c = t && t.cols.find(c => c.n === f.c); return c ? c.t : 'text'; };

/* ───────── Requête d'un visuel ───────── */
P_.query = function (v, opts = {}) {
  const P = this.P;
  const F = v.f || {};
  const all = [...(F.axis || []), ...(F.legend || []), ...(F.cols || []), ...(F.values || [])];
  if (!all.length) return null;
  const tid = all[0].t, T = tableOf(P, tid);
  if (!T) return null;
  const filters = (opts.filters || this.filtersFor(v)).filter(f => f.t === tid && !f.hl);
  const rows = T.rows.filter(r => filters.every(f => rowOk(r, f) && (!f.extra || f.extra.every(e => r[e.c] === e.value))));
  const hl = (opts.filters || this.filtersFor(v)).filter(f => f.t === tid && f.hl);
  return { T, rows, hl, tid };
};
/* Valeur d'une agrégation sur un ensemble de lignes */
const val = (rows, f) => f.agg === 'none' ? (rows[0] ? rows[0][f.c] : null) : aggregate(rows.map(r => r[f.c]), f.agg);

/* Hiérarchie de dates automatique */
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const hierParts = iso => { const y = iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10); return { Année: y, Trimestre: 'Trimestre ' + Math.ceil(m / 3), Mois: MOIS[m - 1], Jour: String(d) }; };

/* ───────── Mise en forme des valeurs ───────── */
P_.fmtValue = function (f, x, vfmt = {}, ctx = 'table') {
  if (x === null || x === undefined) return '';
  const P = this.P, t = colType(P, f), base = P.formats[`${f.t}.${f.c}`] || {};
  if (f.agg === 'count' || f.agg === 'countd') return unitize(x, vfmt.units, 0, ctx, '');
  if (!NUM.includes(t)) { if (typeof x === 'number' && f.agg !== 'none' && f.agg !== 'first' && f.agg !== 'last') return nfmt(x); return PBI.show(x, t, base).s; }
  const cur = base.style === 'currency' ? (base.cur === 'USD' ? '$' : '€') : '';
  let dec = vfmt.dec != null ? vfmt.dec : base.style === 'currency' ? (base.dec ?? 2) : f.agg === 'avg' ? 2 : (Number.isInteger(x) ? 0 : 2);
  return unitize(x, vfmt.units, dec, ctx, cur);
};
function unitize(x, units, dec, ctx, cur) {
  let u = units || (ctx === 'card' ? 'auto' : 'none'), suf = '';
  if (u === 'auto') u = Math.abs(x) >= 1e6 ? 'M' : Math.abs(x) >= 1e3 ? 'k' : 'none';
  if (u === 'k') { x = x / 1e3; suf = NB + 'k'; dec = 2; } else if (u === 'M') { x = x / 1e6; suf = NB + 'M'; dec = 2; }
  const s = x.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/[  ]/g, NB);
  return s + suf + (cur ? (suf ? '' : NB) + cur : '');
}

/* ───────── Rendus ───────── */
const R = {};
R.card = function (el, v) {
  const f = (v.f.values || [])[0];
  const lab = v.title || (f ? fieldLabel(f) : '');
  if (!f) { el.appendChild(h(`<div class="v-empty">${I_card}<span>Carte</span></div>`)); return; }
  const q = this.query(v);
  const x = q ? val(q.rows, f) : null;
  const s = x === null ? '(Vide)' : this.fmtValue(f, x, v.fmt || {}, 'card');
  el.appendChild(h(`<div class="v-card" style="width:100%; height:100%"><b>${esc(s)}</b><span>${esc(lab)}</span></div>`));
};
R.table = function (el, v) {
  const cols = v.f.cols || [];
  if (!cols.length) { el.appendChild(h(`<div class="v-empty">${I_table}<span>Tableau</span></div>`)); return; }
  const res = this.tableData(v);
  const sortI = v.sort ? v.sort.i : -1;
  const s2 = v.sort2 ? v.sort2.i : -1, two = s2 >= 0;
  const head = res.cols.map((c, i) => `<th class="${c.num ? 'r' : ''}" data-a="thsort:${v.id}|${i}">${esc(c.label)}${sortI === i ? `<i class="srt">${v.sort.dir === 'desc' ? '▼' : '▲'}${two ? '1' : ''}</i>` : s2 === i ? `<i class="srt">${v.sort2.dir === 'desc' ? '▼' : '▲'}2</i>` : ''}</th>`).join('');
  const body = res.rows.map((r, ri) => `<tr data-a="trowsel:${v.id}|${ri}">${r.map((x, i) => `<td class="${res.cols[i].num ? 'r' : ''}">${esc(x)}</td>`).join('')}</tr>`).join('');
  const tot = res.total ? `<tr class="tot">${res.total.map((x, i) => `<td class="${res.cols[i].num ? 'r' : ''}">${esc(x)}</td>`).join('')}</tr>` : '';
  el.appendChild(h(`<div class="v-table ${(v.fmt || {}).zebra ? 'zebra' : ''} ${this.st.sortMode === 'secondary' && this.st.selVis === v.id ? 'sorting2' : ''}">${v.title ? `<div class="v-title">${esc(fr(v.title))}</div>` : ''}<div class="vt-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}${tot}</tbody></table></div></div>`));
};
/* Données d'un tableau : colonnes de détail (Ne pas résumer) et colonnes agrégées */
P_.tableData = function (v) {
  const P = this.P, q = this.query(v);
  const fields = [];
  for (const f of v.f.cols || []) {
    if (colType(P, f) === 'date' && f.hier) ['Année', 'Trimestre', 'Mois', 'Jour'].forEach(part => fields.push({ ...f, part, agg: 'none', label: part }));
    else fields.push({ ...f, label: fieldLabel(f) });
  }
  const dims = fields.filter(f => f.agg === 'none'), meas = fields.filter(f => f.agg !== 'none');
  const key = (r, f) => f.part ? hierParts(r[f.c])[f.part] : r[f.c];
  let groups;
  if (!q) groups = [];
  else if (!dims.length) groups = [{ rows: q.rows }];
  else {
    const m = new Map();
    for (const r of q.rows) { const k = JSON.stringify(dims.map(d => key(r, d))); if (!m.has(k)) m.set(k, { rows: [], k: dims.map(d => key(r, d)) }); m.get(k).rows.push(r); }
    groups = [...m.values()];
  }
  let data = groups.map(g => fields.map(f => f.agg === 'none' ? key(g.rows[0], f) : val(g.rows, f)));
  const si = v.sort ? v.sort.i : -1, si2 = v.sort2 ? v.sort2.i : -1;
  const order = [];
  if (si >= 0 && si < fields.length) order.push([si, v.sort.dir]);
  if (si2 >= 0 && si2 < fields.length) order.push([si2, v.sort2.dir]);
  if (!order.length) order.push([0, 'asc']);
  data.sort((a, b) => { for (const [i, d] of order) { const c = cmp(a[i], b[i]); if (c) return d === 'desc' ? -c : c; } return 0; });
  const vf = v.fmt || {};
  const cols = fields.map(f => ({ label: f.label, num: (NUM.includes(colType(P, f)) && !f.part) || f.agg === 'count' || f.agg === 'countd', f }));
  const rows = data.map(r => r.map((x, i) => fields[i].part ? x : this.fmtValue(fields[i], x, vf.cols && vf.cols[i] || {}, 'table')));
  const total = meas.length && q && vf.total !== false ? fields.map((f, i) => i === 0 && f.agg === 'none' ? 'Total' : f.agg === 'none' ? '' : this.fmtValue(f, val(q.rows, f), vf.cols && vf.cols[i] || {}, 'table')) : null;
  return { cols, rows, total, raw: data, fields };
};
/* Graphiques : catégories (axe), séries (légende) et valeurs */
P_.chartData = function (v) {
  const P = this.P, ax = (v.f.axis || [])[0], lg = (v.f.legend || [])[0], vs = v.f.values || [];
  if (!ax || !vs.length) return null;
  const q = this.query(v); if (!q) return null;
  const isHier = colType(P, ax) === 'date' && ax.hier;
  const key = r => isHier ? hierParts(r[ax.c]).Année : r[ax.c];
  let cats = [...new Set(q.rows.map(key))];
  const sortCats = () => cats.sort(cmp);
  const series = lg ? [...new Set(q.rows.map(r => r[lg.c]))].sort(cmp) : vs.map(f => fieldLabel(f));
  const valueOf = (cat, s, f) => { const rs = q.rows.filter(r => key(r) === cat && (!lg || r[lg.c] === s)); return rs.length ? (val(rs, f) ?? 0) : 0; };
  const out = series.map((s, k) => ({ name: String(s), values: [] }));
  sortCats();
  const tot = c => lg ? series.reduce((a, s) => a + valueOf(c, s, vs[0]), 0) : valueOf(c, null, vs[0]);
  if (v.sort && v.sort.by === 'value') cats.sort((a, b) => v.sort.dir === 'asc' ? tot(a) - tot(b) : tot(b) - tot(a));
  else if (v.sort && v.sort.by === 'axis' && v.sort.dir === 'desc') cats.reverse();
  out.forEach((s, k) => { s.values = cats.map(c => lg ? valueOf(c, series[k], vs[0]) : valueOf(c, null, vs[k])); });
  const catLabel = c => isHier ? String(c) : colType(P, ax) === 'date' ? dfr(c).slice(0, 5) : String(c);
  // Mise en évidence croisée : part filtrée en couleur pleine
  let hlv = null;
  if (q.hl.length) {
    const sub = q.rows.filter(r => q.hl.every(f => rowOk(r, f) && (!f.extra || f.extra.every(e => r[e.c] === e.value))));
    hlv = out.map((s, k) => cats.map(c => { const rs = sub.filter(r => key(r) === c && (!lg || r[lg.c] === series[k])); return rs.length ? (val(rs, vs[lg ? 0 : k]) ?? 0) : 0; }));
  }
  return { cats, catLabels: cats.map(catLabel), series: out, hlv, ax, lg, vs };
};
const CHARTS = { column: 'column', bar: 'bar', stacked: 'stacked', stacked100: 'stacked100', line: 'line', stackedbar: 'stackedbar' };
const pctFmt = x => Math.round(x).toLocaleString('fr-FR') + NB + '%';
for (const k of Object.keys(CHARTS)) R[k] = function (el, v) {
  const d = this.chartData(v);
  if (!d) { el.appendChild(h(`<div class="v-empty">${ICONS[k]}<span>${esc(VNAME[k])}</span></div>`)); return; }
  const fm = v.fmt || {}, cols = fm.colors || {};
  const f0 = d.vs[0];
  const p100 = k === 'stacked100';
  let series = d.series;
  if (p100) { const tot = d.cats.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0)); series = series.map(s => ({ ...s, values: s.values.map((x, i) => tot[i] ? x / tot[i] * 100 : 0) })); }
  PBI.renderChart(el, {
    kind: k === 'stackedbar' ? 'bar' : p100 ? 'stacked' : k, stackedBar: k === 'stackedbar', title: v.title === undefined || v.title === null ? defaultTitle(d) : v.title,
    cats: d.catLabels, series: series.map((s, i) => ({ name: s.name, values: s.values, color: cols[s.name] || (fm.color && !d.lg ? fm.color : null) })),
    labels: !!fm.labels, legend: !!d.lg, showLegend: fm.legend !== false, totals: !!fm.totals && !p100, axisTitle: fm.axisTitle || '',
    fmt: p100 ? pctFmt : x => this.fmtValue(f0, x, { dec: fm.dec, units: fm.units || 'none' }, 'chart'),
    max: p100 ? 100 : undefined, ticks: p100 ? [0, 25, 50, 75, 100] : undefined, tickFmt: p100 ? pctFmt : undefined,
    min: fm.zero === false && !p100 ? Math.max(0, Math.floor(Math.min(...d.series.flatMap(s => s.values)) * .9)) : 0, hl: d.hlv, sel: this.st.xsel && this.st.xsel.vis === v.id ? this.st.xsel : null
  });
  $$('rect[data-seg]', el).forEach(r => { r.dataset.a = `seg:${v.id}|${r.dataset.seg}`; });
  const xs = this.st.xsel;
  if (xs && xs.vis === v.id && xs.tipRows) {
    const area = $('.ch-area', el), r = $(`rect[data-seg="${xs.i}|${xs.k}"]`, el);
    if (area && r) {
      const rx = +r.getAttribute('x'), ry = +r.getAttribute('y'), rw = +r.getAttribute('width'), rh = +r.getAttribute('height');
      const right = rx + rw / 2 > 55, top = Math.min(86, Math.max(14, ry + rh / 2));
      const tip = h(`<div class="v-tip ${right ? 'l' : 'r'}" style="${right ? `right:${(100 - rx).toFixed(2)}%` : `left:${(rx + rw).toFixed(2)}%`}; top:${top.toFixed(2)}%">${xs.tipRows.map(([a, b]) => `<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`);
      area.appendChild(tip);
    }
  }
};
const defaultTitle = d => `${d.vs.map(fieldLabel).join(' et ')} par ${d.ax.c}${d.lg ? ' et ' + d.lg.c : ''}`;
R.slicer = function (el, v) {
  const f = (v.f.values || [])[0];
  if (!f) { el.appendChild(h(`<div class="v-empty">${ICONS.slicer}<span>Segment</span></div>`)); return; }
  const P = this.P, T = tableOf(P, f.t), t = colType(P, f);
  const vals = [...new Set(T.rows.map(r => r[f.c]))].sort(cmp);
  const title = v.title || f.c;
  if (v.mode === 'range') {
    const sel = v.sel && v.sel.kind === 'range' ? v.sel : { min: vals[0], max: vals[vals.length - 1] };
    el.appendChild(h(`<div class="v-slicer"><div class="vs-h">${esc(title)}</div><div class="vs-range"><button data-a="slrange:${v.id}|min">${esc(PBI.show(sel.min, t, P.formats[f.t + '.' + f.c] || {}).s)}</button><span>à</span><button data-a="slrange:${v.id}|max">${esc(PBI.show(sel.max, t, P.formats[f.t + '.' + f.c] || {}).s)}</button></div><div class="vs-track"><i style="left:${pos(vals, sel.min)}%; right:${100 - pos(vals, sel.max)}%"></i></div></div>`));
    return;
  }
  const on = v.sel && v.sel.values || [];
  el.appendChild(h(`<div class="v-slicer"><div class="vs-h">${esc(title)}${on.length ? `<button class="vs-clear" data-a="slclear:${v.id}" aria-label="Effacer les sélections">✕</button>` : ''}</div><div class="vs-list">${vals.map(x => `<button class="vs-it ${on.includes(x) ? 'on' : ''}" data-a="slpick:${v.id}|${esc(String(x))}"><i></i>${esc(PBI.show(x, t, P.formats[f.t + '.' + f.c] || {}).s)}</button>`).join('')}</div></div>`));
};
const pos = (vals, x) => { const i = vals.indexOf(x); return vals.length > 1 ? Math.max(0, i) / (vals.length - 1) * 100 : 0; };
R.text = function (el, v) { el.appendChild(h(`<div class="v-text" style="${v.fmt && v.fmt.size ? `font-size:${v.fmt.size}cqi;` : ''}${v.fmt && v.fmt.color ? `color:${v.fmt.color};` : ''}${v.fmt && v.fmt.bold ? 'font-weight:700;' : ''}">${esc(fr(v.text || ''))}</div>`)); };
R.shape = function (el, v) { el.appendChild(h(`<div class="v-shape" style="background:${v.fmt && v.fmt.fill || '#141B3C'}; border-radius:${v.fmt && v.fmt.radius || 0}px"></div>`)); };
R.button = function (el, v) {
  const pg = this.P.pages.find(p => p.id === v.dest);
  el.appendChild(h(`<div class="v-button ${v.dest === this.P.activePage ? 'on' : ''}">${esc(fr(v.text || (pg ? pg.name : 'Bouton')))}</div>`));
};
R.navigator = function (el, v) {
  el.appendChild(h(`<div class="v-nav">${this.P.pages.map(p => `<span class="${p.id === this.P.activePage ? 'on' : ''}" data-a="navgo:${v.id}|${p.id}">${esc(p.name)}</span>`).join('')}</div>`));
};
P_.renderers = R;

/* ───────── Volet Visualisations ───────── */
const VNAME = { card: 'Carte', table: 'Tableau', bar: 'Graphique à barres groupées', column: 'Histogramme groupé', stacked: 'Histogramme empilé', stacked100: 'Histogramme empilé 100 %', stackedbar: 'Graphique à barres empilées', line: 'Graphique en courbes', slicer: 'Segment' };
const I_card = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M6 12V8.5l-1 .8M9 8.6c.4-.4 2-.6 2 .6 0 1-2 1.6-2 2.8h2.2M13.2 8.4h1.8l-1 1.4c1 0 1.4.6 1.1 1.3-.3.7-1.5.8-2 .3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const I_table = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3.5" width="14" height="13" rx="1.2"/><path d="M3 7.8h14M3 12.1h14M8 3.5v13"/></svg>';
const ICONS = {
  card: I_card, table: I_table,
  bar: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="3.5" width="9" height="3" rx=".5"/><rect x="3" y="8.5" width="14" height="3" rx=".5"/><rect x="3" y="13.5" width="6" height="3" rx=".5"/></svg>',
  column: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3.5" y="9" width="3" height="8" rx=".5"/><rect x="8.5" y="4" width="3" height="13" rx=".5"/><rect x="13.5" y="11" width="3" height="6" rx=".5"/></svg>',
  stacked: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3.5" y="9" width="3" height="8" rx=".5"/><rect x="8.5" y="4" width="3" height="13" rx=".5" opacity=".55"/><rect x="8.5" y="10" width="3" height="7" rx=".5"/><rect x="13.5" y="7" width="3" height="10" rx=".5" opacity=".55"/><rect x="13.5" y="12" width="3" height="5" rx=".5"/></svg>',
  stacked100: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3.5" y="3" width="3" height="14" rx=".5" opacity=".55"/><rect x="3.5" y="9" width="3" height="8" rx=".5"/><rect x="8.5" y="3" width="3" height="14" rx=".5" opacity=".55"/><rect x="8.5" y="12" width="3" height="5" rx=".5"/><rect x="13.5" y="3" width="3" height="14" rx=".5" opacity=".55"/><rect x="13.5" y="7" width="3" height="10" rx=".5"/></svg>',
  stackedbar: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="3.5" width="14" height="3" rx=".5" opacity=".55"/><rect x="3" y="3.5" width="8" height="3" rx=".5"/><rect x="3" y="8.5" width="11" height="3" rx=".5" opacity=".55"/><rect x="3" y="8.5" width="5" height="3" rx=".5"/><rect x="3" y="13.5" width="7" height="3" rx=".5"/></svg>',
  line: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15l4-5 3.5 3L17 5"/></svg>',
  slicer: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M6 7h8M6 10h8M6 13h5" stroke-linecap="round"/><circle cx="14.5" cy="13" r="1.2" fill="currentColor"/></svg>'
};
const WELLS = {
  card: [['values', 'Champs', 1]],
  table: [['cols', 'Colonnes', 12]],
  bar: [['axis', 'Axe Y', 1], ['values', 'Axe X', 3], ['legend', 'Légende', 1]],
  stackedbar: [['axis', 'Axe Y', 1], ['values', 'Axe X', 1], ['legend', 'Légende', 1]],
  column: [['axis', 'Axe X', 1], ['values', 'Axe Y', 3], ['legend', 'Légende', 1]],
  stacked: [['axis', 'Axe X', 1], ['values', 'Axe Y', 1], ['legend', 'Légende', 1]],
  stacked100: [['axis', 'Axe X', 1], ['values', 'Axe Y', 1], ['legend', 'Légende', 1]],
  line: [['axis', 'Axe X', 1], ['values', 'Axe Y', 3], ['legend', 'Légende', 1]],
  slicer: [['values', 'Champ', 1]]
};
P_.vizTypes = ['card', 'table', 'bar', 'stackedbar', 'column', 'stacked', 'stacked100', 'line', 'slicer'];
const CHART_T = ['bar', 'column', 'stacked', 'stacked100', 'stackedbar', 'line'];
P_.vizPane = function () {
  const st = this.st, v = this.selVisual();
  const box = h(`<div class="vz"></div>`);
  const gal = h(`<div class="vz-gal" role="toolbar" aria-label="Types de visuels">${this.vizTypes.map(t => `<button class="vz-t ${v && v.type === t ? 'on' : ''}" data-a="vtype:${t}" aria-label="${esc(VNAME[t])}" title="${esc(VNAME[t])}">${ICONS[t]}</button>`).join('')}</div>`);
  box.appendChild(gal);
  if (!v || !WELLS[v.type]) { box.appendChild(h(`<p class="vz-hint">${esc(fr(v ? 'Ce visuel se règle depuis le ruban Insertion.' : 'Touche un type de visuel pour en créer un, ou sélectionne un visuel sur le canevas.'))}</p>`)); return box; }
  const tab = st.vzTab || 'champs';
  box.appendChild(h(`<div class="vz-sub"><b>${esc(VNAME[v.type])}</b><span class="vz-tabs"><button class="${tab === 'champs' ? 'on' : ''}" data-a="vztab:champs">Champs</button><button class="${tab === 'format' ? 'on' : ''}" data-a="vztab:format">Format</button></span></div>`));
  if (tab === 'champs') {
    for (const [w, lab, max] of WELLS[v.type]) {
      const list = v.f[w] || [];
      const well = h(`<div class="well"><span class="well-h">${esc(lab)}</span></div>`);
      list.forEach((f, i) => well.appendChild(h(`<button class="chip-f" data-a="chip:${w}|${i}"><span>${esc(colType(this.P, f) === 'date' && f.hier && (w !== 'values' || v.type === 'slicer') ? f.c + ' (hiérarchie)' : fieldLabel(f))}</span>${PBI.I.chev}</button>`)));
      if (list.length < max) well.appendChild(h(`<button class="well-add" data-a="well:${w}">+ Ajouter un champ</button>`));
      box.appendChild(well);
    }
  } else box.appendChild(this.formatPane(v));
  return box;
};
P_.selVisual = function () { const pg = this.page(); return pg && pg.visuals.find(x => x.id === this.st.selVis); };

/* Volet Format : options selon le type de visuel */
P_.formatPane = function (v) {
  const fm = v.fmt || (v.fmt = {});
  const box = h(`<div class="fmt"></div>`);
  const row = (lab, ctl) => { const r = h(`<div class="fmt-r"><span>${esc(lab)}</span></div>`); r.appendChild(ctl); box.appendChild(r); };
  const sel = (key, items, cur) => h(`<button class="sel-box" data-a="fmtsel:${key}">${esc((items.find(i => i[0] === cur) || items[0])[1])}</button>`);
  const tog = (key, on) => h(`<button class="tog ${on ? 'on' : ''}" data-a="fmttog:${key}" role="switch" aria-checked="${on}"><i></i></button>`);
  const titleIn = h(`<input class="fmt-in" data-f="title" value="${esc(v.title || '')}" placeholder="${esc(this.autoTitle(v))}" aria-label="Titre" spellcheck="false">`);
  titleIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); titleIn.blur(); } });
  titleIn.addEventListener('change', () => this.setFmt(v, 'title', titleIn.value.trim()));
  row('Titre', titleIn);
  if (v.type === 'card') {
    row('Unités d’affichage', sel('units', FMT_UNITS, fm.units || 'auto'));
    row('Décimales', sel('dec', FMT_DEC, fm.dec == null ? 'auto' : String(fm.dec)));
  }
  if (CHART_T.includes(v.type)) {
    row('Étiquettes de données', tog('labels', !!fm.labels));
    if (v.type === 'stacked' || v.type === 'stackedbar') row('Étiquettes de total', tog('totals', !!fm.totals));
    if ((v.f.legend || []).length) row('Légende', tog('legend', fm.legend !== false));
    if (v.type !== 'stacked100') {
      row('Axe des valeurs à zéro', tog('zero', fm.zero !== false));
      row('Décimales', sel('dec', FMT_DEC, fm.dec == null ? 'auto' : String(fm.dec)));
      row('Unités d’affichage', sel('units', FMT_UNITS, fm.units || 'none'));
    }
    const at = h(`<input class="fmt-in" data-f="axisTitle" value="${esc(fm.axisTitle || '')}" placeholder="Aucun" aria-label="Titre de l’axe des valeurs" spellcheck="false">`);
    at.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); at.blur(); } });
    at.addEventListener('change', () => this.setFmt(v, 'axisTitle', at.value.trim()));
    row('Titre de l’axe des valeurs', at);
    const xs0 = this.st.xsel; this.st.xsel = null;
    const d = this.chartData(v);
    this.st.xsel = xs0;
    if (d) {
      const sw = h(`<div class="swatches"></div>`);
      d.series.forEach((s, i) => sw.appendChild(h(`<button class="sw-it" data-a="fmtcol:${esc(s.name)}"><i style="background:${(fm.colors || {})[s.name] || (fm.color && !d.lg ? fm.color : PBI.PAL[i % PBI.PAL.length])}"></i>${esc(s.name)}${PBI.I.chev}</button>`)));
      row('Couleurs', sw);
    }
  }
  if (v.type === 'table') { row('Ligne de total', tog('total', fm.total !== false)); row('Lignes alternées', tog('zebra', !!fm.zebra)); }
  if (v.type === 'slicer' && this.slicerFormat) this.slicerFormat(v, row, sel, tog);
  return box;
};
const FMT_UNITS = [['auto', 'Auto'], ['none', 'Aucune'], ['k', 'Milliers'], ['M', 'Millions']];
const FMT_DEC = [['auto', 'Auto'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']];
P_.autoTitle = function (v) {
  if (v.type === 'card') { const f = v.f.values[0]; return f ? fieldLabel(f) : 'Titre'; }
  const d = CHART_T.includes(v.type) ? this.chartData(v) : null;
  return d ? defaultTitle(d) : 'Titre';
};
P_.setFmt = function (v, key, value) {
  const r = this.emit('viz.fmt', { vis: v.id, key, value, v });
  if (r === 'no') { this.render(); return false; }
  if (key === 'title') v.title = value || null;
  else if (key === 'mode') { v.mode = value; v.sel = null; }
  else (v.fmt || (v.fmt = {}))[key] = value;
  this.P.dirty = true; this.render();
  this.emit('viz.change', { what: 'fmt', vis: v.id, key, value });
  return true;
};

/* Ajout d'un visuel dans un emplacement libre de la page */
P_.slots = [[2, 6, 30, 42], [34, 6, 30, 42], [2, 52, 30, 42], [34, 52, 30, 42], [67, 6, 31, 42], [67, 52, 31, 42], [67, 66, 31, 30]];
const hits = (v, s) => v.x < s[0] + s[2] - .5 && s[0] < v.x + v.w - .5 && v.y < s[1] + s[3] - .5 && s[1] < v.y + v.h - .5;
P_.addVisual = function (type, at) {
  const pg = this.page(); if (!pg) return null;
  let n = 1; while (pg.visuals.some(v => v.id === 'vis_new_' + n) || this.P.pages.some(p => p.visuals.some(v => v.id === 'vis_new_' + n))) n++;
  const free = at || (pg.slots || this.slots).find(s => !pg.visuals.some(v => hits(v, s))) || [26, 28, 48, 44];
  const v = { id: 'vis_new_' + n, type, x: free[0], y: free[1], w: free[2], h: free[3], f: { values: [], axis: [], legend: [], cols: [] }, title: null, fmt: {}, temp: true };
  pg.visuals.push(v); this.st.selVis = v.id; this.st.vzTab = 'champs'; this.P.dirty = true;
  return v;
};
P_.delVisual = function (id) {
  for (const p of this.P.pages) { const i = p.visuals.findIndex(v => v.id === id); if (i >= 0) p.visuals.splice(i, 1); }
  if (this.st.selVis === id) this.st.selVis = null;
  if (this.st.xsel && this.st.xsel.vis === id) this.st.xsel = null;
  this.P.dirty = true;
};
P_.newPage = function (name) {
  let n = this.P.pages.length + 1, id;
  do { id = 'page_' + String(n).padStart(3, '0'); n++; } while (this.P.pages.some(p => p.id === id));
  const pg = { id, name: name || 'Page ' + (this.P.pages.length + 1), visuals: [], filters: [] };
  this.P.pages.push(pg); this.P.activePage = id; this.st.selVis = null; this.P.dirty = true;
  return pg;
};
/* Ajout d'un champ dans un puits du visuel */
P_.addField = function (v, well, tid, c) {
  const t = colType(this.P, { t: tid, c });
  const num = NUM.includes(t);
  const agg = well === 'values' ? (v.type === 'slicer' ? 'none' : num ? 'sum' : (v.type === 'card' ? 'first' : 'count')) : (well === 'cols' ? (num ? 'sum' : 'none') : 'none');
  const f = { t: tid, c, agg };
  if (t === 'date' && (well !== 'values' || v.type === 'slicer')) f.hier = true;
  const r = this.emit('well.add', { vis: v.id, well, field: f, v });
  if (r === 'no') return false;
  const max = (WELLS[v.type].find(w => w[0] === well) || [])[2] || 1;
  const list = v.f[well] || (v.f[well] = []);
  if (list.length >= max) list.splice(max - 1);
  list.push(f);
  this.P.dirty = true; this.render();
  this.emit('viz.change', { what: 'add', vis: v.id, well, field: f });
  return true;
};
/* Menu des champs disponibles */
P_.fieldMenu = function (anchor, onPick) {
  const items = [];
  for (const t of this.P.tables) { items.push(t.name); t.cols.forEach(c => items.push([t.id + '|' + c.n, c.n, false, NUM.includes(c.t) ? 'Σ' : c.t === 'date' ? '▦' : ''])); }
  this.menu(anchor, items, k => { const [tid, c] = k.split('|'); onPick(tid, c); });
};

/* ───────── Clics propres aux visuels ───────── */
P_.extraClick = function (a, v, b, e) {
  const st = this.st;
  switch (a) {
    case 'vtype': {
      const cur = this.selVisual();
      if (cur && WELLS[cur.type] && WELLS[v]) {
        if (this.emit('viz.type', { type: v, vis: cur.id, v: cur }) === 'no') { shake(b); return; }
        convertVisual(cur, v); this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'type', vis: cur.id, type: v }); return;
      }
      if (this.emit('viz.create', { type: v }) === 'no') { shake(b); return; }
      const nv = this.addVisual(v); this.render(); this.emit('viz.change', { what: 'create', vis: nv.id, type: v });
      return;
    }
    case 'vztab': st.vzTab = v; this.render(); return;
    case 'well': { const vis = this.selVisual(); if (!vis) return; this.fieldMenu(b, (tid, c) => this.addField(vis, v, tid, c)); return; }
    case 'chip': {
      const vis = this.selVisual(); if (!vis) return;
      const [w, i] = v.split('|'); const f = vis.f[w][+i]; const t = colType(this.P, f);
      const items = [];
      if (t === 'date' && (w !== 'values' || vis.type === 'slicer')) items.push([f.hier ? 'raw' : 'hier', f.hier ? f.c : 'Hiérarchie de dates'], '-');
      if (w === 'values' || w === 'cols') { items.push('Résumer'); aggOptions(t).forEach(k => items.push(['agg:' + k, AGG[k], f.agg === k])); items.push('-'); }
      if (w === 'cols' && vis.f.cols.length > 1) { if (+i > 0) items.push(['up', 'Monter']); if (+i < vis.f.cols.length - 1) items.push(['down', 'Descendre']); items.push('-'); }
      items.push(['rename', 'Renommer pour ce visuel'], ['remove', 'Supprimer le champ']);
      this.menu(b, items, k => {
        if (k === 'remove') { if (this.emit('well.remove', { vis: vis.id, well: w, i: +i, field: f, v: vis }) === 'no') return; vis.f[w].splice(+i, 1); }
        else if (k === 'rename') { this.renameField(vis, w, +i); return; }
        else if (k === 'up' || k === 'down') {
          const j = +i + (k === 'up' ? -1 : 1);
          if (this.emit('well.move', { vis: vis.id, well: w, i: +i, j, field: f, v: vis }) === 'no') return;
          const L = vis.f[w]; [L[+i], L[j]] = [L[j], L[+i]];
          const fix = sp => { if (sp && sp.i === +i) sp.i = j; else if (sp && sp.i === j) sp.i = +i; };
          fix(vis.sort); fix(vis.sort2);
        }
        else if (k === 'raw' || k === 'hier') { if (this.emit('well.hier', { vis: vis.id, well: w, i: +i, hier: k === 'hier', field: f, v: vis }) === 'no') return; f.hier = k === 'hier'; }
        else { const agg = k.slice(4); if (this.emit('well.agg', { vis: vis.id, well: w, i: +i, agg, field: f, v: vis }) === 'no' || (agg === 'none' && vis.type === 'card')) return; f.agg = agg; }
        this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'well', vis: vis.id, well: w, i: +i });
      });
      return;
    }
    case 'fmtsel': {
      const vis = this.selVisual(); if (!vis) return;
      const src = v === 'units' ? FMT_UNITS : v === 'dec' ? FMT_DEC : this.slicerStyles(vis);
      const cur = v === 'units' ? (vis.fmt.units || 'auto') : v === 'dec' ? (vis.fmt.dec == null ? 'auto' : String(vis.fmt.dec)) : (vis.mode || 'list');
      this.menu(b, src.map(s => [s[0], s[1], s[0] === cur]), k => this.setFmt(vis, v, v === 'dec' ? (k === 'auto' ? null : +k) : k));
      return;
    }
    case 'fmttog': { const vis = this.selVisual(); if (!vis) return; const cur = ['zero', 'total', 'legend', 'ctrl'].includes(v) ? vis.fmt[v] !== false : !!vis.fmt[v]; this.setFmt(vis, v, !cur); return; }
    case 'fmtcol': {
      const vis = this.selVisual(); if (!vis) return;
      const pal = this.palette || PBI.NAMED_PAL;
      const cur = ((vis.fmt.colors || {})[v] || '').toLowerCase();
      const m = h(`<div class="pal">${pal.map(([c, n]) => `<button data-c="${c}" class="${cur === c.toLowerCase() ? 'cur' : ''}" aria-label="${esc(n)}"><i style="background:${c}"></i><span>${esc(n)}</span><small>${esc(c.toUpperCase())}</small></button>`).join('')}</div>`);
      this.menu(b, [['x', 'Couleur de ' + v]], () => {});
      const menu = this._menu; if (menu) { menu.innerHTML = ''; menu.appendChild(h(`<div class="mh">${esc('Couleur de ' + v)}</div>`)); menu.appendChild(m); this.applyMarks(); m.addEventListener('click', ev => { const c = ev.target.closest('[data-c]'); if (!c) return; this.closeMenu(); const colors = { ...(vis.fmt.colors || {}) }; colors[v] = c.dataset.c; this.setFmt(vis, 'colors', colors); }); }
      return;
    }
    case 'vmore': {
      e.stopPropagation();
      const vis = this.page().visuals.find(x => x.id === v); if (!vis) return;
      const items = [];
      if (CHART_T.includes(vis.type) && (vis.f.axis || [])[0] && (vis.f.values || [])[0]) {
        const vl = fieldLabel(vis.f.values[0]), al = vis.f.axis[0].c, s0 = vis.sort || { by: 'axis', dir: 'asc' };
        items.push('Trier l’axe', ['s:value:desc', `${vl}, décroissant`, s0.by === 'value' && s0.dir === 'desc'], ['s:value:asc', `${vl}, croissant`, s0.by === 'value' && s0.dir === 'asc'], ['s:axis:asc', `${al}, croissant`, s0.by === 'axis' && s0.dir === 'asc'], ['s:axis:desc', `${al}, décroissant`, s0.by === 'axis' && s0.dir === 'desc'], '-');
      }
      if (vis.type === 'table') items.push(['sort2', 'Ajouter un critère de tri'], '-');
      items.push(['del', 'Supprimer le visuel']);
      this.menu(b, items, k => {
        if (k === 'sort2') { this.st.sortMode = 'secondary'; this.st.selVis = vis.id; this.emit('table.sort2mode', { vis: vis.id }); this.render(); return; }
        if (k === 'del') { if (this.emit('vis.delete', { vis: vis.id, v: vis }) !== 'ok') { shake(b); return; } this.delVisual(vis.id); this.render(); this.emit('viz.change', { what: 'delete', vis: vis.id }); return; }
        const [, by, dir] = k.split(':');
        if (this.emit('vis.sort', { vis: vis.id, by, dir, v: vis }) === 'no') return;
        vis.sort = { by, dir }; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'sort', vis: vis.id, by, dir });
      });
      return;
    }
    case 'thsort': {
      e.stopPropagation();
      const [id, i] = v.split('|'); const vis = this.page().visuals.find(x => x.id === id); if (!vis) return;
      const secondary = this.st.sortMode === 'secondary' && vis.sort && vis.sort.i !== +i;
      const cur = secondary ? vis.sort2 : vis.sort;
      const dir = cur && cur.i === +i ? (cur.dir === 'asc' ? 'desc' : 'asc') : 'asc';
      if (this.emit('table.sort', { vis: id, i: +i, dir, secondary, v: vis }) === 'no') { shake(b); return; }
      if (secondary) { vis.sort2 = { i: +i, dir }; this.st.sortMode = null; } else { vis.sort = { i: +i, dir }; if (vis.sort2 && vis.sort2.i === +i) vis.sort2 = null; }
      this.st.selVis = id; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'tsort', vis: id });
      return;
    }
    case 'seg': {
      e.stopPropagation();
      const [id, i, k] = v.split('|'); const vis = this.page().visuals.find(x => x.id === id); if (!vis) return;
      const d = this.chartData(vis); if (!d) return;
      const cat = d.cats[+i], s = d.series[+k], value = s.values[+i];
      const same = st.xsel && st.xsel.vis === id && st.xsel.i === +i && st.xsel.k === +k;
      const f0 = d.vs[d.lg ? 0 : +k];
      const shown = this.fmtValue(f0, value, { units: 'none' }, 'chart');
      if (this.emit('chart.point', { vis: id, cat, catLabel: d.catLabels[+i], series: s.name, value, shown, v: vis, clear: same }) === 'no') { shake(b); return; }
      const full = colType(this.P, d.ax) === 'date' && !d.ax.hier ? dfr(cat) : d.catLabels[+i];
      const tipRows = [[d.ax.c, full]].concat(d.lg ? [[d.lg.c, s.name]] : []).concat([[fieldLabel(f0), shown]]);
      st.xsel = same ? null : { vis: id, page: this.P.activePage, t: d.ax.t, c: d.ax.c, value: cat, extra: d.lg ? [{ c: d.lg.c, value: s.name }] : null, i: +i, k: +k, tipRows, tip: `${full}${d.lg ? ', ' + s.name : ''} : ${shown}` };
      st.selVis = id; this.render(); this.emit('viz.change', { what: 'point', vis: id });
      return;
    }
    case 'slpick': {
      e.stopPropagation();
      const [id, ...rest] = v.split('|'); const x = rest.join('|');
      const vis = this.page().visuals.find(s => s.id === id); if (!vis) return;
      const f = vis.f.values[0], T = tableOf(this.P, f.t);
      const real = [...new Set(T.rows.map(r => r[f.c]))].find(y => String(y) === x);
      let vals = vis.sel && vis.sel.values ? [...vis.sel.values] : [];
      const multi = (vis.mode || 'multi') === 'multi' && (this.st.ctrl || vis.ctrlFree !== false);
      if (vals.includes(real)) vals = vals.filter(y => y !== real); else vals = (vis.mode === 'single') ? [real] : [...vals, real];
      if (this.emit('slicer', { vis: id, values: vals, v: vis }) === 'no') { shake(b); return; }
      vis.sel = { kind: 'basic', values: vals }; this.st.selVis = id; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'slicer', vis: id });
      return;
    }
    case 'slclear': {
      e.stopPropagation();
      const vis = this.page().visuals.find(s => s.id === v); if (!vis) return;
      if (this.emit('slicer', { vis: v, values: [], v: vis, clear: true }) === 'no') { shake(b); return; }
      vis.sel = null; this.render(); this.emit('viz.change', { what: 'slicer', vis: v });
      return;
    }
    case 'slrange': {
      e.stopPropagation();
      const [id, end] = v.split('|'); const vis = this.page().visuals.find(s => s.id === id); if (!vis) return;
      const f = vis.f.values[0], T = tableOf(this.P, f.t), t = colType(this.P, f);
      const vals = [...new Set(T.rows.map(r => r[f.c]))].sort(cmp);
      const sel = vis.sel && vis.sel.kind === 'range' ? { ...vis.sel } : { kind: 'range', min: vals[0], max: vals[vals.length - 1] };
      this.menu(b, vals.map(x => [String(x), PBI.show(x, t, this.P.formats[f.t + '.' + f.c] || {}).s, sel[end] === x]), k => {
        const x = vals.find(y => String(y) === k); sel[end] = x;
        if (sel.min > sel.max) { if (end === 'min') sel.max = x; else sel.min = x; }
        if (this.emit('slicer', { vis: id, range: sel, v: vis }) === 'no') return;
        vis.sel = sel; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'slicer', vis: id });
      });
      return;
    }
    case 'vfocus': e.stopPropagation(); this.emit('vis.focus', { vis: v }); st.focus = v; this.render(); return;
    case 'unfocus': e.stopPropagation(); st.focus = null; this.render(); return;
    case 'navgo': { e.stopPropagation(); const [, pid] = v.split('|'); if (this.emit('nav.page', { page: pid }) === 'no') { shake(b); return; } this.P.activePage = pid; this.st.selVis = null; this.render(); return; }
  }
};
function convertVisual(v, type) {
  if (CHART_T.includes(v.type) && CHART_T.includes(type)) {
    const o = v.f, max = (WELLS[type].find(w => w[0] === 'values') || [])[2] || 1;
    v.type = type; v.f = { values: (o.values || []).slice(0, (o.legend || []).length ? 1 : max), axis: o.axis || [], legend: o.legend || [], cols: [] };
    return;
  }
  const all = [...(v.f.values || []), ...(v.f.axis || []), ...(v.f.cols || []), ...(v.f.legend || [])];
  v.type = type; v.f = { values: [], axis: [], legend: [], cols: [] };
  if (type === 'table') v.f.cols = all.map(f => ({ ...f }));
  else if (type === 'card' || type === 'slicer') { const m = all.find(f => f.agg && f.agg !== 'none') || all[0]; if (m) v.f.values = [type === 'slicer' ? { ...m, agg: 'none' } : m]; }
  else { const dims = all.filter(f => !f.agg || f.agg === 'none'), meas = all.filter(f => f.agg && f.agg !== 'none'); if (dims[0]) v.f.axis = [dims[0]]; if (dims[1]) v.f.legend = [dims[1]]; v.f.values = meas.slice(0, dims[1] || ['stacked', 'stacked100', 'stackedbar'].includes(type) ? 1 : 3); }
}
P_.renameField = function (vis, w, i) {
  const f = vis.f[w][i];
  const body = h(`<div><p style="font-size:12px; color:var(--f-mid); margin-bottom:8px">Nouveau nom de ce champ, pour ce visuel uniquement.</p><div class="fname"><input data-x="as" value="${esc(fieldLabel(f))}" spellcheck="false" autocapitalize="off"></div></div>`);
  const inp = $('input', body);
  const go = () => { const as = inp.value.trim(); if (this.emit('well.rename', { vis: vis.id, well: w, i, as, field: f, v: vis }) === 'no') { shake(inp); return; } f.as = as && as !== fieldLabel({ ...f, as: null }) ? as : null; this.closeDialog(); this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'rename', vis: vis.id }); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  this.dialog('Renommer pour ce visuel', body, [{ t: 'OK', pri: true, id: 'ok', fn: go }, { t: 'Annuler', fn: () => this.closeDialog() }], { kind: 'rename' });
  setTimeout(() => { inp.focus(); inp.select(); }, 80);
};
/* Toucher un champ du volet Données l'ajoute au visuel sélectionné */
P_.fieldTap = function (v) {
  const vis = this.selVisual(); if (!vis || !WELLS[vis.type]) return;
  const [tid, c] = v.split('|');
  const t = colType(this.P, { t: tid, c });
  const wells = WELLS[vis.type].map(w => w[0]);
  let well = wells[0];
  if (wells.includes('axis')) well = NUM.includes(t) ? 'values' : (vis.f.axis.length ? (vis.f.legend.length || !wells.includes('legend') ? 'axis' : 'legend') : 'axis');
  this.addField(vis, well, tid, c);
};

/* Barre d'outils du visuel sélectionné, au-dessus du canevas : rien ne masque le visuel */
const base = P_.visualEl;
P_.visualEl = function (v) {
  const el = base.call(this, v);
  if (v.hidden) el.classList.add('is-hidden');
  return el;
};
P_.visualBar = function (canvas) {
  const v = this.selVisual(); if (!v || this.st.focus) return;
  const deco = ['text', 'shape', 'button', 'navigator'].includes(v.type);
  const name = v.title || (WELLS[v.type] ? VNAME[v.type] : ({ text: 'Zone de texte', shape: 'Forme', button: 'Bouton', navigator: 'Navigateur de pages' })[v.type] || 'Visuel');
  const bar = h(`<div class="vbar"><span>${esc(fr(name))}</span>${!deco ? `<button class="vfocus" data-a="vfocus:${v.id}" aria-label="Mode Focus"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3"/></svg></button>` : ''}<button class="vmore" data-a="vmore:${v.id}" aria-label="Plus d’options">⋯</button></div>`);
  canvas.appendChild(bar);
};

/* Palette des couleurs de thème : la charte Wonderland, puis les couleurs par défaut */
PBI.NAMED_PAL = [['#c8a12b', 'Or Wonderland'], ['#397fa8', 'Bleu lagon'], ['#639d87', 'Vert jardin'], ['#9378b6', 'Violet crépuscule'], ['#118DFF', 'Bleu vif'], ['#12239E', 'Bleu nuit'], ['#E66C37', 'Orange'], ['#D64550', 'Rouge'], ['#E044A7', 'Rose'], ['#6B007B', 'Prune']];
PBI.CHART_T = CHART_T;
PBI.aggregate = aggregate; PBI.AGG = AGG; PBI.fieldLabel = fieldLabel; PBI.VNAME = VNAME; PBI.rowOk = rowOk; PBI.hierParts = hierParts;
})();
