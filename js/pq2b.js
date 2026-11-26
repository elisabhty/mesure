/* Power BI Quest — éditeur Power Query du module 2 : actions, requêtes, étapes et boîtes de dialogue */
(function () {
'use strict';
const PBI = window.PBI, P_ = PBI.prototype, PQE = window.PQE;
const { h, esc, fr, $, $$, clone, shake } = window.PBQ;
const I = PBI.I, TY = PQE.TYPES, QI = PBI.QI;
const NB = ' ';
const files = () => (window.PBQ_DATA2 || { files: {} }).files;
const loadOf = PBI.loadOf, setLoad = PBI.setLoad, refreshOf = PBI.refreshOf, disp = PBI.q2disp;
let SEQ = 0;
const uid = p => (p || 's') + Date.now().toString(36) + (++SEQ).toString(36);
const isNumT = t => ['dec', 'fixed', 'int', 'pct'].includes(t);
const TYPE_ORDER = ['dec', 'fixed', 'int', 'pct', '-', 'datetime', 'date', 'time', 'dtz', 'dur', '-', 'text', '-', 'bool', '-', 'bin'];
/* Nom d'étape unique, à la manière de Power Query : « Colonnes renommées », « Colonnes renommées1 »… */
function uniqStep(q, base) { if (!q.steps.some(s => s.name === base)) return base; let k = 1; while (q.steps.some(s => s.name === base + k)) k++; return base + k; }
function uniqQName(P, base) { if (!P.queries.some(q => q.name === base)) return base; const m = /^(.*) \((\d+)\)$/.exec(base); let root = m ? m[1] : base, k = m ? +m[2] : 1; let n; do { k++; n = `${root} (${k})`; } while (P.queries.some(q => q.name === n)); return n; }
function uniqCol(T, base) { if (!T || !T.cols.some(c => c.n === base)) return base; let k = 1; while (T.cols.some(c => c.n === `${base}.${k}`)) k++; return `${base}.${k}`; }
const clip = () => (window.PBQ && window.PBQ.clip) || '';
/* Valeur saisie dans un champ : null, nombre ou texte selon le contexte */
function parseVal(s, numeric) {
  const t = String(s);
  if (t.trim() === 'null') return null;
  if (numeric && /^\s*-?\d+([.,]\d+)?\s*$/.test(t)) return Number(t.trim().replace(',', '.'));
  return t;
}
const colIsNum = (T, c) => { const col = T && T.cols.find(x => x.n === c); if (!col) return false; if (isNumT(col.t)) return true; if (col.t !== 'any') return false; const vs = T.rows.slice(0, 50).map(r => r[c]).filter(v => v !== null && v !== undefined); return vs.length > 0 && vs.every(v => typeof v === 'number'); };

/* ───────── Clics ───────── */
P_.q2Click = function (e) {
  const b = e.target.closest('[data-q]'); if (!b || !this.q2El || !this.q2El.contains(b)) return;
  const raw = b.dataset.q; const k = raw.indexOf(':'); const a = k < 0 ? raw : raw.slice(0, k), v = k < 0 ? '' : raw.slice(k + 1);
  const q2 = this.q2, q = this.q2q();
  switch (a) {
    case 'x': if (this.q2emit('q2.close', { dirty: q2.dirty }) === 'no') shake(b); break;
    case 'qd': q2.qd = !q2.qd; this.q2emit('q2.drawer', { open: q2.qd }); this.q2render(); break;
    case 'qdx': q2.qd = false; this.q2render(); break;
    case 'qsel': {
      const tq = this.engine().q(v);
      if (this.q2emit('q2.query', { id: v, target: tq, name: tq && tq.name }) === 'no') { shake(b); break; }
      this.q2select(v); q2.qd = false; this.q2render(); break;
    }
    case 'qmenu': if (v) this.q2queryMenu(b, v); break;
    case 'grp': q2.collapsed[v] = !q2.collapsed[v]; this.q2render(); break;
    case 'tab': q2.tab = v; this.q2emit('q2.tab', { tab: v }); this.q2render(); break;
    case 'cmd': this.q2cmd(v, b); break;
    case 'fxadd': if (q) this.q2stepFormula(null, b); break;
    case 'fxedit': if (q) this.q2stepFormula(this.q2at(), b); break;
    case 'fxview': if (q) this.q2showFormula(); break;
    case 'hd': this.q2header(v, b); break;
    case 'ty': this.q2pickCol(v); this.q2typeMenu(b); break;
    case 'flt': this.q2pickCol(v, true); this.q2filter(v, b); break;
    case 'exp': this.q2pickCol(v, true); this.q2expandDialog(v, b); break;
    case 'cell': {
      const i = v.indexOf('|'); const r = +v.slice(0, i), c = v.slice(i + 1);
      const T = this.q2table(); const val = T && T.rows[r] ? T.rows[r][c] : null;
      if (this.q2emit('q2.cell', { r, c, v: val, row: T && T.rows[r] }) === 'no') { shake(b); break; }
      q2.cell = { r, c }; this.q2render(); break;
    }
    case 'valx': q2.cell = null; this.q2render(); break;
    case 'profx': q2.sel = []; this.q2render(); break;
    case 'scope': this.q2menu(b, [['top', 'Profilage de colonne basé sur les 1 000 premières lignes', q2.scope !== 'all'], ['all', 'Profilage de colonne basé sur l’ensemble des données', q2.scope === 'all']], s => { if (this.q2emit('q2.scope', { scope: s }) === 'no') return; q2.scope = s; this.q2render(); }); break;
    case 'steps': q2.stepsOpen = !q2.stepsOpen; q2.renStep = null; this.q2emit('q2.steps', { open: q2.stepsOpen }); this.q2render(); break;
    case 'st': {
      const i = +v;
      if (this.q2emit('q2.step', { i, step: q && q.steps[i] }) === 'no') { shake(b); break; }
      q2.selStep = i === q.steps.length - 1 ? null : i; q2.cell = null; this.q2render(); break;
    }
    case 'stg': this.q2gear(+v, b); break;
    case 'stx': this.q2delStep(+v, false, b); break;
    case 'stm': this.q2stepMenu(+v, b); break;
    case 'qname': this.q2Enter($('#q2-qn', this.q2El)); break;
    case 'dep': this.q2depsHl(v); break;
  }
};
P_.q2Enter = function (inp) {
  if (!inp) return;
  const k = inp.dataset.enter, q = this.q2q();
  if (k === 'qname') { const name = inp.value.trim(); if (name && name !== q.name) this.q2renameQuery(q, name, inp); return; }
  if (k.startsWith('rstep:')) { const i = +k.slice(6); this.q2renameStep(i, inp.value.trim(), inp); }
};
P_.q2select = function (id) { const q2 = this.q2; if (q2.cur !== id) { q2.cur = id; q2.selStep = null; q2.sel = []; q2.cell = null; } };
P_.q2pickCol = function (c, keep) {
  const q2 = this.q2;
  if (q2.multi) { if (!q2.sel.includes(c)) q2.sel = q2.sel.concat(c); }
  else if (!(keep && q2.sel.includes(c))) q2.sel = [c];
  q2.cell = null;
  this.q2emit('q2.col', { col: c, sel: q2.sel.slice() });
  this.q2render();
};
P_.q2header = function (c, b) {
  const q2 = this.q2;
  if (q2.multi) { q2.sel = q2.sel.includes(c) ? q2.sel.filter(x => x !== c) : q2.sel.concat(c); q2.cell = null; this.q2emit('q2.col', { col: c, sel: q2.sel.slice() }); this.q2render(); return; }
  if (q2.sel.length === 1 && q2.sel[0] === c) { this.q2colMenu(c, $(`[data-q="hd:${CSS.escape(c)}"]`, this.q2El) || b); return; }
  this.q2pickCol(c);
};

/* ───────── Ajout, modification et suppression d'étapes ───────── */
P_.q2legacyGuard = function (q, kind) {
  if (!this.engine().isLegacy(q)) return false;
  if (this.q2emit('q2.try', { kind, legacy: true }) === 'no') return true;
  this.message('Requête du rapport historique', `La requête « ${q.name} » alimente le rapport du module 1. Elle reste en lecture seule dans cet atelier.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]);
  return true;
};
P_.q2addStep = function (step, opts = {}) {
  const q = this.q2q(), eng = this.engine(), q2 = this.q2;
  if (!q || this.q2legacyGuard(q, 'add')) return false;
  const at = this.q2at(), last = q.steps.length - 1;
  const go = () => {
    step.id = step.id || uid(); step.name = step.name || uniqStep(q, PQE.stepLabel(step));
    if (this.q2emit('q2.try', { kind: 'add', step, op: step.op, at: at + 1 }) === 'no') return false;
    q.steps.splice(at + 1, 0, step);
    let pos = at + 1;
    eng.touch();
    if (opts.auto) { const extra = opts.auto(eng.table(q, pos)); if (extra) { extra.id = uid(); extra.name = uniqStep(q, extra.name || 'Type modifié'); q.steps.splice(pos + 1, 0, extra); pos++; eng.touch(); } }
    q2.selStep = pos === q.steps.length - 1 ? null : pos; q2.dirty = true; q2.cell = null; q2.multi = false;
    if (opts.sel) { q2.sel = opts.sel; if (opts.sel.length) q2._reveal = opts.sel[opts.sel.length - 1]; if (opts.reveal) q2._reveal = opts.reveal; } else { const T = eng.table(q, pos); if (T) q2.sel = q2.sel.filter(c => T.cols.some(x => x.n === c)); }
    this.q2render();
    this.q2emit('q2.done', { kind: 'add', step, op: step.op, at: at + 1, auto: pos > at + 1 ? q.steps[pos] : null });
    return true;
  };
  if (at < last) {
    this.dialog('Insérer une étape', h(`<p class="q2-msg">${esc(fr('Voulez-vous vraiment insérer une étape ? L’insertion d’une étape intermédiaire peut entraîner l’échec des étapes suivantes.'))}</p>`),
      [{ t: 'Insérer', pri: true, id: 'insert', fn: () => { this.closeDialog(); go(); } }, { t: 'Annuler', id: 'cancel', fn: () => { this.closeDialog(); this.q2emit('q2.cancel', { kind: 'insert' }); } }], { kind: 'q2insert' });
    this.q2emit('q2.dialog', { kind: 'insert' });
    return null;
  }
  return go();
};
P_.q2editStep = function (i, patch) {
  const q = this.q2q(), s = q.steps[i];
  const next = Object.assign({}, s, patch);
  if (this.q2emit('q2.try', { kind: 'edit', i, step: next, before: s, op: s.op }) === 'no') return false;
  Object.assign(s, patch);
  this.engine().touch(); this.q2.dirty = true; this.q2.cell = null;
  this.q2render();
  this.q2emit('q2.done', { kind: 'edit', i, step: s, op: s.op });
  return true;
};
P_.q2delStep = function (i, toEnd, b) {
  const q = this.q2q(), q2 = this.q2;
  if (!q || this.q2legacyGuard(q, toEnd ? 'delEnd' : 'del')) return;
  if (q.steps.length === 1) { shake(b); this.message('Supprimer l’étape', 'Une requête doit conserver au moins une étape. Supprime plutôt la requête depuis le volet Requêtes.', [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return; }
  const go = () => {
    const removed = toEnd ? q.steps.slice(i) : [q.steps[i]];
    if (this.q2emit('q2.try', { kind: toEnd ? 'delEnd' : 'del', i, step: q.steps[i], steps: removed }) === 'no') return;
    q.steps.splice(i, toEnd ? q.steps.length - i : 1);
    if (!q.steps.length) q.steps.push(removed[0]);
    q2.selStep = null; q2.dirty = true; q2.cell = null; this.engine().touch();
    const T = this.engine().table(q); if (T) q2.sel = q2.sel.filter(c => T.cols.some(x => x.n === c));
    this.q2render();
    this.q2emit('q2.done', { kind: toEnd ? 'delEnd' : 'del', i, step: removed[0], steps: removed });
  };
  if (toEnd) this.dialog('Supprimer jusqu’à la fin', h(`<p class="q2-msg">${esc(fr(`Voulez-vous vraiment supprimer l’étape « ${q.steps[i].name} » et toutes les étapes suivantes ?`))}</p>`), [{ t: 'Supprimer', pri: true, id: 'del', fn: () => { this.closeDialog(); go(); } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2delEnd' });
  else if (i < q.steps.length - 1) this.dialog('Supprimer l’étape', h(`<p class="q2-msg">${esc(fr(`Voulez-vous vraiment supprimer l’étape « ${q.steps[i].name} » ? Les étapes suivantes risquent d’échouer si elles en dépendent.`))}</p>`), [{ t: 'Supprimer', pri: true, id: 'del', fn: () => { this.closeDialog(); go(); } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2del' });
  else go();
};
P_.q2renameStep = function (i, name, inp) {
  const q = this.q2q(), s = q.steps[i];
  if (!name) { shake(inp); return; }
  if (name === s.name) { this.q2.renStep = null; this.q2render(); return; }
  if (q.steps.some((x, k) => k !== i && x.name === name)) { shake(inp); this.q2emit('q2.try', { kind: 'renameStep', i, step: s, name, dup: true }); return; }
  if (this.q2emit('q2.try', { kind: 'renameStep', i, step: s, name, old: s.name }) === 'no') { shake(inp); return; }
  const old = s.name; s.name = name; this.q2.renStep = null;
  /* les étapes personnalisées qui citaient l'ancien nom sont mises à jour, comme dans Power Query */
  q.steps.forEach(x => { if (x.op === 'mstep') x.src = x.src.split(PQE.qid(old)).join(PQE.qid(name)); });
  this.engine().touch(); this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'renameStep', i, step: s, name, old });
};
P_.q2moveStep = function (i, dir) {
  const q = this.q2q(), j = i + dir;
  if (j < 1 || j >= q.steps.length || i < 1) return;
  if (this.q2emit('q2.try', { kind: 'moveStep', i, to: j, step: q.steps[i] }) === 'no') return;
  const [s] = q.steps.splice(i, 1); q.steps.splice(j, 0, s);
  this.q2.selStep = j === q.steps.length - 1 ? null : j; this.engine().touch(); this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'moveStep', i, to: j, step: s });
};
P_.q2stepMenu = function (i, b) {
  const q = this.q2q(), s = q.steps[i], op = PQE.OPS[s.op] || {}, legacy = this.engine().isLegacy(q);
  const items = [];
  if (!legacy && op.gear && s.op !== 'ref') items.push(['gear', 'Modifier les paramètres']);
  if (s.op === 'mstep') items.push(['formula', 'Modifier la formule']);
  items.push(['rename', 'Renommer'], ['del', 'Supprimer'], ['delEnd', 'Supprimer jusqu’à la fin']);
  if (i > 1) items.push(['up', 'Déplacer vers le haut']);
  if (i > 0 && i < q.steps.length - 1) items.push(['down', 'Déplacer vers le bas']);
  this.q2emit('q2.menu', { kind: 'step', i, step: s });
  this.q2menu(b, items, k => {
    if (k === 'gear') this.q2gear(i, b);
    else if (k === 'formula') this.q2stepFormula(i, b);
    else if (k === 'rename') { if (this.q2legacyGuard(q, 'renameStep')) return; this.q2.renStep = i; this.q2render(); }
    else if (k === 'del') this.q2delStep(i, false, b);
    else if (k === 'delEnd') this.q2delStep(i, true, b);
    else if (k === 'up') this.q2moveStep(i, -1);
    else if (k === 'down') this.q2moveStep(i, 1);
  });
};
/* Engrenage : rouvre le dialogue de l'étape avec ses paramètres */
P_.q2gear = function (i, b) {
  const q = this.q2q(), s = q.steps[i];
  if (this.q2emit('q2.gear', { i, step: s, op: s.op }) === 'no') { shake(b); return; }
  this.q2.selStep = i === q.steps.length - 1 ? null : i;
  const edit = patch => this.q2editStep(i, patch);
  const T0 = i > 0 ? this.engine().table(q, i - 1) : null;
  switch (s.op) {
    case 'index': return this.q2indexDialog(s, edit);
    case 'skip': case 'removeBottom': case 'keepTop': case 'keepBottom': return this.q2countDialog(s.op, s, edit);
    case 'custom': return this.q2customDialog(s, edit, T0);
    case 'cond': return this.q2condDialog(s, edit, T0);
    case 'replace': return this.q2replaceDialog(s, edit);
    case 'group': return this.q2groupDialog(s, edit, T0);
    case 'split': return this.q2splitDialog(s.col, s, edit, T0);
    case 'extract': return this.q2extractDialog(s.kind, s.col, !!s.as, s, edit);
    case 'merge': return this.q2mergeDialog(false, s, edit);
    case 'expand': return this.q2expandDialog(s.col, b, s, edit, T0);
    case 'selectCols': return this.q2chooseCols(s, edit, T0);
    case 'csv': return this.q2csvDialog(s.file, s, edit);
    case 'excel': case 'nav': return this.message('Paramètres de la source', `Fichier : ${q.steps[0].file || '—'}${s.op === 'nav' ? `\nÉlément : ${s.item}` : ''}`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]);
    case 'enter': return this.q2enterData(s, edit);
    default: shake(b);
  }
};

/* ───────── Requêtes : sélection, menu, création ───────── */
P_.q2queryMenu = function (b, id) {
  const eng = this.engine(), q = eng.q(id); if (!q) return;
  const groups = (this.P.qgroups || []).filter(g => g !== q.group);
  const grpItems = groups.map(g => ['g:' + g, g]).concat(groups.length ? ['-'] : [], [['g:+', 'Nouveau groupe…']], q.group ? [['g:-', 'Retirer du groupe']] : []);
  this.q2emit('q2.menu', { kind: 'query', id, target: q });
  const isFn = !eng.isLegacy(q) && eng.value(q) instanceof PQE.MFn;
  this.q2menu(b, [['del', 'Supprimer'], ['ren', 'Renommer'], ['dup', 'Dupliquer'], ['ref', 'Référence'], ['grp', 'Déplacer vers le groupe', false, grpItems], '-'].concat(isFn ? [] : [
    ['load', 'Activer le chargement', loadOf(q)], ['refresh', 'Inclure dans l’actualisation du rapport', refreshOf(q)], '-'], [['adv', 'Éditeur avancé'], ['props', 'Propriétés…']]), k => {
    if (k === 'del') this.q2delQuery(q);
    else if (k === 'ren') this.q2renameDialog(q);
    else if (k === 'dup') this.q2dupQuery(q);
    else if (k === 'ref') this.q2refQuery(q);
    else if (k === 'load') this.q2setLoad(q, !loadOf(q));
    else if (k === 'refresh') this.q2setRefresh(q, !refreshOf(q));
    else if (k === 'adv') this.q2adv(q);
    else if (k === 'props') this.q2props(q);
    else if (k.startsWith('g:')) { const g = k.slice(2); if (g === '+') this.q2newGroup(q); else this.q2setGroup(q, g === '-' ? null : g); }
  });
};
P_.q2addQuery = function (nq, how, src) {
  nq.id = nq.id || uid('q'); nq.m2 = true; if (nq.load === undefined) nq.load = true; if (nq.refresh === undefined) nq.refresh = true;
  if (this.q2emit('q2.try', { kind: 'newQuery', how, query: nq, src }) === 'no') return null;
  this.P.queries.push(nq);
  this.engine().touch(); this.q2select(nq.id); this.q2.dirty = true; this.q2.qd = false;
  this.q2render();
  this.q2emit('q2.done', { kind: 'newQuery', how, query: nq, src });
  return nq;
};
P_.q2refQuery = function (src) {
  return this.q2addQuery({ name: uniqQName(this.P, src.name + ' (2)'), group: src.group || null, steps: [{ id: uid(), name: 'Source', op: 'ref', of: src.id }] }, 'ref', src);
};
P_.q2dupQuery = function (src) {
  const c = clone(src); delete c.tableId; c.id = uid('q'); c.name = uniqQName(this.P, src.name + ' (2)');
  if (!src.m2) { c.loadEnabled = true; c.legacyCopy = true; return this.q2addQueryLegacy(c, src); }
  c.steps.forEach(s => s.id = uid());
  return this.q2addQuery(c, 'dup', src);
};
P_.q2addQueryLegacy = function (c, src) {
  if (this.q2emit('q2.try', { kind: 'newQuery', how: 'dup', query: c, src }) === 'no') return null;
  this.P.queries.push(c); this.engine().touch(); this.q2select(c.id); this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'newQuery', how: 'dup', query: c, src });
  return c;
};
P_.q2delQuery = function (q) {
  const eng = this.engine(), deps = eng.dependents(q.id);
  const go = () => {
    if (this.q2emit('q2.try', { kind: 'delQuery', target: q, dependents: deps }) === 'no') return;
    const i = this.P.queries.indexOf(q); if (i >= 0) this.P.queries.splice(i, 1);
    if (this.q2.cur === q.id) { const n = this.P.queries[Math.max(0, i - 1)]; this.q2select(n ? n.id : null); }
    eng.touch(); this.q2.dirty = true; this.q2render();
    this.q2emit('q2.done', { kind: 'delQuery', target: q, dependents: deps });
  };
  const msg = deps.length ? `« ${q.name} » est référencée par : ${deps.map(d => d.name).join(', ')}. Si tu la supprimes, ces requêtes ne fonctionneront plus.` : `Voulez-vous vraiment supprimer la requête « ${q.name} » ?`;
  this.dialog('Supprimer la requête', h(`<p class="q2-msg">${esc(fr(msg))}</p>`), [{ t: 'Supprimer', pri: true, id: 'del', fn: () => { this.closeDialog(); go(); } }, { t: 'Annuler', id: 'cancel', fn: () => { this.closeDialog(); this.q2emit('q2.cancel', { kind: 'delQuery' }); } }], { kind: 'q2delq' });
  this.q2emit('q2.dialog', { kind: 'delQuery', target: q });
};
P_.q2renameQuery = function (q, name, el) {
  if (!name) { shake(el); return false; }
  if (this.P.queries.some(x => x !== q && x.name === name)) { shake(el); this.message('Renommer', `Une requête nommée « ${name} » existe déjà.`, [{ t: 'OK', pri: true, fn: () => this.closeDialog() }]); return false; }
  if (this.q2emit('q2.try', { kind: 'renameQuery', target: q, name, old: q.name }) === 'no') { shake(el); return false; }
  const old = q.name; q.name = name;
  for (const o of this.P.queries) for (const s of (o.steps || [])) if (s.op === 'mstep' || s.op === 'custom') s.src = s.src.split(PQE.qid(old)).join(PQE.qid(name));
  this.engine().touch(); this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'renameQuery', target: q, name, old });
  return true;
};
P_.q2renameDialog = function (q) {
  const body = h(`<div class="q2-form"><label>Nom de la requête<input value="${esc(q.name)}" spellcheck="false" autocapitalize="off" autocomplete="off"></label></div>`);
  const inp = $('input', body);
  const ok = b => { if (this.q2renameQuery(q, inp.value.trim(), inp)) this.closeDialog(); else shake(b || inp); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
  this.dialog('Renommer la requête', body, [{ t: 'OK', pri: true, id: 'ok', fn: ok }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2rename' });
  this.q2emit('q2.dialog', { kind: 'renameQuery', target: q });
  setTimeout(() => { inp.focus(); inp.select(); }, 60);
};
P_.q2setLoad = function (q, on) {
  if (this.q2emit('q2.try', { kind: 'load', target: q, on }) === 'no') return;
  setLoad(q, on); this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'load', target: q, on });
};
P_.q2setRefresh = function (q, on) {
  if (this.q2emit('q2.try', { kind: 'refreshFlag', target: q, on }) === 'no') return;
  q.refresh = on; this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'refreshFlag', target: q, on });
};
P_.q2setGroup = function (q, g) {
  if (this.q2emit('q2.try', { kind: 'group', target: q, group: g }) === 'no') return;
  q.group = g || null; this.q2.dirty = true; this.q2render();
  this.q2emit('q2.done', { kind: 'group', target: q, group: g });
};
P_.q2newGroup = function (q) {
  const body = h(`<div class="q2-form"><label>Nom<input spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Nouveau groupe"></label><label>Description<input spellcheck="false" autocomplete="off"></label></div>`);
  const inp = $('input', body);
  const ok = b => {
    const g = inp.value.trim(); if (!g) { shake(inp); return; }
    if (this.q2emit('q2.try', { kind: 'newGroup', group: g, target: q }) === 'no') { shake(b || inp); return; }
    this.P.qgroups = (this.P.qgroups || []).concat((this.P.qgroups || []).includes(g) ? [] : [g]);
    this.closeDialog(); this.q2setGroup(q, g);
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
  this.dialog('Nouveau groupe', body, [{ t: 'OK', pri: true, id: 'ok', fn: ok }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2group' });
  this.q2emit('q2.dialog', { kind: 'newGroup' });
  setTimeout(() => inp.focus(), 60);
};
P_.q2props = function (q) {
  const body = h(`<div class="q2-form"><label>Nom<input value="${esc(q.name)}" spellcheck="false" autocapitalize="off" autocomplete="off"></label><label>Description<textarea rows="2">${esc(q.desc || '')}</textarea></label>
    <label class="q2-chk"><input type="checkbox" data-x="load" ${loadOf(q) ? 'checked' : ''}> Activer le chargement dans le rapport</label>
    <label class="q2-chk"><input type="checkbox" data-x="refresh" ${refreshOf(q) ? 'checked' : ''}> Inclure dans l’actualisation du rapport</label></div>`);
  this.dialog('Propriétés de la requête', body, [{ t: 'OK', pri: true, id: 'ok', fn: b => {
    const name = $('input', body).value.trim(), l = $('[data-x="load"]', body).checked, r = $('[data-x="refresh"]', body).checked;
    q.desc = $('textarea', body).value;
    if (name !== q.name && !this.q2renameQuery(q, name, $('input', body))) { shake(b); return; }
    this.closeDialog();
    if (l !== loadOf(q)) this.q2setLoad(q, l);
    if (r !== refreshOf(q)) this.q2setRefresh(q, r);
  } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2props' });
  this.q2emit('q2.dialog', { kind: 'props', target: q });
};
/* Éditeur avancé : lecture du code M ; modifiable pour une requête vide ou une fonction */
P_.q2adv = function (q) {
  q = q || this.q2q(); if (!q) return;
  const eng = this.engine();
  const code = eng.isLegacy(q) ? `let\n${q.steps.map((s, i) => `    ${PQE.qid(s.name)} = ${PBI.stepFormula ? PBI.stepFormula(q, i) : '…'}${i < q.steps.length - 1 ? ',' : ''}`).join('\n')}\nin\n    ${PQE.qid(q.steps[q.steps.length - 1].name)}` : eng.code(q);
  const editable = !!q.blank;
  const body = h(`<div class="q2-adv">${editable ? `<div class="q2-tools"><button class="chipb" data-x="paste" ${clip() ? '' : 'disabled'}>Coller</button><button class="chipb" data-x="clear">Effacer</button></div><textarea class="q2-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea><p class="q2-syn"></p>` : '<pre class="q2-code"></pre>'}</div>`);
  const ta = $('.q2-code', body);
  if (editable) ta.value = code; else ta.textContent = code;
  const syn = $('.q2-syn', body);
  const check = () => { if (!syn) return true; const r = PQE.checkSyntax(ta.value); syn.className = 'q2-syn ' + (r.ok ? 'ok' : 'ko'); syn.textContent = r.ok ? '✓ Aucune erreur de syntaxe n’a été détectée.' : '✕ ' + fr(r.msg); return r.ok; };
  if (editable) { ta.addEventListener('input', check); check(); body.addEventListener('click', e => { const x = e.target.closest('[data-x]'); if (!x) return; if (x.dataset.x === 'paste') { ta.value = clip(); check(); this.q2emit('q2.paste', { where: 'adv' }); } else { ta.value = ''; check(); } }); }
  this.dialog(`Éditeur avancé · ${q.name}`, body, [{ t: 'Terminé', pri: true, id: 'ok', fn: b => {
    if (!editable) { this.closeDialog(); return; }
    if (!check()) { shake(b); this.q2emit('q2.try', { kind: 'code', target: q, src: ta.value, syntax: false }); return; }
    if (this.q2emit('q2.try', { kind: 'code', target: q, src: ta.value }) === 'no') { shake(b); return; }
    eng.setCode(q, ta.value); if (eng.value(q) instanceof PQE.MFn) q.load = false; this.q2.selStep = null; this.q2.dirty = true; this.closeDialog(); this.q2render();
    this.q2emit('q2.done', { kind: 'code', target: q, src: ta.value });
  } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2adv', tall: true });
  this.q2emit('q2.adv', { target: q, editable });
};

/* ───────── Ruban : commandes ───────── */
P_.q2cmd = function (k, b) {
  const q2 = this.q2, q = this.q2q();
  if (this.q2emit('q2.cmd', { cmd: k }) === 'no') { shake(b); return; }
  const col = q2.sel[0], T = q ? this.q2table() : null;
  const need = () => { if (!q2.sel.length) { shake(b); this.q2emit('q2.nocol', { cmd: k }); return false; } return true; };
  const view = (key, label) => { q2[key] = !q2[key]; this.q2emit('q2.view', { k: key, on: q2[key] }); this.q2render(); };
  switch (k) {
    case 'apply': this.q2menu(b, [['apply', 'Fermer et appliquer'], ['applyonly', 'Appliquer'], ['close', 'Fermer']], m => { if (this.q2emit(m === 'close' ? 'q2.close' : 'q2.apply', { mode: m, dirty: q2.dirty }) === 'no') shake(b); }); break;
    case 'newsource': this.q2menu(b, [['excel', 'Classeur Excel'], ['csv', 'Texte/CSV'], ['blank', 'Requête vide']], m => { if (m === 'blank') this.q2blank(); else this.q2filePicker(m); }); break;
    case 'enter': this.q2enterData(); break;
    case 'refresh': this.q2menu(b, [['one', 'Actualiser l’aperçu'], ['all', 'Actualiser tout']], m => { if (this.q2emit('q2.refresh', { all: m === 'all' }) === 'no') return; this.engine().touch(); this.q2render(); this.q2flash(m === 'all' ? 'Toutes les requêtes ont été actualisées.' : 'Aperçu actualisé.'); }); break;
    case 'props': if (q) this.q2props(q); break;
    case 'adv': if (q) this.q2adv(q); break;
    case 'manage': if (q) this.q2menu(b, [['del', 'Supprimer'], ['dup', 'Dupliquer'], ['ref', 'Référence']], m => { if (m === 'del') this.q2delQuery(q); else if (m === 'dup') this.q2dupQuery(q); else this.q2refQuery(q); }); break;
    case 'choose': this.q2chooseCols(); break;
    case 'rmcols': if (need()) this.q2menu(b, [['rm', 'Supprimer les colonnes'], ['other', 'Supprimer les autres colonnes']], m => m === 'rm' ? this.q2addStep({ op: 'removeCols', cols: q2.sel.slice() }) : this.q2addStep({ op: 'selectCols', cols: T.cols.map(c => c.n).filter(n => q2.sel.includes(n)) })); break;
    case 'keeprows': this.q2menu(b, [['top', 'Conserver les premières lignes'], ['bottom', 'Conserver les dernières lignes'], ['dups', 'Conserver les doublons'], ['errs', 'Conserver les erreurs']], m => {
      if (m === 'top') this.q2countDialog('keepTop'); else if (m === 'bottom') this.q2countDialog('keepBottom');
      else if (m === 'dups') { if (need()) this.q2addStep({ op: 'keepDups', cols: q2.sel.slice() }); }
      else this.q2addStep({ op: 'keepErrors', cols: q2.sel.length ? q2.sel.slice() : T.cols.map(c => c.n) });
    }); break;
    case 'rmrows': this.q2menu(b, [['top', 'Supprimer les premières lignes'], ['bottom', 'Supprimer les dernières lignes'], ['dups', 'Supprimer les doublons'], ['blank', 'Supprimer les lignes vides'], ['errs', 'Supprimer les erreurs']], m => {
      if (m === 'top') this.q2countDialog('skip'); else if (m === 'bottom') this.q2countDialog('removeBottom');
      else if (m === 'dups') { if (need()) this.q2addStep({ op: 'distinct', cols: q2.sel.slice() }); }
      else if (m === 'blank') this.q2addStep({ op: 'removeBlank' });
      else this.q2addStep({ op: 'removeErrors', cols: q2.sel.length ? q2.sel.slice() : T.cols.map(c => c.n) });
    }); break;
    case 'sortasc': case 'sortdesc': if (need()) this.q2addStep({ op: 'sort', keys: [[col, k === 'sortasc' ? 'asc' : 'desc']] }); break;
    case 'split': if (need()) this.q2menu(b, [['delim', 'Par délimiteur']], () => this.q2splitDialog(col)); break;
    case 'group': this.q2groupDialog(); break;
    case 'type': if (need()) this.q2typeMenu(b); break;
    case 'promote': this.q2menu(b, [['promote', 'Utiliser la première ligne pour les en-têtes']], () => this.q2promote()); break;
    case 'replace': if (need()) this.q2replaceDialog(); break;
    case 'merge': this.q2menu(b, [['merge', 'Fusionner des requêtes'], ['new', 'Fusionner des requêtes comme nouvelle']], m => this.q2mergeDialog(m === 'new')); break;
    case 'append': this.q2menu(b, [['append', 'Ajouter des requêtes'], ['new', 'Ajouter des requêtes comme nouvelle']], m => this.q2appendDialog(m === 'new')); break;
    case 'multi': q2.multi = !q2.multi; this.q2emit('q2.view', { k: 'multi', on: q2.multi }); this.q2render(); break;
    case 'count': this.q2addStep({ op: 'count' }); break;
    case 'rename': if (need()) this.q2renameCol(col); break;
    case 'fill': if (need()) this.q2menu(b, [['down', 'Vers le bas'], ['up', 'Vers le haut']], m => this.q2addStep({ op: 'fill', dir: m, cols: q2.sel.slice() })); break;
    case 'format': case 'aformat': if (need()) this.q2menu(b, Object.entries(PQE.FMT_FN).map(([f, v]) => [f, v[0]]), f => {
      if (k === 'format') this.q2addStep({ op: 'fmt', fn: f, cols: q2.sel.slice() });
      else this.q2addStep({ op: 'fmt', fn: f, cols: [col], as: uniqCol(T, PQE.FMT_FN[f][0]) }, { sel: [uniqCol(T, PQE.FMT_FN[f][0])] });
    }); break;
    case 'extract': case 'aextract': if (need()) this.q2menu(b, [['length', 'Longueur'], ['first', 'Premiers caractères'], ['last', 'Derniers caractères'], ['before', 'Texte avant le délimiteur'], ['after', 'Texte après le délimiteur']], m => this.q2extractDialog(m, col, k === 'aextract')); break;
    case 'custom': this.q2customDialog(); break;
    case 'invoke': this.q2invokeDialog(); break;
    case 'cond': this.q2condDialog(); break;
    case 'index': this.q2menu(b, [['0', 'À partir de 0'], ['1', 'À partir de 1'], ['c', 'Personnalisé…']], m => m === 'c' ? this.q2indexDialog() : this.q2addStep({ op: 'index', col: uniqCol(T, 'Index'), start: +m, incr: 1 }, { sel: [uniqCol(T, 'Index')] })); break;
    case 'dupcol': if (need()) { const as = uniqCol(T, `${col} - Copier`); this.q2addStep({ op: 'dup', col, as }, { sel: [as] }); } break;
    case 'fx': view('fx'); break;
    case 'quality': view('quality'); break;
    case 'dist': view('dist'); break;
    case 'prof': view('prof'); break;
    case 'ws': view('ws'); break;
    case 'deps': this.q2deps(); break;
  }
};
P_.q2flash = function (text) {
  if (!this.q2El) return;
  const f = h(`<div class="q2-flash">${esc(fr(text))}</div>`); this.q2El.appendChild(f);
  requestAnimationFrame(() => f.classList.add('on')); setTimeout(() => { f.classList.remove('on'); setTimeout(() => f.remove(), 300); }, 1600);
};
/* En-têtes : promotion + étape « Type modifié » automatique, comme Power Query */
P_.q2promote = function () {
  this.q2addStep({ op: 'promote' }, { auto: T => T ? { op: 'type', name: 'Type modifié', auto: true, changes: T.cols.map(c => [c.n, PQE.detectType(T.rows.map(r => r[c.n])) === 'any' ? 'text' : PQE.detectType(T.rows.map(r => r[c.n]))]) } : null });
};
P_.q2colMenu = function (c, anchor) {
  const q2 = this.q2, T = this.q2table();
  this.q2emit('q2.menu', { kind: 'col', col: c });
  this.q2menu(anchor, [['rm', 'Supprimer'], ['other', 'Supprimer les autres colonnes'], ['dup', 'Dupliquer la colonne'], '-', ['rmdup', 'Supprimer les doublons'], ['rmerr', 'Supprimer les erreurs'], '-',
    ['type', 'Modifier le type', false, TYPE_ORDER.filter(t => t !== '-').map(t => ['t:' + t, TY[t].nom]).concat([['t:locale', 'Utiliser les paramètres régionaux…']])],
    ['fmt', 'Transformer', false, Object.entries(PQE.FMT_FN).map(([f, v]) => ['f:' + f, v[0]])], ['replace', 'Remplacer les valeurs…'], ['fill', 'Remplir', false, [['fill:down', 'Vers le bas'], ['fill:up', 'Vers le haut']]], '-',
    ['group', 'Regrouper par…'], ['split', 'Fractionner la colonne', false, [['split:delim', 'Par délimiteur…']]], '-', ['rename', 'Renommer…'], ['move', 'Déplacer', false, [['mv:left', 'Gauche'], ['mv:right', 'Droite'], ['mv:first', 'Au début'], ['mv:last', 'À la fin']]]], k => {
    if (k === 'rm') this.q2addStep({ op: 'removeCols', cols: [c] });
    else if (k === 'other') this.q2addStep({ op: 'selectCols', cols: [c] });
    else if (k === 'dup') { const as = uniqCol(T, `${c} - Copier`); this.q2addStep({ op: 'dup', col: c, as }, { sel: [as] }); }
    else if (k === 'rmdup') this.q2addStep({ op: 'distinct', cols: q2.sel.length ? q2.sel.slice() : [c] });
    else if (k === 'rmerr') this.q2addStep({ op: 'removeErrors', cols: [c] });
    else if (k === 't:locale') this.q2localeDialog();
    else if (k.startsWith('t:')) this.q2setType(q2.sel.length ? q2.sel.slice() : [c], k.slice(2));
    else if (k.startsWith('f:')) this.q2addStep({ op: 'fmt', fn: k.slice(2), cols: q2.sel.length ? q2.sel.slice() : [c] });
    else if (k === 'replace') this.q2replaceDialog();
    else if (k.startsWith('fill:')) this.q2addStep({ op: 'fill', dir: k.slice(5), cols: [c] });
    else if (k === 'group') this.q2groupDialog(null, null, null, c);
    else if (k === 'split:delim') this.q2splitDialog(c);
    else if (k === 'rename') this.q2renameCol(c);
    else if (k.startsWith('mv:')) {
      const names = T.cols.map(x => x.n), i = names.indexOf(c); names.splice(i, 1);
      const to = k === 'mv:left' ? Math.max(0, i - 1) : k === 'mv:right' ? Math.min(names.length, i + 1) : k === 'mv:first' ? 0 : names.length;
      names.splice(to, 0, c); this.q2addStep({ op: 'reorder', order: names });
    }
  });
};
P_.q2typeMenu = function (anchor) {
  const q2 = this.q2, T = this.q2table(); if (!T) return;
  const cols = q2.sel.length ? q2.sel.slice() : []; if (!cols.length) return;
  const cur = cols.length === 1 ? (T.cols.find(c => c.n === cols[0]) || {}).t : null;
  this.q2emit('q2.menu', { kind: 'type', cols });
  this.menu(anchor, TYPE_ORDER.map(t => t === '-' ? '-' : [t, TY[t].nom, cur === t, PQ2.tyIcon(t)]).concat(['-', ['locale', 'Utiliser les paramètres régionaux…']]), k => k === 'locale' ? this.q2localeDialog() : this.q2setType(cols, k), { host: this.el });
};
P_.q2setType = function (cols, type, loc) {
  const q = this.q2q(), q2 = this.q2, eng = this.engine();
  if (!q || this.q2legacyGuard(q, 'type')) return;
  if (this.q2emit('q2.try', { kind: 'type', cols, type, loc: loc || null }) === 'no') return;
  const at = this.q2at(), cur = q.steps[at];
  const apply = mode => {
    let step;
    if (mode === 'replace') { step = cur; cur.changes = cur.changes.map(c => cols.includes(c[0]) ? [c[0], type, loc] : c); cols.filter(c => !cur.changes.some(x => x[0] === c)).forEach(c => cur.changes.push([c, type, loc])); }
    else if (mode === 'merge') { step = cur; cols.forEach(c => cur.changes.push([c, type, loc])); }
    else {
      step = { id: uid(), op: 'type', name: uniqStep(q, loc ? 'Type modifié avec paramètres régionaux' : 'Type modifié'), changes: cols.map(c => [c, type, loc]) };
      if (loc) step.loc = loc;
      q.steps.splice(at + 1, 0, step); q2.selStep = at + 1 === q.steps.length - 1 ? null : at + 1;
    }
    eng.touch(); q2.dirty = true; q2.cell = null; this.q2render();
    this.q2emit('q2.done', { kind: 'type', cols, type, loc: loc || null, mode, step });
  };
  if (cur && cur.op === 'type' && cur.changes.some(c => cols.includes(c[0]))) {
    this.dialog('Modifier le type de colonne', h(`<p class="q2-msg">${esc(fr(`Une conversion existe déjà pour cette colonne dans l’étape « ${cur.name} ». Veux-tu remplacer cette conversion, ou ajouter la nouvelle conversion dans une étape séparée ?`))}</p>`), [
      { t: 'Remplacer l’actuel', pri: true, id: 'replace', fn: () => { this.closeDialog(); apply('replace'); } },
      { t: 'Ajouter une nouvelle étape', id: 'newstep', fn: () => { this.closeDialog(); apply('new'); } },
      { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2typeConfirm' });
    this.q2emit('q2.dialog', { kind: 'typeConfirm' });
    return;
  }
  const canMerge = cur && cur.op === 'type' && at === q.steps.length - 1 && !loc && !cur.loc && !cur.changes.some(c => c[2]) && !cur.auto;
  if (at < q.steps.length - 1) {
    this.dialog('Insérer une étape', h(`<p class="q2-msg">${esc(fr('Voulez-vous vraiment insérer une étape ? L’insertion d’une étape intermédiaire peut entraîner l’échec des étapes suivantes.'))}</p>`),
      [{ t: 'Insérer', pri: true, id: 'insert', fn: () => { this.closeDialog(); apply('new'); } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2insert' });
    return;
  }
  apply(canMerge ? 'merge' : 'new');
};
P_.q2localeDialog = function () {
  const q2 = this.q2; let type = 'date', loc = 'fr-FR';
  const body = h(`<div class="q2-form"><p class="q2-msg">${esc(fr(`Modifie le type de ${q2.sel.length > 1 ? 'ces colonnes' : `la colonne ${q2.sel[0]}`} en interprétant les valeurs selon les conventions d’un pays.`))}</p>
    <label>Type de données<button class="sel-box" data-x="t"></button></label><label>Paramètres régionaux<button class="sel-box" data-x="l"></button></label></div>`);
  const draw = () => { $('[data-x="t"]', body).textContent = TY[type].nom; $('[data-x="l"]', body).textContent = PQE.LOCALES[loc]; };
  body.addEventListener('click', e => {
    const x = e.target.closest('[data-x]'); if (!x) return; e.preventDefault();
    if (x.dataset.x === 't') this.menu(x, ['dec', 'fixed', 'int', 'pct', 'date', 'datetime', 'time', 'text', 'bool'].map(k => [k, TY[k].nom, k === type]), k => { type = k; draw(); }, { host: this.el });
    else this.menu(x, Object.entries(PQE.LOCALES).map(([k, n]) => [k, n, k === loc]), k => { loc = k; draw(); this.q2emit('q2.locale', { loc }); }, { host: this.el });
  });
  this.dialog('Modifier le type avec les paramètres régionaux', body, [{ t: 'OK', pri: true, id: 'ok', fn: () => { this.closeDialog(); this.q2setType(q2.sel.slice(), type, loc); } }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2locale' });
  this.q2emit('q2.dialog', { kind: 'locale' });
  draw();
};
P_.q2renameCol = function (c) {
  const T = this.q2table();
  const body = h(`<div class="q2-form"><label>Nouveau nom de la colonne « ${esc(c)} »<input value="${esc(c)}" spellcheck="false" autocapitalize="off" autocomplete="off"></label></div>`);
  const inp = $('input', body);
  const ok = b => {
    const n = inp.value.trim(); if (!n) { shake(inp); return; }
    if (n === c) { this.closeDialog(); return; }
    if (T.cols.some(x => x.n === n)) { shake(inp); this.q2emit('q2.try', { kind: 'renameCol', col: c, name: n, dup: true }); return; }
    const q = this.q2q(), at = this.q2at(), cur = q.steps[at];
    /* Refus : la boîte reste ouverte pour corriger le nom */
    if (cur && cur.op === 'rename' && at === q.steps.length - 1 && !cur.pairs.some(p => p[1] === c)) {
      if (this.q2emit('q2.try', { kind: 'add', op: 'rename', step: { op: 'rename', pairs: cur.pairs.concat([[c, n]]) }, merge: true, col: c, name: n }) === 'no') { shake(inp); return; }
      this.closeDialog();
      cur.pairs.push([c, n]); this.engine().touch(); this.q2.sel = [n]; this.q2.dirty = true; this.q2render();
      this.q2emit('q2.done', { kind: 'add', op: 'rename', step: cur, merge: true, col: c, name: n });
    } else {
      const dlg = this.dlgKind;
      if (this.q2addStep({ op: 'rename', pairs: [[c, n]] }, { sel: [n] }) === false) { shake(inp); return; }
      if (this.dlgKind === dlg) this.closeDialog();
    }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
  this.dialog('Renommer la colonne', body, [{ t: 'OK', pri: true, id: 'ok', fn: ok }, { t: 'Annuler', id: 'cancel', fn: () => this.closeDialog() }], { kind: 'q2renameCol' });
  this.q2emit('q2.dialog', { kind: 'renameCol', col: c });
  setTimeout(() => { inp.focus(); inp.select(); }, 60);
};
})();
