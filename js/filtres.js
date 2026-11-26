/* Power BI Quest — volet Filtres, segments et interactions entre visuels (missions 108 et suivantes) */
(function () {
'use strict';
const PBI = window.PBI, P_ = PBI.prototype;
const { h, esc, fr, $, shake } = window.PBQ;
const NUM = ['int', 'dec', 'fixed', 'pct'];
const tableOf = (P, id) => P.tables.find(t => t.id === id);
const colType = (P, f) => { const t = tableOf(P, f.t); const c = t && t.cols.find(c => c.n === f.c); return c ? c.t : 'text'; };
const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b), 'fr', { numeric: true });
const CH = () => PBI.CHART_T;
const ERASER = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M9.5 3.2l3.3 3.3-6 6H3.6L2.4 11.3a1 1 0 010-1.4z"/><path d="M6.2 6.5l3.3 3.3M7 12.5h6.5"/></svg>';
const IC = {
  filter: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M2.5 3.5h11l-4.2 5v4.2l-2.6-1.3V8.5z"/></svg>',
  highlight: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="2.5" y="8" width="3" height="5.5" rx=".5" opacity=".4"/><rect x="6.5" y="3" width="3" height="10.5" rx=".5"/><rect x="10.5" y="6" width="3" height="7.5" rx=".5" opacity=".4"/></svg>',
  none: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5.3"/><path d="M4.3 11.7l7.4-7.4"/></svg>',
  inter: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="7" height="6" rx="1"/><rect x="10.5" y="11" width="7" height="6" rx="1"/><path d="M6 9v4.5h4.5M14 11V6.5H9.5" stroke-linecap="round"/></svg>'
};
const LBL = { filter: 'Filtrer', highlight: 'Mettre en surbrillance', none: 'Aucune' };

/* Les outils avancés du rapport arrivent avec la mission 108 */
P_.adv = function () { return ((this.opts && this.opts.mission) || 0) >= 108; };

/* ───────── Interactions entre visuels ───────── */
P_.inter = function (src, tgt) {
  const m = (this.P.interactions || {})[src.id + '>' + tgt.id];
  if (m) return m;
  return CH().includes(src.type) && CH().includes(tgt.type) ? 'highlight' : 'filter';
};
const DECO = ['text', 'shape', 'button', 'navigator', 'image'];
P_.interModes = (src, tgt) => src.type !== 'slicer' && CH().includes(tgt.type) ? ['filter', 'highlight', 'none'] : ['filter', 'none'];
P_.formatTab = function () {
  if (!this.adv()) return [];
  return [['interactions', 'Modifier les interactions', IC.inter, this.st.editInter ? 'on' : '']];
};
P_.cmdAct = function (cmd) {
  if (cmd === 'interactions' && this.adv()) { this.st.editInter = !this.st.editInter; this.render(); this.emit('interaction.mode', { on: this.st.editInter }); }
  else if (cmd === 'filterpane' && this.adv()) { this.st.pane = 'Filtres'; this.render(); }
};
const baseVE = P_.visualEl;
P_.visualEl = function (v) {
  const el = baseVE.call(this, v), st = this.st;
  if (!st.editInter || !st.selVis || st.focus || st.view !== 'report') return el;
  if (v.id === st.selVis) { el.classList.add('is-src'); return el; }
  const pg = this.page(), src = pg && pg.visuals.find(o => o.id === st.selVis);
  if (!src || DECO.includes(src.type) || DECO.includes(v.type) || !pg.visuals.some(o => o.id === v.id)) return el;
  const cur = this.inter(src, v);
  el.appendChild(h(`<div class="vi-bar">${this.interModes(src, v).map(m => `<button class="vi-b ${m === cur ? 'on' : ''}" data-a="inter:${src.id}|${v.id}|${m}" aria-label="${LBL[m]}" title="${LBL[m]}">${IC[m]}</button>`).join('')}</div>`));
  return el;
};

/* ───────── Segments ───────── */
const baseSlicer = P_.renderers.slicer;
P_.slicerStyles = function (v) {
  const f = (v.f.values || [])[0], ty = f ? colType(this.P, f) : 'text';
  if (f && ty === 'date' && !f.hier) return [['list', 'Liste verticale'], ['range', 'Entre'], ['relative', 'Date relative']];
  if (f && NUM.includes(ty)) return [['list', 'Liste verticale'], ['range', 'Entre']];
  return [['list', 'Liste verticale']];
};
P_.slicerFormat = function (v, row, sel, tog) {
  const fm = v.fmt || {}, styles = this.slicerStyles(v), mode = v.mode || 'list';
  if (styles.length > 1) row('Style', sel('mode', styles, mode));
  if (mode !== 'range') { row('Sélection unique', tog('single', !!fm.single)); if (!fm.single) row('Multisélection avec Ctrl', tog('ctrl', fm.ctrl !== false)); }
};
P_.renderers.slicer = function (el, v) {
  const f = (v.f.values || [])[0];
  if (!f) return baseSlicer.call(this, el, v);
  const P = this.P, T = tableOf(P, f.t), ty = colType(P, f), fm = P.formats[f.t + '.' + f.c] || {};
  const hier = ty === 'date' && f.hier;
  const show = x => hier ? String(x) : PBI.show(x, ty, fm).s;
  const title = v.title || f.c;
  const active = v.sel && ((v.sel.values && v.sel.values.length) || v.sel.kind === 'range');
  const head = `<div class="vs-h"><span>${esc(fr(title))}</span>${active ? `<button class="vs-clear" data-a="slclear:${v.id}" aria-label="Effacer les sélections">${ERASER}</button>` : ''}</div>`;
  if ((v.mode || 'list') === 'range' && !hier) {
    const all = [...new Set(T.rows.map(r => r[f.c]).filter(x => x !== null && x !== undefined && x !== ''))].sort(cmp);
    const sel = v.sel && v.sel.kind === 'range' ? v.sel : { min: all[0], max: all[all.length - 1] };
    const pos = x => { const i = all.indexOf(x); return all.length > 1 ? Math.max(0, i) / (all.length - 1) * 100 : 0; };
    el.appendChild(h(`<div class="v-slicer">${head}<div class="vs-range"><button data-a="slrange:${v.id}|min">${esc(show(sel.min))}</button><button data-a="slrange:${v.id}|max">${esc(show(sel.max))}</button></div><div class="vs-track"><i style="left:${pos(sel.min)}%; right:${100 - pos(sel.max)}%"></i></div></div>`));
    return;
  }
  const q = this.query(v);
  const key = r => hier && typeof r[f.c] === 'string' ? r[f.c].slice(0, 4) : r[f.c];
  const vals = [...new Set((q ? q.rows : T.rows).map(key))].filter(x => x !== null && x !== undefined && x !== '').sort(cmp);
  const on = (v.sel && v.sel.values) || [];
  on.forEach(x => { if (!vals.includes(x)) vals.push(x); });
  el.appendChild(h(`<div class="v-slicer ${(v.fmt || {}).single ? 'single' : ''}">${head}<div class="vs-list">${vals.map(x => `<button class="vs-it ${on.includes(x) ? 'on' : ''}" data-a="slpick:${v.id}|${esc(String(x))}"><i></i>${esc(show(x))}</button>`).join('')}</div></div>`));
};

/* ───────── Volet Filtres ───────── */
const restrictive = f => f.kind === 'range' ? (f.min != null || f.max != null) : !!(f.values && f.values.length);
const OPS = {
  date: { min: [['ge', 'est le ou après'], ['gt', 'est après'], ['eq', 'est']], max: [['le', 'est le ou avant'], ['lt', 'est avant']] },
  num: { min: [['ge', 'est supérieur ou égal à'], ['gt', 'est supérieur à'], ['eq', 'est']], max: [['le', 'est inférieur ou égal à'], ['lt', 'est inférieur à']] }
};
const opsOf = ty => ty === 'date' ? OPS.date : OPS.num;
const opName = (ty, side, op) => (opsOf(ty)[side].find(o => o[0] === op) || opsOf(ty)[side][0])[1];
P_.fpShow = function (f) { const ty = colType(this.P, f); return x => PBI.show(x, ty, this.P.formats[f.t + '.' + f.c] || {}).s; };
P_.fpDescribe = function (f) {
  const ty = colType(this.P, f), show = this.fpShow(f);
  if (f.kind === 'range') {
    const p = [];
    if (f.min != null) p.push(`${opName(ty, 'min', f.minOp || 'ge')} ${show(f.min)}`);
    if (f.max != null) p.push(`${opName(ty, 'max', f.maxOp || 'le')} ${show(f.max)}`);
    return p.length ? p.join(' et ') : 'est (Tout)';
  }
  return f.values && f.values.length ? 'est ' + f.values.map(show).join(', ') : 'est (Tout)';
};
/* Valeurs proposées dans un filtre */
P_.fpValues = function (f) {
  const T = tableOf(this.P, f.t);
  return T ? [...new Set(T.rows.map(r => r[f.c]).filter(x => x !== null && x !== undefined && x !== '' && typeof x !== 'object'))].sort(cmp) : [];
};
/* Bornes d'un filtre avancé : pour une date, un calendrier continu qui couvre aussi la semaine du scénario */
P_.fpBounds = function (f) {
  const ty = colType(this.P, f), vals = this.fpValues(f);
  if (ty !== 'date') return vals;
  let a = vals[0] || '2026-06-01', b = vals[vals.length - 1] || '2026-06-07';
  if (a > '2026-06-01') a = '2026-06-01'; if (b < '2026-06-07') b = '2026-06-07';
  const out = []; const d = new Date(a + 'T12:00:00Z');
  while (out.length < 60) { const s = d.toISOString().slice(0, 10); out.push(s); if (s >= b) break; d.setUTCDate(d.getUTCDate() + 1); }
  return out;
};
P_.fpList = function (scope) {
  const P = this.P, pg = this.page(), v = scope === 'visual' ? this.selVisual() : null;
  if (scope === 'visual') return v ? (v.filters || (v.filters = [])) : null;
  if (scope === 'page') return pg ? (pg.filters || (pg.filters = [])) : null;
  return P.filters || (P.filters = []);
};
P_.fpTarget = function (scope) { return scope === 'visual' ? this.st.selVis : scope === 'page' ? this.P.activePage : null; };
/* Cartes d'un niveau : pour un visuel, ses propres champs apparaissent d'office */
P_.fpCards = function (scope) {
  const list = this.fpList(scope) || [];
  if (scope !== 'visual') return list.map(f => ({ f, removable: true }));
  const v = this.selVisual(); if (!v || !v.f) return [];
  const seen = new Set(), out = [];
  for (const g of [...(v.f.axis || []), ...(v.f.legend || []), ...(v.f.cols || []), ...(v.f.values || [])]) {
    const k = g.t + '|' + g.c; if (seen.has(k)) continue; seen.add(k);
    out.push({ f: list.find(x => x.t === g.t && x.c === g.c) || { t: g.t, c: g.c, kind: 'basic', values: [] }, removable: false });
  }
  list.forEach(f => { if (!seen.has(f.t + '|' + f.c)) out.push({ f, removable: true }); });
  return out;
};
P_.fpFind = function (scope, t, c) {
  const card = this.fpCards(scope).find(x => x.f.t === t && x.f.c === c);
  return card ? card.f : null;
};
P_.filterPane = function () {
  if (!this.adv()) return h(`<div class="prev-empty">Aucun filtre sur cette page.</div>`);
  const box = h(`<div class="fp"></div>`), v = this.selVisual();
  const sec = (scope, title) => {
    const s = h(`<div class="fp-sec"><div class="fp-h">${esc(title)}</div></div>`);
    this.fpCards(scope).forEach(card => s.appendChild(this.fpCard(scope, card)));
    s.appendChild(h(`<button class="fp-add" data-a="fpadd:${scope}">+ Ajouter un champ</button>`));
    box.appendChild(s);
  };
  if (v && v.f && !DECO.includes(v.type)) sec('visual', 'Filtres sur ce visuel');
  sec('page', 'Filtres sur cette page');
  sec('report', 'Filtres sur toutes les pages');
  return box;
};
P_.fpCard = function (scope, card) {
  const f = card.f, key = `${scope}|${f.t}|${f.c}`, open = this.st.fcOpen === key, ty = colType(this.P, f), show = this.fpShow(f);
  const el = h(`<div class="fcard ${open ? 'open' : ''} ${restrictive(f) ? 'act' : ''}"><div class="fc-h" data-a="fcopen:${key}"><span><b>${esc(f.c)}</b><small>${esc(fr(this.fpDescribe(f)))}</small></span>${restrictive(f) ? `<button class="fc-ic" data-a="fcclear:${key}" aria-label="Effacer le filtre">${ERASER}</button>` : ''}${card.removable ? `<button class="fc-ic" data-a="fcdel:${key}" aria-label="Supprimer le filtre">✕</button>` : ''}<i class="fc-chev">${PBI.I.chev}</i></div></div>`);
  if (!open) return el;
  const body = h(`<div class="fc-b"><div class="fc-r"><span>Type de filtre</span><button class="sel-box" data-a="fctype:${key}">${f.kind === 'range' ? 'Filtrage avancé' : 'Filtrage de base'}</button></div></div>`);
  if (f.kind === 'range') {
    const pd = this.fcPend(key, f);
    body.appendChild(h(`<div class="fc-adv"><p>Afficher les éléments lorsque la valeur</p>
      <button class="sel-box" data-a="fcop:${key}|min">${esc(opName(ty, 'min', pd.minOp))}</button><button class="sel-box" data-a="fcval:${key}|min">${pd.min != null ? esc(show(pd.min)) : 'Choisir une valeur'}</button>
      <span class="fc-and">Et</span>
      <button class="sel-box" data-a="fcop:${key}|max">${esc(opName(ty, 'max', pd.maxOp))}</button><button class="sel-box" data-a="fcval:${key}|max">${pd.max != null ? esc(show(pd.max)) : 'Choisir une valeur'}</button>
      <button class="fc-apply" data-a="fcapply:${key}">Appliquer le filtre</button></div>`));
  } else {
    const vals = this.fpValues(f), on = f.values || [];
    const all = !on.length;
    body.appendChild(h(`<button class="fc-v ${all ? 'on' : 'part'}" data-a="fcall:${key}"><i></i>Sélectionner tout</button>`));
    vals.forEach((x, i) => body.appendChild(h(`<button class="fc-v ${all || on.includes(x) ? 'on' : ''}" data-a="fcv:${key}|${i}"><i></i>${esc(show(x))}</button>`)));
  }
  el.appendChild(body);
  return el;
};
P_.fcPend = function (key, f) {
  const st = this.st; st.fcPend = st.fcPend || {};
  if (!st.fcPend[key]) st.fcPend[key] = { minOp: f.minOp || 'ge', min: f.min ?? null, maxOp: f.maxOp || 'le', max: f.max ?? null };
  return st.fcPend[key];
};
/* Enregistre un filtre après accord du scénario */
P_.fpSet = function (scope, nf, ev = 'filter.set') {
  const list = this.fpList(scope); if (!list) return false;
  const r = this.emit(ev, { scope, target: this.fpTarget(scope), t: nf.t, c: nf.c, kind: nf.kind, values: nf.values, min: nf.min, max: nf.max, minOp: nf.minOp, maxOp: nf.maxOp, filter: nf, restrictive: restrictive(nf) });
  if (r === 'no') return false;
  const i = list.findIndex(x => x.t === nf.t && x.c === nf.c);
  if (scope === 'visual' && !restrictive(nf)) { if (i >= 0) list.splice(i, 1); }
  else if (i >= 0) list[i] = nf; else list.push(nf);
  this.P.dirty = true; this.render();
  this.emit('viz.change', { what: 'filter', scope, t: nf.t, c: nf.c });
  return true;
};
const fpActions = {
  fpadd(v, b) {
    const scope = v;
    this.fieldMenu(b, (t, c) => {
      const list = this.fpList(scope); if (!list) return;
      if (this.fpFind(scope, t, c)) { this.st.fcOpen = `${scope}|${t}|${c}`; this.render(); return; }
      if (this.emit('filter.add', { scope, target: this.fpTarget(scope), t, c }) === 'no') { this.render(); return; }
      list.push({ t, c, kind: 'basic', values: [] }); this.st.fcOpen = `${scope}|${t}|${c}`; this.P.dirty = true; this.render();
      this.emit('viz.change', { what: 'filter', scope, t, c });
    });
  },
  fcopen(v) { this.st.fcOpen = this.st.fcOpen === v ? null : v; this.render(); },
  fcv(v, b) {
    const [scope, t, c, i] = v.split('|'); const f = this.fpFind(scope, t, c); if (!f) return;
    const x = this.fpValues(f)[+i]; if (x === undefined) return;
    let vals = f.values && f.values.length ? [...f.values] : [];
    vals = vals.includes(x) ? vals.filter(y => y !== x) : [...vals, x];
    if (vals.length === this.fpValues(f).length) vals = [];
    if (!this.fpSet(scope, { t, c, kind: 'basic', values: vals })) shake(b);
  },
  fcall(v, b) {
    const [scope, t, c] = v.split('|'); const f = this.fpFind(scope, t, c); if (!f || !restrictive(f)) return;
    if (!this.fpSet(scope, { t, c, kind: 'basic', values: [] })) shake(b);
  },
  fcclear(v, b) {
    const [scope, t, c] = v.split('|'); const f = this.fpFind(scope, t, c); if (!f) return;
    if (this.st.fcPend) delete this.st.fcPend[v];
    if (!this.fpSet(scope, f.kind === 'range' ? { t, c, kind: 'range', min: null, max: null, minOp: f.minOp, maxOp: f.maxOp } : { t, c, kind: 'basic', values: [] }, 'filter.set')) shake(b);
  },
  fcdel(v, b) {
    const [scope, t, c] = v.split('|'); const list = this.fpList(scope); if (!list) return;
    if (this.emit('filter.remove', { scope, target: this.fpTarget(scope), t, c }) === 'no') { shake(b); return; }
    const i = list.findIndex(x => x.t === t && x.c === c); if (i >= 0) list.splice(i, 1);
    if (this.st.fcOpen === v) this.st.fcOpen = null;
    this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'filter', scope, t, c });
  },
  fctype(v, b) {
    const [scope, t, c] = v.split('|'); const f = this.fpFind(scope, t, c); if (!f) return;
    const ty = colType(this.P, f), adv = ty === 'date' || NUM.includes(ty);
    this.menu(b, [['basic', 'Filtrage de base', f.kind !== 'range']].concat(adv ? [['advanced', 'Filtrage avancé', f.kind === 'range']] : []), k => {
      if ((k === 'advanced') === (f.kind === 'range')) return;
      if (this.emit('filter.type', { scope, target: this.fpTarget(scope), t, c, type: k }) === 'no') return;
      if (this.st.fcPend) delete this.st.fcPend[v];
      const nf = k === 'advanced' ? { t, c, kind: 'range', min: null, max: null, minOp: 'ge', maxOp: 'le' } : { t, c, kind: 'basic', values: [] };
      const list = this.fpList(scope), i = list.findIndex(x => x.t === t && x.c === c);
      if (i >= 0) list[i] = nf; else list.push(nf);
      this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'filter', scope, t, c });
    });
  },
  fcop(v, b) {
    const [scope, t, c, side] = v.split('|'); const key = `${scope}|${t}|${c}`; const f = this.fpFind(scope, t, c); if (!f) return;
    const pd = this.fcPend(key, f), ty = colType(this.P, f);
    this.menu(b, opsOf(ty)[side].map(o => [o[0], o[1], pd[side + 'Op'] === o[0]]), k => { pd[side + 'Op'] = k; this.render(); });
  },
  fcval(v, b) {
    const [scope, t, c, side] = v.split('|'); const key = `${scope}|${t}|${c}`; const f = this.fpFind(scope, t, c); if (!f) return;
    const pd = this.fcPend(key, f), show = this.fpShow(f);
    this.menu(b, [['', '(Aucune valeur)', pd[side] == null]].concat(this.fpBounds(f).map(x => [String(x), show(x), pd[side] === x])), k => {
      pd[side] = k === '' ? null : this.fpBounds(f).find(x => String(x) === k); this.render();
    });
  },
  fcapply(v, b) {
    const [scope, t, c] = v.split('|'); const f = this.fpFind(scope, t, c); if (!f) return;
    const pd = this.fcPend(v, f);
    if (pd.min != null && pd.max != null && pd.min > pd.max) { shake(b); this.emit('filter.invalid', { scope, t, c }); return; }
    if (!this.fpSet(scope, { t, c, kind: 'range', min: pd.min, max: pd.max, minOp: pd.minOp, maxOp: pd.maxOp })) shake(b);
  },
  inter(v, b, e) {
    e.stopPropagation();
    const [s, t, m] = v.split('|');
    if (this.emit('interaction.set', { src: s, tgt: t, mode: m }) === 'no') { shake(b); return; }
    (this.P.interactions || (this.P.interactions = {}))[s + '>' + t] = m;
    this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'interaction', src: s, tgt: t, mode: m });
  },
  slpick(v, b, e) {
    e.stopPropagation();
    const [id, ...rest] = v.split('|'); const x = rest.join('|');
    const vis = this.page().visuals.find(s => s.id === id); if (!vis) return;
    const f = vis.f.values[0], T = tableOf(this.P, f.t), hier = colType(this.P, f) === 'date' && f.hier;
    const real = [...new Set(T.rows.map(r => hier && typeof r[f.c] === 'string' ? r[f.c].slice(0, 4) : r[f.c]))].find(y => String(y) === x);
    if (real === undefined) return;
    const fm = vis.fmt || {};
    let vals = vis.sel && vis.sel.values ? [...vis.sel.values] : [];
    if (fm.single) vals = [real];
    else if (fm.ctrl !== false && !this.st.ctrl) vals = vals.length === 1 && vals[0] === real ? [] : [real];
    else vals = vals.includes(real) ? vals.filter(y => y !== real) : [...vals, real];
    if (this.emit('slicer', { vis: id, values: vals, value: real, v: vis }) === 'no') { shake(b); return; }
    vis.sel = vals.length ? { kind: 'basic', values: vals } : null; this.st.selVis = id; this.P.dirty = true; this.render(); this.emit('viz.change', { what: 'slicer', vis: id });
  },
  trowsel(v, b, e) {
    e.stopPropagation();
    const [id, i] = v.split('|');
    if (this.emit('table.rowsel', { vis: id, i: +i }) === 'no') { shake(b); return; }
    if (this.st.selVis !== id && this.gate('visual', id, b)) { this.st.selVis = id; this.render(); }
  }
};
const baseClick = P_.extraClick;
P_.extraClick = function (a, v, b, e) {
  if (fpActions[a] && (this.adv() || a === 'trowsel' || a === 'slpick')) return fpActions[a].call(this, v, b, e);
  if (a === 'trowsel') return;
  return baseClick.call(this, a, v, b, e);
};
PBI.restrictive = restrictive;
})();
