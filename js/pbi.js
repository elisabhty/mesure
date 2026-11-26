/* Power BI Quest — simulateur Power BI Desktop (simplifié, fidèle aux commandes principales) */
(function () {
'use strict';
const { h, esc, fr, eur, nfmt, dfr, $, $$, clone, shake } = window.PBQ;
const NB = ' ';

/* ───────── Icônes ───────── */
const I = {
  get: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><ellipse cx="10" cy="5" rx="6" ry="2.4"/><path d="M4 5v10c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V5M4 10c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4"/></svg>',
  excel: '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" fill="#1D7A45"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
  enter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="14" height="12" rx="1"/><path d="M3 8h14M8 4v12"/><path d="M12 11h3" stroke-width="1.6"/></svg>',
  transform: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="10" height="11" rx="1"/><path d="M3 7h10M7 3v11"/><path d="M12 12l5 5M15 12h2v2" stroke-width="1.5" stroke-linecap="round"/></svg>',
  refresh: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M16 6.5A6.5 6.5 0 104.6 13.8"/><path d="M16 2.8v3.9h-3.9"/></svg>',
  visual: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="10" width="3" height="7" rx=".5"/><rect x="8.5" y="6" width="3" height="11" rx=".5"/><rect x="14" y="3" width="3" height="14" rx=".5"/></svg>',
  measure: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M9.5 4.2c-2-.6-2.9.4-3.2 2.2l-1.1 7.2c-.2 1.3-.9 1.8-1.9 1.5M4.4 9h4M10.6 9.6l5 6M15.6 9.6l-5 6"/></svg>',
  publish: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M6 13.5H5a3 3 0 01-.4-6 4.5 4.5 0 018.7-1A3.3 3.3 0 0115 13.5h-1"/><path d="M10 9v8M7.5 11.5L10 9l2.5 2.5"/></svg>',
  page: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="4" y="3" width="12" height="14" rx="1"/><path d="M10 7.5v5M7.5 10h5" stroke-linecap="round"/></svg>',
  text: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="14" height="12" rx="1"/><path d="M7 8h6M10 8v5" stroke-linecap="round"/></svg>',
  button: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="6" width="15" height="8" rx="3"/><path d="M8 10h4"/></svg>',
  shape: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7.5" cy="8" r="4"/><rect x="9" y="9.5" width="7" height="7" rx=".5"/></svg>',
  image: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="14" height="12" rx="1"/><circle cx="8" cy="8.5" r="1.5"/><path d="M3.5 15l4.5-4 3 2.5 2.5-2 3 3"/></svg>',
  relation: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="6" height="5" rx=".8"/><rect x="11.5" y="12" width="6" height="5" rx=".8"/><path d="M5.5 8v4.4c0 1.1.9 2.1 2 2.1h4"/></svg>',
  col: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M8 3v14M12 3v14"/></svg>',
  table: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3.5" width="14" height="13" rx="1.2"/><path d="M3 7.8h14M3 12.1h14M8 3.5v13"/></svg>',
  theme: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 3a7 7 0 100 14c1 0 1.4-.7 1.1-1.5-.4-1 .2-2 1.3-2H14a3 3 0 003-3A7 7 0 0010 3z"/><circle cx="6.5" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="12.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  filter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M3 4h14l-5.5 6.5V16l-3-1.5v-4z"/></svg>',
  mobile: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="6" y="2.5" width="8" height="15" rx="1.5"/><path d="M9 15h2"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  save: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 2.5h8l2.5 2.5v8.5H3z"/><path d="M5.5 2.5v3.5h4.5V2.5M5 13.5V9.5h6v4"/></svg>',
  report: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="3" y="3" width="14" height="14" rx="1.2" stroke-width="1.3"/><path d="M7 14v-3.5M10 14V6.8M13 14v-2.2" stroke-width="1.7"/></svg>',
  model: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="6.5" height="5" rx=".8"/><rect x="10.5" y="12" width="6.5" height="5" rx=".8"/><path d="M6.2 8v4.4c0 1.1.9 2.1 2 2.1h2.3"/></svg>',
  chev: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5L6 7.5L9 4.5"/></svg>',
  tbl: '<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1" y="1.5" width="11" height="10" rx="1"/><path d="M1 5h11M1 8.3h11M5 1.5v10"/></svg>',
  sheet: '<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1.5" y="1" width="10" height="11" rx="1"/><path d="M4 4h5M4 6.5h5M4 9h3"/></svg>',
  gear: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="6" cy="6" r="2"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.5 2.5l1 1M8.5 8.5l1 1M2.5 9.5l1-1M8.5 3.5l1-1"/></svg>',
  back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg>',
  cal: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1.5" y="2.5" width="9" height="8" rx="1"/><path d="M1.5 5h9M4 1.3v2.2M8 1.3v2.2"/></svg>',
  clock: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="6" cy="6" r="4.5"/><path d="M6 3.5V6l1.8 1.2"/></svg>'
};
const pbiLogo = '<svg width="9" height="9" viewBox="0 0 9 9" fill="#141B3C"><rect x="0" y="5" width="2.2" height="4"/><rect x="3.4" y="2.5" width="2.2" height="6.5"/><rect x="6.8" y="0" width="2.2" height="9"/></svg>';

/* ───────── Types de données ───────── */
const TYPES = {
  dec: { nom: 'Nombre décimal', ic: '1.2' }, fixed: { nom: 'Nombre décimal fixe', ic: '$' }, int: { nom: 'Nombre entier', ic: '123' },
  pct: { nom: 'Pourcentage', ic: '%' }, datetime: { nom: 'Date/Heure', ic: 'dt' }, date: { nom: 'Date', ic: 'd' }, time: { nom: 'Heure', ic: 't' },
  dtz: { nom: 'Date/Heure/Fuseau horaire', ic: 'dt' }, dur: { nom: 'Durée', ic: 't' }, text: { nom: 'Texte', ic: 'ABC' }, bool: { nom: 'Vrai/Faux', ic: '✓✗' },
  bin: { nom: 'Binaire', ic: '01' }, any: { nom: 'Tout', ic: 'ABC123' }
};
const tyIcon = t => { const c = (TYPES[t] || TYPES.any).ic; if (c === 'd') return I.cal; if (c === 't') return I.clock; if (c === 'dt') return I.cal; return esc(c); };
const LOCALES = { 'fr-FR': 'Français (France)', 'en-US': 'Anglais (États-Unis)', 'en-GB': 'Anglais (Royaume-Uni)', 'de-DE': 'Allemand (Allemagne)' };

/* Conversion d'une valeur brute vers un type, selon les paramètres régionaux */
function parseNum(s, loc) {
  s = String(s).trim().replace(/[   ]/g, '');
  if (loc === 'en-US' || loc === 'en-GB') { if (!/^-?[\d,]*\.?\d+$/.test(s)) return null; return Number(s.replace(/,/g, '')); }
  if (!/^-?[\d.]*,?\d+$/.test(s) && !/^-?\d+$/.test(s)) return null;
  return Number(s.replace(/\./g, '').replace(',', '.'));
}
function parseDate(s, loc) {
  s = String(s).trim();
  let d, m, y, mm;
  if ((mm = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y = +mm[1]; m = +mm[2]; d = +mm[3]; }
  else if ((mm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    if (loc === 'en-US') { m = +mm[1]; d = +mm[2]; } else { d = +mm[1]; m = +mm[2]; } y = +mm[3];
  } else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parseTime(s) { const mm = String(s).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/); if (!mm || +mm[1] > 23 || +mm[2] > 59) return null; return `${mm[1].padStart(2, '0')}:${mm[2]}:${mm[3] || '00'}`; }
function convert(v, type, loc = 'fr-FR') {
  if (v && typeof v === 'object' && v.err) return v;
  if (v === null || v === undefined || v === '') return null;
  const raw = v;
  const E = () => ({ err: 'DataFormat.Error', raw: String(raw), type });
  switch (type) {
    case 'text': case 'any': return typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v);
    case 'int': { if (typeof v === 'number') return Math.round(v); const n = parseNum(v, loc); return n === null ? E() : Math.round(n); }
    case 'dec': case 'pct': { if (typeof v === 'number') return v; const n = parseNum(v, loc); return n === null ? E() : n; }
    case 'fixed': { if (typeof v === 'number') return Math.round(v * 1e4) / 1e4; const n = parseNum(v, loc); return n === null ? E() : Math.round(n * 1e4) / 1e4; }
    case 'date': { const s = String(v).split(/[ T]/)[0]; const d = parseDate(s, loc); return d || E(); }
    case 'time': { const s = String(v).includes(' ') ? String(v).split(' ')[1] : String(v).includes('T') ? String(v).split('T')[1] : String(v); const t = parseTime(s); return t || E(); }
    case 'datetime': { const p = String(v).replace('T', ' ').split(' '); const d = parseDate(p[0], loc); const t = parseTime(p[1] || '00:00:00'); return d && t ? d + 'T' + t : E(); }
    case 'bool': { if (typeof v === 'boolean') return v; const s = String(v).trim().toLowerCase(); if (['true', 'vrai', '1'].includes(s)) return true; if (['false', 'faux', '0'].includes(s)) return false; return E(); }
    default: return v;
  }
}
/* Affichage d'une valeur typée */
function show(v, type, fmt) {
  if (v === null || v === undefined) return { s: 'null', cls: 'null' };
  if (typeof v === 'object' && v.err) return { s: 'Error', cls: 'err' };
  const f = fmt || {};
  switch (type) {
    case 'int': return { s: typeof v === 'number' ? (f.sep === false ? String(v) : nfmt(v)) : String(v), cls: 'r' };
    case 'dec': case 'fixed': case 'pct': {
      if (typeof v !== 'number') return { s: String(v), cls: 'r' };
      if (f.style === 'currency') return { s: eur(v, f.dec ?? 2).replace('€', f.cur === 'USD' ? '$' : '€'), cls: 'r' };
      const s = f.dec !== undefined ? v.toLocaleString('fr-FR', { minimumFractionDigits: f.dec, maximumFractionDigits: f.dec }) : v.toLocaleString('fr-FR', { maximumFractionDigits: 4 });
      return { s: s.replace(/[  ]/g, NB), cls: 'r' };
    }
    case 'date': return { s: f.pattern === 'iso' ? v : f.pattern === 'frt' ? dfr(v) + ' 00:00:00' : f.pattern === 'long' ? new Date(v + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : dfr(v), cls: 'r' };
    case 'time': return { s: f.short ? String(v).slice(0, 5) : v, cls: 'r' };
    case 'datetime': { const [d, t] = String(v).split('T'); return { s: dfr(d) + ' ' + t, cls: 'r' }; }
    case 'bool': return { s: v ? 'TRUE' : 'FALSE', cls: '' };
    default: return { s: String(v), cls: '' };
  }
}

/* ───────── Moteur Power Query (étapes appliquées) ───────── */
function evalQuery(q, upto) {
  let T = null;
  const steps = q.steps.slice(0, upto === undefined ? q.steps.length : upto + 1);
  for (const s of steps) T = applyStep(T, s, q);
  return T;
}
function applyStep(T, s, q) {
  switch (s.op) {
    case 'source': return { cols: q.cols.map(c => ({ n: c.n || c, t: c.t || 'any' })), rows: clone(q.rows ? q.rows() : q.data) };
    case 'nav': case 'promote': return T;
    case 'type': {
      const cols = T.cols.map(c => ({ ...c })), rows = T.rows.map(r => ({ ...r }));
      for (const [n, t, loc] of s.changes) { const c = cols.find(x => x.n === n); if (!c) continue; c.t = t; rows.forEach(r => { r[n] = convert(r[n], t, loc || s.loc || 'fr-FR'); }); }
      return { cols, rows };
    }
    case 'replace': { const rows = T.rows.map(r => ({ ...r })); rows.forEach(r => { if (String(r[s.col]) === String(s.from)) r[s.col] = s.to; }); return { cols: T.cols, rows }; }
    case 'filter': return { cols: T.cols, rows: T.rows.filter(r => s.keep.includes(r[s.col])) };
    default: return T;
  }
}
const stepFormula = s => ({
  source: q => q.kind === 'csv' ? `= Csv.Document(File.Contents("…\\${q.file}"), [Delimiter="${q.delim || ';'}", Encoding=${q.enc || 65001}])` : `= Excel.Workbook(File.Contents("…\\${q.file || 'Source'}"), null, true)`,
  nav: () => `= Source{[Item="${s.item}",Kind="Table"]}[Data]`,
  promote: () => '= Table.PromoteHeaders(Source, [PromoteAllScalars=true])',
  type: () => `= Table.TransformColumnTypes(…, {${s.changes.map(c => `{"${c[0]}", ${({ text: 'type text', int: 'Int64.Type', dec: 'type number', fixed: 'Currency.Type', date: 'type date', time: 'type time', datetime: 'type datetime', bool: 'type logical', pct: 'Percentage.Type' })[c[1]] || 'type any'}}`).join(', ')}}${s.changes.some(c => c[2]) || s.loc ? `, "${(s.changes.find(c => c[2]) || [])[2] || s.loc}"` : ''})`,
  replace: () => `= Table.ReplaceValue(…, "${s.from}", "${s.to}", Replacer.ReplaceValue, {"${s.col}"})`,
  filter: () => `= Table.SelectRows(…, each [${s.col}] = ${s.keep.map(String).join(' or ')})`
}[s.op] || (() => '= …'));


/* ───────── Graphiques (colonnes, barres, empilés, courbes) ───────── */
const PAL = ['#118DFF', '#12239E', '#E66C37', '#6B007B', '#E044A7', '#744EC2', '#D9B300', '#D64550'];
const tick = n => Math.abs(n) >= 1000 ? (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + NB + 'k' : n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
/* Fait défiler une bande horizontale pour que l'élément actif reste visible */
function keepVisible(strip, sel) {
  requestAnimationFrame(() => {
    const on = strip.querySelector(sel); if (!on) return;
    const sb = strip.getBoundingClientRect(), ob = on.getBoundingClientRect(), k = sb.width / strip.offsetWidth || 1;
    const l = (ob.left - sb.left) / k + strip.scrollLeft, r = l + ob.width / k;
    if (r > strip.scrollLeft + strip.clientWidth - 6) strip.scrollLeft = r - strip.clientWidth + 24;
    else if (l < strip.scrollLeft) strip.scrollLeft = Math.max(0, l - 8);
  });
}
function niceMax(m) { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function renderChart(el, c) {
  const series = c.series.map((s, i) => ({ ...s, color: s.color || PAL[i % PAL.length] }));
  const cats = c.cats, n = cats.length;
  const stacked = c.kind === 'stacked' || !!c.stackedBar;
  const tops = cats.map((_, i) => stacked ? series.reduce((a, s) => a + (s.values[i] || 0), 0) : Math.max(...series.map(s => s.values[i] || 0)));
  const lo = c.min || 0;
  /* Échelle « ronde » : un pas de 1, 2, 2,5 ou 5 (puissance de dix), jamais fractionnaire pour des entiers */
  const allInt = series.every(s => s.values.every(v => Number.isInteger(v || 0)));
  const M = Math.max(...tops, 0) * 1.08;
  let max = c.max, step = 0;
  if (!max) {
    if (M <= 0) { max = 1; step = .25; }
    else { const raw = M / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; let nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; if (allInt && nf * p < 1) nf = 1 / p; if (allInt && nf === 2.5 && p === 1) nf = 5; step = nf * p; max = Math.ceil(M / step - 1e-9) * step; }
  }
  if (lo) max = Math.max(max, lo + 1);
  const dim = (i, k) => c.sel && !(c.sel.i === i && (c.sel.k === undefined || c.sel.k === k)) ? ' opacity=".35"' : '';
  const ticks = c.ticks || (lo ? [lo, lo + (max - lo) / 2, max] : step ? Array.from({ length: Math.round(max / step) + 1 }, (_, i) => +(i * step).toFixed(6)) : [0, max / 4, max / 2, max * 3 / 4, max]);
  const sc = v => Math.max(0, (v - lo)) / (max - lo) * 100;
  const fmt = c.fmt || (x => nfmt(x)), tk = c.tickFmt || tick;
  const legend = (series.length > 1 || c.legend) && c.showLegend !== false ? `<div class="ch-lg">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  const box = h(`<div class="ch">${c.title ? `<div class="v-title">${esc(fr(c.title))}</div>` : ''}${legend}<div class="ch-grid ${c.kind === 'bar' ? 'is-bar' : ''}"></div></div>`);
  const grid = $('.ch-grid', box);
  let svg = '', labels = '';
  if (c.kind === 'bar') {
    const step = 100 / n, bw = step * .62 / (stacked ? 1 : series.length);
    ticks.forEach(t => { const x = sc(t); svg += `<line x1="${x}" y1="0" x2="${x}" y2="100" stroke="#EDEBE9" stroke-width="1" vector-effect="non-scaling-stroke"/>`; });
    cats.forEach((_, i) => { let acc = 0; series.forEach((s, k) => {
      const val = s.values[i] || 0, w = stacked ? val / (max - lo) * 100 : sc(val), y = i * step + (step - bw * (stacked ? 1 : series.length)) / 2 + (stacked ? 0 : k * bw);
      svg += `<rect x="${acc.toFixed(3)}" y="${y.toFixed(3)}" width="${w.toFixed(3)}" height="${bw.toFixed(3)}" fill="${s.color}" data-seg="${i}|${k}"${c.hl ? ' opacity=".3"' : dim(i, k)}/>`;
      if (c.hl) { const hv = (c.hl[k] || [])[i] || 0, w2 = stacked ? hv / (max - lo) * 100 : sc(hv); if (hv) svg += `<rect x="${acc.toFixed(3)}" y="${y.toFixed(3)}" width="${w2.toFixed(3)}" height="${bw.toFixed(3)}" fill="${s.color}" data-seg="${i}|${k}"/>`; }
      if (c.labels && val) labels += `<span class="ch-dl ${stacked ? 'in' : ''}" style="left:${(stacked ? acc + w / 2 : w).toFixed(2)}%; top:${(y + bw / 2).toFixed(2)}%; transform:${stacked ? 'translate(-50%,-50%)' : 'translate(3px,-50%)'}">${esc(fmt(val))}</span>`;
      if (stacked) acc += w;
    }); if (c.totals && stacked) labels += `<span class="ch-dl tot" style="left:${acc.toFixed(2)}%; top:${(i * step + step / 2).toFixed(2)}%; transform:translate(3px,-50%)">${esc(fmt(tops[i]))}</span>`; });
    grid.innerHTML = `<div class="ch-cats">${cats.map(x => `<span>${esc(x)}</span>`).join('')}</div><div class="ch-area"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${svg}</svg>${labels}</div><span></span><div class="ch-xt">${ticks.map(t => `<span style="left:${sc(t).toFixed(2)}%">${esc(tk(t))}</span>`).join('')}</div>${c.axisTitle ? `<span></span><div class="ch-at">${esc(c.axisTitle)}</div>` : ''}`;
  } else {
    const step = 100 / n, groupW = step * .62, bw = stacked || c.kind === 'line' ? groupW : groupW / series.length;
    ticks.forEach(t => { const y = 100 - sc(t); svg += `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="${t === lo ? '#C8C6C4' : '#EDEBE9'}" stroke-width="1" vector-effect="non-scaling-stroke"/>`; });
    if (c.kind === 'line') {
      series.forEach(s => {
        const pts = cats.map((_, i) => `${(i * step + step / 2).toFixed(3)},${(100 - (s.values[i] || 0) / max * 100).toFixed(3)}`).join(' ');
        svg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
        cats.forEach((_, i) => { const v = s.values[i] || 0; if (c.labels) labels += `<span class="ch-dl" style="left:${(i * step + step / 2).toFixed(2)}%; bottom:${(v / max * 100).toFixed(2)}%">${esc(fmt(v))}</span>`; labels += `<i class="ch-pt" style="left:${(i * step + step / 2).toFixed(2)}%; bottom:${(v / max * 100).toFixed(2)}%; background:${s.color}"></i>`; });
      });
    } else {
      cats.forEach((_, i) => {
        let acc = 0;
        series.forEach((s, k) => {
          const val = s.values[i] || 0, hh = stacked ? val / (max - lo) * 100 : sc(val);
          const x = i * step + (step - groupW) / 2 + (stacked ? 0 : k * bw);
          const y = 100 - (stacked ? acc + hh : hh);
          svg += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${bw.toFixed(3)}" height="${hh.toFixed(3)}" fill="${s.color}" data-seg="${i}|${k}"${c.hl ? ' opacity=".3"' : dim(i, k)}/>`;
          if (c.hl) { const hv = (c.hl[k] || [])[i] || 0, hh2 = hv / max * 100; if (hh2) svg += `<rect x="${x.toFixed(3)}" y="${(100 - (stacked ? acc + hh2 : hh2)).toFixed(3)}" width="${bw.toFixed(3)}" height="${hh2.toFixed(3)}" fill="${s.color}" data-seg="${i}|${k}"/>`; }
          if (c.labels && val) labels += `<span class="ch-dl ${stacked ? 'in' : ''}" style="left:${(x + bw / 2).toFixed(2)}%; bottom:${(stacked ? acc + hh / 2 : hh).toFixed(2)}%">${esc(fmt(val))}</span>`;
          acc += hh;
        });
        if (c.totals && stacked) labels += `<span class="ch-dl tot" style="left:${(i * step + step / 2).toFixed(2)}%; bottom:${acc.toFixed(2)}%">${esc(fmt(tops[i]))}</span>`;
      });
    }
    grid.innerHTML = `<div class="ch-y">${[...ticks].reverse().map(t => `<span>${esc(tk(t))}</span>`).join('')}</div><div class="ch-area"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${svg}</svg>${labels}</div><span></span><div class="ch-x">${cats.map(x => `<span>${esc(x)}</span>`).join('')}</div>${c.axisTitle ? `<span></span><div class="ch-at">${esc(c.axisTitle)}</div>` : ''}`;
  }
  el.appendChild(box);
}

/* ───────── Le simulateur ───────── */
class PBI {
  constructor(P, opts) {
    this.P = P; this.opts = opts; this.act = opts.act;
    this.st = { view: 'report', tab: 'Accueil', pane: 'Données', selTable: null, selVis: null, selCol: null, lockViews: false };
    this.el = h(`<div class="pbi" data-tap></div>`);
    this.el.addEventListener('click', e => this.onClick(e));
    this.pq = null; this.dlg = null;
    this.hooks = {};
    this.marks = [];
    this.render();
  }
  /* Cibles à toucher : sélecteurs réappliqués après chaque rendu */
  mark(...sels) {
    $$('.is-target', this.el).forEach(e => e.classList.remove('is-target'));
    this.marks = sels.flat().filter(Boolean);
    this._scrollMark = this._scrollGrid = this.marks.length > 0;
    this.applyMarks();
  }
  applyMarks() {
    for (const s of this.marks) $$(s, this.el).forEach(e => e.classList.add('is-target'));
    /* Une cible cachée dans le volet défile jusqu'à devenir visible, une seule fois par guide */
    const t = this._scrollMark && $('.pane-body .is-target', this.el);
    if (t) {
      this._scrollMark = false;
      const pb = t.closest('.pane-body'), a = pb.getBoundingClientRect(), r = t.getBoundingClientRect(), k = a.height / pb.clientHeight || 1;
      if (r.top < a.top || r.bottom > a.bottom) pb.scrollTop += (r.top - a.top) / k - 16;
    }
    /* Power Query : un en-tête ciblé hors de l'écran fait défiler la grille horizontalement */
    const g = this._scrollGrid && $('.q2-head .is-target', this.el);
    if (g) {
      this._scrollGrid = false;
      const box = g.closest('.q2-grid'), rn = $('.q2-hc.rn', box), hc = g.closest('.q2-hc') || g;
      const a = box.getBoundingClientRect(), r = hc.getBoundingClientRect(), k = a.width / box.clientWidth || 1, left = a.left + (rn ? rn.getBoundingClientRect().width : 34);
      if (r.left < left || r.right > a.right) box.scrollLeft += (r.left - left) / k - 12;
    }
  }
  load(P) { this.P = P; this.st.selTable = null; this.st.selVis = null; this.st.selCol = null; this.render(); }
  emit(type, payload) { return this.act(type, payload); }
  gate(type, payload, el) { const r = this.emit(type, payload); if (r === 'no') shake(el); return r !== 'no'; }
  page() { return this.P.pages.find(p => p.id === this.P.activePage) || this.P.pages[0]; }
  table(id) { return this.P.tables.find(t => t.id === id || t.name === id); }
  fileTitle() { return this.P.name ? this.P.name : (this.P.demo ? this.P.demoName : 'Sans titre'); }

  /* ── Rendu principal ── */
  render() {
    const P = this.P, st = this.st;
    const pb0 = $('.pane-body', this.el), keep = pb0 ? { pane: st.pane, top: pb0.scrollTop, sel: st.selVis, tab: st.vzTab, view: st.view } : null;
    this.el.innerHTML = '';
    this.el.appendChild(h(`<div class="pbi-title"><i class="pbi-logo">${pbiLogo}</i><b>${esc(this.fileTitle())}</b>${P.dirty ? '<i class="dirty" title="Modifications non enregistrées"></i>' : ''}<span>Power BI Desktop</span><button class="pbi-save" data-a="save" aria-label="Enregistrer">${I.save}</button></div>`));
    this.el.appendChild(this.ribbon());
    const body = h(`<div class="pbi-body"><nav class="rail" aria-label="Vues">
      <button data-a="view:report" class="${st.view === 'report' ? 'on' : ''}" aria-label="Vue Rapport">${I.report}</button>
      <button data-a="view:table" class="${st.view === 'table' ? 'on' : ''}" aria-label="Vue Table">${I.table}</button>
      <button data-a="view:model" class="${st.view === 'model' ? 'on' : ''}" aria-label="Vue Modèle">${I.model}</button></nav><div class="pbi-main"></div></div>`);
    const main = $('.pbi-main', body);
    if (st.view === 'report') this.reportView(main);
    else if (st.view === 'table') this.tableView(main);
    else this.modelView(main);
    this.el.appendChild(body);
    if (keep && keep.pane === st.pane && keep.sel === st.selVis && keep.tab === st.vzTab && keep.view === st.view) { const pb = $('.pane-body', this.el); if (pb) pb.scrollTop = keep.top; }
    if (this.hooks.after) this.hooks.after(this);
    this.applyMarks();
  }
  ribbon() {
    const st = this.st;
    const tabs = ['Accueil', 'Insertion', 'Modélisation', 'Affichage'];
    if (st.view === 'table' && st.selCol) tabs.push('Outils de colonne');
    if (st.view === 'report' && st.selVis && this.formatTab && this.formatTab().length) tabs.push('Format');
    if (!tabs.includes(st.tab)) st.tab = 'Accueil';
    const cmds = {
      'Accueil': [['get', 'Obtenir les données', I.get], ['excel', 'Classeur Excel', I.excel], ['enter', 'Entrer des données', I.enter], '|', ['transform', 'Transformer les données', I.transform], ['refresh', 'Actualiser', I.refresh], '|', ['newvisual', 'Nouveau visuel', I.visual], ['newmeasure', 'Nouvelle mesure', I.measure], '|', ['publish', 'Publier', I.publish]],
      'Insertion': [['newpage', 'Nouvelle page', I.page], ['newvisual', 'Nouveau visuel', I.visual], ['textbox', 'Zone de texte', I.text], ['buttons', 'Boutons', I.button], ['shapes', 'Formes', I.shape], ['image', 'Image', I.image]],
      'Modélisation': [['relations', 'Gérer les relations', I.relation], ['newmeasure', 'Nouvelle mesure', I.measure], ['newcol', 'Nouvelle colonne', I.col], ['newtable', 'Nouvelle table', I.table]],
      'Affichage': [['themes', 'Thèmes', I.theme], ['filterpane', 'Volet Filtres', I.filter], ['syncslicers', 'Synchroniser les segments', I.filter], ['mobile', 'Disposition mobile', I.mobile]],
      'Outils de colonne': this.colTools ? this.colTools() : [],
      'Format': this.formatTab ? this.formatTab() : []
    };
    const r = h(`<div class="ribbon"><div class="rb-tabs"><button class="rb-tab file" data-a="file">Fichier</button>${tabs.map(t => `<button class="rb-tab ${t === st.tab ? 'on' : ''}" data-a="tab:${t}">${esc(t)}</button>`).join('')}</div><div class="rb-cmds"></div></div>`);
    const box = $('.rb-cmds', r);
    requestAnimationFrame(() => { const tb = $('.rb-tabs', r), on = $('.rb-tab.on', r); if (tb && on && on.offsetLeft + on.offsetWidth > tb.clientWidth) tb.scrollLeft = on.offsetLeft + on.offsetWidth - tb.clientWidth + 8; });
    for (const c of (cmds[st.tab] || []).concat(this.extraCmds ? this.extraCmds(st.tab) : [])) {
      if (c === '|') { box.appendChild(h('<i class="rb-sep"></i>')); continue; }
      if (c instanceof Element) { box.appendChild(c); continue; }
      box.appendChild(h(`<button class="rb-cmd ${c[3] || ''}" data-a="cmd:${c[0]}">${c[2]}<span>${esc(c[1])}</span></button>`));
    }
    return r;
  }
  colTools() {
    const t = this.table(this.st.selTable), c = t && t.cols.find(x => x.n === this.st.selCol);
    if (!c) return [];
    const f = this.P.formats[`${t.id}.${c.n}`] || {};
    const fmtName = this.fmtName(c.t, f);
    const ty = h(`<div class="rb-cmd" style="min-width:90px; max-width:none; align-items:flex-start; text-align:left"><span style="color:var(--f-mid)">Type de données</span><b style="font-size:11px">${esc(TYPES[c.t] ? TYPES[c.t].nom : 'Tout')}</b></div>`);
    const fm = h(`<button class="rb-cmd" data-a="colfmt" style="min-width:104px; max-width:none; align-items:flex-start; text-align:left"><span style="color:var(--f-mid)">Format</span><b style="font-size:11px; display:flex; gap:4px; align-items:center">${esc(fmtName)} ${I.chev.replace('<svg', '<svg width="10" height="10"')}</b></button>`);
    const out = [ty, '|', fm];
    if (['dec', 'fixed', 'int', 'pct'].includes(c.t)) {
      out.push(h(`<button class="rb-cmd" data-a="colcur" style="min-width:76px; max-width:none; align-items:flex-start; text-align:left"><span style="color:var(--f-mid)">Symbole</span><b style="font-size:11px">${f.style === 'currency' ? (f.cur === 'USD' ? '$ Dollar' : '€ Euro') : 'Aucun'}</b></button>`));
      out.push(h(`<div class="rb-cmd" style="min-width:96px; max-width:none"><span style="color:var(--f-mid)">Décimales</span><span style="display:flex; align-items:center; gap:6px"><button class="fbtn" data-a="coldec:-1" style="height:22px; padding:0 7px">−</button><b class="num" style="font-size:12px">${f.dec ?? 'Auto'}</b><button class="fbtn" data-a="coldec:1" style="height:22px; padding:0 7px">+</button></span></div>`));
    }
    return out;
  }
  fmtName(t, f) {
    if (['dec', 'fixed', 'int', 'pct'].includes(t)) return f.style === 'currency' ? 'Monnaie' : f.style === 'int' ? 'Nombre entier' : f.style === 'pct' ? 'Pourcentage' : f.style === 'dec' ? 'Nombre décimal' : 'Général';
    if (t === 'date') return f.pattern === 'iso' || !f.pattern ? 'aaaa-mm-jj' : f.pattern === 'long' ? 'jeudi 14 mars 2001' : f.pattern === 'frt' ? 'jj/mm/aaaa hh:mm:ss' : 'jj/mm/aaaa';
    if (t === 'time') return f.short ? 'hh:mm' : 'hh:mm:ss';
    return 'Texte';
  }

  /* ── Vue Rapport ── */
  reportView(main) {
    const pg = this.page();
    const cv = h(`<div class="canvas" data-a="canvas"><div class="page"></div></div>`);
    const pageEl = $('.page', cv);
    if (pg && pg.size) { pageEl.style.setProperty('--ar', pg.size[0] + ' / ' + pg.size[1]); pageEl.style.setProperty('--arn', pg.size[0] / pg.size[1]); }
    if (pg && this.pageLook) this.pageLook(pg, pageEl); else if (pg && pg.bg) pageEl.style.background = pg.bg;
    if (!pg) pageEl.appendChild(h(`<div class="page-empty">Aucune page</div>`));
    else {
      if (!pg.visuals.length) pageEl.appendChild(h(`<div class="page-empty">${esc(this.P.tables.length ? 'Construis ton visuel à partir des volets Visualisations et Données.' : 'Ajouter des données à votre rapport : les données chargées apparaîtront dans le volet Données.')}</div>`));
      const fv = this.st.focus && pg.visuals.find(v => v.id === this.st.focus);
      if (fv) { pageEl.appendChild(this.visualEl({ ...fv, x: 2, y: 12, w: 96, h: 86 })); pageEl.appendChild(h(`<button class="focus-back" data-a="unfocus:1">‹ Retour au rapport</button>`)); }
      else { this.st.focus = null; for (const v of pg.visuals) pageEl.appendChild(this.visualEl(v)); }
    }
    main.appendChild(cv);
    if (this.visualBar) this.visualBar(cv);
    const tabs = h(`<div class="pagetabs"></div>`);
    for (const p of this.P.pages) {
      if (this.st.renaming === p.id) {
        const inp = h(`<span class="ptab on"><input value="${esc(p.name)}" maxlength="40" aria-label="Nom de la page"></span>`);
        const i = $('input', inp);
        const commit = () => { if (this.st.renaming !== p.id) return; this.st.renaming = null; this.renamePage(p.id, i.value.trim()); };
        i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { this.st.renaming = null; this.render(); } });
        i.addEventListener('blur', commit);
        tabs.appendChild(inp); setTimeout(() => { i.focus(); i.select(); }, 30);
      } else tabs.appendChild(h(`<button class="ptab ${p.id === this.P.activePage ? 'on' : ''}" data-a="ptab:${p.id}">${esc(p.name)}</button>`));
    }
    tabs.appendChild(h(`<button class="ptab-add" data-a="cmd:newpage" aria-label="Nouvelle page">+</button>`));
    main.appendChild(tabs);
    keepVisible(tabs, '.ptab.on');
    main.appendChild(this.panes());
  }
  renamePage(id, name) {
    const p = this.P.pages.find(x => x.id === id);
    if (!p || !name) { this.render(); return; }
    const r = this.emit('page.rename', { id, name });
    if (r !== 'no') { p.name = name; this.P.dirty = true; }
    this.render();
  }
  panes() {
    const st = this.st;
    const pane = h(`<div class="panes"><div class="pane-tabs">${['Données', 'Visualisations', 'Filtres'].map(t => `<button class="pane-tab ${st.pane === t ? 'on' : ''}" data-a="pane:${t}">${t}</button>`).join('')}</div><div class="pane-body"></div></div>`);
    const body = $('.pane-body', pane);
    if (st.pane === 'Données') body.appendChild(this.dataTree());
    else if (st.pane === 'Visualisations') body.appendChild(this.vizPane ? this.vizPane() : h('<div class="prev-empty">Sélectionne un visuel ou un type de visuel.</div>'));
    else body.appendChild(this.filterPane ? this.filterPane() : h('<div class="prev-empty">Aucun filtre sur cette page.</div>'));
    return pane;
  }
  dataTree(opts = {}) {
    const box = h(`<div></div>`);
    if (!this.P.tables.length) { box.appendChild(h(`<div class="prev-empty">Aucune table. Les données chargées apparaîtront ici.</div>`)); return box; }
    for (const t of this.P.tables) {
      box.appendChild(h(`<button class="tree-t ${this.st.selTable === t.id ? 'sel' : ''}" data-a="dtable:${t.id}">${I.chev}${I.tbl}${esc(t.name)}</button>`));
      for (const c of t.cols) box.appendChild(h(`<button class="field-it" data-a="field:${t.id}|${esc(c.n)}"><span class="fi">${['int', 'dec', 'fixed'].includes(c.t) ? 'Σ' : c.t === 'date' ? I.cal.replace('<svg', '<svg width="12" height="12"') : ''}</span>${esc(c.n)}</button>`));
    }
    return box;
  }
  visualEl(v) {
    const el = h(`<div class="vis vis-${v.type} ${this.st.selVis === v.id ? 'sel' : ''}" data-a="vis:${v.id}" style="left:${v.x}%; top:${v.y}%; width:${v.w}%; height:${v.h}%"></div>`);
    const R = v.f && this.renderers && this.renderers[v.type];
    if (R) R.call(this, el, v);
    else if (v.type === 'card') el.appendChild(h(`<div class="v-card" style="width:100%; height:100%"><b>${esc(fr(String(v.display)))}</b><span>${esc(v.label || '')}</span></div>`));
    else if (['column', 'bar', 'stacked', 'line'].includes(v.type)) renderChart(el, { kind: v.type, title: v.title, cats: v.data.map(d => d[0]), series: [{ name: v.serie || '', values: v.data.map(d => d[1]), color: v.color }], max: v.max, ticks: v.ticks, labels: v.labels });
    return el;
  }

  /* ── Vue Table ── */
  tableView(main) {
    const P = this.P;
    const tv = h(`<div class="tv"><div class="tv-tools"></div><div class="grid"></div></div>`);
    const tools = $('.tv-tools', tv);
    if (!P.tables.length) tools.appendChild(h(`<span style="color:var(--f-mid); font-size:11.5px">Aucune table chargée</span>`));
    for (const t of P.tables) tools.appendChild(h(`<button class="tsel ${this.st.selTable === t.id ? 'on' : ''}" data-a="tsel:${t.id}">${I.tbl}${esc(t.name)}</button>`));
    const grid = $('.grid', tv);
    const t = this.table(this.st.selTable);
    if (t) tools.appendChild(h(`<span class="tv-count">${esc(fr(`${t.rows.length} lignes`))}</span>`));
    if (!t) grid.appendChild(h(`<div class="prev-empty">${P.tables.length ? 'Choisis une table pour afficher ses données.' : 'Les données chargées dans le modèle s’afficheront ici.'}</div>`));
    else grid.appendChild(this.gridTable(t.cols, t.rows, { rn: true, selCol: this.st.selCol, selRow: this.st.selRow, colAct: 'tcol', rowAct: 'trow', fmtKey: t.id }));
    main.appendChild(tv);
    main.appendChild(h(`<div class="status">${t ? `<span>TABLE${NB}: ${esc(t.name)} (${t.rows.length} lignes)</span>${this.st.selCol ? `<span>COLONNE${NB}: ${esc(this.st.selCol)}</span>` : ''}` : '<span>Vue Table</span>'}</div>`));
  }
  gridTable(cols, rows, o = {}) {
    const tbl = h(`<table class="tbl"><thead><tr></tr></thead><tbody></tbody></table>`);
    const tr = $('thead tr', tbl);
    if (o.rn) tr.appendChild(h(`<th style="width:28px"><span class="thc"></span></th>`));
    cols.forEach(c => {
      const num = ['int', 'dec', 'fixed', 'pct', 'date', 'time', 'datetime'].includes(c.t);
      const th = h(`<th class="${num ? 'r' : ''} ${o.selCol === c.n ? 'csel' : ''}">${o.colAct ? `<button data-a="${o.colAct}:${esc(c.n)}">` : '<span class="thc">'}${o.types ? `<span class="ty" data-a="${o.typeAct || ''}:${esc(c.n)}">${tyIcon(c.t)}</span>` : ''}${esc(c.n)}${o.filterAct && c.t === 'bool' ? `<span class="ty" data-a="${o.filterAct}:${esc(c.n)}" style="margin-left:4px">▾</span>` : ''}${o.colAct ? '</button>' : '</span>'}</th>`);
      tr.appendChild(th);
    });
    const tb = $('tbody', tbl);
    rows.forEach((r, i) => {
      const row = h(`<tr class="${o.selRow === i ? 'sel' : ''} ${o.hit && o.hit(r) ? 'hit' : ''}" ${o.rowAct ? `data-a="${o.rowAct}:${i}"` : ''}></tr>`);
      if (o.rn) row.appendChild(h(`<td class="rn">${i + 1}</td>`));
      cols.forEach(c => {
        const fmt = o.fmtKey ? (this.P.formats[`${o.fmtKey}.${c.n}`] || (c.t === 'date' ? { pattern: 'iso' } : null)) : null;
        const d = o.raw ? { s: r[c.n] === null || r[c.n] === undefined ? '' : String(r[c.n]), cls: '' } : show(r[c.n], c.t, fmt);
        const td = h(`<td class="${d.cls} ${o.selCol === c.n ? 'csel' : ''} ${o.errSel && o.errSel.r === i && o.errSel.c === c.n ? 'errsel' : ''}" ${d.cls === 'err' && o.errAct ? `data-a="${o.errAct}:${i}|${esc(c.n)}"` : ''}></td>`);
        td.textContent = d.s;
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    return tbl;
  }

  /* ── Vue Modèle ── */
  modelView(main) {
    const m = h(`<div class="model"><div class="model-tools"><button data-a="mtool:relations">Gérer les relations</button><button data-a="mtool:newrel">Nouvelle relation</button></div></div>`);
    this.P.tables.forEach((t, i) => {
      const card = h(`<button class="mcard ${this.st.selModel === t.id ? 'sel' : ''}" data-a="mtable:${t.id}" style="left:${14 + i * 150}px; top:${44 + (i % 2) * 18}px"><h4>${esc(t.name)}</h4><ul>${t.cols.map(c => `<li>${esc(c.n)}</li>`).join('')}</ul></button>`);
      m.appendChild(card);
    });
    if (!this.P.tables.length) m.appendChild(h(`<div class="page-empty">Aucune table dans le modèle</div>`));
    main.appendChild(m);
    main.appendChild(h(`<div class="status"><span>Vue Modèle · ${this.P.tables.length} table${this.P.tables.length > 1 ? 's' : ''} · ${this.P.relationships.length} relation${this.P.relationships.length > 1 ? 's' : ''}</span></div>`));
  }

  /* ── Clics ── */
  onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b || !this.el.contains(b)) return;
    const raw = b.dataset.a; const k = raw.indexOf(':'); const a = k < 0 ? raw : raw.slice(0, k), v = k < 0 ? null : raw.slice(k + 1);
    if (a === 'ty' || a === '') return;
    const st = this.st;
    switch (a) {
      case 'save': this.emit('save', null); break;
      case 'file': if (this.gate('file.menu', null, b)) this.openBackstage(); break;
      case 'tab': st.tab = v; this.emit('tab', v); this.render(); break;
      case 'cmd': if (this.emit('cmd', v) === 'no') shake(b); else if (this.cmdAct) this.cmdAct(v, b); break;
      case 'view': if (st.view !== v && this.gate('view', v, b)) { st.view = v; st.selCol = null; if (v === 'table' && !st.selTable && this.P.tables.length === 1) st.selTable = null; this.render(); } else if (st.view === v) this.emit('view', v); break;
      case 'pane': st.pane = v; this.emit('pane', v); this.render(); break;
      case 'dtable': if (this.gate('table.select', v, b)) { st.selTable = v; this.render(); } break;
      case 'field': if (this.emit('field', v) !== 'no' && this.fieldTap) this.fieldTap(v); else shake(b); break;
      case 'tsel': if (this.gate('table.select', v, b)) { st.selTable = v; st.selCol = null; st.selRow = null; this.render(); } break;
      case 'tcol': if (this.gate('col.select', v, b)) { st.selCol = v; st.tab = 'Outils de colonne'; this.render(); } break;
      case 'trow': if (this.gate('row', +v, b)) { st.selRow = +v; this.render(); } break;
      case 'mtable': if (this.gate('model.table', v, b)) { st.selModel = v; this.render(); } break;
      case 'mtool': this.emit('model.tool', v) === 'no' && shake(b); break;
      case 'vis': e.stopPropagation(); if (this.gate('visual', v, b)) { if (st.multiMode) st.multi = (st.multi || []).includes(v) ? st.multi.filter(x => x !== v) : [...(st.multi || []), v]; st.selVis = st.multiMode && !st.multi.includes(v) ? (st.multi[st.multi.length - 1] || null) : v; this.render(); } break;
      case 'canvas': if (e.target.closest('.vis')) return; this.emit('canvas', null); if (st.selVis || st.xsel || (st.multi && st.multi.length)) { st.selVis = null; st.xsel = null; st.multi = []; this.render(); } break;
      case 'ptab': {
        const r = this.emit('page', v);
        if (r === 'no') { shake(b); break; }
        if (v === this.P.activePage) this.pageMenu(b, v);
        else { this.P.activePage = v; st.selVis = null; this.render(); }
        break;
      }
      case 'colfmt': this.formatMenu(b); break;
      case 'colcur': this.currencyMenu(b); break;
      case 'coldec': { const t = this.table(st.selTable), key = `${t.id}.${st.selCol}`; const f = this.P.formats[key] || (this.P.formats[key] = {}); f.dec = clampDec((f.dec ?? 2) + Number(v)); this.P.dirty = true; this.emit('col.format', { key, f: clone(f) }); this.render(); break; }
      default: if (this.extraClick) this.extraClick(a, v, b, e);
    }
  }
  pageMenu(anchor, id) {
    this.menu(anchor, [['rename', 'Renommer la page'], ['dup', 'Dupliquer la page'], ['del', 'Supprimer la page']], k => {
      if (k === 'rename') { if (this.gate('page.renameStart', id, anchor)) { this.st.renaming = id; this.render(); } }
      else this.emit('page.' + k, id);
    });
  }
  formatMenu(anchor) {
    const t = this.table(this.st.selTable), c = t.cols.find(x => x.n === this.st.selCol);
    let items;
    if (['dec', 'fixed', 'int', 'pct'].includes(c.t)) items = [['general', 'Général'], ['int', 'Nombre entier'], ['dec', 'Nombre décimal'], ['currency', 'Monnaie'], ['pct', 'Pourcentage']];
    else if (c.t === 'date') items = [['fr', 'jj/mm/aaaa'], ['iso', 'aaaa-mm-jj'], ['frt', 'jj/mm/aaaa hh:mm:ss'], ['long', 'jeudi 14 mars 2001']];
    else if (c.t === 'time') items = [['hms', 'hh:mm:ss'], ['hm', 'hh:mm']];
    else items = [['text', 'Texte']];
    this.menu(anchor, items, k => {
      const key = `${t.id}.${c.n}`; const f = this.P.formats[key] || (this.P.formats[key] = {});
      if (['dec', 'fixed', 'int', 'pct'].includes(c.t)) { f.style = k === 'general' ? undefined : k; if (k === 'currency') { f.cur = f.cur || 'EUR'; f.dec = f.dec ?? 2; } if (k === 'int') f.dec = 0; }
      else if (c.t === 'date') f.pattern = k;
      else if (c.t === 'time') { f.pattern = k; f.short = k === 'hm'; }
      this.P.dirty = true; this.emit('col.format', { key, f: clone(f) }); this.render();
    });
  }
  currencyMenu(anchor) {
    const t = this.table(this.st.selTable), key = `${t.id}.${this.st.selCol}`;
    this.menu(anchor, [['EUR', '€ Euro (France)'], ['USD', '$ Dollar (États-Unis)'], ['none', 'Aucun symbole']], k => {
      const f = this.P.formats[key] || (this.P.formats[key] = {});
      if (k === 'none') { if (f.style === 'currency') f.style = 'dec'; } else { f.style = 'currency'; f.cur = k; f.dec = f.dec ?? 2; }
      this.P.dirty = true; this.emit('col.format', { key, f: clone(f) }); this.render();
    });
  }

  /* ── Menus contextuels ── */
  menu(anchor, items, onPick, opts = {}) {
    this.closeMenu();
    const host = opts.host || this.el;
    const m = h(`<div class="menu" role="menu"></div>`);
    for (const it of items) {
      if (it === '-') { m.appendChild(h('<hr>')); continue; }
      if (typeof it === 'string') { m.appendChild(h(`<div class="mh">${esc(it)}</div>`)); continue; }
      const b = h(`<button role="menuitem" data-k="${esc(String(it[0]))}" class="${it[2] ? 'cur' : ''}">${it[3] ? `<span class="ty">${it[3]}</span>` : ''}${esc(it[1])}</button>`);
      b.addEventListener('click', ev => { ev.stopPropagation(); this.closeMenu(); onPick(it[0], b); });
      m.appendChild(b);
    }
    host.appendChild(m);
    this.applyMarks();
    /* L'ancre a pu être redessinée (sélection de colonne) : on reprend son double dans le rendu actuel */
    if (!anchor.isConnected && anchor.dataset) { const k = anchor.dataset.q ? 'q' : anchor.dataset.a ? 'a' : null; const nb = k && host.querySelector(`[data-${k}="${CSS.escape(anchor.dataset[k])}"]`); if (nb) anchor = nb; }
    const hb = host.getBoundingClientRect(), ab = anchor.getBoundingClientRect(), Z = hb.width / host.offsetWidth || 1;
    let x = (ab.left - hb.left) / Z, y = (ab.bottom - hb.top) / Z + 2;
    requestAnimationFrame(() => {
      const mw = m.offsetWidth, mh = m.offsetHeight, W = host.offsetWidth, H = host.offsetHeight;
      if (x + mw > W - 4) x = Math.max(4, W - mw - 4);
      if (y + mh > H - 4) y = Math.max(4, (ab.top - hb.top) / Z - mh - 2);
      m.style.left = x + 'px'; m.style.top = y + 'px'; m.classList.add('on');
    });
    this._menu = m;
    this._menuOff = ev => { if (!m.contains(ev.target)) this.closeMenu(); };
    setTimeout(() => document.addEventListener('pointerdown', this._menuOff, true), 0);
  }
  closeMenu() { if (this._menu) { this._menu.remove(); this._menu = null; document.removeEventListener('pointerdown', this._menuOff, true); } }

  /* ── Fichier (backstage) ── */
  openBackstage() {
    const bs = h(`<div class="backstage"><div class="bs-side">
      <button class="bs-back" data-b="back">${I.back}Retour</button>
      ${[['new', 'Nouveau'], ['open', 'Ouvrir'], ['save', 'Enregistrer'], ['saveas', 'Enregistrer sous'], ['export', 'Exporter en PDF'], ['publish', 'Publier'], ['options', 'Options'], ['quit', 'Quitter']].map(x => `<button data-b="${x[0]}">${x[1]}</button>`).join('')}
      </div><div class="bs-main"><b>${esc(this.fileTitle())}</b>${this.P.name ? 'Documents › Wonderland' : 'Fichier non enregistré'}</div></div>`);
    this.el.appendChild(bs);
    this.applyMarks();
    requestAnimationFrame(() => bs.classList.add('on'));
    bs.addEventListener('click', e => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      const k = b.dataset.b;
      if (k === 'back') { this.closeBackstage(); this.emit('file', 'back'); return; }
      const r = this.emit('file', k);
      if (r === 'no') shake(b);
    });
    this._bs = bs;
  }
  closeBackstage() { if (this._bs) { const b = this._bs; this._bs = null; b.classList.remove('on'); setTimeout(() => b.remove(), 300); } }

  /* ── Boîtes de dialogue ── */
  dialog(title, body, buttons, opts = {}) {
    this.closeDialog(true);
    this.dlgKind = opts.kind || title;
    const w = h(`<div class="dlg-wrap"><div class="dlg" role="dialog" aria-label="${esc(title)}"><div class="dlg-h"><b>${esc(title)}</b><button class="dlg-x" aria-label="Fermer">${I.close}</button></div><div class="dlg-b"></div><div class="dlg-f"></div></div></div>`);
    $('.dlg-b', w).appendChild(body);
    if (opts.tall) $('.dlg', w).style.height = '96%';
    const foot = $('.dlg-f', w);
    (buttons || []).forEach(bt => { const b = h(`<button class="fbtn ${bt.pri ? 'pri' : ''}" ${bt.id ? `data-d="${bt.id}"` : ''}>${esc(bt.t)}</button>`); b.addEventListener('click', () => bt.fn(b)); foot.appendChild(b); });
    if (!buttons || !buttons.length) foot.remove();
    $('.dlg-x', w).addEventListener('click', () => { if (opts.onX) opts.onX($('.dlg-x', w)); else this.closeDialog(); });
    this.el.appendChild(w);
    requestAnimationFrame(() => w.classList.add('on'));
    this.dlg = w;
    this.applyMarks();
    return w;
  }
  closeDialog(now) { this.dlgKind = null; if (this.dlg) { const w = this.dlg; this.dlg = null; if (now) w.remove(); else { w.classList.remove('on'); setTimeout(() => w.remove(), 250); } } }

  /* Obtenir les données */
  getData(opts = {}) {
    const list = opts.list || [['excel', 'Classeur Excel', '#1D7A45', 'XLS'], ['csv', 'Texte/CSV', '#4C6FD6', 'CSV'], ['sql', 'SQL Server', '#6A5ACD', 'SQL'], ['web', 'Web', '#0E8A9A', 'WEB'], ['pdf', 'PDF', '#D2453B', 'PDF'], ['folder', 'Dossier', '#E0A526', 'DIR'], ['sharepoint', 'SharePoint', '#0F7B6C', 'SP'], ['enter', 'Entrer des données', '#605E5C', '+']];
    let sel = null;
    const body = h(`<div><div class="crumbs">Sources de données courantes</div><div class="conn-grid">${list.map(c => `<button class="conn" data-c="${c[0]}"><i style="background:${c[2]}">${c[3]}</i>${esc(c[1])}</button>`).join('')}</div></div>`);
    body.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; sel = b.dataset.c; $$('.conn', body).forEach(x => x.classList.toggle('sel', x === b)); this.emit('connector.pick', sel); });
    return this.dialog('Obtenir les données', body, [
      { t: 'Se connecter', pri: true, id: 'connect', fn: b => { if (!sel) { shake(b); this.emit('connector', null); return; } const r = this.emit('connector', sel); if (r === 'no') shake($(`[data-c="${sel}"]`, body)); } },
      { t: 'Annuler', id: 'cancel', fn: b => { if (this.emit('dialog.cancel', 'getdata') !== 'no') this.closeDialog(); else shake(b); } }
    ], { kind: 'getdata' });
  }
  /* Ouvrir un fichier */
  filePicker(files, opts = {}) {
    let sel = null;
    const body = h(`<div><div class="crumbs">${I.chev.replace('<svg', '<svg width="10" height="10" style="transform:rotate(-90deg)"')} Documents › Wonderland</div><div class="flist">${files.map(f => `<button class="frow" data-f="${f.id}"><span class="ficon ${f.type}">${f.type === 'dir' ? '' : f.type.toUpperCase()}</span><span>${esc(f.nom)}</span><time>${esc(f.date || '')}</time></button>`).join('')}</div>
      <div class="fname"><span>Nom du fichier${NB}:</span><input readonly value="" aria-label="Nom du fichier"></div></div>`);
    body.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; sel = b.dataset.f; $$('.frow', body).forEach(x => x.classList.toggle('sel', x === b)); $('input', body).value = files.find(f => f.id === sel).nom; this.emit('file.pick', sel); });
    return this.dialog(opts.title || 'Ouvrir', body, [
      { t: 'Ouvrir', pri: true, id: 'open', fn: b => { if (!sel) { shake(b); this.emit('file.open', null); return; } const r = this.emit('file.open', sel); if (r === 'no') shake($(`[data-f="${sel}"]`, body)); } },
      { t: 'Annuler', id: 'cancel', fn: b => { if (this.emit('dialog.cancel', 'open') !== 'no') this.closeDialog(); else shake(b); } }
    ], { kind: 'open', onX: b => { if (this.emit('dialog.cancel', 'open') !== 'no') this.closeDialog(); else shake(b); } });
  }
  /* Message */
  message(title, text, buttons) {
    return this.dialog(title, h(`<p style="font-size:12.5px; line-height:1.45; padding:4px 2px 6px">${esc(fr(text))}</p>`), buttons);
  }
  /* Chargement */
  loading(label, rows) {
    return new Promise(res => {
      const body = h(`<div class="progress"><p>${esc(fr(label))}</p><div class="bar"><i></i></div><small>0 ligne chargée</small></div>`);
      this.dialog('Chargement', body, [{ t: 'Annuler', fn: b => { if (this.emit('load.cancel', null) !== 'ok') shake(b); } }], { kind: 'loading', onX: b => { if (this.emit('load.cancel', null) !== 'ok') shake(b); } });
      requestAnimationFrame(() => requestAnimationFrame(() => { $('.bar i', body).style.width = '100%'; }));
      let n = 0; const tot = rows; const step = Math.max(1, Math.ceil(tot / 8));
      const iv = setInterval(() => { n = Math.min(tot, n + step); $('small', body).textContent = fr(`${n} ${n > 1 ? 'lignes chargées' : 'ligne chargée'}`); if (n >= tot) { clearInterval(iv); setTimeout(() => { this.closeDialog(); res(); this.emit('load.done', null); }, 450); } }, window.PBQ_FAST ? 10 : 190);
    });
  }
  /* Enregistrer sous */
  saveAs(opts = {}) {
    const body = h(`<div><div class="crumbs">Documents › Wonderland</div>
      <div class="fname" style="margin-top:2px"><span>Nom${NB}:</span><input value="${esc(opts.name || 'Sans titre')}" aria-label="Nom du fichier" spellcheck="false" autocapitalize="off"></div>
      <div class="fname"><span>Type${NB}:</span><button class="sel-box" data-x="ext" style="flex:1">Fichiers Power BI (*.pbix)</button></div></div>`);
    let ext = 'pbix';
    $('[data-x="ext"]', body).addEventListener('click', e => this.menu(e.currentTarget, [['pbix', 'Fichiers Power BI (*.pbix)', ext === 'pbix'], ['pbit', 'Modèle Power BI (*.pbit)'], ['xlsx', 'Classeur Excel (*.xlsx)'], ['pdf', 'Document PDF (*.pdf)']], k => { ext = k; $('[data-x="ext"]', body).textContent = { pbix: 'Fichiers Power BI (*.pbix)', pbit: 'Modèle Power BI (*.pbit)', xlsx: 'Classeur Excel (*.xlsx)', pdf: 'Document PDF (*.pdf)' }[k]; }));
    const inp = $('input', body);
    setTimeout(() => { inp.focus(); inp.select(); }, 80);
    const go = b => { const name = inp.value.trim().replace(/\.pbix$/i, ''); const r = this.emit('saveas', { name, ext }); if (r === 'no') shake(b || inp); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    return this.dialog('Enregistrer sous', body, [{ t: 'Enregistrer', pri: true, id: 'save', fn: go }, { t: 'Annuler', id: 'cancel', fn: b => { if (this.emit('dialog.cancel', 'saveas') !== 'no') this.closeDialog(); else shake(b); } }], { kind: 'saveas' });
  }

  /* ── Navigateur (classeur Excel) ── */
  navigator(spec) {
    const st = { focus: spec.focus || null, checked: new Set(spec.checked || []) };
    const body = h(`<div class="nav-split"><div class="nav-tree"></div><div class="nav-prev"></div></div>`);
    const draw = () => {
      const tree = $('.nav-tree', body), prev = $('.nav-prev', body);
      tree.innerHTML = `<button class="tree-t nav-root" data-o="root" style="height:26px; padding:0 4px">${I.chev}${esc(spec.file)} [${spec.objects.length}]</button>`;
      body.classList.toggle('compact', !!st.compact);
      for (const o of spec.objects) tree.appendChild(h(`<div class="nav-obj ${st.focus === o.id ? 'focus' : ''}" data-o="${o.id}"><button class="cbx ${st.checked.has(o.id) ? 'on' : ''}" data-chk="${o.id}" aria-label="Sélectionner ${esc(o.nom)}"></button><span>${o.kind === 'Table' ? I.tbl : I.sheet}</span><span>${esc(o.nom)}</span><span class="kind">${o.kind === 'Table' ? 'Tableau' : 'Feuille'}</span></div>`));
      prev.innerHTML = '';
      const o = spec.objects.find(x => x.id === st.focus);
      if (!o) prev.appendChild(h(`<div class="prev-empty">Sélectionne un élément pour afficher son aperçu.</div>`));
      else { prev.appendChild(h(`<div class="np-h">${esc(o.nom)}</div>`)); prev.appendChild(this.gridTable(o.cols, o.rows, { rowAct: o.rowAct ? 'navrow' : null, selRow: st.selRow, raw: o.raw, hit: spec.hit })); }
      if (st.compact && st.selRow != null) requestAnimationFrame(() => { const r = $('tr.sel', prev), sc = body.closest('.dlg-b'); if (r && sc) sc.scrollTop += r.getBoundingClientRect().top - sc.getBoundingClientRect().top - 64; });
      $('[data-d="load"]', this.dlg) && ($('[data-d="load"]', this.dlg).disabled = !st.checked.size);
      this.applyMarks();
    };
    body.addEventListener('click', e => {
      const c = e.target.closest('[data-chk]');
      if (c) { e.stopPropagation(); const id = c.dataset.chk; const on = !st.checked.has(id); on ? st.checked.add(id) : st.checked.delete(id); if (!st.focus && on) st.focus = id; draw(); this.emit('nav.check', { id, on, set: [...st.checked] }); return; }
      const r = e.target.closest('[data-a^="navrow:"]');
      if (r) { const i = +r.dataset.a.split(':')[1]; st.selRow = i; draw(); this.emit('nav.row', { focus: st.focus, i }); return; }
      const o = e.target.closest('[data-o]');
      if (o) { const r = this.emit('nav.focus', o.dataset.o); if (r === 'no') { shake(o); return; } if (o.dataset.o === 'root') return; st.focus = o.dataset.o; st.selRow = null; draw(); }
    });
    this.dialog('Navigateur', body, [
      { t: 'Charger', pri: true, id: 'load', fn: b => { const r = this.emit('nav.load', [...st.checked]); if (r === 'no') shake(b); } },
      { t: 'Transformer les données', id: 'transform', fn: b => { if (this.emit('nav.transform', [...st.checked]) === 'no') shake(b); } },
      { t: 'Annuler', id: 'cancel', fn: b => { if (this.emit('nav.cancel', null) !== 'no') this.closeDialog(); else shake(b); } }
    ], { tall: true, kind: 'nav', onX: b => { if (this.emit('nav.close', null) !== 'no') this.closeDialog(); else shake(b); } });
    draw();
    this.navState = st; this.navDraw = draw;
    return st;
  }

  /* ── Importation Texte/CSV ── */
  csvDialog(spec) {
    const st = { enc: spec.enc || 1252, delim: spec.delim || ',', detect: 'all', selRow: null };
    const ENC = [[1252, '1252 : Europe occidentale (Windows)'], [65001, '65001 : Unicode (UTF-8)'], [20127, '20127 : US-ASCII'], [28591, '28591 : Europe occidentale (ISO)'], [1200, '1200 : Unicode (UTF-16 LE)'], [1201, '1201 : Unicode (UTF-16 BE)']];
    const DEL = [[',', 'Virgule'], [';', 'Point-virgule'], ['\t', 'Tabulation'], [' ', 'Espace'], [':', 'Deux-points'], ['-', 'Personnalisé : -'], ['|', 'Personnalisé : |'], ['', 'Aucun']];
    const DET = [['200', 'Selon les 200 premières lignes'], ['all', 'Selon le jeu de données entier'], ['none', 'Ne pas détecter les types de données']];
    const body = h(`<div class="csv-wrap"><div class="csv-opts">
      <div><label>Origine du fichier</label><button class="sel-box" data-x="enc"></button></div>
      <div><label>Délimiteur</label><button class="sel-box" data-x="delim"></button></div>
      <div style="grid-column:1/-1"><label>Détection du type de données</label><button class="sel-box" data-x="detect"></button></div></div>
      <div class="nav-prev" style="max-height:none; min-height:160px"></div></div>`);
    const decode = s => st.enc === 65001 ? s : st.enc === 1252 || st.enc === 28591 ? s.replace(/é/g, 'Ã©').replace(/è/g, 'Ã¨').replace(/à/g, 'Ã ') : st.enc === 20127 ? s.replace(/[éèà]/g, '?') : s.replace(/./g, c => c + '\u0000').replace(/\u0000/g, '');
    const parse = () => {
      const lines = spec.text.split('\n').map(decode);
      if (st.enc === 1200 || st.enc === 1201) return { cols: [{ n: 'Column1', t: 'text' }], rows: [{ Column1: '㤀〻㠴㐻⸹…' }], ncol: 1 };
      const split = l => st.delim === '' ? [l] : l.split(st.delim);
      const head = split(lines[0]);
      const cols = head.map((x, i) => ({ n: head.length === 1 ? 'Column1' : x || `Column${i + 1}`, t: 'text' }));
      const rows = lines.slice(1).map(l => { const v = split(l); const o = {}; cols.forEach((c, i) => o[c.n] = v[i] ?? ''); return o; });
      if (head.length === 1) { rows.unshift({ Column1: lines[0] }); }
      return { cols, rows, ncol: head.length };
    };
    const draw = () => {
      $('[data-x="enc"]', body).textContent = ENC.find(e => e[0] === st.enc)[1];
      $('[data-x="delim"]', body).textContent = DEL.find(e => e[0] === st.delim)[1];
      $('[data-x="detect"]', body).textContent = DET.find(e => e[0] === st.detect)[1];
      const p = parse(); this.csvParsed = p;
      const pv = $('.nav-prev', body); pv.innerHTML = '';
      body.classList.toggle('compact', !!st.compact);
      pv.appendChild(this.gridTable(p.cols, p.rows, { raw: true, rowAct: 'csvrow', selRow: st.selRow, hit: spec.hit }));
      if (st.compact && st.selRow != null) requestAnimationFrame(() => { const r = $('tr.sel', pv), sc = body.closest('.dlg-b'); if (r && sc) sc.scrollTop += r.getBoundingClientRect().top - sc.getBoundingClientRect().top - 40; });
      this.applyMarks();
    };
    body.addEventListener('click', e => {
      const x = e.target.closest('[data-x]');
      if (x) {
        const k = x.dataset.x, src = k === 'enc' ? ENC : k === 'delim' ? DEL : DET;
        this.menu(x, src.map(o => [String(o[0]), o[1], String(o[0]) === String(st[k])]), val => {
          const before = st[k];
          st[k] = k === 'enc' ? Number(val) : val;
          draw();
          this.emit(k === 'enc' ? 'csv.enc' : k === 'delim' ? 'csv.delim' : 'csv.detect', { value: st[k], before, parsed: this.csvParsed });
        }, { host: this.el });
        return;
      }
      const r = e.target.closest('[data-a^="csvrow:"]');
      if (r) { st.selRow = +r.dataset.a.split(':')[1]; draw(); this.emit('csv.row', { i: st.selRow, row: this.csvParsed.rows[st.selRow], parsed: this.csvParsed }); }
    });
    this.dialog(spec.file, body, [
      { t: 'Charger', pri: true, id: 'load', fn: b => { if (this.emit('csv.load', { st: { ...st }, parsed: this.csvParsed }) === 'no') shake(b); } },
      { t: 'Transformer les données', id: 'transform', fn: b => { if (this.emit('csv.transform', null) === 'no') shake(b); } },
      { t: 'Annuler', id: 'cancel', fn: b => { if (this.emit('csv.cancel', null) !== 'no') this.closeDialog(); else shake(b); } }
    ], { tall: true, kind: 'csv', onX: b => { if (this.emit('csv.close', null) !== 'no') this.closeDialog(); else shake(b); } });
    draw();
    this.csvState = st; this.csvDraw = draw;
    return st;
  }

  /* ── Éditeur Power Query ── */
  openPQ(queries, opts = {}) {
    this.closePQ(true);
    this.pqLabel = opts.label || '';
    const pq = { queries, cur: opts.cur || 0, selStep: null, selCol: null, errSel: null, dirty: false };
    this.pqs = pq;
    const el = h(`<div class="pq" role="dialog" aria-label="Éditeur Power Query"></div>`);
    this.pqEl = el;
    this.el.appendChild(el);
    el.addEventListener('click', e => this.pqClick(e));
    this.pqRender();
    requestAnimationFrame(() => el.classList.add('on'));
    return pq;
  }
  /* Fermer et appliquer : chaque requête met à jour sa table du modèle */
  applyPQ() {
    for (const q of (this.pqs ? this.pqs.queries : [])) {
      if (!q.tableId) continue;
      const t = this.P.tables.find(x => x.id === q.tableId); if (!t) continue;
      const T = evalQuery(q); t.cols = T.cols.map(c => ({ n: c.n, t: c.t === 'any' ? 'text' : c.t })); t.rows = T.rows;
    }
    this.P.dirty = true;
  }
  closePQ(now) { if (this.pqEl) { const el = this.pqEl; this.pqEl = null; this.pqs = null; if (now) el.remove(); else { el.classList.remove('on'); setTimeout(() => el.remove(), 360); } } }
  pqQuery() { return this.pqs.queries[this.pqs.cur]; }
  pqTable() { const q = this.pqQuery(); const i = this.pqs.selStep === null ? q.steps.length - 1 : this.pqs.selStep; return evalQuery(q, i); }
  pqRender() {
    const pq = this.pqs, el = this.pqEl; if (!pq || !el) return;
    const q = this.pqQuery(), T = this.pqTable();
    const stepIdx = pq.selStep === null ? q.steps.length - 1 : pq.selStep;
    const col = T.cols.find(c => c.n === pq.selCol);
    const errs = T.rows.reduce((a, r) => a + T.cols.filter(c => r[c.n] && r[c.n].err).length, 0);
    el.innerHTML = '';
    el.appendChild(h(`<div class="pq-title"><i class="pbi-logo">${pbiLogo}</i><b>Éditeur Power Query</b><span style="color:var(--f-mid)">${esc(this.pqLabel || '')}</span><button class="dlg-x" data-q="x" style="margin-left:auto" aria-label="Fermer l’éditeur">${I.close}</button></div>`));
    const rb = h(`<div class="rb-cmds" style="border-bottom:1px solid var(--f-line)"></div>`);
    const cmds = [['apply', 'Fermer et appliquer', I.save], ['newsource', 'Nouvelle source', I.get], ['cols', 'Supprimer les colonnes', I.col], ['rows', 'Supprimer les lignes', I.table], ['replace', 'Remplacer les valeurs', I.transform]];
    for (const c of cmds) rb.appendChild(h(`<button class="rb-cmd" data-q="cmd:${c[0]}">${c[2]}<span>${esc(c[1])}</span></button>`));
    rb.appendChild(h(`<button class="rb-cmd" data-q="typemenu" style="min-width:96px; max-width:none; align-items:flex-start; text-align:left" ${col ? '' : 'disabled'}><span style="color:var(--f-mid)">Type de données</span><b style="font-size:11px; display:flex; gap:3px; align-items:center; white-space:nowrap">${col ? esc((TYPES[col.t] || TYPES.any).nom) : 'Aucune colonne'} ${I.chev.replace('<svg', '<svg width="10" height="10"')}</b></button>`));
    el.appendChild(rb);
    const qs = h(`<div class="pq-q"><span>Requêtes [${pq.queries.length}]</span>${pq.queries.map((x, i) => `<button class="tsel ${i === pq.cur ? 'on' : ''}" data-q="query:${i}">${I.tbl}${esc(x.name)}</button>`).join('')}</div>`);
    el.appendChild(qs); keepVisible(qs, '.tsel.on');
    const body = h(`<div class="pq-body"><div class="pq-formula"><span>fx</span><code></code></div><div class="grid"></div></div>`);
    $('code', body).textContent = stepFormula(q.steps[stepIdx])(q);
    $('.grid', body).appendChild(this.gridTable(T.cols, T.rows, { rn: true, types: true, typeAct: 'pqtype', colAct: 'pqcol', selCol: pq.selCol, errAct: 'pqerr', errSel: pq.errSel, filterAct: 'pqfilter', fmtKey: null }));
    el.appendChild(body);
    if (pq.errSel) {
      const r = T.rows[pq.errSel.r], v = r && r[pq.errSel.c];
      if (v && v.err) el.appendChild(h(`<div class="err-detail"><b>${esc(v.err)}${NB}: nous n’avons pas pu convertir en ${esc((TYPES[v.type] || {}).nom || 'ce type')}.</b>Détails${NB}: ${esc(v.raw)}</div>`));
    }
    const stepsEl = h(`<div class="pq-steps"><h5 data-q="stepsh"><span>Étapes appliquées</span><span class="qbadge">${T.cols.length} colonnes, ${T.rows.length} lignes${errs ? `, ${errs} erreur${errs > 1 ? 's' : ''}` : ''}</span></h5><ol></ol></div>`);
    q.steps.forEach((s, i) => $('ol', stepsEl).appendChild(h(`<li><button class="step ${i === stepIdx ? 'cur' : ''}" data-q="step:${i}"><span>${esc(s.name)}</span>${s.op !== 'source' && s.op !== 'nav' && s.op !== 'promote' ? `<span class="x" data-q="delstep:${i}" aria-label="Supprimer l’étape">${I.close.replace('<svg', '<svg width="12" height="12"')}</span>` : ''}</button></li>`)));
    el.appendChild(stepsEl);
    this.applyMarks();
  }
  pqClick(e) {
    const b = e.target.closest('[data-q], [data-a]'); if (!b) return;
    const raw = b.dataset.q || b.dataset.a; const k = raw.indexOf(':'); const a = k < 0 ? raw : raw.slice(0, k), v = k < 0 ? null : raw.slice(k + 1);
    const pq = this.pqs, q = this.pqQuery();
    switch (a) {
      case 'x': this.emit('pq.close', { dirty: pq.dirty }) !== 'no' ? null : shake(b); break;
      case 'cmd':
        if (v === 'apply') { this.emit('pq.apply', { dirty: pq.dirty }) === 'no' && shake(b); break; }
        if (this.emit('pq.cmd', v) === 'no') { shake(b); break; }
        if (v === 'replace') this.replaceDialog(b);
        break;
      case 'query': if (this.emit('pq.query', +v) !== 'no') { pq.cur = +v; pq.selStep = null; pq.selCol = null; pq.errSel = null; this.pqRender(); } else shake(b); break;
      case 'stepsh': this.emit('pq.steps', null); break;
      case 'step': if (e.target.closest('[data-q^="delstep"]')) return; if (this.emit('pq.step', +v) !== 'no') { pq.selStep = +v === q.steps.length - 1 ? null : +v; pq.errSel = null; this.pqRender(); } break;
      case 'delstep': { e.stopPropagation(); if (this.emit('pq.delstep', { i: +v, step: q.steps[+v], query: q.name }) === 'no') { shake(b); break; } q.steps.splice(+v, 1); pq.selStep = null; pq.errSel = null; pq.dirty = true; this.pqRender(); this.emit('pq.change', { what: 'delstep', query: q.name, table: this.pqTable() }); break; }
      case 'pqcol': if (this.emit('pq.col', { col: v, query: q.name }) !== 'no') { pq.selCol = v; this.pqRender(); } break;
      case 'pqtype': e.stopPropagation(); if (this.emit('pq.col', { col: v, query: q.name }) === 'no') { shake(b); break; } pq.selCol = v; this.pqRender(); this.typeMenu($(`[data-a="pqtype:${CSS.escape(v)}"]`, this.pqEl) || b); break;
      case 'typemenu': if (pq.selCol) this.typeMenu(b); else shake(b); break;
      case 'pqerr': { const [r, c] = v.split('|'); pq.errSel = { r: +r, c }; this.pqRender(); this.emit('pq.err', { r: +r, c, row: this.pqTable().rows[+r], query: q.name }); break; }
      case 'pqfilter': e.stopPropagation(); this.filterPop(b, v); break;
    }
  }
  typeMenu(anchor) {
    const pq = this.pqs, T = this.pqTable(), col = T.cols.find(c => c.n === pq.selCol);
    const order = ['dec', 'fixed', 'int', 'pct', '-', 'datetime', 'date', 'time', 'dtz', 'dur', '-', 'text', '-', 'bool', '-', 'bin', '-', 'locale'];
    const items = order.map(k => k === '-' ? '-' : k === 'locale' ? ['locale', 'Utiliser les paramètres régionaux…'] : [k, TYPES[k].nom, col && col.t === k, tyIcon(k)]);
    this.menu(anchor, items, k => { if (k === 'locale') this.localeDialog(); else this.setType(pq.selCol, k); }, { host: this.el });
  }
  setType(colName, type, loc) {
    const pq = this.pqs, q = this.pqQuery();
    const r = this.emit('pq.typeTry', { col: colName, type, loc, query: q.name });
    if (r === 'no') return;
    const curIdx = pq.selStep === null ? q.steps.length - 1 : pq.selStep;
    const cur = q.steps[curIdx];
    const uniq = base => { let n = base, k = 1; while (q.steps.some(s => s.name === n)) n = base + ' ' + k++; return n; };
    const apply = mode => {
      if (mode === 'replace') cur.changes = cur.changes.map(c => c[0] === colName ? [colName, type, loc] : c);
      else if (mode === 'merge') cur.changes.push([colName, type, loc]);
      else {
        q.steps.splice(curIdx + 1, 0, { op: 'type', name: uniq(loc ? 'Type modifié avec paramètres régionaux' : 'Type modifié'), changes: [[colName, type, loc]] });
        pq.selStep = curIdx + 1 === q.steps.length - 1 ? null : curIdx + 1;
      }
      pq.dirty = true; pq.errSel = null;
      this.pqRender();
      this.emit('pq.type', { col: colName, type, loc, mode, query: q.name, table: this.pqTable(), full: evalQuery(q) });
    };
    if (cur && cur.op === 'type' && cur.changes.some(c => c[0] === colName)) {
      const body = h(`<p style="font-size:12.5px; line-height:1.45; padding:4px 2px 6px">${esc(fr('Une conversion de type existe déjà pour cette colonne dans l’étape « ' + cur.name + ' ». Veux-tu remplacer cette conversion, ou ajouter la nouvelle dans une étape séparée ?'))}</p>`);
      this.dialog('Modifier le type de colonne', body, [
        { t: 'Remplacer l’actuel', pri: true, id: 'replace', fn: () => { this.closeDialog(); apply('replace'); } },
        { t: 'Ajouter une nouvelle étape', id: 'newstep', fn: () => { this.closeDialog(); apply('new'); } },
        { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }
      ], { kind: 'typeConfirm' });
      return;
    }
    apply(cur && cur.op === 'type' && curIdx === q.steps.length - 1 && !loc && !cur.changes.some(c => c[2]) ? 'merge' : 'new');
  }
  localeDialog() {
    const pq = this.pqs; let type = 'date', loc = 'fr-FR';
    const body = h(`<div style="display:grid; gap:10px"><p style="font-size:12px; color:var(--f-mid)">Modifie le type de la colonne ${esc(pq.selCol)} en interprétant ses valeurs selon les conventions d’un pays.</p>
      <div><label style="font-size:11px; color:var(--f-mid)">Type de données</label><button class="sel-box" data-x="t"></button></div>
      <div><label style="font-size:11px; color:var(--f-mid)">Paramètres régionaux</label><button class="sel-box" data-x="l"></button></div></div>`);
    const draw = () => { $('[data-x="t"]', body).textContent = TYPES[type].nom; $('[data-x="l"]', body).textContent = LOCALES[loc]; };
    body.addEventListener('click', e => {
      const x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 't') this.menu(x, ['dec', 'fixed', 'int', 'date', 'time', 'datetime', 'text'].map(k => [k, TYPES[k].nom, k === type]), k => { type = k; draw(); }, { host: this.el });
      else this.menu(x, Object.entries(LOCALES).map(([k, n]) => [k, n, k === loc]), k => { loc = k; draw(); }, { host: this.el });
    });
    this.dialog('Modifier le type avec les paramètres régionaux', body, [{ t: 'OK', pri: true, id: 'ok', fn: () => { this.closeDialog(); this.setType(pq.selCol, type, loc); } }, { t: 'Annuler', fn: () => this.closeDialog() }], { kind: 'locale' });
    draw();
  }
  replaceDialog(anchor) {
    const pq = this.pqs;
    if (!pq.selCol) { shake(anchor); this.emit('pq.replaceNoCol', null); return; }
    const body = h(`<div style="display:grid; gap:8px"><p style="font-size:12px; color:var(--f-mid)">Remplace une valeur par une autre dans la colonne ${esc(pq.selCol)}.</p>
      <div class="fname"><span style="width:118px">Valeur à rechercher</span><input data-x="from" spellcheck="false" autocapitalize="off"></div>
      <div class="fname"><span style="width:118px">Remplacer par</span><input data-x="to" spellcheck="false" autocapitalize="off"></div></div>`);
    this.dialog('Remplacer les valeurs', body, [{ t: 'OK', pri: true, fn: b => {
      const from = $('[data-x="from"]', body).value.trim(), to = $('[data-x="to"]', body).value.trim();
      if (!from) { shake($('[data-x="from"]', body)); return; }
      if (this.emit('pq.replaceTry', { col: pq.selCol, from, to, query: this.pqQuery().name, at: pq.selStep === null ? this.pqQuery().steps.length - 1 : pq.selStep }) === 'no') { shake(b); return; }
      const q = this.pqQuery(); const step = { op: 'replace', name: 'Valeur remplacée' + (q.steps.filter(s => s.op === 'replace').length ? ' ' + q.steps.filter(s => s.op === 'replace').length : ''), col: pq.selCol, from, to };
      if (pq.selStep !== null && pq.selStep < q.steps.length - 1) { q.steps.splice(pq.selStep + 1, 0, step); pq.selStep = pq.selStep + 1; }
      else q.steps.push(step);
      pq.dirty = true; this.closeDialog(); this.pqRender(); this.emit('pq.replace', { col: step.col, from, to, query: q.name, table: this.pqTable(), full: evalQuery(q) });
    }, id: 'ok' }, { t: 'Annuler', fn: () => this.closeDialog() }], { kind: 'replace' });
    setTimeout(() => $('[data-x="from"]', body).focus(), 60);
  }
  filterPop(anchor, colName) {
    const T = this.pqTable(); const vals = [...new Set(T.rows.map(r => r[colName]))];
    const body = h(`<div class="filter-pop">${vals.map(v => `<label><input type="checkbox" data-v="${String(v)}" checked> ${v === true ? 'TRUE' : v === false ? 'FALSE' : esc(String(v))}</label>`).join('')}</div>`);
    this.dialog(`Filtrer ${colName}`, body, [{ t: 'OK', pri: true, fn: () => {
      const keep = $$('input', body).filter(i => i.checked).map(i => i.dataset.v === 'true' ? true : i.dataset.v === 'false' ? false : i.dataset.v);
      this.closeDialog();
      if (keep.length === vals.length) return;
      const q = this.pqQuery();
      if (this.emit('pq.filterTry', { col: colName, keep, query: q.name }) === 'no') return; q.steps.push({ op: 'filter', name: 'Lignes filtrées', col: colName, keep });
      this.pqs.selStep = null; this.pqs.dirty = true; this.pqRender(); this.emit('pq.filter', { col: colName, keep, query: q.name, table: this.pqTable() });
    }, id: 'ok' }, { t: 'Annuler', fn: () => this.closeDialog() }], { kind: 'filter' });
  }
}
function clampDec(n) { return Math.max(0, Math.min(4, n)); }

PBI.renderChart = renderChart; PBI.PAL = PAL; PBI.niceMax = niceMax;
PBI.convert = convert; PBI.evalQuery = evalQuery; PBI.stepFormula = (q, i) => stepFormula(q.steps[i])(q).replace(/^= /, ''); PBI.TYPES = TYPES; PBI.show = show; PBI.I = I;
window.PBI = PBI;
})();
